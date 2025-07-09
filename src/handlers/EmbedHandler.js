import Logger from '../utils/Logger.js';
import { EmbedBuilder, MessageFlags, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } from 'discord.js';

const logger = new Logger();

export async function handleEditTemplate(interaction, template) {
    try {
        const templateData = interaction.client.embedTemplates?.get(interaction.user.id);
        
        if (!templateData || templateData.template !== template) {
            return await interaction.reply({
                content: '❌ Template non trouvé ou expiré. Veuillez relancer la commande.',
                flags: MessageFlags.Ephemeral
            });
        }

        const editModal = new ModalBuilder()
            .setCustomId(`edit_template_modal_${template}`)
            .setTitle(`✏️ Modifier Template: ${template}`);

        const titleInput = new TextInputBuilder()
            .setCustomId('template_title')
            .setLabel('📋 Titre')
            .setStyle(TextInputStyle.Short)
            .setValue(templateData.data.title)
            .setRequired(true)
            .setMaxLength(256);

        const descriptionInput = new TextInputBuilder()
            .setCustomId('template_description')
            .setLabel('📄 Description')
            .setStyle(TextInputStyle.Paragraph)
            .setValue(templateData.data.description)
            .setRequired(true)
            .setMaxLength(4096);

        const colorInput = new TextInputBuilder()
            .setCustomId('template_color')
            .setLabel('🎨 Couleur (hex)')
            .setStyle(TextInputStyle.Short)
            .setValue(templateData.data.color)
            .setRequired(false);

        const footerInput = new TextInputBuilder()
            .setCustomId('template_footer')
            .setLabel('📝 Footer')
            .setStyle(TextInputStyle.Short)
            .setValue(templateData.data.footer)
            .setRequired(false)
            .setMaxLength(2048);

        editModal.addComponents(
            new ActionRowBuilder().addComponents(titleInput),
            new ActionRowBuilder().addComponents(descriptionInput),
            new ActionRowBuilder().addComponents(colorInput),
            new ActionRowBuilder().addComponents(footerInput)
        );

        await interaction.showModal(editModal);

    } catch (error) {
        logger.error('Erreur lors de l\'édition du template:', error);
        await interaction.reply({
            content: '❌ Erreur lors de l\'édition du template.',
            flags: MessageFlags.Ephemeral
        });
    }
}

export async function handleSendTemplate(interaction, template) {
    try {
        // Utiliser le validateur d'interactions pour une déférence rapide
            const validator = interaction.client.interactionValidator;
            const deferred = await validator.quickDefer(interaction, { flags: MessageFlags.Ephemeral });
            
            if (!deferred) {
                return; // Interaction expirée ou déjà traitée
            }

        const templateData = interaction.client.embedTemplates?.get(interaction.user.id);
        
        if (!templateData || templateData.template !== template) {
            return await interaction.editReply({
                content: '❌ Template non trouvé ou expiré. Veuillez relancer la commande.'
            });
        }

        const sentMessage = await interaction.channel.send({
            embeds: [templateData.embed]
        });

        logger.success(`Template ${template} envoyé par ${interaction.user.tag} dans #${interaction.channel.name}`);

        await interaction.editReply({
            content: `✅ **Template envoyé avec succès !**\n\n📍 **Canal :** ${interaction.channel}\n🆔 **Message ID :** \`${sentMessage.id}\`\n🎨 **Template :** \`${template}\`\n\n[🔗 Aller au message](${sentMessage.url})`
        });

        // Nettoyer les données temporaires
        interaction.client.embedTemplates?.delete(interaction.user.id);

    } catch (error) {
        logger.error('Erreur lors de l\'envoi du template:', error);
        await interaction.editReply({
            content: '❌ Erreur lors de l\'envoi du template. Vérifiez les permissions du bot.'
        });
    }
}

export async function handlePreviewTemplate(interaction, template) {
    try {
        const templateData = interaction.client.embedTemplates?.get(interaction.user.id);
        
        if (!templateData || templateData.template !== template) {
            return await interaction.reply({
                content: '❌ Template non trouvé ou expiré. Veuillez relancer la commande.',
                flags: MessageFlags.Ephemeral
            });
        }

        const embedJson = JSON.stringify(templateData.embed.toJSON(), null, 2);
        
        await interaction.reply({
            content: `📄 **Aperçu JSON du template "${template}" :**\n\`\`\`json\n${embedJson.substring(0, 1900)}\n\`\`\`${embedJson.length > 1900 ? '\n*JSON tronqué pour l\'affichage*' : ''}`,
            flags: MessageFlags.Ephemeral
        });

    } catch (error) {
        await interaction.reply({
            content: '❌ Erreur lors de la génération de l\'aperçu JSON.',
            flags: MessageFlags.Ephemeral
        });
    }
}

