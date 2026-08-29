const TelegramBot = require('node-telegram-bot-api');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const http = require('http');

// 1. Configurations
const telegramToken = '8618752669:AAGE01ZMLOZzV-9Gf2Lzcw1bTbvaJ4omU34';
const bot = new TelegramBot(telegramToken, { polling: true });

// Initialisation de Gemini sécurisée via l'environnement Render
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const ADMIN_USERNAME = "AFKCreation1"; 

// 2. Commande /start
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, "Bienvenue chez **AFK Création et Marketing** 🚀\n\nSpécialistes en **Gift Cards** 🎁\n\nContact : +50938898521 | afk.creation.fast@gmail.com", { parse_mode: "Markdown" });
});

// 3. Gestion des messages avec Gemini
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
            const promptFinal = `${instructionSpecial}\n\nMessage de l'utilisateur : "${texteRecu}"`;
            const result = await model.generateContent(promptFinal);
            const response = await result.response;
            const reponseAI = response.text() || "Oui chef ! À ton écoute.";
            
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