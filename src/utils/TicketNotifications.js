import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

export class TicketNotifications {
    static async sendStaffNotification(guild, ticket) {
        try {
            console.log('🔔 Envoi des notifications staff...');
            
            // Trouver le rôle modérateur spécifique
            const moderatorRole = guild.roles.cache.get('1386784012269387946');
            
            if (!moderatorRole) {
                console.log('❌ Rôle modérateur introuvable');
                return;
            }

            console.log(`📋 Rôle modérateur trouvé: ${moderatorRole.name}`);

            // Embed moderne et détaillé
            const embed = new EmbedBuilder()
                .setColor('#FF6B35')
                .setTitle('🚨 NOUVEAU TICKET - INTERVENTION REQUISE')
                .setDescription(`
**📋 RÉSUMÉ DU TICKET :**
${ticket.title || 'Aucun titre fourni'}

**📝 DESCRIPTION COMPLÈTE :**
${ticket.description || 'Aucune description fournie'}

**🏷️ INFORMATIONS DÉTAILLÉES :**
• **Serveur :** ${guild.name}
• **Utilisateur :** ${ticket.user.tag} (${ticket.user.id})
• **Catégorie :** ${ticket.type}
• **Priorité :** ${this.getPriorityEmoji(ticket.priority)} **${ticket.priority}**
• **Numéro :** #${ticket.id}
• **Temps de réponse attendu :** ${this.getResponseTime(ticket.type)}

**🔗 ACCÈS DIRECT :**
[📍 Cliquez ici pour accéder au ticket](${ticket.channel.url})

**⚠️ Action requise dans les ${this.getResponseTime(ticket.type)} !**
                `)
                .setThumbnail(ticket.user.displayAvatarURL({ dynamic: true }))
                .setFooter({ 
                    text: `Ticket #${ticket.id} • ${guild.name} • Support 24/7`,
                    iconURL: guild.iconURL({ dynamic: true })
                })
                .setTimestamp();

            // Boutons d'action rapide
            const actionRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setURL(ticket.channel.url)
                        .setLabel('Accéder au Ticket')
                        .setStyle(ButtonStyle.Link)
                        .setEmoji('🎫'),
                    new ButtonBuilder()
                        .setURL(`https://discord.com/channels/${guild.id}/${ticket.channel.id}`)
                        .setLabel('Ouvrir dans Discord')
                        .setStyle(ButtonStyle.Link)
                        .setEmoji('🔗')
                );

            // Envoyer dans le canal du ticket avec mention
            await ticket.channel.send({
                content: `📢 ${moderatorRole}`,
                embeds: [embed],
                components: [actionRow]
            });

            // Envoyer DM aux membres avec le rôle modérateur
            await this.sendDMNotifications(guild, ticket, moderatorRole);

        } catch (error) {
            console.error('Erreur notification staff:', error);
        }
    }

    static async sendDMNotifications(guild, ticket, moderatorRole) {
        try {
            // Embed optimisé pour DM
            const dmEmbed = new EmbedBuilder()
                .setColor('#FF6B35')
                .setTitle('🚨 NOUVEAU TICKET - INTERVENTION REQUISE')
                .setDescription(`
**📋 RÉSUMÉ DU TICKET :**
${ticket.title || 'Aucun titre fourni'}

**📝 DESCRIPTION COMPLÈTE :**
${ticket.description || 'Aucune description fournie'}

**🏷️ INFORMATIONS DÉTAILLÉES :**
• **Serveur :** ${guild.name}
• **Utilisateur :** ${ticket.user.tag} (${ticket.user.id})
• **Catégorie :** ${ticket.type}
• **Priorité :** ${this.getPriorityEmoji(ticket.priority)} **${ticket.priority}**
• **Numéro :** #${ticket.id}
• **Temps de réponse attendu :** ${this.getResponseTime(ticket.type)}

**🔗 ACCÈS DIRECT :**
[📍 Cliquez ici pour accéder au ticket](${ticket.channel.url})

**⚠️ Action requise dans les ${this.getResponseTime(ticket.type)} !**
                `)
                .setThumbnail(ticket.user.displayAvatarURL({ dynamic: true }))
                .setFooter({ 
                    text: `Ticket #${ticket.id} • ${guild.name} • Support 24/7`,
                    iconURL: guild.iconURL({ dynamic: true })
                })
                .setTimestamp();

            // Trouver tous les membres avec le rôle modérateur
            const moderators = guild.members.cache.filter(member => 
                member.roles.cache.has(moderatorRole.id) && !member.user.bot
            );

            console.log(`👥 Membres modérateurs à notifier: ${moderators.size}`);

            // Envoyer DM à chaque modérateur
            for (const [, member] of moderators) {
                try {
                    await member.send({ 
                        content: `🔔 **Nouveau ticket priorité ${ticket.priority} sur ${guild.name}**`,
                        embeds: [dmEmbed] 
                    });
                    console.log(`✅ Notification DM envoyée à ${member.user.tag}`);
                } catch (dmError) {
                    console.log(`❌ Impossible d'envoyer DM à ${member.user.tag}: ${dmError.message}`);
                }
            }

        } catch (error) {
            console.error('Erreur DM notifications:', error);
        }
    }

    static async sendTicketCreatedNotification(guild, ticket) {
        try {
            // Trouver le canal de logs
            const logChannel = guild.channels.cache.find(channel => 
                channel.name.includes('logs') || 
                channel.name.includes('admin') ||
                channel.name.includes('tickets') ||
                channel.name.includes('mod')
            );

            if (!logChannel) {
                console.log('❌ Canal de logs introuvable');
                return;
            }

            const embed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('✅ Nouveau Ticket Créé')
                .setDescription(`
**📋 Détails du ticket :**
• **Utilisateur :** ${ticket.user} (${ticket.user.tag})
• **Canal :** ${ticket.channel}
• **Catégorie :** ${ticket.type}
• **Priorité :** ${this.getPriorityEmoji(ticket.priority)} ${ticket.priority}
• **ID :** #${ticket.id}
• **Sujet :** ${ticket.title || 'Aucun sujet'}

**📝 Description :**
${ticket.description || 'Aucune description'}
                `)
                .addFields(
                    { name: '⏰ Créé le', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true },
                    { name: '🎯 SLA', value: this.getResponseTime(ticket.type), inline: true },
                    { name: '📊 Statut', value: '🟢 Ouvert', inline: true }
                )
                .setThumbnail(ticket.user.displayAvatarURL({ dynamic: true }))
                .setTimestamp();

            await logChannel.send({ embeds: [embed] });
            console.log(`📝 Log de création envoyé dans #${logChannel.name}`);

        } catch (error) {
            console.error('Erreur notification logs:', error);
        }
    }

    static async sendTicketClosedNotification(guild, ticket, closedBy) {
        try {
            const logChannel = guild.channels.cache.find(channel => 
                channel.name.includes('logs') || 
                channel.name.includes('admin') ||
                channel.name.includes('tickets') ||
                channel.name.includes('mod')
            );

            if (!logChannel) return;

            const embed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('🔒 Ticket Fermé')
                .setDescription(`
**📋 Détails de fermeture :**
• **Fermé par :** ${closedBy}
• **Utilisateur :** ${ticket.user.tag}
• **Catégorie :** ${ticket.type}
• **ID :** #${ticket.id}
• **Durée :** ${this.calculateDuration(ticket.createdAt)}
                `)
                .addFields(
                    { name: '⏰ Fermé le', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true },
                    { name: '📊 Statut final', value: '🔒 Fermé', inline: true }
                )
                .setTimestamp();

            await logChannel.send({ embeds: [embed] });

        } catch (error) {
            console.error('Erreur notification fermeture:', error);
        }
    }

    static async sendTicketClaimedNotification(guild, ticket, claimedBy) {
        try {
            const logChannel = guild.channels.cache.find(channel => 
                channel.name.includes('logs') || 
                channel.name.includes('admin') ||
                channel.name.includes('tickets') ||
                channel.name.includes('mod')
            );

            if (!logChannel) return;

            const embed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('👋 Ticket Pris en Charge')
                .setDescription(`
**📋 Détails de prise en charge :**
• **Agent :** ${claimedBy}
• **Ticket :** #${ticket.id}
• **Utilisateur :** ${ticket.user.tag}
• **Catégorie :** ${ticket.type}
                `)
                .addFields(
                    { name: '⏰ Pris en charge le', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true },
                    { name: '📊 Statut', value: '👋 En cours', inline: true }
                )
                .setTimestamp();

            await logChannel.send({ embeds: [embed] });

        } catch (error) {
            console.error('Erreur notification prise en charge:', error);
        }
    }

    // Méthodes utilitaires améliorées
    static getPriorityEmoji(priority) {
        const emojis = {
            'Faible': '🟢',
            'Normale': '🟡',
            'Élevée': '🟠',
            'Urgente': '🔴'
        };
        return emojis[priority] || '🟡';
    }

    static getResponseTime(category) {
        const times = {
            'Support Technique': '< 2 heures',
            'Questions Générales': '< 4 heures',
            'Signalement Urgent': '< 1 heure',
            'Partenariat': '< 24 heures',
            'Suggestions': '< 12 heures',
            'Appel de Sanction': '< 6 heures'
        };
        return times[category] || '< 24 heures';
    }

    static calculateDuration(createdAt) {
        if (!createdAt) return 'Durée inconnue';
        
        const now = Date.now();
        const created = new Date(createdAt).getTime();
        const duration = now - created;
        
        const hours = Math.floor(duration / (1000 * 60 * 60));
        const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
        
        if (hours > 0) {
            return `${hours}h ${minutes}min`;
        } else {
            return `${minutes}min`;
        }
    }

    static async sendPriorityChangeNotification(guild, ticket, oldPriority, newPriority, changedBy, reason) {
        try {
            const logChannel = guild.channels.cache.find(channel => 
                channel.name.includes('logs') || 
                channel.name.includes('admin') ||
                channel.name.includes('tickets') ||
                channel.name.includes('mod')
            );

            if (!logChannel) return;

            const embed = new EmbedBuilder()
                .setColor('#FFA500')
                .setTitle('⚡ Priorité de Ticket Modifiée')
                .setDescription(`
**📋 Détails du changement :**
• **Ticket :** #${ticket.id}
• **Utilisateur :** ${ticket.user.tag}
• **Modifié par :** ${changedBy}
• **Ancienne priorité :** ${this.getPriorityEmoji(oldPriority)} ${oldPriority}
• **Nouvelle priorité :** ${this.getPriorityEmoji(newPriority)} ${newPriority}
• **Raison :** ${reason || 'Aucune raison spécifiée'}
                `)
                .setTimestamp();

            await logChannel.send({ embeds: [embed] });

        } catch (error) {
            console.error('Erreur notification changement priorité:', error);
        }
    }

    static async sendUserAddedNotification(guild, ticket, addedUser, addedBy, reason) {
        try {
            const logChannel = guild.channels.cache.find(channel => 
                channel.name.includes('logs') || 
                channel.name.includes('admin') ||
                channel.name.includes('tickets') ||
                channel.name.includes('mod')
            );

            if (!logChannel) return;

            const embed = new EmbedBuilder()
                .setColor('#00D9FF')
                .setTitle('👥 Utilisateur Ajouté au Ticket')
                .setDescription(`
**📋 Détails de l'ajout :**
• **Ticket :** #${ticket.id}
• **Utilisateur ajouté :** ${addedUser}
• **Ajouté par :** ${addedBy}
• **Raison :** ${reason || 'Aucune raison spécifiée'}
                `)
                .setTimestamp();

            await logChannel.send({ embeds: [embed] });

        } catch (error) {
            console.error('Erreur notification ajout utilisateur:', error);
        }
    }
}

export default TicketNotifications;
