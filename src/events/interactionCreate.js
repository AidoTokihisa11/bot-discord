import TicketManager from '../managers/TicketManager.js';
import Logger from '../utils/Logger.js';
import { EmbedBuilder, MessageFlags } from 'discord.js';

export default {
    name: 'interactionCreate',
    async execute(interaction) {
        const logger = new Logger();
        
        try {
            // Gestion des commandes slash
            if (interaction.isChatInputCommand()) {
                const command = interaction.client.commands.get(interaction.commandName);

                if (!command) {
                    logger.warn(`Commande inconnue: ${interaction.commandName}`);
                    return;
                }

                logger.command(interaction.user, interaction.commandName, interaction.guild);
                await command.execute(interaction, interaction.client);
            }
            
            // Gestion des boutons
            else if (interaction.isButton()) {
                const ticketManager = new TicketManager(interaction.client);
                
                // Boutons de création de tickets
                if (interaction.customId.startsWith('ticket_')) {
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
                }
                
                // Boutons de confirmation
                else if (interaction.customId === 'confirm_close') {
                    const ticketManager = new TicketManager(interaction.client);
                    await ticketManager.handleConfirmClose(interaction);
                }
                else if (interaction.customId === 'cancel_close') {
                    const ticketManager = new TicketManager(interaction.client);
                    await ticketManager.handleCancelClose(interaction);
                }
                
                // Boutons de suggestions
                else if (interaction.customId === 'suggestion_close') {
                    const ticketManager = new TicketManager(interaction.client);
                    await ticketManager.handleSuggestionClose(interaction, 'closed');
                }
                else if (interaction.customId === 'suggestion_approve') {
                    const ticketManager = new TicketManager(interaction.client);
                    await ticketManager.handleSuggestionClose(interaction, 'approved');
                }
                else if (interaction.customId === 'suggestion_consider') {
                    const ticketManager = new TicketManager(interaction.client);
                    await ticketManager.handleSuggestionClose(interaction, 'considered');
                }
                else if (interaction.customId === 'suggestion_reject') {
                    const ticketManager = new TicketManager(interaction.client);
                    await ticketManager.handleSuggestionClose(interaction, 'rejected');
                }
                
                // Boutons de feedback modal
                else if (interaction.customId.startsWith('show_feedback_modal_')) {
                    const status = interaction.customId.split('_')[3];
                    const tempData = interaction.client.tempData?.[interaction.user.id];
                    
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

                    try {
                        await interaction.showModal(feedbackModal);
                    } catch (modalError) {
                        logger.error('Erreur lors de l\'affichage du modal de feedback:', modalError);
                        await interaction.reply({
                            content: '❌ Impossible d\'afficher le formulaire. Veuillez réessayer.',
                            flags: MessageFlags.Ephemeral
                        });
                    }
                }
            }
            
            // Gestion des menus de sélection
            else if (interaction.isStringSelectMenu()) {
                const ticketManager = new TicketManager(interaction.client);
                
                if (interaction.customId === 'suggestion_type_select') {
                    await ticketManager.handleSuggestionTypeSelect(interaction);
                }
            }
            
            // Gestion des modals
            else if (interaction.isModalSubmit()) {
                const ticketManager = new TicketManager(interaction.client);
                
                if (interaction.customId.startsWith('ticket_modal_')) {
                    await ticketManager.handleModalSubmit(interaction);
                }
                else if (interaction.customId.startsWith('suggestion_modal_')) {
                    await ticketManager.handleSuggestionModalSubmit(interaction);
                }
                else if (interaction.customId === 'add_user_modal') {
                    await ticketManager.handleAddUserModal(interaction);
                }
                else if (interaction.customId.startsWith('suggestion_feedback_')) {
                    await ticketManager.handleSuggestionFeedbackModal(interaction);
                }
            }
            
        } catch (error) {
            logger.error('Erreur lors du traitement de l\'interaction:', error);
            
            // Vérifier si l'erreur est liée à une interaction expirée
            if (error.code === 10062 || error.message?.includes('Unknown interaction')) {
                logger.warn('Interaction expirée ou inconnue, abandon de la réponse');
                return;
            }
            
            const errorMessage = '❌ Une erreur est survenue lors du traitement de votre demande. Veuillez réessayer ou contacter un administrateur.';
            
            try {
                // Vérifier si l'interaction est encore valide avant de tenter une réponse
                if (interaction.replied || interaction.deferred) {
                    // Essayer un followUp seulement si l'interaction n'a pas expiré
                    if (!error.code || error.code !== 10062) {
                        await interaction.followUp({ 
                            content: errorMessage, 
                            flags: MessageFlags.Ephemeral 
                        });
                    }
                } else {
                    // Essayer une réponse seulement si l'interaction n'a pas expiré
                    if (!error.code || error.code !== 10062) {
                        await interaction.reply({ 
                            content: errorMessage, 
                            flags: MessageFlags.Ephemeral 
                        });
                    }
                }
            } catch (replyError) {
                // Si c'est une erreur d'interaction expirée, ne pas la logger comme erreur critique
                if (replyError.code === 10062 || replyError.message?.includes('Unknown interaction')) {
                    logger.warn('Impossible de répondre - interaction expirée:', replyError.message);
                } else {
                    logger.error('Impossible de répondre à l\'erreur d\'interaction:', replyError);
                }
            }
        }
    }
};
