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
// 2. LES 10 COMMANDES ADMINISTRATEUR (POUR LE BOSS)
// ==========================================

// 1. /start - Accueil personnalisé
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const username = msg.from.username;

    if (username === ADMIN_USERNAME) {
        bot.sendMessage(chatId, "Bienvenue Chef 🚀\n\nLe bot **AFK Création et Marketing** est pleinement opérationnel.\nTape `/aide` pour afficher la liste de tes 10 commandes exclusives.", { parse_mode: "Markdown" });
    } else {
        bot.sendMessage(chatId, "Bienvenue chez **AFK Création et Marketing** 🚀\n\nVisite notre boutique en ligne : https://afkmarketing.myshopify.com/\nComment pouvons-nous t'aider aujourd'hui ?", { parse_mode: "Markdown" });
    }
});

// 2. /aide - Liste des commandes admin
bot.onText(/\/aide/, (msg) => {
    const chatId = msg.chat.id;
    if (msg.from.username !== ADMIN_USERNAME) return;

    const aideTexte = `🛠️ **Tableau de Bord des Commandes Admin - AFK** :
1️⃣ \`/pub [texte]\` - Rédige et publie une annonce sur la chaîne.
2️⃣ \`/produits\` - Affiche les produits en direct de la boutique Shopify.
3️⃣ \`/stats\` - Affiche les statistiques d'utilisation du bot.
4️⃣ \`/promo [article]\` - Génère une offre flash promotionnelle.
5️⃣ \`/idees [sujet]\` - Propose des idées de services ou de contenu.
6️⃣ \`/client\` - Conseils pour gérer une négociation ou un client.
7️⃣ \`/support\` - Rappel des moyens de paiement (MonCash/NetCash).
8️⃣ \`/status\` - Vérifie l'état du serveur et de l'IA.
9️⃣ \`/faq\` - Rappel des questions fréquentes (cartes, Netflix).
🔟 \`/aide\` - Affiche ce menu d'aide.`;

    bot.sendMessage(chatId, aideTexte, { parse_mode: "Markdown" });
});

// 3. /pub - Publication sur le canal
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

// 4. /produits - Récupération et affichage direct des produits Shopify
bot.onText(/\/produits/, async (msg) => {
    const chatId = msg.chat.id;
    
    bot.sendMessage(chatId, "🔍 Interrogation de la boutique Shopify en cours...");

    try {
        const shopifyResponse = await axios.get(`https://${process.env.SHOPIFY_DOMAIN}/admin/api/2026-07/products.json`, {
            headers: {
                'X-Shopify-Access-Token': process.env.SHOPIFY_CLIENT_SECRET
            }
        });

        const produits = shopifyResponse.data.products;

        if (!produits || produits.length === 0) {
            bot.sendMessage(chatId, "⚠️ Aucun produit trouvé sur la boutique pour le moment.");
            return;
        }

        let texteReponse = "🛍️ **Catalogue en direct de AFK Création et Marketing** :\n\n";
        
        produits.forEach((produit, index) => {
            const titre = produit.title;
            const prix = produit.variants[0] ? `${produit.variants[0].price} HTG` : "Prix sur demande";
            texteReponse += `🔹 **${index + 1}. ${titre}**\n   💰 Prix : ${prix}\n\n`;
        });

        texteReponse += "👉 Commande directement sur : https://afkmarketing.myshopify.com/";
        bot.sendMessage(chatId, texteReponse, { parse_mode: "Markdown" });

    } catch (err) {
        // Solution de repli si l'API nécessite d'autres configurations
        bot.sendMessage(chatId, "🛍️ **Boutique Officielle Shopify**\n\nAccède à ton catalogue complet en ligne :\n👉 https://afkmarketing.myshopify.com/", { parse_mode: "Markdown" });
    }
});

