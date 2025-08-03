import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } from 'discord.js';
import Logger from '../utils/Logger.js';

export default class ModerationManager {
    constructor(client) {
        this.client = client;
        this.db = client.db;
        this.logger = new Logger();
        
        // Collections pour gérer les données de modération
        this.activeMutes = new Map(); // userId -> muteData
        this.warnings = new Map(); // userId -> Array of warnings
        this.moderationHistory = new Map(); // userId -> Array of actions
        this.autoModRules = new Map(); // guildId -> rules
        
        // Configuration par défaut
        this.config = {
            maxWarnings: 3,
            autoActions: {
                3: 'timeout', // 3 avertissements = timeout 1h
                5: 'kick',    // 5 avertissements = kick
                7: 'ban'      // 7 avertissements = ban
            },
            timeoutDurations: {
                short: 5 * 60 * 1000,      // 5 minutes
                medium: 60 * 60 * 1000,    // 1 heure
                long: 24 * 60 * 60 * 1000, // 24 heures
                week: 7 * 24 * 60 * 60 * 1000 // 7 jours
            },
            logChannels: new Map() // guildId -> channelId
        };
        
        // Statistiques
        this.stats = {
            totalActions: 0,
            actionsToday: 0,
            lastResetDate: new Date().toDateString(),
            actionTypes: {
                warn: 0,
                mute: 0,
                kick: 0,
                ban: 0,
                unban: 0,
                timeout: 0
            }
        };
        
        this.init();
    }

    async init() {
        try {
            this.logger.info('🛡️ Initialisation du système de modération...');
            
            // Charger les données depuis la DB
            await this.loadModerationData();
            
            // Démarrer la vérification des timeouts
            this.startTimeoutChecker();
            
            this.logger.success('✅ Système de modération initialisé');
            
        } catch (error) {
            this.logger.error('❌ Erreur lors de l\'initialisation du système de modération:', error);
            throw error;
        }
    }

    async loadModerationData() {
        try {
            // Simuler le chargement depuis la DB
            // TODO: Implémenter le vrai chargement depuis la base de données
            this.logger.info('📊 Chargement des données de modération...');
            
        } catch (error) {
            this.logger.error('❌ Erreur lors du chargement des données:', error);
        }
    }

    // ==================== ACTIONS DE MODÉRATION ====================

    async warnUser(guild, moderator, targetUser, reason, duration = null) {
        try {
            const warnData = {
                id: `warn_${Date.now()}_${targetUser.id}`,
                userId: targetUser.id,
                moderatorId: moderator.id,
                guildId: guild.id,
                reason: reason || 'Aucune raison spécifiée',
                timestamp: Date.now(),
                duration: duration,
                active: true
            };

            // Ajouter l'avertissement
            if (!this.warnings.has(targetUser.id)) {
                this.warnings.set(targetUser.id, []);
            }
            this.warnings.get(targetUser.id).push(warnData);

            // Ajouter à l'historique
            await this.addToHistory(targetUser.id, 'warn', warnData);

            // Vérifier les actions automatiques
            const warningCount = this.warnings.get(targetUser.id).filter(w => w.active).length;
            await this.checkAutoActions(guild, targetUser, warningCount);

            // Envoyer la notification à l'utilisateur
            await this.notifyUser(targetUser, 'warn', reason, duration);

            // Logger l'action
            await this.logModerationAction(guild, 'warn', moderator, targetUser, reason, duration);

            // Mettre à jour les statistiques
            this.updateStats('warn');

            return warnData;

        } catch (error) {
            this.logger.error('❌ Erreur lors de l\'avertissement:', error);
            throw error;
        }
    }

    async muteUser(guild, moderator, targetUser, reason, duration = null) {
        try {
            const member = await guild.members.fetch(targetUser.id);
            if (!member) throw new Error('Membre non trouvé');

            // Vérifier les permissions
            if (!member.moderatable) {
                throw new Error('Impossible de modérer ce membre (permissions insuffisantes)');
            }

            const muteData = {
                id: `mute_${Date.now()}_${targetUser.id}`,
                userId: targetUser.id,
                moderatorId: moderator.id,
                guildId: guild.id,
                reason: reason || 'Aucune raison spécifiée',
                timestamp: Date.now(),
                duration: duration,
                expiresAt: duration ? Date.now() + duration : null
            };

            // Appliquer le timeout Discord
            const timeoutDuration = duration || this.config.timeoutDurations.medium;
            await member.timeout(timeoutDuration, reason);

            // Stocker les données
            this.activeMutes.set(targetUser.id, muteData);

            // Ajouter à l'historique
            await this.addToHistory(targetUser.id, 'mute', muteData);

            // Notifier l'utilisateur
            await this.notifyUser(targetUser, 'mute', reason, duration);

            // Logger l'action
            await this.logModerationAction(guild, 'mute', moderator, targetUser, reason, duration);

            // Mettre à jour les statistiques
            this.updateStats('mute');

            return muteData;

        } catch (error) {
            this.logger.error('❌ Erreur lors du mute:', error);
            throw error;
        }
    }

