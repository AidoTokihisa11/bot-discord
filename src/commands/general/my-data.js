import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

import AccessRestriction from '../../utils/AccessRestriction.js';
export default {
    data: new SlashCommandBuilder()
        .setName('my-data')
        .setDescription('📊 Consulter toutes vos données stockées par le bot (Droit d\'accès RGPD)'),

    async execute(interaction) {
        // === VÉRIFICATION D'ACCÈS GLOBALE ===
        const accessRestriction = new AccessRestriction();
        const hasAccess = await accessRestriction.checkAccess(interaction);
        if (!hasAccess) {
            return; // Accès refusé, message déjà envoyé
        }


        await interaction.deferReply({ ephemeral: true });

        try {
            const userId = interaction.user.id;
            const database = interaction.client.db;
            
            // Récupérer toutes les données de l'utilisateur
            const userData = await this.collectUserData(database, userId, interaction.guild);
            
            const embed = new EmbedBuilder()
                .setTitle('📊 **VOS DONNÉES PERSONNELLES**')
                .setDescription(`**Conformément au RGPD (Article 15 - Droit d'accès)**\n\nVoici toutes les données que nous conservons vous concernant :`)
                .addFields(
                    {
                        name: '👤 **Informations de base**',
                        value: `• **ID Discord :** \`${userData.basic.id}\`\n• **Username :** ${userData.basic.username}\n• **Rejoint le serveur :** ${userData.basic.joinedAt}\n• **Compte créé :** ${userData.basic.createdAt}`,
                        inline: false
                    },
                    {
                        name: '⚖️ **Données de modération**',
                        value: userData.moderation.summary || 'Aucune donnée de modération',
                        inline: false
                    },
                    {
                        name: '📈 **Statistiques d\'activité**',
                        value: userData.activity.summary || 'Aucune statistique disponible',
                        inline: false
                    },
                    {
                        name: '🔒 **Durée de conservation**',
                        value: `• **Logs de modération :** 30 jours\n• **IDs utilisateurs :** 90 jours\n• **Statistiques :** 1 an\n• **Données de configuration :** Jusqu'à suppression`,
                        inline: false
                    }
                )
                .setColor('#3498db')
                .setTimestamp()
                .setFooter({ 
                    text: 'Conforme RGPD • Team7 Bot',
                    iconURL: interaction.user.displayAvatarURL()
                })
                .setImage('https://i.imgur.com/s74nSIc.png');

            const actionRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('export_my_data')
                        .setLabel('📁 Exporter mes données')
                        .setStyle(ButtonStyle.Primary)
                        .setEmoji('📁'),
                    new ButtonBuilder()
                        .setCustomId('delete_my_data')
                        .setLabel('🗑️ Supprimer mes données')
                        .setStyle(ButtonStyle.Danger)
                        .setEmoji('🗑️'),
                    new ButtonBuilder()
                        .setCustomId('data_refresh')
                        .setLabel('🔄 Actualiser')
                        .setStyle(ButtonStyle.Secondary)
                        .setEmoji('🔄')
                );

            await interaction.editReply({
                embeds: [embed],
                components: [actionRow]
            });

        } catch (error) {
            console.error('Erreur lors de la récupération des données:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setTitle('❌ **Erreur**')
                .setDescription('Une erreur est survenue lors de la récupération de vos données. Veuillez réessayer plus tard.')
                .setColor('#e74c3c')
                .setTimestamp();
                
            await interaction.editReply({ embeds: [errorEmbed] });
        }
    },

    async collectUserData(database, userId, guild) {
        const data = {
            basic: {},
            moderation: {},
            activity: {}
        };

        try {
            // Informations de base
            const user = await guild.members.fetch(userId).catch(() => null);
            data.basic = {
                id: userId,
                username: user ? user.user.tag : 'Utilisateur inconnu',
                joinedAt: user ? `<t:${Math.floor(user.joinedTimestamp / 1000)}:F>` : 'Inconnu',
                createdAt: user ? `<t:${Math.floor(user.user.createdTimestamp / 1000)}:F>` : 'Inconnu'
            };

            // Données de modération
            const moderationHistory = await database.getUserHistory ? await database.getUserHistory(userId) : [];
            const warnings = await database.getUserWarnings ? await database.getUserWarnings(userId) : [];
            
            if (moderationHistory.length > 0 || warnings.length > 0) {
                data.moderation.summary = `• **Avertissements actifs :** ${warnings.filter(w => w.active).length}\n• **Actions de modération :** ${moderationHistory.length}\n• **Dernière action :** ${moderationHistory.length > 0 ? `<t:${Math.floor(moderationHistory[0].timestamp / 1000)}:R>` : 'Aucune'}`;
            } else {
                data.moderation.summary = '✅ Aucun antécédent de modération';
            }

            // Statistiques d'activité
            data.activity.summary = `• **Messages analysés :** Non suivi\n• **Dernière activité :** <t:${Math.floor(Date.now() / 1000)}:R>\n• **Statut :** Membre actif`;

        } catch (error) {
            console.error('Erreur lors de la collecte des données:', error);
        }

        return data;
    }
};
