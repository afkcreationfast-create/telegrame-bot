const TelegramBot = require('node-telegram-bot-api');
const { GoogleGenAI } = require('@google/genai');
const http = require('http');

// 1. Configurations via les variables d'environnement de Render
const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(telegramToken, { polling: true });

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const ADMIN_USERNAME = "AFKCreation1"; 

// Canal cible pour la publicité
const CHANNEL_ID = "@AFKcreation0";[cite: 1]

// Compteur de messages du jour
let messagesRecusAujourdhui = 0;

// Fonction pour envoyer une publicité sur la chaîne
async function posterPublicite(chatIdCible = null) {
    try {
        const textePub = "🚀 **AFK Création et Marketing** 🚀\n\nBesoin de **Gift Cards** rapides et sécurisées ? 🎁\nFaites confiance à notre service professionnel !\n\n📞 Contactez-nous dès maintenant :\n• WhatsApp : +50938898521\n• Email : afk.creation.fast@gmail.com\n• Admin : @AFKCreation1";
        
        // Publie sur le canal officiel
        await bot.sendMessage(CHANNEL_ID, textePub, { parse_mode: "Markdown" });[cite: 1]
        
        // Si la commande vient d'une discussion privée avec l'admin, on lui confirme
        if (chatIdCible) {
            bot.sendMessage(chatIdCible, "✅ Publicité publiée avec succès sur la chaîne @AFKcreation0 !");
        }
        console.log("Publicité postée avec succès sur le canal !");
    } catch (error) {
        console.error("Erreur lors de l'envoi de la pub :", error.message);
        if (chatIdCible) {
            bot.sendMessage(chatIdCible, "❌ Erreur lors de la publication : " + error.message);
        }
    }
}

// 2. Commandes spéciales pour l'administrateur
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, "Bienvenue chez **AFK Création et Marketing** 🚀\n\nSpécialistes en **Gift Cards** 🎁\n\nContact : +50938898521 | afk.creation.fast@gmail.com", { parse_mode: "Markdown" });
});

// Commande pour forcer la publication d'une pub sur la chaîne depuis Telegram
bot.onText(/\/pub/, (msg) => {
    const username = msg.from.username || "";
    const chatId = msg.chat.id;

    if (username.toLowerCase() === ADMIN_USERNAME.toLowerCase()) {
        bot.sendMessage(chatId, "🚀 Ordre reçu chef ! Publication en cours sur la chaîne...");
        posterPublicite(chatId);
    } else {
        bot.sendMessage(chatId, "⛔ Cette commande est réservée à l'administrateur.");
    }
});

// Commande pour voir combien de personnes ont écrit
bot.onText(/\/stats/, (msg) => {
    const username = msg.from.username || "";
    const chatId = msg.chat.id;

    if (username.toLowerCase() === ADMIN_USERNAME.toLowerCase()) {
        bot.sendMessage(chatId, `📊 **Statistiques du Bot** :\n• Messages reçus aujourd'hui : ${messagesRecusAujourdhui}`);
    } else {
        bot.sendMessage(chatId, "⛔ Commande réservée à l'administrateur.");
    }
});

// 3. Gestion des messages normaux et IA
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const texteRecu = msg.text;
    const usernameClient = msg.from.username || "";

    if (texteRecu && !texteRecu.startsWith('/')) {
        messagesRecusAujourdhui++;
        console.log(`[Message de @${usernameClient}] : ${texteRecu}`);

        let systemPrompt = "";
        if (usernameClient.toLowerCase() === ADMIN_USERNAME.toLowerCase()) {
            systemPrompt = "Tu es l'assistant privé exclusif d'AFK Création et Marketing. Ton créateur et administrateur suprême est Fransen Augustin (@AFKCreation1). Tu réponds directement à ses ordres.";
        } else {
            systemPrompt = "Tu es l'assistant virtuel officiel d'AFK Création et Marketing, spécialisé dans les Gift Cards et les services numériques. Admin officiel : @AFKCreation1. WhatsApp : +50938898521.";
        }

        try {
            const response = await ai.models.generateContent({
                model: 'gemini-3.6-flash',
                config: { systemInstruction: systemPrompt },
                contents: [texteRecu]
            });

            const reponseAI = response.text || "Oui chef ! À ton écoute.";
            bot.sendMessage(chatId, reponseAI);

        } catch (error) {
            console.error("Erreur avec l'IA :", error);
            bot.sendMessage(chatId, "Oui chef ! J'ai bien reçu ton message.");
        }
    }
});

// 4. Serveur HTTP pour Render
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Bot AFK est en ligne !\n');
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Serveur web en écoute sur le port ${PORT}`);
});

console.log("Bot AFK opérationnel !");