import { ActivityType } from 'discord.js';
import cron from 'node-cron';

export default {
    name: 'ready',
    once: true,
    async execute(client) {
        const logger = client.logger || console;
        
        // Afficher les informations de connexion
        logger.ready(client);
        
        // Définir le statut du bot
        const activities = [
            { name: '🎫 Système de tickets avancé', type: ActivityType.Watching },
            { name: `${client.guilds.cache.size} serveurs`, type: ActivityType.Watching },
            { name: '/help pour les commandes', type: ActivityType.Listening },
            { name: '🚀 Bot moderne v2.0', type: ActivityType.Playing },
            { name: 'theog.dev', type: ActivityType.Streaming, url: 'https://twitch.tv/theog' }
        ];
        
        let currentActivity = 0;
        
        // Changer le statut toutes les 30 secondes
        const updateActivity = () => {
            const activity = activities[currentActivity];
            client.user.setActivity(activity.name, { 
                type: activity.type,
                url: activity.url || undefined
            });
            currentActivity = (currentActivity + 1) % activities.length;
        };
        
        // Définir le statut initial
        updateActivity();
        
        // Programmer le changement de statut
        setInterval(updateActivity, 30000);
        
        // Définir le statut en ligne
        client.user.setStatus('online');
        
        // Programmer les tâches de maintenance
        scheduleMaintenance(client, logger);
        
        // Initialiser les statistiques
        await initializeStats(client, logger);
        
        // Vérifier les mises à jour de configuration
        await checkConfigUpdates(client, logger);
        
        logger.success('🎉 Bot entièrement initialisé et prêt à fonctionner !');
    },
};

async function scheduleMaintenance(client, logger) {
    // Nettoyage quotidien à 3h du matin
    cron.schedule('0 3 * * *', async () => {
        logger.info('🧹 Début du nettoyage quotidien...');
        
        try {
            // Nettoyer la base de données
            if (client.db) {
                client.db.cleanup();
                logger.success('✅ Base de données nettoyée');
            }
            
            // Nettoyer les cooldowns expirés
            client.cooldowns.forEach((cooldown, commandName) => {
                const now = Date.now();
                cooldown.forEach((timestamp, userId) => {
                    if (timestamp < now) {
                        cooldown.delete(userId);
                    }
                });
                if (cooldown.size === 0) {
                    client.cooldowns.delete(commandName);
                }
            });
            
            logger.success('✅ Cooldowns nettoyés');
            
            // Forcer le garbage collection si disponible
            if (global.gc) {
                global.gc();
                logger.success('✅ Garbage collection effectué');
            }
            
            logger.success('🎉 Nettoyage quotidien terminé');
            
        } catch (error) {
            logger.error('❌ Erreur lors du nettoyage:', error);
        }
    }, {
        timezone: 'Europe/Paris'
    });
    
    // Sauvegarde des statistiques toutes les heures
    cron.schedule('0 * * * *', async () => {
        try {
            if (client.db) {
                await client.db.save();
                logger.debug('💾 Sauvegarde automatique effectuée');
            }
        } catch (error) {
            logger.error('❌ Erreur lors de la sauvegarde:', error);
        }
    });
    
    // Rapport de santé toutes les 6 heures
    cron.schedule('0 */6 * * *', async () => {
        try {
            const stats = client.db ? client.db.getStats() : {};
            const memoryUsage = process.memoryUsage();
            
            logger.info('📊 Rapport de santé du bot:', {
                uptime: Math.floor(process.uptime()),
                memory: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
                guilds: client.guilds.cache.size,
                users: client.users.cache.size,
                ping: client.ws.ping,
                ...stats
            });
            
        } catch (error) {
            logger.error('❌ Erreur lors du rapport de santé:', error);
        }
    });
    
    logger.success('⏰ Tâches de maintenance programmées');
}

async function initializeStats(client, logger) {
    try {
        if (!client.db) return;
        
        // Initialiser les statistiques globales
        const stats = client.db.getStats();
        
        // Mettre à jour les statistiques des serveurs
        for (const guild of client.guilds.cache.values()) {
            const guildData = client.db.getGuild(guild.id);
            
            // Vérifier si le serveur a des paramètres par défaut
            if (!guildData.settings.language) {
                client.db.updateGuild(guild.id, {
                    settings: {
                        ...guildData.settings,
                        language: 'fr'
                    }
                });
            }
        }
        
        logger.success(`📈 Statistiques initialisées (${stats.guilds} serveurs, ${stats.users} utilisateurs)`);
        
    } catch (error) {
        logger.error('❌ Erreur lors de l\'initialisation des statistiques:', error);
    }
}

async function checkConfigUpdates(client, logger) {
    try {
        // Vérifier les mises à jour de configuration pour chaque serveur
        for (const guild of client.guilds.cache.values()) {
            const guildData = client.db ? client.db.getGuild(guild.id) : null;
            
            if (guildData) {
                // Vérifier si le rôle modérateur existe toujours
                if (guildData.settings.moderatorRole) {
                    const role = guild.roles.cache.get(guildData.settings.moderatorRole);
                    if (!role) {
                        logger.warn(`⚠️ Rôle modérateur introuvable dans ${guild.name}, réinitialisation...`);
                        client.db.updateGuild(guild.id, {
                            settings: {
                                ...guildData.settings,
                                moderatorRole: null
                            }
                        });
                    }
                }
                
                // Vérifier si les canaux configurés existent toujours
                const channelsToCheck = ['logChannel', 'welcomeChannel', 'ticketCategory'];
                for (const channelType of channelsToCheck) {
                    if (guildData.settings[channelType]) {
                        const channel = guild.channels.cache.get(guildData.settings[channelType]);
                        if (!channel) {
                            logger.warn(`⚠️ Canal ${channelType} introuvable dans ${guild.name}, réinitialisation...`);
                            client.db.updateGuild(guild.id, {
                                settings: {
                                    ...guildData.settings,
                                    [channelType]: null
                                }
                            });
                        }
                    }
                }
            }
        }
        
        logger.success('✅ Vérification des configurations terminée');
        
    } catch (error) {
        logger.error('❌ Erreur lors de la vérification des configurations:', error);
    }
}
