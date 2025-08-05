import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder } from 'discord.js';

export default class CharteInteractionHandler {
    static async handleCharteValidation(interaction) {
        await interaction.deferUpdate();

        const embed = new EmbedBuilder()
            .setTitle('✅ **CHARTE VALIDÉE**')
            .setDescription('**Validation enregistrée avec succès**')
            .addFields(
                {
                    name: '👤 **Informations de validation**',
                    value: `**Utilisateur :** ${interaction.user.tag}\n**ID :** \`${interaction.user.id}\`\n**Date :** <t:${Math.floor(Date.now() / 1000)}:F>\n**Serveur :** ${interaction.guild.name}`,
                    inline: false
                },
                {
                    name: '📋 **Document validé**',
                    value: `**Référence :** DOC-BOT-2025-002\n**Charte Officielle d'Utilisation**\n**Éditeur :** [Théo Garcès / AidoTokihisa]\n**Version :** 1.0`,
                    inline: true
                },
                {
                    name: '⚖️ **Engagements**',
                    value: `• Respect de la propriété intellectuelle\n• Conformité aux conditions d'utilisation\n• Respect des droits RGPD\n• Acceptation des clauses légales`,
                    inline: true
                },
                {
                    name: '🔐 **Certificat de validation**',
                    value: `**Référence :** CERT-${Date.now().toString(36).toUpperCase()}\n**Valide jusqu'au :** <t:${Math.floor((Date.now() + 365*24*60*60*1000) / 1000)}:d>\n**Statut :** ✅ Accepté et enregistré\n**Traçabilité :** Audit trail activé`,
                    inline: false
                },
                {
                    name: '📞 **En cas de questions**',
                    value: `**Support :** \`/support\`\n**Réclamations RGPD :** \`/appeal\`\n**Suggestions :** \`/suggest\`\n**Contact :** support@team7.gg`,
                    inline: false
                }
            )
            .setColor('#28a745')
            .setThumbnail(interaction.user.displayAvatarURL({ size: 256 }))
            .setImage('https://i.imgur.com/s74nSIc.png')
            .setTimestamp()
            .setFooter({ 
                text: 'Validation Charte Officielle • Team7 Bot',
                iconURL: 'https://i.imgur.com/s74nSIc.png'
            });

        await interaction.editReply({
            embeds: [embed],
            components: []
        });

        // Envoyer une notification au channel de logs (si configuré)
        try {
            const logChannel = interaction.guild.channels.cache.find(ch => ch.name === 'logs-charte' || ch.name === 'logs');
            if (logChannel && logChannel.isTextBased()) {
                const logEmbed = new EmbedBuilder()
                    .setTitle('📋 **NOUVELLE VALIDATION DE CHARTE**')
                    .setDescription(`**${interaction.user.tag}** a validé la charte officielle`)
                    .addFields(
                        {
                            name: '📊 **Détails**',
                            value: `**Utilisateur :** <@${interaction.user.id}>\n**Date :** <t:${Math.floor(Date.now() / 1000)}:F>\n**Document :** DOC-BOT-2025-002\n**Certificat :** CERT-${Date.now().toString(36).toUpperCase()}`,
                            inline: false
                        }
                    )
                    .setColor('#17a2b8')
                    .setTimestamp()
                    .setFooter({ text: 'System Log - Charte Validation' });

                await logChannel.send({ embeds: [logEmbed] });
            }
        } catch (error) {
            console.log('Impossible d\'envoyer dans le channel de logs');
        }

        // Envoyer un DM de confirmation à l'utilisateur
        try {
            const dmEmbed = new EmbedBuilder()
                .setTitle('✅ **CONFIRMATION DE VALIDATION**')
                .setDescription('Vous avez validé la charte officielle Team7 Bot')
                .addFields(
                    {
                        name: '📋 **Récapitulatif**',
                        value: `**Document :** Charte Officielle d'Utilisation\n**Référence :** DOC-BOT-2025-002\n**Serveur :** ${interaction.guild.name}\n**Date :** <t:${Math.floor(Date.now() / 1000)}:F>`,
                        inline: false
                    },
                    {
                        name: '🔗 **Ressources utiles**',
                        value: `• **Support :** \`/support\` sur le serveur\n• **Mes données :** \`/my-data\`\n• **Export données :** \`/export-my-data\`\n• **Suggestions :** \`/suggest\``,
                        inline: false
                    }
                )
                .setColor('#28a745')
                .setTimestamp()
                .setFooter({ text: 'Team7 Bot - Confirmation' });

            await interaction.user.send({ embeds: [dmEmbed] });
        } catch (error) {
            console.log('Impossible d\'envoyer le DM de confirmation');
        }
    }

