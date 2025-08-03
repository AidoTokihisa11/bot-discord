import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('embed-aido')
        .setDescription('🎨 Créer un embed personnalisé avec interface avancée')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

    async execute(interaction) {
        try {
            // Vérification du canal spécifique
            const ALLOWED_CHANNEL_ID = '1401484823662428180';
            if (interaction.channelId !== ALLOWED_CHANNEL_ID) {
                return await interaction.reply({
                    content: `❌ Cette commande ne peut être utilisée que dans <#${ALLOWED_CHANNEL_ID}>`,
                    ephemeral: true
                });
            }

            // Vérification des permissions
            if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
                return await interaction.reply({
                    content: '❌ Vous n\'avez pas les permissions nécessaires pour utiliser cette commande.',
                    ephemeral: true
                });
            }

            // Créer l'embed du panneau principal
            const mainEmbed = new EmbedBuilder()
                .setColor('#5865F2')
                .setTitle('🎨 **CRÉATEUR D\'EMBED AVANCÉ**')
                .setDescription(`
╭─────────────────────────────────────╮
│        **Panneau de Création**        │
╰─────────────────────────────────────╯

**🎯 Fonctionnalités Disponibles :**
• 🎨 **Couleurs personnalisées** - Plus de 20 couleurs
• 📝 **Texte riche** - Titre, description, champs
• 🖼️ **Images & médias** - Miniatures et images
• 📍 **Sélection de canal** - Choix de destination
• 📋 **Templates prêts** - Modèles professionnels
• ⚡ **Aperçu en temps réel** - Visualisation instantanée

**🚀 Commencer :**
Utilisez les boutons ci-dessous pour créer votre embed personnalisé.`)
                .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
                .setFooter({ 
                    text: 'Système de création d\'embeds • Interface professionnelle',
                    iconURL: interaction.user.displayAvatarURL({ dynamic: true })
                })
                .setTimestamp();

            // Boutons du panneau principal
            const mainButtons = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('embed_create_new')
                        .setLabel('Créer Nouvel Embed')
                        .setStyle(ButtonStyle.Primary)
                        .setEmoji('🎨'),
                    new ButtonBuilder()
                        .setCustomId('embed_use_template')
                        .setLabel('Utiliser Template')
                        .setStyle(ButtonStyle.Success)
                        .setEmoji('📋'),
                    new ButtonBuilder()
                        .setCustomId('embed_quick_message')
                        .setLabel('Message Rapide')
                        .setStyle(ButtonStyle.Secondary)
                        .setEmoji('⚡')
                );

            const templateButtons = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('embed_template_announcement')
                        .setLabel('Annonce')
                        .setStyle(ButtonStyle.Primary)
                        .setEmoji('📢'),
                    new ButtonBuilder()
                        .setCustomId('embed_template_rules')
                        .setLabel('Règlement')
                        .setStyle(ButtonStyle.Danger)
                        .setEmoji('📜'),
                    new ButtonBuilder()
                        .setCustomId('embed_template_event')
                        .setLabel('Événement')
                        .setStyle(ButtonStyle.Success)
                        .setEmoji('🎉'),
                    new ButtonBuilder()
                        .setCustomId('embed_template_info')
                        .setLabel('Information')
                        .setStyle(ButtonStyle.Secondary)
                        .setEmoji('ℹ️')
                );

            await interaction.reply({
                embeds: [mainEmbed],
                components: [mainButtons, templateButtons],
                ephemeral: false
            });

        } catch (error) {
            console.error('Erreur dans la commande embed:', error);
            await interaction.reply({
                content: '❌ Une erreur est survenue lors de l\'exécution de la commande.',
                ephemeral: true
            });
        }
    }
};