export async function handleEmbedBuilder(interaction) {
    try {
        const builderData = interaction.client.embedBuilder?.get(interaction.user.id);
        
        if (!builderData) {
            return await interaction.reply({
                content: '❌ Session du constructeur expirée. Veuillez relancer la commande.',
                flags: MessageFlags.Ephemeral
            });
        }

        const action = interaction.customId.split('_')[1];

        switch (action) {
            case 'step1':
                await showBuilderStep1Modal(interaction);
                break;
            case 'step2':
                await showBuilderStep2Modal(interaction);
                break;
            case 'step3':
                await showBuilderStep3Modal(interaction);
                break;
            case 'step4':
                await showBuilderStep4Modal(interaction);
                break;
            case 'preview':
                await showBuilderPreview(interaction);
                break;
            case 'send':
                await sendBuilderEmbed(interaction);
                break;
        }

    } catch (error) {
        logger.error('Erreur dans le constructeur d\'embed:', error);
        await interaction.reply({
            content: '❌ Erreur dans le constructeur d\'embed.',
            flags: MessageFlags.Ephemeral
        });
    }
}

async function showBuilderStep1Modal(interaction) {
    const builderData = interaction.client.embedBuilder.get(interaction.user.id);
    
    const modal = new ModalBuilder()
        .setCustomId('builder_step1_modal')
        .setTitle('1️⃣ Titre & Description');

    const titleInput = new TextInputBuilder()
        .setCustomId('builder_title')
        .setLabel('📋 Titre de l\'embed')
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setMaxLength(256)
        .setPlaceholder('Entrez le titre de votre embed...');

    const descriptionInput = new TextInputBuilder()
        .setCustomId('builder_description')
        .setLabel('📄 Description')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true)
        .setMaxLength(4096)
        .setPlaceholder('Entrez la description de votre embed...');

    if (builderData.data.title) titleInput.setValue(builderData.data.title);
    if (builderData.data.description) descriptionInput.setValue(builderData.data.description);

    modal.addComponents(
        new ActionRowBuilder().addComponents(titleInput),
        new ActionRowBuilder().addComponents(descriptionInput)
    );

    await interaction.showModal(modal);
}

async function showBuilderStep2Modal(interaction) {
    const builderData = interaction.client.embedBuilder.get(interaction.user.id);
    
    const modal = new ModalBuilder()
        .setCustomId('builder_step2_modal')
        .setTitle('2️⃣ Couleur & Images');

    const colorInput = new TextInputBuilder()
        .setCustomId('builder_color')
        .setLabel('🎨 Couleur (hex ou nom)')
        .setStyle(TextInputStyle.Short)
        .setRequired(false)
        .setPlaceholder('#5865f2 ou bleu');

    const thumbnailInput = new TextInputBuilder()
        .setCustomId('builder_thumbnail')
        .setLabel('🖼️ URL Miniature (optionnel)')
        .setStyle(TextInputStyle.Short)
        .setRequired(false)
        .setPlaceholder('https://exemple.com/image.png');

    const imageInput = new TextInputBuilder()
        .setCustomId('builder_image')
        .setLabel('🖼️ URL Image principale (optionnel)')
        .setStyle(TextInputStyle.Short)
        .setRequired(false)
        .setPlaceholder('https://exemple.com/image.png');

    if (builderData.data.color) colorInput.setValue(builderData.data.color);
    if (builderData.data.thumbnail) thumbnailInput.setValue(builderData.data.thumbnail);
    if (builderData.data.image) imageInput.setValue(builderData.data.image);

    modal.addComponents(
        new ActionRowBuilder().addComponents(colorInput),
        new ActionRowBuilder().addComponents(thumbnailInput),
        new ActionRowBuilder().addComponents(imageInput)
    );

    await interaction.showModal(modal);
}

async function showBuilderStep3Modal(interaction) {
    const modal = new ModalBuilder()
        .setCustomId('builder_step3_modal')
        .setTitle('3️⃣ Ajouter des Champs');

    const fieldsInput = new TextInputBuilder()
        .setCustomId('builder_fields')
        .setLabel('📋 Champs (format: nom|valeur|inline)')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(false)
        .setPlaceholder('Champ 1|Valeur 1|true\nChamp 2|Valeur 2|false\n(une ligne par champ)');

    modal.addComponents(
        new ActionRowBuilder().addComponents(fieldsInput)
    );

    await interaction.showModal(modal);
}

