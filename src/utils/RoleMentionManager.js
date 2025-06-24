import { PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import Logger from './Logger.js';

export class RoleMentionManager {
    constructor(client) {
        this.client = client;
        this.logger = new Logger();
        this.monitoredGuilds = new Map();
        this.autoFixEnabled = new Map();
    }

    /**
     * Initialiser la surveillance pour un serveur
     */
    async initializeGuildMonitoring(guild, options = {}) {
        const config = {
            autoFix: false, // TOUJOURS DÉSACTIVÉ - SÉCURITÉ MAXIMALE
            logChannel: options.logChannel || null,
            notifyAdmins: options.notifyAdmins || true,
            checkInterval: options.checkInterval || 3600000, // 1 heure par défaut
            ...options
        };

        // FORCER LA DÉSACTIVATION DE L'AUTO-FIX POUR LA SÉCURITÉ
        config.autoFix = false;

        this.monitoredGuilds.set(guild.id, config);
        this.autoFixEnabled.set(guild.id, false); // TOUJOURS FALSE

        // Démarrer la surveillance périodique
        this.startPeriodicCheck(guild.id);

        this.logger.info(`Surveillance des mentions de rôles initialisée pour ${guild.name}`);
    }

    /**
     * Vérification périodique des problèmes de mention
     */
    startPeriodicCheck(guildId) {
        const config = this.monitoredGuilds.get(guildId);
        if (!config) return;

        setInterval(async () => {
            try {
                const guild = this.client.guilds.cache.get(guildId);
                if (!guild) return;

                await this.performHealthCheck(guild);
            } catch (error) {
                this.logger.error(`Erreur lors de la vérification périodique pour ${guildId}:`, error);
            }
        }, config.checkInterval);
    }

    /**
     * Effectuer une vérification complète de la santé des mentions
     */
    async performHealthCheck(guild) {
        const issues = await this.detectIssues(guild);
        const config = this.monitoredGuilds.get(guild.id);

        if (issues.length === 0) return;

        // Auto-correction si activée
        if (config.autoFix) {
            const fixes = await this.autoFixIssues(guild, issues);
            await this.logActivity(guild, 'AUTO_FIX', { issues, fixes });
        } else {
            // Notifier les administrateurs
            if (config.notifyAdmins) {
                await this.notifyAdministrators(guild, issues);
            }
            await this.logActivity(guild, 'ISSUES_DETECTED', { issues });
        }
    }

    /**
     * Détecter les problèmes de mention de rôles
     */
    async detectIssues(guild) {
        const issues = [];

        try {
            // 1. Vérifier les rôles non-mentionnables
            const nonMentionableRoles = guild.roles.cache
                .filter(role => !role.mentionable && role.id !== guild.id && !role.managed)
                .map(role => ({
                    type: 'NON_MENTIONABLE_ROLE',
                    roleId: role.id,
                    roleName: role.name,
                    severity: 'MEDIUM'
                }));

            issues.push(...nonMentionableRoles);

            // 2. Vérifier les permissions des salons
            const textChannels = guild.channels.cache.filter(ch => ch.isTextBased());
            
            for (const [channelId, channel] of textChannels) {
                // Vérifier les permissions @everyone
                const everyoneOverwrite = channel.permissionOverwrites.cache.get(guild.id);
                if (everyoneOverwrite && everyoneOverwrite.deny.has(PermissionFlagsBits.MentionEveryone)) {
                    issues.push({
                        type: 'CHANNEL_BLOCKS_MENTIONS',
                        channelId: channel.id,
                        channelName: channel.name,
                        target: '@everyone',
                        severity: 'HIGH'
                    });
                }

                // Vérifier les permissions des rôles
                const roleOverwrites = channel.permissionOverwrites.cache.filter(overwrite => 
                    overwrite.type === 0 && overwrite.deny.has(PermissionFlagsBits.MentionEveryone)
                );

                for (const [overwriteId, overwrite] of roleOverwrites) {
                    const role = guild.roles.cache.get(overwriteId);
                    if (role) {
                        issues.push({
                            type: 'CHANNEL_BLOCKS_ROLE_MENTIONS',
                            channelId: channel.id,
                            channelName: channel.name,
                            roleId: role.id,
                            roleName: role.name,
                            severity: 'MEDIUM'
                        });
                    }
                }
            }

            // 3. Vérifier la hiérarchie des rôles
            const adminRoles = guild.roles.cache.filter(role => 
                role.permissions.has(PermissionFlagsBits.Administrator)
            );

            const mentionRoles = guild.roles.cache.filter(role => 
                role.permissions.has(PermissionFlagsBits.MentionEveryone)
            );

            if (mentionRoles.size === 0 && adminRoles.size > 0) {
                issues.push({
                    type: 'NO_MENTION_ROLES',
                    severity: 'LOW',
                    suggestion: 'Créer un rôle avec permission de mention'
                });
            }

        } catch (error) {
            this.logger.error(`Erreur lors de la détection des problèmes pour ${guild.name}:`, error);
        }

        return issues;
    }

    /**
     * Correction automatique des problèmes détectés
     */
    async autoFixIssues(guild, issues) {
        const fixes = [];

        for (const issue of issues) {
            try {
                switch (issue.type) {
                    case 'NON_MENTIONABLE_ROLE':
                        const role = guild.roles.cache.get(issue.roleId);
                        if (role) {
                            await role.setMentionable(true, 'Auto-correction RoleMentionManager');
                            fixes.push({
                                type: 'ROLE_MADE_MENTIONABLE',
                                roleId: issue.roleId,
                                roleName: issue.roleName
                            });
                        }
                        break;

                    case 'CHANNEL_BLOCKS_MENTIONS':
                        const channel = guild.channels.cache.get(issue.channelId);
                        if (channel) {
                            await channel.permissionOverwrites.edit(guild.id, {
                                MentionEveryone: null
                            }, 'Auto-correction RoleMentionManager');
                            fixes.push({
                                type: 'CHANNEL_PERMISSIONS_FIXED',
                                channelId: issue.channelId,
                                channelName: issue.channelName
                            });
                        }
                        break;

                    case 'CHANNEL_BLOCKS_ROLE_MENTIONS':
                        const targetChannel = guild.channels.cache.get(issue.channelId);
                        if (targetChannel) {
                            await targetChannel.permissionOverwrites.edit(issue.roleId, {
                                MentionEveryone: null
                            }, 'Auto-correction RoleMentionManager');
                            fixes.push({
                                type: 'ROLE_CHANNEL_PERMISSIONS_FIXED',
                                channelId: issue.channelId,
                                roleId: issue.roleId
                            });
                        }
                        break;

                    case 'NO_MENTION_ROLES':
                        // Créer un rôle "Mention Master" si nécessaire
                        const existingRole = guild.roles.cache.find(r => r.name === 'Mention Master');
                        if (!existingRole) {
                            await guild.roles.create({
                                name: 'Mention Master',
                                color: '#00ff00',
                                permissions: [PermissionFlagsBits.MentionEveryone],
                                reason: 'Auto-création RoleMentionManager'
                            });
                            fixes.push({
                                type: 'MENTION_ROLE_CREATED',
                                roleName: 'Mention Master'
                            });
                        }
                        break;
                }
            } catch (error) {
                this.logger.error(`Erreur lors de la correction automatique:`, error);
                fixes.push({
                    type: 'FIX_FAILED',
                    issue: issue.type,
                    error: error.message
                });
            }
        }

        return fixes;
    }

    /**
     * Notifier les administrateurs des problèmes détectés
     */
    async notifyAdministrators(guild, issues) {
        const config = this.monitoredGuilds.get(guild.id);
        
        // Trouver le salon de log ou un salon par défaut
        let logChannel = null;
        if (config.logChannel) {
            logChannel = guild.channels.cache.get(config.logChannel);
        }
        
        if (!logChannel) {
            // Chercher un salon "logs" ou "admin"
            logChannel = guild.channels.cache.find(ch => 
                ch.isTextBased() && 
                (ch.name.includes('log') || ch.name.includes('admin'))
            );
        }

        if (!logChannel) {
            // Utiliser le salon système ou le premier salon disponible
            logChannel = guild.systemChannel || 
                        guild.channels.cache.find(ch => ch.isTextBased());
        }

        if (!logChannel) return;

        const embed = new EmbedBuilder()
            .setColor('#ff6b6b')
            .setTitle('⚠️ PROBLÈMES DE MENTION DE RÔLES DÉTECTÉS')
            .setDescription(`${issues.length} problème(s) détecté(s) sur le serveur`)
            .setTimestamp();

        // Grouper les problèmes par type
        const groupedIssues = issues.reduce((acc, issue) => {
            if (!acc[issue.type]) acc[issue.type] = [];
            acc[issue.type].push(issue);
            return acc;
        }, {});

        for (const [type, typeIssues] of Object.entries(groupedIssues)) {
            let fieldName = '';
            let fieldValue = '';

            switch (type) {
                case 'NON_MENTIONABLE_ROLE':
                    fieldName = '🎭 Rôles non-mentionnables';
                    fieldValue = typeIssues.map(i => `• ${i.roleName}`).join('\n');
                    break;
                case 'CHANNEL_BLOCKS_MENTIONS':
                    fieldName = '🚫 Salons bloquant les mentions';
                    fieldValue = typeIssues.map(i => `• ${i.channelName}`).join('\n');
                    break;
                case 'CHANNEL_BLOCKS_ROLE_MENTIONS':
                    fieldName = '🔒 Permissions de salon restrictives';
                    fieldValue = typeIssues.map(i => `• ${i.roleName} dans ${i.channelName}`).join('\n');
                    break;
                case 'NO_MENTION_ROLES':
                    fieldName = '❓ Aucun rôle de mention';
                    fieldValue = 'Aucun rôle avec permission de mention détecté';
                    break;
            }

            if (fieldValue.length > 1024) {
                fieldValue = fieldValue.substring(0, 1000) + '...';
            }

            embed.addFields({
                name: fieldName,
                value: fieldValue,
                inline: false
            });
        }

        embed.addFields({
            name: '🔧 Actions recommandées',
            value: '• Utilisez `/fix-role-mentions auto-fix:true` pour corriger automatiquement\n' +
                   '• Ou utilisez `/check-role-mentions` pour un diagnostic détaillé\n' +
                   '• Activez la correction automatique avec `/setup-role-monitoring`',
            inline: false
        });

        try {
            await logChannel.send({ embeds: [embed] });
        } catch (error) {
            this.logger.error(`Impossible d'envoyer la notification dans ${guild.name}:`, error);
        }
    }

    /**
     * Enregistrer l'activité
     */
    async logActivity(guild, action, data) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            guildId: guild.id,
            guildName: guild.name,
            action,
            data
        };

        this.logger.info(`RoleMentionManager - ${action}:`, logEntry);

        // Sauvegarder dans un fichier de log spécifique si nécessaire
        // Vous pouvez étendre cette fonction pour sauvegarder dans une base de données
    }

    /**
     * Obtenir les statistiques de surveillance
     */
    getMonitoringStats(guildId) {
        const config = this.monitoredGuilds.get(guildId);
        if (!config) return null;

        return {
            isMonitored: true,
            autoFixEnabled: this.autoFixEnabled.get(guildId),
            checkInterval: config.checkInterval,
            logChannel: config.logChannel,
            notifyAdmins: config.notifyAdmins
        };
    }

    /**
     * Arrêter la surveillance pour un serveur
     */
    stopMonitoring(guildId) {
        this.monitoredGuilds.delete(guildId);
        this.autoFixEnabled.delete(guildId);
        this.logger.info(`Surveillance arrêtée pour le serveur ${guildId}`);
    }

    /**
     * Vérification manuelle rapide
     */
    async quickCheck(guild) {
        const issues = await this.detectIssues(guild);
        return {
            hasIssues: issues.length > 0,
            issueCount: issues.length,
            issues: issues,
            severity: this.calculateSeverity(issues)
        };
    }

    /**
     * Calculer la sévérité globale des problèmes
     */
    calculateSeverity(issues) {
        if (issues.length === 0) return 'NONE';
        
        const severities = issues.map(i => i.severity);
        if (severities.includes('HIGH')) return 'HIGH';
        if (severities.includes('MEDIUM')) return 'MEDIUM';
        return 'LOW';
    }
}

export default RoleMentionManager;
