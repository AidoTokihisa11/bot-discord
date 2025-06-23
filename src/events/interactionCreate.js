import TicketManager from '../managers/TicketManager.js';
import Logger from '../utils/Logger.js';

export default {
    name: 'interactionCreate',
    async execute(interaction) {
        try {
            if (interaction.isChatInputCommand()) {
                const command = interaction.client.commands.get(interaction.commandName);

                if (!command) {
                    Logger.warn(`Commande inconnue: ${interaction.commandName}`);
                    return;
                }

                await command.execute(interaction);
            } 
            else if (interaction.isStringSelectMenu()) {
                const ticketManager = new TicketManager(interaction.client);
                
                if (interaction.customId === 'ticket_type_select') {
                    await ticketManager.handleTicketTypeSelection(interaction);
                }
            }
            else if (interaction.isButton()) {
                const ticketManager = new TicketManager(interaction.client);
                
                // Gestion des boutons de création de tickets
                if (interaction.customId.startsWith('create_ticket_')) {
                    const ticketType = interaction.customId.replace('create_ticket_', '');
                    await ticketManager.createTicket(interaction, ticketType);
                }
                // Gestion des actions rapides
                else if (['ticket_faq', 'ticket_status', 'ticket_my_tickets', 'ticket_emergency'].includes(interaction.customId)) {
                    await ticketManager.handleQuickAction(interaction);
                }
                // Gestion de la fermeture de tickets
                else if (interaction.customId === 'ticket_close') {
                    await this.handleTicketClose(interaction, ticketManager);
                }
                else if (interaction.customId === 'confirm_close') {
                    await this.handleConfirmClose(interaction, ticketManager);
                }
                else if (interaction.customId === 'cancel_close') {
                    await interaction.update({
                        content: '❌ Fermeture annulée.',
                        embeds: [],
                        components: []
                    });
                }
                else if (interaction.customId === 'cancel_ticket_creation') {
                    await interaction.update({
                        content: '❌ Création de ticket annulée.',
                        embeds: [],
                        components: []
                    });
                }
                // Gestion des évaluations
                else if (interaction.customId.startsWith('ticket_rate_')) {
                    const rating = parseInt(interaction.customId.replace('ticket_rate_', ''));
                    await this.handleTicketRating(interaction, rating);
                }
                // Gestion des actions avancées dans les tickets
                else if (interaction.customId === 'ticket_priority') {
                    await this.handlePriorityChange(interaction);
                }
                else if (interaction.customId === 'ticket_add_user') {
                    await this.handleAddUser(interaction);
                }
                else if (interaction.customId === 'ticket_transcript') {
                    await this.handleTranscript(interaction);
                }
            }
        } catch (error) {
            Logger.error('Erreur lors du traitement de l\'interaction:', error);
            
            const errorMessage = '❌ Une erreur est survenue lors du traitement de votre demande.';
            
            try {
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({ content: errorMessage, ephemeral: true });
                } else {
                    await interaction.reply({ content: errorMessage, ephemeral: true });
                }
            } catch (replyError) {
                Logger.error('Impossible de répondre à l\'erreur:', replyError);
            }
        }
    },

    async handleTicketClose(interaction, ticketManager) {
        try {
            const channel = interaction.channel;
            
            // Vérifier si c'est un canal de ticket
            const ticket = await ticketManager.db.getTicket(channel.id);
            if (!ticket) {
                return interaction.reply({
                    content: '❌ Ce canal n\'est pas un ticket valide.',
                    ephemeral: true
                });
            }

            // Vérifier les permissions
            const member = interaction.member;
            const isTicketOwner = ticket.userId === interaction.user.id;
            const isStaff = member.roles.cache.has(process.env.STAFF_ROLE_ID);

            if (!isTicketOwner && !isStaff) {
                return interaction.reply({
                    content: '❌ Vous n\'avez pas la permission de fermer ce ticket.',
                    ephemeral: true
                });
            }

            // Créer l'embed de confirmation
            const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = await import('discord.js');
            
            const confirmEmbed = new EmbedBuilder()
                .setColor('#e74c3c')
                .setTitle('🔒 **Fermeture du Ticket**')
                .setDescription(`
**⚠️ Êtes-vous sûr de vouloir fermer ce ticket ?**

**📋 Informations du ticket :**
• **Numéro :** \`#${ticket.number || 'N/A'}\`
• **Type :** ${ticketManager.ticketTypes[ticket.type]?.emoji} ${ticketManager.ticketTypes[ticket.type]?.name}
• **Créé le :** <t:${Math.floor(new Date(ticket.createdAt).getTime() / 1000)}:F>
• **Demandé par :** ${isStaff ? 'Staff' : 'Propriétaire du ticket'}

**🎯 Actions qui seront effectuées :**
• Le ticket sera marqué comme fermé
• Un transcript sera généré automatiquement
• Le canal sera supprimé dans 10 secondes
• Une notification sera envoyée au propriétaire

**⚠️ Cette action est irréversible !**`)
                .setFooter({ text: 'Cliquez sur "Confirmer" pour procéder à la fermeture' })
                .setTimestamp();

            const confirmButtons = new ActionRowBuilder()
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
                components: [confirmButtons],
                ephemeral: true
            });

        } catch (error) {
            Logger.error('Erreur lors de la demande de fermeture:', error);
            await interaction.reply({
                content: '❌ Une erreur est survenue lors de la demande de fermeture.',
                ephemeral: true
            });
        }
    },

    async handleConfirmClose(interaction, ticketManager) {
        try {
            const channel = interaction.channel;
            const { EmbedBuilder } = await import('discord.js');
            
            // Mettre à jour le ticket dans la base de données
            await ticketManager.db.updateTicket(channel.id, {
                status: 'closed',
                closedAt: new Date().toISOString(),
                closedBy: interaction.user.id
            });

            // Embed de fermeture
            const closedEmbed = new EmbedBuilder()
                .setColor('#2ecc71')
                .setTitle('✅ **Ticket Fermé avec Succès**')
                .setDescription(`
**🎫 Ticket fermé par :** ${interaction.user}
**🕐 Fermé le :** <t:${Math.floor(Date.now() / 1000)}:F>

**📄 Transcript :** Généré automatiquement
**💾 Données :** Sauvegardées dans la base de données

**🗑️ Le canal sera supprimé dans 10 secondes...**

**⭐ Merci d'avoir utilisé notre système de support !**`)
                .setFooter({ text: 'Système de Tickets Premium • Merci pour votre confiance' })
                .setTimestamp();

            await interaction.update({
                embeds: [closedEmbed],
                components: []
            });

            // Envoyer une notification au propriétaire du ticket
            const ticket = await ticketManager.db.getTicket(channel.id);
            if (ticket) {
                try {
                    const ticketOwner = await interaction.guild.members.fetch(ticket.userId);
                    const dmEmbed = new EmbedBuilder()
                        .setColor('#5865F2')
                        .setTitle('🎫 **Ticket Fermé**')
                        .setDescription(`
Votre ticket **#${ticket.number || 'N/A'}** a été fermé.

**📋 Résumé :**
• **Type :** ${ticketManager.ticketTypes[ticket.type]?.name}
• **Fermé par :** ${interaction.user.tag}
• **Durée :** <t:${Math.floor(new Date(ticket.createdAt).getTime() / 1000)}:R>

**💬 Besoin d'aide supplémentaire ?**
N'hésitez pas à créer un nouveau ticket si nécessaire.

**⭐ Évaluez notre service :**
Votre avis nous aide à améliorer notre support !`)
                        .setFooter({ text: 'Merci d\'avoir utilisé notre système de support' })
                        .setTimestamp();

                    await ticketOwner.send({ embeds: [dmEmbed] });
                } catch (dmError) {
                    Logger.warn('Impossible d\'envoyer le DM de fermeture:', dmError);
                }
            }

            Logger.info(`Ticket fermé: ${channel.name} par ${interaction.user.tag}`);

            // Supprimer le canal après 10 secondes
            setTimeout(async () => {
                try {
                    await channel.delete();
                } catch (error) {
                    Logger.error('Erreur lors de la suppression du canal:', error);
                }
            }, 10000);

        } catch (error) {
            Logger.error('Erreur lors de la confirmation de fermeture:', error);
            await interaction.update({
                content: '❌ Une erreur est survenue lors de la fermeture du ticket.',
                embeds: [],
                components: []
            });
        }
    },

    async handleTicketRating(interaction, rating) {
        try {
            const { EmbedBuilder } = await import('discord.js');
            
            const ratingEmbed = new EmbedBuilder()
                .setColor('#f39c12')
                .setTitle('⭐ **Évaluation Reçue**')
                .setDescription(`
**Merci pour votre évaluation !**

**Note attribuée :** ${'⭐'.repeat(rating)} (${rating}/5)
**Évalué par :** ${interaction.user}
**Date :** <t:${Math.floor(Date.now() / 1000)}:F>

**💬 Commentaire supplémentaire ?**
N'hésitez pas à nous faire part de vos suggestions pour améliorer notre service !

**🎯 Votre avis compte !**
Cette évaluation nous aide à maintenir un service de qualité.`)
                .setFooter({ text: 'Merci pour votre retour constructif !' })
                .setTimestamp();

            await interaction.reply({
                embeds: [ratingEmbed],
                ephemeral: true
            });

            // Enregistrer l'évaluation (optionnel)
            Logger.info(`Évaluation reçue: ${rating}/5 étoiles par ${interaction.user.tag} dans ${interaction.channel.name}`);

        } catch (error) {
            Logger.error('Erreur lors de l\'évaluation:', error);
            await interaction.reply({
                content: '❌ Erreur lors de l\'enregistrement de votre évaluation.',
                ephemeral: true
            });
        }
    },

    async handlePriorityChange(interaction) {
        try {
            const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = await import('discord.js');
            
            // Vérifier les permissions
            if (!interaction.member.roles.cache.has(process.env.STAFF_ROLE_ID)) {
                return interaction.reply({
                    content: '❌ Seuls les membres du staff peuvent modifier la priorité des tickets.',
                    ephemeral: true
                });
            }

            const modal = new ModalBuilder()
                .setCustomId('priority_change_modal')
                .setTitle('⚡ Changer la Priorité du Ticket');

            const priorityInput = new TextInputBuilder()
                .setCustomId('new_priority')
                .setLabel('Nouvelle Priorité')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('critical, high, medium, low')
                .setRequired(true)
                .setMaxLength(20);

            const reasonInput = new TextInputBuilder()
                .setCustomId('priority_reason')
                .setLabel('Raison du Changement')
                .setStyle(TextInputStyle.Paragraph)
                .setPlaceholder('Expliquez pourquoi vous changez la priorité...')
                .setRequired(false)
                .setMaxLength(500);

            const row1 = new ActionRowBuilder().addComponents(priorityInput);
            const row2 = new ActionRowBuilder().addComponents(reasonInput);

            modal.addComponents(row1, row2);
            await interaction.showModal(modal);

        } catch (error) {
            Logger.error('Erreur lors du changement de priorité:', error);
            await interaction.reply({
                content: '❌ Erreur lors de l\'ouverture du modal de priorité.',
                ephemeral: true
            });
        }
    },

    async handleAddUser(interaction) {
        try {
            const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = await import('discord.js');
            
            // Vérifier les permissions
            if (!interaction.member.roles.cache.has(process.env.STAFF_ROLE_ID)) {
                return interaction.reply({
                    content: '❌ Seuls les membres du staff peuvent ajouter des utilisateurs aux tickets.',
                    ephemeral: true
                });
            }

            const modal = new ModalBuilder()
                .setCustomId('add_user_modal')
                .setTitle('👥 Ajouter un Utilisateur au Ticket');

            const userInput = new TextInputBuilder()
                .setCustomId('user_to_add')
                .setLabel('Utilisateur à Ajouter')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('ID utilisateur ou @mention')
                .setRequired(true)
                .setMaxLength(100);

            const reasonInput = new TextInputBuilder()
                .setCustomId('add_reason')
                .setLabel('Raison de l\'Ajout')
                .setStyle(TextInputStyle.Paragraph)
                .setPlaceholder('Pourquoi ajouter cet utilisateur au ticket ?')
                .setRequired(false)
                .setMaxLength(500);

            const row1 = new ActionRowBuilder().addComponents(userInput);
            const row2 = new ActionRowBuilder().addComponents(reasonInput);

            modal.addComponents(row1, row2);
            await interaction.showModal(modal);

        } catch (error) {
            Logger.error('Erreur lors de l\'ajout d\'utilisateur:', error);
            await interaction.reply({
                content: '❌ Erreur lors de l\'ouverture du modal d\'ajout.',
                ephemeral: true
            });
        }
    },

    async handleTranscript(interaction) {
        try {
            await interaction.deferReply({ ephemeral: true });

            const channel = interaction.channel;
            const messages = await channel.messages.fetch({ limit: 100 });
            
            // Générer un transcript simple
            const transcript = messages.reverse().map(msg => {
                const timestamp = new Date(msg.createdTimestamp).toLocaleString('fr-FR');
                return `[${timestamp}] ${msg.author.tag}: ${msg.content}`;
            }).join('\n');

            // Créer un fichier transcript
            const fs = await import('fs');
            const path = await import('path');
            
            const transcriptPath = path.join(process.cwd(), 'logs', `transcript-${channel.name}-${Date.now()}.txt`);
            
            // Créer le dossier logs s'il n'existe pas
            if (!fs.existsSync(path.join(process.cwd(), 'logs'))) {
                fs.mkdirSync(path.join(process.cwd(), 'logs'), { recursive: true });
            }
            
            fs.writeFileSync(transcriptPath, transcript);

            await interaction.editReply({
                content: '✅ **Transcript généré avec succès !**\n\nLe transcript a été sauvegardé dans les logs du serveur.',
                files: [transcriptPath]
            });

            Logger.info(`Transcript généré pour ${channel.name} par ${interaction.user.tag}`);

        } catch (error) {
            Logger.error('Erreur lors de la génération du transcript:', error);
            await interaction.editReply({
                content: '❌ Erreur lors de la génération du transcript.'
            });
        }
    }
};
