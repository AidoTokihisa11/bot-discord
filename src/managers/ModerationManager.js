import fs from 'fs/promises';
import path from 'path';
import { PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import Logger from '../utils/Logger.js';
import AccessRestriction from '../utils/AccessRestriction.js';

export default class ModerationManager {
    constructor(client) {
        this.client = client;
        this.logger = new Logger();
        this.accessRestriction = new AccessRestriction();
        
        // Stockage en mémoire
        this.warnings = new Map(); // userId -> Array of warnings
        this.moderationHistory = new Map(); // userId -> Array of actions
        this.activeMutes = new Map(); // userId -> mute data
        this.activeBans = new Map(); // userId -> ban data
        
        // Configuration
        this.config = {
            maxWarnings: 5,
            autoMuteThreshold: 3,
            autoKickThreshold: 4,
            autoBanThreshold: 5,
            muteDurations: {
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
            await this.loadData();
            this.logger.success('🛡️ ModerationManager initialisé avec succès');
            
            // Réinitialiser les stats quotidiennes si nécessaire
            const today = new Date().toDateString();
            if (this.stats.lastResetDate !== today) {
                this.stats.actionsToday = 0;
                this.stats.lastResetDate = today;
                await this.saveStats();
            }
            
            // Nettoyer les mutes expirés
            this.startMuteCleanup();
            
        } catch (error) {
            this.logger.error('Erreur lors de l\'initialisation du ModerationManager:', error);
        }
    }

    // ==================== SYSTÈME D'AVERTISSEMENTS ====================

    async warnUser(guild, moderator, targetUser, reason) {
        try {
            if (!this.canModerate(moderator, targetUser)) {
                throw new Error('Permissions insuffisantes pour modérer cet utilisateur.');
            }

            const warning = {
                id: this.generateId(),
                userId: targetUser.id,
                moderatorId: moderator.id,
                moderator: moderator.tag,
                reason: reason,
                timestamp: Date.now(),
                active: true,
                guildId: guild.id
            };

            // Ajouter l'avertissement
            if (!this.warnings.has(targetUser.id)) {
                this.warnings.set(targetUser.id, []);
            }
            this.warnings.get(targetUser.id).push(warning);

            // Ajouter à l'historique
            await this.addToHistory(targetUser.id, 'warn', {
                id: warning.id,
                moderator: moderator.tag,
                reason: reason,
                timestamp: warning.timestamp
            });

            // Mettre à jour les statistiques
            this.updateStats('warn');

            // Vérifier les actions automatiques
            await this.checkAutoModeration(guild, targetUser);

            // Sauvegarder
            await this.saveWarnings();

            // Log dans le canal de modération
            await this.logAction(guild, 'warn', {
                moderator: moderator,
                target: targetUser,
                reason: reason,
                warningId: warning.id
            });

            this.logger.info(`⚠️ Avertissement donné: ${targetUser.tag} par ${moderator.tag} - ${reason}`);

            return warning;

        } catch (error) {
            this.logger.error('Erreur lors de l\'avertissement:', error);
            throw error;
        }
    }

    async clearUserWarnings(userId) {
        if (!this.warnings.has(userId)) {
            return 0;
        }

        const warnings = this.warnings.get(userId);
        const activeCount = warnings.filter(w => w.active).length;

        // Marquer tous les avertissements comme inactifs
        warnings.forEach(warning => {
            warning.active = false;
            warning.clearedAt = Date.now();
        });

        await this.saveWarnings();
        this.logger.info(`🧹 ${activeCount} avertissement(s) effacés pour l'utilisateur ${userId}`);

        return activeCount;
    }

    // ==================== SYSTÈME DE MUTE ====================

    async muteUser(guild, moderator, targetUser, reason, duration = 3600000) {
        try {
            if (!this.canModerate(moderator, targetUser)) {
                throw new Error('Permissions insuffisantes pour modérer cet utilisateur.');
            }

            const member = await guild.members.fetch(targetUser.id);
            if (!member) {
                throw new Error('Utilisateur non trouvé sur le serveur.');
            }

            // Appliquer le timeout Discord
            await member.timeout(duration, reason);

            const muteData = {
                id: this.generateId(),
                userId: targetUser.id,
                moderatorId: moderator.id,
                moderator: moderator.tag,
                reason: reason,
                timestamp: Date.now(),
                duration: duration,
                expiresAt: Date.now() + duration,
                guildId: guild.id,
                active: true
            };

            this.activeMutes.set(targetUser.id, muteData);

            // Ajouter à l'historique
            await this.addToHistory(targetUser.id, 'mute', {
                id: muteData.id,
                moderator: moderator.tag,
                reason: reason,
                duration: duration,
                timestamp: muteData.timestamp
            });

            // Mettre à jour les statistiques
            this.updateStats('mute');

            // Sauvegarder
            await this.saveModerationHistory(targetUser.id);

            // Log dans le canal de modération
            await this.logAction(guild, 'mute', {
                moderator: moderator,
                target: targetUser,
                reason: reason,
                duration: duration,
                muteId: muteData.id
            });

            this.logger.info(`🔇 Mute appliqué: ${targetUser.tag} par ${moderator.tag} - ${this.formatDuration(duration)}`);

            return muteData;

        } catch (error) {
            this.logger.error('Erreur lors du mute:', error);
            throw error;
        }
    }

    async unmuteUser(guild, moderator, targetUser, reason = 'Mute levé') {
        try {
            const member = await guild.members.fetch(targetUser.id);
            if (!member) {
                throw new Error('Utilisateur non trouvé sur le serveur.');
            }

            // Retirer le timeout Discord
            await member.timeout(null, reason);

            // Retirer des mutes actifs
            const muteData = this.activeMutes.get(targetUser.id);
            if (muteData) {
                muteData.active = false;
                muteData.unmuteTimestamp = Date.now();
                muteData.unmuteModerator = moderator.tag;
                this.activeMutes.delete(targetUser.id);
            }

            const unmuteData = {
                id: this.generateId(),
                userId: targetUser.id,
                moderatorId: moderator.id,
                moderator: moderator.tag,
                reason: reason,
                timestamp: Date.now(),
                guildId: guild.id
            };

            // Ajouter à l'historique
            await this.addToHistory(targetUser.id, 'unmute', {
                id: unmuteData.id,
                moderator: moderator.tag,
                reason: reason,
                timestamp: unmuteData.timestamp
            });

            // Log dans le canal de modération
            await this.logAction(guild, 'unmute', {
                moderator: moderator,
                target: targetUser,
                reason: reason
            });

            this.logger.info(`🔊 Unmute appliqué: ${targetUser.tag} par ${moderator.tag}`);

            return unmuteData;

        } catch (error) {
            this.logger.error('Erreur lors de l\'unmute:', error);
            throw error;
        }
    }

    // ==================== SYSTÈME DE KICK ====================

    async kickUser(guild, moderator, targetUser, reason) {
        try {
            if (!this.canModerate(moderator, targetUser)) {
                throw new Error('Permissions insuffisantes pour modérer cet utilisateur.');
            }

            const member = await guild.members.fetch(targetUser.id);
            if (!member) {
                throw new Error('Utilisateur non trouvé sur le serveur.');
            }

            // Effectuer le kick
            await member.kick(reason);

            const kickData = {
                id: this.generateId(),
                userId: targetUser.id,
                moderatorId: moderator.id,
                moderator: moderator.tag,
                reason: reason,
                timestamp: Date.now(),
                guildId: guild.id
            };

            // Ajouter à l'historique
            await this.addToHistory(targetUser.id, 'kick', {
                id: kickData.id,
                moderator: moderator.tag,
                reason: reason,
                timestamp: kickData.timestamp
            });

            // Mettre à jour les statistiques
            this.updateStats('kick');

            // Log dans le canal de modération
            await this.logAction(guild, 'kick', {
                moderator: moderator,
                target: targetUser,
                reason: reason,
                kickId: kickData.id
            });

            this.logger.info(`👢 Kick appliqué: ${targetUser.tag} par ${moderator.tag} - ${reason}`);

            return kickData;

        } catch (error) {
            this.logger.error('Erreur lors du kick:', error);
            throw error;
        }
    }

    // ==================== SYSTÈME DE BAN ====================

    async banUser(guild, moderator, targetUser, reason, duration = null) {
        try {
            if (!this.canModerate(moderator, targetUser)) {
                throw new Error('Permissions insuffisantes pour modérer cet utilisateur.');
            }

            // Effectuer le ban
            await guild.members.ban(targetUser.id, { reason: reason });

            const banData = {
                id: this.generateId(),
                userId: targetUser.id,
                moderatorId: moderator.id,
                moderator: moderator.tag,
                reason: reason,
                timestamp: Date.now(),
                duration: duration,
                expiresAt: duration ? Date.now() + duration : null,
                guildId: guild.id,
                active: true,
                permanent: !duration
            };

            this.activeBans.set(targetUser.id, banData);

            // Ajouter à l'historique
            await this.addToHistory(targetUser.id, 'ban', {
                id: banData.id,
                moderator: moderator.tag,
                reason: reason,
                duration: duration,
                timestamp: banData.timestamp,
                permanent: !duration
            });

            // Mettre à jour les statistiques
            this.updateStats('ban');

            // Log dans le canal de modération
            await this.logAction(guild, 'ban', {
                moderator: moderator,
                target: targetUser,
                reason: reason,
                duration: duration,
                banId: banData.id
            });

            this.logger.info(`🔨 Ban appliqué: ${targetUser.tag} par ${moderator.tag} - ${reason} ${duration ? `(${this.formatDuration(duration)})` : '(permanent)'}`);

            return banData;

        } catch (error) {
            this.logger.error('Erreur lors du ban:', error);
            throw error;
        }
    }

    async unbanUser(guild, moderator, userId, reason = 'Unban') {
        try {
            // Effectuer l'unban
            await guild.members.unban(userId, reason);

            // Retirer des bans actifs
            const banData = this.activeBans.get(userId);
            if (banData) {
                banData.active = false;
                banData.unbanTimestamp = Date.now();
                banData.unbanModerator = moderator.tag;
                this.activeBans.delete(userId);
            }

            const unbanData = {
                id: this.generateId(),
                userId: userId,
                moderatorId: moderator.id,
                moderator: moderator.tag,
                reason: reason,
                timestamp: Date.now(),
                guildId: guild.id
            };

            // Ajouter à l'historique
            await this.addToHistory(userId, 'unban', {
                id: unbanData.id,
                moderator: moderator.tag,
                reason: reason,
                timestamp: unbanData.timestamp
            });

            // Mettre à jour les statistiques
            this.updateStats('unban');

            // Log dans le canal de modération
            await this.logAction(guild, 'unban', {
                moderator: moderator,
                targetId: userId,
                reason: reason
            });

            this.logger.info(`✅ Unban appliqué: ${userId} par ${moderator.tag}`);

            return unbanData;

        } catch (error) {
            this.logger.error('Erreur lors de l\'unban:', error);
            throw error;
        }
    }

    // ==================== HISTORIQUE ET DONNÉES ====================

    async getUserHistory(userId) {
        return this.moderationHistory.get(userId) || [];
    }

    async getUserWarnings(userId) {
        return this.warnings.get(userId) || [];
    }

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

    // ==================== MODÉRATION AUTOMATIQUE ====================

    async checkAutoModeration(guild, targetUser) {
        const warnings = this.getUserWarnings(targetUser.id);
        const activeWarnings = warnings.filter(w => w.active);
        const warningCount = activeWarnings.length;

        if (warningCount >= this.config.autoBanThreshold) {
            await this.banUser(guild, this.client.user, targetUser, 
                `Bannissement automatique - ${warningCount} avertissements actifs`);
        } else if (warningCount >= this.config.autoKickThreshold) {
            await this.kickUser(guild, this.client.user, targetUser, 
                `Expulsion automatique - ${warningCount} avertissements actifs`);
        } else if (warningCount >= this.config.autoMuteThreshold) {
            await this.muteUser(guild, this.client.user, targetUser, 
                `Mute automatique - ${warningCount} avertissements actifs`, 
                this.config.muteDurations.medium);
        }
    }

    // ==================== LOGS ET NOTIFICATIONS ====================

    async logAction(guild, actionType, data) {
        const logChannelId = this.config.logChannels.get(guild.id);
        if (!logChannelId) return;

        const logChannel = guild.channels.cache.get(logChannelId);
        if (!logChannel) return;

        const embed = new EmbedBuilder()
            .setTitle(`📋 Action de modération - ${actionType.toUpperCase()}`)
            .setColor(this.getActionColor(actionType))
            .setTimestamp();

        switch (actionType) {
            case 'warn':
                embed.setDescription(`⚠️ **Avertissement donné**`)
                    .addFields(
                        { name: '👤 Utilisateur', value: `${data.target.tag} (${data.target.id})`, inline: true },
                        { name: '🛡️ Modérateur', value: `${data.moderator.tag}`, inline: true },
                        { name: '📝 Raison', value: data.reason, inline: false }
                    );
                break;

            case 'mute':
                embed.setDescription(`🔇 **Mute appliqué**`)
                    .addFields(
                        { name: '👤 Utilisateur', value: `${data.target.tag} (${data.target.id})`, inline: true },
                        { name: '🛡️ Modérateur', value: `${data.moderator.tag}`, inline: true },
                        { name: '⏱️ Durée', value: this.formatDuration(data.duration), inline: true },
                        { name: '📝 Raison', value: data.reason, inline: false }
                    );
                break;

            case 'kick':
                embed.setDescription(`👢 **Expulsion effectuée**`)
                    .addFields(
                        { name: '👤 Utilisateur', value: `${data.target.tag} (${data.target.id})`, inline: true },
                        { name: '🛡️ Modérateur', value: `${data.moderator.tag}`, inline: true },
                        { name: '📝 Raison', value: data.reason, inline: false }
                    );
                break;

            case 'ban':
                embed.setDescription(`🔨 **Bannissement effectué**`)
                    .addFields(
                        { name: '👤 Utilisateur', value: `${data.target.tag} (${data.target.id})`, inline: true },
                        { name: '🛡️ Modérateur', value: `${data.moderator.tag}`, inline: true },
                        { name: '⏱️ Durée', value: data.duration ? this.formatDuration(data.duration) : 'Permanent', inline: true },
                        { name: '📝 Raison', value: data.reason, inline: false }
                    );
                break;

            case 'unban':
                embed.setDescription(`✅ **Débannissement effectué**`)
                    .addFields(
                        { name: '🆔 Utilisateur ID', value: data.targetId, inline: true },
                        { name: '🛡️ Modérateur', value: `${data.moderator.tag}`, inline: true },
                        { name: '📝 Raison', value: data.reason, inline: false }
                    );
                break;

            case 'unmute':
                embed.setDescription(`🔊 **Unmute effectué**`)
                    .addFields(
                        { name: '👤 Utilisateur', value: `${data.target.tag} (${data.target.id})`, inline: true },
                        { name: '🛡️ Modérateur', value: `${data.moderator.tag}`, inline: true },
                        { name: '📝 Raison', value: data.reason, inline: false }
                    );
                break;
        }

        try {
            await logChannel.send({ embeds: [embed] });
        } catch (error) {
            this.logger.error('Erreur lors de l\'envoi du log:', error);
        }
    }

    // ==================== STATISTIQUES ====================

    async getStats() {
        const activeMutes = this.activeMutes.size;
        const totalWarnings = Array.from(this.warnings.values())
            .flat()
            .filter(w => w.active).length;

        return {
            ...this.stats,
            activeMutes,
            totalWarnings
        };
    }

    updateStats(actionType) {
        this.stats.totalActions++;
        this.stats.actionsToday++;
        this.stats.actionTypes[actionType]++;
        this.saveStats();
    }

    // ==================== NETTOYAGE AUTOMATIQUE ====================

    startMuteCleanup() {
        setInterval(() => {
            this.cleanupExpiredMutes();
        }, 60000); // Vérifier chaque minute
    }

    async cleanupExpiredMutes() {
        const now = Date.now();
        const expiredMutes = [];

        for (const [userId, muteData] of this.activeMutes) {
            if (muteData.expiresAt && muteData.expiresAt <= now) {
                expiredMutes.push(userId);
            }
        }

        for (const userId of expiredMutes) {
            this.activeMutes.delete(userId);
        }

        if (expiredMutes.length > 0) {
            this.logger.info(`🧹 ${expiredMutes.length} mute(s) expiré(s) nettoyé(s)`);
        }
    }

    // ==================== CONFIGURATION ====================

    setLogChannel(guildId, channelId) {
        this.config.logChannels.set(guildId, channelId);
        this.saveConfig();
    }

    // ==================== SAUVEGARDE ====================

    async saveModerationHistory(userId) {
        try {
            const dataDir = path.join(process.cwd(), 'data', 'moderation');
            await fs.mkdir(dataDir, { recursive: true });
            
            const history = this.moderationHistory.get(userId) || [];
            await fs.writeFile(
                path.join(dataDir, `history_${userId}.json`),
                JSON.stringify(history, null, 2)
            );
        } catch (error) {
            this.logger.error('Erreur lors de la sauvegarde de l\'historique:', error);
        }
    }

    async saveWarnings() {
        try {
            const dataDir = path.join(process.cwd(), 'data', 'moderation');
            await fs.mkdir(dataDir, { recursive: true });
            
            const warningsData = Object.fromEntries(this.warnings);
            await fs.writeFile(
                path.join(dataDir, 'warnings.json'),
                JSON.stringify(warningsData, null, 2)
            );
        } catch (error) {
            this.logger.error('Erreur lors de la sauvegarde des avertissements:', error);
        }
    }

    async saveStats() {
        try {
            const dataDir = path.join(process.cwd(), 'data', 'moderation');
            await fs.mkdir(dataDir, { recursive: true });
            
            await fs.writeFile(
                path.join(dataDir, 'stats.json'),
                JSON.stringify(this.stats, null, 2)
            );
        } catch (error) {
            this.logger.error('Erreur lors de la sauvegarde des stats:', error);
        }
    }

    async saveConfig() {
        try {
            const dataDir = path.join(process.cwd(), 'data', 'moderation');
            await fs.mkdir(dataDir, { recursive: true });
            
            const configData = {
                ...this.config,
                logChannels: Object.fromEntries(this.config.logChannels)
            };
            
            await fs.writeFile(
                path.join(dataDir, 'config.json'),
                JSON.stringify(configData, null, 2)
            );
        } catch (error) {
            this.logger.error('Erreur lors de la sauvegarde de la config:', error);
        }
    }

    async loadData() {
        try {
            const dataDir = path.join(process.cwd(), 'data', 'moderation');
            
            // Charger les avertissements
            try {
                const warningsData = await fs.readFile(path.join(dataDir, 'warnings.json'), 'utf8');
                const warnings = JSON.parse(warningsData);
                this.warnings = new Map(Object.entries(warnings));
            } catch (error) {
                // Fichier n'existe pas encore
            }

            // Charger les stats
            try {
                const statsData = await fs.readFile(path.join(dataDir, 'stats.json'), 'utf8');
                this.stats = { ...this.stats, ...JSON.parse(statsData) };
            } catch (error) {
                // Fichier n'existe pas encore
            }

            // Charger la config
            try {
                const configData = await fs.readFile(path.join(dataDir, 'config.json'), 'utf8');
                const config = JSON.parse(configData);
                this.config = { ...this.config, ...config };
                if (config.logChannels) {
                    this.config.logChannels = new Map(Object.entries(config.logChannels));
                }
            } catch (error) {
                // Fichier n'existe pas encore
            }

        } catch (error) {
            this.logger.error('Erreur lors du chargement des données:', error);
        }
    }

    // ==================== PERMISSIONS ====================

    canModerate(moderator, target) {
        if (moderator.id === target.id) return false;
        
        // Vérifier si le modérateur a les permissions
        if (!moderator.permissions?.has(PermissionFlagsBits.ModerateMembers)) {
            return false;
        }

        // Les bots ne peuvent pas modérer d'autres bots (sauf cas spéciaux)
        if (target.bot && moderator.bot) return false;

        return true;
    }

    hasPermission(member, permission) {
        return member.permissions.has(permission);
    }

    // ==================== UTILITAIRES ====================

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    formatDuration(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days}j ${hours % 24}h`;
        if (hours > 0) return `${hours}h ${minutes % 60}m`;
        if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
        return `${seconds}s`;
    }

    getActionColor(actionType) {
        const colors = {
            'warn': '#ffaa00',
            'mute': '#ff8c00',
            'kick': '#ff6600',
            'ban': '#ff0000',
            'unban': '#00ff00',
            'unmute': '#00ff00'
        };
        return colors[actionType] || '#3498db';
    }
}
