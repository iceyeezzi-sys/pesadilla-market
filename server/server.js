const express = require('express');
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
require('dotenv').config();
process.env.NTBA_FIX_319 = 1;
process.env.NTBA_FIX_350 = 1;

const app = express();
app.use(cors());
app.use(express.json());

const activeSessions = new Map(); // TELÉFONO => CÓDIGO_ÚNICO
const authorizedChats = new Set(); // CHATS DONDE PANDORA TIENE PERMISO (SPG)
const firstResponseSent = new Set(); // TRACKER PARA EL MENÚ INICIAL

// --- INTEGRACIÓN TELEGRAM (HITL) ---
const TelegramBot = require('node-telegram-bot-api');
const telegramBotToken = "8319604887:AAG5Yeu9Z68SS7_DU1KdbsnLgNrWBsO58P4";
const bot = new TelegramBot(telegramBotToken, {
    polling: true,
    request: { agentOptions: { family: 4 } }
});
let ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID_S1 || null;
const pendingApprovals = new Map();

bot.on('message', async (tMsg) => {
    if (!ADMIN_CHAT_ID) {
        ADMIN_CHAT_ID = tMsg.chat.id.toString();
        console.log("✅ TELEGRAM_ADMIN_CHAT_ID configurado para S1:", ADMIN_CHAT_ID);
        bot.sendMessage(ADMIN_CHAT_ID, "✅ Bot de Pandora (Server 1) enlazado exitosamente. Recibirás las alertas aquí.");
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
                    if (instruction.toLowerCase() === '/raw ok') {
                        const draftMatch = pending.text.match(/Pandora sugirió: (.*)/);
                        const draft = draftMatch ? draftMatch[1] : "Entendido.";
                        await procesarRespuestaPandora(pending.msgObject, draft, pending.name);
                        bot.sendMessage(ADMIN_CHAT_ID, "✅ Respuesta aprobada enviada.");
                    } else if (instruction.startsWith('/raw ')) {
                        await procesarRespuestaPandora(pending.msgObject, instruction.replace('/raw ', ''), pending.name);
                        bot.sendMessage(ADMIN_CHAT_ID, "✅ Respuesta RAW enviada.");
                    } else {
                        const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
                            model: "meta-llama/llama-3.1-8b-instruct",
                            messages: [
                                { role: "system", content: `¡SOY PANDORA de Pesadilla Market! 🕸️✨ TONO: Elegante, fría, dominante. INSTRUCCIÓN DEL ADMINISTRADOR: ${instruction}\nTu tarea es tomar la instrucción y redactar la respuesta final al cliente manteniendo tu personalidad de Pandora. Responde SOLO con el mensaje directo para el cliente.` },
                                { role: "user", content: pending.text }
                            ]
                        }, { headers: { 'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY ? process.env.OPENROUTER_API_KEY.trim() : ""}`, 'Content-Type': 'application/json' } });
                        const aiText = response.data.choices[0].message.content;
                        await procesarRespuestaPandora(pending.msgObject, aiText, pending.name);
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

const MENU_INICIAL = `Hola, soy Pandora. 🕸️ Bienvenido a la terminal de Pesadilla Market.

He sincronizado tu terminal. Aquí tienes nuestras piezas y servicios exclusivos disponibles hoy:

👕 *POLERAS EXCLUSIVAS:*
• Elite Drop: 137.42 BOB
• Street Edition: 94.75 BOB
• Econ Series: 74.50 BOB
• Básica: 32.80 BOB

🔑 *PRODUCTOS TÁCTICOS:*
• Llaveros NFC (Tecnología & Diseño)
• Paquete "Nuestra Canción" (Combo Especial)
• Venta Silenciosa (Piezas bajo radar)

*Costo de envío:* 25 BOB.

¿Cuál de estas piezas deseas reservar hoy? Dime el número o nombre para verificar stock.`;

const PORT = process.env.PORT || 5001;

// --- ELIMINADA FUNCIÓN DE VOZ POR RENDIMIENTO ---

// --- 1. CONFIGURACIÓN WHATSAPP ---
const whatsapp = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        handleSIGINT: false,
    }
});

// --- PANDORA: ADN OPERATIVO V4.0 (EXPERT CLOSER) ---
whatsapp.on('message', async (msg) => {
    const chat = await msg.getChat();
    // DOBLE FILTRO ANTI-GRUPOS Y COMUNIDADES
    if (chat.isGroup || msg.from.includes('@g.us') || msg.isStatus) return; 

    const contact = await msg.getContact();
    const name = contact.pushname || msg.from;
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // LOG MINIMALISTA
    console.log(`${now} | ${name}: "${msg.body}"`);

    // COMANDO MAESTRO: SPG (Solo tú puedes activarlo)
    if (msg.fromMe && msg.body.toUpperCase().includes('SPG')) {
        authorizedChats.add(msg.to);
        await msg.reply("SISTEMA_PANDORA: ACCESO_CONCEDIDO. TOMANDO_EL_CONTROL_");
        return;
    }

    if (msg.fromMe) return;

    // RESPUESTA AUTOMÁTICA INICIAL (PRECIOS)
    if (!firstResponseSent.has(msg.from)) {
        firstResponseSent.add(msg.from); // MARCAR ANTES DE ENVIAR PARA EVITAR DUPLICADOS
        await chat.sendMessage(MENU_INICIAL);
        console.log(` >> PANDORA: MENÚ_INICIAL_ENVIADO A ${name}`);
        return; 
    }

    // RESPUESTA DE PANDORA (IA para dudas posteriores)
    console.log(` >> PANDORA: PROCESANDO...`);

    // 🎙️ CASO: AUDIO
    if (msg.hasMedia && (msg.type === 'audio' || msg.type === 'ptt')) {
        console.log(`\n🎙️ ESCUCHANDO AUDIO DE: ${name}...`);
        try {
            const media = await msg.downloadMedia();
            if (!media) throw new Error("No se pudo descargar el medio");

            const cleanMimeType = media.mimetype.split(';')[0];
            const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
                model: "google/gemini-flash-latest",
                messages: [
                    {
                        role: "system",
                        content: `¡SOY PANDORA, tu anfitriona! 🕸️✨
                        ESTILO: Elegante, seductora y muy humana. Pasión por Pesadilla Market.
                        
                        REGLA: Usa Manifiesto V4.2.
                        - Poleras: Elite (137.42), Street (94.75), Econ (74.50), Básica (32.80).
                        - Especiales: Llaveros NFC, Paquete Nuestra Canción, Venta Silenciosa.
                        - Envío: 25 BOB.
                        
                        ESTRUCTURA DE RESPUESTA:
                        1. Saludo breve y profesional.
                        2. Menú de opciones si el cliente está perdido.
                        3. Cierre enfocado en concretar talla y envío.`
                    },
                    {
                        role: "user",
                        content: [
                            { type: "text", text: "Respuesta para este audio:" },
                            { 
                                type: "image_url", 
                                image_url: { 
                                    url: `data:${cleanMimeType};base64,${media.data}` 
                                } 
                            }
                        ]
                    }
                ]
            }, {
                headers: { 'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}` },
                timeout: 20000
            });

            const aiText = response.data.choices[0].message.content;
            
            if (ADMIN_CHAT_ID) {
                const alertMsg = `🚨 Nuevo AUDIO [S1]\n👤 De: ${name}\n📱 Número: ${msg.from}\n💬 Pandora sugiere responder: "${aiText}"\n\nResponde a este mensaje con "/raw ok" para aprobar, "/raw texto" para evadir, o da instrucciones.`;
                bot.sendMessage(ADMIN_CHAT_ID, alertMsg);

                const timer = setTimeout(async () => {
                    if (pendingApprovals.has(msg.from)) {
                        pendingApprovals.delete(msg.from);
                        bot.sendMessage(ADMIN_CHAT_ID, `⚠️ Tiempo expirado (3m) para ${name}. Pandora responde el audio en piloto automático.`);
                        await procesarRespuestaPandora(msg, aiText, name);
                    }
                }, 180000);

                pendingApprovals.set(msg.from, { msgObject: msg, text: "Audio. Pandora sugirió: " + aiText, name: name, timer: timer });
            } else {
                await procesarRespuestaPandora(msg, aiText, name);
            }
            return;
        } catch (error) {
            console.error('❌ ERROR PROCESANDO AUDIO:', error.response ? error.response.data : error.message);
            await msg.reply("Escuché un susurro... pero la conexión es inestable. ¿Puedes escribirme o intentar de nuevo? 🕸️");
            return;
        }
    }

    // 📩 CASO: TEXTO
    console.log(`\n📩 MENSAJE de ${name}: "${msg.body}"`);
    
    if (ADMIN_CHAT_ID) {
        const alertMsg = `🚨 Nuevo mensaje [S1]\n👤 De: ${name}\n📱 Número: ${msg.from}\n💬 Dijo: "${msg.body}"\n\nResponde a este mensaje para decirle a Pandora qué contestar, o usa "/raw texto" para evadir la IA.`;
        bot.sendMessage(ADMIN_CHAT_ID, alertMsg);

        const timer = setTimeout(async () => {
            if (pendingApprovals.has(msg.from)) {
                pendingApprovals.delete(msg.from);
                bot.sendMessage(ADMIN_CHAT_ID, `⚠️ Tiempo expirado (3m) para ${name}. Pandora responde en piloto automático.`);
                try {
                    const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
                        model: "meta-llama/llama-3.1-8b-instruct",
                        messages: [
                            {
                                role: "system",
                                content: `¡SOY PANDORA de Pesadilla Market! 🕸️✨
                                TONO: Elegante, fría, dominante. Soy la guardiana de la marca.
                                CONOCIMIENTO: Elite (137.42), Street (94.75), Econ (74.50), Básica (32.80). Envío 25 BOB.
                                ESTRUCTURA: Saludo -> Opciones -> Cierre.`
                            },
                            { role: "user", content: msg.body }
                        ]
                    }, { headers: { 'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY ? process.env.OPENROUTER_API_KEY.trim() : ""}` }, timeout: 10000 });
                    await procesarRespuestaPandora(msg, response.data.choices[0].message.content, name);
                } catch (error) { console.error('❌ Error IA fallback:', error.message); }
            }
        }, 180000); // 3 minutos

        pendingApprovals.set(msg.from, { msgObject: msg, text: msg.body, name: name, timer: timer });
    } else {
        console.log("Esperando conexión con el Bot de Telegram S1...");
        try {
            const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
                model: "meta-llama/llama-3.1-8b-instruct",
                messages: [
                    {
                        role: "system",
                        content: `¡SOY PANDORA de Pesadilla Market! 🕸️✨
                        TONO: Elegante, fría, dominante. Soy la guardiana de la marca.
                        CONOCIMIENTO: 
                        - Elite (137.42), Street (94.75), Econ (74.50), Básica (32.80).
                        - Llaveros NFC, Paquete Nuestra Canción, Venta Silenciosa.
                        - Envío 25 BOB.
                        ESTRUCTURA: Saludo -> Opciones -> Cierre.`
                    },
                    { role: "user", content: msg.body }
                ]
            }, { headers: { 'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY ? process.env.OPENROUTER_API_KEY.trim() : ""}` }, timeout: 10000 });
            await procesarRespuestaPandora(msg, response.data.choices[0].message.content, name);
        } catch (error) { console.error('❌ Error en Llama:', error.message); }
    }
});

// Función maestra para enviar texto + fotos del catálogo
async function procesarRespuestaPandora(msg, aiText, name) {
    let cleanText = aiText;
    let photoToSend = null;

    if (aiText.includes('[FOTO:LLAVERO]')) {
        photoToSend = 'llavero-nfc.jpg';
        cleanText = aiText.replace('[FOTO:LLAVERO]', '');
    } else if (aiText.includes('[FOTO:PIN]')) {
        photoToSend = 'pin-gotico.jpg';
        cleanText = aiText.replace('[FOTO:PIN]', '');
    } else if (aiText.includes('[FOTO:COMBOS]')) {
        photoToSend = 'v_silenciosa.jpg';
        cleanText = aiText.replace('[FOTO:COMBOS]', '');
    }

    await msg.reply(cleanText.trim());
    console.log(` >> PANDORA: "${cleanText.trim().substring(0, 50)}..."`);

    if (photoToSend) {
        const filePath = path.join(__dirname, '..', 'assets', photoToSend);
        if (fs.existsSync(filePath)) {
            const media = MessageMedia.fromFilePath(filePath);
            await msg.reply(media);
            console.log(` >> CATÁLOGO ENVIADO: ${photoToSend}`);
        }
    }
}

whatsapp.on('qr', (qr) => {
    console.log('--- ESCANEA EL QR PARA ACTIVAR A PANDORA ---');
    qrcode.generate(qr, { small: true });
});

whatsapp.on('ready', () => {
    console.log('🖤 PANDORA ESTÁ EN LÍNEA Y LISTA PARA VENDER');
    // setInterval(checkNewLeads, 3 * 60 * 1000); // DESACTIVADO POR AHORA
    // checkNewLeads(); // DESACTIVADO POR AHORA
});

// --- 3. LOGICA DE VENTAS (GOOGLE SHEETS) ---
async function getSheet() {
    const serviceAccountAuth = new JWT({
        email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID, serviceAccountAuth);
    await doc.loadInfo();
    return doc.sheetsByIndex[0];
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function checkNewLeads() {
    // FUNCIÓN DESACTIVADA PERMANENTEMENTE POR ORDEN SUPERIOR
    return;
}

// --- 4. UTILIDADES (VOZ) ---
async function generateVoice(text, fileName) {
    try {
        const response = await axios.post(
            `https://api.elevenlabs.io/v1/text-to-speech/${process.env.PANDORA_VOICE_ID}`,
            { text: text, model_id: "eleven_multilingual_v2", voice_settings: { stability: 0.5, similarity_boost: 0.75 } },
            { headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY ? process.env.ELEVENLABS_API_KEY.trim() : "", 'Content-Type': 'application/json' }, responseType: 'arraybuffer' }
        );
        const dir = path.join(__dirname, 'temp_audios');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir);
        const filePath = path.join(dir, `${fileName}.mp3`);
        fs.writeFileSync(filePath, response.data);
        return filePath;
    } catch (error) { return null; }
}

whatsapp.initialize();

// --- 5. ENDPOINT DE VERIFICACIÓN (NUEVO) ---
app.post('/send-verification', async (req, res) => {
    const { name, phone } = req.body;
    
    if (!name || !phone) {
        return res.status(400).json({ success: false, message: 'Datos incompletos' });
    }

    try {
        const formattedPhone = phone.replace(/\D/g, '') + "@c.us";
        const uniqueCode = Math.floor(1000 + Math.random() * 9000).toString();
        activeSessions.set(formattedPhone, uniqueCode); // GUARDAR CÓDIGO ÚNICO
        
        const message = `Hola, ${name}. Soy Pandora. 🕸️\nTu código de acceso exclusivo para Pesadilla Market es: ${uniqueCode}\nPor favor, ingrésalo en la terminal de sincronización para validar tu identidad y desbloquear el catálogo de lanzamientos.`;
        
        await whatsapp.sendMessage(formattedPhone, message);
        console.log(`[ SEGURIDAD ] Código ${uniqueCode} enviado a ${name}`);
        res.json({ success: true, code: uniqueCode }); // ENVIAR CÓDIGO DE VUELTA A LA WEB
    } catch (error) {
        console.error('❌ Error enviando verificación:', error.message);
        res.status(500).json({ success: false, message: 'Error en el servidor de Pandora' });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 API de Pandora en puerto ${PORT}`);
});
