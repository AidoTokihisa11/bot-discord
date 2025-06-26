import Logger from '../utils/Logger.js';
import { PermissionFlagsBits } from 'discord.js';

export default class GamingRoleManager {
    constructor(client) {
        this.client = client;
        this.logger = new Logger();
        this.cooldowns = new Map(); // Cooldown pour les changements de rôles
        this.COOLDOWN_TIME = 30000; // 30 secondes de cooldown
        
        // Configuration des jeux avec leurs rôles et salons spécifiques
        this.GAMING_CONFIG = {
            'cod': {
                name: 'Call Of Duty',
                emoji: '🔫',
                roleId: '1387537951105351721',
                categoryId: '1368964121873350706',
                color: 0x8B4513,
                description: 'Accès aux salons Call of Duty',
                channels: [
                    '1368964295181992079', // Actu COD
                    '1368964553630679120', // Recrutement Fun
                    '1368965572322267176', // Game Public
                    '1368969082376028180', // Vocal : COD Public 1
                    '1369002662346887248'  // Vocal : COD Public 2
                ]
            },
            'valorant': {
                name: 'Valorant',
                emoji: '🎯',
                roleId: '1387538423140581488',
                categoryId: '1368971968430215199',
                color: 0xFF4655,
                description: 'Accès aux salons Valorant',
                channels: [
                    '1368999671652941885', // Actu Valorant
                    '1369680014605422672', // Général Valorant
                    '1369000102378602636', // Recrutement Fun
                    '1369367480736288768', // Game Valo Public
                    '1369001216016650392', // Vocal : Valo Public 1
                    '1369049978600951878'  // Vocal : Valo Public 2
                ]
            },
            'fortnite': {
                name: 'Fortnite',
                emoji: '🏗️',
                roleId: '1387538536965607566',
                categoryId: '1369622958208979005',
                color: 0x9146FF,
                description: 'Accès aux salons Fortnite',
                channels: [
                    '1369623153755557938', // Actu Fortnite
                    '1369623864836882452', // Recrutement Fun
                    '1369670288270426302', // Général Fortnite
                    '1369635083119755274', // Vocal : Fortnite Public 1
                    '1369635557277171783'  // Vocal : Fortnite Public 2
                ]
            },
            'eafc': {
                name: 'EA FC',
                emoji: '⚽',
                roleId: '1387539408269479987',
                categoryId: '1369048320957219058',
                color: 0x00D4AA,
                description: 'Accès aux salons EA FC',
                channels: [
                    '1369049143821078729', // Actu EA
                    '1369058455398252725', // Général EA
                    '1369060858080264233', // Voc EA FC Public 1
                    '1369060872860995687'  // Voc EA FC Public 2
                ]
            },
            'rocketleague': {
                name: 'Rocket League',
                emoji: '🚗',
                roleId: '1387541367290593362',
                categoryId: '1369713493015662622',
                color: 0xFF6B35,
                description: 'Accès aux salons Rocket League',
                channels: [
                    '1369713822113202266', // Actu RL
                    '1369715320927027271', // Recrutement Fun
                    '1369720064101584976', // Général RL
                    '1369721260397039747'  // Vocal : Voc Public
                ]
            },
            'nintendo': {
                name: 'Nintendo',
                emoji: '🎮',
                roleId: '1387543141908746331',
                categoryId: '1369032240750919681',
                color: 0xE60012,
                description: 'Accès aux salons Nintendo',
                channels: [
                    '1369043936198525020', // Actu Nintendo
                    '1369044243846533250', // Chat Général
                    '1369594886126440510', // Game Public
                    '1369600162493890641', // Vocal : Nintendo Public 1
                    '1369600111721578526'  // Vocal : Nintendo Public 2
                ]
            },
            'lol': {
                name: 'League of Legends',
                emoji: '⚔️',
                roleId: '1387754269158936576', // ID du rôle LOL fourni
                categoryId: '1387753953395212308',
                color: 0x0F2027,
                description: 'Accès aux salons League of Legends',
                disabled: false, // Activé maintenant que le rôle existe
                channels: [
                    '1387757965397856386', // Actu LOL
                    '1387778438487605279', // Général LOL
                    '1387778742817915062', // Game Public
                    '1387789312808063097'  // Voc Public LOL
                ]
            }
        };
    }