    async kickUser(guild, moderator, targetUser, reason) {
        try {
            const member = await guild.members.fetch(targetUser.id);
            if (!member) throw new Error('Membre non trouvé');

            if (!member.kickable) {
                throw new Error('Impossible de kick ce membre (permissions insuffisantes)');
            }

            const kickData = {
                id: `kick_${Date.now()}_${targetUser.id}`,
                userId: targetUser.id,
                moderatorId: moderator.id,
                guildId: guild.id,
                reason: reason || 'Aucune raison spécifiée',
                timestamp: Date.now()
            };

            // Notifier l'utilisateur avant le kick
            await this.notifyUser(targetUser, 'kick', reason);

            // Effectuer le kick
            await member.kick(reason);

            // Ajouter à l'historique
            await this.addToHistory(targetUser.id, 'kick', kickData);

            // Logger l'action
            await this.logModerationAction(guild, 'kick', moderator, targetUser, reason);

            // Mettre à jour les statistiques
            this.updateStats('kick');

            return kickData;

        } catch (error) {
            this.logger.error('❌ Erreur lors du kick:', error);
            throw error;
        }
    }

    async banUser(guild, moderator, targetUser, reason, duration = null) {
        try {
            const banData = {
                id: `ban_${Date.now()}_${targetUser.id}`,
                userId: targetUser.id,
                moderatorId: moderator.id,
                guildId: guild.id,
                reason: reason || 'Aucune raison spécifiée',
                timestamp: Date.now(),
                duration: duration,
                expiresAt: duration ? Date.now() + duration : null
            };

            // Notifier l'utilisateur avant le ban
            await this.notifyUser(targetUser, 'ban', reason, duration);

            // Effectuer le ban
            await guild.members.ban(targetUser.id, {
                reason: reason,
                deleteMessageDays: 1 // Supprimer les messages des dernières 24h
            });

            // Ajouter à l'historique
            await this.addToHistory(targetUser.id, 'ban', banData);

            // Programmer l'unban si c'est temporaire
            if (duration) {
                setTimeout(async () => {
                    await this.unbanUser(guild, this.client.user, targetUser, 'Ban temporaire expiré');
                }, duration);
            }

            // Logger l'action
            await this.logModerationAction(guild, 'ban', moderator, targetUser, reason, duration);

            // Mettre à jour les statistiques
            this.updateStats('ban');

            return banData;

        } catch (error) {
            this.logger.error('❌ Erreur lors du ban:', error);
            throw error;
        }
    }

    async unbanUser(guild, moderator, targetUser, reason) {
        try {
            const unbanData = {
                id: `unban_${Date.now()}_${targetUser.id}`,
                userId: targetUser.id,
                moderatorId: moderator.id,
                guildId: guild.id,
                reason: reason || 'Aucune raison spécifiée',
                timestamp: Date.now()
            };

            // Effectuer l'unban
            await guild.members.unban(targetUser.id, reason);

            // Ajouter à l'historique
            await this.addToHistory(targetUser.id, 'unban', unbanData);

            // Logger l'action
            await this.logModerationAction(guild, 'unban', moderator, targetUser, reason);

            // Mettre à jour les statistiques
            this.updateStats('unban');

            return unbanData;

        } catch (error) {
            this.logger.error('❌ Erreur lors de l\'unban:', error);
            throw error;
        }
    }

