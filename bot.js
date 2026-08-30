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
const MODELE_GROQ = "qwen/qwen3.8-27b"; 

bot.on('polling_error', (error) => {
    console.log(`[Erreur de polling Telegram] : ${error.code} - ${error.message}`);
});

bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, "Bienvenue chez **AFK Création et Marketing** 🚀\n\nBoutique en ligne : https://afkmarketing.myshopify.com/\n\nUtilise la commande `/pub [ton message]` pour publier une annonce sur la chaîne !", { parse_mode: "Markdown" });
});

bot.onText(/\/pub\s+(.+)?/, async (msg, match) => {
    const chatId = msg.chat.id;
    const instructionUtilisateur = match[1];

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
    } connaisErr => {
        console.error("Erreur lors de l'envoi sur le canal :", err.message);
        bot.sendMessage(chatId, "❌ Erreur Telegram : " + err.message);
    }
});

bot.onText(/\/stats/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, `📊 **Statistiques du Bot** :\n• Messages reçus aujourd'hui : ${messagesRecusAujourdhui}`);
});

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const texteRecu = msg.text;
    const usernameClient = msg.from.username || "Inconnu";

    if (texteRecu && !texteRecu.startsWith('/')) {
        messagesRecusAujourdhui++;
        console.log(`[Message de @${usernameClient}] : ${texteRecu}`);

        try {
            const completion = await groq.chat.completions.create({
                model: MODELE_GROQ,
                messages: [
                    {
                        role: "system",
                        content: `Tu es l'assistant virtuel officiel d'AFK Création et Marketing (boutique : https://afkmarketing.myshopify.com/), dirigé par Fransen Augustin (@AFKCreation1). 
                        Voici le catalogue officiel et les prix de la boutique à respecter strictement pour renseigner les clients :
                        - Produits virtuels / Abonnements : Abonnement Netflix Premium à 500.00 HTG.
                        - Jeux : Recharge Diamants Free Fire à partir de 160.00 HTG.
                        - Cartes virtuelles Mastercard / Visa (Sutton Bank, USA, 3D Secure, paiement MonCash et NetCash) :
                          * Mastercard Silver : 1 600 HTG (Limite 50,000/jour)
                          * VISA Classic : 2 400 HTG (Limite 50,000/jour)
                          * Mastercard Elite : 4 000 HTG (Limite 100,000/jour, compatible Apple Pay & Google Pay)
                        Contact WhatsApp officiel pour commander ou payer : +50938898521. Sois aimable, professionnel et concis.`
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
    res.end('Bot AFK est en ligne 24/7 !\n');
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Serveur web en écoute sur le port ${PORT}`);
});

console.log("Bot AFK opérationnel avec Groq et catalogue Shopify !");