    /**
     * Initialise le gestionnaire de rôles gaming
     */
    async initialize() {
        try {
            await this.initializeDatabase();
            this.logger.success('✅ Gestionnaire de rôles gaming initialisé');
        } catch (error) {
            this.logger.error('❌ Erreur lors de l\'initialisation du gestionnaire gaming:', error);
        }
    }

    /**
     * Initialise la structure de base de données
     */
    async initializeDatabase() {
        if (!this.client.db.data.gamingRoles) {
            this.client.db.data.gamingRoles = {
                stats: {},
                userActions: [],
                cooldowns: {},
                settings: {
                    cooldownEnabled: true,
                    cooldownTime: 30000,
                    notificationsEnabled: true,
                    autoHideChannels: true
                }
            };
            await this.client.db.save();
        }
    }

    /**
     * Vérifie si un utilisateur est en cooldown
     */
    isUserOnCooldown(userId) {
        const cooldownKey = `gaming_${userId}`;
        const cooldownEnd = this.cooldowns.get(cooldownKey);
        
        if (!cooldownEnd) return false;
        
        if (Date.now() >= cooldownEnd) {
            this.cooldowns.delete(cooldownKey);
            return false;
        }
        
        return true;
    }

    /**
     * Applique un cooldown à un utilisateur
     */
    applyCooldown(userId) {
        const cooldownKey = `gaming_${userId}`;
        this.cooldowns.set(cooldownKey, Date.now() + this.COOLDOWN_TIME);
    }

    /**
     * Obtient le temps restant du cooldown
     */
    getCooldownTimeLeft(userId) {
        const cooldownKey = `gaming_${userId}`;
        const cooldownEnd = this.cooldowns.get(cooldownKey);
        
        if (!cooldownEnd) return 0;
        
        const timeLeft = cooldownEnd - Date.now();
        return Math.max(0, Math.ceil(timeLeft / 1000));
    }

    /**
     * Traite l'ajout d'un rôle gaming
     */
    async handleRoleAdd(reaction, user, gameKey) {
        try {
            const gameConfig = this.GAMING_CONFIG[gameKey];
            if (!gameConfig || gameConfig.disabled) return false;

            const guild = reaction.message.guild;
            const member = guild.members.cache.get(user.id);
            
            if (!member) return false;

            // Vérifier le cooldown
            if (this.isUserOnCooldown(user.id)) {
                const timeLeft = this.getCooldownTimeLeft(user.id);
                
                try {
                    await user.send(`⏰ **Cooldown actif**\n\nVous devez attendre encore **${timeLeft} secondes** avant de pouvoir changer de rôles gaming.`);
                } catch (dmError) {
                    this.logger.warn(`Impossible d'envoyer un MP à ${user.tag}`);
                }
                
                // Retirer la réaction
                try {
                    await reaction.users.remove(user.id);
                } catch (removeError) {
                    this.logger.warn('Impossible de retirer la réaction');
                }
                return false;
            }

            // Récupérer le rôle
            const role = guild.roles.cache.get(gameConfig.roleId);
            if (!role) {
                this.logger.error(`Rôle gaming introuvable: ${gameConfig.name} (${gameConfig.roleId})`);
                return false;
            }

            // Vérifier si l'utilisateur a déjà le rôle
            if (member.roles.cache.has(gameConfig.roleId)) {
                return true; // Déjà possédé, pas d'action nécessaire
            }

            // Ajouter le rôle
            await member.roles.add(role, `Rôle gaming: ${gameConfig.name}`);
            
            // Appliquer le cooldown
            this.applyCooldown(user.id);
            
            // Gérer la visibilité des salons
            await this.updateChannelVisibility(member, gameKey, 'add');
            
            // Enregistrer les statistiques
            await this.recordAction(user.id, guild.id, gameKey, 'add');
            
            // Envoyer une notification
            await this.sendRoleNotification(user, guild, gameConfig, 'add');
            
            this.logger.info(`🎮 Rôle ${gameConfig.name} ajouté à ${user.tag}`);
            return true;

        } catch (error) {
            this.logger.error(`Erreur lors de l'ajout du rôle gaming ${gameKey}:`, error);
            return false;
        }
    }

