const TelegramBot = require('node-telegram-bot-api');
const Groq = require('groq-sdk');
const http = require('http');

const telegramToken = process.env.TELEGRAM_BOT_TOKEN;

const bot = new TelegramBot(telegramToken, { 
    polling: {
        interval: 300,
        autoStart: true,
        params: {
            timeout: 10
        }
    } 
});

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const CHANNEL_ID = "@AFKcreation0";

let messagesRecusAujourdhui = 0;

// Commande /start
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, "Bienvenue chez **AFK Création et Marketing** 🚀\n\nUtilise la commande `/pub [ton message]` pour publier une annonce sur la chaîne !", { parse_mode: "Markdown" });
});

// Commande /pub intelligente avec Groq (modèle mis à jour)
bot.onText(/\/pub\s+(.+)?/, async (msg, match) => {
    const chatId = msg.chat.id;
    const instructionUtilisateur = match[1];

    if (!instructionUtilisateur) {
        bot.sendMessage(chatId, "⚠️ Dis-moi quoi mettre dans la pub ! Exemple : `/pub le prix minimum de creation de gift card est 1600gds il est valable pour 3 ans`", { parse_mode: "Markdown" });
        return;
    }

    bot.sendMessage(chatId, "⏳ Publication de l'annonce en cours...");

    let textePubFinal = "";

    try {
        const completion = await groq.chat.completions.create({
            model: "llama3-70b-8192", // Modèle stable de Groq
            messages: [
                {
                    role: "system",
                    content: "Tu es un expert marketing pour 'AFK Création et Marketing'. Rédige un message publicitaire professionnel, engageant, structuré avec des emojis pour Telegram. Inclus nos contacts officiels (WhatsApp : +50938898521, Email : afk.creation.fast@gmail.com, Admin : @AFKCreation1)."
                },
                {
                    role: "user",
                    content: instructionUtilisateur
                }
            ],
            temperature: 0.7,
            max_tokens: 1024
        });

        textePubFinal = completion.choices[0]?.message?.content || "";
    } catch (error) {
        console.warn("⚠️ Erreur Groq, basculement sur le mode secours :", error.message);
        textePubFinal = `🚀 **AFK Création et Marketing** 🚀\n\n✨ **Offre Exclusive** ✨\n${instructionUtilisateur}\n\n🎁 Service rapide et sécurisé !\n\n📞 **Contactez-nous :**\n• WhatsApp : +50938898521\n• Email : afk.creation.fast@gmail.com\n• Admin : @AFKCreation1`;
    }

    try {
        await bot.sendMessage(CHANNEL_ID, textePubFinal, { parse_mode: "Markdown" });
        bot.sendMessage(chatId, "✅ Annonce publiée avec succès sur la chaîne !\n\n*Message publié :*\n\n" + textePubFinal, { parse_mode: "Markdown" });
    } catch (err) {
        console.error("Erreur lors de l'envoi sur le canal :", err.message);
        bot.sendMessage(chatId, "❌ Erreur Telegram : " + err.message);
    }
});

// Commande /stats
bot.onText(/\/stats/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, `📊 **Statistiques du Bot** :\n• Messages reçus aujourd'hui : ${messagesRecusAujourdhui}`);
});

// Gestion des messages et de l'IA
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const texteRecu = msg.text;
    const usernameClient = msg.from.username || "Inconnu";

    if (texteRecu && !texteRecu.startsWith('/')) {
        messagesRecusAujourdhui++;
        console.log(`[Message de @${usernameClient}] : ${texteRecu}`);

        try {
            const completion = await groq.chat.completions.create({
                model: "llama3-70b-8192", // Modèle stable de Groq
                messages: [
                    {
                        role: "system",
                        content: "Tu es l'assistant virtuel officiel d'AFK Création et Marketing, spécialisé dans les Gift Cards. Ton créateur est Fransen Augustin (@AFKCreation1). WhatsApp : +50938898521."
                    },
                    {
                        role: "user",
                        content: texteRecu
                    }
                ],
                temperature: 0.7,
                max_tokens: 512
            });

            const reponseAI = completion.choices[0]?.message?.content || "Oui chef ! À ton écoute.";
            bot.sendMessage(chatId, reponseAI);

        } catch (error) {
            console.error("Erreur avec Groq :", error.message);
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

console.log("Bot AFK opérationnel avec Groq !");