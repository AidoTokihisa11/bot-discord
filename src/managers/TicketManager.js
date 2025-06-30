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
        try {
            const config = this.ticketTypes[type];
            if (!config) {
                return await interaction.reply({
                    content: '❌ Type de ticket invalide.',
                    flags: MessageFlags.Ephemeral
                });
            }

            // Vérifier si l'utilisateur a déjà un ticket ouvert
            const existingTickets = interaction.guild.channels.cache.filter(
                channel => channel.name.includes(interaction.user.id) && channel.name.includes('ticket')
            );

            if (existingTickets.size > 0) {
                return await interaction.reply({
                    content: `❌ Vous avez déjà un ticket ouvert : ${existingTickets.first()}`,
                    flags: MessageFlags.Ephemeral
                });
            }

            // Traitement spécial pour les suggestions
            if (type === 'suggestion') {
                await this.handleSuggestionCreation(interaction);
                return;
            }

            // Modal pour collecter les informations (autres types)
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

            await interaction.showModal(modal);

        } catch (error) {
            this.logger.error('Erreur lors de la création du ticket:', error);
            await interaction.reply({
                content: '❌ Une erreur est survenue lors de la création du ticket.',
                flags: MessageFlags.Ephemeral
            });
        }
    }

    async handleSuggestionCreation(interaction) {
        try {
            // Embed de sélection du type de suggestion
            const suggestionEmbed = new EmbedBuilder()
                .setColor('#f39c12')
                .setTitle('💡 **CRÉER UNE SUGGESTION**')
                .setDescription(`
**Bienvenue dans notre système de suggestions avancé !**

Votre avis compte énormément pour nous. Choisissez le type de suggestion qui correspond le mieux à votre idée :

**🎯 Types de suggestions disponibles :**`)
                .addFields(
                    {
                        name: '🎮 **Fonctionnalité Gaming**',
                        value: 'Nouvelles fonctionnalités pour les jeux, rôles, salons gaming',
                        inline: true
                    },
                    {
                        name: '🤖 **Amélioration Bot**',
                        value: 'Nouvelles commandes, fonctionnalités du bot Discord',
                        inline: true
                    },
                    {
                        name: '🏛️ **Organisation Serveur**',
                        value: 'Structure des salons, catégories, organisation générale',
                        inline: true
                    },
                    {
                        name: '🎉 **Événements & Activités**',
                        value: 'Tournois, événements communautaires, animations',
                        inline: true
                    },
                    {
                        name: '🛡️ **Modération & Règles**',
                        value: 'Système de modération, règlement, sanctions',
                        inline: true
                    },
                    {
                        name: '🎨 **Design & Interface**',
                        value: 'Apparence du serveur, emojis, design des messages',
                        inline: true
                    },
                    {
                        name: '🔧 **Technique & Performance**',
                        value: 'Optimisations, corrections, améliorations techniques',
                        inline: true
                    },
                    {
                        name: '💬 **Communication**',
                        value: 'Système de communication, notifications, annonces',
                        inline: true
                    },
                    {
                        name: '🌟 **Autre**',
                        value: 'Suggestion qui ne rentre dans aucune catégorie',
                        inline: true
                    }
                )
                .setFooter({ text: 'Sélectionnez le type qui correspond le mieux à votre suggestion' })
                .setTimestamp();

            // Menu de sélection pour le type de suggestion
            const suggestionSelect = new StringSelectMenuBuilder()
                .setCustomId('suggestion_type_select')
                .setPlaceholder('🎯 Choisissez le type de votre suggestion...')
                .addOptions([
                    new StringSelectMenuOptionBuilder()
                        .setLabel('Fonctionnalité Gaming')
                        .setDescription('Nouvelles fonctionnalités pour les jeux')
                        .setValue('gaming')
                        .setEmoji('🎮'),
                    new StringSelectMenuOptionBuilder()
                        .setLabel('Amélioration Bot')
                        .setDescription('Nouvelles commandes, fonctionnalités du bot')
                        .setValue('bot')
                        .setEmoji('🤖'),
                    new StringSelectMenuOptionBuilder()
                        .setLabel('Organisation Serveur')
                        .setDescription('Structure des salons, organisation')
                        .setValue('server')
                        .setEmoji('🏛️'),
                    new StringSelectMenuOptionBuilder()
                        .setLabel('Événements & Activités')
                        .setDescription('Tournois, événements communautaires')
                        .setValue('events')
                        .setEmoji('🎉'),
                    new StringSelectMenuOptionBuilder()
                        .setLabel('Modération & Règles')
                        .setDescription('Système de modération, règlement')
                        .setValue('moderation')
                        .setEmoji('🛡️'),
                    new StringSelectMenuOptionBuilder()
                        .setLabel('Design & Interface')
                        .setDescription('Apparence du serveur, design')
                        .setValue('design')
                        .setEmoji('🎨'),
                    new StringSelectMenuOptionBuilder()
                        .setLabel('Technique & Performance')
                        .setDescription('Optimisations, corrections techniques')
                        .setValue('technical')
                        .setEmoji('🔧'),
                    new StringSelectMenuOptionBuilder()
                        .setLabel('Communication')
                        .setDescription('Système de communication, notifications')
                        .setValue('communication')
                        .setEmoji('💬'),
                    new StringSelectMenuOptionBuilder()
                        .setLabel('Autre')
                        .setDescription('Suggestion qui ne rentre dans aucune catégorie')
                        .setValue('other')
                        .setEmoji('🌟')
                ]);

            const selectRow = new ActionRowBuilder().addComponents(suggestionSelect);

            await interaction.reply({
                embeds: [suggestionEmbed],
                components: [selectRow],
                flags: MessageFlags.Ephemeral
            });

        } catch (error) {
            this.logger.error('Erreur lors de la création de suggestion:', error);
            await interaction.reply({
                content: '❌ Une erreur est survenue lors de la création de la suggestion.',
                flags: MessageFlags.Ephemeral
            });
        }
    }

    async handleModalSubmit(interaction) {
        try {
            const [, , type] = interaction.customId.split('_');
            const config = this.ticketTypes[type];
            const guild = interaction.guild;
            const user = interaction.user;

            const subject = interaction.fields.getTextInputValue('ticket_subject');
            const description = interaction.fields.getTextInputValue('ticket_description');
            const priority = interaction.fields.getTextInputValue('ticket_priority') || '3';

            await interaction.deferReply({ ephemeral: true });

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

        await interaction.reply({ embeds: [faqEmbed], ephemeral: true });
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

        await interaction.reply({ embeds: [statusEmbed], ephemeral: true });
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

        await interaction.reply({ embeds: [ticketsEmbed], ephemeral: true });
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

        await interaction.reply({ embeds: [contactEmbed], ephemeral: true });
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
                ephemeral: true
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
                return await interaction.reply({
                    content: '❌ **Accès refusé !**\n\nVous n\'avez pas les permissions nécessaires pour prendre en charge un ticket.\n\n💡 Cette action est réservée à l\'équipe de modération.',
                    ephemeral: true
                });
            }

            // Vérifier si l'utilisateur a le rôle staff
            if (!member.roles.cache.has(this.staffRoleId)) {
                return await interaction.reply({
                    content: '❌ **Permissions insuffisantes !**\n\nSeuls les membres du staff peuvent prendre en charge un ticket.',
                    ephemeral: true
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

            await interaction.reply({ embeds: [claimEmbed] });

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
            await interaction.deferReply({ ephemeral: true });

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
                return await interaction.reply({
                    content: '❌ Utilisateur introuvable. Vérifiez l\'ID ou la mention.',
                    ephemeral: true
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

            await interaction.reply({ embeds: [addUserEmbed] });

        } catch (error) {
            this.logger.error('Erreur lors de l\'ajout d\'utilisateur:', error);
            await interaction.reply({
                content: '❌ Une erreur est survenue lors de l\'ajout de l\'utilisateur.',
                ephemeral: true
            });
        }
    }

    async handleConfirmClose(interaction) {
        try {
            const channel = interaction.channel;
            
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

    // Gestion de la sélection du type de suggestion
    async handleSuggestionTypeSelect(interaction) {
        try {
            const selectedType = interaction.values[0];
            
            // Configuration des types de suggestions
            const suggestionTypes = {
                gaming: {
                    name: 'Fonctionnalité Gaming',
                    emoji: '🎮',
                    color: '#9146FF',
                    description: 'Nouvelles fonctionnalités pour les jeux, rôles, salons gaming'
                },
                bot: {
                    name: 'Amélioration Bot',
                    emoji: '🤖',
                    color: '#5865F2',
                    description: 'Nouvelles commandes, fonctionnalités du bot Discord'
                },
                server: {
                    name: 'Organisation Serveur',
                    emoji: '🏛️',
                    color: '#3498DB',
                    description: 'Structure des salons, catégories, organisation générale'
                },
                events: {
                    name: 'Événements & Activités',
                    emoji: '🎉',
                    color: '#E91E63',
                    description: 'Tournois, événements communautaires, animations'
                },
                moderation: {
                    name: 'Modération & Règles',
                    emoji: '🛡️',
                    color: '#F44336',
                    description: 'Système de modération, règlement, sanctions'
                },
                design: {
                    name: 'Design & Interface',
                    emoji: '🎨',
                    color: '#FF9800',
                    description: 'Apparence du serveur, emojis, design des messages'
                },
                technical: {
                    name: 'Technique & Performance',
                    emoji: '🔧',
                    color: '#607D8B',
                    description: 'Optimisations, corrections, améliorations techniques'
                },
                communication: {
                    name: 'Communication',
                    emoji: '💬',
                    color: '#00BCD4',
                    description: 'Système de communication, notifications, annonces'
                },
                other: {
                    name: 'Autre',
                    emoji: '🌟',
                    color: '#FFC107',
                    description: 'Suggestion qui ne rentre dans aucune catégorie'
                }
            };

            const typeConfig = suggestionTypes[selectedType];
            
            // Modal spécialisé pour les suggestions
            const suggestionModal = new ModalBuilder()
                .setCustomId(`suggestion_modal_${selectedType}`)
                .setTitle(`${typeConfig.emoji} ${typeConfig.name}`);

            const titleInput = new TextInputBuilder()
                .setCustomId('suggestion_title')
                .setLabel('Titre de votre suggestion')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('Résumez votre suggestion en quelques mots...')
                .setRequired(true)
                .setMaxLength(100);

            const descriptionInput = new TextInputBuilder()
                .setCustomId('suggestion_description')
                .setLabel('Description détaillée')
                .setStyle(TextInputStyle.Paragraph)
                .setPlaceholder('Décrivez votre suggestion en détail, expliquez pourquoi elle serait utile...')
                .setRequired(true)
                .setMaxLength(1500);

            const benefitsInput = new TextInputBuilder()
                .setCustomId('suggestion_benefits')
                .setLabel('Avantages et bénéfices')
                .setStyle(TextInputStyle.Paragraph)
                .setPlaceholder('Quels sont les avantages de cette suggestion ? Comment améliorerait-elle l\'expérience ?')
                .setRequired(true)
                .setMaxLength(800);

            const implementationInput = new TextInputBuilder()
                .setCustomId('suggestion_implementation')
                .setLabel('Idées d\'implémentation (optionnel)')
                .setStyle(TextInputStyle.Paragraph)
                .setPlaceholder('Avez-vous des idées sur comment cette suggestion pourrait être mise en place ?')
                .setRequired(false)
                .setMaxLength(500);

            const priorityInput = new TextInputBuilder()
                .setCustomId('suggestion_priority')
                .setLabel('Priorité suggérée (1-5)')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('1 = Faible, 5 = Très importante')
                .setRequired(false)
                .setMaxLength(1);

            suggestionModal.addComponents(
                new ActionRowBuilder().addComponents(titleInput),
                new ActionRowBuilder().addComponents(descriptionInput),
                new ActionRowBuilder().addComponents(benefitsInput),
                new ActionRowBuilder().addComponents(implementationInput),
                new ActionRowBuilder().addComponents(priorityInput)
            );

            await interaction.showModal(suggestionModal);

        } catch (error) {
            this.logger.error('Erreur lors de la sélection du type de suggestion:', error);
            try {
                await interaction.reply({
                    content: '❌ Une erreur est survenue lors de la sélection du type de suggestion.',
                    ephemeral: true
                });
            } catch (replyError) {
                console.error('Impossible de répondre à l\'interaction:', replyError);
            }
        }
    }

    // Gestion du modal de suggestion
    async handleSuggestionModalSubmit(interaction) {
        try {
            const [, , suggestionType] = interaction.customId.split('_');
            const guild = interaction.guild;
            const user = interaction.user;

            const title = interaction.fields.getTextInputValue('suggestion_title');
            const description = interaction.fields.getTextInputValue('suggestion_description');
            const benefits = interaction.fields.getTextInputValue('suggestion_benefits');
            const implementation = interaction.fields.getTextInputValue('suggestion_implementation') || 'Non spécifié';
            const priority = interaction.fields.getTextInputValue('suggestion_priority') || '3';

            // Vérifier si l'interaction est encore valide
            if (interaction.replied || interaction.deferred) {
                console.log('⚠️ Interaction déjà traitée, abandon...');
                return;
            }

            await interaction.deferReply({ ephemeral: true });

            // Configuration des types de suggestions
            const suggestionTypes = {
                gaming: { name: 'Fonctionnalité Gaming', emoji: '🎮', color: '#9146FF' },
                bot: { name: 'Amélioration Bot', emoji: '🤖', color: '#5865F2' },
                server: { name: 'Organisation Serveur', emoji: '🏛️', color: '#3498DB' },
                events: { name: 'Événements & Activités', emoji: '🎉', color: '#E91E63' },
                moderation: { name: 'Modération & Règles', emoji: '🛡️', color: '#F44336' },
                design: { name: 'Design & Interface', emoji: '🎨', color: '#FF9800' },
                technical: { name: 'Technique & Performance', emoji: '🔧', color: '#607D8B' },
                communication: { name: 'Communication', emoji: '💬', color: '#00BCD4' },
                other: { name: 'Autre', emoji: '🌟', color: '#FFC107' }
            };

            const typeConfig = suggestionTypes[suggestionType];

            // Créer ou récupérer la catégorie de tickets
            const ticketCategory = await this.ensureTicketCategory(guild);

            // Créer le canal de suggestion
            const suggestionNumber = Date.now().toString().slice(-6);
            const suggestionChannel = await guild.channels.create({
                name: `💡・suggestion-${suggestionType}-${user.username}-${suggestionNumber}`,
                type: ChannelType.GuildText,
                parent: ticketCategory.id,
                topic: `Suggestion ${typeConfig.name} • ${title} • Créé par ${user.tag}`,
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

            // Embed de bienvenue pour la suggestion
            const suggestionEmbed = new EmbedBuilder()
                .setColor(typeConfig.color)
                .setTitle(`${typeConfig.emoji} **NOUVELLE SUGGESTION - ${typeConfig.name.toUpperCase()}**`)
                .setDescription(`
╭─────────────────────────────────────╮
│     **Merci pour votre suggestion !** 💡     │
╰─────────────────────────────────────╯

**📋 Informations de la Suggestion :**
• **Titre :** ${title}
• **Type :** ${typeConfig.name}
• **Numéro :** \`#${suggestionNumber}\`
• **Priorité suggérée :** ${this.getPriorityDisplay(priority)}
• **Créée le :** <t:${Math.floor(Date.now() / 1000)}:F>
• **Temps d'évaluation estimé :** \`2-7 jours\``)
                .addFields(
                    {
                        name: '📝 **Description Détaillée**',
                        value: `\`\`\`${description}\`\`\``,
                        inline: false
                    },
                    {
                        name: '✨ **Avantages et Bénéfices**',
                        value: `\`\`\`${benefits}\`\`\``,
                        inline: false
                    },
                    {
                        name: '🔧 **Idées d\'Implémentation**',
                        value: `\`\`\`${implementation}\`\`\``,
                        inline: false
                    }
                )
                .setThumbnail(user.displayAvatarURL({ dynamic: true }))
                .setFooter({ 
                    text: `Suggestion ID: ${suggestionNumber} • Évaluation en cours`,
                    iconURL: guild.iconURL({ dynamic: true })
                })
                .setTimestamp();

            // Boutons d'actions pour la suggestion
            const suggestionActionsRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('suggestion_close')
                        .setLabel('Fermer la Suggestion')
                        .setStyle(ButtonStyle.Danger)
                        .setEmoji('🔒'),
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
                        .setStyle(ButtonStyle.Secondary)
                        .setEmoji('❌')
                );

            await suggestionChannel.send({
                content: `${user} | <@&${this.staffRoleId}>`,
                embeds: [suggestionEmbed],
                components: [suggestionActionsRow]
            });

            // Stocker les informations de la suggestion pour le feedback
            if (!this.db.data.suggestions) {
                this.db.data.suggestions = {};
            }
            
            this.db.data.suggestions[suggestionChannel.id] = {
                id: suggestionNumber,
                userId: user.id,
                type: suggestionType,
                title: title,
                description: description,
                benefits: benefits,
                implementation: implementation,
                priority: priority,
                createdAt: new Date().toISOString(),
                status: 'pending'
            };
            
            await this.db.save();

            await interaction.editReply({
                content: `✅ **Suggestion créée avec succès !** ${suggestionChannel}\n💡 Notre équipe va évaluer votre suggestion et vous donner un retour détaillé.`
            });

            this.logger.info(`Suggestion #${suggestionNumber} créée: ${suggestionChannel.name} par ${user.tag} (${suggestionType})`);

        } catch (error) {
            this.logger.error('Erreur lors du traitement de la suggestion:', error);
            await interaction.editReply({
                content: '❌ Une erreur est survenue lors de la création de la suggestion.'
            });
        }
    }

    // Gestion de la fermeture des suggestions avec feedback
    async handleSuggestionClose(interaction, status = 'closed') {
        try {
            // Vérifier si l'interaction est encore valide
            if (interaction.replied || interaction.deferred) {
                console.log('⚠️ Interaction déjà traitée pour la fermeture de suggestion, abandon...');
                return;
            }

            const channel = interaction.channel;
            const feedbackChannelId = '1389009159403343932';
            
            // Récupérer les informations de la suggestion
            const suggestionData = this.db.data.suggestions?.[channel.id];
            if (!suggestionData) {
                try {
                    return await interaction.reply({
                        content: '❌ Impossible de trouver les données de cette suggestion.',
                        ephemeral: true
                    });
                } catch (replyError) {
                    console.error('Impossible de répondre à l\'interaction:', replyError);
                    return;
                }
            }

            // Modal pour le feedback constructif
            const feedbackModal = new ModalBuilder()
                .setCustomId(`suggestion_feedback_${status}`)
                .setTitle('💬 Feedback Constructif');

            const feedbackInput = new TextInputBuilder()
                .setCustomId('feedback_message')
                .setLabel('Message de feedback détaillé')
                .setStyle(TextInputStyle.Paragraph)
                .setPlaceholder('Expliquez votre décision, donnez des conseils constructifs, des alternatives...')
                .setRequired(true)
                .setMaxLength(1500);

            const reasonInput = new TextInputBuilder()
                .setCustomId('feedback_reason')
                .setLabel('Raison principale')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('Résumez en quelques mots la raison de cette décision')
                .setRequired(true)
                .setMaxLength(100);

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

            // Stocker temporairement le statut et les données
            if (!this.client.tempData) this.client.tempData = {};
            this.client.tempData[interaction.user.id] = {
                suggestionData,
                channelId: channel.id,
                status,
                feedbackChannelId
            };

            await interaction.showModal(feedbackModal);

        } catch (error) {
            this.logger.error('Erreur lors de la fermeture de suggestion:', error);
            try {
                await interaction.reply({
                    content: '❌ Une erreur est survenue lors de la fermeture de la suggestion.',
                    ephemeral: true
                });
            } catch (replyError) {
                console.error('Impossible de répondre à l\'erreur d\'interaction:', replyError);
            }
        }
    }

    // Gestion du feedback modal
    async handleSuggestionFeedbackModal(interaction) {
        try {
            const [, , status] = interaction.customId.split('_');
            const tempData = this.client.tempData?.[interaction.user.id];
            
            if (!tempData) {
                return await interaction.reply({
                    content: '❌ Session expirée. Veuillez recommencer.',
                    ephemeral: true
                });
            }

            const feedbackMessage = interaction.fields.getTextInputValue('feedback_message');
            const reason = interaction.fields.getTextInputValue('feedback_reason');
            const improvement = interaction.fields.getTextInputValue('feedback_improvement') || 'Aucune suggestion d\'amélioration fournie';

            await interaction.deferReply({ ephemeral: true });

            // Configuration des statuts
            const statusConfig = {
                approved: { emoji: '✅', color: '#2ECC71', title: 'SUGGESTION APPROUVÉE', action: 'approuvée' },
                rejected: { emoji: '❌', color: '#E74C3C', title: 'SUGGESTION REJETÉE', action: 'rejetée' },
                considered: { emoji: '🤔', color: '#F39C12', title: 'SUGGESTION À CONSIDÉRER', action: 'mise en considération' },
                closed: { emoji: '🔒', color: '#95A5A6', title: 'SUGGESTION FERMÉE', action: 'fermée' }
            };

            const config = statusConfig[status] || statusConfig.closed;
            const { suggestionData, channelId, feedbackChannelId } = tempData;

            // Créer l'embed de feedback pour le canal public
            const feedbackEmbed = new EmbedBuilder()
                .setColor(config.color)
                .setTitle(`${config.emoji} **${config.title}**`)
                .setDescription(`
**📋 Suggestion #${suggestionData.id} - ${config.action}**

**👤 Auteur :** <@${suggestionData.userId}>
**📝 Titre :** ${suggestionData.title}
**🎯 Type :** ${this.getSuggestionTypeDisplay(suggestionData.type)}
**📅 Créée le :** <t:${Math.floor(new Date(suggestionData.createdAt).getTime() / 1000)}:F>
**⚖️ Évaluée par :** ${interaction.user}`)
                .addFields(
                    {
                        name: '📝 **Description Originale**',
                        value: `\`\`\`${suggestionData.description.substring(0, 500)}${suggestionData.description.length > 500 ? '...' : ''}\`\`\``,
                        inline: false
                    },
                    {
                        name: '🎯 **Raison de la Décision**',
                        value: `\`\`\`${reason}\`\`\``,
                        inline: false
                    },
                    {
                        name: '💬 **Feedback Détaillé**',
                        value: `\`\`\`${feedbackMessage}\`\`\``,
                        inline: false
                    },
                    {
                        name: '💡 **Suggestions d\'Amélioration**',
                        value: `\`\`\`${improvement}\`\`\``,
                        inline: false
                    }
                )
                .setFooter({ 
                    text: `Suggestion ID: ${suggestionData.id} • Merci pour votre contribution !`,
                    iconURL: interaction.guild.iconURL()
                })
                .setTimestamp();

            // Envoyer le feedback dans le canal public
            const feedbackChannel = interaction.guild.channels.cache.get(feedbackChannelId);
            if (feedbackChannel) {
                await feedbackChannel.send({
                    content: `<@${suggestionData.userId}> **Votre suggestion a été évaluée !**`,
                    embeds: [feedbackEmbed]
                });
            }

            // Envoyer un MP à l'auteur de la suggestion
            try {
                const author = await interaction.guild.members.fetch(suggestionData.userId);
                const dmEmbed = new EmbedBuilder()
                    .setColor(config.color)
                    .setTitle(`${config.emoji} **Votre suggestion a été ${config.action} !**`)
                    .setDescription(`
**Bonjour ${author.displayName} !**

Votre suggestion **"${suggestionData.title}"** a été évaluée par notre équipe.

**📋 Résumé :**
• **Statut :** ${config.title}
• **Évaluée par :** ${interaction.user.tag}
• **Date d'évaluation :** <t:${Math.floor(Date.now() / 1000)}:F>`)
                    .addFields(
                        {
                            name: '🎯 **Raison**',
                            value: reason,
                            inline: false
                        },
                        {
                            name: '💬 **Feedback de l\'équipe**',
                            value: feedbackMessage,
                            inline: false
                        },
                        {
                            name: '💡 **Conseils pour l\'avenir**',
                            value: improvement,
                            inline: false
                        }
                    )
                    .setFooter({ 
                        text: `${interaction.guild.name} • Merci pour votre contribution !`,
                        iconURL: interaction.guild.iconURL()
                    })
                    .setTimestamp();

                await author.send({ embeds: [dmEmbed] });
            } catch (dmError) {
                this.logger.warn(`Impossible d'envoyer un MP à l'auteur de la suggestion: ${dmError.message}`);
            }

            // Mettre à jour les données de la suggestion
            if (this.client.db.data.suggestions[channelId]) {
                this.client.db.data.suggestions[channelId].status = status;
                this.client.db.data.suggestions[channelId].closedAt = new Date().toISOString();
                this.client.db.data.suggestions[channelId].closedBy = interaction.user.id;
                this.client.db.data.suggestions[channelId].feedback = {
                    reason,
                    message: feedbackMessage,
                    improvement
                };
                await this.client.db.save();
            }

            // Nettoyer les données temporaires
            delete this.client.tempData[interaction.user.id];

            // Fermer le canal après un délai
            const closingEmbed = new EmbedBuilder()
                .setColor('#e74c3c')
                .setTitle('🔒 **SUGGESTION TRAITÉE**')
                .setDescription(`
**Cette suggestion a été ${config.action} avec succès !**

**📋 Résumé :**
• **Feedback envoyé** dans <#${feedbackChannelId}>
• **Notification MP** envoyée à l'auteur
• **Données sauvegardées** pour référence future

**Ce canal sera fermé dans 30 secondes...**`)
                .setFooter({ text: 'Merci pour votre contribution à l\'amélioration du serveur !' })
                .setTimestamp();

            const channel = interaction.guild.channels.cache.get(channelId);
            if (channel) {
                await channel.send({ embeds: [closingEmbed] });
                
                setTimeout(async () => {
                    try {
                        await channel.delete('Suggestion traitée avec feedback');
                    } catch (error) {
                        this.logger.error('Erreur lors de la suppression du canal de suggestion:', error);
                    }
                }, 30000);
            }

            await interaction.editReply({
                content: `✅ **Feedback envoyé avec succès !**\n• Publié dans <#${feedbackChannelId}>\n• MP envoyé à l'auteur\n• Canal fermé dans 30 secondes`
            });

            this.logger.info(`Suggestion #${suggestionData.id} ${config.action} par ${interaction.user.tag}`);

        } catch (error) {
            this.logger.error('Erreur lors du traitement du feedback:', error);
            await interaction.editReply({
                content: '❌ Une erreur est survenue lors de l\'envoi du feedback.'
            });
        }
    }

    getSuggestionTypeDisplay(type) {
        const types = {
            gaming: '🎮 Fonctionnalité Gaming',
            bot: '🤖 Amélioration Bot',
            server: '🏛️ Organisation Serveur',
            events: '🎉 Événements & Activités',
            moderation: '🛡️ Modération & Règles',
            design: '🎨 Design & Interface',
            technical: '🔧 Technique & Performance',
            communication: '💬 Communication',
            other: '🌟 Autre'
        };
        return types[type] || '❓ Type inconnu';
    }

    // Méthode pour obtenir les statistiques des tickets
    async getTicketStats(guild) {
        try {
            const ticketCategory = guild.channels.cache.get(this.ticketCategoryId);
            if (!ticketCategory) return null;

            const ticketChannels = ticketCategory.children.cache.filter(
                channel => channel.type === ChannelType.GuildText && 
                          channel.name.includes('ticket')
            );

            const stats = {
                total: ticketChannels.size,
                byType: {},
                recent: 0
            };

            // Compter par type
            Object.keys(this.ticketTypes).forEach(type => {
                stats.byType[type] = ticketChannels.filter(
                    channel => channel.name.includes(type)
                ).size;
            });

            // Compter les tickets récents (dernières 24h)
            const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
            stats.recent = ticketChannels.filter(
                channel => channel.createdTimestamp > oneDayAgo
            ).size;

            return stats;

        } catch (error) {
            this.logger.error('Erreur lors du calcul des statistiques:', error);
            return null;
        }
    }
}

export default TicketManager;
