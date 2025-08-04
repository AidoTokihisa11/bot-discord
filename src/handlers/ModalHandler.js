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
        // Modals du système de streams (désactivé)
        else if (customId.startsWith('stream_')) {
            await interaction.reply({
                content: '❌ Le système de streams n\'est pas disponible.',
                ephemeral: true
            });
        }
        // Modals d'embed
        else if (customId === 'advanced_embed_modal') {
            await handleAdvancedEmbedModal(interaction);
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
