const TelegramBot = require('node-telegram-bot-api');
const { GoogleGenAI } = require('@google/genai');
const http = require('http');

// 1. Configurations via les variables d'environnement de Render
const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(telegramToken, { polling: true });

// Initialisation de Gemini avec la clé de Render
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const ADMIN_USERNAME = "AFKCreation1"; 

// 2. Commande /start
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, "Bienvenue chez **AFK Création et Marketing** 🚀\n\nSpécialistes en **Gift Cards** 🎁\n\nContact : +50938898521 | afk.creation.fast@gmail.com", { parse_mode: "Markdown" });
});

// 3. Gestion des messages avec Gemini (Modèle 3.6-flash)
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const texteRecu = msg.text;
    const usernameClient = msg.from.username || "";

    if (texteRecu && !texteRecu.startsWith('/')) {
        console.log(`[Message de @${usernameClient}] : ${texteRecu}`);

        let instructionSpecial = "";

        if (usernameClient.toLowerCase() === ADMIN_USERNAME.toLowerCase()) {
            instructionSpecial = `L'utilisateur qui te parle est ton créateur et administrateur suprême (@AFKCreation1). Réponds-lui de manière utile et directe en montrant du respect.`;
        } else {
            instructionSpecial = `Tu es l'assistant virtuel d'AFK Création et Marketing, spécialisé dans les Gift Cards. Admin officiel : @AFKCreation1 (https://t.me/AFKCreation1). WhatsApp : +50938898521.`;
        }

        try {
            const response = await ai.models.generateContent({
                model: 'gemini-3.6-flash',
                contents: [
                    {
                        role: 'user',
                        parts: [
                            { text: `${instructionSpecial}\n\nMessage de l'utilisateur : "${texteRecu}"` }
                        ]
                    }
                ]
            });

            const reponseAI = response.text || "Oui chef ! À ton écoute.";
            bot.sendMessage(chatId, reponseAI);

        } catch (error) {
            console.error("Erreur avec l'IA :", error);
            bot.sendMessage(chatId, "Oui chef ! J'ai bien reçu ton message (mode secours actif).");
        }
    }
});

// 4. Petit serveur HTTP pour satisfaire Render
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Bot AFK est en ligne !\n');
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Serveur web en écoute sur le port ${PORT}`);
});

console.log("Bot AFK avec Gemini opérationnel !");