import Logger from '../utils/Logger.js';
import { MessageFlags } from 'discord.js';
import ButtonHandler from '../handlers/ButtonHandler.js';
import { handleModal } from '../handlers/ModalHandler.js';
import TicketManager from '../managers/TicketManager.js';
import InteractionValidator from '../utils/InteractionValidator.js';

export default {
    name: 'interactionCreate',
    async execute(interaction) {
        const logger = new Logger();
        
        // Initialiser le validateur d'interactions si nécessaire
        if (!interaction.client.interactionValidator) {
            interaction.client.interactionValidator = new InteractionValidator();
        }
        const validator = interaction.client.interactionValidator;
        
        try {
            // Validation robuste de l'interaction
            if (!validator.validateInteraction(interaction)) {
                return; // Interaction invalide, abandon silencieux
            }

            // Gestion des commandes slash
            if (interaction.isChatInputCommand()) {
                const command = interaction.client.commands.get(interaction.commandName);

                if (!command) {
                    logger.warn(`Commande inconnue: ${interaction.commandName}`);
                    return;
                }

                logger.command(interaction.user, interaction.commandName, interaction.guild);
                
                // Vérification du cooldown
                const now = Date.now();
                const cooldownAmount = (command.cooldown ?? 3) * 1000;
                
                if (!interaction.client.cooldowns.has(interaction.commandName)) {
                    interaction.client.cooldowns.set(interaction.commandName, new Map());
                }
                
                const timestamps = interaction.client.cooldowns.get(interaction.commandName);
                
                if (timestamps.has(interaction.user.id)) {
                    const expirationTime = timestamps.get(interaction.user.id) + cooldownAmount;
                    
                    if (now < expirationTime) {
                        const timeLeft = (expirationTime - now) / 1000;
                        return await interaction.reply({
                            content: `⏰ Veuillez patienter ${timeLeft.toFixed(1)} seconde(s) avant de réutiliser cette commande.`,
                            flags: MessageFlags.Ephemeral
                        });
                    }
                }
                
                timestamps.set(interaction.user.id, now);
                
                await command.execute(interaction, interaction.client);
            }
            
            // Gestion des boutons - ULTRA-SÉCURISÉE
            else if (interaction.isButton()) {
                // Vérification supplémentaire avant traitement
                if (interaction.replied || interaction.deferred) {
                    logger.warn('⚠️ Interaction bouton déjà traitée');
                    return;
                }

                logger.info(`🔘 Bouton cliqué: ${interaction.customId} par ${interaction.user.tag}`);

                // Utiliser une seule instance de ButtonHandler stockée dans le client
                if (!interaction.client.buttonHandler) {
                    interaction.client.buttonHandler = new ButtonHandler(interaction.client);
                }
                await interaction.client.buttonHandler.handleButton(interaction);
            }
            
            // Gestion des menus de sélection - SÉCURISÉE
            else if (interaction.isStringSelectMenu()) {
                // Vérification supplémentaire avant traitement
                if (interaction.replied || interaction.deferred) {
                    logger.warn('⚠️ Interaction menu déjà traitée');
                    return;
                }

                logger.info(`📋 Menu sélectionné: ${interaction.customId} par ${interaction.user.tag}`);

                // Utiliser une seule instance de TicketManager stockée dans le client
                if (!interaction.client.ticketManager) {
                    interaction.client.ticketManager = new TicketManager(interaction.client);
                }
                
                if (interaction.customId === 'suggestion_type_select') {
                    await interaction.client.ticketManager.handleSuggestionTypeSelect(interaction);
                } else {
                    logger.warn(`Menu non géré: ${interaction.customId}`);
                }
            }
            
            // Gestion des modals - SÉCURISÉE
            else if (interaction.isModalSubmit()) {
                // Vérification supplémentaire avant traitement
                if (interaction.replied || interaction.deferred) {
                    logger.warn('⚠️ Interaction modal déjà traitée');
                    return;
                }

                logger.info(`📝 Modal soumis: ${interaction.customId} par ${interaction.user.tag}`);

                await handleModal(interaction);
            }
            
        } catch (error) {
            // Utiliser le validator pour une gestion d'erreur robuste
            await validator.handleInteractionError(interaction, error, 'interaction principale');
        } finally {
            // Marquer l'interaction comme terminée
            validator.markInteractionAsCompleted(interaction);
        }
    }
};
