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
        // ID du canal où envoyer l'annonce
        const channelId = '1368918056042102895'; // Canal général
        const channel = await client.channels.fetch(channelId);
        
        if (!channel) {
            console.error('Canal introuvable');
            return;
        }

        const maintenanceEmbed = {
            color: 0xFF6B35, // Orange pour attirer l'attention
            title: '🚧 **MAINTENANCE MAJEURE - SYSTÈME DE RÔLES GAMING**',
            description: '**Merci de ne pas interagir avec les rôles pour le moment !**',
            fields: [
                {
                    name: '⚠️ **Situation actuelle**',
                    value: '• Le nouveau système de rôles gaming est en cours de déploiement\n• Migration complète de l\'ancien système vers le nouveau\n• Optimisations majeures et corrections en cours\n• Certaines fonctionnalités peuvent être temporairement instables',
                    inline: false
                },
                {
                    name: '🔧 **Actions en cours**',
                    value: '• Refonte complète du système de rôles\n• Configuration des permissions avancées\n• Optimisation des performances\n• Tests de stabilité approfondis\n• Correction des erreurs détectées\n• Mise en place de nouvelles fonctionnalités',
                    inline: false
                },
                {
                    name: '⏱️ **Durée estimée**',
                    value: '**2-3 jours** pour finaliser complètement le déploiement',
                    inline: true
                },
                {
                    name: '📋 **Instructions IMPORTANTES**',
                    value: '• **NE PAS** cliquer sur les réactions de rôles\n• **NE PAS** utiliser les boutons gaming\n• **NE PAS** essayer de récupérer vos rôles\n• Attendre l\'annonce officielle de fin de maintenance',
                    inline: true
                },
                {
                    name: '🎮 **Après la maintenance**',
                    value: '• Système de rôles gaming entièrement repensé\n• Interface moderne avec boutons interactifs\n• Gestion automatique des permissions par catégorie\n• Notifications personnalisées en MP\n• Système anti-spam avancé\n• Statistiques détaillées\n• Performances optimisées',
                    inline: false
                },
                {
                    name: '💡 **Pourquoi cette maintenance ?**',
                    value: 'Nous migrons vers un système beaucoup plus performant et stable qui vous offrira une meilleure expérience utilisateur avec de nouvelles fonctionnalités exclusives.',
                    inline: false
                }
            ],
            footer: {
                text: 'Équipe technique • Merci de votre patience et compréhension',
                icon_url: client.user.displayAvatarURL()
            },
            timestamp: new Date().toISOString()
        };

        // Envoyer l'annonce avec mentions
        await channel.send({
            content: '@everyone <@&1387536419588931616>',
            embeds: [maintenanceEmbed]
        });

        console.log('✅ Annonce de maintenance v2 envoyée avec succès');
        
    } catch (error) {
        console.error('❌ Erreur lors de l\'envoi de l\'annonce:', error);
    }
    
    await client.destroy();
    process.exit(0);
});

client.login(process.env.DISCORD_TOKEN);
