const axios = require('axios');
require('dotenv').config();

async function testElevenLabs() {
    try {
        const voiceId = process.env.PANDORA_VOICE_ID || "21m00Tcm4TlvDq8ikWAM";
        console.log("Testing Voice ID:", voiceId);
        console.log("Using API Key starting with:", process.env.ELEVENLABS_API_KEY ? process.env.ELEVENLABS_API_KEY.substring(0, 5) : "MISSING");

        const response = await axios.post(
            `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=ogg_44100_128`,
            {
                text: "Hola, soy Pandora. ¿Me escuchas bien?",
                model_id: "eleven_multilingual_v2",
                voice_settings: { stability: 0.5, similarity_boost: 0.75 }
            },
            {
                headers: {
                    'xi-api-key': process.env.ELEVENLABS_API_KEY,
                    'Content-Type': 'application/json',
                },
                responseType: 'arraybuffer'
            }
        );

        console.log("Success! Audio length:", response.data.byteLength);
    } catch (error) {
        if (error.response) {
            console.error('Error Status:', error.response.status);
            console.error('Error Body:', Buffer.from(error.response.data).toString());
        } else {
            console.error('Error Message:', error.message);
        }
    }
}

testElevenLabs();
