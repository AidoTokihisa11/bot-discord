import Logger from './Logger.js';

class InteractionManager {
    constructor() {
        this.logger = new Logger();
        this.recentInteractions = new Map();
        this.interactionCooldown = 1000; // 1 seconde
    }

    // Vérifier si l'utilisateur peut effectuer une interaction
    canInteract(userId, interactionType) {
        const key = `${userId}_${interactionType}`;
        const now = Date.now();
        
        if (this.recentInteractions.has(key)) {
            const lastInteraction = this.recentInteractions.get(key);
            if (now - lastInteraction < this.interactionCooldown) {
                return false;
            }
        }
        
        this.recentInteractions.set(key, now);
        return true;
    }

    // Nettoyer les interactions anciennes
    cleanup() {
        const now = Date.now();
        const expiredTime = 5 * 60 * 1000; // 5 minutes
        
        for (const [key, timestamp] of this.recentInteractions.entries()) {
            if (now - timestamp > expiredTime) {
                this.recentInteractions.delete(key);
            }
        }
    }

    // Vérifier l'état de l'interaction de manière robuste
    isInteractionValid(interaction) {
        // Vérifications de base
        if (!interaction || typeof interaction !== 'object') {
            return false;
        }

        // Vérifier si l'interaction est déjà traitée
        if (interaction.replied || interaction.deferred) {
            this.logger.warn(`⚠️ Interaction ${interaction.id} déjà traitée`);
            return false;
        }

        // Vérifier l'âge de l'interaction (Discord timeout = 15 minutes)
        const interactionAge = Date.now() - interaction.createdTimestamp;
        if (interactionAge > 14 * 60 * 1000) { // 14 minutes pour être sûr
            this.logger.warn(`⏰ Interaction ${interaction.id} trop ancienne (${Math.floor(interactionAge / 1000)}s)`);
            return false;
        }

        return true;
    }

    // Gérer une réponse sécurisée
    async safeReply(interaction, options) {
        try {
            if (!this.isInteractionValid(interaction)) {
                return false;
            }

            await interaction.reply(options);
            return true;
        } catch (error) {
            if (error.code === 10062) {
                this.logger.warn('⏰ Interaction expirée lors de la réponse');
            } else if (error.code === 40060) {
                this.logger.warn('⚠️ Interaction déjà acquittée lors de la réponse');
            } else {
                this.logger.error('Erreur lors de la réponse sécurisée:', error);
            }
            return false;
        }
    }

    // Gérer un defer sécurisé
    async safeDefer(interaction, options = {}) {
        try {
            if (!this.isInteractionValid(interaction)) {
                return false;
            }

            await interaction.deferReply(options);
            return true;
        } catch (error) {
            if (error.code === 10062) {
                this.logger.warn('⏰ Interaction expirée lors du defer');
            } else if (error.code === 40060) {
                this.logger.warn('⚠️ Interaction déjà acquittée lors du defer');
            } else {
                this.logger.error('Erreur lors du defer sécurisé:', error);
            }
            return false;
        }
    }

    // Gérer une édition sécurisée
    async safeEdit(interaction, options) {
        try {
            if (!interaction.deferred && !interaction.replied) {
                this.logger.warn('⚠️ Tentative d\'édition d\'une interaction non defer/reply');
                return false;
            }

            await interaction.editReply(options);
            return true;
        } catch (error) {
            if (error.code === 10062) {
                this.logger.warn('⏰ Interaction expirée lors de l\'édition');
            } else if (error.code === 40060) {
                this.logger.warn('⚠️ Interaction déjà acquittée lors de l\'édition');
            } else {
                this.logger.error('Erreur lors de l\'édition sécurisée:', error);
            }
            return false;
        }
    }
}

export default InteractionManager;
