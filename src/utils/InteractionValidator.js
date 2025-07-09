import Logger from './Logger.js';

class InteractionValidator {
    constructor() {
        this.logger = new Logger();
        this.processedInteractions = new Map();
        this.cleanupInterval = 5 * 60 * 1000; // 5 minutes
        
        // Nettoyage automatique des interactions expirées
        setInterval(() => {
            this.cleanupExpiredInteractions();
        }, this.cleanupInterval);
    }

    /**
     * Valide si une interaction peut être traitée
     * @param {Interaction} interaction - L'interaction Discord
     * @returns {boolean} - True si l'interaction peut être traitée
     */
    validateInteraction(interaction) {
        try {
            // Vérification de l'expiration de l'interaction (3 minutes max)
            const interactionAge = Date.now() - interaction.createdTimestamp;
            const maxAge = 3 * 60 * 1000; // 3 minutes
            
            if (interactionAge > maxAge) {
                this.logger.warn(`⏰ Interaction ${interaction.id} expirée (âge: ${Math.round(interactionAge/1000)}s)`);
                return false;
            }

            // Vérification de base de l'état de l'interaction
            if (interaction.replied || interaction.deferred) {
                this.logger.warn(`⚠️ Interaction ${interaction.id} déjà traitée (replied: ${interaction.replied}, deferred: ${interaction.deferred})`);
                return false;
            }

            // Vérification des doublons
            if (this.isInteractionProcessed(interaction)) {
                this.logger.warn(`⚠️ Interaction ${interaction.id} déjà en cours de traitement`);
                return false;
            }

            // Désactiver temporairement la validation par âge car elle bloque toutes les interactions
            // const interactionAge = Date.now() - interaction.createdTimestamp;
            // if (interactionAge > 15000) {
            //     this.logger.warn(`⏰ Interaction ${interaction.id} trop ancienne (${interactionAge}ms)`);
            //     return false;
            // }

            // Marquer l'interaction comme en cours de traitement
            this.markInteractionAsProcessing(interaction);
            
            return true;

        } catch (error) {
            this.logger.error('Erreur lors de la validation de l\'interaction:', error);
            return false;
        }
    }

    /**
     * Vérifie si une interaction est déjà en cours de traitement
     * @param {Interaction} interaction 
     * @returns {boolean}
     */
    isInteractionProcessed(interaction) {
        const key = this.getInteractionKey(interaction);
        return this.processedInteractions.has(key);
    }

    /**
     * Marque une interaction comme en cours de traitement
     * @param {Interaction} interaction 
     */
    markInteractionAsProcessing(interaction) {
        const key = this.getInteractionKey(interaction);
        this.processedInteractions.set(key, {
            timestamp: Date.now(),
            userId: interaction.user.id,
            type: interaction.type,
            customId: interaction.customId || interaction.commandName
        });
    }

    /**
     * Marque une interaction comme terminée
     * @param {Interaction} interaction 
     */
    markInteractionAsCompleted(interaction) {
        const key = this.getInteractionKey(interaction);
        this.processedInteractions.delete(key);
    }

    /**
     * Défère une interaction rapidement pour éviter l'expiration
     * @param {Interaction} interaction 
     * @param {Object} options - Options pour deferReply
     * @returns {boolean} - True si la déférence a réussi
     */
    async quickDefer(interaction, options = {}) {
        try {
            // Vérification rapide de l'expiration AVANT de tenter quoi que ce soit
            const interactionAge = Date.now() - interaction.createdTimestamp;
            if (interactionAge > 2500) { // 2.5 secondes, seuil très conservateur
                this.logger.warn(`⏰ Interaction ${interaction.id} trop ancienne (${interactionAge}ms) - abandon`);
                return false;
            }

            // Vérification rapide avant déférence
            if (interaction.replied || interaction.deferred) {
                this.logger.warn(`⚠️ Interaction ${interaction.id} déjà traitée`);
                return false;
            }

            // Marquer comme en cours de traitement immédiatement
            this.markInteractionAsProcessing(interaction);

            // Défère avec timeout très court
            const deferPromise = interaction.deferReply(options);
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Defer timeout')), 2000);
            });

            await Promise.race([deferPromise, timeoutPromise]);
            
