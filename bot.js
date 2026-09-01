const TelegramBot = require('node-telegram-bot-api');
const Groq = require('groq-sdk');
const http = require('http');
const axios = require('axios');

// Configuration des clés et identifiants
const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const CHANNEL_ID = "@AFKcreation0";
const ADMIN_USERNAME = "AFKCreation1";
const MODELE_GROQ = "qwen/qwen3.8-27b";  

let messagesRecusAujourdhui = 0;
let derniereInteractionAdmin = Date.now();

// ==========================================
// 1. CONFIGURATION DU BOT TELEGRAM
// ==========================================
const bot = new TelegramBot(telegramToken, {  
    polling: {
        interval: 300,
        autoStart: true,
        params: { timeout: 10 }
    } 
});

bot.on('polling_error', (error) => {
    console.log(`[Erreur de polling Telegram] : ${error.code} - ${error.message}`);
});

// ==========================================
// 2. COMMANDES DU TABLEAU DE BORD
// ==========================================

bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const username = msg.from.username;

    if (username === ADMIN_USERNAME) {
        const opts = {
            reply_markup: {
                inline_keyboard: [
                    [{ text: "📊 Stats", callback_data: "cmd_stats" }, { text: "🛠️ Aide", callback_data: "cmd_aide" }],
                    [{ text: "💡 Idée Marketing", callback_data: "cmd_idees" }, { text: "🟢 Status", callback_data: "cmd_status" }]
                ]
            }
        };
        bot.sendMessage(chatId, "Salut Chef 🚀\n\nMode **Hi-Tech Autonome** actif. Tu peux me donner des ordres directement en tchat (ex: *'Dis à mes clients qu'il y a une promo Netflix'*), et je m'exécute !", { parse_mode: "Markdown", ...opts });
    } else {
        const opts = {
            reply_markup: {
                inline_keyboard: [
                    [{ text: "🛍️ Boutique Shopify", url: "https://afkmarketing.myshopify.com/" }],
                    [{ text: "📞 WhatsApp", url: "https://wa.me/50938898521" }]
                ]
            }
        };
        bot.sendMessage(chatId, "Bienvenue chez **AFK Création et Marketing** 🚀\n\nBesoin d'abonnements (Netflix, Free Fire) ou de cartes virtuelles Visa/Mastercard ? Comment pouvons-nous t'aider ?", { parse_mode: "Markdown", ...opts });
    }
});

bot.onText(/\/aide/, (msg) => {
    const chatId = msg.chat.id;
    if (msg.from.username !== ADMIN_USERNAME) return;

    const aideTexte = `🛠️ **Tableau de Bord Hi-Tech - AFK** :
• **Commandes directes en tchat** : Dis-moi par exemple *"Prépare une pub pour la chaîne"* ou *"Donne-moi une idée de prix"*.
1️⃣ \`/pub [sujet]\` - Rédige et publie sur la chaîne.
2️⃣ \`/produits\` - Lien de la boutique Shopify.
3️⃣ \`/stats\` - Statistiques du bot.
4️⃣ \`/promo [article]\` - Offre flash.
5️⃣ \`/idees [sujet]\` - Stratégies par l'IA.
6️⃣ \`/support\` - Infos paiements (MonCash/NetCash).`;

    bot.sendMessage(chatId, aideTexte, { parse_mode: "Markdown" });
});

bot.onText(/\/pub\s+(.+)?/, async (msg, match) => {
    const chatId = msg.chat.id;
    if (msg.from.username !== ADMIN_USERNAME) return;
    const instruction = match[1];

    if (!instruction) {
        bot.sendMessage(chatId, "⚠️ Utilisation : `/pub [sujet de l'annonce]`", { parse_mode: "Markdown" });
        return;
    }

    bot.sendMessage(chatId, "⏳ Rédaction de la publicité par l'IA...");
    try {
        const completion = await groq.chat.completions.create({
            model: MODELE_GROQ,
            messages: [
                { role: "system", content: "Tu es expert marketing pour 'AFK Création et Marketing' (Site : https://afkmarketing.myshopify.com/). Rédige un post pro avec emojis pour Telegram." },
                { role: "user", content: instruction }
            ],
            temperature: 0.7
        });
        const pubTexte = completion.choices[0]?.message?.content || instruction;
        await bot.sendMessage(CHANNEL_ID, pubTexte);
        bot.sendMessage(chatId, "✅ Pub publiée avec succès sur la chaîne !");
    } catch (err) {
        bot.sendMessage(chatId, "❌ Erreur : " + err.message);
    }
});

bot.onText(/\/produits/, (msg) => {
    const chatId = msg.chat.id;
    const opts = {
        reply_markup: {
            inline_keyboard: [
                [{ text: "🛍️ Ouvrir le Catalogue Shopify", url: "https://afkmarketing.myshopify.com/" }]
            ]
        }
    };
    bot.sendMessage(chatId, "🛍️ **Boutique Officielle Shopify**\n\nConsulte tous nos produits en ligne :", { parse_mode: "Markdown", ...opts });
});

bot.onText(/\/stats/, (msg) => {
    const chatId = msg.chat.id;
    if (msg.from.username !== ADMIN_USERNAME) return;
    bot.sendMessage(chatId, `📊 **Statistiques** :\n• Messages reçus aujourd'hui : ${messagesRecusAujourdhui}\n• Statut : Opérationnel 24/7`);
});