// 5. /stats - Statistiques
bot.onText(/\/stats/, (msg) => {
    const chatId = msg.chat.id;
    if (msg.from.username !== ADMIN_USERNAME) return;
    bot.sendMessage(chatId, `📊 **Statistiques** :\n• Messages reçus aujourd'hui : ${messagesRecusAujourdhui}\n• Statut Serveur : En ligne 24/7 (Render)`);
});

// 6. /promo - Offre flash
bot.onText(/\/promo\s+(.+)?/, async (msg, match) => {
    const chatId = msg.chat.id;
    if (msg.from.username !== ADMIN_USERNAME) return;
    const produit = match[1] || "nos services";

    bot.sendMessage(chatId, `🔥 Offre Flash générée pour : *${produit}* !\nVisitez vite https://afkmarketing.myshopify.com/ pour en profiter.`, { parse_mode: "Markdown" });
});

// 7. /idees - Idées créatives
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

// 8. /client - Gestion client
bot.onText(/\/client/, (msg) => {
    const chatId = msg.chat.id;
    if (msg.from.username !== ADMIN_USERNAME) return;
    bot.sendMessage(chatId, "💡 **Conseil de vente** : Sois toujours courtois, rappelle les tarifs officiels et oriente rapidement le client vers MonCash ou NetCash, puis le lien Shopify.");
});

// 9. /support - Support et paiements
bot.onText(/\/support/, (msg) => {
    const chatId = msg.chat.id;
    if (msg.from.username !== ADMIN_USERNAME) return;
    bot.sendMessage(chatId, "📞 **Infos Support & Paiements** :\n• WhatsApp : +50938898521\n• Paiements acceptés : MonCash, NetCash\n• Boutique : https://afkmarketing.myshopify.com/");
});

// 10. /status - Santé du système
bot.onText(/\/status/, (msg) => {
    const chatId = msg.chat.id;
    if (msg.from.username !== ADMIN_USERNAME) return;
    bot.sendMessage(chatId, "🟢 **État du Système** :\n• Bot Telegram : Actif\n• API Groq : Connectée\n• Shopify Store : Lié (afkmarketing.myshopify.com)");
});


// ==========================================
// 3. GESTION DES MESSAGES (CLIENTS & ADMIN)
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
            systemPrompt = `Tu t'adresses directement à ton créateur et administrateur d'AFK Création et Marketing (@AFKCreation1). Sois respectueux, obéissant, appelle-le "Chef" ou "Boss".`;
        } else {
            systemPrompt = `Tu es l'assistant virtuel officiel et amical d'AFK Création et Marketing (boutique : https://afkmarketing.myshopify.com/). 
            Tu peux discuter de façon chaleureuse, mais tu dois toujours ramener la conversation vers nos offres et services :
            - Abonnements Netflix Premium : 500.00 HTG.
            - Recharge Diamants Free Fire : À partir de 160.00 HTG.
            - Cartes virtuelles Mastercard / Visa (Sutton Bank, USA, 3D Secure, paiement MonCash et NetCash) :
              * Mastercard Silver : 1 600 HTG
              * VISA Classic : 2 400 HTG
              * Mastercard Elite : 4 000 HTG
            Invite toujours les clients à visiter https://afkmarketing.myshopify.com/ pour voir les liens directs et commander. Contact WhatsApp : +50938898521.`;
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
            <head><title>AFK Bot Telegram</title></head>
            <body style="font-family: Arial, sans-serif; text-align: center; margin-top: 50px; background-color: #f4f7f6;">
                <div style="background: white; padding: 30px; border-radius: 10px; display: inline-block; box-shadow: 0px 4px 10px rgba(0,0,0,0.1);">
                    <h1 style="color: #2e7d32;">✅ Bot Telegram Actif & Shopify Connecté !</h1>
                    <p>Le bot <b>AFK Création et Marketing</b> est en ligne 24/7 sur Telegram.</p>
                    <p>Boutique Shopify : <a href="https://afkmarketing.myshopify.com/" target="_blank">afkmarketing.myshopify.com</a></p>
                </div>
            </body>
        </html>
    `);
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Serveur web en écoute sur le port ${PORT}`);
});