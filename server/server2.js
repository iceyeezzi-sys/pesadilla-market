require('dotenv').config();
process.env.NTBA_FIX_319 = 1;
process.env.NTBA_FIX_350 = 1;
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// --- CONFIGURACIÓN DEL SERVIDOR 2 ---
const app = express();
app.use(cors());
app.use(express.json());

const activeSessions = new Map(); 
const authorizedChats = new Set();
const firstResponseSent = new Set();

// --- INTEGRACIÓN TELEGRAM (HITL) ---
const TelegramBot = require('node-telegram-bot-api');
const telegramBotToken = "8710211274:AAHoVAwsoUzlTjme6KXb_Cw0rKapx77iYuQ";
const bot = new TelegramBot(telegramBotToken, {
    polling: true,
    request: { agentOptions: { family: 4 } }
});
let ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID || null;
const pendingApprovals = new Map();

bot.on('message', async (tMsg) => {
    if (!ADMIN_CHAT_ID) {
        ADMIN_CHAT_ID = tMsg.chat.id.toString();
        console.log("✅ TELEGRAM_ADMIN_CHAT_ID configurado para S2:", ADMIN_CHAT_ID);
        bot.sendMessage(ADMIN_CHAT_ID, "✅ Bot de Pandora (Server 2) enlazado exitosamente. Recibirás las alertas aquí.");
        return;
    }
    if (tMsg.chat.id.toString() !== ADMIN_CHAT_ID) return;
    if (tMsg.reply_to_message && tMsg.reply_to_message.text) {
        const lines = tMsg.reply_to_message.text.split('\n');
        const numberLine = lines.find(l => l.startsWith('📱 Número: '));
        if (numberLine) {
            const waNumber = numberLine.replace('📱 Número: ', '').trim();
            const pending = pendingApprovals.get(waNumber);
            if (pending) {
                clearTimeout(pending.timer);
                bot.sendMessage(ADMIN_CHAT_ID, "⏳ Procesando instrucción con Pandora...");
                try {
                    const instruction = tMsg.text;
                    if (instruction.startsWith('/raw ')) {
                        await pending.msgObject.reply(instruction.replace('/raw ', ''));
                        bot.sendMessage(ADMIN_CHAT_ID, "✅ Respuesta RAW enviada.");
                    } else {
                        const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
                            model: "google/gemini-flash-latest",
                            messages: [
                                { role: "system", content: `¡SOY PANDORA de Pesadilla Market! 🕸️✨ TONO: Elegante, fría, dominante. INSTRUCCIÓN DEL ADMINISTRADOR: ${instruction}\nTu tarea es tomar la instrucción y redactar la respuesta final al cliente manteniendo tu personalidad de Pandora. Responde SOLO con el mensaje directo para el cliente.` },
                                { role: "user", content: pending.text }
                            ]
                        }, { headers: { 'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`, 'Content-Type': 'application/json' } });
                        const aiText = response.data.choices[0].message.content;
                        await pending.msgObject.reply(aiText);
                        bot.sendMessage(ADMIN_CHAT_ID, `✅ Respuesta enviada:\n\n${aiText}`);
                    }
                    pendingApprovals.delete(waNumber);
                } catch (e) {
                    bot.sendMessage(ADMIN_CHAT_ID, "❌ Error procesando la IA.");
                }
            } else {
                bot.sendMessage(ADMIN_CHAT_ID, "⚠️ Mensaje expirado o ya respondido automáticamente.");
            }
        }
    }
});

const PORT = 5005; // PUERTO TOTALMENTE DIFERENTE AL PRIMER SERVER

const MENU_INICIAL = `Hola, soy Pandora (Terminal 2). 🕸️ Bienvenido a Pesadilla Market.

He sincronizado tu terminal. Aquí tienes nuestras piezas y servicios exclusivos:

👕 *POLERAS:*
• Elite Drop: 137.42 BOB
• Street Edition: 94.75 BOB
• Econ Series: 74.50 BOB
• Básica: 32.80 BOB

🔑 *TÁCTICOS:*
• Llaveros NFC
• Paquete "Nuestra Canción"
• Venta Silenciosa

*Envío:* 25 BOB.

¿Cuál de estas piezas deseas reservar hoy?`;

// --- 1. CONFIGURACIÓN WHATSAPP (CLIENTE 2) ---
const whatsapp = new Client({
    authStrategy: new LocalAuth({ clientId: "client-two" }), // SESIÓN INDEPENDIENTE
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        handleSIGINT: false,
    }
});

