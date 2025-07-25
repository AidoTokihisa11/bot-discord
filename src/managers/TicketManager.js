import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionFlagsBits, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, MessageFlags } from 'discord.js';
import Database from '../utils/Database.js';
import Logger from '../utils/Logger.js';

class TicketManager {
    constructor(client) {
        this.client = client;
        this.db = new Database();
        this.logger = new Logger();
        this.staffRoleId = '1386784012269387946';
        this.ticketChannelId = '1368921898867621908';
        this.ticketCategoryId = null; // Sera défini dynamiquement
        
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
                name: 'Suggestion',
                emoji: '💡',
                color: '#f39c12',
                description: 'Idées d\'amélioration',
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
            if (error.code === 'InteractionAlreadyReplied') {
                this.logger.warn('⚠️ Interaction déjà répondue lors de safeInteractionReply');
                return false;
            }
            
            if (error.code === 10062) {
                this.logger.warn('⏰ Interaction expirée lors de safeInteractionReply');
                return false;
            }
            
            this.logger.error('Erreur lors de safeInteractionReply:', error);
            throw error;
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
                        .setLabel('Suggestion')
                        .setStyle(ButtonStyle.Secondary)
                        .setEmoji('💡'),
                    new ButtonBuilder()
                        .setCustomId('ticket_appeal')
                        .setLabel('Appel de Sanction')
                        .setStyle(ButtonStyle.Secondary)
                        .setEmoji('⚖️')
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
                        .setCustomId('ticket_contact_staff')
                        .setLabel('Contact Direct')
                        .setStyle(ButtonStyle.Secondary)
                        .setEmoji('📞')
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
        const startTime = Date.now();
        const maxProcessingTime = 2500; // 2.5 secondes max avant expiration
        
        try {
            // Vérification ultra-rapide d'état pour TOUS les types
            if (interaction.replied || interaction.deferred) {
                this.logger.warn(`⚠️ Interaction ${type} déjà traitée`);
                return;
            }

            // Protection supplémentaire contre les doublons
            const interactionKey = `${interaction.id}_${type}`;
            if (!this.processingInteractions) {
                this.processingInteractions = new Set();
            }
            
            if (this.processingInteractions.has(interactionKey)) {
                this.logger.warn(`🔄 Traitement dupliqué détecté pour ${type}: ${interaction.id}`);
                return;
            }
            
            this.processingInteractions.add(interactionKey);
            
            // Nettoyer après 10 secondes
            setTimeout(() => {
                this.processingInteractions.delete(interactionKey);
            }, 10000);

            // TRAITEMENT SPÉCIAL POUR SUGGESTIONS - MODAL IMMÉDIAT
            if (type === 'suggestion') {
                // Vérification de timing
                const elapsed = Date.now() - startTime;
                if (elapsed > maxProcessingTime) {
                    this.logger.warn(`⏰ Traitement ${type} trop lent (${elapsed}ms), abandon`);
                    return;
                }
                
                // Modal IMMÉDIAT - aucun autre traitement avant
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

                // AFFICHAGE IMMÉDIAT avec gestion d'erreur renforcée
                try {
                    await interaction.showModal(suggestionModal);
                    const totalTime = Date.now() - startTime;
                    this.logger.info(`✅ Modal suggestion affiché en ${totalTime}ms pour ${interaction.user.username}`);
                } catch (error) {
                    if (error.code === 10062) {
                        this.logger.warn('⏰ Interaction suggestion expirée lors de showModal');
                        return;
                    }
                    throw error;
                }
                return;
            }

            // Pour les autres types : Vérification de timing
            const elapsed = Date.now() - startTime;
            if (elapsed > maxProcessingTime) {
                this.logger.warn(`⏰ Traitement ${type} trop lent (${elapsed}ms), abandon`);
                return;
            }

            // Configuration du modal IMMÉDIATEMENT
            const config = this.ticketTypes[type];
            if (!config) {
                // Réponse rapide pour erreur de type
                try {
                    await interaction.reply({
                        content: '❌ Type de ticket invalide.',
                        flags: MessageFlags.Ephemeral
                    });
                } catch (error) {
                    this.logger.warn(`⚠️ Erreur reply type invalide: ${error.code}`);
                }
                return;
            }

            // Modal IMMÉDIAT pour tous les autres types (pas de vérifications qui ralentissent)
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

            // AFFICHAGE IMMÉDIAT du modal (priorité absolue)
            // Vérification finale juste avant showModal
            if (interaction.replied || interaction.deferred) {
                this.logger.warn(`⚠️ Interaction ${type} déjà acquittée juste avant showModal`);
                return;
            }
            
            try {
                await interaction.showModal(modal);
                const totalTime = Date.now() - startTime;
                this.logger.info(`✅ Modal ${type} affiché en ${totalTime}ms pour ${interaction.user.username}`);
            } catch (error) {
                if (error.code === 10062) {
                    this.logger.warn(`⏰ Interaction ${type} expirée lors de showModal`);
                    return;
                }
                if (error.code === 40060) {
                    this.logger.warn(`⚠️ Interaction ${type} déjà acquittée lors de showModal`);
                    return;
                }
                if (error.code === 'InteractionAlreadyReplied') {
                    this.logger.warn(`⚠️ Interaction ${type} déjà répondue lors de showModal`);
                    return;
                }
                this.logger.error(`❌ Erreur showModal ${type}:`, error);
                return;
            }

        } catch (error) {
            // Gestion d'erreur simplifiée
            this.logger.error(`Erreur lors de la création du ticket ${type}:`, error);
        }
    }

