import Logger from './Logger.js';

class CacheManager {
    constructor(client) {
        this.client = client;
        this.logger = new Logger();
        this.cleanupInterval = null;
        
        // Configuration du nettoyage automatique
        this.startAutoCleanup();
    }

    startAutoCleanup() {
        // Nettoyage toutes les 30 minutes
        this.cleanupInterval = setInterval(() => {
            this.performCleanup();
        }, 30 * 60 * 1000);

        this.logger.info('🧹 Système de nettoyage automatique démarré (30 min)');
    }

    performCleanup() {
        try {
            const now = Date.now();
            let cleaned = 0;

            // Nettoyer les templates d'embed expirés (30 minutes)
            if (this.client.embedTemplates) {
                for (const [userId, data] of this.client.embedTemplates.entries()) {
                    if (now - data.timestamp > 30 * 60 * 1000) {
                        this.client.embedTemplates.delete(userId);
                        cleaned++;
                    }
                }
            }

            // Nettoyer les données du constructeur d'embed expirées (30 minutes)
            if (this.client.embedBuilder) {
                for (const [userId, data] of this.client.embedBuilder.entries()) {
                    if (now - data.timestamp > 30 * 60 * 1000) {
                        this.client.embedBuilder.delete(userId);
                        cleaned++;
                    }
                }
            }

            // Nettoyer les données IA expirées (60 minutes)
            if (this.client.embedIA) {
                for (const [userId, data] of this.client.embedIA.entries()) {
                    if (now - data.timestamp > 60 * 60 * 1000) {
                        this.client.embedIA.delete(userId);
                        cleaned++;
                    }
                }
            }

            // Nettoyer les données temporaires expirées (15 minutes)
            if (this.client.tempData) {
                for (const [userId, data] of Object.entries(this.client.tempData)) {
                    if (now - data.timestamp > 15 * 60 * 1000) {
                        delete this.client.tempData[userId];
                        cleaned++;
                    }
                }
            }

            // Nettoyer les cooldowns expirés
            if (this.client.cooldowns) {
                for (const [commandName, cooldownMap] of this.client.cooldowns.entries()) {
                    for (const [userId, timestamp] of cooldownMap.entries()) {
                        if (now - timestamp > 300000) { // 5 minutes
                            cooldownMap.delete(userId);
                            cleaned++;
                        }
                    }
                    
                    // Supprimer la map si elle est vide
                    if (cooldownMap.size === 0) {
                        this.client.cooldowns.delete(commandName);
                    }
                }
            }

            if (cleaned > 0) {
                this.logger.info(`🧹 Nettoyage effectué: ${cleaned} éléments supprimés du cache`);
            }

        } catch (error) {
            this.logger.error('Erreur lors du nettoyage automatique:', error);
        }
    }

    stopAutoCleanup() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
            this.logger.info('🛑 Système de nettoyage automatique arrêté');
        }
    }

    // Nettoyage manuel pour un utilisateur spécifique
    cleanUserData(userId) {
        let cleaned = 0;

        if (this.client.embedTemplates?.has(userId)) {
            this.client.embedTemplates.delete(userId);
            cleaned++;
        }

        if (this.client.embedBuilder?.has(userId)) {
            this.client.embedBuilder.delete(userId);
            cleaned++;
        }

        if (this.client.embedIA?.has(userId)) {
            this.client.embedIA.delete(userId);
            cleaned++;
        }

        if (this.client.tempData?.[userId]) {
            delete this.client.tempData[userId];
            cleaned++;
        }

        return cleaned;
    }

    // Obtenir les statistiques du cache
    getCacheStats() {
        return {
            embedTemplates: this.client.embedTemplates?.size || 0,
            embedBuilder: this.client.embedBuilder?.size || 0,
            embedIA: this.client.embedIA?.size || 0,
            tempData: Object.keys(this.client.tempData || {}).length,
            cooldowns: this.client.cooldowns?.size || 0,
            commands: this.client.commands?.size || 0
        };
    }

    // Forcer un nettoyage complet
    forceCleanup() {
        this.client.embedTemplates?.clear();
        this.client.embedBuilder?.clear();
        this.client.embedIA?.clear();
        this.client.tempData = {};
        
        // Garder les cooldowns récents (moins de 1 minute)
        if (this.client.cooldowns) {
            const now = Date.now();
            for (const [commandName, cooldownMap] of this.client.cooldowns.entries()) {
                for (const [userId, timestamp] of cooldownMap.entries()) {
                    if (now - timestamp > 60000) { // 1 minute
                        cooldownMap.delete(userId);
                    }
                }
                
                if (cooldownMap.size === 0) {
                    this.client.cooldowns.delete(commandName);
                }
            }
        }

        this.logger.info('🧹 Nettoyage complet effectué');
    }
}

export default CacheManager;
