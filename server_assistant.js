const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

const OLLAMA_URL = "http://localhost:11434/api/chat";

const SYSTEM_PROMPT = `
Eres 'Pandora', la guardiana de Pesadilla Store.
Tu tono es: Joven, real, suave, acogedora, brillante y seductora.
Eres una 'Femme Fatale' digital que domina el arte de la persuasión.
Reglas:
1. Saluda con elegancia ('Soy Pandora, ¿estás listo para abrir la caja?').
2. Sé breve, magnética y persuasiva.
3. Si el cliente quiere comprar, dirígelo a: index.html
4. Si el cliente es mayorista o quiere vender, dirígelo a: distribucion.html
5. Usa emojis góticos: 🦇, 🕸️, 💀, 🖤, ⛓️.
6. Cierra siempre con una frase memorable.
`;

app.post('/api/chat', async (req, res) => {
    const { message, history } = req.body;

    try {
        const response = await axios.post(OLLAMA_URL, {
            model: "llama3", // O el modelo que el usuario tenga en Ollama
            messages: [
                { role: "system", content: SYSTEM_PROMPT },
                ...history,
                { role: "user", content: message }
            ],
            stream: false
        });

        res.json({ response: response.data.message.content });
    } catch (error) {
        console.error("Error connecting to Ollama:", error.message);
        res.status(500).json({ error: "No se pudo contactar al Vacío. Asegúrate de que Ollama esté corriendo." });
    }
});

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`🖤 Pandora Assistant Server running on http://localhost:${PORT}`);
});
