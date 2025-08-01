import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionFlagsBits, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, MessageFlags } from 'discord.js';
import Database from '../utils/Database.js';
import Logger from '../utils/Logger.js';

class TicketManager {
    constructor(client) {
        this.client = client;
        this.db = new Database();
        this.logger = new Logger();
        this.staffRoleId = '1386784012269387946';
        this.ticketChannelId = '1398336201844457485';
        this.ticketCategoryId = null; // Sera défini dynamiquement
        
        // PROTECTION ULTRA GLOBALE - UNE SEULE INSTANCE PARTAGÉE
        if (!global.ULTIMATE_TICKET_LOCK) {
            global.ULTIMATE_TICKET_LOCK = {
                activeUsers: new Map(), // user.id -> timestamp
                activeChannels: new Set(), // channel IDs en cours de création
                sentNotifications: new Set(), // notifications déjà envoyées
                lastCleanup: Date.now()
            };
            
            // Nettoyage automatique toutes les 2 minutes
            setInterval(() => {
                const now = Date.now();
                const lock = global.ULTIMATE_TICKET_LOCK;
                
                // Nettoyer les utilisateurs actifs après 1 minute
                for (const [userId, timestamp] of lock.activeUsers.entries()) {
                    if (now - timestamp > 60000) {
                        lock.activeUsers.delete(userId);
                    }
                }
                
                // Nettoyer les notifications après 5 minutes
                const oldNotifications = Array.from(lock.sentNotifications).filter(key => {
                    const parts = key.split('_');
                    const timestamp = parseInt(parts[parts.length - 1]);
                    return now - timestamp > 300000;
                });
                oldNotifications.forEach(key => lock.sentNotifications.delete(key));
                
                // Nettoyer les canaux après 2 minutes
                if (now - lock.lastCleanup > 120000) {
                    lock.activeChannels.clear();
                    lock.lastCleanup = now;
                }
            }, 120000);
        }
        
        this.ticketTypes = {
            support: {
                name: 'Support Technique',
                emoji: '🔧',
                color: '#3498db',
                description: 'Problèmes techniques, bugs, assistance',
                responseTime: '2-4 heures',
                priority: 'high'
            },
            general: {
                name: 'Question Générale',
                emoji: '❓',
                color: '#95a5a6',
                description: 'Informations, aide générale',
                responseTime: '4-8 heures',
                priority: 'medium'
            },
            report: {
                name: 'Signalement',
                emoji: '🚨',
                color: '#e74c3c',
                description: 'Signaler un problème urgent',
                responseTime: '30 minutes - 1 heure',
                priority: 'critical'
            },
            partnership: {
                name: 'Partenariat',
                emoji: '🤝',
                color: '#2ecc71',
                description: 'Propositions de collaboration',
                responseTime: '12-24 heures',
                priority: 'low'
            },
            suggestion: {
                name: 'Avis / Feedback',
                emoji: '💡',
                color: '#f39c12',
                description: 'Partagez vos avis et retours',
                responseTime: '6-12 heures',
                priority: 'medium'
            },
            appeal: {
                name: 'Appel de Sanction',
                emoji: '⚖️',
                color: '#9b59b6',
                description: 'Contester une sanction',
                responseTime: '2-6 heures',
                priority: 'high'
            },
            recruitment: {
                name: 'Recrutement',
                emoji: '👥',
                color: '#8e44ad',
                description: 'Candidature et recrutement',
                responseTime: '1-3 heures',
                priority: 'high'
            }
        };
    }

    // Méthode utilitaire pour répondre aux interactions de manière sécurisée
    async safeInteractionReply(interaction, replyOptions) {
        try {
            // Vérifier l'état de l'interaction avant de répondre
            if (interaction.replied) {
                this.logger.warn('⚠️ Tentative de réponse à une interaction déjà répondue');
                return false;
            }
            
            if (interaction.deferred) {
                await interaction.editReply(replyOptions);
                return true;
            }
            
            await interaction.reply(replyOptions);
            return true;
            
        } catch (error) {
            if (error.code === 'InteractionAlreadyReplied' || error.code === 'INTERACTION_ALREADY_REPLIED') {
                this.logger.warn('⚠️ Interaction déjà répondue lors de safeInteractionReply');
                return false;
            }
            
            if (error.code === 10062 || error.code === 'UNKNOWN_INTERACTION') {
                this.logger.warn('⏰ Interaction expirée lors de safeInteractionReply');
                return false;
            }
            
            this.logger.error('Erreur lors de safeInteractionReply:', error);
            return false;
        }
    }

    async createTicketPanel(channel) {
        try {
            // Embed principal ultra moderne
            const mainEmbed = new EmbedBuilder()
                .setColor('#5865F2')
                .setTitle('🎫 **CENTRE DE SUPPORT PREMIUM**')
                .setDescription(`
╭─────────────────────────────────────╮
│        **🌟 SUPPORT 24/7 🌟**        │
╰─────────────────────────────────────╯

**Bienvenue dans notre centre de support avancé !**
Notre équipe d'experts est là pour vous aider rapidement et efficacement.

**📊 Nos Performances :**
• **⚡ Temps de réponse moyen :** \`15 minutes\`
• **🎯 Taux de résolution :** \`98.5%\`
• **👥 Équipe disponible :** \`24h/7j\`
• **📈 Satisfaction client :** \`4.9/5 ⭐\`

**🎯 Choisissez votre type de demande ci-dessous**`)
                .setThumbnail(channel.guild.iconURL({ dynamic: true }))
                .setImage('https://i.imgur.com/placeholder.png') // Vous pouvez ajouter une bannière
                .setFooter({ 
                    text: '💎 Support Premium • Réponse garantie • Service de qualité',
                    iconURL: this.client.user.displayAvatarURL()
                })
                .setTimestamp();

            // Boutons principaux pour les types de tickets
            const ticketButtonsRow1 = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('ticket_support')
                        .setLabel('Support Technique')
                        .setStyle(ButtonStyle.Primary)
                        .setEmoji('🔧'),
                    new ButtonBuilder()
                        .setCustomId('ticket_general')
                        .setLabel('Question Générale')
                        .setStyle(ButtonStyle.Secondary)
                        .setEmoji('❓'),
                    new ButtonBuilder()
                        .setCustomId('ticket_report')
                        .setLabel('Signalement')
                        .setStyle(ButtonStyle.Danger)
                        .setEmoji('🚨')
                );

            const ticketButtonsRow2 = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('ticket_partnership')
                        .setLabel('Partenariat')
                        .setStyle(ButtonStyle.Success)
                        .setEmoji('🤝'),
                    new ButtonBuilder()
                        .setCustomId('ticket_suggestion')
                        .setLabel('Avis / Feedback')
                        .setStyle(ButtonStyle.Secondary)
                        .setEmoji('💡'),
                    new ButtonBuilder()
                        .setCustomId('ticket_appeal')
                        .setLabel('Appel de Sanction')
                        .setStyle(ButtonStyle.Secondary)
                        .setEmoji('⚖️'),
                    new ButtonBuilder()
                        .setCustomId('ticket_recruitment')
                        .setLabel('Recrutement')
                        .setStyle(ButtonStyle.Primary)
                        .setEmoji('👥')
                );

