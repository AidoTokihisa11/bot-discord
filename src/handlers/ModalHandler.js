import TicketManager from '../managers/TicketManager.js';
import Logger from '../utils/Logger.js';
import { EmbedBuilder, MessageFlags } from 'discord.js';

const logger = new Logger();

export async function handleModal(interaction) {
    const { customId } = interaction;

    try {
        // Vérification immédiate de l'état de l'interaction
        if (interaction.replied || interaction.deferred) {
            logger.warn('⚠️ Interaction modal déjà traitée, abandon silencieux...');
            return;
        }

        // Modals de tickets
        if (customId.startsWith('ticket_modal_')) {
            if (!interaction.client.ticketManager) {
                interaction.client.ticketManager = new TicketManager(interaction.client);
            }
            await interaction.client.ticketManager.handleModalSubmit(interaction);
        }
        // Modals de suggestions
        else if (customId.startsWith('suggestion_modal_')) {
            if (!interaction.client.ticketManager) {
                interaction.client.ticketManager = new TicketManager(interaction.client);
            }
            await interaction.client.ticketManager.handleSuggestionModalSubmit(interaction);
        }
        // Modals de recrutement
        else if (customId.startsWith('recruitment_modal_')) {
            if (!interaction.client.ticketManager) {
                interaction.client.ticketManager = new TicketManager(interaction.client);
            }
            await interaction.client.ticketManager.handleRecruitmentModalSubmit(interaction);
        }
        // Modal d'ajout d'utilisateur
        else if (customId === 'add_user_modal') {
            if (!interaction.client.ticketManager) {
                interaction.client.ticketManager = new TicketManager(interaction.client);
            }
            await interaction.client.ticketManager.handleAddUserModal(interaction);
        }
        // Modals de feedback de suggestions
        else if (customId.startsWith('suggestion_feedback_')) {
            if (!interaction.client.ticketManager) {
                interaction.client.ticketManager = new TicketManager(interaction.client);
            }
            await interaction.client.ticketManager.handleSuggestionFeedbackModal(interaction);
        }
        // Modals d'embed
        else if (customId === 'advanced_embed_modal') {
            await handleAdvancedEmbedModal(interaction);
        }
        else if (customId.startsWith('edit_template_modal_')) {
            await handleEditTemplateModal(interaction);
        }
        else if (customId.startsWith('builder_step')) {
            await handleBuilderModal(interaction);
        }
        // Modal de personnalisation IA
        else if (customId === 'ia_customize_modal') {
            await handleIACustomizeModal(interaction);
        }
        else {
            logger.warn(`Modal non géré: ${customId}`);
        }

    } catch (error) {
        // Gestion d'erreur robuste
        if (error.code === 10062) {
            logger.warn('⏰ Interaction modal expirée (10062) - abandon silencieux');
            return;
        }
        
        if (error.code === 40060) {
            logger.warn('⚠️ Interaction modal déjà acquittée (40060) - abandon silencieux');
            return;
        }

        logger.error('Erreur lors de la gestion du modal:', error);
        
        try {
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                    content: '❌ Une erreur est survenue lors du traitement de votre formulaire.',
                    flags: MessageFlags.Ephemeral
                });
            }
        } catch (replyError) {
            if (replyError.code === 10062 || replyError.code === 40060) {
                logger.warn('⏰ Impossible de répondre à l\'erreur de modal - interaction expirée');
            } else {
                logger.error('Impossible de répondre à l\'erreur de modal:', replyError);
            }
        }
    }
}

async function handleAdvancedEmbedModal(interaction) {
    try {
        // Vérification préventive
        if (interaction.replied || interaction.deferred) {
            logger.warn('⚠️ Interaction embed modal déjà traitée');
            return;
        }

        // Utiliser le validateur d'interactions pour une déférence rapide
            const validator = interaction.client.interactionValidator;
            const deferred = await validator.quickDefer(interaction, { flags: MessageFlags.Ephemeral });
            
            if (!deferred) {
                return; // Interaction expirée ou déjà traitée
            }

        const title = interaction.fields.getTextInputValue('embed_title');
        const description = interaction.fields.getTextInputValue('embed_description');
        const color = interaction.fields.getTextInputValue('embed_color') || '#5865f2';
        const footer = interaction.fields.getTextInputValue('embed_footer') || '';
        const thumbnail = interaction.fields.getTextInputValue('embed_thumbnail') || '';

        const embed = new EmbedBuilder()
            .setTitle(title)
            .setDescription(description)
            .setColor(color)
            .setTimestamp();

        if (footer) embed.setFooter({ text: footer });
        if (thumbnail) embed.setThumbnail(thumbnail);

        const sentMessage = await interaction.channel.send({ embeds: [embed] });

        logger.success(`Embed avancé créé par ${interaction.user.tag} dans #${interaction.channel.name}`);

        await interaction.editReply({
            content: `✅ **Embed créé avec succès !**\n\n📍 **Canal :** ${interaction.channel}\n🆔 **Message ID :** \`${sentMessage.id}\`\n\n[🔗 Aller au message](${sentMessage.url})`
        });

    } catch (error) {
        if (error.code === 10062 || error.code === 40060) {
            logger.warn('⏰ Erreur d\'interaction expirée dans handleAdvancedEmbedModal');
            return;
        }
        
        logger.error('Erreur lors de la création de l\'embed avancé:', error);
        
        try {
            if (interaction.deferred) {
                await interaction.editReply({
                    content: '❌ Erreur lors de la création de l\'embed. Vérifiez les paramètres.'
                });
            }
        } catch (editError) {
            logger.warn('⏰ Impossible d\'éditer la réponse - interaction expirée');
        }
    }
}