    /**
     * Traite la suppression d'un rôle gaming
     */
    async handleRoleRemove(reaction, user, gameKey) {
        try {
            const gameConfig = this.GAMING_CONFIG[gameKey];
            if (!gameConfig || gameConfig.disabled) return false;

            const guild = reaction.message.guild;
            const member = guild.members.cache.get(user.id);
            
            if (!member) return false;

            // Vérifier le cooldown
            if (this.isUserOnCooldown(user.id)) {
                const timeLeft = this.getCooldownTimeLeft(user.id);
                
                try {
                    await user.send(`⏰ **Cooldown actif**\n\nVous devez attendre encore **${timeLeft} secondes** avant de pouvoir changer de rôles gaming.`);
                } catch (dmError) {
                    this.logger.warn(`Impossible d'envoyer un MP à ${user.tag}`);
                }
                return false;
            }

            // Récupérer le rôle
            const role = guild.roles.cache.get(gameConfig.roleId);
            if (!role) {
                this.logger.error(`Rôle gaming introuvable: ${gameConfig.name} (${gameConfig.roleId})`);
                return false;
            }

            // Vérifier si l'utilisateur a le rôle
            if (!member.roles.cache.has(gameConfig.roleId)) {
                return true; // Pas possédé, pas d'action nécessaire
            }

            // Retirer le rôle
            await member.roles.remove(role, `Rôle gaming retiré: ${gameConfig.name}`);
            
            // Appliquer le cooldown
            this.applyCooldown(user.id);
            
            // Gérer la visibilité des salons
            await this.updateChannelVisibility(member, gameKey, 'remove');
            
            // Enregistrer les statistiques
            await this.recordAction(user.id, guild.id, gameKey, 'remove');
            
            // Envoyer une notification
            await this.sendRoleNotification(user, guild, gameConfig, 'remove');
            
            this.logger.info(`🎮 Rôle ${gameConfig.name} retiré à ${user.tag}`);
            return true;

        } catch (error) {
            this.logger.error(`Erreur lors de la suppression du rôle gaming ${gameKey}:`, error);
            return false;
        }
    }

    /**
     * Met à jour la visibilité des salons selon les rôles
     */
    async updateChannelVisibility(member, gameKey, action) {
        try {
            const gameConfig = this.GAMING_CONFIG[gameKey];
            
            if (!gameConfig.channels || gameConfig.channels.length === 0) {
                this.logger.warn(`Aucun salon configuré pour ${gameConfig.name}`);
                return;
            }

            // Traiter chaque salon spécifique
            for (const channelId of gameConfig.channels) {
                try {
                    const channel = member.guild.channels.cache.get(channelId);
                    
                    if (!channel) {
                        this.logger.warn(`Salon introuvable: ${channelId} pour ${gameConfig.name}`);
                        continue;
                    }

                    if (action === 'add') {
                        // Donner accès au salon spécifique
                        await channel.permissionOverwrites.edit(member.id, {
                            [PermissionFlagsBits.ViewChannel]: true,
                            [PermissionFlagsBits.SendMessages]: true,
                            [PermissionFlagsBits.Connect]: true,
                            [PermissionFlagsBits.Speak]: true
                        });
                        this.logger.info(`✅ Accès donné à ${member.user.tag} pour ${channel.name} (${gameConfig.name})`);
                    } else {
                        // Retirer l'accès au salon spécifique
                        await channel.permissionOverwrites.delete(member.id);
                        this.logger.info(`❌ Accès retiré à ${member.user.tag} pour ${channel.name} (${gameConfig.name})`);
                    }
                } catch (permError) {
                    this.logger.warn(`Erreur de permissions pour le salon ${channelId}:`, permError);
                }
            }

        } catch (error) {
            this.logger.error('Erreur lors de la mise à jour de la visibilité des salons:', error);
        }
    }

