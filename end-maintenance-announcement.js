// Script pour annoncer la fin de maintenance
import { Client, GatewayIntentBits } from 'discord.js';
import { config } from 'dotenv';

config();

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

client.once('ready', async () => {
    console.log('Bot connecté pour l\'annonce de fin de maintenance');
    
    try {
        // ID du canal où envoyer l'annonce
        const channelId = '1368918056042102895'; // Canal général
        const channel = await client.channels.fetch(channelId);
        
        if (!channel) {
            console.error('Canal introuvable');
            return;
        }

        const endMaintenanceEmbed = {
            color: 0x00FF88, // Vert pour succès
            title: '✅ **MAINTENANCE TERMINÉE - SYSTÈME GAMING OPÉRATIONNEL**',
            description: '**Le nouveau système de rôles gaming est maintenant pleinement fonctionnel !**',
            fields: [
                {
                    name: '🎉 **Maintenance terminée avec succès**',
                    value: '• Tous les bugs ont été corrigés\n• Le système est maintenant stable\n• Toutes les fonctionnalités sont opérationnelles\n• Les permissions sont correctement configurées',
                    inline: false
                },
                {
                    name: '🔧 **Corrections apportées**',
                    value: '• **Accès spécifique aux salons** : Vous n\'avez plus accès qu\'aux salons de vos jeux\n• **Suppression des rôles fonctionnelle** : Retirer une réaction retire bien l\'accès\n• **Gestion des permissions optimisée** : Plus de bugs d\'affichage\n• **Système anti-erreur renforcé**',
                    inline: false
                },
                {
                    name: '🎮 **Nouvelles fonctionnalités**',
                    value: '• **Accès ciblé** : Seuls les salons de vos jeux sont visibles\n• **Rôle LOL activé** : League of Legends est maintenant disponible\n• **Boutons interactifs** : Interface moderne avec boutons\n• **Statistiques avancées** : Suivez votre activité gaming\n• **Notifications MP** : Confirmations personnalisées\n• **Cooldown intelligent** : Protection anti-spam de 30 secondes',
                    inline: false
                },
                {
                    name: '📋 **Comment utiliser le système**',
                    value: '1️⃣ Allez dans <#1368919061425164288>\n2️⃣ Cliquez sur les réactions ou boutons de vos jeux\n3️⃣ Accédez instantanément aux salons correspondants\n4️⃣ Recliquez pour retirer l\'accès si besoin',
                    inline: false
                },
                {
                    name: '🎯 **Jeux disponibles**',
                    value: '🔫 **Call of Duty** • 🎯 **Valorant** • 🏗️ **Fortnite**\n⚽ **EA FC** • 🚗 **Rocket League** • 🎮 **Nintendo** • ⚔️ **League of Legends**',
                    inline: false
                },
                {
                    name: '⚡ **Avantages du nouveau système**',
                    value: '• **Plus rapide** et plus stable\n• **Interface moderne** avec boutons\n• **Gestion intelligente** des permissions\n• **Accès précis** aux salons de vos jeux uniquement\n• **Système de cooldown** pour éviter le spam\n• **Notifications personnalisées** en MP',
                    inline: false
                }
            ],
            footer: {
                text: 'Équipe technique • Le système est maintenant 100% opérationnel',
                icon_url: client.user.displayAvatarURL()
            },
            timestamp: new Date().toISOString()
        };

        // Envoyer l'annonce avec mentions
        await channel.send({
            content: '@everyone <@&1387536419588931616>',
            embeds: [endMaintenanceEmbed]
        });

        console.log('✅ Annonce de fin de maintenance envoyée avec succès');
        
    } catch (error) {
        console.error('❌ Erreur lors de l\'envoi de l\'annonce:', error);
    }
    
    await client.destroy();
    process.exit(0);
});

client.login(process.env.DISCORD_TOKEN);
