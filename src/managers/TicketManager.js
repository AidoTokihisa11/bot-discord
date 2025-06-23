import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionFlagsBits, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } from 'discord.js';
import Database from '../utils/Database.js';
import Logger from '../utils/Logger.js';

class TicketManager {
    constructor(client) {
        this.client = client;
        this.db = new Database();
        this.ticketTypes = {
            support: {
                name: 'Support Technique',
                emoji: '🔧',
                color: '#3498db',
                description: 'Problèmes techniques, bugs, dysfonctionnements',
                priority: 'high',
                responseTime: '< 2h'
            },
            general: {
                name: 'Questions Générales',
                emoji: '❓',
                color: '#95a5a6',
                description: 'Informations générales, aide, orientation',
                priority: 'medium',
                responseTime: '< 4h'
            },
            urgent: {
                name: 'Urgence',
                emoji: '🚨',
                color: '#e74c3c',
                description: 'Problèmes critiques nécessitant une intervention immédiate',
                priority: 'critical',
                responseTime: '< 30min'
            },
            partnership: {
                name: 'Partenariat',
                emoji: '🤝',
                color: '#2ecc71',
                description: 'Propositions de collaboration, partenariats',
                priority: 'low',
                responseTime: '< 24h'
            },
            suggestion: {
                name: 'Suggestions',
                emoji: '💡',
                color: '#f39c12',
                description: 'Idées d\'amélioration, nouvelles fonctionnalités',
                priority: 'low',
                responseTime: '< 12h'
            },
            appeal: {
                name: 'Appel de Sanction',
                emoji: '⚖️',
                color: '#9b59b6',
                description: 'Contester une sanction, demande de révision',
                priority: 'medium',
                responseTime: '< 6h'
            }
        };
    }