async function handleEditTemplateModal(interaction) {
    try {
        // Vérification préventive
        if (interaction.replied || interaction.deferred) {
            logger.warn('⚠️ Interaction template modal déjà traitée');
            return;
        }

        const template = interaction.customId.split('_')[3];
        const templateData = interaction.client.embedTemplates?.get(interaction.user.id);
        
        if (!templateData || templateData.template !== template) {
            return await interaction.reply({
                content: '❌ Template non trouvé ou expiré.',
                flags: MessageFlags.Ephemeral
            });
        }

        const title = interaction.fields.getTextInputValue('template_title');
        const description = interaction.fields.getTextInputValue('template_description');
        const color = interaction.fields.getTextInputValue('template_color') || '#5865f2';
        const footer = interaction.fields.getTextInputValue('template_footer') || '';

        // Mettre à jour l'embed
        const updatedEmbed = new EmbedBuilder()
            .setTitle(title)
            .setDescription(description)
            .setColor(color)
            .setTimestamp();

        if (footer) updatedEmbed.setFooter({ text: footer });

        // Mettre à jour les données
        templateData.embed = updatedEmbed;
        templateData.data = { title, description, color, footer };

        await interaction.reply({
            content: `✅ **Template "${template}" modifié avec succès !**\nUtilisez les boutons pour l'envoyer ou le prévisualiser.`,
            flags: MessageFlags.Ephemeral
        });

    } catch (error) {
        if (error.code === 10062 || error.code === 40060) {
            logger.warn('⏰ Erreur d\'interaction expirée dans handleEditTemplateModal');
            return;
        }
        
        logger.error('Erreur lors de la modification du template:', error);
        
        try {
            if (!interaction.replied) {
                await interaction.reply({
                    content: '❌ Erreur lors de la modification du template.',
                    flags: MessageFlags.Ephemeral
                });
            }
        } catch (replyError) {
            logger.warn('⏰ Impossible de répondre - interaction expirée');
        }
    }
}

async function handleBuilderModal(interaction) {
    try {
        // Vérification préventive
        if (interaction.replied || interaction.deferred) {
            logger.warn('⚠️ Interaction builder modal déjà traitée');
            return;
        }

        const stepNumber = interaction.customId.split('_')[1].replace('step', '').replace('modal', '');
        const builderData = interaction.client.embedBuilder?.get(interaction.user.id);
        
        if (!builderData) {
            return await interaction.reply({
                content: '❌ Session du constructeur expirée.',
                flags: MessageFlags.Ephemeral
            });
        }

        switch (stepNumber) {
            case '1':
                await handleBuilderStep1(interaction, builderData);
                break;
            case '2':
                await handleBuilderStep2(interaction, builderData);
                break;
            case '3':
                await handleBuilderStep3(interaction, builderData);
                break;
            case '4':
                await handleBuilderStep4(interaction, builderData);
                break;
        }

    } catch (error) {
        if (error.code === 10062 || error.code === 40060) {
            logger.warn('⏰ Erreur d\'interaction expirée dans handleBuilderModal');
            return;
        }
        
        logger.error('Erreur lors du traitement du modal constructeur:', error);
        
        try {
            if (!interaction.replied) {
                await interaction.reply({
                    content: '❌ Erreur lors du traitement du formulaire.',
                    flags: MessageFlags.Ephemeral
                });
            }
        } catch (replyError) {
            logger.warn('⏰ Impossible de répondre - interaction expirée');
        }
    }
}

async function handleBuilderStep1(interaction, builderData) {
    try {
        const title = interaction.fields.getTextInputValue('builder_title');
        const description = interaction.fields.getTextInputValue('builder_description');

        builderData.data.title = title;
        builderData.data.description = description;

        await interaction.reply({
            content: '✅ **Étape 1 complétée !** Titre et description sauvegardés.\nPassez à l\'étape suivante avec les boutons.',
            flags: MessageFlags.Ephemeral
        });
    } catch (error) {
        if (error.code === 10062 || error.code === 40060) {
            logger.warn('⏰ Erreur d\'interaction expirée dans handleBuilderStep1');
            return;
        }
        throw error;
    }
}

