import { 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    StringSelectMenuBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ChannelType
} from 'discord.js';

export default class EmbedHandler {
    constructor(client) {
        this.client = client;
        this.embedData = new Map(); // Stockage temporaire des embeds en cours
    }

    async handleEmbedInteraction(interaction) {
        try {
            const customId = interaction.customId;

            switch (customId) {
                case 'embed_create_new':
                    await this.showEmbedCreator(interaction);
                    break;
                case 'embed_use_template':
                    await this.showTemplateSelector(interaction);
                    break;
                case 'embed_quick_message':
                    await this.showQuickMessageModal(interaction);
                    break;
                case 'embed_template_announcement':
                    await this.useTemplate(interaction, 'announcement');
                    break;
                case 'embed_template_rules':
                    await this.useTemplate(interaction, 'rules');
                    break;
                case 'embed_template_event':
                    await this.useTemplate(interaction, 'event');
                    break;
                case 'embed_template_info':
                    await this.useTemplate(interaction, 'info');
                    break;
                case 'embed_customize':
                    await this.showCustomizeOptions(interaction);
                    break;
                case 'embed_set_color':
                    await this.showColorSelector(interaction);
                    break;
                case 'embed_set_content':
                    await this.showContentModal(interaction);
                    break;
                case 'embed_set_channel':
                    await this.showChannelSelector(interaction);
                    break;
                case 'embed_preview':
                    await this.showPreview(interaction);
                    break;
                case 'embed_send':
                    await this.sendEmbed(interaction);
                    break;
                case 'embed_cancel':
                    await this.cancelCreation(interaction);
                    break;
                default:
                    // Gestion des interactions avec ID dynamiques
                    if (customId.startsWith('embed_color_')) {
                        await this.setColor(interaction);
                    } else if (customId.startsWith('embed_channel_')) {
                        await this.setChannel(interaction);
                    }
                    break;
            }
        } catch (error) {
            console.error('Erreur dans EmbedHandler:', error);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                    content: '❌ Une erreur est survenue lors du traitement.',
                    ephemeral: true
                });
            }
        }
    }

    async showCustomizeOptions(interaction) {
        const userData = this.embedData.get(interaction.user.id);
        
        if (!userData) {
            return await interaction.reply({
                content: '❌ Aucun embed en cours de création.',
                ephemeral: true
            });
        }

        const customizeEmbed = new EmbedBuilder()
            .setColor(userData.color || '#5865F2')
            .setTitle('🎨 **PERSONNALISATION DE L\'EMBED**')
            .setDescription(`
**📋 Configuration actuelle :**
• **Titre :** ${userData.title || '*Non défini*'}
• **Description :** ${userData.description || '*Non définie*'}
• **Couleur :** \`${userData.color || '#5865F2'}\`
• **Pied de page :** ${userData.footer || '*Non défini*'}
• **Canal :** ${userData.targetChannel ? `<#${userData.targetChannel}>` : '*Non sélectionné*'}

**⚙️ Options de personnalisation :**
Utilisez les boutons ci-dessous pour modifier votre embed.`)
            .setFooter({ text: 'Personnalisation avancée de l\'embed' });

        const customizeButtons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('embed_set_content')
                    .setLabel('Modifier Contenu')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('📝'),
                new ButtonBuilder()
                    .setCustomId('embed_set_color')
                    .setLabel('Changer Couleur')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('🎨'),
                new ButtonBuilder()
                    .setCustomId('embed_set_channel')
                    .setLabel('Canal Destination')
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('📍')
            );

        const actionButtons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('embed_preview')
                    .setLabel('Aperçu')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('👁️'),
                new ButtonBuilder()
                    .setCustomId('embed_send')
                    .setLabel('Envoyer')
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('🚀'),
                new ButtonBuilder()
                    .setCustomId('embed_cancel')
                    .setLabel('Annuler')
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji('❌')
            );

        await interaction.reply({
            embeds: [customizeEmbed],
            components: [customizeButtons, actionButtons],
            ephemeral: true
        });
    }

    async showEmbedCreator(interaction) {
        // Initialiser les données d'embed pour cet utilisateur
        this.embedData.set(interaction.user.id, {
            title: '',
            description: '',
            color: '#5865F2',
            thumbnail: null,
            image: null,
            fields: [],
            footer: '',
            targetChannel: null
        });

        const creatorEmbed = new EmbedBuilder()
            .setColor('#5865F2')
            .setTitle('🎨 **CRÉATEUR D\'EMBED - CONFIGURATION**')
            .setDescription(`
**📋 Configuration actuelle :**
• **Titre :** *Non défini*
• **Description :** *Non définie*
• **Couleur :** \`#5865F2\` (Bleu Discord)
• **Canal de destination :** *Non sélectionné*

**⚡ Étapes :**
1️⃣ Définir le contenu (titre, description)
2️⃣ Choisir une couleur
3️⃣ Sélectionner le canal de destination
4️⃣ Prévisualiser et envoyer`)
            .setFooter({ text: 'Utilisez les boutons ci-dessous pour configurer votre embed' });

        const configButtons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('embed_set_content')
                    .setLabel('Définir Contenu')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('📝'),
                new ButtonBuilder()
                    .setCustomId('embed_set_color')
                    .setLabel('Choisir Couleur')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('🎨'),
                new ButtonBuilder()
                    .setCustomId('embed_set_channel')
                    .setLabel('Canal Destination')
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('📍')
            );

        const actionButtons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('embed_preview')
                    .setLabel('Aperçu')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('👁️'),
                new ButtonBuilder()
                    .setCustomId('embed_send')
                    .setLabel('Envoyer')
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('🚀'),
                new ButtonBuilder()
                    .setCustomId('embed_cancel')
                    .setLabel('Annuler')
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji('❌')
            );

        await interaction.reply({
            embeds: [creatorEmbed],
            components: [configButtons, actionButtons],
            ephemeral: true
        });
    }

    async showContentModal(interaction) {
        const modal = new ModalBuilder()
            .setCustomId('embed_content_modal')
            .setTitle('📝 Contenu de l\'Embed');

        const titleInput = new TextInputBuilder()
            .setCustomId('embed_title')
            .setLabel('Titre de l\'embed')
            .setStyle(TextInputStyle.Short)
            .setMaxLength(256)
            .setPlaceholder('Entrez le titre de votre embed...')
            .setRequired(false);

        const descriptionInput = new TextInputBuilder()
            .setCustomId('embed_description')
            .setLabel('Description de l\'embed')
            .setStyle(TextInputStyle.Paragraph)
            .setMaxLength(4000)
            .setPlaceholder('Entrez la description de votre embed...')
            .setRequired(false);

        const footerInput = new TextInputBuilder()
            .setCustomId('embed_footer')
            .setLabel('Pied de page (optionnel)')
            .setStyle(TextInputStyle.Short)
            .setMaxLength(2048)
            .setPlaceholder('Texte du pied de page...')
            .setRequired(false);

        modal.addComponents(
            new ActionRowBuilder().addComponents(titleInput),
            new ActionRowBuilder().addComponents(descriptionInput),
            new ActionRowBuilder().addComponents(footerInput)
        );

        await interaction.showModal(modal);
    }

    async showColorSelector(interaction) {
        const colorEmbed = new EmbedBuilder()
            .setColor('#5865F2')
            .setTitle('🎨 **SÉLECTION DE COULEUR**')
            .setDescription('Choisissez une couleur pour votre embed :');

        const colorButtons1 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('embed_color_#e74c3c')
                    .setLabel('Rouge')
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji('🔴'),
                new ButtonBuilder()
                    .setCustomId('embed_color_#2ecc71')
                    .setLabel('Vert')
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('🟢'),
                new ButtonBuilder()
                    .setCustomId('embed_color_#3498db')
                    .setLabel('Bleu')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('🔵'),
                new ButtonBuilder()
                    .setCustomId('embed_color_#f39c12')
                    .setLabel('Orange')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('🟠'),
                new ButtonBuilder()
                    .setCustomId('embed_color_#9b59b6')
                    .setLabel('Violet')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('🟣')
            );

        const colorButtons2 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('embed_color_#1abc9c')
                    .setLabel('Turquoise')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('🔷'),
                new ButtonBuilder()
                    .setCustomId('embed_color_#e91e63')
                    .setLabel('Rose')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('🌸'),
                new ButtonBuilder()
                    .setCustomId('embed_color_#34495e')
                    .setLabel('Gris')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('⚫'),
                new ButtonBuilder()
                    .setCustomId('embed_color_#ffd700')
                    .setLabel('Or')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('🟡'),
                new ButtonBuilder()
                    .setCustomId('embed_customize')
                    .setLabel('Retour')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('↩️')
            );

        await interaction.reply({
            embeds: [colorEmbed],
            components: [colorButtons1, colorButtons2],
            ephemeral: true
        });
    }

    async showChannelSelector(interaction) {
        const channels = interaction.guild.channels.cache
            .filter(channel => channel.type === ChannelType.GuildText && channel.permissionsFor(interaction.guild.members.me).has('SendMessages'))
            .first(25);

        const channelSelect = new StringSelectMenuBuilder()
            .setCustomId('embed_channel_select')
            .setPlaceholder('Sélectionnez un canal...')
            .addOptions(
                channels.map(channel => ({
                    label: `#${channel.name}`,
                    description: channel.topic ? channel.topic.substring(0, 100) : 'Aucune description',
                    value: channel.id,
                    emoji: '📍'
                }))
            );

        const channelEmbed = new EmbedBuilder()
            .setColor('#5865F2')
            .setTitle('📍 **SÉLECTION DU CANAL**')
            .setDescription('Choisissez le canal où envoyer votre embed :');

        await interaction.reply({
            embeds: [channelEmbed],
            components: [new ActionRowBuilder().addComponents(channelSelect)],
            ephemeral: true
        });
    }

    async useTemplate(interaction, templateType) {
        const templates = {
            announcement: {
                title: '📢 Annonce Importante',
                description: 'Votre annonce importante ici...',
                color: '#3498db',
                footer: 'Équipe de modération'
            },
            rules: {
                title: '📜 Règlement du Serveur',
                description: '**Règles importantes :**\n\n1️⃣ Respectez tous les membres\n2️⃣ Pas de spam\n3️⃣ Utilisez les bons canaux',
                color: '#e74c3c',
                footer: 'Règlement officiel'
            },
            event: {
                title: '🎉 Nouvel Événement',
                description: '**Détails de l\'événement :**\n\n📅 **Date :** À définir\n⏰ **Heure :** À définir\n📍 **Lieu :** Discord',
                color: '#2ecc71',
                footer: 'Événements du serveur'
            },
            info: {
                title: 'ℹ️ Information',
                description: 'Informations importantes pour la communauté...',
                color: '#f39c12',
                footer: 'Informations officielles'
            }
        };

        const template = templates[templateType];
        
        // Sauvegarder le template pour cet utilisateur
        this.embedData.set(interaction.user.id, {
            title: template.title,
            description: template.description,
            color: template.color,
            footer: template.footer,
            thumbnail: null,
            image: null,
            fields: [],
            targetChannel: null
        });

        const templateEmbed = new EmbedBuilder()
            .setColor(template.color)
            .setTitle(template.title)
            .setDescription(template.description)
            .setFooter({ text: template.footer });

        const templateButtons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('embed_customize')
                    .setLabel('Personnaliser')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('🎨'),
                new ButtonBuilder()
                    .setCustomId('embed_set_channel')
                    .setLabel('Choisir Canal')
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('📍'),
                new ButtonBuilder()
                    .setCustomId('embed_send')
                    .setLabel('Envoyer')
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('🚀')
            );

        await interaction.reply({
            content: '✅ **Template appliqué !** Voici un aperçu :',
            embeds: [templateEmbed],
            components: [templateButtons],
            ephemeral: true
        });
    }

    async setColor(interaction) {
        const color = interaction.customId.split('_')[2];
        const userData = this.embedData.get(interaction.user.id);
        
        if (userData) {
            userData.color = color;
            this.embedData.set(interaction.user.id, userData);
        }

        await interaction.reply({
            content: `✅ Couleur définie : \`${color}\``,
            ephemeral: true
        });
    }

    async showPreview(interaction) {
        const userData = this.embedData.get(interaction.user.id);
        
        if (!userData) {
            return await interaction.reply({
                content: '❌ Aucun embed en cours de création.',
                ephemeral: true
            });
        }

        const previewEmbed = new EmbedBuilder()
            .setColor(userData.color || '#5865F2');

        if (userData.title) previewEmbed.setTitle(userData.title);
        if (userData.description) previewEmbed.setDescription(userData.description);
        if (userData.footer) previewEmbed.setFooter({ text: userData.footer });
        if (userData.thumbnail) previewEmbed.setThumbnail(userData.thumbnail);
        if (userData.image) previewEmbed.setImage(userData.image);

        await interaction.reply({
            content: '👁️ **Aperçu de votre embed :**',
            embeds: [previewEmbed],
            ephemeral: true
        });
    }

    async sendEmbed(interaction) {
        const userData = this.embedData.get(interaction.user.id);
        
        if (!userData) {
            return await interaction.reply({
                content: '❌ Aucun embed en cours de création.',
                ephemeral: true
            });
        }

        if (!userData.targetChannel) {
            return await interaction.reply({
                content: '❌ Vous devez sélectionner un canal de destination.',
                ephemeral: true
            });
        }

        const targetChannel = interaction.guild.channels.cache.get(userData.targetChannel);
        if (!targetChannel) {
            return await interaction.reply({
                content: '❌ Canal de destination introuvable.',
                ephemeral: true
            });
        }

        const finalEmbed = new EmbedBuilder()
            .setColor(userData.color || '#5865F2');

        if (userData.title) finalEmbed.setTitle(userData.title);
        if (userData.description) finalEmbed.setDescription(userData.description);
        if (userData.footer) finalEmbed.setFooter({ text: userData.footer });
        if (userData.thumbnail) finalEmbed.setThumbnail(userData.thumbnail);
        if (userData.image) finalEmbed.setImage(userData.image);

        try {
            await targetChannel.send({ embeds: [finalEmbed] });
            
            // Nettoyer les données
            this.embedData.delete(interaction.user.id);
            
            await interaction.reply({
                content: `✅ **Embed envoyé avec succès dans ${targetChannel} !**`,
                ephemeral: true
            });
        } catch (error) {
            console.error('Erreur lors de l\'envoi de l\'embed:', error);
            await interaction.reply({
                content: '❌ Erreur lors de l\'envoi de l\'embed.',
                ephemeral: true
            });
        }
    }

    async cancelCreation(interaction) {
        this.embedData.delete(interaction.user.id);
        
        await interaction.reply({
            content: '❌ **Création d\'embed annulée.**',
            ephemeral: true
        });
    }

    // Gestion des modals
    async handleEmbedModal(interaction) {
        if (interaction.customId === 'embed_content_modal') {
            const title = interaction.fields.getTextInputValue('embed_title') || '';
            const description = interaction.fields.getTextInputValue('embed_description') || '';
            const footer = interaction.fields.getTextInputValue('embed_footer') || '';

            const userData = this.embedData.get(interaction.user.id) || {};
            userData.title = title;
            userData.description = description;
            userData.footer = footer;
            
            this.embedData.set(interaction.user.id, userData);

            await interaction.reply({
                content: '✅ **Contenu sauvegardé !** Vous pouvez maintenant choisir la couleur et le canal.',
                ephemeral: true
            });
        }
    }

    // Gestion des select menus
    async handleEmbedSelectMenu(interaction) {
        if (interaction.customId === 'embed_channel_select') {
            const channelId = interaction.values[0];
            const channel = interaction.guild.channels.cache.get(channelId);
            
            const userData = this.embedData.get(interaction.user.id) || {};
            userData.targetChannel = channelId;
            
            this.embedData.set(interaction.user.id, userData);

            await interaction.reply({
                content: `✅ **Canal sélectionné :** ${channel}`,
                ephemeral: true
            });
        }
    }
}
