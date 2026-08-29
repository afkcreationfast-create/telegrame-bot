const TelegramBot = require('node-telegram-bot-api');
const { GoogleGenAI } = require('@google/genai');
const http = require('http');

const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(telegramToken, { polling: true });

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const CHANNEL_ID = "@AFKcreation0";

let messagesRecusAujourdhui = 0;

// Fonction de publication publicitaire
async function posterPublicite(chatIdCible = null) {
    try {
        const textePub = "🚀 **AFK Création et Marketing** 🚀\n\nBesoin de **Gift Cards** rapides et sécurisées ? 🎁\nFaites confiance à notre service professionnel !\n\n📞 Contactez-nous dès maintenant :\n• WhatsApp : +50938898521\n• Email : afk.creation.fast@gmail.com\n• Admin : @AFKCreation1";
        
        await bot.sendMessage(CHANNEL_ID, textePub, { parse_mode: "Markdown" });
        
        if (chatIdCible) {
            bot.sendMessage(chatIdCible, "✅ Publicité publiée avec succès sur la chaîne @AFKcreation0 !");
        }
        console.log("Publicité postée avec succès sur le canal !");
    } catch (error) {
        console.error("Erreur lors de l'envoi de la pub :", error.message);
        if (chatIdCible) {
            bot.sendMessage(chatIdCible, "❌ Erreur Telegram : " + error.message);
        }
    }
}

// Commande /start
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, "Bienvenue chez **AFK Création et Marketing** 🚀\n\nEnvoyez /pub pour publier une annonce sur le canal.", { parse_mode: "Markdown" });
});

// Commande /pub directe
bot.onText(/\/pub/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, "🚀 Ordre reçu ! Publication sur le canal en cours...");
    posterPublicite(chatId);
});

// Commande /stats
bot.onText(/\/stats/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, `📊 **Statistiques du Bot** :\n• Messages reçus aujourd'hui : ${messagesRecusAujourdhui}`);
});

// Gestion des messages et de l'IA avec sécurité anti-plantage 503
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const texteRecu = msg.text;
    const usernameClient = msg.from.username || "Inconnu";

    if (texteRecu && !texteRecu.startsWith('/')) {
        messagesRecusAujourdhui++;
        console.log(`[Message de @${usernameClient}] : ${texteRecu}`);

        let systemPrompt = "Tu es l'assistant virtuel officiel d'AFK Création et Marketing, spécialisé dans les Gift Cards. Ton créateur est Fransen Augustin (@AFKCreation1). WhatsApp : +50938898521.";

        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                config: { systemInstruction: systemPrompt },
                contents: [texteRecu]
            });

            const reponseAI = response.text || "Oui chef ! À ton écoute.";
            bot.sendMessage(chatId, reponseAI);

        } catch (error) {
            console.error("Erreur avec l'IA :", error.message);
            // Réponse de secours si l'IA est surchargée (évite le crash du bot)
            bot.sendMessage(chatId, "Oui chef ! J'ai bien reçu ton message (le service IA rencontre une brève surcharge, mais je suis là).");
        }
    }
});

const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Bot AFK est en ligne !\n');
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Serveur web en écoute sur le port ${PORT}`);
});

console.log("Bot AFK opérationnel !");