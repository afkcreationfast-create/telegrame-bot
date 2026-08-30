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

// Ton username administrateur officiel
const ADMIN_USERNAME = "AFKCreation1";

let messagesRecusAujourdhui = 0;
const MODELE_GROQ = "qwen/qwen3.8-27b"; 

bot.on('polling_error', (error) => {
    console.log(`[Erreur de polling Telegram] : ${error.code} - ${error.message}`);
});

bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const username = msg.from.username;

    if (username === ADMIN_USERNAME) {
        bot.sendMessage(chatId, "Bienvenue Chef 🚀\n\nLe bot **AFK Création et Marketing** est connecté à ton compte administrateur.\nUtilise `/pub [ton message]` pour publier sur la chaîne !", { parse_mode: "Markdown" });
    } else {
        bot.sendMessage(chatId, "Bienvenue chez **AFK Création et Marketing** 🚀\n\nVisite notre boutique en ligne : https://afkmarketing.myshopify.com/\nComment pouvons-nous t'aider aujourd'hui ?", { parse_mode: "Markdown" });
    }
});

bot.onText(/\/pub\s+(.+)?/, async (msg, match) => {
    const chatId = msg.chat.id;
    const username = msg.from.username;
    const instructionUtilisateur = match[1];

    // Vérification de sécurité : seule l'admin (@AFKCreation1) peut publier
    if (username !== ADMIN_USERNAME) {
        bot.sendMessage(chatId, "❌ Désolé, cette commande est réservée à l'administrateur d'AFK Création et Marketing.");
        return;
    }

    if (!instructionUtilisateur) {
        bot.sendMessage(chatId, "⚠️ Dis-moi quoi mettre dans la pub ! Exemple : `/pub promotion sur les cartes mastercard silver à 1600 htg`", { parse_mode: "Markdown" });
        return;
    }

    bot.sendMessage(chatId, "⏳ Publication de l'annonce en cours...");

    let textePubFinal = "";

    try {
        const completion = await groq.chat.completions.create({
            model: MODELE_GROQ,
            messages: [
                {
                    role: "system",
                    content: "Tu es un expert marketing pour 'AFK Création et Marketing' (Site : https://afkmarketing.myshopify.com/). Rédige un message publicitaire professionnel, engageant, structuré avec des emojis pour Telegram. Inclus nos contacts officiels (WhatsApp : +50938898521, Email : afk.creation.fast@gmail.com, Admin : @AFKCreation1)."
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
        textePubFinal = `🚀 AFK Création et Marketing 🚀\n\n✨ Offre Exclusive ✨\n${instructionUtilisateur}\n\n📞 Contactez-nous :\n• WhatsApp : +50938898521\n• Site : https://afkmarketing.myshopify.com/\n• Admin : @AFKCreation1`;
    }

    try {
        await bot.sendMessage(CHANNEL_ID, textePubFinal);
        bot.sendMessage(chatId, "✅ Annonce publiée avec succès sur la chaîne !\n\n*Message publié :*\n\n" + textePubFinal, { parse_mode: "Markdown" });
    } catch (err) {
        console.error("Erreur lors de l'envoi sur le canal :", err.message);
        bot.sendMessage(chatId, "❌ Erreur Telegram : " + err.message);
    }
});

bot.onText(/\/stats/, (msg) => {
    const chatId = msg.chat.id;
    const username = msg.from.username;

    if (username !== ADMIN_USERNAME) {
        bot.sendMessage(chatId, "❌ Commande réservée à l'administrateur.");
        return;
    }

    bot.sendMessage(chatId, `📊 **Statistiques du Bot** :\n• Messages reçus aujourd'hui : ${messagesRecusAujourdhui}`);
});

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const texteRecu = msg.text;
    const usernameClient = msg.from.username || "Inconnu";

    if (texteRecu && !texteRecu.startsWith('/')) {
        messagesRecusAujourdhui++;
        console.log(`[Message de @${usernameClient}] : ${texteRecu}`);

        // Détermine si c'est toi ou un client lambda
        const estAdmin = (usernameClient === ADMIN_USERNAME);

        let systemPrompt = "";
        if (estAdmin) {
            systemPrompt = `Tu t'adresses directement à ton créateur et administrateur d'AFK Création et Marketing (@AFKCreation1). Sois respectueux, obéissant, appelle-le "Chef" ou "Boss", et réponds à ses demandes ou tests de configuration.`;
        } else {
            systemPrompt = `Tu es l'assistant virtuel officiel d'AFK Création et Marketing (boutique : https://afkmarketing.myshopify.com/). 
            Catalogue officiel et tarifs à respecter strictement :
            - Abonnements Netflix Premium : 500.00 HTG.
            - Recharge Diamants Free Fire : À partir de 160.00 HTG.
            - Cartes virtuelles Mastercard / Visa (Sutton Bank, USA, 3D Secure, paiement MonCash et NetCash) :
              * Mastercard Silver : 1 600 HTG (Limite 50,000/jour)
              * VISA Classic : 2 400 HTG (Limite 50,000/jour)
              * Mastercard Elite : 4 000 HTG (Limite 100,000/jour, compatible Apple Pay & Google Pay)
            Contact WhatsApp officiel pour commander ou payer : +50938898521. Sois aimable, professionnel et concis avec les clients.`;
        }

        try {
            const completion = await groq.chat.completions.create({
                model: MODELE_GROQ,
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: texteRecu }
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
    res.end('Bot AFK est en ligne 24/7 !\n');
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Serveur web en écoute sur le port ${PORT}`);
});

console.log("Bot AFK opérationnel avec Groq et reconnaissance Admin !");