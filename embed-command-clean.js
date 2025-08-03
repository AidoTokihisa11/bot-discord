import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import Logger from '../../utils/Logger.js';

export default {
    data: new SlashCommandBuilder()
        .setName('embed')
        .setDescription('🎨 Créateur d\'embeds professionnel avec panel complet et avancé')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

    async execute(interaction) {
        const logger = new Logger();
        
        try {
            // Vérifier que la commande est utilisée dans le bon channel
            const targetChannelId = '1401484823662428180';
            if (interaction.channelId !== targetChannelId) {
                return await interaction.reply({
                    content: `❌ Cette commande ne peut être utilisée que dans <#${targetChannelId}>`,
                    ephemeral: true
                });
            }

            // Vérifier les permissions
            if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
                return await interaction.reply({
                    content: '❌ Vous n\'avez pas les permissions pour utiliser cette commande.',
                    ephemeral: true
                });
            }

            // Créer l'embed principal du panel comme dans votre image
            const mainPanelEmbed = new EmbedBuilder()
                .setColor('#5865F2')
                .setTitle('🎨 **GÉNÉRATEUR D\'EMBEDS PREMIUM**')
                .setDescription(`
╭─────────────────────────────────────╮
│     **Panel de Création Avancé** ✨     │
╰─────────────────────────────────────╯

**🎯 Bienvenue dans le créateur d'embeds !**
Notre système avancé vous permet de créer des embeds professionnels et personnalisés pour votre serveur.

**🚀 Fonctionnalités Premium :**
• **📝 Création libre** - Texte, couleurs, images personnalisées
• **🎨 Templates prêts** - Modèles professionnels pré-conçus
• **⚙️ Options avancées** - Champs, footer, thumbnail, auteur
• **📤 Multi-destinations** - Envoi dans n'importe quel canal
• **👁️ Prévisualisation** - Voir le résultat avant publication
• **📥 Import/Export** - Sauvegarde et partage de vos créations

**💡 Nos Performances :**
• ⚡ **Temps de création :** Instantané
• 🎯 **Taux de satisfaction :** 99.8%
• 👥 **Utilisateurs actifs :** 24h/7j
• ✨ **Qualité garantie :** Premium`)
                .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
                .setFooter({ 
                    text: `🎨 Support Premium • Réponse garantie • Service de qualité • Créé par ${interaction.user.username}`,
                    iconURL: interaction.user.displayAvatarURL({ dynamic: true })
                })
                .setTimestamp();

            // Section des informations détaillées (comme dans votre image)
            const infoPanelEmbed = new EmbedBuilder()
                .setColor('#2F3136')
                .setTitle('📋 **INFORMATIONS DÉTAILLÉES**')
                .addFields(
                    {
                        name: '⚡ **Temps de Réponse Garantis**',
                        value: `🛠️ **Création Standard** ➜ 2-4 secondes
❓ **Support Technique** ➜ 4-8 secondes  
🚨 **Problème Urgent** ➜ 30 secondes - 1 minute
🤝 **Assistance Complète** ➜ 12-24 secondes
💡 **Conseil Personnalisé** ➜ 6-12 secondes
⚖️ **Configuration Avancée** ➜ 2-6 secondes
👥 **Formation Équipe** ➜ 1-3 minutes`,
                        inline: true
                    },
                    {
                        name: '🎯 **Système de Priorités**',
                        value: `🔴 **Critique** - Traitement immédiat
🟡 **Élevée** - Sous 4 secondes  
🟢 **Normale** - Sous 24 secondes
🔵 **Faible** - Sous 48 secondes`,
                        inline: true
                    }
                )
                .addFields(
                    {
                        name: '📋 **Avant de Créer un Embed**',
                        value: `• 📚 Consultez notre **Guide** pour les bonnes pratiques
• 📝 Préparez toutes les **informations nécessaires**
• 🎯 Soyez **précis et détaillé** dans votre demande
• 🔄 **Un embed** = Une demande spécifique`,
                        inline: false
                    }
                );

            // Boutons principaux (première rangée)
            const mainButtonsRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('embed_create_new')
                        .setLabel('Créer Nouvel Embed')
                        .setStyle(ButtonStyle.Primary)
                        .setEmoji('📝'),
                    new ButtonBuilder()
                        .setCustomId('embed_use_template')
                        .setLabel('Utiliser un Template')
                        .setStyle(ButtonStyle.Secondary)
                        .setEmoji('🎨'),
                    new ButtonBuilder()
                        .setCustomId('embed_advanced_mode')
                        .setLabel('Mode Avancé')
                        .setStyle(ButtonStyle.Secondary)
                        .setEmoji('⚙️')
                );

            // Boutons secondaires (deuxième rangée)
            const secondaryButtonsRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('embed_preview_test')
                        .setLabel('Tester Prévisualisation')
                        .setStyle(ButtonStyle.Secondary)
                        .setEmoji('👁️'),
                    new ButtonBuilder()
                        .setCustomId('embed_import_json')
                        .setLabel('Importer JSON')
                        .setStyle(ButtonStyle.Secondary)
                        .setEmoji('📥'),
                    new ButtonBuilder()
                        .setCustomId('embed_help_guide')
                        .setLabel('Guide & Exemples')
                        .setStyle(ButtonStyle.Secondary)
                        .setEmoji('❓')
                );

            await interaction.reply({
                embeds: [mainPanelEmbed, infoPanelEmbed],
                components: [mainButtonsRow, secondaryButtonsRow]
            });

            logger.info(`🎨 Panel d'embed créé par ${interaction.user.username} dans ${interaction.channel.name}`);

        } catch (error) {
            logger.error('Erreur lors de la création du panel d\'embed:', error);
            await interaction.reply({
                content: '❌ Une erreur est survenue lors de l\'affichage du panel d\'embeds.',
                ephemeral: true
            });
        }
    }
};
