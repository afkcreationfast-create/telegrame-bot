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
// 2. COMMANDES DU TABLEAU DE BORD PRO MAX
// ==========================================

bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const username = msg.from.username;

    if (username === ADMIN_USERNAME) {
        const opts = {
            reply_markup: {
                inline_keyboard: [
                    [{ text: "📊 Stats", callback_data: "cmd_stats" }, { text: "🛠️ Aide", callback_data: "cmd_aide" }],
                    [{ text: "💡 Idée Marketing", callback_data: "cmd_idees" }, { text: "🧮 Calculateur Prix", callback_data: "cmd_calc" }]
                ]
            }
        };
        bot.sendMessage(chatId, "Salut Chef 🚀\n\nLe bot **AFK Création et Marketing** est configuré en mode **Ultra-Intelligent**. Dis-moi ce dont tu as besoin (pub, stratégie, prix) !", { parse_mode: "Markdown", ...opts });
    } else {
        const opts = {
            reply_markup: {
                inline_keyboard: [
                    [{ text: "🛍️ Boutique Shopify", url: "https://afkmarketing.myshopify.com/" }],
                    [{ text: "📞 Contact WhatsApp", url: "https://wa.me/50938898521" }]
                ]
            }
        };
        bot.sendMessage(chatId, "Bienvenue chez **AFK Création et Marketing** 🚀\n\nBesoin d'un abonnement Netflix, de diamants Free Fire ou d'une carte virtuelle Visa/Mastercard ? Comment pouvons-nous t'aider ?", { parse_mode: "Markdown", ...opts });
    }
});

bot.onText(/\/aide/, (msg) => {
    const chatId = msg.chat.id;
    if (msg.from.username !== ADMIN_USERNAME) return;

    const aideTexte = `🛠️ **Tableau de Bord Hi-Tech - AFK** :
1️⃣ \`/pub [sujet]\` - Rédige une annonce pro prête à copier-coller pour la chaîne.
2️⃣ \`/produits\` - Lien direct vers la boutique Shopify.
3️⃣ \`/stats\` - Statistiques du bot et du serveur.
4️⃣ \`/promo [article]\` - Génère une offre flash percutante.
5️⃣ \`/idees [sujet]\` - Stratégies business par l'IA.
6️⃣ \`/support\` - Infos paiements (MonCash/NetCash) et WhatsApp.`;

    bot.sendMessage(chatId, aideTexte, { parse_mode: "Markdown" });
});

