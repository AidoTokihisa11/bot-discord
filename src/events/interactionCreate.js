import Logger from '../utils/Logger.js';
import { MessageFlags } from 'discord.js';
import ButtonHandler from '../handlers/ButtonHandler.js';
import { handleModal } from '../handlers/ModalHandler.js';
import TicketManager from '../managers/TicketManager.js';
import InteractionValidator from '../utils/InteractionValidator.js';
import CharteHandler from '../handlers/CharteHandler.js';

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
                } else if (interaction.customId.startsWith('mod_')) {
                    // Gestion des boutons de modération
                    if (!interaction.client.moderationButtonHandler) {
                        logger.error('ModerationButtonHandler non initialisé');
                        return;
                    }
                    await interaction.client.moderationButtonHandler.handleModerationButton(interaction);
                } else if (interaction.customId === 'charte_validate') {
                    // Gestion de la validation de charte
                    await CharteHandler.handleCharteValidation(interaction);
                } else if (interaction.customId.startsWith('delete_data_confirm_')) {
                    // Gestion de la confirmation de suppression de données
                    const userId = interaction.customId.split('_')[3];
                    await CharteHandler.handleDataDeletionConfirm(interaction, userId);
                } else if (interaction.customId.startsWith('delete_data_preview_')) {
                    // Gestion de l'aperçu des données à supprimer
                    const userId = interaction.customId.split('_')[3];
                    await CharteHandler.handleDataPreview(interaction, userId);
                } else if (interaction.customId === 'delete_data_cancel') {
                    // Annulation de suppression de données
                    await interaction.update({
                        content: '❌ **Suppression annulée**\nAucune donnée n\'a été supprimée.',
                        embeds: [],
                        components: []
                    });
                } else if (interaction.customId === 'export_my_data') {
                    // Bouton "Exporter mes données" depuis /my-data
                    const exportCommand = interaction.client.commands?.get('export-my-data');
                    if (exportCommand) {
                        await exportCommand.execute(interaction);
                    } else {
                        await interaction.reply({
                            content: '❌ Erreur: Commande d\'export non trouvée.',
                            ephemeral: true
                        });
                    }
                } else if (interaction.customId === 'delete_my_data') {
                    // Bouton "Supprimer mes données" depuis /my-data
                    const deleteCommand = interaction.client.commands?.get('delete-my-data');
                    if (deleteCommand) {
                        await deleteCommand.execute(interaction);
                    } else {
                        await interaction.reply({
                            content: '❌ Erreur: Commande de suppression non trouvée.',
                            ephemeral: true
                        });
                    }
                } else if (interaction.customId === 'data_refresh') {
                    // Bouton "Actualiser" depuis /my-data
                    const myDataCommand = interaction.client.commands?.get('my-data');
                    if (myDataCommand) {
                        await myDataCommand.execute(interaction);
                    } else {
                        await interaction.reply({
                            content: '❌ Erreur: Commande my-data non trouvée.',
                            ephemeral: true
                        });
                    }
                } else if (interaction.customId.startsWith('export_before_delete_')) {
                    // Bouton "Exporter avant suppression" depuis l'aperçu des données
                    const userId = interaction.customId.split('_')[3];
                    const exportCommand = interaction.client.commands?.get('export-my-data');
                    if (exportCommand) {
                        await exportCommand.execute(interaction);
                    } else {
                        await interaction.reply({
                            content: '❌ Erreur: Commande d\'export non trouvée.',
                            ephemeral: true
                        });
                    }
                } else if (interaction.customId.startsWith('download_deletion_report_')) {
                    // Bouton "Télécharger rapport" après suppression
                    const userId = interaction.customId.split('_')[3];
                    await interaction.reply({
                        content: '📋 **Rapport de suppression**\n\nVotre rapport détaillé a été envoyé par message privé. Si vous ne l\'avez pas reçu, vérifiez vos paramètres de confidentialité.',
                        ephemeral: true
                    });
                } else if (interaction.customId === 'gdpr_support') {
                    // Bouton "Support RGPD"
                    const supportCommand = interaction.client.commands?.get('support');
                    if (supportCommand) {
                        await supportCommand.execute(interaction);
                    } else {
                        await interaction.reply({
                            content: '📞 **Support RGPD**\n\nPour toute question concernant vos données personnelles, contactez :\n• **Support général :** `/support`\n• **Email DPO :** dpo@team7.gg\n• **CNIL :** www.cnil.fr',
                            ephemeral: true
                        });
                    }
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
                } else if (interaction.customId.startsWith('mod_')) {
                    // Gestion des menus de modération
                    if (!interaction.client.moderationButtonHandler) {
                        logger.error('ModerationButtonHandler non initialisé');
                        return;
                    }
                    await interaction.client.moderationButtonHandler.handleModerationSelect(interaction);
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
                } else if (interaction.customId.startsWith('mod_')) {
                    // Gestion des modals de modération
                    if (!interaction.client.moderationButtonHandler) {
                        logger.error('ModerationButtonHandler non initialisé');
                        return;
                    }
                    await interaction.client.moderationButtonHandler.handleModerationModal(interaction);
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