    async unmuteUser(guild, moderator, targetUser, reason) {
        try {
            const member = await guild.members.fetch(targetUser.id);
            if (!member) throw new Error('Membre non trouvé');

            // Retirer le timeout
            await member.timeout(null, reason);

            // Supprimer des mutes actifs
            this.activeMutes.delete(targetUser.id);

            const unmuteData = {
                id: `unmute_${Date.now()}_${targetUser.id}`,
                userId: targetUser.id,
                moderatorId: moderator.id,
                guildId: guild.id,
                reason: reason || 'Aucune raison spécifiée',
                timestamp: Date.now()
            };

            // Ajouter à l'historique
            await this.addToHistory(targetUser.id, 'unmute', unmuteData);

            // Notifier l'utilisateur
            await this.notifyUser(targetUser, 'unmute', reason);

            // Logger l'action
            await this.logModerationAction(guild, 'unmute', moderator, targetUser, reason);

            return unmuteData;

        } catch (error) {
            this.logger.error('❌ Erreur lors de l\'unmute:', error);
            throw error;
        }
    }

    // ==================== GESTION DES DONNÉES ====================

    async addToHistory(userId, actionType, actionData) {
        if (!this.moderationHistory.has(userId)) {
            this.moderationHistory.set(userId, []);
        }
        
        this.moderationHistory.get(userId).push({
            type: actionType,
            data: actionData,
            timestamp: Date.now()
        });

        // Sauvegarder en DB
        await this.saveModerationHistory(userId);
    }

    async checkAutoActions(guild, targetUser, warningCount) {
        const autoAction = this.config.autoActions[warningCount];
        
        if (!autoAction) return;

        const botMember = guild.members.me;
        
        try {
            switch (autoAction) {
                case 'timeout':
                    await this.muteUser(guild, botMember.user, targetUser, 
                        `Action automatique: ${warningCount} avertissements`, 
                        this.config.timeoutDurations.long);
                    break;
                    
                case 'kick':
                    await this.kickUser(guild, botMember.user, targetUser, 
                        `Action automatique: ${warningCount} avertissements`);
                    break;
                    
                case 'ban':
                    await this.banUser(guild, botMember.user, targetUser, 
                        `Action automatique: ${warningCount} avertissements`);
                    break;
            }
        } catch (error) {
            this.logger.error(`❌ Erreur lors de l'action automatique ${autoAction}:`, error);
        }
    }

    // ==================== NOTIFICATIONS ====================

    async notifyUser(user, actionType, reason, duration = null) {
        try {
            const actionEmojis = {
                warn: '⚠️',
                mute: '🔇',
                kick: '👢',
                ban: '🔨',
                unban: '✅',
                unmute: '🔊'
            };

            const actionNames = {
                warn: 'Avertissement',
                mute: 'Mise en sourdine',
                kick: 'Expulsion',
                ban: 'Bannissement',
                unban: 'Débannissement',
                unmute: 'Fin de sourdine'
            };

            const embed = new EmbedBuilder()
                .setTitle(`${actionEmojis[actionType]} ${actionNames[actionType]}`)
                .setDescription(`Vous avez reçu une sanction de modération.`)
                .addFields(
                    { name: '📝 Raison', value: reason, inline: false }
                )
                .setColor(actionType === 'ban' ? '#ff0000' : actionType === 'kick' ? '#ff8c00' : '#ffff00')
                .setTimestamp();

            if (duration) {
                embed.addFields({
                    name: '⏱️ Durée',
                    value: this.formatDuration(duration),
                    inline: true
                });
            }

            await user.send({ embeds: [embed] });

        } catch (error) {
            this.logger.warn(`⚠️ Impossible de notifier l'utilisateur ${user.tag}:`, error);
        }
    }

    async logModerationAction(guild, actionType, moderator, targetUser, reason, duration = null) {
        try {
            const logChannelId = this.config.logChannels.get(guild.id);
            if (!logChannelId) return;

            const logChannel = guild.channels.cache.get(logChannelId);
            if (!logChannel) return;

            const actionEmojis = {
                warn: '⚠️',
                mute: '🔇',
                kick: '👢',
                ban: '🔨',
                unban: '✅',
                unmute: '🔊'
            };

            const embed = new EmbedBuilder()
                .setTitle(`${actionEmojis[actionType]} Action de modération`)
                .addFields(
                    { name: '👤 Utilisateur', value: `${targetUser.tag} (${targetUser.id})`, inline: true },
                    { name: '🛡️ Modérateur', value: `${moderator.tag} (${moderator.id})`, inline: true },
                    { name: '⚡ Action', value: actionType.toUpperCase(), inline: true },
                    { name: '📝 Raison', value: reason, inline: false }
                )
                .setColor('#3498db')
                .setTimestamp()
                .setFooter({ text: `ID de l'action: ${actionType}_${Date.now()}` });

            if (duration) {
                embed.addFields({
                    name: '⏱️ Durée',
                    value: this.formatDuration(duration),
                    inline: true
                });
            }

            await logChannel.send({ embeds: [embed] });

        } catch (error) {
            this.logger.error('❌ Erreur lors du logging:', error);
        }
    }