// 3. /pub - Rédaction de publicité optimisée (prête à copier ou envoyer)
bot.onText(/\/pub\s+(.+)?/, async (msg, match) => {
    const chatId = msg.chat.id;
    if (msg.from.username !== ADMIN_USERNAME) return;
    const instruction = match[1];

    if (!instruction) {
        bot.sendMessage(chatId, "⚠️ Utilisation : `/pub [sujet de l'annonce]`\nExemple : `/pub cartes visa mastercard`", { parse_mode: "Markdown" });
        return;
    }

    bot.sendMessage(chatId, "⏳ Rédaction de la publication professionnelle...");
    try {
        const completion = await groq.chat.completions.create({
            model: MODELE_GROQ,
            messages: [
                { role: "system", content: "Tu es expert marketing pour 'AFK Création et Marketing' (Site : https://afkmarketing.myshopify.com/). Rédige un post percutant avec emojis, structure claire et call-to-action pour Telegram." },
                { role: "user", content: instruction }
            ],
            temperature: 0.7
        });
        const pubTexte = completion.choices[0]?.message?.content || instruction;
        
        // Envoi du texte formaté que le boss peut copier ou transférer
        bot.sendMessage(chatId, `✨ **Voici ton annonce prête à l'emploi pour la chaîne (@AFKcreation0)** :\n\n${pubTexte}\n\n*(Astuce : tu peux copier ce texte et le coller directement sur ton canal)*`, { parse_mode: "Markdown" });
        
        // Tentative d'envoi automatique si le bot a les droits admin sur le canal
        try {
            await bot.sendMessage(CHANNEL_ID, pubTexte);
        } catch (e) {
            // Ignore si le bot n'est pas admin du canal, le texte est déjà affiché au boss
        }

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
    bot.sendMessage(chatId, `📊 **Statistiques** :\n• Messages reçus aujourd'hui : ${messagesRecusAujourdhui}\n• Serveur : Render (En ligne 24/7)`);
});

bot.onText(/\/promo\s+(.+)?/, async (msg, match) => {
    const chatId = msg.chat.id;
    if (msg.from.username !== ADMIN_USERNAME) return;
    const produit = match[1] || "nos services";

    bot.sendMessage(chatId, `🔥 **Offre Flash** : Profite d'une réduction spéciale sur *${produit}* ! Commande vite sur https://afkmarketing.myshopify.com/ ou contacte-nous via WhatsApp (+50938898521).`, { parse_mode: "Markdown" });
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
    bot.sendMessage(chatId, "📞 **Support & Paiements** :\n• WhatsApp : +50938898521\n• Paiements acceptés : MonCash, NetCash\n• Boutique : https://afkmarketing.myshopify.com/");
});

// Gestion des boutons interactifs du menu admin
bot.on('callback_query', async (callbackQuery) => {
    const msg = callbackQuery.message;
    const data = callbackQuery.data;
    const chatId = msg.chat.id;

    if (data === 'cmd_stats') {
        bot.sendMessage(chatId, `📊 Messages traités aujourd'hui : ${messagesRecusAujourdhui}`);
    } else if (data === 'cmd_aide') {
        bot.sendMessage(chatId, "Tape `/aide` pour afficher la liste des commandes du tableau de bord.");
    } else if (data === 'cmd_idees') {
        bot.sendMessage(chatId, "💡 Utilise `/idees [sujet]` pour générer des stratégies marketing.");
    } else if (data === 'cmd_calc') {
        bot.sendMessage(chatId, "🧮 **Grille Tarifaire Officielle AFK** :\n• Netflix : 500 HTG\n• Free Fire : Dès 160 HTG\n• Mastercard Silver : 1 600 HTG\n• VISA Classic : 2 400 HTG\n• Mastercard Elite : 4 000 HTG");
    }
    bot.answerCallbackQuery(callbackQuery.id);
});


// ==========================================
// 3. INTELLIGENCE ARTIFICIELLE & ASSISTANT DE VENTE
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
            systemPrompt = `Tu es l'associé et l'assistant ultra-pro d'AFK Création et Marketing. Tu t'adresses à ton créateur Fransen (@AFKCreation1), appelé "Chef" ou "Boss". 
            Aide-le dans ses tâches de gestion, de rédaction de messages, de marketing et de stratégie commerciale. Sois ultra-précis, dynamique et courtois.`;
        } else {
            systemPrompt = `Tu es l'assistant virtuel officiel et amical d'AFK Création et Marketing (boutique : https://afkmarketing.myshopify.com/). 
            Oriente toujours les clients vers nos offres et tarifs officiels :
            - Abonnements Netflix Premium : 500.00 HTG.
            - Recharge Diamants Free Fire : À partir de 160.00 HTG.
            - Cartes virtuelles Mastercard / Visa (Paiement MonCash et NetCash) :
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
            <head><title>AFK Bot Pro Max</title></head>
            <body style="font-family: Arial, sans-serif; text-align: center; margin-top: 50px; background-color: #f4f7f6;">
                <div style="background: white; padding: 30px; border-radius: 10px; display: inline-block; box-shadow: 0px 4px 10px rgba(0,0,0,0.1);">
                    <h1 style="color: #2e7d32;">🚀 Bot AFK Pro Max Actif 24/7 !</h1>
                    <p>Système de publication et d'assistance optimisé.</p>
                </div>
            </body>
        </html>
    `);
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Serveur web en écoute sur le port ${PORT}`);
});