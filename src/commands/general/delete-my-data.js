import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('delete-my-data')
        .setDescription('🗑️ Supprimer vos données personnelles du bot (RGPD)')
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
        .addUserOption(option =>
            option.setName('user')
                .setDescription('Utilisateur dont supprimer les données (admin uniquement)')
                .setRequired(false)
        ),

    async execute(interaction) {
        const targetUser = interaction.options.getUser('user') || interaction.user;
        const isTargetingSelf = targetUser.id === interaction.user.id;
        
        // Vérifier les permissions pour supprimer les données d'autres utilisateurs
        if (!isTargetingSelf && !interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return await interaction.reply({
                content: '❌ Vous ne pouvez supprimer que vos propres données. Seuls les administrateurs peuvent supprimer les données d\'autres utilisateurs.',
                ephemeral: true
            });
        }

        const embed = new EmbedBuilder()
            .setTitle('🗑️ **SUPPRESSION DE DONNÉES PERSONNELLES**')
            .setDescription(`
╭─────────────────────────────────────╮
│     **🛡️ CONFORMITÉ RGPD 🛡️**         │
╰─────────────────────────────────────╯

**Utilisateur concerné :** ${targetUser.tag}
**Demandé par :** ${interaction.user.tag}

**📋 Types de données qui seront supprimées :**

**🔸 Données de modération :**
• Historique des avertissements
• Logs de sanctions (mutes, kicks, bans)
• Notes de modération personnelles

**🔸 Données d'activité :**
• Messages supprimés archivés
• Statistiques d'utilisation du bot
• Données de tickets support

**🔸 Données de configuration :**
• Préférences personnelles
• Rôles automatiques configurés
• Notifications personnalisées

**⚠️ ATTENTION :**
Cette action est **IRRÉVERSIBLE** et conforme au RGPD.
Toutes les données seront définitivement supprimées.

**🕐 Délai de suppression :** Immédiat
**📧 Confirmation :** Par email automatique`)
            .setColor('#ff4444')
            .setTimestamp()
            .setFooter({ 
                text: `Team7 • Conformité RGPD • ${isTargetingSelf ? 'Auto-suppression' : 'Suppression admin'}`,
                iconURL: interaction.client.user.displayAvatarURL()
            })
            .setImage('https://i.imgur.com/s74nSIc.png')

        const confirmRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`delete_data_confirm_${targetUser.id}`)
                    .setLabel('✅ Confirmer la suppression')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId(`delete_data_preview_${targetUser.id}`)
                    .setLabel('👁️ Prévisualiser les données')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId(`delete_data_cancel_${targetUser.id}`)
                    .setLabel('❌ Annuler')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId(`delete_data_partial_${targetUser.id}`)
                    .setLabel('⚙️ Suppression partielle')
                    .setStyle(ButtonStyle.Primary)
            );

        await interaction.reply({
            embeds: [embed],
            components: [confirmRow],
            ephemeral: true
        });
    }
};
