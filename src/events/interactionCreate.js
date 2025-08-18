import Logger from '../utils/Logger.js';
import { MessageFlags } from 'discord.js';
import ButtonHandler from '../handlers/ButtonHandler.js';
import { handleModal } from '../handlers/ModalHandler.js';
import TicketManager from '../managers/TicketManager.js';
import InteractionValidator from '../utils/InteractionValidator.js';
import CharteHandler from '../handlers/CharteHandler.js';
// import MusicButtonHandler from '../handlers/MusicButtonHandler.js'; // Temporarily disabled due to missing @discordjs/voice

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
                } else if (interaction.customId === 'reglement_validate') {
                    // Gestion de la validation du règlement Team7
                    await handleReglementValidation(interaction);
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
                } else if (interaction.customId.startsWith('queue_')) {
                    // Gestion des boutons de navigation de la queue de musique (disabled)
                    // const handled = await MusicButtonHandler.handleQueueButton(interaction);
                    // if (!handled) {
                        await interaction.client.buttonHandler.handleButton(interaction);
                    // }
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

// Fonction de gestion de la validation du règlement Team7
async function handleReglementValidation(interaction) {
    const logger = new Logger();
    
    try {
        const { guild, user } = interaction;
        const member = guild.members.cache.get(user.id);
        const validationRoleId = '1387536419588931616'; // ID du rôle Team7
        
        if (!member) {
            return await interaction.reply({
                content: '❌ Erreur : Impossible de récupérer vos informations.',
                ephemeral: true
            });
        }

        // Vérifier si l'utilisateur a déjà le rôle
        if (member.roles.cache.has(validationRoleId)) {
            return await interaction.reply({
                content: '✅ Vous avez déjà validé le règlement !',
                ephemeral: true
            });
        }

        // Récupérer le rôle
        let validationRole;
        try {
            validationRole = await guild.roles.fetch(validationRoleId);
        } catch (fetchError) {
            logger.error(`Erreur lors de la récupération du rôle ${validationRoleId}:`, fetchError);
        }

        if (!validationRole) {
            logger.error(`Rôle de validation introuvable: ${validationRoleId}`);
            return await interaction.reply({
                content: '❌ Erreur : Rôle de validation introuvable.',
                ephemeral: true
            });
        }

        // Attribuer le rôle
        try {
            await member.roles.add(validationRole, 'Validation du règlement Team7');
            logger.success(`Rôle ${validationRole.name} (${validationRole.id}) attribué à ${member.user.tag}`);
            
            // Répondre à l'interaction
            await interaction.reply({
                content: '✅ **Règlement validé avec succès !**\n\nVous avez maintenant accès à l\'ensemble du serveur. Bienvenue ! 🎉',
                ephemeral: true
            });

            // Envoyer notification privée détaillée
            try {
                const welcomeEmbed = {
                    color: 0x2F3136,
                    title: '🎉 Bienvenue sur ' + guild.name + ' !',
                    description: `**Félicitations ${member.user.username} !** ✨\n\nVous venez de valider avec succès le règlement de notre serveur et vous avez maintenant accès à l'ensemble de nos espaces communautaires !`,
                    fields: [
                        {
                            name: '📋 Règlement validé',
                            value: 'Vous vous engagez à respecter toutes les règles énoncées dans le règlement général du serveur. En cas de non-respect, des sanctions pourront être appliquées.',
                            inline: false
                        },
                        {
                            name: '🎯 Prochaines étapes recommandées',
                            value: '• Rendez-vous dans <#1368919061425164288> pour choisir vos jeux préférés\n• Explorez les différents canaux disponibles\n• Présentez-vous si vous le souhaitez\n• Participez aux discussions dans le respect des règles',
                            inline: false
                        },
                        {
                            name: '🛠️ Besoin d\'aide ?',
                            value: 'Utilisez le salon <#1398336201844457485> option "signalement" pour toute question ou problème. Notre équipe de modération est là pour vous aider !',
                            inline: false
                        },
                        {
                            name: '🛡️ Rappels importants',
                            value: '• Le respect entre membres est obligatoire\n• Aucun comportement toxique ne sera toléré\n• Respectez les thématiques de chaque salon\n• En cas de problème, contactez le staff',
                            inline: false
                        }
                    ],
                    footer: {
                        text: 'Règlement Team7 • Bonne découverte sur le serveur !',
                        icon_url: guild.iconURL() || undefined
                    },
                    timestamp: new Date().toISOString(),
                    thumbnail: {
                        url: 'https://i.pinimg.com/originals/45/90/c5/4590c5b9594ea14b91456b15e4e08ba7.jpg'
                    }
                };
                
                await member.send({ embeds: [welcomeEmbed] });
                logger.success(`Notification de bienvenue détaillée envoyée à ${member.user.tag}`);
            } catch (dmError) {
                logger.warn(`Impossible d'envoyer un MP à ${member.user.tag}: ${dmError.message}`);
                
                // Fallback: essayer d'envoyer dans un channel
                try {
                    const logChannelId = process.env.LOG_CHANNEL_ID;
                    let fallbackChannel = null;

                    if (logChannelId) {
                        fallbackChannel = guild.channels.cache.get(logChannelId);
                    }

                    if (!fallbackChannel) {
                        fallbackChannel = guild.channels.cache.find(ch => ['welcome', 'bienvenue', 'annonces', 'général'].includes((ch.name || '').toLowerCase()));
                    }

                    if (fallbackChannel && fallbackChannel.isTextBased()) {
                        const welcomeMessage = `🎉 **Bienvenue ${member} !**\n\n✅ Règlement validé avec succès ! Vous avez maintenant accès à l'ensemble du serveur.\n\n🎯 N'oubliez pas de vous rendre dans <#1368919061425164288> pour choisir vos jeux préférés !\n\nBonne découverte ! 🚀`;
                        await fallbackChannel.send({ content: welcomeMessage });
                        logger.info(`Notification de bienvenue envoyée dans ${fallbackChannel.name} pour ${member.user.tag}`);
                    }
                } catch (fallbackError) {
                    logger.error('Erreur lors de l\'envoi de la notification de bienvenue en fallback:', fallbackError);
                }
            }

        } catch (addError) {
            logger.error(`Erreur lors de l'attribution du rôle ${validationRoleId} à ${member.user.tag}:`, addError);
            return await interaction.reply({
                content: '❌ Erreur lors de l\'attribution du rôle. Contactez un administrateur.',
                ephemeral: true
            });
        }

    } catch (error) {
        logger.error('Erreur lors de la validation du règlement:', error);
        try {
            await interaction.reply({
                content: '❌ Une erreur est survenue. Veuillez réessayer.',
                ephemeral: true
            });
        } catch (replyError) {
            logger.error('Impossible de répondre à l\'interaction:', replyError);
        }
    }
}
