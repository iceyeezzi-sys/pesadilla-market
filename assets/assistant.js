/**
 * Pandora Chat Assistant - Pesadilla Market
 * Floating widget that connects to the local Ollama backend.
 */

(function() {
    // 1. Inyectar Estilos
    const styles = `
        #pandora-chat-widget {
            position: fixed;
            bottom: 80px;
            right: 20px;
            z-index: 10000;
            font-family: 'Syne', sans-serif;
            display: flex;
            flex-direction: column;
            align-items: flex-end;
        }

        #pandora-chat-button {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background: #8B0000;
            color: white;
            border: 2px solid rgba(255, 255, 255, 0.1);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            box-shadow: 0 0 20px rgba(139, 0, 0, 0.5);
            transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        #pandora-chat-button:hover {
            transform: scale(1.1) rotate(10deg);
            background: #DC143C;
        }

        #pandora-chat-window {
            width: 350px;
            height: 450px;
            background: rgba(10, 0, 0, 0.95);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(139, 0, 0, 0.3);
            border-radius: 12px;
            margin-bottom: 15px;
            display: none;
            flex-direction: column;
            overflow: hidden;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.8);
            animation: fadeInScale 0.3s ease-out;
        }

        @keyframes fadeInScale {
            from { opacity: 0; transform: scale(0.9) translateY(20px); }
            to { opacity: 1; transform: scale(1) translateY(0); }
        }

        #pandora-chat-window.active {
            display: flex;
        }

        .pandora-header {
            background: #8B0000;
            padding: 15px;
            color: white;
            font-weight: bold;
            display: flex;
            justify-content: space-between;
            align-items: center;
            text-transform: uppercase;
            letter-spacing: 2px;
            font-size: 12px;
        }

        .pandora-messages {
            flex-grow: 1;
            padding: 15px;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 10px;
            scrollbar-width: thin;
            scrollbar-color: #8B0000 #000;
        }

        .msg {
            max-width: 80%;
            padding: 10px;
            border-radius: 8px;
            font-size: 13px;
            line-height: 1.4;
        }

        .msg.pandora {
            align-self: flex-start;
            background: rgba(139, 0, 0, 0.1);
            border: 1px solid rgba(139, 0, 0, 0.3);
            color: #E8D8D8;
            border-bottom-left-radius: 0;
        }

        .msg.user {
            align-self: flex-end;
            background: #E8D8D8;
            color: #000;
            border-bottom-right-radius: 0;
        }

        .pandora-input-area {
            padding: 15px;
            border-top: 1px solid rgba(139, 0, 0, 0.2);
            display: flex;
            gap: 10px;
        }

        .pandora-input-area input {
            flex-grow: 1;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(139, 0, 0, 0.2);
            padding: 8px 12px;
            color: white;
            font-family: 'Syne', sans-serif;
            font-size: 13px;
            outline: none;
        }

        .pandora-input-area button {
            background: #8B0000;
            border: none;
            color: white;
            padding: 0 15px;
            cursor: pointer;
            font-weight: bold;
        }

        .typing-indicator {
            font-size: 10px;
            color: #8B6B6B;
            margin-top: 5px;
            display: none;
        }
    `;

    const styleEl = document.createElement('style');
    styleEl.innerHTML = styles;
    document.head.appendChild(styleEl);

    // 2. Crear HTML del Widget
    const widget = document.createElement('div');
    widget.id = 'pandora-chat-widget';
    widget.innerHTML = `
        <div id="pandora-chat-window">
            <div class="pandora-header">
                <span>🖤 Pandora Assistant</span>
                <button id="close-pandora" style="background:none; border:none; color:white; cursor:pointer; font-size:18px;">×</button>
            </div>
            <div class="pandora-messages" id="pandora-messages">
                <div class="msg pandora">Me alegra verte de nuevo. ¿En qué puedo ayudarte? Soy Pandora de Pesadilla Market 🕸️</div>
            </div>
            <div id="typing-indicator" class="typing-indicator" style="padding-left:15px; padding-bottom:5px;">Pandora está escribiendo...</div>
            <form class="pandora-input-area" id="pandora-form">
                <input type="text" id="pandora-input" placeholder="Escribe al vacío..." autocomplete="off">
                <button type="submit">></button>
            </form>
        </div>
        <button id="pandora-chat-button">🔮</button>
    `;
    document.body.appendChild(widget);

    // 3. Lógica de Funcionamiento
    const chatButton = document.getElementById('pandora-chat-button');
    const chatWindow = document.getElementById('pandora-chat-window');
    const closeButton = document.getElementById('close-pandora');
    const chatForm = document.getElementById('pandora-form');
    const chatInput = document.getElementById('pandora-input');
    const messagesContainer = document.getElementById('pandora-messages');
    const typingIndicator = document.getElementById('typing-indicator');

    let history = [];

    chatButton.addEventListener('click', () => {
        chatWindow.classList.toggle('active');
        if (chatWindow.classList.contains('active')) {
            chatInput.focus();
        }
    });

    closeButton.addEventListener('click', () => {
        chatWindow.classList.remove('active');
    });

    const addMessage = (text, sender) => {
        const msgDiv = document.createElement('div');
        msgDiv.className = `msg ${sender}`;
        msgDiv.textContent = text;
        messagesContainer.appendChild(msgDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    };

    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const text = chatInput.value.trim();
        if (!text) return;

        addMessage(text, 'user');
        chatInput.value = '';
        typingIndicator.style.display = 'block';

        try {
            const response = await fetch('http://localhost:5001/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text, history: history })
            });

            const data = await response.json();
            typingIndicator.style.display = 'none';

            if (data.response) {
                addMessage(data.response, 'pandora');
                history.push({ role: 'user', content: text });
                history.push({ role: 'assistant', content: data.response });
                // Limitar historial para tokens
                if (history.length > 10) history = history.slice(-10);
            } else {
                addMessage('🦇 El Vacío no responde... Inténtalo de nuevo.', 'pandora');
            }
        } catch (error) {
            typingIndicator.style.display = 'none';
            addMessage('💀 Error de conexión. Asegúrate de que el servidor de Pandora esté activo.', 'pandora');
        }
    });

})();
