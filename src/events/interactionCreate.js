import TicketManager from '../managers/TicketManager.js';
import Logger from '../utils/Logger.js';
import { EmbedBuilder } from 'discord.js';

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
                
                // Boutons de rôles gaming
                else if (interaction.customId.startsWith('gaming_role_')) {
                    await handleGamingRoleButton(interaction);
                }
                else if (interaction.customId === 'gaming_stats') {
                    await handleGamingStatsButton(interaction);
                }
                else if (interaction.customId === 'gaming_help') {
                    await handleGamingHelpButton(interaction);
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

/**
 * Gère les boutons de rôles gaming
 */
async function handleGamingRoleButton(interaction) {
    const logger = new Logger();
    
    try {
        // Vérification immédiate de l'état de l'interaction
        if (!interaction || !interaction.isRepliable()) {
            return; // Sortir silencieusement si l'interaction n'est pas valide
        }

        // Vérifier si l'interaction a déjà été traitée
        if (interaction.replied || interaction.deferred) {
            return; // Éviter les doubles traitements
        }

        if (!interaction.client.gamingRoleManager) {
            try {
                await interaction.reply({
                    content: '❌ Le système de rôles gaming n\'est pas disponible.',
                    ephemeral: true
                });
            } catch (err) {
                // Ignorer les erreurs de réponse
            }
            return;
        }

        const gameKey = interaction.customId.replace('gaming_role_', '');
        const gameConfig = interaction.client.gamingRoleManager.GAMING_CONFIG[gameKey];
        
        if (!gameConfig || gameConfig.disabled) {
            try {
                await interaction.reply({
                    content: '❌ Ce jeu n\'est pas disponible actuellement.',
                    ephemeral: true
                });
            } catch (err) {
                // Ignorer les erreurs de réponse
            }
            return;
        }

        const member = interaction.guild.members.cache.get(interaction.user.id);
        if (!member) {
            try {
                await interaction.reply({
                    content: '❌ Impossible de vous trouver sur ce serveur.',
                    ephemeral: true
                });
            } catch (err) {
                // Ignorer les erreurs de réponse
            }
            return;
        }

        // Vérifier le cooldown
        if (interaction.client.gamingRoleManager.isUserOnCooldown(interaction.user.id)) {
            const timeLeft = interaction.client.gamingRoleManager.getCooldownTimeLeft(interaction.user.id);
            
            const cooldownEmbed = new EmbedBuilder()
                .setColor(0xFEE75C)
                .setTitle('⏰ **COOLDOWN ACTIF**')
                .setDescription(`Vous devez attendre encore **${timeLeft} secondes** avant de pouvoir changer de rôles gaming.`)
                .addFields({
                    name: '💡 Pourquoi ce cooldown ?',
                    value: 'Ce système évite le spam et assure une meilleure expérience pour tous.',
                    inline: false
                })
                .setFooter({ 
                    text: 'Système Gaming • Anti-spam',
                    iconURL: interaction.guild.iconURL()
                })
                .setTimestamp();

            try {
                await interaction.reply({
                    embeds: [cooldownEmbed],
                    ephemeral: true
                });
            } catch (err) {
                // Ignorer les erreurs de réponse
            }
            return;
        }

        // Traitement en arrière-plan sans attendre la réponse Discord
        setImmediate(async () => {
            try {
                // Vérifier si l'utilisateur a déjà le rôle
                const hasRole = member.roles.cache.has(gameConfig.roleId);
                const action = hasRole ? 'remove' : 'add';
                
                let success = false;
                if (action === 'add') {
                    success = await interaction.client.gamingRoleManager.handleRoleAdd(
                        { message: interaction.message, emoji: { name: gameConfig.emoji } },
                        interaction.user,
                        gameKey
                    );
                } else {
                    success = await interaction.client.gamingRoleManager.handleRoleRemove(
                        { message: interaction.message, emoji: { name: gameConfig.emoji } },
                        interaction.user,
                        gameKey
                    );
                }

                // Envoyer une notification en MP plutôt que de répondre à l'interaction
                if (success) {
                    const actionText = action === 'add' ? 'obtenu' : 'retiré';
                    const emoji = action === 'add' ? '✅' : '➖';
                    
                    const successEmbed = new EmbedBuilder()
                        .setColor(action === 'add' ? gameConfig.color : 0x95A5A6)
                        .setTitle(`${emoji} **RÔLE ${actionText.toUpperCase()} !**`)
                        .setDescription(`Vous avez ${actionText} le rôle **${gameConfig.name}** avec succès !`)
                        .addFields(
                            {
                                name: '🎮 Jeu',
                                value: `${gameConfig.emoji} ${gameConfig.name}`,
                                inline: true
                            },
                            {
                                name: '⏰ Cooldown',
                                value: '30 secondes',
                                inline: true
                            }
                        )
                        .setFooter({ 
                            text: `${interaction.guild.name} • Système Gaming`,
                            iconURL: interaction.guild.iconURL()
                        })
                        .setTimestamp();

                    if (action === 'add') {
                        successEmbed.addFields({
                            name: '🔗 Accès',
                            value: 'Vous avez maintenant accès aux salons de ce jeu !',
                            inline: false
                        });
                    }

                    // Envoyer en MP pour éviter les problèmes d'interaction
                    try {
                        await interaction.user.send({ embeds: [successEmbed] });
                    } catch (dmError) {
                        // Si impossible d'envoyer en MP, essayer de répondre à l'interaction
                        try {
                            if (interaction.isRepliable() && !interaction.replied && !interaction.deferred) {
                                await interaction.reply({ 
                                    embeds: [successEmbed],
                                    ephemeral: true
                                });
                            }
                        } catch (replyError) {
                            // Ignorer les erreurs de réponse
                        }
                    }
                }
            } catch (processError) {
                logger.warn('Erreur lors du traitement en arrière-plan:', processError);
            }
        });

        // Réponse immédiate simple pour éviter l'expiration
        try {
            if (interaction.isRepliable() && !interaction.replied && !interaction.deferred) {
                await interaction.reply({
                    content: '✅ Traitement en cours... Vous recevrez une confirmation en message privé.',
                    ephemeral: true
                });
            }
        } catch (replyError) {
            // Ignorer les erreurs de réponse immédiate
        }

    } catch (error) {
        // Gestion silencieuse des erreurs pour éviter le spam dans les logs
        if (error.code === 10062 || error.code === 40060) {
            // Interaction expirée ou déjà traitée - ignorer silencieusement
            return;
        }
        
        // Logger seulement les erreurs importantes
        logger.warn('Erreur dans handleGamingRoleButton (non critique):', error.message);
    }
}

/**
 * Gère le bouton des statistiques gaming
 */
async function handleGamingStatsButton(interaction) {
    const logger = new Logger();
    
    try {
        if (!interaction.client.gamingRoleManager) {
            return await interaction.reply({
                content: '❌ Le système de rôles gaming n\'est pas disponible.',
                ephemeral: true
            });
        }

        await interaction.deferReply({ ephemeral: true });

        // Récupérer les statistiques
        const stats = await interaction.client.gamingRoleManager.getGamingStats(interaction.guild.id);
        
        if (!stats) {
            return await interaction.editReply({
                content: '❌ Aucune statistique disponible.'
            });
        }

        // Calculer les statistiques globales
        let totalActions = 0;
        let totalAdds = 0;
        let totalRemoves = 0;

        for (const gameStats of Object.values(stats)) {
            totalActions += gameStats.recentActions;
            totalAdds += gameStats.recentAdds;
            totalRemoves += gameStats.recentRemoves;
        }

        // Créer l'embed des statistiques
        const statsEmbed = new EmbedBuilder()
            .setColor(0x5865F2)
            .setTitle('📊 **STATISTIQUES GAMING**')
            .setDescription('Statistiques des 30 derniers jours')
            .addFields(
                {
                    name: '📈 **Résumé Global**',
                    value: `\`\`\`
🔢 Actions totales: ${totalActions}
➕ Rôles obtenus: ${totalAdds}
➖ Rôles retirés: ${totalRemoves}
\`\`\``,
                    inline: false
                }
            )
            .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
            .setFooter({ 
                text: `${interaction.guild.name} • Statistiques Gaming`,
                iconURL: interaction.guild.iconURL()
            })
            .setTimestamp();

        // Ajouter les statistiques par jeu
        const gameFields = [];
        for (const [gameKey, gameStats] of Object.entries(stats)) {
            gameFields.push({
                name: `${gameStats.emoji} **${gameStats.name}**`,
                value: `\`\`\`
Actions: ${gameStats.recentActions}
Ajouts: ${gameStats.recentAdds}
Retraits: ${gameStats.recentRemoves}
\`\`\``,
                inline: true
            });
        }

        if (gameFields.length > 0) {
            statsEmbed.addFields(gameFields);
        }

        await interaction.editReply({ embeds: [statsEmbed] });

    } catch (error) {
        logger.error('Erreur dans handleGamingStatsButton:', error);
        
        const errorEmbed = new EmbedBuilder()
            .setColor(0xFF6B6B)
            .setTitle('❌ **ERREUR**')
            .setDescription('Impossible de récupérer les statistiques.')
            .setTimestamp();

        if (interaction.deferred) {
            await interaction.editReply({ embeds: [errorEmbed] });
        } else {
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    }
}

/**
 * Gère le bouton d'aide gaming
 */
async function handleGamingHelpButton(interaction) {
    try {
        const helpEmbed = new EmbedBuilder()
            .setColor(0x00D4AA)
            .setTitle('❓ **AIDE & SUPPORT GAMING**')
            .setDescription('Guide d\'utilisation du système de rôles gaming')
            .addFields(
                {
                    name: '🎮 **Comment obtenir un rôle ?**',
                    value: '• Cliquez sur le bouton du jeu souhaité\n• Ou réagissez avec l\'emoji correspondant\n• Le rôle sera attribué automatiquement',
                    inline: false
                },
                {
                    name: '⏰ **Système de cooldown**',
                    value: '• 30 secondes entre chaque changement\n• Évite le spam et les erreurs\n• S\'applique à tous les rôles gaming',
                    inline: false
                },
                {
                    name: '🔔 **Notifications**',
                    value: '• Vous recevez un MP à chaque changement\n• Confirmation d\'obtention/retrait\n• Informations sur l\'accès aux salons',
                    inline: false
                },
                {
                    name: '🔒 **Accès automatique**',
                    value: '• Les salons s\'affichent automatiquement\n• Permissions ajustées en temps réel\n• Accès immédiat aux communautés',
                    inline: false
                },
                {
                    name: '📊 **Statistiques**',
                    value: '• Toutes vos actions sont enregistrées\n• Consultez les stats avec le bouton dédié\n• Historique complet disponible',
                    inline: false
                },
                {
                    name: '🛠️ **Problèmes ?**',
                    value: '• Utilisez le système de tickets\n• Contactez un modérateur\n• Vérifiez vos permissions',
                    inline: false
                }
            )
            .setFooter({ 
                text: `${interaction.guild.name} • Système Gaming Avancé`,
                iconURL: interaction.guild.iconURL()
            })
            .setTimestamp();

        await interaction.reply({ embeds: [helpEmbed], ephemeral: true });

    } catch (error) {
        const logger = new Logger();
        logger.error('Erreur dans handleGamingHelpButton:', error);
        
        await interaction.reply({
            content: '❌ Une erreur est survenue lors de l\'affichage de l\'aide.',
            ephemeral: true
        });
    }
}