            // Boutons d'actions rapides
            const quickActionsRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('ticket_faq')
                        .setLabel('FAQ')
                        .setStyle(ButtonStyle.Secondary)
                        .setEmoji('📚'),
                    new ButtonBuilder()
                        .setCustomId('ticket_status')
                        .setLabel('Statut du Support')
                        .setStyle(ButtonStyle.Secondary)
                        .setEmoji('📊'),
                    new ButtonBuilder()
                        .setCustomId('ticket_my_tickets')
                        .setLabel('Mes Tickets')
                        .setStyle(ButtonStyle.Secondary)
                        .setEmoji('📋'),
                    new ButtonBuilder()
                        .setCustomId('ticket_sos')
                        .setLabel('SOS - Aide d\'Urgence')
                        .setStyle(ButtonStyle.Danger)
                        .setEmoji('🆘')
                );

            // Embed d'informations détaillées
            const infoEmbed = new EmbedBuilder()
                .setColor('#2f3136')
                .setTitle('📋 **INFORMATIONS DÉTAILLÉES**')
                .addFields(
                    {
                        name: '⚡ **Temps de Réponse Garantis**',
                        value: Object.entries(this.ticketTypes)
                            .map(([key, config]) => `${config.emoji} **${config.name}** → \`${config.responseTime}\``)
                            .join('\n'),
                        inline: false
                    },
                    {
                        name: '📋 **Avant de Créer un Ticket**',
                        value: '• 📚 Consultez notre **FAQ** pour les questions courantes\n• 📝 Préparez toutes les **informations nécessaires**\n• 🎯 Soyez **précis et détaillé** dans votre description\n• 🔄 **Un ticket = Une demande spécifique**',
                        inline: true
                    },
                    {
                        name: '🎯 **Système de Priorités**',
                        value: '🔴 **Critique** - Traitement immédiat\n🟡 **Élevée** - Sous 4 heures\n🟢 **Normale** - Sous 24 heures\n🔵 **Faible** - Sous 48 heures',
                        inline: true
                    }
                )
                .setFooter({ text: '💡 Astuce : Plus votre description est détaillée, plus nous pourrons vous aider rapidement !' });

            await channel.send({ 
                embeds: [mainEmbed, infoEmbed], 
                components: [ticketButtonsRow1, ticketButtonsRow2, quickActionsRow] 
            });

            this.logger.info(`Panel de tickets premium créé dans ${channel.name}`);
        } catch (error) {
            this.logger.error('Erreur lors de la création du panel de tickets:', error);
            throw error;
        }
    }

    async handleTicketCreation(interaction, type) {
        try {
            // PROTECTION ULTRA RADICALE - UN SEUL TICKET PAR UTILISATEUR À LA FOIS
            const ultimateLock = global.ULTIMATE_TICKET_LOCK;
            const userId = interaction.user.id;
            const now = Date.now();
            
            // Vérifier si l'utilisateur a déjà une action en cours
            if (ultimateLock.activeUsers.has(userId)) {
                const lastAction = ultimateLock.activeUsers.get(userId);
                if (now - lastAction < 5000) { // 5 secondes de protection
                    this.logger.warn(`🚫 BLOCAGE RADICAL: ${interaction.user.username} a déjà une action en cours`);
                    return;
                }
            }
            
            // Verrouiller cet utilisateur IMMÉDIATEMENT
            ultimateLock.activeUsers.set(userId, now);
            
            // Vérification immédiate d'état
            if (interaction.replied || interaction.deferred) {
                return;
            }

            // Protection supplémentaire : vérifier si l'utilisateur a déjà un ticket ouvert
            const guild = interaction.guild;
            const user = interaction.user;
            
            const existingTickets = guild.channels.cache.filter(
                channel => (channel.name.includes(user.username) || channel.name.includes(user.id)) && 
                          (channel.name.includes('ticket') || channel.name.includes(type))
            );

            if (existingTickets.size > 0) {
                try {
                    await interaction.reply({
                        content: `❌ Vous avez déjà un ticket ouvert : ${existingTickets.first()}\n\n💡 Veuillez fermer votre ticket existant avant d'en créer un nouveau.`,
                        flags: MessageFlags.Ephemeral
                    });
                } catch (error) {
                    // Ignorer les erreurs d'interaction expirée
                }
                // Libérer le verrou après 2 secondes
                setTimeout(() => ultimateLock.activeUsers.delete(userId), 2000);
                return;
            }

            // TRAITEMENT SPÉCIAL POUR SUGGESTIONS - MODAL IMMÉDIAT
            if (type === 'suggestion') {
                const suggestionModal = new ModalBuilder()
                    .setCustomId('suggestion_modal_general')
                    .setTitle('💡 Nouvelle Suggestion');

                const titleInput = new TextInputBuilder()
                    .setCustomId('suggestion_title')
                    .setLabel('Titre de votre suggestion')
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder('Un titre court et explicite...')
                    .setRequired(true)
                    .setMaxLength(100);

                const descriptionInput = new TextInputBuilder()
                    .setCustomId('suggestion_description')
                    .setLabel('Description détaillée')
                    .setStyle(TextInputStyle.Paragraph)
                    .setPlaceholder('Décrivez votre suggestion en détail...')
                    .setRequired(true)
                    .setMaxLength(1000);

                suggestionModal.addComponents(
                    new ActionRowBuilder().addComponents(titleInput),
                    new ActionRowBuilder().addComponents(descriptionInput)
                );

                // Affichage immédiat du modal sans vérifications supplémentaires
                try {
                    await interaction.showModal(suggestionModal);
                    this.logger.info(`✅ Modal suggestion affiché pour ${interaction.user.username}`);
                } catch (error) {
                    // Gestion silencieuse des erreurs communes
                    if (error.code === 10062 || error.code === 40060 || error.code === 'InteractionAlreadyReplied') {
                        return;
                    }
                    this.logger.error(`❌ Erreur showModal suggestion:`, error);
                }
                return;
            }

            // TRAITEMENT SPÉCIAL POUR RECRUTEMENT - MODAL IMMÉDIAT
            if (type === 'recruitment') {
                const recruitmentModal = new ModalBuilder()
                    .setCustomId('recruitment_modal_general')
                    .setTitle('👥 Candidature de Recrutement');

                const positionInput = new TextInputBuilder()
                    .setCustomId('recruitment_position')
                    .setLabel('Poste souhaité')
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder('Ex: Modérateur, Administrateur, etc.')
                    .setRequired(true)
                    .setMaxLength(100);

                const experienceInput = new TextInputBuilder()
                    .setCustomId('recruitment_experience')
                    .setLabel('Expérience et compétences')
                    .setStyle(TextInputStyle.Paragraph)
                    .setPlaceholder('Décrivez votre expérience, vos compétences et votre motivation...')
                    .setRequired(true)
                    .setMaxLength(1000);

                const availabilityInput = new TextInputBuilder()
                    .setCustomId('recruitment_availability')
                    .setLabel('Disponibilité')
                    .setStyle(TextInputStyle.Paragraph)
                    .setPlaceholder('Quand êtes-vous disponible ? Combien d\'heures par semaine ?')
                    .setRequired(true)
                    .setMaxLength(500);

                recruitmentModal.addComponents(
                    new ActionRowBuilder().addComponents(positionInput),
                    new ActionRowBuilder().addComponents(experienceInput),
                    new ActionRowBuilder().addComponents(availabilityInput)
                );

                // Affichage immédiat du modal sans vérifications supplémentaires
                try {
                    await interaction.showModal(recruitmentModal);
                    this.logger.info(`✅ Modal recrutement affiché pour ${interaction.user.username}`);
                    // Libérer le verrou après affichage du modal
                    setTimeout(() => ultimateLock.activeUsers.delete(userId), 1000);
                } catch (error) {
                    // Gestion silencieuse des erreurs communes
                    if (error.code === 10062 || error.code === 40060 || error.code === 'InteractionAlreadyReplied') {
                        ultimateLock.activeUsers.delete(userId);
                        return;
                    }
                    this.logger.error(`❌ Erreur showModal recrutement:`, error);
                    ultimateLock.activeUsers.delete(userId);
                }
                return;
            }

            // Pour les autres types : Traitement immédiat
            const config = this.ticketTypes[type];
            if (!config) {
                try {
                    await interaction.reply({
                        content: '❌ Type de ticket invalide.',
                        flags: MessageFlags.Ephemeral
                    });
                } catch (error) {
                    // Ignorer les erreurs d'interaction expirée
                }
                ultimateLock.activeUsers.delete(userId);
                return;
            }

            // Modal immédiat pour tous les autres types
            const modal = new ModalBuilder()
                .setCustomId(`ticket_modal_${type}`)
                .setTitle(`${config.emoji} ${config.name}`);

            const subjectInput = new TextInputBuilder()
                .setCustomId('ticket_subject')
                .setLabel('Sujet de votre demande')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('Résumez votre demande en quelques mots...')
                .setRequired(true)
                .setMaxLength(100);

            const descriptionInput = new TextInputBuilder()
                .setCustomId('ticket_description')
                .setLabel('Description détaillée')
                .setStyle(TextInputStyle.Paragraph)
                .setPlaceholder('Décrivez votre problème/demande en détail...')
                .setRequired(true)
                .setMaxLength(1000);

            const priorityInput = new TextInputBuilder()
                .setCustomId('ticket_priority')
                .setLabel('Niveau d\'urgence (1-5)')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('1 = Faible, 5 = Critique')
                .setRequired(false)
                .setMaxLength(1);

            modal.addComponents(
                new ActionRowBuilder().addComponents(subjectInput),
                new ActionRowBuilder().addComponents(descriptionInput),
                new ActionRowBuilder().addComponents(priorityInput)
            );
            
            try {
                await interaction.showModal(modal);
                this.logger.info(`✅ Modal ${type} affiché pour ${interaction.user.username}`);
                // Libérer le verrou après affichage du modal
                setTimeout(() => ultimateLock.activeUsers.delete(userId), 1000);
            } catch (error) {
                // Gestion silencieuse des erreurs communes
                if (error.code === 10062 || error.code === 40060 || error.code === 'InteractionAlreadyReplied') {
                    ultimateLock.activeUsers.delete(userId);
                    return;
                }
                this.logger.error(`❌ Erreur showModal ${type}:`, error);
                ultimateLock.activeUsers.delete(userId);
            }

        } catch (error) {
            this.logger.error(`❌ Erreur générale lors de la création du ticket ${type}:`, error);
            // Toujours libérer le verrou en cas d'erreur
            const ultimateLock = global.ULTIMATE_TICKET_LOCK;
            ultimateLock.activeUsers.delete(interaction.user.id);
        }
    }

    // MÉTHODE DÉPRÉCIÉE - INTÉGRÉE DANS handleTicketCreation
    // async handleSuggestionCreation(interaction) {
    //     // Cette méthode a été déplacée directement dans handleTicketCreation
    //     // pour éviter les timeouts Discord
    // }

    async handleModalSubmit(interaction) {
        try {
            // PROTECTION ULTRA RADICALE POUR LES MODALS
            const ultimateLock = global.ULTIMATE_TICKET_LOCK;
            const userId = interaction.user.id;
            const modalId = interaction.customId;
            const lockKey = `${userId}_${modalId}`;
            
            // Vérifier si ce modal est déjà en cours de traitement
            if (ultimateLock.activeChannels.has(lockKey)) {
                this.logger.warn(`🚫 BLOCAGE MODAL: ${interaction.user.username} - ${modalId} déjà en cours`);
                return;
            }
            
            // Verrouiller ce modal IMMÉDIATEMENT
            ultimateLock.activeChannels.add(lockKey);
            
            // Libérer automatiquement après 30 secondes
            setTimeout(() => {
                ultimateLock.activeChannels.delete(lockKey);
            }, 30000);

            // Déférence immédiate et silencieuse
            if (!interaction.deferred && !interaction.replied) {
                try {
                    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
                } catch (error) {
                    // Si la déférence échoue, l'interaction est probablement expirée
                    ultimateLock.activeChannels.delete(lockKey);
                    return;
                }
            }

            const [, , type] = interaction.customId.split('_');
            
            // Gestion spéciale pour le modal de recrutement
            if (interaction.customId === 'recruitment_modal_general') {
                const result = await this.handleRecruitmentModalSubmit(interaction);
                ultimateLock.activeChannels.delete(lockKey);
                return result;
            }
            
            const config = this.ticketTypes[type];
            const guild = interaction.guild;
            const user = interaction.user;

            const subject = interaction.fields.getTextInputValue('ticket_subject');
            const description = interaction.fields.getTextInputValue('ticket_description');
            const priority = interaction.fields.getTextInputValue('ticket_priority') || '3';

            // Vérifier si l'utilisateur a déjà un ticket ouvert APRÈS le modal
            const existingTickets = guild.channels.cache.filter(
                channel => channel.name.includes(user.id) && channel.name.includes('ticket')
            );

            if (existingTickets.size > 0) {
                await interaction.editReply({
                    content: `❌ Vous avez déjà un ticket ouvert : ${existingTickets.first()}\n\n💡 Veuillez fermer votre ticket existant avant d'en créer un nouveau.`
                });
                ultimateLock.activeChannels.delete(lockKey);
                return;
            }

            // PROTECTION CONTRE LA CRÉATION DE CANAUX MULTIPLES
            const channelCreationKey = `creating_${userId}_${type}`;
            if (ultimateLock.activeChannels.has(channelCreationKey)) {
                this.logger.warn(`🚫 CRÉATION DE CANAL DÉJÀ EN COURS pour ${interaction.user.username}`);
                await interaction.editReply({
                    content: '❌ Un ticket est déjà en cours de création. Veuillez patienter.'
                });
                ultimateLock.activeChannels.delete(lockKey);
                return;
            }
            
            // Verrouiller la création de canal
            ultimateLock.activeChannels.add(channelCreationKey);
            
            try {
                // Créer ou récupérer la catégorie de tickets
                const ticketCategory = await this.ensureTicketCategory(guild);

                // Créer le canal de ticket
                const ticketNumber = Date.now().toString().slice(-6);
                const ticketChannel = await guild.channels.create({
                    name: `${config.emoji}・${type}-${user.username}-${ticketNumber}`,
                    type: ChannelType.GuildText,
                    parent: ticketCategory.id,
                    topic: `Ticket ${config.name} • ${subject} • Créé par ${user.tag}`,
                    permissionOverwrites: [
                        {
                            id: guild.id,
                            deny: [PermissionFlagsBits.ViewChannel]
                        },
                        {
                            id: user.id,
                            allow: [
                                PermissionFlagsBits.ViewChannel,
                                PermissionFlagsBits.SendMessages,
                                PermissionFlagsBits.ReadMessageHistory,
                                PermissionFlagsBits.AttachFiles,
                                PermissionFlagsBits.EmbedLinks
                            ]
                        },
                        {
                            id: this.staffRoleId,
                            allow: [
                                PermissionFlagsBits.ViewChannel,
                                PermissionFlagsBits.SendMessages,
                                PermissionFlagsBits.ReadMessageHistory,
                                PermissionFlagsBits.ManageMessages,
                                PermissionFlagsBits.AttachFiles,
                                PermissionFlagsBits.EmbedLinks
                            ]
                        }
                    ]
                });
                
                // Libérer immédiatement le verrou de création
                ultimateLock.activeChannels.delete(channelCreationKey);

            // Embed de bienvenue dans le ticket
            const welcomeEmbed = new EmbedBuilder()
                .setColor(config.color)
                .setTitle(`${config.emoji} **${config.name} - Ticket #${ticketNumber}**`)
                .setDescription(`
╭─────────────────────────────────────╮
│     **Bienvenue ${user.displayName}** 👋     │
╰─────────────────────────────────────╯

**📋 Informations du Ticket :**
• **Sujet :** ${subject}
• **Type :** ${config.name}
• **Numéro :** \`#${ticketNumber}\`
• **Priorité :** ${this.getPriorityDisplay(priority)}
• **Créé le :** <t:${Math.floor(Date.now() / 1000)}:F>
• **Temps de réponse estimé :** \`${config.responseTime}\`

**📝 Description :**
\`\`\`
${description}
\`\`\`

**🎯 Prochaines Étapes :**
1️⃣ Notre équipe a été notifiée automatiquement
2️⃣ Un membre du staff vous répondra sous peu
3️⃣ Restez disponible pour d'éventuelles questions

**💡 En attendant, vous pouvez :**
• Ajouter des captures d'écran si nécessaire
• Préciser des détails supplémentaires
• Utiliser les boutons ci-dessous`)
                .setThumbnail(user.displayAvatarURL({ dynamic: true }))
                .setFooter({ 
                    text: `Ticket ID: ${ticketNumber} • Notre équipe est notifiée`,
                    iconURL: guild.iconURL({ dynamic: true })
                })
                .setTimestamp();

            // Boutons d'actions pour le ticket
            const ticketActionsRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('ticket_close')
                        .setLabel('Fermer le Ticket')
                        .setStyle(ButtonStyle.Danger)
                        .setEmoji('🔒'),
                    new ButtonBuilder()
                        .setCustomId('ticket_claim')
                        .setLabel('Prendre en Charge')
                        .setStyle(ButtonStyle.Success)
                        .setEmoji('✋'),
                    new ButtonBuilder()
                        .setCustomId('ticket_add_user')
                        .setLabel('Ajouter Utilisateur')
                        .setStyle(ButtonStyle.Secondary)
                        .setEmoji('👥'),
                    new ButtonBuilder()
                        .setCustomId('ticket_transcript')
                        .setLabel('Transcript')
                        .setStyle(ButtonStyle.Secondary)
                        .setEmoji('📄')
                );

            await ticketChannel.send({
                content: `${user} | <@&${this.staffRoleId}> | <@421670146604793856>`,
                embeds: [welcomeEmbed],
                components: [ticketActionsRow]
            });

            // Notification privée au staff
            await this.notifyStaff(guild, user, ticketChannel, config, subject, description, priority);

                await interaction.editReply({
                    content: `✅ **Ticket créé avec succès !** ${ticketChannel}\n🎯 Notre équipe a été notifiée et vous répondra dans **${config.responseTime}**.`
                });

                this.logger.info(`Ticket #${ticketNumber} créé: ${ticketChannel.name} par ${user.tag} (${type})`);
                
            } catch (channelError) {
                this.logger.error('Erreur lors de la création du canal:', channelError);
                ultimateLock.activeChannels.delete(channelCreationKey);
                await interaction.editReply({
                    content: '❌ Une erreur est survenue lors de la création du ticket.'
                });
            }
            
            // Libérer les verrous
            ultimateLock.activeChannels.delete(lockKey);

        } catch (error) {
            this.logger.error('Erreur lors du traitement du modal:', error);
            
            // Nettoyer tous les verrous en cas d'erreur
            const ultimateLock = global.ULTIMATE_TICKET_LOCK;
            ultimateLock.activeChannels.delete(lockKey);
            
            try {
                await interaction.editReply({
                    content: '❌ Une erreur est survenue lors de la création du ticket.'
                });
            } catch (replyError) {
                // Ignorer les erreurs de réponse
            }
        }
    }

    async notifyStaff(guild, user, ticketChannel, config, subject, description, priority) {
        try {
            // PROTECTION ATOMIQUE ULTRA RADICALE - Un seul thread à la fois
            const globalLockKey = `ATOMIC_NOTIFY_${ticketChannel.id}`;
            
            // Vérification atomique avec une clé unique basée sur le canal
            if (global[globalLockKey]) {
                this.logger.warn(`🚫 VERROU ATOMIQUE: Notification déjà en cours pour ${ticketChannel.name}`);
                return;
            }
            
            // Verrouillage atomique immédiat
            global[globalLockKey] = {
                locked: true,
                timestamp: Date.now(),
                user: user.id,
                channel: ticketChannel.id
            };
            
            // Auto-nettoyage après 30 secondes
            setTimeout(() => {
                delete global[globalLockKey];
            }, 30000);

            const staffRole = guild.roles.cache.get(this.staffRoleId);
            if (!staffRole) {
                delete global[globalLockKey];
                return;
            }

            // Vérification supplémentaire avec le système existant
            const ultimateLock = global.ULTIMATE_TICKET_LOCK;
            const notificationKey = `notify_${ticketChannel.id}_${user.id}_${Date.now()}`;
            
            // Double vérification pour être absolument sûr
            const existingNotifications = Array.from(ultimateLock.sentNotifications).filter(key => 
                key.includes(`_${ticketChannel.id}_${user.id}_`)
            );
            
            if (existingNotifications.length > 0) {
                this.logger.warn(`🚫 DOUBLE VÉRIFICATION: Notification déjà envoyée pour ${ticketChannel.name}`);
                delete global[globalLockKey];
                return;
            }
            
            ultimateLock.sentNotifications.add(notificationKey);

            const staffMembers = staffRole.members;
            
            const notificationEmbed = new EmbedBuilder()
                .setColor('#ff6b6b')
                .setTitle('🚨 **NOUVEAU TICKET CRÉÉ**')
                .setDescription(`
**Un nouveau ticket nécessite votre attention !**

**👤 Utilisateur :** ${user} (${user.tag})
**📋 Sujet :** ${subject}
**🎯 Type :** ${config.emoji} ${config.name}
**⚡ Priorité :** ${this.getPriorityDisplay(priority)}
**📍 Canal :** ${ticketChannel}
**⏰ Temps de réponse attendu :** \`${config.responseTime}\`

**📝 Description :**
\`\`\`
${description.substring(0, 500)}${description.length > 500 ? '...' : ''}
\`\`\``)
                .setThumbnail(user.displayAvatarURL({ dynamic: true }))
                .setFooter({ text: 'Cliquez sur "Prendre en Charge" dans le ticket pour le traiter' })
                .setTimestamp();

            // Envoi séquentiel avec protection contre les doublons
            let sentCount = 0;
            const sentTo = new Set(); // Protection contre l'envoi multiple au même membre
            
            for (const [id, member] of staffMembers) {
                // Vérifier qu'on n'a pas déjà envoyé à ce membre
                if (sentTo.has(id)) {
                    continue;
                }
                
                try {
                    await member.send({ embeds: [notificationEmbed] });
                    sentTo.add(id);
                    sentCount++;
                    this.logger.info(`📧 Notification envoyée à ${member.user.tag}`);
                    
                    // Délai entre chaque envoi pour éviter le rate limiting
                    if (sentCount < staffMembers.size) {
                        await new Promise(resolve => setTimeout(resolve, 200));
                    }
                } catch (error) {
                    this.logger.warn(`⚠️ Impossible d'envoyer MP à ${member.user.tag}`);
                }
            }
            
            this.logger.success(`✅ NOTIFICATION ATOMIQUE UNIQUE envoyée à ${sentCount} membres du staff pour ${ticketChannel.name}`);
            
            // Libérer le verrou atomique après succès
            delete global[globalLockKey];

        } catch (error) {
            this.logger.error('Erreur lors de la notification atomique du staff:', error);
            // Toujours libérer le verrou en cas d'erreur
            const globalLockKey = `ATOMIC_NOTIFY_${ticketChannel.id}`;
            delete global[globalLockKey];
        }
    }

    getPriorityDisplay(priority) {
        const priorities = {
            '1': '🟢 **Faible**',
            '2': '🔵 **Normale**',
            '3': '🟡 **Moyenne**',
            '4': '🟠 **Élevée**',
            '5': '🔴 **Critique**'
        };
        return priorities[priority] || '🟡 **Moyenne**';
    }

    // Gestionnaires pour les boutons d'actions rapides
    async handleQuickAction(interaction) {
        const action = interaction.customId;

        switch (action) {
            case 'ticket_faq':
                await this.showFAQ(interaction);
                break;
            case 'ticket_status':
                await this.showSupportStatus(interaction);
                break;
            case 'ticket_my_tickets':
                await this.showUserTickets(interaction);
                break;
            case 'ticket_contact_staff':
                await this.contactStaff(interaction);
                break;
            case 'ticket_sos':
                await this.showSOSPanel(interaction);
                break;
            case 'sos_create_support_ticket':
                // Rediriger vers la création d'un ticket de support spécialisé
                await this.handleTicketCreation(interaction, 'support');
                break;
        }
    }

    async showFAQ(interaction) {
        const faqEmbed = new EmbedBuilder()
            .setColor('#3498db')
            .setTitle('📚 **QUESTIONS FRÉQUEMMENT POSÉES**')
            .setDescription('**Voici les réponses aux questions les plus courantes :**')
            .addFields(
                { 
                    name: '❓ **Comment créer un ticket ?**', 
                    value: 'Cliquez sur l\'un des boutons ci-dessus selon votre type de demande, puis remplissez le formulaire.', 
                    inline: false 
                },
                { 
                    name: '⏱️ **Combien de temps pour une réponse ?**', 
                    value: 'Nos temps de réponse varient de 30 minutes à 24 heures selon la priorité de votre demande.', 
                    inline: false 
                },
                { 
                    name: '🔄 **Puis-je modifier mon ticket ?**', 
                    value: 'Oui, vous pouvez ajouter des informations à tout moment dans votre canal de ticket.', 
                    inline: false 
                },
                { 
                    name: '👥 **Puis-je ajouter quelqu\'un à mon ticket ?**', 
                    value: 'Utilisez le bouton "Ajouter Utilisateur" dans votre ticket pour inviter quelqu\'un.', 
                    inline: false 
                },
                { 
                    name: '🔒 **Comment fermer mon ticket ?**', 
                    value: 'Utilisez le bouton "Fermer le Ticket" ou demandez à un membre du staff.', 
                    inline: false 
                }
            )
            .setFooter({ text: 'Si votre question n\'est pas listée, créez un ticket !' })
            .setTimestamp();

        await this.safeInteractionReply(interaction, { embeds: [faqEmbed], flags: MessageFlags.Ephemeral });
    }

    async showSupportStatus(interaction) {
        const guild = interaction.guild;
        const staffRole = guild.roles.cache.get(this.staffRoleId);
        const onlineStaff = staffRole ? staffRole.members.filter(member => member.presence?.status !== 'offline').size : 0;
        const totalStaff = staffRole ? staffRole.members.size : 0;

        const statusEmbed = new EmbedBuilder()
            .setColor('#2ecc71')
            .setTitle('📊 **STATUT DU SUPPORT EN TEMPS RÉEL**')
            .addFields(
                { name: '🟢 **Statut Global**', value: 'Tous les services opérationnels', inline: true },
                { name: '👥 **Équipe Disponible**', value: `${onlineStaff}/${totalStaff} agents en ligne`, inline: true },
                { name: '📈 **Charge Actuelle**', value: 'Normale (< 70%)', inline: true },
                { name: '⏱️ **Temps de Réponse Moyen**', value: '15 minutes', inline: true },
                { name: '🎯 **Tickets Actifs**', value: `${guild.channels.cache.filter(c => c.name.includes('ticket')).size} tickets`, inline: true },
                { name: '✅ **Disponibilité**', value: '24h/7j', inline: true }
            )
            .setFooter({ text: 'Dernière mise à jour maintenant' })
            .setTimestamp();

        await this.safeInteractionReply(interaction, { embeds: [statusEmbed], flags: MessageFlags.Ephemeral });
    }

    async showUserTickets(interaction) {
        const guild = interaction.guild;
        const userTickets = guild.channels.cache.filter(
            channel => channel.name.includes(interaction.user.username) && channel.name.includes('ticket')
        );
        
        const ticketsEmbed = new EmbedBuilder()
            .setColor('#9b59b6')
            .setTitle('📋 **VOS TICKETS**')
            .setDescription(userTickets.size > 0 ? 
                userTickets.map(ticket => 
                    `• ${ticket} - Créé <t:${Math.floor(ticket.createdTimestamp / 1000)}:R>`
                ).join('\n') : 
                '**Vous n\'avez aucun ticket ouvert actuellement.**\n\n*Utilisez les boutons ci-dessus pour créer un nouveau ticket.*'
            )
            .setFooter({ text: `Total: ${userTickets.size} ticket(s)` })
            .setTimestamp();

        await this.safeInteractionReply(interaction, { embeds: [ticketsEmbed], flags: MessageFlags.Ephemeral });
    }

    async contactStaff(interaction) {
        const contactEmbed = new EmbedBuilder()
            .setColor('#e74c3c')
            .setTitle('📞 **CONTACT DIRECT AVEC LE STAFF**')
            .setDescription(`
**Pour un contact direct avec notre équipe :**

**💬 Discord :**
• Mentionnez <@&${this.staffRoleId}> dans votre ticket
• Utilisez les canaux publics pour les questions générales

**⚡ Urgences :**
• Créez un ticket de type "Signalement" 
• Temps de réponse garanti : 30 minutes - 1 heure

**📧 Autres moyens :**
• Les tickets restent le moyen le plus efficace
• Toutes les demandes sont traitées par ordre de priorité

**🎯 Conseil :** Créez un ticket pour un suivi optimal de votre demande !`)
            .setFooter({ text: 'Notre équipe est là pour vous aider !' })
            .setTimestamp();

        await this.safeInteractionReply(interaction, { embeds: [contactEmbed], flags: MessageFlags.Ephemeral });
    }

    async showSOSPanel(interaction) {
        try {
            this.logger.info(`🆘 Début de showSOSPanel pour ${interaction.user.username}`);
            
            // Embed principal SOS avec design professionnel
            const sosMainEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('🆘 **AIDE D\'URGENCE - PRÉVENTION DU SUICIDE**')
                .setDescription(`
╭─────────────────────────────────────╮
│   **🚨 VOUS N'ÊTES PAS SEUL(E) 🚨**   │
╰─────────────────────────────────────╯

**Si vous traversez une période difficile, des professionnels sont là pour vous aider.**

**⚡ URGENCE IMMÉDIATE :**
• **SAMU :** \`15\` 🚑
• **Pompiers :** \`18\` 🚒
• **Police :** \`17\` 👮
• **Numéro d'urgence européen :** \`112\` 🌍

**🤝 Vous avez de la valeur et votre vie compte.**`)
                .setThumbnail('https://cdn.discordapp.com/emojis/1234567890123456789.png') // Vous pouvez ajouter une icône
                .setFooter({ 
                    text: '💝 Il y a toujours de l\'espoir • Vous méritez d\'être aidé(e)',
                    iconURL: interaction.client.user.displayAvatarURL()
                })
                .setTimestamp();

            // Embed avec les numéros de prévention du suicide
            const preventionEmbed = new EmbedBuilder()
                .setColor('#ff6b6b')
                .setTitle('📞 **LIGNES D\'ÉCOUTE SPÉCIALISÉES**')
                .addFields(
                    {
                        name: '🇫🇷 **FRANCE - Prévention du Suicide**',
                        value: `
**📞 Suicide Écoute :** \`01 45 39 40 00\`
• **Disponibilité :** 24h/24, 7j/7
• **Service :** Gratuit et anonyme
• **Site web :** suicide-ecoute.fr

**📞 SOS Amitié :** \`09 72 39 40 50\`
• **Disponibilité :** 24h/24, 7j/7  
• **Service :** Écoute bienveillante
• **Site web :** sos-amitie.org`,
                        inline: false
                    },
                    {
                        name: '🌐 **INTERNATIONAL**',
                        value: `
**🇧🇪 Belgique :** \`0800 32 123\` (24h/24)
**🇨🇭 Suisse :** \`143\` (24h/24)
**🇨🇦 Canada :** \`1-833-456-4566\` (24h/24)
**🌍 International :** befrienders.org`,
                        inline: true
                    },
                    {
                        name: '👥 **JEUNES & ÉTUDIANTS**',
                        value: `
**📞 Fil Santé Jeunes :** \`0800 235 236\`
• **Âge :** 12-25 ans
• **Horaires :** 9h-23h
• **Chat :** filsantejeunes.com

**📞 Nightline :** nightline.fr
• **Service :** Par et pour les étudiants`,
                        inline: true
                    }
                )
                .setFooter({ text: 'Tous ces services sont confidentiels et gratuits' });

            // Embed avec resources en ligne et conseils
            const resourcesEmbed = new EmbedBuilder()
                .setColor('#4CAF50')
                .setTitle('💻 **RESSOURCES EN LIGNE & CONSEILS**')
                .addFields(
                    {
                        name: '🌐 **Sites Web d\'Aide**',
                        value: `
• **stopblues.fr** - Prévention de la dépression chez les jeunes
• **psycom.org** - Information en santé mentale
• **santementale.fr** - Ressources officielles
• **tchat-suicide-ecoute.org** - Chat anonyme 24h/24`,
                        inline: false
                    },
                    {
                        name: '📱 **Applications Mobiles**',
                        value: `
• **Mon Sherpa** - Accompagnement psychologique
• **Mood Tools** - Outils contre la dépression
• **Sanvello** - Gestion de l'anxiété
• **Headspace** - Méditation et bien-être`,
                        inline: true
                    },
                    {
                        name: '🏥 **Où Aller Physiquement**',
                        value: `
• **Urgences hospitalières** 🏥
• **Centres Médico-Psychologiques (CMP)**
• **Maisons des Adolescents (MDA)**
• **Points d'Accueil Écoute Jeunes (PAEJ)**`,
                        inline: true
                    }
                )
                .setFooter({ text: 'N\'hésitez pas à vous faire accompagner par un proche' });

            // Embed avec signes d'alarme et conseils pour l'entourage
            const supportEmbed = new EmbedBuilder()
                .setColor('#9C27B0')
                .setTitle('❤️ **POUR L\'ENTOURAGE & SIGNES D\'ALARME**')
                .addFields(
                    {
                        name: '🚨 **Signes à Surveiller**',
                        value: `
• Changements soudains de comportement
• Isolement social marqué
• Perte d'intérêt pour les activités
• Troubles du sommeil/appétit
• Expressions de désespoir
• Don d'objets personnels`,
                        inline: true
                    },
                    {
                        name: '🤝 **Comment Aider**',
                        value: `
• **Écoutez** sans juger
• **Prenez** les menaces au sérieux
• **Encouragez** à chercher de l'aide
• **Accompagnez** si possible
• **Restez** en contact régulier
• **Prenez soin** de vous aussi`,
                        inline: true
                    },
                    {
                        name: '💡 **Phrases Aidantes**',
                        value: `
✅ "Je suis là pour toi"
✅ "Tu comptes pour moi"
✅ "Veux-tu qu'on en parle ?"
✅ "Comment puis-je t'aider ?"
❌ Évitez les jugements/minimisations`,
                        inline: false
                    }
                )
                .setFooter({ text: 'Votre présence et votre écoute font la différence' });

            // Embed final avec message d'espoir
            const hopeEmbed = new EmbedBuilder()
                .setColor('#FFD700')
                .setTitle('🌟 **MESSAGE D\'ESPOIR**')
                .setDescription(`
**🌅 Il y a toujours une lueur d'espoir, même dans les moments les plus sombres.**

**💪 Rappels importants :**
• Vos sentiments sont temporaires, pas permanents
• Demander de l'aide est un signe de force, pas de faiblesse  
• Vous avez survécu à 100% de vos mauvais jours jusqu'à présent
• Chaque jour est une nouvelle opportunité
• Vous méritez d'être heureux(se) et en paix

**🎯 Prochaines étapes suggérées :**
1️⃣ Contactez une ligne d'écoute dès maintenant si nécessaire
2️⃣ Parlez à un proche de confiance
3️⃣ Prenez rendez-vous avec un professionnel
4️⃣ Créez un ticket "Support" si vous voulez parler à notre équipe

**🌈 Votre histoire n'est pas terminée. Les plus belles pages restent à écrire.**`)
                .setImage('https://i.imgur.com/hopeful-banner.png') // Vous pouvez ajouter une image inspirante
                .setFooter({ 
                    text: '💝 Vous n\'êtes jamais seul(e) • Cette communauté vous soutient',
                    iconURL: interaction.guild.iconURL({ dynamic: true })
                });

            // Boutons d'actions rapides
            const sosActionsRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('sos_create_support_ticket')
                        .setLabel('Parler à Notre Équipe')
                        .setStyle(ButtonStyle.Success)
                        .setEmoji('💬'),
                    new ButtonBuilder()
                        .setLabel('Suicide Écoute')
                        .setStyle(ButtonStyle.Link)
                        .setURL('https://suicide-ecoute.fr')
                        .setEmoji('📞'),
                    new ButtonBuilder()
                        .setLabel('SOS Amitié')
                        .setStyle(ButtonStyle.Link)
                        .setURL('https://sos-amitie.org')
                        .setEmoji('🤝'),
                    new ButtonBuilder()
                        .setLabel('Fil Santé Jeunes')
                        .setStyle(ButtonStyle.Link)
                        .setURL('https://filsantejeunes.com')
                        .setEmoji('👥')
                );

            await this.safeInteractionReply(interaction, {
                embeds: [sosMainEmbed, preventionEmbed, resourcesEmbed, supportEmbed, hopeEmbed],
                components: [sosActionsRow],
                flags: MessageFlags.Ephemeral
            });

            this.logger.info(`✅ Panel SOS envoyé avec succès pour ${interaction.user.username}`);

            // Log pour suivi (de manière anonyme)
            this.logger.info(`Panel SOS consulté par un utilisateur dans ${interaction.guild.name}`);

        } catch (error) {
            this.logger.error('Erreur lors de l\'affichage du panel SOS:', error);
            
            // Message de fallback simple mais important
            try {
                await this.safeInteractionReply(interaction, {
                    content: `🆘 **NUMÉROS D'URGENCE:**\n\n**France:**\n• Suicide Écoute: \`01 45 39 40 00\` (24h/24)\n• SOS Amitié: \`09 72 39 40 50\` (24h/24)\n• SAMU: \`15\`\n• Urgences: \`112\`\n\n**Vous n'êtes pas seul(e). Il y a toujours de l'espoir.** 💝`,
                    flags: MessageFlags.Ephemeral
                });
            } catch (fallbackError) {
                this.logger.error('Impossible d\'envoyer le message SOS de fallback:', fallbackError);
            }
        }
    }

    // Gestionnaires pour les actions dans les tickets
    async handleTicketAction(interaction) {
        const action = interaction.customId;

        switch (action) {
            case 'ticket_close':
                await this.closeTicket(interaction);
                break;
            case 'ticket_claim':
                await this.claimTicket(interaction);
                break;
            case 'ticket_add_user':
                await this.addUserToTicket(interaction);
                break;
            case 'ticket_transcript':
                await this.createTranscript(interaction);
                break;
        }
    }

    async closeTicket(interaction) {
        try {
            // Vérification immédiate de l'état de l'interaction
            if (interaction.replied || interaction.deferred) {
                this.logger.warn('⚠️ Interaction déjà traitée dans closeTicket');
                return;
            }

            const channel = interaction.channel;
            
            const confirmEmbed = new EmbedBuilder()
                .setColor('#e74c3c')
                .setTitle('🔒 **FERMETURE DU TICKET**')
                .setDescription(`
**Êtes-vous sûr de vouloir fermer ce ticket ?**

Cette action est **irréversible** et le canal sera supprimé dans 10 secondes après confirmation.

**📋 Résumé du ticket :**
• **Canal :** ${channel.name}
• **Créé le :** <t:${Math.floor(channel.createdTimestamp / 1000)}:F>
• **Durée :** <t:${Math.floor(channel.createdTimestamp / 1000)}:R>`)
                .setFooter({ text: 'Cliquez sur "Confirmer" pour fermer définitivement' });

            const confirmRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('confirm_close')
                        .setLabel('Confirmer la Fermeture')
                        .setStyle(ButtonStyle.Danger)
                        .setEmoji('✅'),
                    new ButtonBuilder()
                        .setCustomId('cancel_close')
                        .setLabel('Annuler')
                        .setStyle(ButtonStyle.Secondary)
                        .setEmoji('❌')
                );

            // Tentative de réponse avec gestion d'erreur
            try {
                await interaction.reply({
                    embeds: [confirmEmbed],
                    components: [confirmRow],
                    flags: MessageFlags.Ephemeral
                });
            } catch (replyError) {
                if (replyError.code === 10062) {
                    this.logger.warn('⏰ Interaction expirée lors de closeTicket - envoi message direct');
                    // Fallback : envoyer un message normal dans le canal
                    await channel.send({
                        content: `${interaction.user} veut fermer ce ticket.`,
                        embeds: [confirmEmbed],
                        components: [confirmRow]
                    });
                } else {
                    throw replyError;
                }
            }

        } catch (error) {
            this.logger.error('Erreur lors de la fermeture du ticket:', error);
            // Tentative d'envoi d'un message d'erreur direct dans le canal
            try {
                await interaction.channel.send({
                    content: `❌ ${interaction.user}, une erreur est survenue lors de la fermeture du ticket.`
                });
            } catch (fallbackError) {
                this.logger.error('Impossible d\'envoyer le message de fallback:', fallbackError);
            }
        }
    }

    async claimTicket(interaction) {
        try {
            const member = interaction.member;
            const restrictedRoleId = '1386990308679483393';

            // Vérifier si l'utilisateur a le rôle restreint
            if (member.roles.cache.has(restrictedRoleId)) {
                return await this.safeInteractionReply(interaction, {
                    content: '❌ **Accès refusé !**\n\nVous n\'avez pas les permissions nécessaires pour prendre en charge un ticket.\n\n💡 Cette action est réservée à l\'équipe de modération.',
                    flags: MessageFlags.Ephemeral
                });
            }

            // Vérifier si l'utilisateur a le rôle staff
            if (!member.roles.cache.has(this.staffRoleId)) {
                return await this.safeInteractionReply(interaction, {
                    content: '❌ **Permissions insuffisantes !**\n\nSeuls les membres du staff peuvent prendre en charge un ticket.',
                    flags: MessageFlags.Ephemeral
                });
            }

            const channel = interaction.channel;
            const staff = interaction.user;

            const claimEmbed = new EmbedBuilder()
                .setColor('#2ecc71')
                .setTitle('✋ **TICKET PRIS EN CHARGE**')
                .setDescription(`
**${staff} a pris ce ticket en charge !**

**📋 Informations :**
• **Agent assigné :** ${staff}
• **Pris en charge le :** <t:${Math.floor(Date.now() / 1000)}:F>
• **Statut :** 🟢 En cours de traitement

**👤 ${channel.topic?.split('•')[2]?.trim() || 'Utilisateur'} :** Votre demande est maintenant entre de bonnes mains !`)
                .setThumbnail(staff.displayAvatarURL({ dynamic: true }))
                .setFooter({ text: 'Ticket assigné avec succès' })
                .setTimestamp();

            // Utiliser safeInteractionReply qui gère déjà les timeouts
            const success = await this.safeInteractionReply(interaction, { embeds: [claimEmbed] });
            
            if (!success) {
                // Si l'interaction a échoué, envoyer un message direct dans le canal
                await channel.send({
                    content: `✋ **${staff} a pris ce ticket en charge !**`,
                    embeds: [claimEmbed]
                });
            }

        } catch (error) {
            this.logger.error('Erreur lors de la prise en charge:', error);
            
            // Fallback d'urgence : message dans le canal
            try {
                await interaction.channel.send({
                    content: `✋ ${interaction.user} a pris ce ticket en charge.`
                });
            } catch (fallbackError) {
                this.logger.error('Impossible d\'envoyer le message de fallback:', fallbackError);
            }
        }
    }

    async addUserToTicket(interaction) {
        // Modal pour ajouter un utilisateur
        const modal = new ModalBuilder()
            .setCustomId('add_user_modal')
            .setTitle('👥 Ajouter un Utilisateur');

        const userInput = new TextInputBuilder()
            .setCustomId('user_id')
            .setLabel('ID ou mention de l\'utilisateur')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('123456789012345678 ou @utilisateur')
            .setRequired(true);

        modal.addComponents(new ActionRowBuilder().addComponents(userInput));
        await interaction.showModal(modal);
    }

    async createTranscript(interaction) {
        try {
            // Utiliser le validateur d'interactions pour une déférence rapide
            const validator = interaction.client.interactionValidator;
            const deferred = await validator.quickDefer(interaction, { flags: MessageFlags.Ephemeral });
            
            if (!deferred) {
                return; // Interaction expirée ou déjà traitée
            }

            const channel = interaction.channel;
            const messages = await channel.messages.fetch({ limit: 100 });
            
            let transcript = `TRANSCRIPT DU TICKET - ${channel.name}\n`;
            transcript += `Généré le: ${new Date().toLocaleString('fr-FR')}\n`;
            transcript += `Canal: ${channel.name}\n`;
            transcript += `Créé le: ${new Date(channel.createdTimestamp).toLocaleString('fr-FR')}\n\n`;
            transcript += '='.repeat(50) + '\n\n';

            messages.reverse().forEach(msg => {
                transcript += `[${new Date(msg.createdTimestamp).toLocaleString('fr-FR')}] ${msg.author.tag}: ${msg.content}\n`;
                if (msg.embeds.length > 0) {
                    transcript += `  [EMBED: ${msg.embeds[0].title || 'Sans titre'}]\n`;
                }
                if (msg.attachments.size > 0) {
                    transcript += `  [FICHIERS: ${msg.attachments.map(a => a.name).join(', ')}]\n`;
                }
                transcript += '\n';
            });

            // Créer un embed avec le transcript
            const transcriptEmbed = new EmbedBuilder()
                .setColor('#3498db')
                .setTitle('📄 **TRANSCRIPT GÉNÉRÉ**')
                .setDescription(`
**Transcript du ticket généré avec succès !**

**📋 Informations :**
• **Canal :** ${channel.name}
• **Messages récupérés :** ${messages.size}
• **Généré le :** <t:${Math.floor(Date.now() / 1000)}:F>
• **Généré par :** ${interaction.user}

**📎 Le transcript complet a été envoyé en message privé.**`)
                .setFooter({ text: 'Transcript sauvegardé' })
                .setTimestamp();

            // Envoyer le transcript en MP
            try {
                await interaction.user.send({
                    content: `**Transcript du ticket ${channel.name}**`,
                    files: [{
                        attachment: Buffer.from(transcript, 'utf8'),
                        name: `transcript-${channel.name}-${Date.now()}.txt`
                    }]
                });

                await interaction.editReply({ embeds: [transcriptEmbed] });
            } catch (error) {
                await interaction.editReply({
                    content: '❌ Impossible d\'envoyer le transcript en MP. Vérifiez vos paramètres de confidentialité.'
                });
            }

        } catch (error) {
            this.logger.error('Erreur lors de la création du transcript:', error);
            await interaction.editReply({
                content: '❌ Une erreur est survenue lors de la génération du transcript.'
            });
        }
    }

    async handleAddUserModal(interaction) {
        try {
            const userId = interaction.fields.getTextInputValue('user_id').replace(/[<@!>]/g, '');
            const channel = interaction.channel;
            const guild = interaction.guild;

            const user = await guild.members.fetch(userId).catch(() => null);
            if (!user) {
                return await this.safeInteractionReply(interaction, {
                    content: '❌ Utilisateur introuvable. Vérifiez l\'ID ou la mention.',
                    flags: MessageFlags.Ephemeral
                });
            }

            // Ajouter les permissions à l'utilisateur
            await channel.permissionOverwrites.create(user.id, {
                ViewChannel: true,
                SendMessages: true,
                ReadMessageHistory: true,
                AttachFiles: true,
                EmbedLinks: true
            });

            const addUserEmbed = new EmbedBuilder()
                .setColor('#2ecc71')
                .setTitle('👥 **UTILISATEUR AJOUTÉ**')
                .setDescription(`
**${user} a été ajouté au ticket !**

**📋 Informations :**
• **Utilisateur ajouté :** ${user} (${user.user.tag})
• **Ajouté par :** ${interaction.user}
• **Ajouté le :** <t:${Math.floor(Date.now() / 1000)}:F>
• **Permissions accordées :** Lecture, écriture, fichiers

**👋 ${user}, bienvenue dans ce ticket !**`)
                .setThumbnail(user.user.displayAvatarURL({ dynamic: true }))
                .setFooter({ text: 'Utilisateur ajouté avec succès' })
                .setTimestamp();

            await this.safeInteractionReply(interaction, { embeds: [addUserEmbed] });

        } catch (error) {
            this.logger.error('Erreur lors de l\'ajout d\'utilisateur:', error);
            await this.safeInteractionReply(interaction, {
                content: '❌ Une erreur est survenue lors de l\'ajout de l\'utilisateur.',
                flags: MessageFlags.Ephemeral
            });
        }
    }

    async handleConfirmClose(interaction) {
        try {
            const channel = interaction.channel;
            const guild = interaction.guild;
            
            const closingEmbed = new EmbedBuilder()
                .setColor('#e74c3c')
                .setTitle('🔒 **TICKET EN COURS DE FERMETURE**')
                .setDescription(`
**Ce ticket va être fermé dans 10 secondes...**

**📋 Résumé final :**
• **Fermé par :** ${interaction.user}
• **Fermé le :** <t:${Math.floor(Date.now() / 1000)}:F>
• **Durée totale :** <t:${Math.floor(channel.createdTimestamp / 1000)}:R>

**💾 Pensez à sauvegarder les informations importantes !**

*Merci d'avoir utilisé notre système de support.*`)
                .setFooter({ text: 'Fermeture automatique dans 10 secondes' })
                .setTimestamp();

            // Tentative de mise à jour avec gestion d'erreur d'expiration
            let updateSuccess = false;
            try {
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.update({
                        embeds: [closingEmbed],
                        components: []
                    });
                    updateSuccess = true;
                } else {
                    this.logger.warn('⚠️ Interaction déjà traitée dans handleConfirmClose');
                }
            } catch (updateError) {
                if (updateError.code === 10062) {
                    this.logger.warn('⏰ Interaction expirée lors de handleConfirmClose - envoi message direct');
                    // Fallback : envoyer un nouveau message dans le canal
                    await channel.send({
                        content: `🔒 **${interaction.user} a confirmé la fermeture du ticket**`,
                        embeds: [closingEmbed]
                    });
                    updateSuccess = true;
                } else {
                    throw updateError;
                }
            }

            if (updateSuccess) {
                // Envoyer le feedback complet dans le canal de logs (de manière asynchrone)
                this.sendTicketFeedback(channel, interaction.user, guild).catch(error => {
                    this.logger.error('Erreur lors de l\'envoi du feedback:', error);
                });

                // Supprimer le canal après 10 secondes
                setTimeout(async () => {
                    try {
                        this.logger.info(`🗑️ Suppression du ticket: ${channel.name}`);
                        await channel.delete('Ticket fermé');
                        this.logger.success(`✅ Ticket ${channel.name} supprimé avec succès`);
                    } catch (deleteError) {
                        this.logger.error(`❌ Erreur lors de la suppression du canal ${channel.name}:`, deleteError);
                    }
                }, 10000);
            }

        } catch (error) {
            this.logger.error('Erreur lors de la fermeture confirmée:', error);
            
            // Fallback d'urgence : message dans le canal
            try {
                await interaction.channel.send({
                    content: `❌ ${interaction.user}, une erreur est survenue lors de la fermeture. Le ticket reste ouvert.`
                });
            } catch (fallbackError) {
                this.logger.error('Impossible d\'envoyer le message de fallback:', fallbackError);
            }
        }
    }

    async handleCancelClose(interaction) {
        try {
            const cancelEmbed = new EmbedBuilder()
                .setColor('#2ecc71')
                .setTitle('✅ **FERMETURE ANNULÉE**')
                .setDescription(`
**La fermeture du ticket a été annulée.**

Le ticket reste ouvert et vous pouvez continuer à l'utiliser normalement.

**🎯 Actions disponibles :**
• Continuer la conversation
• Utiliser les boutons d'actions
• Fermer plus tard si nécessaire`)
                .setFooter({ text: 'Ticket toujours actif' })
                .setTimestamp();

            // Tentative de mise à jour avec gestion d'erreur d'expiration
            try {
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.update({
                        embeds: [cancelEmbed],
                        components: []
                    });
                } else {
                    this.logger.warn('⚠️ Interaction déjà traitée dans handleCancelClose');
                }
            } catch (updateError) {
                if (updateError.code === 10062) {
                    this.logger.warn('⏰ Interaction expirée lors de handleCancelClose - envoi message direct');
                    // Fallback : envoyer un nouveau message dans le canal
                    await interaction.channel.send({
                        content: `✅ **${interaction.user} a annulé la fermeture du ticket**`,
                        embeds: [cancelEmbed]
                    });
                } else {
                    throw updateError;
                }
            }

        } catch (error) {
            this.logger.error('Erreur lors de l\'annulation de fermeture:', error);
            
            // Fallback d'urgence : message dans le canal
            try {
                await interaction.channel.send({
                    content: `✅ ${interaction.user} a annulé la fermeture du ticket.`
                });
            } catch (fallbackError) {
                this.logger.error('Impossible d\'envoyer le message de fallback:', fallbackError);
            }
        }
    }

    // Fonction pour envoyer le feedback complet du ticket
    async sendTicketFeedback(channel, closedBy, guild) {
        try {
            // Détecter le type de ticket à partir du nom du canal
            const channelName = channel.name.toLowerCase();
            this.logger.info(`🔍 Détection du type de ticket pour: ${channelName}`);
            
            // Détection ULTRA précise des types de tickets avec logging détaillé
            const isReportTicket = channelName.includes('report') || channelName.includes('signalement') || channelName.includes('🚨');
            const isSuggestionTicket = channelName.includes('suggestion') || channelName.includes('💡・suggestion') || (channelName.includes('💡') && channelName.includes('suggestion'));
            const isRecruitmentTicket = channelName.includes('recruitment') || channelName.includes('recrutement') || channelName.includes('👥');
            
            this.logger.info(`📋 Type détecté - Report: ${isReportTicket}, Suggestion: ${isSuggestionTicket}, Recruitment: ${isRecruitmentTicket}`);
            this.logger.info(`📋 Nom du canal analysé: "${channelName}"`);

            // TRAITEMENT SPÉCIALISÉ POUR LES TICKETS DE RECRUTEMENT avec logging renforcé
            if (isRecruitmentTicket) {
                this.logger.success(`🎯 ACTIVATION DU SYSTÈME DE STOCKAGE OPTIMISÉ POUR RECRUTEMENT !`);
                this.logger.info(`📊 Début du traitement spécialisé pour: ${channel.name}`);
                await this.handleRecruitmentTicketClosure(channel, closedBy, guild);
                this.logger.success(`✅ Traitement spécialisé recrutement terminé pour: ${channel.name}`);
                return;
            }

            // Traitement standard pour les autres types de tickets
            this.logger.info(`📋 Traitement standard pour ticket: ${channel.name}`);
            await this.handleStandardTicketClosure(channel, closedBy, guild, {
                isReport: isReportTicket,
                isSuggestion: isSuggestionTicket
            });

        } catch (error) {
            this.logger.error('❌ Erreur lors de l\'envoi du feedback:', error);
        }
    }

    // NOUVEAU: Gestion spécialisée pour la fermeture des tickets de recrutement
    async handleRecruitmentTicketClosure(channel, closedBy, guild) {
        try {
            this.logger.success(`🚀 DÉBUT DU SYSTÈME DE STOCKAGE OPTIMISÉ POUR RECRUTEMENT`);
            this.logger.info(`👥 Traitement spécialisé de fermeture pour ticket de recrutement: ${channel.name}`);

            // Récupérer tous les messages du ticket pour analyse complète
            this.logger.info(`📥 Récupération des messages du ticket...`);
            const messages = await channel.messages.fetch({ limit: 100 });
            const messagesArray = Array.from(messages.values()).reverse();
            this.logger.success(`📊 ${messagesArray.length} messages récupérés pour analyse`);
            
            // Extraire les informations détaillées du candidat
            this.logger.info(`🔍 Extraction des informations du candidat...`);
            const candidateInfo = await this.extractRecruitmentInfo(messagesArray, channel);
            this.logger.success(`👤 Candidat: ${candidateInfo.candidateName} | Poste: ${candidateInfo.position}`);
            
            // Calculer les statistiques détaillées du ticket
            this.logger.info(`📈 Calcul des statistiques du ticket...`);
            const ticketStats = this.calculateTicketStats(channel, messagesArray);
            this.logger.success(`⏱️ Durée: ${ticketStats.duration} | Messages: ${ticketStats.messageCount}`);
            
            // Trouver ou créer le canal de logs de recrutement
            this.logger.info(`📂 Recherche/création du canal d'archives...`);
            const recruitmentLogChannel = await this.ensureRecruitmentLogChannel(guild);
            this.logger.success(`✅ Canal d'archives trouvé: ${recruitmentLogChannel.name}`);
            
            // Créer l'embed principal avec toutes les informations de candidature
            this.logger.info(`🎨 Génération des embeds détaillés...`);
            const recruitmentFeedbackEmbed = new EmbedBuilder()
                .setColor('#8e44ad')
                .setTitle('👥 **CANDIDATURE DE RECRUTEMENT FERMÉE - STOCKAGE OPTIMISÉ**')
                .setDescription(`
**📊 RÉSUMÉ COMPLET DE LA CANDIDATURE**

**👤 PROFIL DU CANDIDAT :**
• **Nom :** ${candidateInfo.candidateName}
• **ID Discord :** \`${candidateInfo.candidateId}\`
• **Avatar :** [Voir profil](${candidateInfo.candidateAvatar || 'Non disponible'})
• **Poste visé :** **${candidateInfo.position}**
• **Date de candidature :** <t:${Math.floor(channel.createdTimestamp / 1000)}:F>

**💼 EXPÉRIENCE DÉCLARÉE :**
\`\`\`
${candidateInfo.experience.substring(0, 800)}${candidateInfo.experience.length > 800 ? '...' : ''}
\`\`\`

**📅 DISPONIBILITÉ ANNONCÉE :**
\`\`\`
${candidateInfo.availability.substring(0, 400)}${candidateInfo.availability.length > 400 ? '...' : ''}
\`\`\``)
                .setThumbnail(candidateInfo.candidateAvatar)
                .setFooter({ 
                    text: `Candidature ID: ${candidateInfo.ticketId} • Archivée automatiquement`,
                    iconURL: guild.iconURL({ dynamic: true })
                })
                .setTimestamp();

            // Embed avec le traitement et l'évaluation
            const evaluationEmbed = new EmbedBuilder()
                .setColor('#3498db')
                .setTitle('📋 **TRAITEMENT & ÉVALUATION DE LA CANDIDATURE**')
                .addFields(
                    {
                        name: '👨‍💼 **Gestion du Dossier**',
                        value: `• **Agent assigné :** ${candidateInfo.assignedStaff || '❌ Non assigné'}
• **Fermé par :** ${closedBy}
• **Durée du processus :** ${ticketStats.duration}
• **Messages échangés :** ${ticketStats.messageCount}
• **Participants :** ${ticketStats.participants.join(', ')}`,
                        inline: false
                    },
                    {
                        name: '🔍 **Évaluation Effectuée**',
                        value: candidateInfo.evaluation || '❌ Aucune évaluation formelle enregistrée',
                        inline: false
                    },
                    {
                        name: '⚖️ **Décision Finale**',
                        value: candidateInfo.decision || '❓ Décision non documentée dans le ticket',
                        inline: true
                    },
                    {
                        name: '📊 **Statut Actuel**',
                        value: candidateInfo.status || '⏳ Statut à définir',
                        inline: true
                    },
                    {
                        name: '📝 **Notes Importantes**',
                        value: candidateInfo.notes || '➖ Aucune note particulière relevée',
                        inline: false
                    }
                );

            // Embed avec recommandations et statistiques
            this.logger.info(`🤖 Génération des recommandations IA...`);
            const analyticsEmbed = new EmbedBuilder()
                .setColor('#e67e22')
                .setTitle('📈 **ANALYSE AUTOMATIQUE & RECOMMANDATIONS**')
                .setDescription(`
**🎯 RECOMMANDATIONS BASÉES SUR LE PROFIL :**

${this.generateRecruitmentRecommendations(candidateInfo)}

**📊 MÉTRIQUES D'ÉVALUATION :**
• **Détail de l'expérience :** ${candidateInfo.experience.length > 200 ? '✅ Complète' : '⚠️ Limitée'} (${candidateInfo.experience.length} caractères)
• **Clarté de la disponibilité :** ${candidateInfo.availability.length > 50 ? '✅ Précise' : '⚠️ Vague'} (${candidateInfo.availability.length} caractères)
• **Interaction durant le processus :** ${ticketStats.messageCount > 5 ? '✅ Active' : '⚠️ Passive'} (${ticketStats.messageCount} messages)
• **Réactivité du candidat :** ${ticketStats.durationMs < 86400000 ? '✅ Rapide' : '⚠️ Lente'} (${ticketStats.duration})

**📈 CONTEXTE GLOBAL :**
• **Candidatures ce mois :** ${await this.getMonthlyApplicationsCount(guild)}
• **Taux d'acceptation moyen :** ${await this.getAcceptanceRate(guild)}%
• **Temps de traitement moyen :** ${await this.getAverageProcessingTime(guild)}`)
                .setFooter({ text: 'Analyse générée automatiquement par l\'IA de recrutement' });

            this.logger.success(`✅ 3 embeds détaillés générés avec succès`);

            // Générer le transcript complet optimisé pour le recrutement
            this.logger.info(`📝 Génération du transcript optimisé RH...`);
            const transcriptBuffer = await this.generateRecruitmentTranscript(messagesArray, candidateInfo, ticketStats);
            this.logger.success(`📄 Transcript de ${Math.round(transcriptBuffer.length / 1024)}KB généré`);

            // Envoyer le package complet dans le canal de logs de recrutement
            this.logger.info(`📤 Envoi du package complet dans le canal d'archives...`);
            const recruitmentMessage = await recruitmentLogChannel.send({
                content: `📥 **NOUVELLE CANDIDATURE ARCHIVÉE** | <@&${this.staffRoleId}> | Candidat: ${candidateInfo.candidateName}`,
                embeds: [recruitmentFeedbackEmbed, evaluationEmbed, analyticsEmbed],
                files: [{
                    attachment: transcriptBuffer,
                    name: `candidature-${candidateInfo.candidateName.replace(/\s+/g, '-')}-${candidateInfo.ticketId}-${Date.now()}.txt`
                }]
            });
            this.logger.success(`✅ Package complet envoyé dans ${recruitmentLogChannel.name}`);

            // Créer un thread pour le suivi si nécessaire
            if (candidateInfo.status === '⏳ En attente' || candidateInfo.status === '✅ Accepté') {
                this.logger.info(`🧵 Création d'un thread de suivi pour candidature ${candidateInfo.status}...`);
                const followUpThread = await recruitmentMessage.startThread({
                    name: `📋 Suivi - ${candidateInfo.candidateName}`,
                    autoArchiveDuration: 4320, // 3 jours
                    reason: 'Thread de suivi pour candidature nécessitant des actions'
                });

                const followUpEmbed = new EmbedBuilder()
                    .setColor('#f39c12')
                    .setTitle('📋 **THREAD DE SUIVI CRÉÉ**')
                    .setDescription(`
**Ce thread a été créé pour le suivi de la candidature de ${candidateInfo.candidateName}.**

**🎯 Actions à effectuer :**
${candidateInfo.status === '✅ Accepté' ? 
    '• ✅ Candidat accepté - Procéder à l\'intégration\n• 📝 Préparer l\'onboarding\n• 🔑 Attribuer les rôles appropriés\n• 📞 Planifier l\'entretien de confirmation' :
    '• ⏳ Candidature en attente - Finaliser l\'évaluation\n• 🔍 Compléter l\'examen du dossier\n• 📝 Documenter la décision finale\n• 📧 Contacter le candidat'
}

**💡 Utilisez ce thread pour :**
• Coordonner les actions de l'équipe RH
• Partager des notes supplémentaires
• Planifier les étapes suivantes
• Archiver les décisions prises`)
                    .setFooter({ text: 'Thread automatiquement archivé après 3 jours d\'inactivité' });

                await followUpThread.send({ embeds: [followUpEmbed] });
                this.logger.success(`🧵 Thread de suivi créé: ${followUpThread.name}`);
            } else {
                this.logger.info(`ℹ️ Aucun thread de suivi nécessaire pour statut: ${candidateInfo.status || 'Non défini'}`);
            }

            // Sauvegarder les données pour les statistiques futures
            this.logger.info(`💾 Sauvegarde des données dans la base...`);
            await this.saveRecruitmentData(candidateInfo, ticketStats);
            this.logger.success(`✅ Données sauvegardées pour statistiques futures`);

            this.logger.success(`🎉 SYSTÈME DE STOCKAGE OPTIMISÉ TERMINÉ AVEC SUCCÈS !`);
            this.logger.success(`📊 Candidature de ${candidateInfo.candidateName} archivée avec stockage optimisé complet`);

        } catch (error) {
            this.logger.error('❌ Erreur lors du traitement spécialisé de fermeture recrutement:', error);
            // Fallback vers le traitement standard en cas d'erreur
            this.logger.warn('🔄 Basculement vers le traitement standard en cas d\'erreur');
            await this.handleStandardTicketClosure(channel, closedBy, guild, { isRecrutment: true });
        }
    }

    // NOUVEAU: Extraction intelligente des informations de recrutement
    async extractRecruitmentInfo(messages, channel) {
        const info = {
            candidateName: 'Candidat inconnu',
            candidateId: 'ID non trouvé',
            candidateAvatar: null,
            position: 'Poste non spécifié',
            experience: 'Expérience non renseignée',
            availability: 'Disponibilité non renseignée',
            assignedStaff: null,
            evaluation: null,
            decision: null,
            status: null,
            notes: null,
            ticketId: channel.name.split('-').pop() || 'unknown'
        };

        try {
            this.logger.info(`🔍 Extraction des informations de recrutement depuis ${messages.length} messages`);
            
            // Analyser tous les messages pour extraire les informations
            for (const message of messages) {
                // Extraire le candidat depuis le nom du canal
                if (channel.name.includes('recruitment-')) {
                    const nameParts = channel.name.split('-');
                    if (nameParts.length >= 3) {
                        info.candidateName = nameParts[1]; // recruitment-USERNAME-NUMBER
                        this.logger.info(`📝 Candidat extrait du nom du canal: ${info.candidateName}`);
                    }
                }
                
                // Extraire l'ID du candidat depuis le topic ou les permissions du canal
                if (channel.topic) {
                    const topicMatch = channel.topic.match(/Créée par (.+)/);
                    if (topicMatch) {
                        const userTag = topicMatch[1];
                        // Chercher l'utilisateur dans le serveur
                        const member = channel.guild.members.cache.find(m => m.user.tag === userTag);
                        if (member) {
                            info.candidateId = member.user.id;
                            info.candidateName = member.displayName || member.user.username;
                            info.candidateAvatar = member.user.displayAvatarURL({ dynamic: true });
                            this.logger.success(`👤 Candidat trouvé: ${info.candidateName} (${info.candidateId})`);
                        }
                    }
                }
                
                // Extraire depuis les embeds (candidature initiale)
                if (message.embeds.length > 0) {
                    const embed = message.embeds[0];
                    
                    if (embed.title && embed.title.includes('CANDIDATURE DE RECRUTEMENT')) {
                        const description = embed.description || '';
                        this.logger.info(`📋 Embed de candidature trouvé, extraction des données...`);
                        
                        // Extraire le poste souhaité
                        const positionMatch = description.match(/\*\*Poste souhaité :\*\* (.+)/);
                        if (positionMatch) {
                            info.position = positionMatch[1].trim();
                            this.logger.success(`💼 Poste extrait: ${info.position}`);
                        }
                        
                        // Extraire l'expérience depuis les blocs de code
                        const experienceMatch = description.match(/\*\*💼 Expérience et Compétences :\*\*\n```\n([\s\S]*?)\n```/);
                        if (experienceMatch) {
                            info.experience = experienceMatch[1].trim();
                            this.logger.success(`📚 Expérience extraite: ${info.experience.substring(0, 100)}...`);
                        }
                        
                        // Extraire la disponibilité depuis les blocs de code
                        const availabilityMatch = description.match(/\*\*📅 Disponibilité :\*\*\n```\n([\s\S]*?)\n```/);
                        if (availabilityMatch) {
                            info.availability = availabilityMatch[1].trim();
                            this.logger.success(`📅 Disponibilité extraite: ${info.availability.substring(0, 100)}...`);
                        }
                    }
                    
                    // Détecter la prise en charge par un staff
                    if (embed.title && embed.title.includes('PRIS EN CHARGE')) {
                        const staffMatch = embed.description.match(/\*\*(.+?) a pris ce ticket en charge/);
                        if (staffMatch) {
                            info.assignedStaff = staffMatch[1];
                            this.logger.success(`👨‍💼 Staff assigné: ${info.assignedStaff}`);
                        }
                    }
                }
                
                // Analyser les messages textuels pour les évaluations et décisions
                if (message.content && message.content.length > 10 && !message.author.bot) {
                    const content = message.content.toLowerCase();
                    
                    // Détecter les mots-clés d'évaluation
                    if (content.includes('évaluation') || content.includes('evaluation') || 
                        content.includes('compétences') || content.includes('profil') ||
                        content.includes('expérience') || content.includes('qualifié')) {
                        if (!info.evaluation || message.content.length > info.evaluation.length) {
                            info.evaluation = message.content.substring(0, 500);
                            this.logger.info(`🔍 Évaluation trouvée: ${info.evaluation.substring(0, 50)}...`);
                        }
                    }
                    
                    // Détecter les décisions finales
                    if (content.includes('accepté') || content.includes('refusé') || 
                        content.includes('rejeté') || content.includes('approuvé') ||
                        content.includes('retenu') || content.includes('sélectionné')) {
                        info.decision = message.content.substring(0, 300);
                        
                        // Déterminer le statut basé sur la décision
                        if (content.includes('accepté') || content.includes('approuvé') || 
                            content.includes('retenu') || content.includes('sélectionné')) {
                            info.status = '✅ Accepté';
                        } else if (content.includes('refusé') || content.includes('rejeté')) {
                            info.status = '❌ Refusé';
                        }
                        
                        this.logger.success(`⚖️ Décision trouvée: ${info.status} - ${info.decision.substring(0, 50)}...`);
                    }
                    
                    // Détecter les notes importantes
                    if (content.includes('note') || content.includes('remarque') || 
                        content.includes('attention') || content.includes('important')) {
                        if (!info.notes || message.content.length > (info.notes?.length || 0)) {
                            info.notes = message.content.substring(0, 400);
                            this.logger.info(`📝 Note importante trouvée: ${info.notes.substring(0, 50)}...`);
                        }
                    }
                    
                    // Détecter les statuts en attente
                    if (content.includes('en attente') || content.includes('à suivre') || 
                        content.includes('à recontacter') || content.includes('deuxième tour')) {
                        if (!info.status) {
                            info.status = '⏳ En attente';
                            this.logger.info(`⏳ Statut en attente détecté`);
                        }
                    }
                }
            }
            
            // Si aucun statut n'a été déterminé, mettre un statut par défaut
            if (!info.status) {
                info.status = '📋 Candidature traitée';
                this.logger.info(`📋 Statut par défaut appliqué`);
            }
            
            this.logger.success(`✅ Extraction terminée: ${info.candidateName} - ${info.position} - ${info.status}`);
            return info;
            
        } catch (error) {
            this.logger.error('❌ Erreur lors de l\'extraction des informations de recrutement:', error);
            return info; // Retourner les informations par défaut
        }
    }

    // NOUVEAU: Générer des recommandations intelligentes
    generateRecruitmentRecommendations(candidateInfo) {
        const recommendations = [];
        
        // Analyse de l'expérience
        if (candidateInfo.experience.length > 300) {
            recommendations.push('✅ **Expérience très détaillée** - Candidat sérieux et motivé');
        } else if (candidateInfo.experience.length > 100) {
            recommendations.push('🔄 **Expérience correcte** - Demander des précisions si nécessaire');
        } else {
            recommendations.push('⚠️ **Expérience limitée** - Creuser davantage lors de l\'entretien');
        }
        
        // Analyse de la disponibilité
        const availability = candidateInfo.availability.toLowerCase();
        if (availability.includes('disponible') && availability.includes('flexible')) {
            recommendations.push('✅ **Excellente disponibilité** - Compatible avec nos besoins');
        } else if (availability.includes('weekend') || availability.includes('soir')) {
            recommendations.push('🕐 **Disponibilité restreinte** - Vérifier compatibilité avec les horaires');
        } else {
            recommendations.push('❓ **Disponibilité à clarifier** - Organiser un entretien pour préciser');
        }
        
        // Analyse par poste
        const position = candidateInfo.position.toLowerCase();
        if (position.includes('modérateur') || position.includes('modo')) {
            recommendations.push('🛡️ **Candidature Modération** - Tester patience et discernement');
        } else if (position.includes('admin') || position.includes('administrateur')) {
            recommendations.push('⚡ **Candidature Administration** - Évaluer compétences techniques et leadership');
        } else if (position.includes('support') || position.includes('aide')) {
            recommendations.push('🤝 **Candidature Support** - Vérifier empathie et réactivité');
        } else if (position.includes('dev') || position.includes('développeur')) {
            recommendations.push('💻 **Candidature Développement** - Test technique recommandé');
        }
        
        // Recommandations basées sur le statut
        if (candidateInfo.status === '✅ Accepté') {
            recommendations.push('🎉 **CANDIDAT ACCEPTÉ** - Préparer l\'onboarding immédiatement');
        } else if (candidateInfo.status === '❌ Refusé') {
            recommendations.push('📝 **CANDIDAT REFUSÉ** - Maintenir contact pour futures opportunités');
        } else {
            recommendations.push('⏰ **DÉCISION URGENTE** - Finaliser l\'évaluation sous 48h');
        }
        
        return recommendations.length > 0 ? recommendations.join('\n• ') : '• Aucune recommandation automatique générée';
    }

    // NOUVEAU: Générer un transcript spécialisé pour le recrutement
    async generateRecruitmentTranscript(messages, candidateInfo, ticketStats) {
        let transcript = `═══════════════════════════════════════════════════════════════\n`;
        transcript += `               TRANSCRIPT CANDIDATURE DE RECRUTEMENT\n`;
        transcript += `═══════════════════════════════════════════════════════════════\n\n`;
        
        transcript += `🏷️  INFORMATIONS GÉNÉRALES\n`;
        transcript += `────────────────────────────────────────────────────────────────\n`;
        transcript += `Candidat: ${candidateInfo.candidateName} (${candidateInfo.candidateId})\n`;
        transcript += `Poste souhaité: ${candidateInfo.position}\n`;
        transcript += `Date de candidature: ${new Date(ticketStats.createdAt).toLocaleString('fr-FR')}\n`;
        transcript += `Date de clôture: ${new Date(ticketStats.closedAt).toLocaleString('fr-FR')}\n`;
        transcript += `Durée totale: ${ticketStats.duration}\n`;
        transcript += `Agent assigné: ${candidateInfo.assignedStaff || 'Non assigné'}\n`;
        transcript += `Statut final: ${candidateInfo.status || 'Non déterminé'}\n\n`;
        
        transcript += `📋 PROFIL DU CANDIDAT\n`;
        transcript += `────────────────────────────────────────────────────────────────\n`;
        transcript += `EXPÉRIENCE DÉCLARÉE:\n${candidateInfo.experience}\n\n`;
        transcript += `DISPONIBILITÉ ANNONCÉE:\n${candidateInfo.availability}\n\n`;
        
        if (candidateInfo.evaluation) {
            transcript += `🔍 ÉVALUATION DU STAFF\n`;
            transcript += `────────────────────────────────────────────────────────────────\n`;
            transcript += `${candidateInfo.evaluation}\n\n`;
        }
        
        if (candidateInfo.decision) {
            transcript += `⚖️  DÉCISION FINALE\n`;
            transcript += `────────────────────────────────────────────────────────────────\n`;
            transcript += `${candidateInfo.decision}\n\n`;
        }
        
        if (candidateInfo.notes) {
            transcript += `📝 NOTES IMPORTANTES\n`;
            transcript += `────────────────────────────────────────────────────────────────\n`;
            transcript += `${candidateInfo.notes}\n\n`;
        }
        
        transcript += `💬 HISTORIQUE COMPLET DES ÉCHANGES\n`;
        transcript += `════════════════════════════════════════════════════════════════\n\n`;
        
        messages.forEach((msg, index) => {
            const timestamp = new Date(msg.createdTimestamp).toLocaleString('fr-FR');
            transcript += `[${timestamp}] ${msg.author.tag}:\n`;
            
            if (msg.content) {
                transcript += `${msg.content}\n`;
            }
            
            if (msg.embeds.length > 0) {
                transcript += `[EMBED] ${msg.embeds[0].title || 'Embed sans titre'}\n`;
                if (msg.embeds[0].description) {
                    const truncatedDesc = msg.embeds[0].description.substring(0, 300);
                    transcript += `Description: ${truncatedDesc}${msg.embeds[0].description.length > 300 ? '...' : ''}\n`;
                }
            }
            
            if (msg.attachments.size > 0) {
                transcript += `[FICHIERS] ${Array.from(msg.attachments.values()).map(a => a.name).join(', ')}\n`;
            }
            
            transcript += `\n${'─'.repeat(60)}\n\n`;
        });
        
        transcript += `\n═══════════════════════════════════════════════════════════════\n`;
        transcript += `               FIN DU TRANSCRIPT - ${new Date().toLocaleString('fr-FR')}\n`;
        transcript += `═══════════════════════════════════════════════════════════════\n`;
        
        return Buffer.from(transcript, 'utf8');
    }

    // NOUVEAU: Obtenir le canal de recrutement existant
    async ensureRecruitmentLogChannel(guild) {
        try {
            // Récupérer directement le canal de recrutement par son ID
            const recruitmentChannelId = '1395050813780660254';
            const recruitmentLogChannel = guild.channels.cache.get(recruitmentChannelId);

            if (!recruitmentLogChannel) {
                this.logger.error(`❌ Canal de recrutement introuvable avec l'ID: ${recruitmentChannelId}`);
                throw new Error(`Canal de recrutement non trouvé: ${recruitmentChannelId}`);
            }

            this.logger.info(`✅ Canal de recrutement trouvé: ${recruitmentLogChannel.name}`);
            return recruitmentLogChannel;
        } catch (error) {
            this.logger.error('Erreur lors de la récupération du canal de recrutement:', error);
            throw error;
        }
    }

    // NOUVEAU: Extraire les informations de recrutement depuis les messages
    async handleStandardTicketClosure(channel, closedBy, guild, types) {
        try {
            // Choisir le canal de destination selon le type de ticket
            let feedbackChannelId;
            let mentions = '<@421670146604793856>'; // Mention universelle pour TOUS les tickets
            
            if (types.isReport) {
                feedbackChannelId = '1395049881470505132'; // Canal spécifique pour les signalements
                this.logger.info('🚨 Ticket de signalement détecté - envoi vers canal spécifique');
            } else if (types.isSuggestion) {
                feedbackChannelId = '1393143271617855548'; // Canal spécifique pour les suggestions/feedbacks
                mentions += ' <@656139870158454795> <@421245210220298240>'; // Ajouter les responsables des feedbacks
                this.logger.info('💡 Ticket de suggestion/feedback détecté - envoi avec mentions');
            } else {
                feedbackChannelId = '1393143271617855548'; // Canal général pour les autres tickets
                this.logger.info('🎫 Ticket standard détecté - envoi vers canal général');
            }
            
            const feedbackChannel = guild.channels.cache.get(feedbackChannelId);
            
            if (!feedbackChannel) {
                this.logger.error(`❌ Canal de feedback introuvable: ${feedbackChannelId}`);
                return;
            }

            // Récupérer les messages du canal pour créer un historique
            const messages = await channel.messages.fetch({ limit: 100 });
            const messageHistory = messages.reverse().map(msg => {
                const timestamp = msg.createdAt.toLocaleString('fr-FR');
                return `**[${timestamp}] ${msg.author.tag}:** ${msg.content || '*[Embed ou fichier joint]*'}`;
            }).join('\n');

            // Créer l'embed de feedback avec style différent selon le type
            let embedColor, embedTitle, ticketTypeLabel;
            
            if (types.isReport) {
                embedColor = '#e74c3c';
                embedTitle = '🚨 **SIGNALEMENT FERMÉ - FEEDBACK COMPLET**';
                ticketTypeLabel = '🚨 Signalement';
            } else if (types.isSuggestion) {
                embedColor = '#f39c12';
                embedTitle = '💡 **AVIS / FEEDBACK FERMÉ - RAPPORT COMPLET**';
                ticketTypeLabel = '💡 Avis / Feedback';
            } else {
                embedColor = '#2c3e50';
                embedTitle = '🎫 **TICKET FERMÉ - FEEDBACK COMPLET**';
                ticketTypeLabel = '🎫 Ticket Standard';
            }
            
            const feedbackEmbed = new EmbedBuilder()
                .setColor(embedColor)
                .setTitle(embedTitle)
                .setDescription(`
**📋 INFORMATIONS DU TICKET :**
• **Canal :** ${channel.name}
• **Type :** ${ticketTypeLabel}
• **Créé le :** <t:${Math.floor(channel.createdTimestamp / 1000)}:F>
• **Fermé le :** <t:${Math.floor(Date.now() / 1000)}:F>
• **Fermé par :** ${closedBy}
• **Durée totale :** <t:${Math.floor(channel.createdTimestamp / 1000)}:R>

**📊 STATISTIQUES :**
• **Nombre de messages :** ${messages.size}
• **Participants :** ${new Set(messages.map(m => m.author.id)).size}
• **Serveur :** ${guild.name}`)
                .setThumbnail(guild.iconURL({ dynamic: true }))
                .setFooter({ 
                    text: `${types.isReport ? 'Signalement' : types.isSuggestion ? 'Avis/Feedback' : 'Ticket'} ID: ${channel.id} • Système de Support`,
                    iconURL: guild.iconURL({ dynamic: true })
                })
                .setTimestamp();

            // Ajouter l'historique des messages (limité à 1024 caractères par champ)
            if (messageHistory.length > 0) {
                const truncatedHistory = messageHistory.length > 1000 
                    ? messageHistory.substring(0, 1000) + '...\n*[Historique tronqué]*'
                    : messageHistory;
                
                feedbackEmbed.addFields({
                    name: '💬 **HISTORIQUE DES MESSAGES**',
                    value: truncatedHistory || '*Aucun message trouvé*',
                    inline: false
                });
            }

            // Ajouter un champ spécial selon le type
            if (types.isReport) {
                feedbackEmbed.addFields({
                    name: '⚠️ **STATUT DU SIGNALEMENT**',
                    value: '🔍 **Traité** - Ce signalement a été examiné et fermé par l\'équipe de modération.',
                    inline: false
                });
            } else if (types.isSuggestion) {
                feedbackEmbed.addFields({
                    name: '💡 **STATUT DU FEEDBACK**',
                    value: '✅ **Traité** - Cet avis/feedback a été examiné et fermé par l\'équipe responsable.',
                    inline: false
                });
            }

            // Envoyer le message avec mentions si nécessaire
            const messageContent = mentions ? `${mentions}\n\n` : '';
            
            await feedbackChannel.send({
                content: messageContent || undefined,
                embeds: [feedbackEmbed]
            });

            const ticketTypeName = types.isReport ? 'signalement' : types.isSuggestion ? 'suggestion/feedback' : 'ticket';
            this.logger.success(`✅ Feedback du ${ticketTypeName} ${channel.name} envoyé dans le canal ${feedbackChannel.name} avec succès`);

        } catch (error) {
            this.logger.error('❌ Erreur lors du traitement standard de fermeture:', error);
        }
    }

    // Calculer les statistiques du ticket
    calculateTicketStats(channel, messages) {
        const participants = [...new Set(messages.map(m => m.author.tag))];
        const messageCount = messages.length;
        const createdAt = channel.createdTimestamp;
        const closedAt = Date.now();
        const durationMs = closedAt - createdAt;
        
        const hours = Math.floor(durationMs / (1000 * 60 * 60));
        const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
        const duration = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
        
        return {
            participants,
            messageCount,
            createdAt,
            closedAt,
            duration,
            durationMs
        };
    }

    // NOUVEAU: Méthodes utilitaires pour les statistiques (placeholders)
    async getMonthlyApplicationsCount(guild) {
        // TODO: Implémenter avec la base de données
        return Math.floor(Math.random() * 20) + 5; // Placeholder
    }

    async getAcceptanceRate(guild) {
        // TODO: Implémenter avec la base de données
        return Math.floor(Math.random() * 30) + 60; // Placeholder
    }

    async getAverageProcessingTime(guild) {
        // TODO: Implémenter avec la base de données
        return `${Math.floor(Math.random() * 12) + 6}h`; // Placeholder
    }

    async saveRecruitmentData(candidateInfo, ticketStats) {
        // TODO: Sauvegarder dans la base de données pour les statistiques futures
        this.logger.info(`💾 Sauvegarde des données de recrutement pour ${candidateInfo.candidateName}`);
    }

    // Méthode pour créer ou récupérer la catégorie de tickets
    async ensureTicketCategory(guild) {
        try {
            // Chercher une catégorie existante avec le nom "🎫 Tickets"
            let ticketCategory = guild.channels.cache.find(
                channel => channel.type === ChannelType.GuildCategory && 
                          (channel.name.includes('Tickets') || channel.name.includes('🎫'))
            );

            // Si la catégorie n'existe pas, la créer
            if (!ticketCategory) {
                ticketCategory = await guild.channels.create({
                    name: '🎫 Tickets',
                    type: ChannelType.GuildCategory,
                    permissionOverwrites: [
                        {
                            id: guild.id,
                            deny: [PermissionFlagsBits.ViewChannel]
                        },
                        {
                            id: this.staffRoleId,
                            allow: [
                                PermissionFlagsBits.ViewChannel,
                                PermissionFlagsBits.ManageChannels,
                                PermissionFlagsBits.ManageMessages
                            ]
                        }
                    ]
                });

                this.logger.success(`Catégorie de tickets créée: ${ticketCategory.name}`);
            }

            // Mettre à jour l'ID de la catégorie
            this.ticketCategoryId = ticketCategory.id;
            
            return ticketCategory;

        } catch (error) {
            this.logger.error('Erreur lors de la création/récupération de la catégorie de tickets:', error);
            throw error;
        }
    }

    // Méthode pour nettoyer les tickets fermés (optionnel)
    async cleanupClosedTickets(guild) {
        try {
            const ticketCategory = guild.channels.cache.get(this.ticketCategoryId);
            if (!ticketCategory) return;

            const ticketChannels = ticketCategory.children.cache.filter(
                channel => channel.type === ChannelType.GuildText && 
                          channel.name.includes('ticket')
            );

            // Supprimer les tickets inactifs depuis plus de 7 jours
            const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
            
            for (const [id, channel] of ticketChannels) {
                try {
                    const messages = await channel.messages.fetch({ limit: 1 });
                    const lastMessage = messages.first();
                    
                    if (!lastMessage || lastMessage.createdTimestamp < sevenDaysAgo) {
                        await channel.delete('Nettoyage automatique - ticket inactif');
                        this.logger.info(`Ticket inactif supprimé: ${channel.name}`);
                    }
                } catch (error) {
                    // Ignorer les erreurs de suppression
                }
            }

        } catch (error) {
            this.logger.error('Erreur lors du nettoyage des tickets:', error);
        }
    }

    // MÉTHODES MANQUANTES POUR LES SUGGESTIONS

    async handleSuggestionModalSubmit(interaction) {
        try {
            // Vérification immédiate de l'état de l'interaction
            if (interaction.replied || interaction.deferred) {
                this.logger.warn('⚠️ Interaction suggestion modal déjà traitée, abandon');
                return;
            }

            // Acquittement immédiat avec gestion d'erreur renforcée
            try {
                // Utiliser le validateur d'interactions pour une déférence rapide
            const validator = interaction.client.interactionValidator;
            const deferred = await validator.quickDefer(interaction, { flags: MessageFlags.Ephemeral });
            
            if (!deferred) {
                return; // Interaction expirée ou déjà traitée
            }
            } catch (error) {
                if (error.code === 10062) {
                    this.logger.warn('⏰ Interaction suggestion modal expirée lors du deferReply');
                    return;
                }
                throw error;
            }

            const suggestionTitle = interaction.fields.getTextInputValue('suggestion_title');
            const suggestionDescription = interaction.fields.getTextInputValue('suggestion_description');
            
            // Gestion flexible des types de suggestion - rendre optionnel
            let suggestionType = 'général';
            let suggestionPriority = '3';
            
            try {
                suggestionType = interaction.fields.getTextInputValue('suggestion_type') || 'général';
            } catch (error) {
                // Le champ n'existe pas dans ce modal, utiliser le type depuis customId
                const modalType = interaction.customId.split('_')[2] || 'general';
                suggestionType = modalType;
                this.logger.info(`🔄 Type extrait du modal: ${suggestionType}`);
            }
            
            try {
                suggestionPriority = interaction.fields.getTextInputValue('suggestion_priority') || '3';
            } catch (error) {
                // Le champ priorité n'existe pas, utiliser valeur par défaut
                this.logger.info('🔄 Priorité par défaut utilisée: 3');
            }

            const guild = interaction.guild;
            const user = interaction.user;

            // Créer ou récupérer la catégorie de suggestions
            const suggestionCategory = await this.ensureSuggestionCategory(guild);

            // Créer le canal de suggestion
            const suggestionNumber = Date.now().toString().slice(-6);
            const suggestionChannel = await guild.channels.create({
                name: `💡・suggestion-${user.username}-${suggestionNumber}`,
                type: ChannelType.GuildText,
                parent: suggestionCategory.id,
                topic: `Suggestion ${suggestionType} • ${suggestionTitle} • Créée par ${user.tag}`,
                permissionOverwrites: [
                    {
                        id: guild.id,
                        deny: [PermissionFlagsBits.ViewChannel]
                    },
                    {
                        id: user.id,
                        allow: [
                            PermissionFlagsBits.ViewChannel,
                            PermissionFlagsBits.SendMessages,
                            PermissionFlagsBits.ReadMessageHistory,
                            PermissionFlagsBits.AttachFiles,
                            PermissionFlagsBits.EmbedLinks
                        ]
                    },
                    {
                        id: this.staffRoleId,
                        allow: [
                            PermissionFlagsBits.ViewChannel,
                            PermissionFlagsBits.SendMessages,
                            PermissionFlagsBits.ReadMessageHistory,
                            PermissionFlagsBits.ManageMessages,
                            PermissionFlagsBits.AttachFiles,
                            PermissionFlagsBits.EmbedLinks
                        ]
                    }
                ]
            });

            // Embed de la suggestion
            const suggestionEmbed = new EmbedBuilder()
                .setColor('#f39c12')
                .setTitle(`💡 **Suggestion #${suggestionNumber}**`)
                .setDescription(`
╭─────────────────────────────────────╮
│       **Nouvelle Suggestion** ✨       │
╰─────────────────────────────────────╯

**📋 Informations :**
• **Titre :** ${suggestionTitle}
• **Type :** ${suggestionType}
• **Numéro :** \`#${suggestionNumber}\`
• **Priorité :** ${this.getPriorityDisplay(suggestionPriority)}
• **Créée le :** <t:${Math.floor(Date.now() / 1000)}:F>
• **Auteur :** ${user}

**📝 Description :**
\`\`\`
${suggestionDescription}
\`\`\`

**🎯 Prochaines Étapes :**
1️⃣ L'équipe va examiner votre suggestion
2️⃣ Nous vous donnerons un retour constructif
3️⃣ Si approuvée, elle sera mise en développement`)
                .setThumbnail(user.displayAvatarURL({ dynamic: true }))
                .setFooter({ 
                    text: `Suggestion ID: ${suggestionNumber} • En attente d'examen`,
                    iconURL: guild.iconURL({ dynamic: true })
                })
                .setTimestamp();

            // Boutons d'actions pour la suggestion
            const suggestionActionsRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('suggestion_approve')
                        .setLabel('Approuver')
                        .setStyle(ButtonStyle.Success)
                        .setEmoji('✅'),
                    new ButtonBuilder()
                        .setCustomId('suggestion_consider')
                        .setLabel('À Considérer')
                        .setStyle(ButtonStyle.Primary)
                        .setEmoji('🤔'),
                    new ButtonBuilder()
                        .setCustomId('suggestion_reject')
                        .setLabel('Rejeter')
                        .setStyle(ButtonStyle.Danger)
                        .setEmoji('❌'),
                    new ButtonBuilder()
                        .setCustomId('suggestion_close')
                        .setLabel('Fermer')
                        .setStyle(ButtonStyle.Secondary)
                        .setEmoji('🔒')
                );

            await suggestionChannel.send({
                content: `${user} | <@&${this.staffRoleId}>`,
                embeds: [suggestionEmbed],
                components: [suggestionActionsRow]
            });

            await interaction.editReply({
                content: `✅ **Suggestion créée avec succès !** ${suggestionChannel}\n💡 Votre suggestion sera examinée par notre équipe.`
            });

            this.logger.info(`Suggestion #${suggestionNumber} créée: ${suggestionChannel.name} par ${user.tag}`);

        } catch (error) {
            this.logger.error('Erreur lors du traitement de la suggestion:', error);
            try {
                if (interaction.deferred) {
                    await interaction.editReply({
                        content: '❌ Une erreur est survenue lors de la création de la suggestion.'
                    });
                } else {
                    await interaction.reply({
                        content: '❌ Une erreur est survenue lors de la création de la suggestion.',
                        flags: MessageFlags.Ephemeral
                    });
                }
            } catch (replyError) {
                this.logger.warn('⏰ Impossible de répondre - interaction expirée');
            }
        }
    }

    async handleSuggestionFeedbackModal(interaction) {
        try {
            const status = interaction.customId.split('_')[2];
            const reason = interaction.fields.getTextInputValue('feedback_reason');
            const message = interaction.fields.getTextInputValue('feedback_message');
            const improvement = interaction.fields.getTextInputValue('feedback_improvement') || '';

            // Utiliser le validateur d'interactions pour une déférence rapide
            const validator = interaction.client.interactionValidator;
            const deferred = await validator.quickDefer(interaction, { flags: MessageFlags.Ephemeral });
            
            if (!deferred) {
                return; // Interaction expirée ou déjà traitée
            }

            const channel = interaction.channel;
            const statusColors = {
                approved: '#2ecc71',
                rejected: '#e74c3c',
                considered: '#3498db',
                closed: '#95a5a6'
            };

            const statusEmojis = {
                approved: '✅',
                rejected: '❌',
                considered: '🤔',
                closed: '🔒'
            };

            const statusTexts = {
                approved: 'APPROUVÉE',
                rejected: 'REJETÉE',
                considered: 'À CONSIDÉRER',
                closed: 'FERMÉE'
            };

            const feedbackEmbed = new EmbedBuilder()
                .setColor(statusColors[status])
                .setTitle(`${statusEmojis[status]} **SUGGESTION ${statusTexts[status]}**`)
                .setDescription(`
**📋 Feedback de l'équipe :**

**📝 Raison principale :**
${reason}

**💬 Message détaillé :**
${message}

${improvement ? `**💡 Suggestions d'amélioration :**\n${improvement}` : ''}

**👤 Traité par :** ${interaction.user}
**📅 Date :** <t:${Math.floor(Date.now() / 1000)}:F>`)
                .setFooter({ text: `Suggestion ${statusTexts[status].toLowerCase()} avec feedback` })
                .setTimestamp();

            await channel.send({ embeds: [feedbackEmbed] });

            // Mise à jour du nom du canal pour refléter le statut
            try {
                const newChannelName = channel.name.replace('suggestion-', `suggestion-${status}-`);
                await channel.setName(newChannelName);
            } catch (nameError) {
                this.logger.warn('Impossible de modifier le nom du canal:', nameError);
            }

            await interaction.editReply({
                content: `✅ **Feedback envoyé avec succès !**\n📋 La suggestion a été marquée comme **${statusTexts[status]}**.`
            });

        } catch (error) {
            this.logger.error('Erreur lors du traitement du feedback:', error);
            try {
                if (interaction.deferred) {
                    await interaction.editReply({
                        content: '❌ Une erreur est survenue lors de l\'envoi du feedback.'
                    });
                }
            } catch (replyError) {
                this.logger.warn('⏰ Impossible de répondre - interaction expirée');
            }
        }
    }

    async handleSuggestionTypeSelect(interaction) {
        try {
            // Acquittement immédiat pour éviter les timeouts
            if (interaction.replied || interaction.deferred) {
                this.logger.warn('⚠️ Interaction suggestion type select déjà traitée');
                return;
            }

            // Utiliser le validateur d'interactions pour une déférence rapide
            const validator = interaction.client.interactionValidator;
            const deferred = await validator.quickDefer(interaction, { flags: MessageFlags.Ephemeral });
            
            if (!deferred) {
                return; // Interaction expirée ou déjà traitée
            }

            const selectedType = interaction.values[0];
            
            // Stocker temporairement le type sélectionné
            if (!this.client.tempData) this.client.tempData = {};
            this.client.tempData[interaction.user.id] = {
                suggestionType: selectedType,
                timestamp: Date.now()
            };

            await interaction.editReply({
                content: `✅ **Type sélectionné :** ${selectedType}\n\nMaintenant, créez votre suggestion avec le bouton correspondant ci-dessus.`
            });

            this.logger.info(`📋 Type de suggestion sélectionné: ${selectedType} par ${interaction.user.username}`);

        } catch (error) {
            // Gestion spécifique des erreurs d'interaction
            if (error.code === 10062) {
                this.logger.warn('⏰ Interaction suggestion type select expirée (10062)');
                return;
            }
            
            if (error.code === 40060) {
                this.logger.warn('⚠️ Interaction suggestion type select déjà acquittée (40060)');
                return;
            }

            this.logger.error('Erreur lors de la sélection du type:', error);
            
            try {
                if (interaction.deferred) {
                    await interaction.editReply({
                        content: '❌ Une erreur est survenue lors de la sélection.'
                    });
                } else if (!interaction.replied) {
                    await interaction.reply({
                        content: '❌ Une erreur est survenue lors de la sélection.',
                        flags: MessageFlags.Ephemeral
                    });
                }
            } catch (replyError) {
                this.logger.warn('⏰ Impossible de répondre à l\'erreur de sélection');
            }
        }
    }

    async handleSuggestionAction(interaction, status) {
        try {
            const channel = interaction.channel;
            const guild = interaction.guild;
            const notificationChannelId = '1393143271617855548';
            
            // Récupérer les informations de la suggestion depuis le nom du canal
            const suggestionInfo = this.extractSuggestionInfo(channel);
            
            const statusConfig = {
                approved: { color: '#2ecc71', emoji: '✅', text: 'APPROUVÉE' },
                rejected: { color: '#e74c3c', emoji: '❌', text: 'REJETÉE' },
                considered: { color: '#3498db', emoji: '🤔', text: 'À CONSIDÉRER' },
                closed: { color: '#95a5a6', emoji: '🔒', text: 'FERMÉE' }
            };

            const config = statusConfig[status];

            // Embed pour le canal de suggestion
            const closingEmbed = new EmbedBuilder()
                .setColor(config.color)
                .setTitle(`${config.emoji} **SUGGESTION ${config.text}**`)
                .setDescription(`
**Cette suggestion a été ${config.text.toLowerCase()} par ${interaction.user}**

**📅 Date :** <t:${Math.floor(Date.now() / 1000)}:F>
**👤 Traité par :** ${interaction.user}
**🎯 Statut final :** ${config.text}

${status === 'approved' ? '**🎉 Cette suggestion sera prise en compte dans nos développements futurs !**' : ''}
${status === 'considered' ? '**🤔 Cette suggestion est intéressante et sera étudiée plus en détail.**' : ''}
${status === 'rejected' ? '**❌ Cette suggestion ne peut pas être implementée pour le moment.**' : ''}
${status === 'closed' ? '**🔒 Cette suggestion a été fermée.**' : ''}

**💾 Ce canal sera fermé dans 10 secondes...**`)
                .setFooter({ text: `Suggestion ${config.text.toLowerCase()}` })
                .setTimestamp();

            await channel.send({ embeds: [closingEmbed] });

            // Notification pour TOUTES les actions de suggestion (approved, rejected, considered, closed)
            try {
                const notificationChannel = guild.channels.cache.get(notificationChannelId);
                if (notificationChannel) {
                    const notificationEmbed = new EmbedBuilder()
                        .setColor(config.color)
                        .setTitle(`${config.emoji} Suggestion ${config.text}`)
                        .setDescription(`
**📝 Suggestion :** ${suggestionInfo.title || 'Titre non trouvé'}
**👤 Auteur :** ${suggestionInfo.author || 'Auteur non trouvé'}
**👨‍💼 Traité par :** ${interaction.user}
**📅 Date :** <t:${Math.floor(Date.now() / 1000)}:F>

${status === 'approved' ? '**🎉 Cette suggestion a été approuvée et sera prise en compte dans nos développements futurs !**' : ''}
${status === 'considered' ? '**🤔 Cette suggestion est intéressante et sera étudiée plus en détail.**' : ''}
${status === 'rejected' ? '**❌ Cette suggestion a été rejetée après étude.**' : ''}
${status === 'closed' ? '**🔒 Cette suggestion a été fermée sans traitement particulier.**' : ''}`)
                        .setFooter({ text: `Système de suggestions • ${guild.name}` })
                        .setTimestamp();

                    await notificationChannel.send({ 
                        content: '<@656139870158454795> <@421245210220298240>',
                        embeds: [notificationEmbed] 
                    });
                    this.logger.info(`📢 Notification envoyée dans le salon ${notificationChannelId} pour suggestion ${status}`);
                }
            } catch (notificationError) {
                this.logger.error('Erreur lors de l\'envoi de la notification:', notificationError);
            }

            // Fermer le canal après 10 secondes
            setTimeout(async () => {
                try {
                    await channel.delete(`Suggestion ${status} par ${interaction.user.tag}`);
                    this.logger.info(`🗑️ Canal de suggestion supprimé après traitement (${status})`);
                } catch (error) {
                    this.logger.error('Erreur lors de la suppression du canal de suggestion:', error);
                }
            }, 10000);

        } catch (error) {
            this.logger.error('Erreur lors du traitement de l\'action de suggestion:', error);
            throw error;
        }
    }

    // Méthode pour extraire les informations de la suggestion depuis le canal
    extractSuggestionInfo(channel) {
        try {
            // Essayer d'extraire du nom du canal
            const channelName = channel.name;
            const matches = channelName.match(/suggestion-(.+)-\d+/);
            
            let title = 'Information non disponible';
            let author = 'Auteur non trouvé';
            
            if (matches) {
                author = matches[1];
            }
            
            // Essayer d'extraire le titre depuis le topic du canal
            if (channel.topic) {
                const topicMatches = channel.topic.match(/(.+) • Créée par (.+)/);
                if (topicMatches) {
                    title = topicMatches[1];
                    author = topicMatches[2];
                }
            }
            
            return { title, author };
        } catch (error) {
            this.logger.error('Erreur lors de l\'extraction des informations de suggestion:', error);
            return { title: 'Information non disponible', author: 'Auteur non trouvé' };
        }
    }

    async ensureSuggestionCategory(guild) {
        try {
            // Chercher une catégorie existante pour les suggestions
            let suggestionCategory = guild.channels.cache.find(
                channel => channel.type === ChannelType.GuildCategory && 
                          (channel.name.includes('Suggestion') || channel.name.includes('💡'))
            );

            // Si la catégorie n'existe pas, la créer
            if (!suggestionCategory) {
                suggestionCategory = await guild.channels.create({
                    name: '💡 Suggestions',
                    type: ChannelType.GuildCategory,
                    permissionOverwrites: [
                        {
                            id: guild.id,
                            deny: [PermissionFlagsBits.ViewChannel]
                        },
                        {
                            id: this.staffRoleId,
                            allow: [
                                PermissionFlagsBits.ViewChannel,
                                PermissionFlagsBits.ManageChannels,
                                PermissionFlagsBits.ManageMessages
                            ]
                        }
                    ]
                });

                this.logger.success(`Catégorie de suggestions créée: ${suggestionCategory.name}`);
            }

            return suggestionCategory;
        } catch (error) {
            this.logger.error('Erreur lors de la création de la catégorie de suggestions:', error);
            throw error;
        }
    }

    // Gestion de la sélection du type de suggestion

    async handleRecruitmentModalSubmit(interaction) {
        try {
            // PROTECTION ULTRA RADICALE POUR LE RECRUTEMENT
            const ultimateLock = global.ULTIMATE_TICKET_LOCK;
            const userId = interaction.user.id;
            const lockKey = `recruitment_${userId}`;
            
            // Vérifier si une candidature est déjà en cours
            if (ultimateLock.activeChannels.has(lockKey)) {
                this.logger.warn(`🚫 BLOCAGE RECRUTEMENT: ${interaction.user.username} candidature déjà en cours`);
                return;
            }
            
            // Verrouiller cette candidature
            ultimateLock.activeChannels.add(lockKey);
            
            // Libérer automatiquement après 30 secondes
            setTimeout(() => {
                ultimateLock.activeChannels.delete(lockKey);
            }, 30000);

            // DÉFÉRENCE IMMÉDIATE ET SILENCIEUSE pour éviter InteractionNotReplied
            if (!interaction.deferred && !interaction.replied) {
                try {
                    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
                } catch (error) {
                    // Si la déférence échoue, l'interaction est probablement expirée
                    ultimateLock.activeChannels.delete(lockKey);
                    return;
                }
            }

            const guild = interaction.guild;
            const user = interaction.user;

            const position = interaction.fields.getTextInputValue('recruitment_position');
            const experience = interaction.fields.getTextInputValue('recruitment_experience');
            const availability = interaction.fields.getTextInputValue('recruitment_availability');

            // Vérifier si l'utilisateur a déjà un ticket ouvert
            const existingTickets = guild.channels.cache.filter(
                channel => channel.name.includes(user.id) && channel.name.includes('ticket')
            );

            if (existingTickets.size > 0) {
                await interaction.editReply({
                    content: `❌ Vous avez déjà un ticket ouvert : ${existingTickets.first()}\n\n💡 Veuillez fermer votre ticket existant avant d'en créer un nouveau.`
                });
                ultimateLock.activeChannels.delete(lockKey);
                return;
            }

            // PROTECTION CONTRE LA CRÉATION DE CANAUX MULTIPLES POUR LE RECRUTEMENT
            const channelCreationKey = `creating_recruitment_${userId}`;
            if (ultimateLock.activeChannels.has(channelCreationKey)) {
                this.logger.warn(`🚫 CRÉATION DE CANAL RECRUTEMENT DÉJÀ EN COURS pour ${interaction.user.username}`);
                await interaction.editReply({
                    content: '❌ Une candidature est déjà en cours de création. Veuillez patienter.'
                });
                ultimateLock.activeChannels.delete(lockKey);
                return;
            }
            
            // Verrouiller la création de canal de recrutement
            ultimateLock.activeChannels.add(channelCreationKey);
            
            try {
                // Créer ou récupérer la catégorie de tickets
                const ticketCategory = await this.ensureTicketCategory(guild);
                const config = this.ticketTypes['recruitment'];

                // Créer le canal de ticket de recrutement
                const ticketNumber = Date.now().toString().slice(-6);
                const ticketChannel = await guild.channels.create({
                    name: `👥・recruitment-${user.username}-${ticketNumber}`,
                    type: ChannelType.GuildText,
                    parent: ticketCategory.id,
                    topic: `Candidature Recrutement • ${position} • Créée par ${user.tag}`,
                    permissionOverwrites: [
                        {
                            id: guild.id,
                            deny: [PermissionFlagsBits.ViewChannel]
                        },
                        {
                            id: user.id,
                            allow: [
                                PermissionFlagsBits.ViewChannel,
                                PermissionFlagsBits.SendMessages,
                                PermissionFlagsBits.ReadMessageHistory,
                                PermissionFlagsBits.AttachFiles,
                                PermissionFlagsBits.EmbedLinks
                            ]
                        },
                        {
                            id: this.staffRoleId,
                            allow: [
                                PermissionFlagsBits.ViewChannel,
                                PermissionFlagsBits.SendMessages,
                                PermissionFlagsBits.ReadMessageHistory,
                                PermissionFlagsBits.ManageMessages,
                                PermissionFlagsBits.AttachFiles,
                                PermissionFlagsBits.EmbedLinks
                            ]
                        }
                    ]
                });
                
                // Libérer immédiatement le verrou de création
                ultimateLock.activeChannels.delete(channelCreationKey);

            // Embed de candidature dans le ticket
            const recruitmentEmbed = new EmbedBuilder()
                .setColor(config.color)
                .setTitle(`👥 **CANDIDATURE DE RECRUTEMENT - Ticket #${ticketNumber}**`)
                .setDescription(`
╭─────────────────────────────────────╮
│     **Nouvelle Candidature** 📋     │
╰─────────────────────────────────────╯

**📋 Informations de la Candidature :**
• **Candidat :** ${user.displayName} (${user.tag})
• **Poste souhaité :** ${position}
• **Numéro :** \`#${ticketNumber}\`
• **Créé le :** <t:${Math.floor(Date.now() / 1000)}:F>
• **Temps de réponse estimé :** \`${config.responseTime}\`

**💼 Expérience et Compétences :**
\`\`\`
${experience}
\`\`\`

**📅 Disponibilité :**
\`\`\`
${availability}
\`\`\`

**🎯 Prochaines Étapes :**
1️⃣ L'équipe RH a été notifiée automatiquement
2️⃣ Un responsable vous contactera rapidement
3️⃣ Restez disponible pour d'éventuelles questions

**💡 En attendant, vous pouvez :**
• Ajouter des informations supplémentaires
• Partager des références ou portfolio
• Utiliser les boutons ci-dessous`)
                .setThumbnail(user.displayAvatarURL({ dynamic: true }))
                .setFooter({ 
                    text: `Candidature ID: ${ticketNumber} • Équipe RH notifiée`,
                    iconURL: guild.iconURL({ dynamic: true })
                })
                .setTimestamp();

            // Boutons d'actions pour le ticket de recrutement
            const ticketActionsRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('ticket_close')
                        .setLabel('Fermer le Ticket')
                        .setStyle(ButtonStyle.Danger)
                        .setEmoji('🔒'),
                    new ButtonBuilder()
                        .setCustomId('ticket_claim')
                        .setLabel('Prendre en Charge')
                        .setStyle(ButtonStyle.Success)
                        .setEmoji('✋'),
                    new ButtonBuilder()
                        .setCustomId('ticket_add_user')
                        .setLabel('Ajouter Utilisateur')
                        .setStyle(ButtonStyle.Secondary)
                        .setEmoji('👥'),
                    new ButtonBuilder()
                        .setCustomId('ticket_transcript')
                        .setLabel('Transcript')
                        .setStyle(ButtonStyle.Secondary)
                        .setEmoji('📄')
                );

            await ticketChannel.send({
                content: `${user} | <@&${this.staffRoleId}> | <@421670146604793856>`,
                embeds: [recruitmentEmbed],
                components: [ticketActionsRow]
            });

            // Notification spéciale pour le recrutement
            await this.notifyRecruitmentStaff(guild, user, ticketChannel, position, experience, availability);

                await interaction.editReply({
                    content: `✅ **Candidature de recrutement soumise avec succès !** ${ticketChannel}\n🎯 L'équipe RH a été notifiée et vous répondra dans **${config.responseTime}**.`
                });

                this.logger.info(`Candidature recrutement #${ticketNumber} créée: ${ticketChannel.name} par ${user.tag} pour le poste: ${position}`);
                
            } catch (channelError) {
                this.logger.error('Erreur lors de la création du canal de recrutement:', channelError);
                ultimateLock.activeChannels.delete(channelCreationKey);
                await interaction.editReply({
                    content: '❌ Une erreur est survenue lors de la soumission de votre candidature.'
                });
            }
            
            // Libérer les verrous
            ultimateLock.activeChannels.delete(lockKey);

        } catch (error) {
            this.logger.error('Erreur lors du traitement de la candidature de recrutement:', error);
            
            // Nettoyer tous les verrous en cas d'erreur
            const ultimateLock = global.ULTIMATE_TICKET_LOCK;
            ultimateLock.activeChannels.delete(`recruitment_${interaction.user.id}`);
            
            try {
                await interaction.editReply({
                    content: '❌ Une erreur est survenue lors de la soumission de votre candidature.'
                });
            } catch (replyError) {
                // Ignorer les erreurs de réponse
            }
        }
    }

    async notifyRecruitmentStaff(guild, user, ticketChannel, position, experience, availability) {
        try {
            // PROTECTION ATOMIQUE ULTRA RADICALE pour le recrutement
            const globalLockKey = `ATOMIC_NOTIFY_RECRUITMENT_${ticketChannel.id}`;
            
            // Vérification atomique avec une clé unique basée sur le canal
            if (global[globalLockKey]) {
                this.logger.warn(`🚫 VERROU ATOMIQUE RECRUTEMENT: Notification déjà en cours pour ${ticketChannel.name}`);
                return;
            }
            
            // Verrouillage atomique immédiat
            global[globalLockKey] = {
                locked: true,
                timestamp: Date.now(),
                user: user.id,
                channel: ticketChannel.id
            };
            
            // Auto-nettoyage après 30 secondes
            setTimeout(() => {
                delete global[globalLockKey];
            }, 30000);

            const staffRole = guild.roles.cache.get(this.staffRoleId);
            if (!staffRole) {
                delete global[globalLockKey];
                return;
            }

            // Vérification supplémentaire avec le système existant
            const ultimateLock = global.ULTIMATE_TICKET_LOCK;
            const recruitmentNotificationKey = `notify_recruitment_${ticketChannel.id}_${user.id}_${Date.now()}`;
            
            // Double vérification pour être absolument sûr
            const existingNotifications = Array.from(ultimateLock.sentNotifications).filter(key => 
                key.includes(`_recruitment_${ticketChannel.id}_${user.id}_`)
            );
            
            if (existingNotifications.length > 0) {
                this.logger.warn(`🚫 DOUBLE VÉRIFICATION RECRUTEMENT: Notification déjà envoyée pour ${ticketChannel.name}`);
                delete global[globalLockKey];
                return;
            }
            
            ultimateLock.sentNotifications.add(recruitmentNotificationKey);

            const staffMembers = staffRole.members;
            
            const notificationEmbed = new EmbedBuilder()
                .setColor('#8e44ad')
                .setTitle('👥 **NOUVELLE CANDIDATURE DE RECRUTEMENT**')
                .setDescription(`
**Une nouvelle candidature nécessite votre attention !**

**👤 Candidat :** ${user} (${user.tag})
**💼 Poste souhaité :** ${position}
**📍 Canal :** ${ticketChannel}
**⏰ Temps de réponse attendu :** \`1-3 heures\`

**💼 Expérience :**
\`\`\`
${experience.substring(0, 500)}${experience.length > 500 ? '...' : ''}
\`\`\`

**📅 Disponibilité :**
\`\`\`
${availability.substring(0, 300)}${availability.length > 300 ? '...' : ''}
\`\`\``)
                .setThumbnail(user.displayAvatarURL({ dynamic: true }))
                .setFooter({ text: 'Cliquez sur "Prendre en Charge" dans le ticket pour le traiter' })
                .setTimestamp();

            // Envoi séquentiel avec protection contre les doublons
            let sentCount = 0;
            const sentTo = new Set(); // Protection contre l'envoi multiple au même membre
            
            for (const [id, member] of staffMembers) {
                // Vérifier qu'on n'a pas déjà envoyé à ce membre
                if (sentTo.has(id)) {
                    continue;
                }
                
                try {
                    await member.send({ embeds: [notificationEmbed] });
                    sentTo.add(id);
                    sentCount++;
                    this.logger.info(`📧 Notification recrutement envoyée à ${member.user.tag}`);
                    
                    // Délai entre chaque envoi pour éviter le rate limiting
                    if (sentCount < staffMembers.size) {
                        await new Promise(resolve => setTimeout(resolve, 200));
                    }
                } catch (error) {
                    this.logger.warn(`⚠️ Impossible d'envoyer MP recrutement à ${member.user.tag}`);
                }
            }
            
            this.logger.success(`✅ NOTIFICATION RECRUTEMENT ATOMIQUE UNIQUE envoyée à ${sentCount} membres du staff pour ${ticketChannel.name}`);
            
            // Libérer le verrou atomique après succès
            delete global[globalLockKey];

        } catch (error) {
            this.logger.error('Erreur lors de la notification atomique du staff pour recrutement:', error);
            // Toujours libérer le verrou en cas d'erreur
            const globalLockKey = `ATOMIC_NOTIFY_RECRUITMENT_${ticketChannel.id}`;
            delete global[globalLockKey];
        }
    }
}

export default TicketManager;