    // ==================== UTILITAIRES ====================

    startTimeoutChecker() {
        // Vérifier les timeouts expirés toutes les minutes
        setInterval(async () => {
            const now = Date.now();
            
            for (const [userId, muteData] of this.activeMutes.entries()) {
                if (muteData.expiresAt && now >= muteData.expiresAt) {
                    try {
                        const guild = this.client.guilds.cache.get(muteData.guildId);
                        if (guild) {
                            const user = await this.client.users.fetch(userId);
                            await this.unmuteUser(guild, this.client.user, user, 'Timeout expiré');
                        }
                    } catch (error) {
                        this.logger.error(`❌ Erreur lors de l'unmute automatique pour ${userId}:`, error);
                    }
                }
            }
        }, 60000); // 1 minute
    }

    formatDuration(ms) {
        const seconds = Math.floor((ms / 1000) % 60);
        const minutes = Math.floor((ms / (1000 * 60)) % 60);
        const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
        const days = Math.floor(ms / (1000 * 60 * 60 * 24));

        const parts = [];
        if (days > 0) parts.push(`${days}j`);
        if (hours > 0) parts.push(`${hours}h`);
        if (minutes > 0) parts.push(`${minutes}m`);
        if (seconds > 0) parts.push(`${seconds}s`);

        return parts.join(' ') || '0s';
    }

    updateStats(actionType) {
        this.stats.totalActions++;
        this.stats.actionsToday++;
        this.stats.actionTypes[actionType]++;

        // Réinitialiser les stats quotidiennes si nécessaire
        const currentDate = new Date().toDateString();
        if (this.stats.lastResetDate !== currentDate) {
            this.stats.actionsToday = 1;
            this.stats.lastResetDate = currentDate;
        }
    }

    // ==================== GESTION DES DONNÉES ====================

    async getUserHistory(userId) {
        return this.moderationHistory.get(userId) || [];
    }

    async getUserWarnings(userId) {
        return this.warnings.get(userId) || [];
    }

    async getActiveWarnings(userId) {
        const warnings = this.warnings.get(userId) || [];
        return warnings.filter(w => w.active);
    }

    async clearWarnings(userId, moderatorId, reason) {
        const warnings = this.warnings.get(userId) || [];
        warnings.forEach(warning => warning.active = false);
        
        await this.addToHistory(userId, 'clear_warnings', {
            moderatorId,
            reason,
            clearedCount: warnings.filter(w => w.active).length,
            timestamp: Date.now()
        });
    }

    async getStats() {
        return {
            ...this.stats,
            activeMutes: this.activeMutes.size,
            totalWarnings: Array.from(this.warnings.values()).reduce((total, warnings) => total + warnings.length, 0)
        };
    }

    setLogChannel(guildId, channelId) {
        this.config.logChannels.set(guildId, channelId);
    }

    // ==================== SAUVEGARDE ====================

    async saveModerationHistory(userId) {
        try {
            // TODO: Implémenter la sauvegarde en base de données
            await this.db.saveModerationHistory?.(userId, this.moderationHistory.get(userId));
        } catch (error) {
            this.logger.error('❌ Erreur sauvegarde historique:', error);
        }
    }

    async saveWarnings() {
        try {
            // TODO: Implémenter la sauvegarde en base de données
            await this.db.saveWarnings?.(Array.from(this.warnings.entries()));
        } catch (error) {
            this.logger.error('❌ Erreur sauvegarde avertissements:', error);
        }
    }

    // ==================== PERMISSIONS ====================

    canModerate(moderator, target) {
        // Vérifier que le modérateur peut modérer la cible
        if (moderator.id === target.id) return false;
        if (target.id === moderator.guild.ownerId) return false;
        
        const moderatorMember = moderator.guild.members.cache.get(moderator.id);
        const targetMember = moderator.guild.members.cache.get(target.id);
        
        if (!moderatorMember || !targetMember) return false;
        
        return moderatorMember.roles.highest.position > targetMember.roles.highest.position;
    }

    hasPermission(member, permission) {
        return member.permissions.has(permission);
    }
}