    // MÉTHODE DÉPRÉCIÉE - INTÉGRÉE DANS handleTicketCreation
    // async handleSuggestionCreation(interaction) {
    //     // Cette méthode a été déplacée directement dans handleTicketCreation
    //     // pour éviter les timeouts Discord
    // }

    async handleModalSubmit(interaction) {
        try {
            const [, , type] = interaction.customId.split('_');
            const config = this.ticketTypes[type];
            const guild = interaction.guild;
            const user = interaction.user;

            const subject = interaction.fields.getTextInputValue('ticket_subject');
            const description = interaction.fields.getTextInputValue('ticket_description');
            const priority = interaction.fields.getTextInputValue('ticket_priority') || '3';

            // Utiliser le validateur d'interactions pour une déférence rapide
            const validator = interaction.client.interactionValidator;
            const deferred = await validator.quickDefer(interaction, { flags: MessageFlags.Ephemeral });
            
            if (!deferred) {
                return; // Interaction expirée ou déjà traitée
            }

            // Vérifier si l'utilisateur a déjà un ticket ouvert APRÈS le modal
            const existingTickets = guild.channels.cache.filter(
                channel => channel.name.includes(user.id) && channel.name.includes('ticket')
            );

            if (existingTickets.size > 0) {
                return await interaction.editReply({
                    content: `❌ Vous avez déjà un ticket ouvert : ${existingTickets.first()}\n\n💡 Veuillez fermer votre ticket existant avant d'en créer un nouveau.`
                });
            }

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
                content: `${user} | <@&${this.staffRoleId}>`,
                embeds: [welcomeEmbed],
                components: [ticketActionsRow]
            });

            // Notification privée au staff
            await this.notifyStaff(guild, user, ticketChannel, config, subject, description, priority);

            await interaction.editReply({
                content: `✅ **Ticket créé avec succès !** ${ticketChannel}\n🎯 Notre équipe a été notifiée et vous répondra dans **${config.responseTime}**.`
            });