whatsapp.on('qr', (qr) => {
    console.log('🔗 ESCANEA ESTE QR PARA EL SEGUNDO NÚMERO:');
    qrcode.generate(qr, { small: true });
});

whatsapp.on('ready', () => {
    console.log('🖤 PANDORA (SERVER 2) EN LÍNEA');
});

whatsapp.on('message', async (msg) => {
    const chat = await msg.getChat();
    if (chat.isGroup || msg.from.includes('@g.us') || msg.isStatus) return;

    const contact = await msg.getContact();
    const name = contact.pushname || msg.from;
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    console.log(`${now} | [S2] ${name}: "${msg.body}"`);

    if (msg.fromMe && msg.body.toUpperCase().includes('SPG')) {
        authorizedChats.add(msg.to);
        await msg.reply("SISTEMA_PANDORA_2: ACCESO_CONCEDIDO_");
        return;
    }

    if (msg.fromMe) return;

    // MENÚ INICIAL AUTOMÁTICO
    if (!firstResponseSent.has(msg.from)) {
        firstResponseSent.add(msg.from);
        await chat.sendMessage(MENU_INICIAL);
        return;
    }

    // LÓGICA DE APROBACIÓN POR TELEGRAM O PILOTO AUTOMÁTICO
    if (ADMIN_CHAT_ID) {
        const alertMsg = `🚨 Nuevo mensaje [S2]\n👤 De: ${name}\n📱 Número: ${msg.from}\n💬 Dijo: "${msg.body}"\n\nResponde a este mensaje para decirle a Pandora qué contestar, o usa "/raw texto" para evadir la IA.`;
        bot.sendMessage(ADMIN_CHAT_ID, alertMsg);

        const timer = setTimeout(async () => {
            if (pendingApprovals.has(msg.from)) {
                pendingApprovals.delete(msg.from);
                bot.sendMessage(ADMIN_CHAT_ID, `⚠️ Tiempo expirado (3m) para ${name}. Pandora responde en piloto automático.`);
                try {
                    const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
                        model: "google/gemini-flash-latest",
                        messages: [
                            { role: "system", content: `¡SOY PANDORA de Pesadilla Market! 🕸️✨ TONO: Elegante, fría, dominante. CONOCIMIENTO: Elite (137.42), Street (94.75), Econ (74.50), Básica (32.80). Envío 25 BOB. ESTRUCTURA: Saludo -> Opciones -> Cierre.` },
                            { role: "user", content: msg.body }
                        ]
                    }, { headers: { 'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`, 'Content-Type': 'application/json' } });
                    await msg.reply(response.data.choices[0].message.content);
                } catch (error) { console.error('❌ Error IA fallback:', error.message); }
            }
        }, 180000); // 3 minutos

        pendingApprovals.set(msg.from, { msgObject: msg, text: msg.body, name: name, timer: timer });
    } else {
        console.log("Esperando conexión con el Bot de Telegram...");
        try {
            const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
                model: "google/gemini-flash-latest",
                messages: [
                    {
                        role: "system",
                        content: `¡SOY PANDORA de Pesadilla Market! 🕸️✨
                        TONO: Elegante, fría, dominante.
                        CONOCIMIENTO: Elite (137.42), Street (94.75), Econ (74.50), Básica (32.80). Envío 25 BOB.
                        ESTRUCTURA: Saludo -> Opciones -> Cierre.`
                    },
                    { role: "user", content: msg.body }
                ]
            }, {
                headers: { 'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`, 'Content-Type': 'application/json' }
            });

            const aiText = response.data.choices[0].message.content;
            await msg.reply(aiText);
        } catch (error) {
            console.error('❌ Error IA Server 2:', error.message);
        }
    }
});

// --- API PARA VERIFICACIÓN DESDE WEB ---
app.post('/send-verification', async (req, res) => {
    const { name, phone } = req.body;
    try {
        const formattedPhone = phone.replace(/\D/g, '') + "@c.us";
        const uniqueCode = Math.floor(1000 + Math.random() * 9000).toString();
        activeSessions.set(formattedPhone, uniqueCode);
        
        const message = `Hola, ${name}. Soy Pandora. 🕸️\nCódigo de acceso exclusivo: ${uniqueCode}\nIngrésalo en la terminal de Pesadilla Market.`;
        await whatsapp.sendMessage(formattedPhone, message);
        res.json({ success: true, code: uniqueCode });
    } catch (error) {
        res.status(500).json({ success: false });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor 2 de Pandora en puerto ${PORT}`);
});

whatsapp.initialize();
