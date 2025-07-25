import TicketManager from '../managers/TicketManager.js';
import Logger from '../utils/Logger.js';
import { EmbedBuilder, MessageFlags } from 'discord.js';

class ButtonHandler {
    constructor(client) {
        this.client = client;
        this.logger = new Logger();
    }

    async handleButton(interaction) {
        const { customId } = interaction;

        try {
            // Vérification préalable de l'état de l'interaction
            if (interaction.replied || interaction.deferred) {
                this.logger.warn(`⚠️ Interaction ${customId} déjà traitée, abandon`);
                return;
            }

            this.logger.info(`🔘 Traitement du bouton: ${customId} par ${interaction.user.tag}`);

            // Boutons de tickets
            if (customId.startsWith('ticket_')) {
                await this.handleTicketButtons(interaction);
            }
            // Boutons de confirmation
            else if (customId === 'confirm_close' || customId === 'cancel_close') {
                await this.handleConfirmationButtons(interaction);
            }
            // Boutons de suggestions - GESTION SÉCURISÉE
            else if (customId.startsWith('suggestion_')) {
                await this.handleSuggestionButtons(interaction);
            }
            // Boutons d'embed templates
            else if (customId.startsWith('edit_template_') || customId.startsWith('send_template_') || customId.startsWith('preview_template_')) {
                await this.handleEmbedTemplateButtons(interaction);
            }
            // Boutons du constructeur d'embed
            else if (customId.startsWith('builder_')) {
                await this.handleEmbedBuilderButtons(interaction);
            }
            // Boutons IA
            else if (customId.startsWith('ia_')) {
                await this.handleIAButtons(interaction);
            }
            // Boutons de feedback modal
            else if (customId.startsWith('show_feedback_modal_')) {
                await this.handleFeedbackModalButtons(interaction);
            }
            else {
                this.logger.warn(`Bouton non géré: ${customId}`);
            }

        } catch (error) {
            // Gestion d'erreur améliorée
            if (error.code === 10062) {
                this.logger.warn('⏰ Interaction expirée, abandon silencieux');
                return;
            }
            
            if (error.code === 40060) {
                this.logger.warn('⚠️ Interaction déjà acquittée, abandon silencieux');
                return;
            }

            this.logger.error('Erreur lors de la gestion du bouton:', error);
            
            try {
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({
                        content: '❌ Une erreur est survenue lors du traitement de votre demande.',
                        flags: MessageFlags.Ephemeral
                    });
                }
            } catch (replyError) {
                if (replyError.code === 10062 || replyError.code === 40060) {
                    this.logger.warn('⏰ Impossible de répondre - interaction expirée ou déjà traitée');
                } else {
                    this.logger.error('Impossible de répondre à l\'erreur:', replyError);
                }
            }
        }
    }

    async handleTicketButtons(interaction) {
        try {
            // Vérification préalable pour éviter les interactions expirées
            if (interaction.replied || interaction.deferred) {
                this.logger.warn('⚠️ Interaction ticket déjà traitée, abandon');
                return;
            }

            // Utiliser l'instance TicketManager stockée dans le client pour optimiser
            if (!this.client.ticketManager) {
                this.client.ticketManager = new TicketManager(this.client);
            }
            const ticketManager = this.client.ticketManager;
            
            const action = interaction.customId;

            switch (action) {
                // Boutons de types de tickets
                case 'ticket_support':
                    await ticketManager.handleTicketCreation(interaction, 'support');
                    break;
                case 'ticket_general':
                    await ticketManager.handleTicketCreation(interaction, 'general');
                    break;
                case 'ticket_report':
                    await ticketManager.handleTicketCreation(interaction, 'report');
                    break;
                case 'ticket_partnership':
                    await ticketManager.handleTicketCreation(interaction, 'partnership');
                    break;
                case 'ticket_suggestion':
                    await ticketManager.handleTicketCreation(interaction, 'suggestion');
                    break;
                case 'ticket_appeal':
                    await ticketManager.handleTicketCreation(interaction, 'appeal');
                    break;
                    
                // Boutons d'actions rapides
                case 'ticket_faq':
                case 'ticket_status':
                case 'ticket_my_tickets':
                case 'ticket_contact_staff':
                    await ticketManager.handleQuickAction(interaction);
                    break;
                    
                // Boutons d'actions dans les tickets
                case 'ticket_close':
                case 'ticket_claim':
                case 'ticket_add_user':
                case 'ticket_transcript':
                    await ticketManager.handleTicketAction(interaction);
                    break;
            }
        } catch (error) {
            if (error.code === 10062 || error.code === 40060) {
                this.logger.warn('⏰ Erreur d\'interaction expirée dans handleTicketButtons');
                return;
            }
            throw error;
        }
    }

    async handleConfirmationButtons(interaction) {
        try {
            // Vérification préalable pour éviter les interactions expirées
            if (interaction.replied || interaction.deferred) {
                this.logger.warn('⚠️ Interaction confirmation déjà traitée, abandon');
                return;
            }

            // Utiliser l'instance TicketManager stockée dans le client
            if (!this.client.ticketManager) {
                this.client.ticketManager = new TicketManager(this.client);
            }
            const ticketManager = this.client.ticketManager;
            
            if (interaction.customId === 'confirm_close') {
                await ticketManager.handleConfirmClose(interaction);
            } else if (interaction.customId === 'cancel_close') {
                await ticketManager.handleCancelClose(interaction);
            }
        } catch (error) {
            if (error.code === 10062 || error.code === 40060) {
                this.logger.warn('⏰ Erreur d\'interaction expirée dans handleConfirmationButtons');
                return;
            }
            throw error;
        }
    }

    // GESTION ULTRA-SÉCURISÉE DES SUGGESTIONS
    async handleSuggestionButtons(interaction) {
        const { customId } = interaction;

        try {
            // Triple vérification de sécurité
            if (interaction.replied || interaction.deferred) {
                this.logger.warn('⚠️ Interaction suggestion déjà traitée, abandon immédiat');
                return;
            }

            // Réponse immédiate pour sécuriser l'interaction
            // Utiliser le validateur d'interactions pour une déférence rapide
            const validator = interaction.client.interactionValidator;
            const deferred = await validator.quickDefer(interaction, { flags: MessageFlags.Ephemeral });
            
            if (!deferred) {
                return; // Interaction expirée ou déjà traitée
            }

            // Utiliser l'instance TicketManager stockée dans le client
            if (!this.client.ticketManager) {
                this.client.ticketManager = new TicketManager(this.client);
            }
            const ticketManager = this.client.ticketManager;

            // Gestion directe et simplifiée
            switch (customId) {
                case 'suggestion_close':
                    await this.processSuggestionAction(interaction, ticketManager, 'closed');
                    break;
                case 'suggestion_approve':
                    await this.processSuggestionAction(interaction, ticketManager, 'approved');
                    break;
                case 'suggestion_consider':
                    await this.processSuggestionAction(interaction, ticketManager, 'considered');
                    break;
                case 'suggestion_reject':
                    await this.processSuggestionAction(interaction, ticketManager, 'rejected');
                    break;
                default:
                    await interaction.editReply({
                        content: `❌ Action de suggestion non reconnue: ${customId}`
                    });
            }

        } catch (error) {
            if (error.code === 10062) {
                this.logger.warn('⏰ Interaction suggestion expirée');
                return;
            }
            
            if (error.code === 40060) {
                this.logger.warn('⚠️ Interaction suggestion déjà acquittée');
                return;
            }

            this.logger.error('Erreur lors de la gestion des boutons de suggestion:', error);
            
            try {
                if (interaction.deferred) {
                    await interaction.editReply({
                        content: '❌ Une erreur est survenue lors du traitement de la suggestion.'
                    });
                } else if (!interaction.replied) {
                    await interaction.reply({
                        content: '❌ Une erreur est survenue lors du traitement de la suggestion.',
                        flags: MessageFlags.Ephemeral
                    });
                }
            } catch (replyError) {
                this.logger.warn('⏰ Impossible de répondre à l\'erreur de suggestion (interaction expirée)');
            }
        }
    }

    // Méthode sécurisée pour traiter les actions de suggestion
    async processSuggestionAction(interaction, ticketManager, status) {
        try {
            // Déférence immédiate si pas déjà fait
            if (!interaction.deferred && !interaction.replied) {
                try {
                    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
                } catch (error) {
                    // Si la déférence échoue, l'interaction est expirée
                    return;
                }
            }

            // Traitement direct et rapide
            await ticketManager.handleSuggestionAction(interaction, status);

            const statusTexts = {
                approved: 'approuvée',
                rejected: 'rejetée', 
                considered: 'prise en considération',
                closed: 'fermée'
            };

            try {
                await interaction.editReply({
                    content: `✅ Suggestion ${statusTexts[status]} avec succès.`
                });
            } catch (error) {
                // Ignorer les erreurs d'interaction expirée
            }

        } catch (error) {
            this.logger.error(`Erreur lors du traitement de l'action ${status}:`, error);
            
            try {
                if (interaction.deferred || interaction.replied) {
                    await interaction.editReply({
                        content: `❌ Erreur lors du traitement de la suggestion (${status}).`
                    });
                }
            } catch (editError) {
                this.logger.warn('⏰ Impossible de modifier la réponse (interaction expirée)');
            }
        }
    }

    async handleEmbedTemplateButtons(interaction) {
        try {
            if (interaction.replied || interaction.deferred) {
                this.logger.warn('⚠️ Interaction embed template déjà traitée');
                return;
            }

            // Import dynamique pour éviter les dépendances circulaires
            const { handleEditTemplate, handleSendTemplate, handlePreviewTemplate } = await import('../handlers/EmbedHandler.js');
            
            if (interaction.customId.startsWith('edit_template_')) {
                const template = interaction.customId.split('_')[2];
                await handleEditTemplate(interaction, template);
            }
            else if (interaction.customId.startsWith('send_template_')) {
                const template = interaction.customId.split('_')[2];
                await handleSendTemplate(interaction, template);
            }
            else if (interaction.customId.startsWith('preview_template_')) {
                const template = interaction.customId.split('_')[2];
                await handlePreviewTemplate(interaction, template);
            }
        } catch (error) {
            if (error.code === 10062 || error.code === 40060) {
                this.logger.warn('⏰ Erreur d\'interaction expirée dans handleEmbedTemplateButtons');
                return;
            }
            throw error;
        }
    }

    async handleEmbedBuilderButtons(interaction) {
        try {
            if (interaction.replied || interaction.deferred) {
                this.logger.warn('⚠️ Interaction embed builder déjà traitée');
                return;
            }

            const { handleEmbedBuilder } = await import('../handlers/EmbedHandler.js');
            await handleEmbedBuilder(interaction);
        } catch (error) {
            if (error.code === 10062 || error.code === 40060) {
                this.logger.warn('⏰ Erreur d\'interaction expirée dans handleEmbedBuilderButtons');
                return;
            }
            throw error;
        }
    }

    async handleIAButtons(interaction) {
        try {
            if (interaction.replied || interaction.deferred) {
                this.logger.warn('⚠️ Interaction IA déjà traitée');
                return;
            }

            const { handleIAButtons } = await import('../handlers/IAHandler.js');
            await handleIAButtons(interaction);
        } catch (error) {
            if (error.code === 10062 || error.code === 40060) {
                this.logger.warn('⏰ Erreur d\'interaction expirée dans handleIAButtons');
                return;
            }
            throw error;
        }
    }

    async handleFeedbackModalButtons(interaction) {
        try {
            if (interaction.replied || interaction.deferred) {
                this.logger.warn('⚠️ Interaction feedback modal déjà traitée');
                return;
            }

            const status = interaction.customId.split('_')[3];
            const tempData = this.client.tempData?.[interaction.user.id];
            
            if (!tempData) {
                return await interaction.reply({
                    content: '❌ Session expirée. Veuillez recommencer.',
                    flags: MessageFlags.Ephemeral
                });
            }

            // Modal pour le feedback constructif
            const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = await import('discord.js');
            
            const feedbackModal = new ModalBuilder()
                .setCustomId(`suggestion_feedback_${status}`)
                .setTitle('💬 Feedback Constructif');

            const reasonInput = new TextInputBuilder()
                .setCustomId('feedback_reason')
                .setLabel('Raison principale')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('Résumez en quelques mots la raison de cette décision')
                .setRequired(true)
                .setMaxLength(100);

            const feedbackInput = new TextInputBuilder()
                .setCustomId('feedback_message')
                .setLabel('Message de feedback détaillé')
                .setStyle(TextInputStyle.Paragraph)
                .setPlaceholder('Expliquez votre décision, donnez des conseils constructifs, des alternatives...')
                .setRequired(true)
                .setMaxLength(1500);

            const improvementInput = new TextInputBuilder()
                .setCustomId('feedback_improvement')
                .setLabel('Suggestions d\'amélioration (optionnel)')
                .setStyle(TextInputStyle.Paragraph)
                .setPlaceholder('Comment cette suggestion pourrait-elle être améliorée ?')
                .setRequired(false)
                .setMaxLength(800);

            feedbackModal.addComponents(
                new ActionRowBuilder().addComponents(reasonInput),
                new ActionRowBuilder().addComponents(feedbackInput),
                new ActionRowBuilder().addComponents(improvementInput)
            );

            await interaction.showModal(feedbackModal);
        } catch (error) {
            if (error.code === 10062 || error.code === 40060) {
                this.logger.warn('⏰ Erreur d\'interaction expirée dans handleFeedbackModalButtons');
                return;
            }
            
            this.logger.error('Erreur lors de l\'affichage du modal de feedback:', error);
            
            try {
                if (!interaction.replied) {
                    await interaction.reply({
                        content: '❌ Impossible d\'afficher le formulaire. Veuillez réessayer.',
                        flags: MessageFlags.Ephemeral
                    });
                }
            } catch (replyError) {
                this.logger.warn('⏰ Impossible de répondre à l\'erreur de modal');
            }
        }
    }
}

export default ButtonHandler;