            this.logger.info(`Ticket #${ticketNumber} créé: ${ticketChannel.name} par ${user.tag} (${type})`);

        } catch (error) {
            this.logger.error('Erreur lors du traitement du modal:', error);
            await interaction.editReply({
                content: '❌ Une erreur est survenue lors de la création du ticket.'
            });
        }
    }

    async notifyStaff(guild, user, ticketChannel, config, subject, description, priority) {
        try {
            const staffRole = guild.roles.cache.get(this.staffRoleId);
            if (!staffRole) return;

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

            // Envoyer en MP à chaque membre du staff
            for (const [id, member] of staffMembers) {
                try {
                    await member.send({ embeds: [notificationEmbed] });
                } catch (error) {
                    // Ignorer si on ne peut pas envoyer de MP
                }
            }

        } catch (error) {
            this.logger.error('Erreur lors de la notification du staff:', error);
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

            await interaction.reply({
                embeds: [confirmEmbed],
                components: [confirmRow],
                flags: MessageFlags.Ephemeral
            });

        } catch (error) {
            this.logger.error('Erreur lors de la fermeture du ticket:', error);
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

            await this.safeInteractionReply(interaction, { embeds: [claimEmbed] });

        } catch (error) {
            this.logger.error('Erreur lors de la prise en charge:', error);
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

            await interaction.update({
                embeds: [closingEmbed],
                components: []
            });

            // Envoyer le feedback complet dans le canal de logs
            await this.sendTicketFeedback(channel, interaction.user, guild);

            // Supprimer le canal après 10 secondes
            setTimeout(async () => {
                try {
                    await channel.delete('Ticket fermé');
                } catch (error) {
                    this.logger.error('Erreur lors de la suppression du canal:', error);
                }
            }, 10000);

        } catch (error) {
            this.logger.error('Erreur lors de la fermeture confirmée:', error);
        }
    }

    async handleCancelClose(interaction) {
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

        await interaction.update({
            embeds: [cancelEmbed],
            components: []
        });
    }

    // Fonction pour envoyer le feedback complet du ticket
    async sendTicketFeedback(channel, closedBy, guild) {
        try {
            // Détecter le type de ticket à partir du nom du canal
            const channelName = channel.name.toLowerCase();
            const isReportTicket = channelName.includes('report') || channelName.includes('signalement');
            
            // Choisir le canal de destination selon le type de ticket
            let feedbackChannelId;
            if (isReportTicket) {
                feedbackChannelId = '1395049881470505132'; // Canal spécifique pour les signalements
            } else {
                feedbackChannelId = '1393143271617855548'; // Canal général pour les autres tickets
            }
            
            const feedbackChannel = guild.channels.cache.get(feedbackChannelId);
            
            if (!feedbackChannel) {
                this.logger.error(`Canal de feedback introuvable: ${feedbackChannelId}`);
                return;
            }

            // Récupérer les messages du canal pour créer un historique
            const messages = await channel.messages.fetch({ limit: 100 });
            const messageHistory = messages.reverse().map(msg => {
                const timestamp = msg.createdAt.toLocaleString('fr-FR');
                return `**[${timestamp}] ${msg.author.tag}:** ${msg.content || '*[Embed ou fichier joint]*'}`;
            }).join('\n');

            // Créer l'embed de feedback avec style différent pour les signalements
            const embedColor = isReportTicket ? '#e74c3c' : '#2c3e50'; // Rouge pour signalements, gris pour autres
            const embedTitle = isReportTicket ? '🚨 **SIGNALEMENT FERMÉ - FEEDBACK COMPLET**' : '🎫 **TICKET FERMÉ - FEEDBACK COMPLET**';
            
            const feedbackEmbed = new EmbedBuilder()
                .setColor(embedColor)
                .setTitle(embedTitle)
                .setDescription(`
**📋 INFORMATIONS DU TICKET :**
• **Canal :** ${channel.name}
• **Type :** ${isReportTicket ? '🚨 Signalement' : '🎫 Ticket Standard'}
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
                    text: `${isReportTicket ? 'Signalement' : 'Ticket'} ID: ${channel.id} • Système de Support`,
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

            // Ajouter un champ spécial pour les signalements
            if (isReportTicket) {
                feedbackEmbed.addFields({
                    name: '⚠️ **STATUT DU SIGNALEMENT**',
                    value: '🔍 **Traité** - Ce signalement a été examiné et fermé par l\'équipe de modération.',
                    inline: false
                });
            }

            await feedbackChannel.send({
                embeds: [feedbackEmbed]
            });

            const ticketType = isReportTicket ? 'signalement' : 'ticket';
            this.logger.success(`Feedback du ${ticketType} ${channel.name} envoyé dans le canal de logs approprié`);

        } catch (error) {
            this.logger.error('Erreur lors de l\'envoi du feedback:', error);
        }
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
            const notificationChannelId = '1368933588976013392';
            
            // Récupérer les informations de la suggestion depuis le nom du canal
            const suggestionInfo = this.extractSuggestionInfo(channel);
            
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

            // Embed pour le canal de suggestion
            const closingEmbed = new EmbedBuilder()
                .setColor(statusColors[status])
                .setTitle(`${statusEmojis[status]} **SUGGESTION ${statusTexts[status]}**`)
                .setDescription(`
**Cette suggestion a été ${statusTexts[status].toLowerCase()} par ${interaction.user}**

**📅 Date :** <t:${Math.floor(Date.now() / 1000)}:F>
**👤 Traité par :** ${interaction.user}
**🎯 Statut final :** ${statusTexts[status]}

${status === 'approved' ? 
    '**🎉 Cette suggestion sera prise en compte dans nos développements futurs !**' : 
    ''}
${status === 'considered' ? 
    '**🤔 Cette suggestion est intéressante et sera étudiée plus en détail.**' : 
    ''}
${status === 'rejected' ? 
    '**❌ Cette suggestion ne peut pas être implementée pour le moment.**' : 
    ''}
${status === 'closed' ? 
    '**🔒 Cette suggestion a été fermée.**' : 
    ''}

**💾 Ce canal sera fermé dans 10 secondes...**`)
                .setFooter({ text: `Suggestion ${statusTexts[status].toLowerCase()}` })
                .setTimestamp();

            await channel.send({ embeds: [closingEmbed] });

            // Notification dans le salon spécifié pour les suggestions approuvées ou rejetées
            if (status === 'approved' || status === 'rejected') {
                try {
                    const notificationChannel = guild.channels.cache.get(notificationChannelId);
                    if (notificationChannel) {
                        const notificationEmbed = new EmbedBuilder()
                            .setColor(statusColors[status])
                            .setTitle(`${statusEmojis[status]} Suggestion ${statusTexts[status]}`)
                            .setDescription(`
**📝 Suggestion :** ${suggestionInfo.title || 'Titre non trouvé'}
**👤 Auteur :** ${suggestionInfo.author || 'Auteur non trouvé'}
**👨‍💼 Traité par :** ${interaction.user}
**📅 Date :** <t:${Math.floor(Date.now() / 1000)}:F>

${status === 'approved' ? 
    '**🎉 Cette suggestion a été approuvée et sera prise en compte dans nos développements futurs !**' : 
    '**❌ Cette suggestion a été rejetée après étude.**'}
                            `)
                            .setFooter({ text: `Système de suggestions • ${guild.name}` })
                            .setTimestamp();

                        await notificationChannel.send({ embeds: [notificationEmbed] });
                        this.logger.info(`📢 Notification envoyée dans le salon ${notificationChannelId} pour suggestion ${status}`);
                    } else {
                        this.logger.warn(`⚠️ Canal de notification ${notificationChannelId} non trouvé`);
                    }
                } catch (notificationError) {
                    this.logger.error('Erreur lors de l\'envoi de la notification:', notificationError);
                }
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
}

export default TicketManager;
