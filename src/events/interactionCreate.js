import TicketManager from '../managers/TicketManager.js';
import Logger from '../utils/Logger.js';

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
                await command.execute(interaction);
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
            }
            
            // Gestion des modals
            else if (interaction.isModalSubmit()) {
                const ticketManager = new TicketManager(interaction.client);
                
                if (interaction.customId.startsWith('ticket_modal_')) {
                    await ticketManager.handleModalSubmit(interaction);
                }
                else if (interaction.customId === 'add_user_modal') {
                    await ticketManager.handleAddUserModal(interaction);
                }
            }
            
        } catch (error) {
            logger.error('Erreur lors du traitement de l\'interaction:', error);
            
            const errorMessage = '❌ Une erreur est survenue lors du traitement de votre demande. Veuillez réessayer ou contacter un administrateur.';
            
            try {
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({ 
                        content: errorMessage, 
                        ephemeral: true 
                    });
                } else {
                    await interaction.reply({ 
                        content: errorMessage, 
                        ephemeral: true 
                    });
                }
            } catch (replyError) {
                logger.error('Impossible de répondre à l\'erreur d\'interaction:', replyError);
            }
        }
    }
};