async function handleBuilderStep2(interaction, builderData) {
    try {
        const color = interaction.fields.getTextInputValue('builder_color') || '#5865f2';
        const thumbnail = interaction.fields.getTextInputValue('builder_thumbnail') || '';
        const image = interaction.fields.getTextInputValue('builder_image') || '';

        builderData.data.color = color;
        builderData.data.thumbnail = thumbnail;
        builderData.data.image = image;

        await interaction.reply({
            content: '✅ **Étape 2 complétée !** Couleur et images sauvegardées.\nPassez à l\'étape suivante avec les boutons.',
            flags: MessageFlags.Ephemeral
        });
    } catch (error) {
        if (error.code === 10062 || error.code === 40060) {
            logger.warn('⏰ Erreur d\'interaction expirée dans handleBuilderStep2');
            return;
        }
        throw error;
    }
}

async function handleBuilderStep3(interaction, builderData) {
    try {
        const fieldsText = interaction.fields.getTextInputValue('builder_fields') || '';
        
        if (fieldsText.trim()) {
            const fields = [];
            const lines = fieldsText.split('\n');
            
            for (const line of lines) {
                const parts = line.split('|');
                if (parts.length >= 2) {
                    fields.push({
                        name: parts[0].trim(),
                        value: parts[1].trim(),
                        inline: parts[2]?.trim().toLowerCase() === 'true'
                    });
                }
            }
            
            builderData.data.fields = fields;
        }

        await interaction.reply({
            content: `✅ **Étape 3 complétée !** ${builderData.data.fields?.length || 0} champ(s) ajouté(s).\nPassez à l\'étape suivante avec les boutons.`,
            flags: MessageFlags.Ephemeral
        });
    } catch (error) {
        if (error.code === 10062 || error.code === 40060) {
            logger.warn('⏰ Erreur d\'interaction expirée dans handleBuilderStep3');
            return;
        }
        throw error;
    }
}

async function handleBuilderStep4(interaction, builderData) {
    try {
        const footer = interaction.fields.getTextInputValue('builder_footer') || '';
        const timestamp = interaction.fields.getTextInputValue('builder_timestamp') || 'false';

        builderData.data.footer = footer;
        builderData.data.timestamp = timestamp.toLowerCase() === 'true';

        await interaction.reply({
            content: '✅ **Étape 4 complétée !** Footer et options sauvegardés.\nVous pouvez maintenant prévisualiser ou envoyer votre embed.',
            flags: MessageFlags.Ephemeral
        });
    } catch (error) {
        if (error.code === 10062 || error.code === 40060) {
            logger.warn('⏰ Erreur d\'interaction expirée dans handleBuilderStep4');
            return;
        }
        throw error;
    }
}

async function handleIACustomizeModal(interaction) {
    try {
        // Vérification préventive
        if (interaction.replied || interaction.deferred) {
            logger.warn('⚠️ Interaction IA modal déjà traitée');
            return;
        }

        // Utiliser le validateur d'interactions pour une déférence rapide
            const validator = interaction.client.interactionValidator;
            const deferred = await validator.quickDefer(interaction, { flags: MessageFlags.Ephemeral });
            
            if (!deferred) {
                return; // Interaction expirée ou déjà traitée
            }

        const iaData = interaction.client.embedIA?.get(interaction.user.id);
        if (!iaData) {
            return await interaction.editReply({
                content: '❌ Données IA expirées. Veuillez relancer la génération.'
            });
        }

        const title = interaction.fields.getTextInputValue('ia_custom_title');
        const description = interaction.fields.getTextInputValue('ia_custom_description');
        const color = interaction.fields.getTextInputValue('ia_custom_color') || iaData.generatedContent.color;

        // Mettre à jour l'embed IA
        const updatedEmbed = new EmbedBuilder()
            .setTitle(title)
            .setDescription(description)
            .setColor(color)
            .setFooter({ text: 'Embed IA Personnalisé', iconURL: interaction.client.user.displayAvatarURL() })
            .setTimestamp();

        // Mettre à jour les données
        iaData.generatedEmbed = updatedEmbed;
        iaData.generatedContent.title = title;
        iaData.generatedContent.description = description;
        iaData.generatedContent.color = color;

        await interaction.editReply({
            content: '✅ **Embed IA personnalisé avec succès !**\nUtilisez les boutons pour le déployer ou voir d\'autres options.',
            embeds: [updatedEmbed]
        });

    } catch (error) {
        if (error.code === 10062 || error.code === 40060) {
            logger.warn('⏰ Erreur d\'interaction expirée dans handleIACustomizeModal');
            return;
        }
        
        logger.error('Erreur lors de la personnalisation IA:', error);
        
        try {
            if (interaction.deferred) {
                await interaction.editReply({
                    content: '❌ Erreur lors de la personnalisation de l\'embed IA.'
                });
            }
        } catch (editError) {
            logger.warn('⏰ Impossible d\'éditer la réponse - interaction expirée');
        }
    }
}
