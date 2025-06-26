// Script temporaire pour envoyer l'annonce de maintenance
import { Client, GatewayIntentBits } from 'discord.js';
import { config } from 'dotenv';

config();

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

client.once('ready', async () => {
    console.log('Bot connecté pour l\'annonce de maintenance');
    
    try {
        // ID du canal où envoyer l'annonce (remplacez par le bon canal)
        const channelId = '1368933588976013392'; // Canal de déploiement
        const channel = await client.channels.fetch(channelId);
        
        if (!channel) {
            console.error('Canal introuvable');
            return;
        }

        const maintenanceEmbed = {
            color: 0xFF6B35, // Orange pour attirer l'attention
            title: '🚧 **MAINTENANCE EN COURS - SYSTÈME DE RÔLES GAMING**',
            description: '**Merci de ne pas interagir avec les rôles pour le moment !**',
            fields: [
                {
                    name: '⚠️ **Situation actuelle**',
                    value: '• Le nouveau système de rôles gaming est en cours de déploiement\n• Des optimisations et corrections sont en cours\n• Certaines fonctionnalités peuvent être temporairement instables',
                    inline: false
                },
                {
                    name: '🔧 **Actions en cours**',
                    value: '• Configuration des permissions avancées\n• Optimisation des performances\n• Tests de stabilité du système\n• Correction des erreurs détectées',
                    inline: false
                },
                {
                    name: '⏱️ **Durée estimée**',
                    value: '**~15-20 minutes** pour finaliser le déploiement',
                    inline: true
                },
                {
                    name: '📋 **Instructions**',
                    value: '• **NE PAS** cliquer sur les réactions de rôles\n• **NE PAS** utiliser les boutons gaming\n• Attendre l\'annonce de fin de maintenance',
                    inline: true
                },
                {
                    name: '🎮 **Après la maintenance**',
                    value: '• Système de rôles gaming entièrement fonctionnel\n• Interface moderne avec boutons interactifs\n• Gestion automatique des permissions\n• Notifications personnalisées',
                    inline: false
                }
            ],
            footer: {
                text: 'Équipe technique • Merci de votre patience',
                icon_url: client.user.displayAvatarURL()
            },
            timestamp: new Date().toISOString()
        };

        // Envoyer l'annonce avec mentions
        await channel.send({
            content: '@everyone @Server Member',
            embeds: [maintenanceEmbed]
        });

        console.log('✅ Annonce de maintenance envoyée avec succès');
        
    } catch (error) {
        console.error('❌ Erreur lors de l\'envoi de l\'annonce:', error);
    }
    
    await client.destroy();
    process.exit(0);
});

client.login(process.env.DISCORD_TOKEN);