            this.logger.debug(`✅ Interaction ${interaction.id} différée avec succès`);
            return true;
        } catch (error) {
            if (error.code === 10062 || error.code === 40060) {
                this.logger.warn(`⏰ Interaction ${interaction.id} expirée lors de la déférence`);
            } else if (error.message === 'Defer timeout') {
                this.logger.warn(`⏰ Timeout lors de la déférence de l'interaction ${interaction.id}`);
            } else {
                this.logger.error(`❌ Erreur lors de la déférence de l'interaction ${interaction.id}:`, error);
            }
            return false;
        }
    }

    /**
     * Génère une clé unique pour l'interaction
     * @param {Interaction} interaction 
     * @returns {string}
     */
    getInteractionKey(interaction) {
        return `${interaction.id}_${interaction.user.id}`;
    }

    /**
     * Nettoie les interactions expirées de la mémoire
     */
    cleanupExpiredInteractions() {
        const now = Date.now();
        const expiredTime = 15 * 60 * 1000; // 15 minutes
        
        let cleanedCount = 0;
        for (const [key, data] of this.processedInteractions.entries()) {
            if (now - data.timestamp > expiredTime) {
                this.processedInteractions.delete(key);
                cleanedCount++;
            }
        }
        
        if (cleanedCount > 0) {
            this.logger.info(`🧹 Nettoyage: ${cleanedCount} interactions expirées supprimées`);
        }
    }

    /**
     * Gère les erreurs d'interaction de manière sécurisée
     * @param {Interaction} interaction 
     * @param {Error} error 
     * @param {string} context 
     */
    async handleInteractionError(interaction, error, context = 'interaction') {
        try {
            // Marquer l'interaction comme terminée
            this.markInteractionAsCompleted(interaction);

            // Gestion spécifique des erreurs Discord
            if (error.code === 10062) {
                this.logger.warn(`⏰ Interaction expirée dans ${context} (10062) - abandon silencieux`);
                return;
            }
            
            if (error.code === 40060) {
                this.logger.warn(`⚠️ Interaction déjà acquittée dans ${context} (40060) - abandon silencieux`);
                return;
            }

            if (error.message?.includes('Unknown interaction')) {
                this.logger.warn(`⏰ Interaction inconnue dans ${context} - abandon silencieux`);
                return;
            }

            // Log de l'erreur
            this.logger.error(`Erreur dans ${context}:`, error);
            
            // Tentative de réponse d'erreur sécurisée
            await this.sendSafeErrorResponse(interaction, context);

        } catch (finalError) {
            // Gestion d'erreur finale - ne pas logger les erreurs d'expiration
            if (finalError.code === 10062 || finalError.code === 40060) {
                this.logger.warn(`⏰ Erreur finale d'expiration dans ${context} - abandon silencieux`);
            } else {
                this.logger.error(`Erreur critique lors de la gestion d'erreur dans ${context}:`, finalError);
            }
        }
    }

    /**
     * Envoie une réponse d'erreur de manière sécurisée
     * @param {Interaction} interaction 
     * @param {string} context 
     */
    async sendSafeErrorResponse(interaction, context) {
        const errorMessage = `❌ Une erreur est survenue lors du traitement de votre ${context}. Veuillez réessayer ou contacter un administrateur.`;
        
        try {
            // Triple vérification avant tentative de réponse
            if (interaction.replied || interaction.deferred) {
                // Tentative de followUp uniquement si l'interaction est encore valide
                try {
                    await interaction.followUp({ 
                        content: errorMessage, 
                        flags: 64 // MessageFlags.Ephemeral
                    });
                } catch (followUpError) {
                    if (followUpError.code === 10062 || followUpError.code === 40060) {
                        this.logger.warn('⏰ Impossible de faire un followUp - interaction expirée');
                    } else {
                        this.logger.error('Erreur lors du followUp:', followUpError);
                    }
                }
            } else {
                // Tentative de réponse uniquement si l'interaction est encore valide
                try {
                    await interaction.reply({ 
                        content: errorMessage, 
                        flags: 64 // MessageFlags.Ephemeral
                    });
                } catch (replyError) {
                    if (replyError.code === 10062 || replyError.code === 40060) {
                        this.logger.warn('⏰ Impossible de répondre - interaction expirée');
                    } else {
                        this.logger.error('Erreur lors de la réponse:', replyError);
                    }
                }
            }
        } catch (finalError) {
            // Gestion d'erreur finale - ne pas logger les erreurs d'expiration
            if (finalError.code === 10062 || finalError.code === 40060) {
                this.logger.warn('⏰ Erreur finale lors de la réponse d\'erreur - abandon silencieux');
            } else {
                this.logger.error('Erreur critique lors de la réponse d\'erreur:', finalError);
            }
        }
    }

    /**
     * Répond de manière sécurisée à une interaction différée
     * @param {Interaction} interaction 
     * @param {Object} content - Contenu de la réponse
     * @returns {boolean} - True si la réponse a réussi
     */
    async safeEditReply(interaction, content) {
        try {
            // Vérification de l'état de l'interaction
            if (!interaction.deferred && !interaction.replied) {
                this.logger.warn(`⚠️ Interaction ${interaction.id} non différée - tentative de réponse directe`);
                return await this.safeReply(interaction, content);
            }

            // Vérification de l'âge de l'interaction
            const interactionAge = Date.now() - interaction.createdTimestamp;
            if (interactionAge > 14 * 60 * 1000) { // 14 minutes (limite Discord: 15 min)
                this.logger.warn(`⏰ Interaction ${interaction.id} trop ancienne pour editReply (${Math.round(interactionAge/1000)}s)`);
                return false;
            }

            await interaction.editReply(content);
            return true;
        } catch (error) {
            if (error.code === 10062 || error.code === 40060) {
                this.logger.warn(`⏰ Impossible d'éditer la réponse - interaction ${interaction.id} expirée`);
            } else {
                this.logger.error(`❌ Erreur lors de l'édition de la réponse:`, error);
            }
            return false;
        }
    }

    /**
     * Répond de manière sécurisée à une interaction
     * @param {Interaction} interaction 
     * @param {Object} content - Contenu de la réponse
     * @returns {boolean} - True si la réponse a réussi
     */
    async safeReply(interaction, content) {
        try {
            // Vérification de l'état de l'interaction
            if (interaction.replied || interaction.deferred) {
                this.logger.warn(`⚠️ Interaction ${interaction.id} déjà traitée - tentative de followUp`);
                return await this.safeFollowUp(interaction, content);
            }

            // Vérification de l'âge de l'interaction
            const interactionAge = Date.now() - interaction.createdTimestamp;
            if (interactionAge > 3000) { // 3 secondes
                this.logger.warn(`⏰ Interaction ${interaction.id} trop ancienne pour reply (${interactionAge}ms)`);
                return false;
            }

            await interaction.reply(content);
            return true;
        } catch (error) {
            if (error.code === 10062 || error.code === 40060) {
                this.logger.warn(`⏰ Impossible de répondre - interaction ${interaction.id} expirée`);
            } else {
                this.logger.error(`❌ Erreur lors de la réponse:`, error);
            }
            return false;
        }
    }

    /**
     * Effectue un followUp de manière sécurisée
     * @param {Interaction} interaction 
     * @param {Object} content - Contenu du followUp
     * @returns {boolean} - True si le followUp a réussi
     */
    async safeFollowUp(interaction, content) {
        try {
            // Vérification de l'âge de l'interaction
            const interactionAge = Date.now() - interaction.createdTimestamp;
            if (interactionAge > 14 * 60 * 1000) { // 14 minutes
                this.logger.warn(`⏰ Interaction ${interaction.id} trop ancienne pour followUp (${Math.round(interactionAge/1000)}s)`);
                return false;
            }

            await interaction.followUp(content);
            return true;
        } catch (error) {
            if (error.code === 10062 || error.code === 40060) {
                this.logger.warn(`⏰ Impossible de faire un followUp - interaction ${interaction.id} expirée`);
            } else {
                this.logger.error(`❌ Erreur lors du followUp:`, error);
            }
            return false;
        }
    }

    /**
     * Statistiques sur les interactions traitées
     * @returns {Object}
     */
    getStats() {
        return {
            activeInteractions: this.processedInteractions.size,
            oldestInteraction: this.getOldestInteractionAge(),
            memoryUsage: this.processedInteractions.size * 100 // Estimation en bytes
        };
    }

    /**
     * Obtient l'âge de la plus ancienne interaction en cours
     * @returns {number}
     */
    getOldestInteractionAge() {
        let oldest = 0;
        const now = Date.now();
        
        for (const data of this.processedInteractions.values()) {
            const age = now - data.timestamp;
            if (age > oldest) {
                oldest = age;
            }
        }
        
        return oldest;
    }

    /**
     * Force le nettoyage de toutes les interactions
     */
    forceCleanup() {
        const count = this.processedInteractions.size;
        this.processedInteractions.clear();
        this.logger.info(`🧹 Nettoyage forcé: ${count} interactions supprimées`);
    }
}

export default InteractionValidator;