    /**
     * Envoie une notification à l'utilisateur
     */
    async sendRoleNotification(user, guild, gameConfig, action) {
        try {
            const actionText = action === 'add' ? 'obtenu' : 'perdu';
            const emoji = action === 'add' ? '✅' : '➖';
            
            const embed = {
                color: gameConfig.color,
                title: `${emoji} Rôle ${actionText} !`,
                description: `Vous avez ${actionText} le rôle **${gameConfig.name}** sur **${guild.name}**.`,
                fields: [
                    {
                        name: '🎮 Jeu',
                        value: gameConfig.name,
                        inline: true
                    },
                    {
                        name: '📝 Description',
                        value: gameConfig.description,
                        inline: true
                    }
                ],
                footer: {
                    text: `${guild.name} • Système de rôles gaming`,
                    icon_url: guild.iconURL()
                },
                timestamp: new Date().toISOString()
            };

            if (action === 'add') {
                embed.fields.push({
                    name: '🔗 Accès',
                    value: 'Vous avez maintenant accès aux salons de ce jeu !',
                    inline: false
                });
            }

            await user.send({ embeds: [embed] });
        } catch (dmError) {
            this.logger.warn(`Impossible d'envoyer une notification à ${user.tag}`);
        }
    }

    /**
     * Enregistre une action dans les statistiques
     */
    async recordAction(userId, guildId, gameKey, action) {
        try {
            if (!this.client.db.data.gamingRoles) {
                await this.initializeDatabase();
            }

            // Enregistrer l'action
            this.client.db.data.gamingRoles.userActions.push({
                userId,
                guildId,
                gameKey,
                action,
                timestamp: new Date().toISOString()
            });

            // Mettre à jour les statistiques
            const statsKey = `${guildId}_${gameKey}`;
            if (!this.client.db.data.gamingRoles.stats[statsKey]) {
                this.client.db.data.gamingRoles.stats[statsKey] = {
                    adds: 0,
                    removes: 0,
                    total: 0
                };
            }

            this.client.db.data.gamingRoles.stats[statsKey][action === 'add' ? 'adds' : 'removes']++;
            this.client.db.data.gamingRoles.stats[statsKey].total++;

            // Garder seulement les 2000 dernières actions
            if (this.client.db.data.gamingRoles.userActions.length > 2000) {
                this.client.db.data.gamingRoles.userActions = 
                    this.client.db.data.gamingRoles.userActions.slice(-2000);
            }

            await this.client.db.save();
        } catch (error) {
            this.logger.error('Erreur lors de l\'enregistrement de l\'action:', error);
        }
    }

    /**
     * Obtient les statistiques des rôles gaming
     */
    async getGamingStats(guildId) {
        try {
            if (!this.client.db.data.gamingRoles) {
                return null;
            }

            const stats = {};
            const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

            // Calculer les statistiques pour chaque jeu
            for (const [gameKey, gameConfig] of Object.entries(this.GAMING_CONFIG)) {
                if (gameConfig.disabled) continue;

                const statsKey = `${guildId}_${gameKey}`;
                const gameStats = this.client.db.data.gamingRoles.stats[statsKey] || {
                    adds: 0,
                    removes: 0,
                    total: 0
                };

                // Calculer les actions récentes
                const recentActions = this.client.db.data.gamingRoles.userActions.filter(action => 
                    action.guildId === guildId && 
                    action.gameKey === gameKey &&
                    new Date(action.timestamp) >= thirtyDaysAgo
                );

                stats[gameKey] = {
                    name: gameConfig.name,
                    emoji: gameConfig.emoji,
                    totalAdds: gameStats.adds,
                    totalRemoves: gameStats.removes,
                    totalActions: gameStats.total,
                    recentActions: recentActions.length,
                    recentAdds: recentActions.filter(a => a.action === 'add').length,
                    recentRemoves: recentActions.filter(a => a.action === 'remove').length
                };
            }

            return stats;
        } catch (error) {
            this.logger.error('Erreur lors de la récupération des statistiques gaming:', error);
            return null;
        }
    }

    /**
     * Obtient la configuration d'un jeu par son emoji
     */
    getGameByEmoji(emoji) {
        for (const [gameKey, gameConfig] of Object.entries(this.GAMING_CONFIG)) {
            if (gameConfig.emoji === emoji && !gameConfig.disabled) {
                return { key: gameKey, config: gameConfig };
            }
        }
        return null;
    }

    /**
     * Obtient tous les jeux actifs
     */
    getActiveGames() {
        const activeGames = {};
        for (const [gameKey, gameConfig] of Object.entries(this.GAMING_CONFIG)) {
            if (!gameConfig.disabled) {
                activeGames[gameKey] = gameConfig;
            }
        }
        return activeGames;
    }
}