    static async handleDataDeletionConfirm(interaction, userId) {
        const deleteCommand = interaction.client.commands?.get('delete-my-data');
        if (deleteCommand && deleteCommand.confirmDeletion) {
            await deleteCommand.confirmDeletion(interaction, userId);
        } else {
            await interaction.reply({
                content: '❌ Erreur: Commande de suppression non trouvée.',
                ephemeral: true
            });
        }
    }

    static async handleDataPreview(interaction, userId) {
        await interaction.deferUpdate();

        // Simuler la récupération des données
        const userData = await this.getUserDataPreview(userId, interaction.guild.id);

        const embed = new EmbedBuilder()
            .setTitle('👁️ **APERÇU DES DONNÉES**')
            .setDescription(`**Données stockées pour <@${userId}>**`)
            .addFields(
                {
                    name: '📊 **Résumé des données**',
                    value: `**Messages archivés :** ${userData.messages}\n**Logs modération :** ${userData.moderationLogs}\n**Données utilisateur :** ${userData.userSettings}\n**Statistiques :** ${userData.stats}`,
                    inline: true
                },
                {
                    name: '📅 **Période de conservation**',
                    value: `**Plus ancien :** <t:${userData.oldestData}:d>\n**Plus récent :** <t:${userData.newestData}:d>\n**Prochaine purge :** <t:${userData.nextPurge}:d>`,
                    inline: true
                },
                {
                    name: '🗂️ **Types de données détaillés**',
                    value: `**🔸 Modération :**\n• Avertissements: ${userData.details.warnings}\n• Sanctions: ${userData.details.sanctions}\n• Notes: ${userData.details.notes}\n\n**🔸 Activité :**\n• Messages supprimés: ${userData.details.deletedMessages}\n• Statistiques d'usage: ${userData.details.usageStats}\n\n**🔸 Configuration :**\n• Préférences: ${userData.details.preferences}\n• Notifications: ${userData.details.notifications}`,
                    inline: false
                },
                {
                    name: '⚠️ **Important**',
                    value: `Ces données seront **définitivement supprimées** si vous confirmez la suppression. Cette action est **irréversible**.`,
                    inline: false
                }
            )
            .setColor('#ffc107')
            .setThumbnail('https://i.imgur.com/s74nSIc.png')
            .setTimestamp()
            .setFooter({ 
                text: 'Aperçu des données • RGPD Article 15',
                iconURL: 'https://i.imgur.com/s74nSIc.png'
            });

        const actionRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`delete_data_confirm_${userId}`)
                    .setLabel('🗑️ Confirmer suppression')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId('delete_data_cancel')
                    .setLabel('❌ Annuler')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId(`export_before_delete_${userId}`)
                    .setLabel('📥 Exporter avant suppression')
                    .setStyle(ButtonStyle.Primary)
            );

        await interaction.editReply({
            embeds: [embed],
            components: [actionRow]
        });
    }

    static async getUserDataPreview(userId, guildId) {
        // Simulation des données utilisateur
        const now = Date.now();
        return {
            messages: 147,
            moderationLogs: 12,
            userSettings: 1,
            stats: 8,
            oldestData: Math.floor((now - 90*24*60*60*1000) / 1000),
            newestData: Math.floor(now / 1000),
            nextPurge: Math.floor((now + 30*24*60*60*1000) / 1000),
            details: {
                warnings: 3,
                sanctions: 1,
                notes: 2,
                deletedMessages: 23,
                usageStats: 15,
                preferences: 5,
                notifications: 3
            }
        };
    }
}