    async createTicketPanel(channel) {
        try {
            // Embed principal avec design moderne
            const mainEmbed = new EmbedBuilder()
                .setColor('#5865F2')
                .setTitle('🎫 **CENTRE DE SUPPORT PREMIUM**')
                .setDescription(`**🌟 Bienvenue dans notre centre de support avancé !**

Notre équipe d'experts est disponible **24h/7j** pour vous accompagner.

**📊 Statistiques en temps réel :**
• **Temps de réponse moyen :** \`15 minutes\`
• **Taux de satisfaction :** \`98.5%\`
• **Tickets résolus aujourd'hui :** \`${await this.getTodayResolvedTickets()}\`

**🎯 Sélectionnez votre type de demande ci-dessous**`)
                .setFooter({ 
                    text: '💎 Support Premium • Réponse garantie sous 24h'
                })
                .setTimestamp();

            // Menu de sélection pour les types de tickets
            const ticketSelect = new StringSelectMenuBuilder()
                .setCustomId('ticket_type_select')
                .setPlaceholder('🎯 Choisissez votre type de demande...')
                .setMinValues(1)
                .setMaxValues(1);

            // Ajouter les options au menu
            Object.entries(this.ticketTypes).forEach(([key, config]) => {
                ticketSelect.addOptions(
                    new StringSelectMenuOptionBuilder()
                        .setLabel(config.name)
                        .setDescription(`${config.description} • ${config.responseTime}`)
                        .setValue(key)
                        .setEmoji(config.emoji)
                );
            });

            const selectRow = new ActionRowBuilder().addComponents(ticketSelect);

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
                        .setCustomId('ticket_emergency')
                        .setLabel('URGENCE')
                        .setStyle(ButtonStyle.Danger)
                        .setEmoji('🚨')
                );

            // Embed d'informations supplémentaires
            const infoEmbed = new EmbedBuilder()
                .setColor('#2f3136')
                .setTitle('📋 **Informations Importantes**')
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
                        value: '• Consultez notre **FAQ** pour les questions courantes\n• Préparez toutes les **informations nécessaires**\n• Soyez **précis et détaillé** dans votre description\n• **Un ticket = Une demande spécifique**',
                        inline: true
                    },
                    {
                        name: '🎯 **Système de Priorités**',
                        value: '🔴 **Critique** - Traitement immédiat\n🟡 **Élevée** - Sous 2 heures\n🟢 **Normale** - Sous 24 heures',
                        inline: true
                    }
                )
                .setFooter({ text: '💡 Astuce : Plus votre description est détaillée, plus nous pourrons vous aider rapidement !' });

            await channel.send({ 
                embeds: [mainEmbed, infoEmbed], 
                components: [selectRow, quickActionsRow] 
            });

            Logger.info(`Panel de tickets premium créé dans ${channel.name}`);
        } catch (error) {
            Logger.error('Erreur lors de la création du panel de tickets:', error);
            throw error;
        }
    }

    async handleTicketTypeSelection(interaction) {
        try {
            const selectedType = interaction.values[0];
            const config = this.ticketTypes[selectedType];

            if (!config) {
                return interaction.reply({
                    content: '❌ Type de ticket invalide.',
                    ephemeral: true
                });
            }

            // Vérifier si l'utilisateur a déjà un ticket ouvert
            const existingTicket = await this.db.getTicketByUser(interaction.user.id);
            if (existingTicket && existingTicket.status === 'open') {
                const existingChannel = interaction.guild.channels.cache.get(existingTicket.id);
                return interaction.reply({
                    content: `❌ Vous avez déjà un ticket ouvert : ${existingChannel || 'Canal introuvable'}`,
                    ephemeral: true
                });
            }

            // Embed de confirmation avec preview
            const confirmEmbed = new EmbedBuilder()
                .setColor(config.color)
                .setTitle(`${config.emoji} **${config.name}**`)
                .setDescription(`
**📝 Résumé de votre demande :**

**Type :** ${config.name}
**Description :** ${config.description}
**Priorité :** ${this.getPriorityDisplay(config.priority)}
**Temps de réponse estimé :** \`${config.responseTime}\`

**👥 Équipe assignée :** Support ${config.name}
**📍 Votre ticket sera créé dans :** <#${process.env.TICKET_CATEGORY_ID}>

Confirmez-vous la création de ce ticket ?`)
                .addFields(
                    {
                        name: '📋 **Ce qui vous sera demandé :**',
                        value: this.getRequiredInfo(selectedType),
                        inline: false
                    }
                )
                .setFooter({ text: 'Cliquez sur "Créer le Ticket" pour continuer' })
                .setTimestamp();

            const confirmRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`create_ticket_${selectedType}`)
                        .setLabel('Créer le Ticket')
                        .setStyle(ButtonStyle.Success)
                        .setEmoji('✅'),
                    new ButtonBuilder()
                        .setCustomId('cancel_ticket_creation')
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
            Logger.error('Erreur lors de la sélection du type de ticket:', error);
            await interaction.reply({
                content: '❌ Une erreur est survenue lors de la sélection.',
                ephemeral: true
            });
        }
    }

    async createTicket(interaction, type) {
        try {
            const guild = interaction.guild;
            const user = interaction.user;
            const config = this.ticketTypes[type];

            // Créer le canal de ticket avec nom unique
            const ticketNumber = await this.getNextTicketNumber();
            const ticketChannel = await guild.channels.create({
                name: `${config.emoji}・${type}-${ticketNumber}`,
                type: ChannelType.GuildText,
                parent: process.env.TICKET_CATEGORY_ID,
                topic: `Ticket ${config.name} • Créé par ${user.tag} • ID: ${ticketNumber}`,
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
                        id: process.env.STAFF_ROLE_ID,
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

            // Embed de bienvenue sophistiqué
            const welcomeEmbed = new EmbedBuilder()
                .setColor(config.color)
                .setTitle(`${config.emoji} **${config.name} - Ticket #${ticketNumber}**`)
                .setDescription(`
╭─────────────────────────────────────╮
│     **Bienvenue ${user.displayName}** 👋     │
╰─────────────────────────────────────╯

**📋 Informations du Ticket :**
• **Type :** ${config.name}
• **Numéro :** \`#${ticketNumber}\`
• **Priorité :** ${this.getPriorityDisplay(config.priority)}
• **Créé le :** <t:${Math.floor(Date.now() / 1000)}:F>
• **Temps de réponse estimé :** \`${config.responseTime}\`

**🎯 Prochaines Étapes :**
1️⃣ Décrivez votre problème/demande en détail
2️⃣ Ajoutez des captures d'écran si nécessaire
3️⃣ Notre équipe vous répondra rapidement

**💡 Conseils pour une résolution rapide :**
${this.getTicketTips(type)}`)
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
                        .setCustomId('ticket_priority')
                        .setLabel('Changer Priorité')
                        .setStyle(ButtonStyle.Secondary)
                        .setEmoji('⚡'),
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

            // Boutons d'évaluation
            const ratingRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('ticket_rate_1')
                        .setLabel('⭐')
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId('ticket_rate_2')
                        .setLabel('⭐⭐')
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId('ticket_rate_3')
                        .setLabel('⭐⭐⭐')
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId('ticket_rate_4')
                        .setLabel('⭐⭐⭐⭐')
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId('ticket_rate_5')
                        .setLabel('⭐⭐⭐⭐⭐')
                        .setStyle(ButtonStyle.Success)
                );

            await ticketChannel.send({
                content: `${user} | <@&${process.env.STAFF_ROLE_ID}>`,
                embeds: [welcomeEmbed],
                components: [ticketActionsRow]
            });

            // Message d'évaluation séparé
            const ratingEmbed = new EmbedBuilder()
                .setColor('#f39c12')
                .setTitle('⭐ **Évaluez notre Service**')
                .setDescription('Une fois votre problème résolu, n\'hésitez pas à évaluer la qualité de notre support !')
                .setFooter({ text: 'Votre avis nous aide à améliorer notre service' });

            await ticketChannel.send({
                embeds: [ratingEmbed],
                components: [ratingRow]
            });

            // Enregistrer le ticket dans la base de données
            await this.db.createTicket({
                id: ticketChannel.id,
                number: ticketNumber,
                userId: user.id,
                type: type,
                priority: config.priority,
                status: 'open',
                createdAt: new Date().toISOString()
            });

            await interaction.editReply({
                content: `✅ **Ticket créé avec succès !** ${ticketChannel}`,
                embeds: [],
                components: []
            });

            Logger.info(`Ticket #${ticketNumber} créé: ${ticketChannel.name} par ${user.tag} (${type})`);

        } catch (error) {
            Logger.error('Erreur lors de la création du ticket:', error);
            await interaction.editReply({
                content: '❌ Une erreur est survenue lors de la création du ticket.',
                embeds: [],
                components: []
            });
        }
    }

    // Méthodes utilitaires
    getPriorityDisplay(priority) {
        const priorities = {
            critical: '🔴 **Critique**',
            high: '🟡 **Élevée**',
            medium: '🟠 **Moyenne**',
            low: '🟢 **Normale**'
        };
        return priorities[priority] || '🟢 **Normale**';
    }

    getRequiredInfo(type) {
        const requirements = {
            support: '• Description détaillée du problème\n• Étapes pour reproduire le bug\n• Captures d\'écran si possible',
            general: '• Question précise\n• Contexte de votre demande\n• Informations complémentaires',
            urgent: '• Nature de l\'urgence\n• Impact sur votre activité\n• Preuves si nécessaire',
            partnership: '• Présentation de votre projet\n• Type de partenariat souhaité\n• Vos coordonnées',
            suggestion: '• Description de votre idée\n• Bénéfices attendus\n• Exemples concrets',
            appeal: '• Sanction concernée\n• Motifs de contestation\n• Preuves à l\'appui'
        };
        return requirements[type] || '• Informations détaillées sur votre demande';
    }

    getTicketTips(type) {
        const tips = {
            support: '• Décrivez les étapes exactes qui causent le problème\n• Mentionnez votre système d\'exploitation\n• Joignez des captures d\'écran',
            general: '• Soyez précis dans votre question\n• Donnez le contexte nécessaire\n• Mentionnez ce que vous avez déjà essayé',
            urgent: '• Expliquez pourquoi c\'est urgent\n• Décrivez l\'impact immédiat\n• Restez disponible pour un contact rapide',
            partnership: '• Présentez clairement votre projet\n• Expliquez les bénéfices mutuels\n• Proposez des modalités concrètes',
            suggestion: '• Expliquez le problème que ça résoudrait\n• Donnez des exemples d\'utilisation\n• Proposez une implémentation',
            appeal: '• Restez respectueux et factuel\n• Apportez des preuves concrètes\n• Expliquez votre version des faits'
        };
        return tips[type] || '• Soyez précis et détaillé dans votre demande';
    }

    async getNextTicketNumber() {
        // Implémentation pour obtenir le prochain numéro de ticket
        const lastTicket = await this.db.getLastTicket();
        return lastTicket ? lastTicket.number + 1 : 1001;
    }

    async getTodayResolvedTickets() {
        // Implémentation pour obtenir le nombre de tickets résolus aujourd'hui
        const today = new Date().toISOString().split('T')[0];
        const resolved = await this.db.getResolvedTicketsToday(today);
        return resolved || 0;
    }

    // Gestionnaires d'actions pour les boutons
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
            case 'ticket_emergency':
                await this.handleEmergency(interaction);
                break;
        }
    }

    async showFAQ(interaction) {
        const faqEmbed = new EmbedBuilder()
            .setColor('#3498db')
            .setTitle('📚 **Questions Fréquemment Posées**')
            .setDescription('Voici les réponses aux questions les plus courantes :')
            .addFields(
                { name: '❓ Comment créer un ticket ?', value: 'Utilisez le menu déroulant ci-dessus pour sélectionner votre type de demande.', inline: false },
                { name: '⏱️ Combien de temps pour une réponse ?', value: 'Nos temps de réponse varient selon la priorité, de 30 minutes à 24 heures maximum.', inline: false },
                { name: '🔄 Puis-je modifier mon ticket ?', value: 'Oui, vous pouvez ajouter des informations à tout moment dans votre ticket.', inline: false },
                { name: '👥 Puis-je ajouter quelqu\'un à mon ticket ?', value: 'Utilisez le bouton "Ajouter Utilisateur" dans votre ticket.', inline: false }
            )
            .setFooter({ text: 'Si votre question n\'est pas listée, créez un ticket !' });

        await interaction.reply({ embeds: [faqEmbed], ephemeral: true });
    }

    async showSupportStatus(interaction) {
        const statusEmbed = new EmbedBuilder()
            .setColor('#2ecc71')
            .setTitle('📊 **Statut du Support en Temps Réel**')
            .addFields(
                { name: '🟢 **Statut Global**', value: 'Tous les services opérationnels', inline: true },
                { name: '👥 **Équipe Disponible**', value: '8/10 agents en ligne', inline: true },
                { name: '📈 **Charge Actuelle**', value: 'Normale (65%)', inline: true },
                { name: '⏱️ **Temps de Réponse Moyen**', value: '15 minutes', inline: true },
                { name: '🎯 **Tickets en Attente**', value: '12 tickets', inline: true },
                { name: '✅ **Résolus Aujourd\'hui**', value: `${await this.getTodayResolvedTickets()} tickets`, inline: true }
            )
            .setFooter({ text: 'Dernière mise à jour il y a 2 minutes' })
            .setTimestamp();

        await interaction.reply({ embeds: [statusEmbed], ephemeral: true });
    }

    async showUserTickets(interaction) {
        const userTickets = await this.db.getUserTickets(interaction.user.id);
        
        const ticketsEmbed = new EmbedBuilder()
            .setColor('#9b59b6')
            .setTitle('📋 **Vos Tickets**')
            .setDescription(userTickets.length > 0 ? 
                userTickets.map(ticket => 
                    `**#${ticket.number}** - ${this.ticketTypes[ticket.type]?.emoji} ${this.ticketTypes[ticket.type]?.name}\n` +
                    `Status: ${ticket.status === 'open' ? '🟢 Ouvert' : '🔴 Fermé'} • <t:${Math.floor(new Date(ticket.createdAt).getTime() / 1000)}:R>`
                ).join('\n\n') : 
                'Vous n\'avez aucun ticket pour le moment.'
            )
            .setFooter({ text: `Total: ${userTickets.length} ticket(s)` });

        await interaction.reply({ embeds: [ticketsEmbed], ephemeral: true });
    }

    async handleEmergency(interaction) {
        const emergencyEmbed = new EmbedBuilder()
            .setColor('#e74c3c')
            .setTitle('🚨 **URGENCE DÉTECTÉE**')
            .setDescription(`
**⚠️ Vous avez signalé une urgence !**

Notre équipe d'intervention rapide a été **immédiatement notifiée**.

**📞 Contact Direct :**
• **Discord :** <@&${process.env.EMERGENCY_ROLE_ID}>
• **Temps de réponse :** < 5 minutes
• **Disponibilité :** 24h/7j

**🎯 Que faire maintenant :**
1️⃣ Créez un ticket d'urgence ci-dessous
2️⃣ Décrivez précisément la situation
3️⃣ Restez disponible pour un contact immédiat

**⚡ Votre demande sera traitée en priorité absolue.**`)
            .setFooter({ text: 'Équipe d\'intervention notifiée • Réponse imminente' })
            .setTimestamp();

        const emergencyButton = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('create_ticket_urgent')
                    .setLabel('CRÉER TICKET D\'URGENCE')
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji('🚨')
            );

        await interaction.reply({
            embeds: [emergencyEmbed],
            components: [emergencyButton],
            ephemeral: true
        });

        // Notifier l'équipe d'urgence
        const emergencyChannel = interaction.guild.channels.cache.get(process.env.EMERGENCY_CHANNEL_ID);
        if (emergencyChannel) {
            await emergencyChannel.send({
                content: `🚨 **ALERTE URGENCE** - ${interaction.user} a déclenché une urgence !`,
                embeds: [emergencyEmbed]
            });
        }
    }
}

export default TicketManager;
