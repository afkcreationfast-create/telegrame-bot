const TelegramBot = require('node-telegram-bot-api');
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const Groq = require('groq-sdk');
const http = require('http');
const QRCode = require('qrcode');

// Configuration des clés et identifiants
const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const CHANNEL_ID = "@AFKcreation0";
const ADMIN_USERNAME = "AFKCreation1";
const NUMERO_AUTORISE = "50938898521"; // Numéro cible WhatsApp
const MODELE_GROQ = "qwen/qwen3.8-27b";  

let messagesRecusAujourdhui = 0;
let dernierQrCodeData = null; // Variable pour stocker le dernier QR code généré
let estConnecteWhatsApp = false;

// ==========================================
// 1. CONFIGURATION DU BOT TELEGRAM (Répond à tout)
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
        console.log(`[Message Telegram de @${usernameClient}] : ${texteRecu}`);

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


// ==========================================
// 2. CONFIGURATION DU BOT WHATSAPP
// ==========================================
async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');

    const sock = makeWASocket({
        auth: state
    });

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            console.log("📱 [WHATSAPP] Nouveau QR Code généré pour le web !");
            try {
                // Convertit le QR code en image Data URL (PNG)
                dernierQrCodeData = await QRCode.toDataURL(qr);
            } catch (err) {
                console.error("Erreur de conversion du QR code en image :", err);
            }
        }

        if (connection === 'close') {
            estConnecteWhatsApp = false;
            const shouldReconnect = (lastDisconnect?.error instanceof Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('Connexion WhatsApp fermée, reconnexion...', shouldReconnect);
            if (shouldReconnect) connectToWhatsApp();
        } else if (connection === 'open') {
            estConnecteWhatsApp = true;
            dernierQrCodeData = null; // Nettoie le QR code une fois connecté
            console.log('✅ Bot WhatsApp connecté et opérationnel 24/7 !');
        }
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const remoteJid = msg.key.remoteJid;
        const texteMessage = msg.message.conversation || msg.message.extendedTextMessage?.text || "";

        const estNumeroConcerne = remoteJid.includes(NUMERO_AUTORISE);

        if (estNumeroConcerne && texteMessage.trim().toLowerCase().startsWith('.ai')) {
            const promptUtilisateur = texteMessage.replace(/^\.ai/i, '').trim();
            console.log(`[WhatsApp AI] Demande reçue du +${NUMERO_AUTORISE} : ${promptUtilisateur}`);

            try {
                const completion = await groq.chat.completions.create({
                    model: MODELE_GROQ,
                    messages: [
                        {
                            role: "system",
                            content: `Tu es l'assistant virtuel officiel d'AFK Création et Marketing (boutique : https://afkmarketing.myshopify.com/). 
                            Catalogue officiel et tarifs à respecter strictement :
                            - Abonnements Netflix Premium : 500.00 HTG.
                            - Recharge Diamants Free Fire : À partir de 160.00 HTG.
                            - Cartes virtuelles Mastercard / Visa (Sutton Bank, USA, 3D Secure, paiement MonCash et NetCash) :
                              * Mastercard Silver : 1 600 HTG (Limite 50,000/jour)
                              * VISA Classic : 2 400 HTG (Limite 50,000/jour)
                              * Mastercard Elite : 4 000 HTG (Limite 100,000/jour, compatible Apple Pay & Google Pay)
                            Contact WhatsApp officiel : +50938898521. Sois aimable, professionnel et concis.`
                        },
                        {
                            role: "user",
                            content: promptUtilisateur
                        }
                    ],
                    temperature: 0.7,
                    max_tokens: 512
                });

                const reponseAI = completion.choices[0]?.message?.content || "Oui chef ! À ton écoute.";
                await sock.sendMessage(remoteJid, { text: reponseAI });

            } catch (error) {
                console.error("Erreur Groq WhatsApp :", error.message);
                await sock.sendMessage(remoteJid, { text: "⚠️ Désolé, une erreur est survenue avec l'IA." });
            }
        }
    });
}

connectToWhatsApp();


// ==========================================
// 3. SERVEUR WEB GLOBAL (Affiche le QR code et sert UptimeRobot)
// ==========================================
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });

    if (estConnecteWhatsApp) {
        res.end(`
            <html>
                <head><title>AFK Bot Global</title></head>
                <body style="font-family: Arial, sans-serif; text-align: center; margin-top: 50px; background-color: #f4f7f6;">
                    <div style="background: white; padding: 30px; border-radius: 10px; display: inline-block; box-shadow: 0px 4px 10px rgba(0,0,0,0.1);">
                        <h1 style="color: #2e7d32;">✅ Bot WhatsApp Connecté !</h1>
                        <p>Le bot <b>AFK Création et Marketing</b> (Telegram + WhatsApp) est en ligne et opérationnel 24/7.</p>
                        <p style="color: gray; font-size: 14px;">UptimeRobot actif 🚀</p>
                    </div>
                </body>
            </html>
        `);
    } else if (dernierQrCodeData) {
        res.end(`
            <html>
                <head>
                    <title>Scanner QR Code - AFK Bot</title>
                    <meta http-equiv="refresh" content="5"> <!-- Rafraîchit la page toutes les 5 secondes pour avoir un QR code à jour -->
                </head>
                <body style="font-family: Arial, sans-serif; text-align: center; margin-top: 40px; background-color: #f4f7f6;">
                    <div style="background: white; padding: 30px; border-radius: 10px; display: inline-block; box-shadow: 0px 4px 10px rgba(0,0,0,0.1);">
                        <h2 style="color: #d32f2f;">📱 Connexion WhatsApp requise</h2>
                        <p>Scanne ce QR code avec ton application WhatsApp (Appareils connectés) :</p>
                        <img src="${dernierQrCodeData}" alt="QR Code WhatsApp" style="width: 300px; height: 300px; border: 5px solid #ddd; border-radius: 8px;"/>
                        <p style="color: gray; font-size: 12px; margin-top: 15px;">Cette page se rafraîchit automatiquement toutes les 5 secondes.</p>
                    </div>
                </body>
            </html>
        `);
    } else {
        res.end(`
            <html>
                <head>
                    <title>Chargement - AFK Bot</title>
                    <meta http-equiv="refresh" content="3">
                </head>
                <body style="font-family: Arial, sans-serif; text-align: center; margin-top: 50px;">
                    <h2>⏳ Génération du QR code en cours...</h2>
                    <p>Veuillez patienter quelques secondes, la page va se recharger.</p>
                </body>
            </html>
        `);
    }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Serveur web global en écoute sur le port ${PORT}`);
});

console.log("Système global initialisé : Interface QR code web activée !");