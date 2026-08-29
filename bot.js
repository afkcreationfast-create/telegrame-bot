const TelegramBot = require('node-telegram-bot-api');
const { GoogleGenAI } = require('@google/genai');
const http = require('http');

const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
// Ajout de { polling: { interval: 300 } } pour éviter les conflits de requêtes
const bot = new TelegramBot(telegramToken, { polling: true });

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const CHANNEL_ID = "@AFKcreation0";

let messagesRecusAujourdhui = 0;

// Commande /start
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, "Bienvenue chez **AFK Création et Marketing** 🚀\n\nUtilise la commande `/pub [ton message]` pour que l'IA génère et publie une annonce pro sur la chaîne !", { parse_mode: "Markdown" });
});

// Commande /pub intelligente avec IA
bot.onText(/\/pub\s+(.+)?/, async (msg, match) => {
    const chatId = msg.chat.id;
    const instructionUtilisateur = match[1]; // Récupère le texte tapé après /pub

    if (!instructionUtilisateur) {
        bot.sendMessage(chatId, "⚠️ Dis-moi quoi mettre dans la pub ! Exemple : `/pub le prix minimum des gift card est 1600gds elle est valide pour 3ans`", { parse_mode: "Markdown" });
        return;
    }

    bot.sendMessage(chatId, "⏳ L'IA rédige un super message publicitaire détaillé...");

    try {
        const promptRedaction = `En tant qu'expert marketing pour "AFK Création et Marketing", rédige un message publicitaire professionnel, engageant, structuré et plus long (avec des emojis) pour notre chaîne Telegram, basé sur ces informations : "${instructionUtilisateur}". Inclus la mention du prix minimum, la validité, et nos contacts officiels (WhatsApp : +50938898521, Email : afk.creation.fast@gmail.com, Admin : @AFKCreation1).`;

        // Utilisation du modèle correct exigé par l'API
        const response = await ai.models.generateContent({
            model: 'gemini-3.6-flash',
            contents: [promptRedaction]
        });

        const texteGenere = response.text || "🚀 AFK Création et Marketing 🚀\n\n" + instructionUtilisateur;

        await bot.sendMessage(CHANNEL_ID, texteGenere, { parse_mode: "Markdown" });
        bot.sendMessage(chatId, "✅ Pub générée et publiée avec succès sur la chaîne !\n\n*Aperçu du texte envoyé :*\n\n" + texteGenere, { parse_mode: "Markdown" });
        console.log("Publicité générée par IA et postée sur le canal !");

    } catch (error) {
        console.error("Erreur lors de la génération de la pub :", error.message);
        bot.sendMessage(chatId, "❌ Erreur lors de la génération par l'IA : " + error.message);
    }
});

// Commande /stats
bot.onText(/\/stats/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, `📊 **Statistiques du Bot** :\n• Messages reçus aujourd'hui : ${messagesRecusAujourdhui}`);
});

// Gestion des messages et de l'IA (discussion classique)
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
                model: 'gemini-3.6-flash',
                config: { systemInstruction: systemPrompt },
                contents: [texteRecu]
            });

            const reponseAI = response.text || "Oui chef ! À ton écoute.";
            bot.sendMessage(chatId, reponseAI);

        } catch (error) {
            console.error("Erreur avec l'IA :", error.message);
            bot.sendMessage(chatId, "Oui chef ! J'ai bien reçu ton message.");
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