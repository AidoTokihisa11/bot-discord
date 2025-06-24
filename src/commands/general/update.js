import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import Logger from '../../utils/Logger.js';

export default {
    data: new SlashCommandBuilder()
        .setName('maj')
        .setDescription('📊 Envoie un rapport de progression aux clients concernés')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const { client, channel } = interaction;
        const logger = new Logger();

        try {
            await interaction.deferReply({ ephemeral: true });

            // Vérifier que la commande est utilisée dans le bon canal
            const allowedChannelId = '1368933588976013392';
            if (channel.id !== allowedChannelId) {
                return await interaction.editReply({
                    content: `❌ Cette commande ne peut être utilisée que dans <#${allowedChannelId}>.`
                });
            }

            // IDs des utilisateurs à contacter
            const clientIds = ['421670146604793856', '421245210220298240'];
            let successCount = 0;
            let failedUsers = [];

            // Embed du rapport de progression
            const updateEmbed = new EmbedBuilder()
                .setColor('#00ff88')
                .setTitle('📊 **RAPPORT DE PROGRESSION - CONFIGURATION SERVEUR**')
                .setDescription(`**Bonjour,**

Nous vous envoyons ce rapport détaillé concernant l'avancement de la configuration de votre serveur Discord.`)
                .addFields(
                    {
                        name: '✅ **SYSTÈMES OPÉRATIONNELS**',
                        value: '**Les systèmes suivants sont maintenant pleinement fonctionnels :**',
                        inline: false
                    },
                    {
                        name: '📋 **SYSTÈME DE RÈGLEMENT**',
                        value: '• **Validation automatique** par réaction ✅\n• **Attribution du rôle** `1386990308679483393` instantanée\n• **Messages de bienvenue** personnalisés en MP\n• **Système de révocation** automatique\n• **Détection intelligente** des messages de règlement\n• **Logs complets** de toutes les actions\n• **Gestion d\'erreurs** robuste',
                        inline: false
                    },
                    {
                        name: '🎫 **SYSTÈME DE TICKETS**',
                        value: '• **6 types de tickets** spécialisés (Support, Général, Signalement, Partenariat, Suggestion, Appel)\n• **Interface moderne** avec boutons interactifs\n• **Système de priorités** automatique\n• **Temps de réponse** garantis selon le type\n• **Notifications staff** automatiques en MP\n• **Gestion des permissions** (rôle `1386990308679483393` restreint pour "Prendre en charge")\n• **Transcripts automatiques** disponibles\n• **Fermeture sécurisée** avec confirmation\n• **Ajout d\'utilisateurs** aux tickets\n• **Catégorie dédiée** avec permissions appropriées',
                        inline: false
                    },
                    {
                        name: '🔧 **FONCTIONNALITÉS TECHNIQUES**',
                        value: '• **Commandes slash** modernes et sécurisées\n• **Système de logs** complet avec classe Logger\n• **Gestion d\'erreurs** avancée\n• **Permissions granulaires** par rôle\n• **Base de données** intégrée pour la persistance\n• **Architecture modulaire** pour faciliter les mises à jour',
                        inline: false
                    },
                    {
                        name: '⏳ **CONFIGURATION EN COURS**',
                        value: '**Temps estimé restant : ~10 heures**\n\n• Configuration des rôles avancés\n• Système de modération automatique\n• Commandes personnalisées supplémentaires\n• Optimisations de performance\n• Tests finaux et ajustements',
                        inline: false
                    },
                    {
                        name: '📈 **STATUT GLOBAL**',
                        value: '🟢 **Systèmes principaux** : Opérationnels\n🟡 **Configuration avancée** : En cours\n⏱️ **Progression** : ~70% terminé\n🎯 **Livraison finale** : Dans 10 heures environ',
                        inline: false
                    }
                )
                .setThumbnail(client.user.displayAvatarURL({ dynamic: true }))
                .setFooter({ 
                    text: '🔧 Développement en cours • Rapport automatique',
                    iconURL: client.user.displayAvatarURL()
                })
                .setTimestamp();

            // Embed de remerciements
            const thanksEmbed = new EmbedBuilder()
                .setColor('#5865F2')
                .setTitle('💙 **REMERCIEMENTS**')
                .setDescription(`**Merci pour votre confiance !**`)
                .setFooter({ text: '💙 Merci de nous avoir fait confiance' });

            // Envoyer le rapport à chaque client
            for (const userId of clientIds) {
                try {
                    const user = await client.users.fetch(userId);
                    await user.send({
                        embeds: [updateEmbed, thanksEmbed]
                    });
                    successCount++;
                    logger.success(`Rapport envoyé avec succès à ${user.tag} (${userId})`);
                } catch (error) {
                    failedUsers.push(userId);
                    logger.error(`Impossible d'envoyer le rapport à ${userId}:`, error.message);
                }
            }

            // Réponse de confirmation
            let responseMessage = `✅ **Rapport de progression envoyé !**\n\n`;
            responseMessage += `📊 **Résultats :**\n`;
            responseMessage += `• **Envois réussis :** ${successCount}/${clientIds.length}\n`;
            
            if (failedUsers.length > 0) {
                responseMessage += `• **Échecs :** ${failedUsers.join(', ')}\n`;
                responseMessage += `\n⚠️ **Note :** Certains utilisateurs ont peut-être désactivé leurs MPs.`;
            }

            responseMessage += `\n\n📋 **Contenu envoyé :**\n`;
            responseMessage += `• Systèmes opérationnels (Règlement + Tickets)\n`;
            responseMessage += `• Détails techniques complets\n`;
            responseMessage += `• Temps restant estimé (~10h)\n`;
            responseMessage += `• Message de remerciements`;

            await interaction.editReply({
                content: responseMessage
            });

        } catch (error) {
            logger.error('Erreur lors de l\'envoi du rapport:', error);
            
            await interaction.editReply({
                content: '❌ Une erreur est survenue lors de l\'envoi du rapport de progression.'
            });
        }
    }
};
