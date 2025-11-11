// Serveur Express pour tester les webhooks de Murmure
// Usage: node testwebhook.js
// Puis configurez l'URL http://localhost:3000/webhook dans Murmure Settings → Webhook

const express = require('express');
const app = express();
const PORT = 3000;

// Middleware pour parser le JSON
app.use(express.json());

// Compteur de webhooks reçus
let webhookCount = 0;

// Mutualisée: fonction pour traiter un webhook (enregistrement et log)
function handleWebhook(req, res, webhookCountRef) {
    webhookCountRef.count++;
    const timestamp = new Date().toISOString();

    console.log('\n' + '='.repeat(50));
    console.log(`📨 Webhook #${webhookCountRef.count} reçu`);
    console.log(`⏰ Timestamp serveur: ${timestamp}`);
    console.log('📦 Données reçues:');
    console.log(JSON.stringify(req.body, null, 2));

    if (req.body.text) {
        console.log(`\n📝 Texte transcrit: "${req.body.text}"`);
    }
    if (req.body.timestamp) {
        console.log(`🕐 Timestamp transcription: ${req.body.timestamp}`);
    }
    if (req.body.duration !== undefined) {
        console.log(`⏱️  Durée: ${req.body.duration} secondes`);
    }
    console.log('='.repeat(50) + '\n');

    res.status(200).json({
        success: true,
        message: 'Webhook reçu avec succès',
        receivedAt: timestamp,
        webhookNumber: webhookCountRef.count,
    });
}

// Pour robuste incrémentation partagée
const webhookCountRef = { count: webhookCount };

// Route webhook classique
app.post('/webhook', (req, res) => {
    handleWebhook(req, res, webhookCountRef);
    webhookCount = webhookCountRef.count;
});

// Route webhook authentifiée par Bearer token "toto"
app.post('/webhook_auth', (req, res) => {
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            success: false,
            message: 'Token Bearer requis dans Authorization',
        });
    }
    const token = authHeader.split(' ')[1];
    if (token !== 'toto') {
        return res.status(403).json({
            success: false,
            message: 'Token Bearer invalide',
        });
    }

    handleWebhook(req, res, webhookCountRef);
    webhookCount = webhookCountRef.count;
});

// Route de test pour vérifier que le serveur fonctionne
app.get('/', (req, res) => {
    res.json({
        message: 'Serveur webhook de test pour Murmure',
        status: 'actif',
        endpoint: 'POST /webhook',
        url: `http://localhost:${PORT}/webhook`,
        webhooksReceived: webhookCount,
        instructions: [
            '1. Configurez cette URL dans Murmure: Settings → Webhook',
            '2. Utilisez CTRL+SPACE pour enregistrer une transcription',
            '3. Le webhook sera automatiquement appelé après la transcription',
        ],
    });
});

// Route pour réinitialiser le compteur
app.post('/reset', (req, res) => {
    webhookCount = 0;
    res.json({ message: 'Compteur réinitialisé', count: webhookCount });
});

// Démarrer le serveur
app.listen(PORT, () => {
    console.log('\n' + '='.repeat(50));
    console.log('🚀 Serveur webhook de test démarré');
    console.log('='.repeat(50));
    console.log(`📍 URL: http://localhost:${PORT}/webhook`);
    console.log(`🌐 Test: http://localhost:${PORT}/`);
    console.log(`📡 En attente de requêtes POST...\n`);
});

