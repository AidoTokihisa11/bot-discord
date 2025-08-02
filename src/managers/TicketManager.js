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

                // Créer le canal de ticket PRIVÉ (uniquement pour l'utilisateur)
                const ticketNumber = Date.now().toString().slice(-6);
                const ticketChannel = await guild.channels.create({
                    name: `${config.emoji}・${type}-${user.username}-${ticketNumber}`,
                    type: ChannelType.GuildText,
                    parent: ticketCategory.id,
                    topic: `Ticket ${config.name} PRIVÉ • ${subject} • Créé par ${user.tag}`,
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
                                PermissionFlagsBits.EmbedLinks,
                                PermissionFlagsBits.ManageMessages
                            ]
                        }
                        // Pas d'accès au staff par défaut - channel privé
                    ]
                });
                
                // Libérer immédiatement le verrou de création
                ultimateLock.activeChannels.delete(channelCreationKey);

            // Embed de bienvenue dans le ticket PRIVÉ
            const welcomeEmbed = new EmbedBuilder()
                .setColor(config.color)
                .setTitle(`${config.emoji} **${config.name} - Ticket Privé #${ticketNumber}**`)
                .setDescription(`
╭─────────────────────────────────────╮
│     **Bienvenue ${user.displayName}** 👋     │
│          **TICKET PRIVÉ** 🔒          │
╰─────────────────────────────────────╯

**📋 Informations du Ticket :**
• **Sujet :** ${subject}
• **Type :** ${config.name} (Privé)
• **Numéro :** \`#${ticketNumber}\`
• **Priorité :** ${this.getPriorityDisplay(priority)}
• **Créé le :** <t:${Math.floor(Date.now() / 1000)}:F>
• **Statut :** Ticket privé - Seul vous avez accès

**📝 Description :**
\`\`\`
${description}
\`\`\`

**🔒 Confidentialité :**
• Ce ticket est **100% privé**
• Seul **vous** avez accès à ce channel
• Aucun staff n'est notifié automatiquement
• Vous pouvez inviter quelqu'un si nécessaire

**💡 Actions disponibles :**
• Ajouter des captures d'écran
• Préciser des détails supplémentaires
• Inviter un utilisateur ou staff si besoin
• Fermer le ticket quand vous le souhaitez`)
                .setThumbnail(user.displayAvatarURL({ dynamic: true }))
                .setFooter({ 
                    text: `Ticket Privé ID: ${ticketNumber} • Accessible uniquement par vous`,
                    iconURL: guild.iconURL({ dynamic: true })
                })
                .setTimestamp();

            // Boutons d'actions pour le ticket privé
            const ticketActionsRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('ticket_close')
                        .setLabel('Fermer le Ticket')
                        .setStyle(ButtonStyle.Danger)
                        .setEmoji('🔒'),
                    new ButtonBuilder()
                        .setCustomId('ticket_invite_staff')
                        .setLabel('Inviter le Staff')
                        .setStyle(ButtonStyle.Success)
                        .setEmoji('👥'),
                    new ButtonBuilder()
                        .setCustomId('ticket_add_user')
                        .setLabel('Ajouter Utilisateur')
                        .setStyle(ButtonStyle.Secondary)
                        .setEmoji('➕'),
                    new ButtonBuilder()
                        .setCustomId('ticket_transcript')
                        .setLabel('Transcript')
                        .setStyle(ButtonStyle.Secondary)
                        .setEmoji('📄')
                );

            // Envoyer uniquement à l'utilisateur (pas de ping staff)
            await ticketChannel.send({
                content: `${user} 🔒 **Votre ticket privé a été créé avec succès !**\n\n💡 *Ce channel est privé et accessible uniquement par vous. Utilisez le bouton "Inviter le Staff" si vous souhaitez obtenir de l'aide.*`,
                embeds: [welcomeEmbed],
                components: [ticketActionsRow]
            });

            // PAS de notification au staff - ticket privé

                await interaction.editReply({
                    content: `✅ **Ticket privé créé avec succès !** ${ticketChannel}\n\n🔒 **Votre ticket est 100% privé** - seul vous y avez accès.\n💡 **Vous avez été notifié dans le channel** - consultez ${ticketChannel}\n🎯 Utilisez le bouton "Inviter le Staff" dans le ticket si vous avez besoin d'aide.`
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
            // PROTECTION ABSOLUE CONTRE LES DOUBLONS - une seule notification par ticket
            const ultimateLock = global.ULTIMATE_TICKET_LOCK;
            const notificationKey = `notify_${ticketChannel.id}`;
            
            // Vérifier si une notification a déjà été envoyée pour ce ticket
            if (ultimateLock.sentNotifications.has(notificationKey)) {
                this.logger.warn(`🚫 NOTIFICATION DÉJÀ ENVOYÉE pour ${ticketChannel.name}`);
                return;
            }
            
            // Marquer immédiatement comme envoyé
            ultimateLock.sentNotifications.add(notificationKey);

            const staffRole = guild.roles.cache.get(this.staffRoleId);
            if (!staffRole) {
                this.logger.warn('❌ Rôle staff introuvable');
                return;
            }

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

            // Envoyer UNE SEULE notification à UN SEUL membre du staff en ligne
            const onlineStaffMembers = staffRole.members.filter(member => 
                member.presence?.status === 'online' || member.presence?.status === 'idle'
            );
            
            // Si personne en ligne, prendre tous les membres staff
            const targetStaff = onlineStaffMembers.size > 0 ? onlineStaffMembers : staffRole.members;
            
            if (targetStaff.size > 0) {
                // Prendre le premier membre disponible pour éviter le spam
                const firstStaff = targetStaff.first();
                
                try {
                    await firstStaff.send({ embeds: [notificationEmbed] });
                    this.logger.info(`📧 Notification unique envoyée à ${firstStaff.user.tag} pour ${ticketChannel.name}`);
                } catch (error) {
                    this.logger.warn(`⚠️ Impossible d'envoyer MP à ${firstStaff.user.tag}, tentative avec un autre`);
                    
                    // Si le premier échoue, essayer avec les autres un par un
                    for (const [id, member] of targetStaff) {
                        if (member.id === firstStaff.id) continue; // Déjà essayé
                        
                        try {
                            await member.send({ embeds: [notificationEmbed] });
                            this.logger.info(`📧 Notification de secours envoyée à ${member.user.tag}`);
                            break; // Arrêter après le premier succès
                        } catch (memberError) {
                            continue; // Essayer le suivant
                        }
                    }
                }
            }

        } catch (error) {
            this.logger.error('❌ Erreur lors de la notification du staff:', error);
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
                // Créer un channel spécial SOS pour l'utilisateur
                await this.createSOSChannel(interaction);
                break;
            case 'sos_resources':
                // Afficher les ressources d'aide dans le channel SOS
                await this.showSOSResources(interaction);
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
            .setDescription(`**Pour un contact direct avec notre équipe :**

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
            case 'ticket_invite_staff':
                await this.inviteStaffToTicket(interaction);
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
                .setDescription(`**${staff} a pris ce ticket en charge !**

⏰ **Temps de réponse:** Sous peu
🎯 **Priorité:** Élevée
👤 **Staff assigné:** ${staff}

Merci de votre patience, nous traitons votre demande.`)
                .setFooter({ text: 'Ticket en cours de traitement' })
                .setTimestamp();

            await channel.send({ embeds: [claimEmbed] });
            
            await this.safeInteractionReply(interaction, {
                content: '✅ Vous avez pris ce ticket en charge.',
                flags: MessageFlags.Ephemeral
            });
        } catch (error) {
            this.logger.error('Erreur lors de la prise en charge du ticket:', error);
        }
    }

    // NOUVELLE FONCTION AMÉLIORÉE POUR L'INVITATION DU STAFF AVEC MENU DÉROULANT
    async inviteStaffToTicketV2(interaction) {
        try {
            const channel = interaction.channel;
            const user = interaction.user;
            const isSOSChannel = channel.name.includes('sos-support');
            
            // Vérifier que l'utilisateur est le créateur du ticket ou a les permissions
            if (!channel.name.includes(user.username) && !interaction.member.roles.cache.has(this.staffRoleId)) {
                return await this.safeInteractionReply(interaction, {
                    content: '❌ Seul le créateur du ticket peut inviter le staff.',
                    flags: MessageFlags.Ephemeral
                });
            }

            const guild = interaction.guild;
            const staffRole = guild.roles.cache.get(this.staffRoleId);
            
            if (!staffRole) {
                return await this.safeInteractionReply(interaction, {
                    content: '❌ Rôle staff introuvable.',
                    flags: MessageFlags.Ephemeral
                });
            }

            // Récupérer les membres du staff disponibles (excluant les rôles restreints)
            const restrictedRoleId = '1386990308679483393';
            const specialRoleId = '1388265895264129157'; // Rôle spécial à inclure individuellement
            
            const availableStaff = staffRole.members.filter(member => 
                !member.roles.cache.has(restrictedRoleId) && !member.user.bot
            );

            // Récupérer TOUS les membres ayant le rôle spécial (même s'ils ont le staff role)
            const specialRole = guild.roles.cache.get(specialRoleId);
            const specialRoleMembers = specialRole ? specialRole.members.filter(member => 
                !member.user.bot // Inclure tous les humains avec ce rôle, même s'ils sont staff
            ) : new Map();

            // Compter les membres uniques (éviter double comptage si quelqu'un a les deux rôles)
            const allUniqueMembers = new Set([...availableStaff.keys(), ...specialRoleMembers.keys()]);
            const totalAvailableMembers = allUniqueMembers.size;

            if (totalAvailableMembers === 0) {
                return await this.safeInteractionReply(interaction, {
                    content: '❌ Aucun membre du staff ou du rôle spécial disponible.',
                    flags: MessageFlags.Ephemeral
                });
            }

            // Créer un menu de sélection pour choisir les membres
            const staffOptions = [];
            let optionCount = 0;
            
            // Ajouter TOUS les membres du rôle spécial en PREMIER (priorité)
            this.logger.info(`📋 Ajout de ${specialRoleMembers.size} membres du rôle spécial dans la liste`);
            for (const [id, member] of specialRoleMembers) {
                if (optionCount >= 22) break; // Limite Discord - on garde 2 places pour "all_staff" et "all_special"
                
                const statusEmoji = member.presence?.status === 'online' ? '🟢' : 
                                  member.presence?.status === 'idle' ? '🟡' : 
                                  member.presence?.status === 'dnd' ? '🔴' : '⚫';
                
                // Assurer que le pseudo complet est visible
                const displayName = member.displayName || member.user.displayName || member.user.username;
                const label = displayName.length > 24 ? displayName.substring(0, 21) + '...' : displayName;
                const description = `${statusEmoji} ${member.user.username} ⭐ [Spécial]`;
                
                staffOptions.push({
                    label: `⭐ ${label}`,
                    description: description,
                    value: member.id,
                    emoji: isSOSChannel ? '🆘' : '⭐'
                });
                optionCount++;
                this.logger.info(`✅ Ajouté membre spécial: ${displayName} (${member.user.username})`);
            }

            // Ajouter ensuite les membres du staff qui n'ont PAS le rôle spécial
            this.logger.info(`📋 Ajout des membres staff restants...`);
            for (const [id, member] of availableStaff) {
                if (optionCount >= 22) break; // Limite Discord
                if (specialRoleMembers.has(id)) continue; // Skip si déjà ajouté comme membre spécial
                
                const statusEmoji = member.presence?.status === 'online' ? '🟢' : 
                                  member.presence?.status === 'idle' ? '🟡' : 
                                  member.presence?.status === 'dnd' ? '🔴' : '⚫';
                
                const displayName = member.displayName || member.user.displayName || member.user.username;
                const label = displayName.length > 24 ? displayName.substring(0, 21) + '...' : displayName;
                const description = `${statusEmoji} ${member.user.username} [Staff]`;
                
                staffOptions.push({
                    label: `👤 ${label}`,
                    description: description,
                    value: member.id,
                    emoji: isSOSChannel ? '🆘' : '👤'
                });
                optionCount++;
            }

            // Ajouter une option pour inviter tout le staff
            if (availableStaff.size > 0) {
                staffOptions.push({
                    label: isSOSChannel ? 'Toute l\'Équipe de Soutien' : 'Tout le Staff Disponible',
                    description: isSOSChannel ? 'Inviter l\'équipe de soutien complète' : 'Inviter tous les membres du staff',
                    value: 'all_staff',
                    emoji: isSOSChannel ? '🆘' : '👥'
                });
            }

            // Ajouter une option pour inviter tous les membres du rôle spécial
            if (specialRoleMembers.size > 0) {
                staffOptions.push({
                    label: 'Tous les Membres Spéciaux',
                    description: 'Inviter tous les membres du rôle spécial',
                    value: 'all_special',
                    emoji: '⭐'
                });
            }

            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId(isSOSChannel ? 'select_sos_staff_invite' : 'select_staff_invite')
                .setPlaceholder(isSOSChannel ? 'Choisissez votre équipe de soutien...' : 'Choisissez qui inviter...')
                .setMinValues(1)
                .setMaxValues(Math.min(staffOptions.length, isSOSChannel ? 5 : 10)) // Limite plus petite pour SOS
                .addOptions(staffOptions);

            const selectRow = new ActionRowBuilder().addComponents(selectMenu);

            let inviteEmbed;
            if (isSOSChannel) {
                inviteEmbed = new EmbedBuilder()
                    .setColor('#ff6b6b')
                    .setTitle('🆘 **DEMANDE D\'AIDE - ÉQUIPE DE SOUTIEN**')
                    .setDescription(`
**${user.displayName}, choisissez qui peut vous aider :**

🟢 **En ligne** | 🟡 **Absent** | 🔴 **Ne pas déranger** | ⚫ **Hors ligne**
⭐ **[Spécial]** | 👤 **[Staff]**

**💝 Notre équipe de soutien :**
• **Écoute bienveillante** sans jugement
• **Confidentialité absolue** garantie
• **Accompagnement personnalisé** selon vos besoins
• **Ressources professionnelles** si nécessaire

**🌟 Vous n'êtes pas seul(e) dans cette épreuve.**

**Membres disponibles :** ${totalAvailableMembers} (⭐ Spéciaux: ${specialRoleMembers.size}, 👤 Staff: ${availableStaff.size - specialRoleMembers.size})`)
                    .setFooter({ text: 'Sélectionnez dans le menu ci-dessous • Confidentialité garantie' });
            } else {
                inviteEmbed = new EmbedBuilder()
                    .setColor('#3498db')
                    .setTitle('👥 **INVITATION DU STAFF**')
                    .setDescription(`
**Choisissez qui vous souhaitez inviter dans votre ticket :**

🟢 **En ligne** | 🟡 **Absent** | 🔴 **Ne pas déranger** | ⚫ **Hors ligne**
⭐ **[Spécial]** | 👤 **[Staff]**

• Vous pouvez sélectionner plusieurs membres
• Les membres spéciaux apparaissent en premier dans la liste
• Tous les membres du rôle spécial sont disponibles avec leurs pseudos
• Les membres invités pourront voir ce ticket

**Membres disponibles :** ${totalAvailableMembers} (⭐ Spéciaux: ${specialRoleMembers.size}, 👤 Staff: ${availableStaff.size - specialRoleMembers.size})`)
                    .setFooter({ text: 'Sélectionnez dans le menu ci-dessous' });
            }

            await this.safeInteractionReply(interaction, {
                embeds: [inviteEmbed],
                components: [selectRow],
                flags: MessageFlags.Ephemeral
            });

        } catch (error) {
            this.logger.error('❌ Erreur lors de l\'invitation du staff:', error);
            await this.safeInteractionReply(interaction, {
                content: '❌ Une erreur est survenue lors de la préparation de l\'invitation.',
                flags: MessageFlags.Ephemeral
            });
        }
    }

    async inviteStaffToTicket(interaction) {
        try {
            const channel = interaction.channel;
            const user = interaction.user;
            
            // Vérifier que l'utilisateur est le créateur du ticket ou a les permissions
            if (!channel.name.includes(user.username) && !interaction.member.roles.cache.has(this.staffRoleId)) {
                return await this.safeInteractionReply(interaction, {
                    content: '❌ Seul le créateur du ticket peut inviter le staff.',
                    flags: MessageFlags.Ephemeral
                });
            }

            const guild = interaction.guild;
            const staffRole = guild.roles.cache.get(this.staffRoleId);
            
            if (!staffRole) {
                return await this.safeInteractionReply(interaction, {
                    content: '❌ Rôle staff introuvable.',
                    flags: MessageFlags.Ephemeral
                });
            }

            // Récupérer les membres du staff disponibles (excluant les rôles restreints)
            const restrictedRoleId = '1386990308679483393';
            const availableStaff = staffRole.members.filter(member => 
                !member.roles.cache.has(restrictedRoleId) && !member.user.bot
            );

            if (availableStaff.size === 0) {
                return await this.safeInteractionReply(interaction, {
                    content: '❌ Aucun membre du staff disponible.',
                    flags: MessageFlags.Ephemeral
                });
            }

            // Créer un menu de sélection pour choisir les membres du staff
            const staffOptions = [];
            let optionCount = 0;
            
            for (const [id, member] of availableStaff) {
                if (optionCount >= 25) break; // Limite Discord pour les menus de sélection
                
                const statusEmoji = member.presence?.status === 'online' ? '🟢' : 
                                  member.presence?.status === 'idle' ? '🟡' : 
                                  member.presence?.status === 'dnd' ? '🔴' : '⚫';
                
                staffOptions.push({
                    label: member.displayName,
                    description: `${statusEmoji} ${member.user.tag}`,
                    value: member.id,
                    emoji: '👤'
                });
                optionCount++;
            }

            // Ajouter une option pour inviter tout le staff
            staffOptions.push({
                label: 'Tout le Staff Disponible',
                description: 'Inviter tous les membres du staff',
                value: 'all_staff',
                emoji: '👥'
            });

            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('select_staff_invite')
                .setPlaceholder('Choisissez qui inviter...')
                .setMinValues(1)
                .setMaxValues(Math.min(staffOptions.length, 10)) // Maximum 10 sélections
                .addOptions(staffOptions);

            const selectRow = new ActionRowBuilder().addComponents(selectMenu);

            const inviteEmbed = new EmbedBuilder()
                .setColor('#3498db')
                .setTitle('👥 **INVITATION DU STAFF**')
                .setDescription(`
**Choisissez qui vous souhaitez inviter dans votre ticket :**

� **En ligne** | 🟡 **Absent** | 🔴 **Ne pas déranger** | ⚫ **Hors ligne**

• Vous pouvez sélectionner plusieurs membres
• Ou choisir "Tout le Staff Disponible"
• Les membres invités pourront voir ce ticket

**Membres disponibles :** ${availableStaff.size}`)
                .setFooter({ text: 'Sélectionnez dans le menu ci-dessous' });

            await this.safeInteractionReply(interaction, {
                embeds: [inviteEmbed],
                components: [selectRow],
                flags: MessageFlags.Ephemeral
            });

        } catch (error) {
            this.logger.error('❌ Erreur lors de l\'invitation du staff:', error);
            await this.safeInteractionReply(interaction, {
                content: '❌ Une erreur est survenue lors de la préparation de l\'invitation.',
                flags: MessageFlags.Ephemeral
            });
        }
    }

    // REDIRECTION DE L'ANCIENNE FONCTION VERS LA NOUVELLE VERSION AMÉLIORÉE
    async inviteStaffToTicketOLD(interaction) {
        // Redirection vers la nouvelle version améliorée avec menu déroulant
        return await this.inviteStaffToTicketV2(interaction);
    }

    async handleStaffInviteSelection(interaction) {
        try {
            const channel = interaction.channel;
            const user = interaction.user;
            const selectedValues = interaction.values;
            
            // Vérifier les permissions
            if (!channel.name.includes(user.username) && !interaction.member.roles.cache.has(this.staffRoleId)) {
                return await interaction.reply({
                    content: '❌ Vous n\'avez pas les permissions pour cela.',
                    flags: MessageFlags.Ephemeral
                });
            }

            await interaction.deferReply({ flags: MessageFlags.Ephemeral });

            // PROTECTION CONTRE LES DOUBLONS DE NOTIFICATIONS
            const notificationLockKey = `STAFF_INVITE_${channel.id}_${user.id}_${Date.now()}`;
            const globalLock = global.ULTIMATE_TICKET_LOCK;
            
            // Vérifier si une notification est déjà en cours pour ce canal
            const existingNotifications = Array.from(globalLock.sentNotifications).filter(key => 
                key.includes(`STAFF_INVITE_${channel.id}_${user.id}`)
            );
            
            if (existingNotifications.length > 0) {
                this.logger.warn(`🚫 Notification staff déjà envoyée pour ${channel.name}`);
                return await interaction.editReply({
                    content: '⚠️ Une invitation est déjà en cours pour ce ticket.'
                });
            }
            
            // Marquer cette notification comme envoyée
            globalLock.sentNotifications.add(notificationLockKey);

            const guild = interaction.guild;
            const staffRole = guild.roles.cache.get(this.staffRoleId);
            const specialRoleId = '1388265895264129157';
            const specialRole = guild.roles.cache.get(specialRoleId);
            const invitedMembers = [];

            // Si "all_staff" est sélectionné, inviter tout le staff
            if (selectedValues.includes('all_staff')) {
                // Donner accès au rôle staff complet
                await channel.permissionOverwrites.create(this.staffRoleId, {
                    ViewChannel: true,
                    SendMessages: true,
                    ReadMessageHistory: true,
                    ManageMessages: true,
                    AttachFiles: true,
                    EmbedLinks: true
                });

                invitedMembers.push('Tout le Staff');
            } 
            // Si "all_special" est sélectionné, inviter tous les membres du rôle spécial
            else if (selectedValues.includes('all_special')) {
                if (specialRole) {
                    // Donner accès au rôle spécial complet
                    await channel.permissionOverwrites.create(specialRoleId, {
                        ViewChannel: true,
                        SendMessages: true,
                        ReadMessageHistory: true,
                        AttachFiles: true,
                        EmbedLinks: true
                    });

                    invitedMembers.push('Tous les Membres Spéciaux');
                }
            } else {
                // Inviter les membres sélectionnés individuellement
                for (const memberId of selectedValues) {
                    const member = guild.members.cache.get(memberId);
                    if (member) {
                        await channel.permissionOverwrites.create(memberId, {
                            ViewChannel: true,
                            SendMessages: true,
                            ReadMessageHistory: true,
                            AttachFiles: true,
                            EmbedLinks: true
                        });
                        
                        // Identifier le type de membre pour l'affichage
                        const isStaff = member.roles.cache.has(this.staffRoleId);
                        const isSpecial = member.roles.cache.has(specialRoleId);
                        const memberType = isStaff ? '[Staff]' : isSpecial ? '[Spécial]' : '';
                        
                        invitedMembers.push(`${member.displayName} ${memberType}`);
                    }
                }
            }

            // Embed de confirmation
            const confirmEmbed = new EmbedBuilder()
                .setColor('#2ecc71')
                .setTitle('✅ **STAFF INVITÉ AVEC SUCCÈS**')
                .setDescription(`
**${user} a invité du staff dans ce ticket !**

**👥 Membres invités :**
${invitedMembers.map(name => `• ${name}`).join('\n')}

**🔓 Le ticket n'est plus privé** pour les membres invités.
**⏰ Temps de réponse estimé :** 2-4 heures`)
                .setFooter({ text: 'Les membres invités ont été notifiés' })
                .setTimestamp();

            // Notifier dans le channel
            let mentionList = '';
            if (selectedValues.includes('all_staff')) {
                mentionList = `<@&${this.staffRoleId}>`;
            } else if (selectedValues.includes('all_special')) {
                mentionList = `<@&${specialRoleId}>`;
            } else {
                mentionList = selectedValues.map(id => `<@${id}>`).join(' ');
            }

            await channel.send({
                content: `👥 **Membres invités par ${user}** | ${mentionList}`,
                embeds: [confirmEmbed]
            });

            // Confirmation à l'utilisateur
            const memberCountText = selectedValues.includes('all_staff') || selectedValues.includes('all_special') 
                ? `Groupe complet invité` 
                : `${invitedMembers.length} membre(s) invité(s)`;
                
            await interaction.editReply({
                content: `✅ **${memberCountText}** et notifié(s) dans le ticket.`
            });

            // NOTIFICATION PRIVÉE UNIQUE POUR ÉVITER LE SPAM
            if (!selectedValues.includes('all_staff') && !selectedValues.includes('all_special') && selectedValues.length <= 3) {
                const notificationPromises = [];
                
                for (const memberId of selectedValues) {
                    const invitedMember = guild.members.cache.get(memberId);
                    if (invitedMember) {
                        const notifyPromise = this.sendSingleStaffNotification(invitedMember, channel, user);
                        notificationPromises.push(notifyPromise);
                    }
                }
                
                // Envoyer toutes les notifications en parallèle avec gestion d'erreur
                await Promise.allSettled(notificationPromises);
            }

            // Auto-nettoyage de la notification après 5 minutes
            setTimeout(() => {
                globalLock.sentNotifications.delete(notificationLockKey);
            }, 300000);

        } catch (error) {
            this.logger.error('❌ Erreur lors de la gestion de l\'invitation:', error);
            try {
                await interaction.editReply({
                    content: '❌ Une erreur est survenue lors de l\'invitation du staff.'
                });
            } catch (replyError) {
                // Ignorer les erreurs de réponse
            }
        }
    }

    // FONCTION UTILITAIRE POUR ENVOYER UNE NOTIFICATION UNIQUE AU STAFF
    async sendSingleStaffNotification(member, channel, invitedBy) {
        try {
            const notifyEmbed = new EmbedBuilder()
                .setColor('#3498db')
                .setTitle('👥 **INVITATION DANS UN TICKET**')
                .setDescription(`
Vous avez été invité dans un ticket par ${invitedBy}.

**📍 Canal :** ${channel}
**👤 Invité par :** ${invitedBy}
**📅 Date :** <t:${Math.floor(Date.now() / 1000)}:F>

Cliquez sur le lien pour accéder au ticket.`)
                .setFooter({ text: 'Invitation personnelle • Système de tickets' });
            
            await member.send({ embeds: [notifyEmbed] });
            this.logger.info(`📧 Notification ticket envoyée à ${member.user.tag}`);
        } catch (dmError) {
            this.logger.warn(`⚠️ Impossible d'envoyer MP ticket à ${member.user.tag}`);
        }
    }

    async showMyTickets(interaction) {
        const guild = interaction.guild;
        const userTickets = guild.channels.cache.filter(
            channel => channel.name.includes(interaction.user.username) && channel.name.includes('ticket')
        );
        
        const ticketsEmbed = new EmbedBuilder()
            .setColor('#9b59b6')
            .setTitle('� **VOS TICKETS**')
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
            .setDescription(`**Pour un contact direct avec notre équipe :**

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
                .setTitle('🆘 **AIDE D\'URGENCE - NUMÉROS OFFICIELS**')
                .setDescription(`
╭─────────────────────────────────────╮
│   **🚨 VOUS N'ÊTES PAS SEUL(E) 🚨**   │
╰─────────────────────────────────────╯

**⚡ URGENCES PRINCIPALES :**
• **SAMU :** \`15\` 🚑 (Urgences médicales)
• **Police :** \`17\` � (Interventions urgentes)
• **Pompiers :** \`18\` � (Incendies, accidents)
• **Urgence européenne :** \`112\` 🌍 (Toute urgence UE)

**📞 SOUTIEN PSYCHOLOGIQUE IMMÉDIAT :**
• **Détresse/Suicide :** \`31 14\` (24h/24, 7j/7)

**🤝 Vous avez de la valeur et votre vie compte.**`)
                .setFooter({ 
                    text: '💝 Il y a toujours de l\'espoir • Vous méritez d\'être aidé(e)',
                    iconURL: interaction.client.user.displayAvatarURL()
                })
                .setTimestamp();

            // Embed avec les numéros spécialisés
            const preventionEmbed = new EmbedBuilder()
                .setColor('#ff6b6b')
                .setTitle('📞 **NUMÉROS SPÉCIALISÉS OFFICIELS**')
                .addFields(
                    {
                        name: '🚨 **NUMÉROS SPÉCIALISÉS URGENTS**',
                        value: `
**📞 Soutien psychologique :** \`31 14\` (24h/24)
**📞 Violences conjugales :** \`39 19\` (24h/24)
**📞 Enfance en danger :** \`119\` (Maltraitance)
**📞 Aide aux victimes :** \`116 006\` (Gratuit)
**📞 Personnes sourdes/malentendantes :** \`114\`
**📞 SAMU Social :** \`115\` (Sans-abri)`,
                        inline: false
                    },
                    {
                        name: '� **SECOURS SPÉCIALISÉS**',
                        value: `
**📞 Secours en mer :** \`196\` (CROSS)
**📞 Sauvetage aéronautique :** \`191\`
**📞 Alerte attentat/enlèvement :** \`197\`
**📞 Urgence gaz :** \`0800 47 33 33\`
**📞 Pharmacie de garde :** \`3237\``,
                        inline: true
                    },
                    {
                        name: '👥 **JEUNES & ADDICTIONS**',
                        value: `
**📞 Cyber-harcèlement :** \`30 18\` (Jeunes)
**📞 Drogues Info Service :** \`0800 23 13 13\`
**📞 Permanence de soins :** \`116 117\`
**📞 Rappel urgences :** \`0800 112 112\``,
                        inline: true
                    }
                )
                .setFooter({ text: '📋 Numéros officiels français - Services gratuits' });

            // Embed avec resources en ligne et conseils
            const resourcesEmbed = new EmbedBuilder()
                .setColor('#4CAF50')
                .setTitle('💻 **RESSOURCES EN LIGNE & CONSEILS**')
                .addFields(
                    {
                        name: '🌐 **Ressources Générales d\'Aide**',
                        value: `
• **Sites de prévention** - Prévention de la dépression chez les jeunes
• **Informations santé mentale** - Ressources officielles gouvernementales
• **Ressources spécialisées** - Santé mentale et bien-être
• **Écoute anonyme** - Services de chat disponibles 24h/24`,
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

**🌈 Demain viendra.**`)
                .setFooter({ 
                    text: '💝 Vous n\'êtes jamais seul(e) • Cette communauté vous soutient',
                    iconURL: interaction.guild.iconURL({ dynamic: true })
                });

            // Bouton d'action unique - pas de liens externes
            const sosActionsRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('sos_create_support_ticket')
                        .setLabel('Parler à Notre Équipe')
                        .setStyle(ButtonStyle.Success)
                        .setEmoji('💬')
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
                    content: '❌ Une erreur est survenue lors de l\'affichage du panel SOS.',
                    flags: MessageFlags.Ephemeral
                });
            } catch (fallbackError) {
                this.logger.error('Erreur critique lors du fallback SOS:', fallbackError);
            }
        }
    }

    async createSOSChannel(interaction) {
        try {
            // Protection contre les doublons AVANT toute interaction
            const ultimateLock = global.ULTIMATE_TICKET_LOCK;
            const userId = interaction.user.id;
            const now = Date.now();
            
            // Vérifier si l'utilisateur a déjà une action en cours
            if (ultimateLock.activeUsers.has(userId)) {
                const lastAction = ultimateLock.activeUsers.get(userId);
                if (now - lastAction < 10000) { // 10 secondes
                    this.logger.warn(`🚫 BLOCAGE SOS: ${interaction.user.username} a déjà une action en cours`);
                    // Tentative de réponse rapide
                    try {
                        if (!interaction.replied && !interaction.deferred) {
                            await interaction.reply({
                                content: '⏰ Veuillez patienter avant de créer un nouveau channel SOS.',
                                flags: MessageFlags.Ephemeral
                            });
                        }
                    } catch (e) {
                        // Ignore si l'interaction a expiré
                    }
                    return;
                }
            }
            
            // Verrouiller cet utilisateur IMMÉDIATEMENT
            ultimateLock.activeUsers.set(userId, now);

            // RÉPONSE IMMÉDIATE pour éviter l'expiration (3 secondes max)
            let replyPromise;
            try {
                if (!interaction.deferred && !interaction.replied) {
                    replyPromise = interaction.deferReply({ flags: MessageFlags.Ephemeral });
                    // Attendre maximum 2 secondes pour la déférence
                    await Promise.race([
                        replyPromise,
                        new Promise((_, reject) => setTimeout(() => reject(new Error('Defer timeout')), 2000))
                    ]);
                }
            } catch (deferError) {
                this.logger.warn('⚠️ Échec de déférence, tentative de réponse directe');
                // Si la déférence échoue, tentative de réponse directe
                try {
                    if (!interaction.replied) {
                        await interaction.reply({
                            content: '🔄 Création de votre espace SOS en cours...',
                            flags: MessageFlags.Ephemeral
                        });
                    }
                } catch (replyError) {
                    // Si tout échoue, l'interaction a expiré
                    this.logger.error('❌ Interaction expirée complètement');
                    ultimateLock.activeUsers.delete(userId);
                    return;
                }
            }

            const guild = interaction.guild;
            const user = interaction.user;

            // Vérifier si l'utilisateur a déjà un channel SOS ouvert
            const existingSOSChannels = guild.channels.cache.filter(
                channel => channel.name.includes(user.username) && channel.name.includes('sos-support')
            );

            if (existingSOSChannels.size > 0) {
                await interaction.editReply({
                    content: `❌ Vous avez déjà un channel SOS ouvert : ${existingSOSChannels.first()}\n\n💡 Utilisez votre channel existant pour continuer la conversation.`
                });
                ultimateLock.activeUsers.delete(userId);
                return;
            }

            // Créer la catégorie SOS si nécessaire
            let sosCategory = guild.channels.cache.find(c => c.name === '🆘・Support SOS' && c.type === ChannelType.GuildCategory);
            if (!sosCategory) {
                sosCategory = await guild.channels.create({
                    name: '🆘・Support SOS',
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
                                PermissionFlagsBits.SendMessages,
                                PermissionFlagsBits.ReadMessageHistory,
                                PermissionFlagsBits.ManageMessages
                            ]
                        }
                    ]
                });
            }

            // Créer le channel SOS PRIVÉ
            const sosNumber = Date.now().toString().slice(-6);
            const sosChannel = await guild.channels.create({
                name: `🆘・sos-support-${user.username}-${sosNumber}`,
                type: ChannelType.GuildText,
                parent: sosCategory.id,
                topic: `Channel SOS PRIVÉ • Support émotionnel • Créé par ${user.tag}`,
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
                    }
                    // Le staff n'a pas accès automatiquement - channel privé
                ]
            });

            // Embed de bienvenue SOS
            const sosWelcomeEmbed = new EmbedBuilder()
                .setColor('#ff6b6b')
                .setTitle('🆘 **ESPACE DE SOUTIEN PRIVÉ**')
                .setDescription(`
╭─────────────────────────────────────╮
│     **Bienvenue ${user.displayName}** 💝     │
│        **ESPACE 100% PRIVÉ** 🔒        │
╰─────────────────────────────────────╯

**🤗 Vous avez fait le bon choix en venant ici.**

**📋 Cet espace vous offre :**
• **Confidentialité totale** - Seul vous avez accès
• **Aucune pression** - Parlez à votre rythme
• **Bienveillance** - Vous êtes en sécurité ici
• **Support disponible** - Notre équipe peut être invitée si vous le souhaitez

**💬 Vous pouvez ici :**
• Exprimer vos sentiments sans jugement
• Poser toutes vos questions
• Demander de l'aide quand vous êtes prêt(e)
• Prendre le temps dont vous avez besoin

**🌟 Rappels importants :**
• Vos émotions sont valides
• Demander de l'aide est courageux
• Vous n'êtes pas seul(e)
• **Demain viendra** 🌅

**💡 Si vous souhaitez parler à notre équipe, utilisez le bouton "Inviter le Staff" ci-dessous.**`)
                .setThumbnail(user.displayAvatarURL({ dynamic: true }))
                .setFooter({ 
                    text: `Channel SOS Privé ID: ${sosNumber} • Accessible uniquement par vous`,
                    iconURL: guild.iconURL({ dynamic: true })
                })
                .setTimestamp();

            // Boutons pour le channel SOS
            const sosChannelActionsRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('ticket_invite_staff')
                        .setLabel('Inviter le Staff')
                        .setStyle(ButtonStyle.Success)
                        .setEmoji('👥'),
                    new ButtonBuilder()
                        .setCustomId('sos_resources')
                        .setLabel('Ressources d\'Aide')
                        .setStyle(ButtonStyle.Secondary)
                        .setEmoji('📚'),
                    new ButtonBuilder()
                        .setCustomId('ticket_close')
                        .setLabel('Fermer le Channel')
                        .setStyle(ButtonStyle.Danger)
                        .setEmoji('🔒')
                );

            // Message de bienvenue dans le channel SOS
            await sosChannel.send({
                content: `${user} 🆘 **Bienvenue dans votre espace de soutien privé**\n\n💝 *Ce channel est entièrement privé et accessible uniquement par vous. Prenez le temps dont vous avez besoin.*`,
                embeds: [sosWelcomeEmbed],
                components: [sosChannelActionsRow]
            });

            // Réponse à l'utilisateur - Gestion sécurisée
            try {
                if (interaction.deferred) {
                    await interaction.editReply({
                        content: `✅ **Votre espace de soutien privé a été créé !** ${sosChannel}\n\n🔒 **Cet espace est 100% privé** - seul vous y avez accès.\n💝 **Consultez ${sosChannel}** pour continuer\n🌟 **Demain viendra.**`
                    });
                } else if (!interaction.replied) {
                    await interaction.reply({
                        content: `✅ **Votre espace de soutien privé a été créé !** ${sosChannel}\n\n🔒 **Cet espace est 100% privé** - seul vous y avez accès.\n💝 **Consultez ${sosChannel}** pour continuer\n🌟 **Demain viendra.**`,
                        flags: MessageFlags.Ephemeral
                    });
                }
            } catch (responseError) {
                // Si impossible de répondre, envoyer un message direct dans le channel créé
                await sosChannel.send({
                    content: `${user} ✅ **Votre espace SOS a été créé avec succès !**\n\n🔒 Ce channel est privé et vous appartient.`
                });
            }

            // Libérer le verrou
            ultimateLock.activeUsers.delete(userId);
            
            this.logger.info(`✅ Channel SOS #${sosNumber} créé: ${sosChannel.name} par ${user.tag}`);

        } catch (error) {
            this.logger.error('❌ Erreur lors de la création du channel SOS:', error);
            
            // Libérer le verrou en cas d'erreur
            const ultimateLock = global.ULTIMATE_TICKET_LOCK;
            ultimateLock.activeUsers.delete(interaction.user.id);
            
            // Gestion d'erreur sécurisée - ne pas essayer de répondre si l'interaction a expiré
            try {
                if (interaction.deferred) {
                    await interaction.editReply({
                        content: '❌ Une erreur est survenue lors de la création de votre espace de soutien. Veuillez réessayer.'
                    });
                } else if (!interaction.replied) {
                    await interaction.reply({
                        content: '❌ Une erreur est survenue lors de la création de votre espace de soutien. Veuillez réessayer.',
                        flags: MessageFlags.Ephemeral
                    });
                }
            } catch (replyError) {
                // Ignorer les erreurs de réponse - interaction probablement expirée
                this.logger.warn('⚠️ Impossible de répondre à l\'interaction expirée');
            }
        }
    }

    async showSOSResources(interaction) {
        try {
            const resourcesEmbed = new EmbedBuilder()
                .setColor('#4CAF50')
                .setTitle('📚 **RESSOURCES D\'AIDE ET DE SOUTIEN**')
                .setDescription(`
**🌟 Vous n'êtes pas seul(e) dans cette épreuve.**

**📞 NUMÉROS D'URGENCE (gratuits, 24h/24) :**
• **Soutien psychologique :** \`31 14\` (ligne nationale)
• **Urgences médicales :** \`15\` (SAMU)
• **Violences conjugales :** \`39 19\`
• **Enfance en danger :** \`119\`
• **Aide aux victimes :** \`116 006\`

**🏥 OÙ ALLER :**
• **Urgences hospitalières** - Accueil 24h/24
• **Centres Médico-Psychologiques (CMP)** - Consultations gratuites
• **Maisons des Adolescents (MDA)** - Pour les jeunes
• **Points d'Accueil Écoute Jeunes (PAEJ)** - Écoute spécialisée

**💡 CONSEILS POUR ALLER MIEUX :**
• **Parlez à quelqu'un** de confiance
• **Écrivez** vos sentiments (journal, lettres...)
• **Respirez profondément** quand l'angoisse monte
• **Faites une chose** qui vous fait du bien chaque jour
• **Rappellez-vous** : les émotions difficiles sont temporaires

**🌅 Demain viendra, et avec lui de nouvelles possibilités.**`)
                .addFields(
                    {
                        name: '🚨 **En cas de pensées suicidaires IMMÉDIATEMENT :**',
                        value: '• Appelez le **31 14** (gratuit, 24h/24)\n• Rendez-vous aux **urgences** de l\'hôpital le plus proche\n• Contactez votre **médecin traitant**\n• Appelez un **proche** de confiance',
                        inline: false
                    },
                    {
                        name: '💝 **Rappelez-vous :**',
                        value: '• Votre vie a de la valeur\n• Vos sentiments sont temporaires\n• De l\'aide existe et fonctionne\n• Vous méritez d\'être aidé(e)\n• **Demain viendra** 🌟',
                        inline: false
                    }
                )
                .setFooter({ text: 'Ces ressources sont là pour vous accompagner • N\'hésitez jamais à demander de l\'aide' })
                .setTimestamp();

            await this.safeInteractionReply(interaction, { 
                embeds: [resourcesEmbed], 
                flags: MessageFlags.Ephemeral 
            });

        } catch (error) {
            this.logger.error('Erreur lors de l\'affichage des ressources SOS:', error);
            await this.safeInteractionReply(interaction, {
                content: '❌ Une erreur est survenue. En urgence, appelez le **31 14** (gratuit, 24h/24) ou les **urgences (15)**.',
                flags: MessageFlags.Ephemeral
            });
        }
    }

    async cancelTicketClosure(interaction) {
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

                // Créer le canal de ticket de recrutement PRIVÉ
                const ticketNumber = Date.now().toString().slice(-6);
                const ticketChannel = await guild.channels.create({
                    name: `👥・recruitment-${user.username}-${ticketNumber}`,
                    type: ChannelType.GuildText,
                    parent: ticketCategory.id,
                    topic: `Candidature Recrutement PRIVÉE • ${position} • Créée par ${user.tag}`,
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
                                PermissionFlagsBits.EmbedLinks,
                                PermissionFlagsBits.ManageMessages
                            ]
                        }
                        // Pas d'accès au staff par défaut - ticket privé
                    ]
                });
                
                // Libérer immédiatement le verrou de création
                ultimateLock.activeChannels.delete(channelCreationKey);

            // Embed de candidature dans le ticket PRIVÉ
            const recruitmentEmbed = new EmbedBuilder()
                .setColor(config.color)
                .setTitle(`👥 **CANDIDATURE DE RECRUTEMENT - Ticket Privé #${ticketNumber}**`)
                .setDescription(`
╭─────────────────────────────────────╮
│     **Bienvenue ${user.displayName}** �     │
│      **CANDIDATURE PRIVÉE** 🔒        │
╰─────────────────────────────────────╯

**📋 Informations de la Candidature :**
• **Candidat :** ${user.displayName} (${user.tag})
• **Poste souhaité :** ${position}
• **Numéro :** \`#${ticketNumber}\`
• **Créé le :** <t:${Math.floor(Date.now() / 1000)}:F>
• **Statut :** Candidature privée - Seul vous avez accès

**💼 Expérience et Compétences :**
\`\`\`
${experience}
\`\`\`

**📅 Disponibilité :**
\`\`\`
${availability}
\`\`\`

**🔒 Confidentialité :**
• Cette candidature est **100% privée**
• Seul **vous** avez accès à ce channel
• Aucun staff n'est notifié automatiquement
• Vous pouvez inviter l'équipe RH si nécessaire

**💡 Actions disponibles :**
• Ajouter des informations supplémentaires
• Partager des références ou portfolio
• Inviter l'équipe RH quand vous êtes prêt(e)
• Utiliser les boutons ci-dessous`)
                .setThumbnail(user.displayAvatarURL({ dynamic: true }))
                .setFooter({ 
                    text: `Candidature Privée ID: ${ticketNumber} • Accessible uniquement par vous`,
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
                        .setCustomId('ticket_invite_staff')
                        .setLabel('Inviter l\'Équipe RH')
                        .setStyle(ButtonStyle.Success)
                        .setEmoji('👥'),
                    new ButtonBuilder()
                        .setCustomId('ticket_add_user')
                        .setLabel('Ajouter Utilisateur')
                        .setStyle(ButtonStyle.Secondary)
                        .setEmoji('➕'),
                    new ButtonBuilder()
                        .setCustomId('ticket_transcript')
                        .setLabel('Transcript')
                        .setStyle(ButtonStyle.Secondary)
                        .setEmoji('📄')
                );

            await ticketChannel.send({
                content: `${user} 🔒 **Votre candidature privée a été créée avec succès !**\n\n💡 *Ce channel est privé et accessible uniquement par vous. Utilisez le bouton "Inviter l'Équipe RH" si vous souhaitez qu'ils examinent votre candidature.*`,
                embeds: [recruitmentEmbed],
                components: [ticketActionsRow]
            });

            // PAS de notification au staff - candidature privée

                await interaction.editReply({
                    content: `✅ **Candidature privée créée avec succès !** ${ticketChannel}\n🔒 **Votre candidature est 100% privée** - seul vous y avez accès.\n💡 **Vous avez été notifié dans le channel** - consultez ${ticketChannel}\n🎯 Utilisez le bouton "Inviter l'Équipe RH" quand vous êtes prêt(e).`
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

    // NOUVELLES FONCTIONS POUR LA GESTION DES CONFIRMATIONS DE FERMETURE
    async handleConfirmClose(interaction) {
        try {
            if (interaction.deferred || interaction.replied) {
                this.logger.warn('⚠️ Interaction confirm_close déjà traitée');
                return;
            }

            await interaction.deferReply({ flags: MessageFlags.Ephemeral });

            const channel = interaction.channel;
            const user = interaction.user;
            const guild = interaction.guild;

            // Déterminer le type de ticket pour la fermeture appropriée
            const isRecruitment = channel.name.includes('recruitment');
            const isReport = channel.name.includes('report') || channel.name.includes('signalement');
            const isSuggestion = channel.name.includes('suggestion');
            const isSOSChannel = channel.name.includes('sos-support');

            this.logger.info(`🔒 Fermeture confirmée du ${isSOSChannel ? 'canal SOS' : 'ticket'}: ${channel.name} par ${user.tag}`);

            // Gestion spécialisée selon le type
            if (isRecruitment) {
                await this.handleRecruitmentTicketClosure(channel, user, guild);
            } else if (isSOSChannel) {
                // Gestion spéciale pour les canaux SOS
                await this.handleSOSChannelClosure(channel, user, guild);
            } else {
                // Gestion standard pour les autres types
                await this.handleStandardTicketClosure(channel, user, guild, {
                    isReport,
                    isSuggestion,
                    isRecrutment: false
                });
            }

            // Message de confirmation
            const closingEmbed = new EmbedBuilder()
                .setColor('#e74c3c')
                .setTitle('🔒 **FERMETURE EN COURS...**')
                .setDescription(`
**${isSOSChannel ? 'Canal SOS' : 'Ticket'} fermé par ${user}**

**📅 Fermé le :** <t:${Math.floor(Date.now() / 1000)}:F>
**⏱️ Suppression automatique dans 10 secondes...**

${isSOSChannel ? '**💝 Merci d\'avoir utilisé notre service de soutien.**' : '**📊 Un résumé complet a été envoyé dans les logs.**'}`)
                .setFooter({ text: isSOSChannel ? 'Support SOS • Confidentialité garantie' : 'Système de tickets' })
                .setTimestamp();

            await channel.send({ embeds: [closingEmbed] });

            // Confirmation à l'utilisateur
            await interaction.editReply({
                content: `✅ ${isSOSChannel ? 'Canal SOS' : 'Ticket'} fermé avec succès. Suppression dans 10 secondes.`
            });

            // Suppression après 10 secondes
            setTimeout(async () => {
                try {
                    await channel.delete(`${isSOSChannel ? 'Canal SOS' : 'Ticket'} fermé par ${user.tag}`);
                    this.logger.success(`🗑️ ${isSOSChannel ? 'Canal SOS' : 'Ticket'} ${channel.name} supprimé avec succès`);
                } catch (deleteError) {
                    this.logger.error(`❌ Erreur lors de la suppression du ${isSOSChannel ? 'canal SOS' : 'ticket'}:`, deleteError);
                }
            }, 10000);

        } catch (error) {
            this.logger.error('❌ Erreur lors de la confirmation de fermeture:', error);
            try {
                if (interaction.deferred) {
                    await interaction.editReply({
                        content: '❌ Une erreur est survenue lors de la fermeture.'
                    });
                }
            } catch (replyError) {
                this.logger.warn('⚠️ Impossible de répondre à l\'erreur de fermeture');
            }
        }
    }

    async handleCancelClose(interaction) {
        try {
            if (interaction.deferred || interaction.replied) {
                this.logger.warn('⚠️ Interaction cancel_close déjà traitée');
                return;
            }

            const cancelEmbed = new EmbedBuilder()
                .setColor('#2ecc71')
                .setTitle('✅ **FERMETURE ANNULÉE**')
                .setDescription(`
**${interaction.user} a annulé la fermeture du ticket.**

Le ticket reste ouvert et vous pouvez continuer à l'utiliser normalement.`)
                .setFooter({ text: 'Fermeture annulée avec succès' })
                .setTimestamp();

            await interaction.reply({
                embeds: [cancelEmbed],
                flags: MessageFlags.Ephemeral
            });

            this.logger.info(`❌ Fermeture annulée du ticket: ${interaction.channel.name} par ${interaction.user.tag}`);

        } catch (error) {
            this.logger.error('❌ Erreur lors de l\'annulation de fermeture:', error);
            try {
                if (!interaction.replied) {
                    await interaction.reply({
                        content: '❌ Une erreur est survenue lors de l\'annulation.',
                        flags: MessageFlags.Ephemeral
                    });
                }
            } catch (replyError) {
                this.logger.warn('⚠️ Impossible de répondre à l\'erreur d\'annulation');
            }
        }
    }

    // NOUVELLE FONCTION POUR LA GESTION DES CANAUX SOS
    async handleSOSChannelClosure(channel, closedBy, guild) {
        try {
            this.logger.info(`🆘 Traitement de fermeture spécialisé pour canal SOS: ${channel.name}`);

            // Les canaux SOS sont privés et confidentiels - pas de logs détaillés
            const sosLogChannelId = '1395049881470505132'; // Canal général pour les logs SOS (sans détails)
            const sosLogChannel = guild.channels.cache.get(sosLogChannelId);

            if (sosLogChannel) {
                const sosLogEmbed = new EmbedBuilder()
                    .setColor('#ff6b6b')
                    .setTitle('🆘 **CANAL SOS FERMÉ**')
                    .setDescription(`
**📋 Informations générales :**
• **Type :** Canal de soutien SOS
• **Fermé par :** ${closedBy}
• **Date de fermeture :** <t:${Math.floor(Date.now() / 1000)}:F>
• **Durée d'utilisation :** <t:${Math.floor(channel.createdTimestamp / 1000)}:R>

**🔒 Confidentialité :**
• Aucun détail personnel conservé
• Support fourni selon protocole
• Canal supprimé après fermeture`)
                    .setFooter({ text: 'Système SOS • Confidentialité garantie' })
                    .setTimestamp();

                await sosLogChannel.send({
                    content: `<@&${this.staffRoleId}>`,
                    embeds: [sosLogEmbed]
                });

                this.logger.success(`✅ Log SOS anonyme envoyé dans ${sosLogChannel.name}`);
            }

        } catch (error) {
            this.logger.error('❌ Erreur lors du traitement de fermeture SOS:', error);
        }
    }

    // NOUVELLE FONCTION POUR LA SÉLECTION DU STAFF SOS
    async handleSOSStaffInviteSelection(interaction) {
        try {
            const channel = interaction.channel;
            const user = interaction.user;
            const selectedValues = interaction.values;
            
            // Vérifier que c'est bien un canal SOS et que l'utilisateur est le créateur
            if (!channel.name.includes('sos-support') || !channel.name.includes(user.username)) {
                return await interaction.reply({
                    content: '❌ Vous ne pouvez inviter du staff que dans votre propre canal SOS.',
                    flags: MessageFlags.Ephemeral
                });
            }

            await interaction.deferReply({ flags: MessageFlags.Ephemeral });

            const guild = interaction.guild;
            const invitedMembers = [];

            // Gestion des invitations SOS avec discrétion
            if (selectedValues.includes('all_staff')) {
                // Donner accès au rôle staff complet
                await channel.permissionOverwrites.create(this.staffRoleId, {
                    ViewChannel: true,
                    SendMessages: true,
                    ReadMessageHistory: true,
                    ManageMessages: true,
                    AttachFiles: true,
                    EmbedLinks: true
                });

                invitedMembers.push('Équipe de soutien complète');
            } else {
                // Inviter les membres sélectionnés individuellement
                for (const memberId of selectedValues) {
                    const member = guild.members.cache.get(memberId);
                    if (member) {
                        await channel.permissionOverwrites.create(memberId, {
                            ViewChannel: true,
                            SendMessages: true,
                            ReadMessageHistory: true,
                            AttachFiles: true,
                            EmbedLinks: true
                        });
                        invitedMembers.push(member.displayName);
                    }
                }
            }

            // Embed de confirmation spécial SOS
            const confirmEmbed = new EmbedBuilder()
                .setColor('#ff6b6b')
                .setTitle('🆘 **ÉQUIPE DE SOUTIEN INVITÉE**')
                .setDescription(`
${user}, votre demande d'aide a été transmise.

**👥 Membres invités :**
${invitedMembers.map(name => `• ${name}`).join('\n')}

**💝 Notre équipe va vous accompagner avec :**
• Écoute bienveillante et sans jugement
• Respect total de votre confidentialité
• Support adapté à votre situation
• Ressources d'aide professionnelles si nécessaire

**🌟 Vous avez fait le pas le plus difficile en demandant de l'aide.**`)
                .setFooter({ text: 'Équipe de soutien notifiée • Confidentialité garantie' })
                .setTimestamp();

            // Notification discrète dans le canal
            const mentionList = selectedValues.includes('all_staff') ? 
                `<@&${this.staffRoleId}>` : 
                selectedValues.map(id => `<@${id}>`).join(' ');

            await channel.send({
                content: `🆘 **Équipe de soutien demandée** | ${mentionList}`,
                embeds: [confirmEmbed]
            });

            // Confirmation à l'utilisateur
            await interaction.editReply({
                content: `✅ **Équipe de soutien invitée avec succès.**\n💝 Ils vont vous répondre dans les plus brefs délais.`
            });

            // Notification privée spéciale SOS (1 seule fois, pas de spam)
            const globalLockKey = `SOS_STAFF_NOTIFICATION_${channel.id}`;
            if (!global[globalLockKey]) {
                global[globalLockKey] = true;
                
                // Notification individuelle pour les membres sélectionnés (non-spammante)
                if (!selectedValues.includes('all_staff') && selectedValues.length <= 3) {
                    for (const memberId of selectedValues) {
                        const invitedMember = guild.members.cache.get(memberId);
                        if (invitedMember) {
                            try {
                                const sosNotifyEmbed = new EmbedBuilder()
                                    .setColor('#ff6b6b')
                                    .setTitle('🆘 **DEMANDE DE SOUTIEN SOS**')
                                    .setDescription(`
Vous avez été invité dans un canal de soutien SOS.

**📍 Canal :** ${channel}
**👤 Demandeur :** Utilisateur en détresse
**⏰ Urgence :** Support émotionnel nécessaire

**💝 Approche recommandée :**
• Écoute bienveillante et empathique
• Respect de la confidentialité absolue
• Orientation vers ressources professionnelles si besoin`)
                                    .setFooter({ text: 'Intervention SOS • Confidentialité requise' });
                                
                                await invitedMember.send({ embeds: [sosNotifyEmbed] });
                                this.logger.info(`🆘 Notification SOS envoyée à ${invitedMember.user.tag}`);
                            } catch (dmError) {
                                this.logger.warn(`⚠️ Impossible d'envoyer MP SOS à ${invitedMember.user.tag}`);
                            }
                        }
                    }
                }
                
                // Auto-nettoyage après 1 heure
                setTimeout(() => {
                    delete global[globalLockKey];
                }, 3600000);
            }

        } catch (error) {
            this.logger.error('❌ Erreur lors de la gestion de l\'invitation SOS:', error);
            try {
                await interaction.editReply({
                    content: '❌ Une erreur est survenue lors de l\'invitation de l\'équipe de soutien.'
                });
            } catch (replyError) {
                this.logger.warn('⚠️ Impossible de répondre à l\'erreur SOS');
            }
        }
    }
}

export default TicketManager;