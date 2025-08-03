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
        
        // Protection contre les doublons de Discord.js
        if (!interaction.client.interactionCache) {
            interaction.client.interactionCache = new Set();
        }
        
        const interactionKey = `${interaction.id}_${interaction.user.id}_${Date.now()}`;
        if (interaction.client.interactionCache.has(interaction.id)) {
            logger.warn(`🔄 Interaction dupliquée détectée: ${interaction.id}`);
            return;
        }
        
        interaction.client.interactionCache.add(interaction.id);
        
        // Nettoyer le cache après 30 secondes
        setTimeout(() => {
            interaction.client.interactionCache.delete(interaction.id);
        }, 30000);
        
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
            
            // Gestion de l'autocomplétion
            else if (interaction.isAutocomplete()) {
                const command = interaction.client.commands.get(interaction.commandName);
                
                if (!command || !command.autocomplete) {
                    return;
                }
                
                try {
                    await command.autocomplete(interaction);
                } catch (error) {
                    logger.error(`Erreur autocomplétion pour ${interaction.commandName}:`, error);
                }
            }
            
            // Gestion des boutons - ULTRA-SÉCURISÉE
            else if (interaction.isButton()) {
                // Vérification supplémentaire avant traitement
                if (interaction.replied || interaction.deferred) {
                    logger.warn('⚠️ Interaction bouton déjà traitée');
                    return;
                }

                logger.info(`🔘 Bouton cliqué: ${interaction.customId} par ${interaction.user.tag}`);

                // Initialiser les gestionnaires si nécessaire
                if (!interaction.client.buttonHandler) {
                    interaction.client.buttonHandler = new ButtonHandler(interaction.client);
                }
                if (!interaction.client.ticketManager) {
                    interaction.client.ticketManager = new TicketManager(interaction.client);
                }

                // Vérifier si c'est un bouton lié aux streams
                if (interaction.customId.startsWith('stream_')) {
                    // Gestion basique des boutons de streams (si nécessaire)
                    logger.info('Bouton stream cliqué mais système désactivé');
                    await interaction.reply({
                        content: '❌ Le système de streams n\'est pas disponible.',
                        ephemeral: true
                    });
                } else {
                    await interaction.client.buttonHandler.handleButton(interaction);
                }
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
                
                // Vérifier si c'est un menu lié aux streams
                if (interaction.customId.startsWith('stream_')) {
                    logger.info('Menu stream cliqué mais système désactivé');
                    await interaction.reply({
                        content: '❌ Le système de streams n\'est pas disponible.',
                        ephemeral: true
                    });
                } else if (interaction.customId === 'suggestion_type_select') {
                    await interaction.client.ticketManager.handleSuggestionTypeSelect(interaction);
                } else if (interaction.customId === 'select_staff_invite') {
                    await interaction.client.ticketManager.handleStaffInviteSelection(interaction);
                } else if (interaction.customId === 'select_sos_staff_invite') {
                    await interaction.client.ticketManager.handleSOSStaffInviteSelection(interaction);
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

                // Vérifier si c'est un modal lié aux streams
                if (interaction.customId.startsWith('stream_')) {
                    logger.info('Modal stream soumis mais système désactivé');
                    await interaction.reply({
                        content: '❌ Le système de streams n\'est pas disponible.',
                        ephemeral: true
                    });
                } else {
                    // Initialiser le TicketManager si nécessaire
                    if (!interaction.client.ticketManager) {
                        interaction.client.ticketManager = new TicketManager(interaction.client);
                    }

                    await handleModal(interaction);
                }
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