bot.onText(/\/promo\s+(.+)?/, async (msg, match) => {
    const chatId = msg.chat.id;
    if (msg.from.username !== ADMIN_USERNAME) return;
    const produit = match[1] || "nos services";

    bot.sendMessage(chatId, `🔥 Offre Flash générée pour : *${produit}* !\nVisite https://afkmarketing.myshopify.com/`, { parse_mode: "Markdown" });
});

bot.onText(/\/idees\s+(.+)?/, async (msg, match) => {
    const chatId = msg.chat.id;
    if (msg.from.username !== ADMIN_USERNAME) return;
    const sujet = match[1] || "services digitaux";

    const completion = await groq.chat.completions.create({
        model: MODELE_GROQ,
        messages: [
            { role: "system", content: "Tu es un conseiller en affaires pour AFK Création et Marketing en Haïti." },
            { role: "user", content: `Donne-moi 3 idées percutantes pour le sujet : ${sujet}` }
        ]
    });
    bot.sendMessage(chatId, completion.choices[0]?.message?.content || "Voici tes idées de boss.");
});

bot.onText(/\/support/, (msg) => {
    const chatId = msg.chat.id;
    if (msg.from.username !== ADMIN_USERNAME) return;
    bot.sendMessage(chatId, "📞 **Support & Paiements** :\n• WhatsApp : +50938898521\n• Paiements : MonCash, NetCash\n• Boutique : https://afkmarketing.myshopify.com/");
});

bot.onText(/\/status/, (msg) => {
    const chatId = msg.chat.id;
    if (msg.from.username !== ADMIN_USERNAME) return;
    bot.sendMessage(chatId, "🟢 **Système Hi-Tech Actif** :\n• Analyse intelligente des ordres : Activée\n• Connexion Groq & Shopify : OK");
});

bot.on('callback_query', async (callbackQuery) => {
    const msg = callbackQuery.message;
    const data = callbackQuery.data;
    const chatId = msg.chat.id;

    if (data === 'cmd_stats') {
        bot.sendMessage(chatId, `📊 Messages traités aujourd'hui : ${messagesRecusAujourdhui}`);
    } else if (data === 'cmd_aide') {
        bot.sendMessage(chatId, "Tape `/aide` pour voir les options du tableau de bord.");
    } else if (data === 'cmd_idees') {
        bot.sendMessage(chatId, "💡 Utilise `/idees [sujet]` pour lancer une recherche stratégique.");
    } else if (data === 'cmd_status') {
        bot.sendMessage(chatId, "🟢 Tout est opérationnel !");
    }
    bot.answerCallbackQuery(callbackQuery.id);
});


// ==========================================
// 3. CERVEAU IA AVANCÉ & EXÉCUTION D'ORDRES EN DIRECT
// ==========================================
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const texteRecu = msg.text;
    const usernameClient = msg.from.username || "Inconnu";

    if (texteRecu && !texteRecu.startsWith('/')) {
        messagesRecusAujourdhui++;
        const estAdmin = (usernameClient === ADMIN_USERNAME);

        let systemPrompt = "";
        if (estAdmin) {
            systemPrompt = `Tu es l'associé et l'assistant ultra-avancé d'AFK Création et Marketing. Tu t'adresses à ton créateur Fransen (@AFKCreation1), appelé "Chef" ou "Boss". 
            En plus de converser, tu es capable d'analyser s'il te donne un ordre en direct (par exemple, s'il te demande de rédiger un message publicitaire, de préparer une stratégie, ou d'agir). Si c'est un ordre de rédaction pour la chaîne ou une promo, génère directement le contenu prêt à être copié ou publié. Sois pro, réactif et ultra-intelligent.`;
        } else {
            systemPrompt = `Tu es l'assistant virtuel officiel et amical d'AFK Création et Marketing (boutique : https://afkmarketing.myshopify.com/). 
            Oriente toujours les clients vers nos offres :
            - Abonnements Netflix Premium : 500.00 HTG.
            - Recharge Diamants Free Fire : À partir de 160.00 HTG.
            - Cartes virtuelles Mastercard / Visa (MonCash et NetCash) :
              * Mastercard Silver : 1 600 HTG
              * VISA Classic : 2 400 HTG
              * Mastercard Elite : 4 000 HTG
            Contact WhatsApp : +50938898521.`;
        }

        try {
            const completion = await groq.chat.completions.create({
                model: MODELE_GROQ,
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: texteRecu }
                ],
                temperature: 0.75,
                max_tokens: 512
            });

            const reponseAI = completion.choices[0]?.message?.content || "Oui chef ! À ton écoute.";
            bot.sendMessage(chatId, reponseAI);

        } catch (error) {
            bot.sendMessage(chatId, "Bienvenue chez AFK Création et Marketing ! Visite notre site : https://afkmarketing.myshopify.com/");
        }
    }
});

// ==========================================
// 4. SERVEUR WEB LÉGER (UptimeRobot)
// ==========================================
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`
        <html>
            <head><title>AFK Bot Hi-Tech</title></head>
            <body style="font-family: Arial, sans-serif; text-align: center; margin-top: 50px; background-color: #f4f7f6;">
                <div style="background: white; padding: 30px; border-radius: 10px; display: inline-block; box-shadow: 0px 4px 10px rgba(0,0,0,0.1);">
                    <h1 style="color: #2e7d32;">🚀 Bot AFK Hi-Tech Actif 24/7 !</h1>
                    <p>Intelligence artificielle avancée connectée à Telegram et Shopify.</p>
                </div>
            </body>
        </html>
    `);
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Serveur web en écoute sur le port ${PORT}`);
});