async function showBuilderStep4Modal(interaction) {
    const builderData = interaction.client.embedBuilder.get(interaction.user.id);
    
    const modal = new ModalBuilder()
        .setCustomId('builder_step4_modal')
        .setTitle('4️⃣ Footer & Options');

    const footerInput = new TextInputBuilder()
        .setCustomId('builder_footer')
        .setLabel('📝 Texte du footer (optionnel)')
        .setStyle(TextInputStyle.Short)
        .setRequired(false)
        .setMaxLength(2048)
        .setPlaceholder('Texte du footer...');

    const timestampInput = new TextInputBuilder()
        .setCustomId('builder_timestamp')
        .setLabel('⏰ Timestamp (true/false)')
        .setStyle(TextInputStyle.Short)
        .setRequired(false)
        .setPlaceholder('true ou false');

    if (builderData.data.footer) footerInput.setValue(builderData.data.footer);
    if (builderData.data.timestamp !== undefined) timestampInput.setValue(builderData.data.timestamp.toString());

    modal.addComponents(
        new ActionRowBuilder().addComponents(footerInput),
        new ActionRowBuilder().addComponents(timestampInput)
    );

    await interaction.showModal(modal);
}

async function showBuilderPreview(interaction) {
    try {
        const builderData = interaction.client.embedBuilder.get(interaction.user.id);
        
        if (!builderData.data.title || !builderData.data.description) {
            return await interaction.reply({
                content: '❌ Veuillez d\'abord définir au moins un titre et une description (Étape 1).',
                flags: MessageFlags.Ephemeral
            });
        }

        const embed = new EmbedBuilder()
            .setTitle(builderData.data.title)
            .setDescription(builderData.data.description);

        if (builderData.data.color) embed.setColor(builderData.data.color);
        if (builderData.data.thumbnail) embed.setThumbnail(builderData.data.thumbnail);
        if (builderData.data.image) embed.setImage(builderData.data.image);
        if (builderData.data.footer) embed.setFooter({ text: builderData.data.footer });
        if (builderData.data.timestamp) embed.setTimestamp();
        if (builderData.data.fields && builderData.data.fields.length > 0) {
            embed.addFields(builderData.data.fields);
        }

        await interaction.reply({
            content: '👁️ **Aperçu de votre embed :**',
            embeds: [embed],
            flags: MessageFlags.Ephemeral
        });

    } catch (error) {
        await interaction.reply({
            content: '❌ Erreur lors de la génération de l\'aperçu.',
            flags: MessageFlags.Ephemeral
        });
    }
}

async function sendBuilderEmbed(interaction) {
    try {
        // Utiliser le validateur d'interactions pour une déférence rapide
            const validator = interaction.client.interactionValidator;
            const deferred = await validator.quickDefer(interaction, { flags: MessageFlags.Ephemeral });
            
            if (!deferred) {
                return; // Interaction expirée ou déjà traitée
            }

        const builderData = interaction.client.embedBuilder.get(interaction.user.id);
        
        if (!builderData.data.title || !builderData.data.description) {
            return await interaction.editReply({
                content: '❌ Veuillez d\'abord définir au moins un titre et une description (Étape 1).'
            });
        }

        const embed = new EmbedBuilder()
            .setTitle(builderData.data.title)
            .setDescription(builderData.data.description);

        if (builderData.data.color) embed.setColor(builderData.data.color);
        if (builderData.data.thumbnail) embed.setThumbnail(builderData.data.thumbnail);
        if (builderData.data.image) embed.setImage(builderData.data.image);
        if (builderData.data.footer) embed.setFooter({ text: builderData.data.footer });
        if (builderData.data.timestamp) embed.setTimestamp();
        if (builderData.data.fields && builderData.data.fields.length > 0) {
            embed.addFields(builderData.data.fields);
        }

        const sentMessage = await builderData.targetChannel.send({ embeds: [embed] });

        logger.success(`Embed construit envoyé par ${interaction.user.tag} dans #${builderData.targetChannel.name}`);

        await interaction.editReply({
            content: `✅ **Embed envoyé avec succès !**\n\n📍 **Canal :** ${builderData.targetChannel}\n🆔 **Message ID :** \`${sentMessage.id}\`\n\n[🔗 Aller au message](${sentMessage.url})`
        });

        // Nettoyer les données
        interaction.client.embedBuilder.delete(interaction.user.id);

    } catch (error) {
        logger.error('Erreur lors de l\'envoi de l\'embed construit:', error);
        await interaction.editReply({
            content: '❌ Erreur lors de l\'envoi de l\'embed. Vérifiez les permissions du bot.'
        });
    }
}
