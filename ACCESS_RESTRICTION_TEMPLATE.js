/**
 * Template d'Access Restriction pour Discord Bot
 * Ce fichier contient les modèles de code pour implémenter
 * le système de restrictions d'accès dans tous les composants du bot
 * 
 * Date: 27 Août 2025
 * Système: Restrictions d'accès multi-niveaux
 * Document de référence: IT/DISC/2025/007-R
 */

// ==========================================
// 1. UTILITAIRE ACCESS RESTRICTION DE BASE
// ==========================================

import { EmbedBuilder } from 'discord.js';
import fs from 'fs';
import path from 'path';

/**
 * Classe utilitaire pour gérer les restrictions d'accès
 */
export class AccessRestriction {
    // Rôles bloqués - à personnaliser selon vos besoins
    static BLOCKED_ROLES = [
        "1388265895264129157",
        "1387716580451815464", 
        "1386784012269387946",
        "1393943850455928852",
        "1387717023928418305",
        "1387536419588931616"
    ];

    // Utilisateurs autorisés - à personnaliser
    static ALLOWED_USERS = [
        "421245210220298240" // AidoTokihisa
    ];

    /**
     * Vérifie l'accès d'un utilisateur basé sur ses rôles
     */
    static checkAccess(interaction) {
        const userId = interaction.user.id;
        
        // Utilisateurs autorisés passent toujours
        if (this.ALLOWED_USERS.includes(userId)) {
            return { allowed: true };
        }

        // Vérifier les rôles bloqués
        if (interaction.member && interaction.member.roles) {
            const userRoles = interaction.member.roles.cache.map(role => role.id);
            const hasBlockedRole = userRoles.some(roleId => this.BLOCKED_ROLES.includes(roleId));
            
            if (hasBlockedRole) {
                this.logRestrictedAccess(interaction);
                return { 
                    allowed: false, 
                    reason: 'blocked_role',
                    message: this.getRestrictionMessage() 
                };
            }
        }

        return { allowed: true };
    }

    /**
     * Vérifie l'accès pour un utilisateur spécifique
     */
    static checkUserAccess(user, member) {
        const userId = user.id;
        
        if (this.ALLOWED_USERS.includes(userId)) {
            return { allowed: true };
        }

        if (member && member.roles) {
            const userRoles = member.roles.cache.map(role => role.id);
            const hasBlockedRole = userRoles.some(roleId => this.BLOCKED_ROLES.includes(roleId));
            
            if (hasBlockedRole) {
                return { 
                    allowed: false, 
                    reason: 'blocked_role',
                    message: this.getRestrictionMessage() 
                };
            }
        }

        return { allowed: true };
    }

    /**
     * Message de restriction professionnel
     */
    static getRestrictionMessage() {
        const embed = new EmbedBuilder()
            .setColor('#ff0000')
            .setTitle('🚫 Service Temporairement Indisponible')
            .setDescription('**Décommissionnement en cours**\n\nConformément au document **IT/DISC/2025/007-R**, ce service est actuellement en cours de décommissionnement et n\'est plus accessible.')
            .addFields(
                { 
                    name: '📋 Statut', 
                    value: 'Service suspendu', 
                    inline: true 
                },
                { 
                    name: '📅 Date', 
                    value: '27 Août 2025', 
                    inline: true 
                },
                { 
                    name: '🔒 RGPD', 
                    value: 'Vos données sont protégées conformément au RGPD', 
                    inline: false 
                }
            )
            .setFooter({ 
                text: 'Référence: IT/DISC/2025/007-R | Contact: Administration' 
            })
            .setTimestamp();

        return embed;
    }

    /**
     * Envoie le message de restriction
     */
    static async sendRestrictionMessage(interaction) {
        const embed = this.getRestrictionMessage();
        
        if (interaction.deferred || interaction.replied) {
            await interaction.editReply({ embeds: [embed], ephemeral: true });
        } else {
            await interaction.reply({ embeds: [embed], ephemeral: true });
        }
    }

    /**
     * Log des tentatives d'accès restreintes
     */
    static logRestrictedAccess(interaction) {
        const logMessage = `[${new Date().toISOString()}] Accès refusé - Utilisateur: ${interaction.user.username} (${interaction.user.id}) - Commande: ${interaction.commandName || 'Unknown'}`;
        
        console.log(`🚫 ${logMessage}`);
        
        // Log dans fichier
        const logDir = path.join(process.cwd(), 'logs');
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }
        
        const logFile = path.join(logDir, `bot-${new Date().toISOString().split('T')[0]}.log`);
        fs.appendFileSync(logFile, logMessage + '\n');
    }
}

// ==========================================
// 2. TEMPLATE POUR COMMANDES SLASH
// ==========================================

/*
// Exemple d'implémentation dans une commande
import { AccessRestriction } from '../utils/AccessRestriction.js';

export default {
    data: new SlashCommandBuilder()
        .setName('exemple')
        .setDescription('Commande d\'exemple'),
    
    async execute(interaction) {
        // VÉRIFICATION D'ACCÈS - À AJOUTER AU DÉBUT
        const accessCheck = AccessRestriction.checkAccess(interaction);
        if (!accessCheck.allowed) {
            await AccessRestriction.sendRestrictionMessage(interaction);
            return;
        }
        
        // Votre code de commande ici...
        await interaction.reply('Commande exécutée avec succès !');
    }
};
*/

// ==========================================
// 3. TEMPLATE POUR BUTTON HANDLERS
// ==========================================

/*
// Exemple d'implémentation dans un handler de bouton
import { AccessRestriction } from '../utils/AccessRestriction.js';

export class ExempleButtonHandler {
    static async handle(interaction) {
        // VÉRIFICATION D'ACCÈS - À AJOUTER AU DÉBUT
        const accessCheck = AccessRestriction.checkAccess(interaction);
        if (!accessCheck.allowed) {
            await AccessRestriction.sendRestrictionMessage(interaction);
            return;
        }
        
        // Votre code de handler ici...
        await interaction.reply({ content: 'Bouton traité !', ephemeral: true });
    }
}
*/

// ==========================================
// 4. TEMPLATE POUR MODAL HANDLERS
// ==========================================

/*
// Exemple d'implémentation dans un handler de modal
import { AccessRestriction } from '../utils/AccessRestriction.js';

export class ExempleModalHandler {
    static async handle(interaction) {
        // VÉRIFICATION D'ACCÈS - À AJOUTER AU DÉBUT
        const accessCheck = AccessRestriction.checkAccess(interaction);
        if (!accessCheck.allowed) {
            await AccessRestriction.sendRestrictionMessage(interaction);
            return;
        }
        
        // Votre code de modal ici...
        const input = interaction.fields.getTextInputValue('input_id');
        await interaction.reply({ content: `Modal traité: ${input}`, ephemeral: true });
    }
}
*/

// ==========================================
// 5. TEMPLATE POUR EVENTS
// ==========================================

/*
// Exemple d'implémentation dans interactionCreate.js
import { AccessRestriction } from '../utils/AccessRestriction.js';

export default {
    name: 'interactionCreate',
    async execute(interaction) {
        // VÉRIFICATION GLOBALE - PROTECTION DE PREMIER NIVEAU
        const accessCheck = AccessRestriction.checkAccess(interaction);
        if (!accessCheck.allowed) {
            await AccessRestriction.sendRestrictionMessage(interaction);
            return;
        }
        
        // Votre code d'event ici...
        if (interaction.isCommand()) {
            // Traitement des commandes...
        }
    }
};
*/

// ==========================================
// 6. TEMPLATE POUR MANAGERS
// ==========================================

/*
// Exemple d'implémentation dans un manager
import { AccessRestriction } from '../utils/AccessRestriction.js';

export class ExempleManager {
    static async handleAction(interaction, options = {}) {
        // VÉRIFICATION D'ACCÈS - PROTECTION DE NIVEAU MANAGER
        const accessCheck = AccessRestriction.checkAccess(interaction);
        if (!accessCheck.allowed) {
            await AccessRestriction.sendRestrictionMessage(interaction);
            return false;
        }
        
        // Votre code de manager ici...
        console.log('Action du manager exécutée');
        return true;
    }
}
*/

// ==========================================
// 7. CONFIGURATION PERSONNALISABLE
// ==========================================

/*
// Pour personnaliser les restrictions, modifiez ces constantes :

// Rôles à bloquer (remplacez par vos IDs de rôles)
const CUSTOM_BLOCKED_ROLES = [
    "VOTRE_ROLE_ID_1",
    "VOTRE_ROLE_ID_2",
    "VOTRE_ROLE_ID_3"
];

// Utilisateurs autorisés (remplacez par vos IDs d'utilisateurs)
const CUSTOM_ALLOWED_USERS = [
    "VOTRE_USER_ID_1",
    "VOTRE_USER_ID_2"
];

// Message personnalisé
const CUSTOM_RESTRICTION_MESSAGE = {
    title: "Votre titre personnalisé",
    description: "Votre description personnalisée",
    color: '#ff0000' // Rouge
};
*/

// ==========================================
// 8. NOTES D'IMPLÉMENTATION
// ==========================================

/*
ÉTAPES POUR IMPLÉMENTER LE SYSTÈME :

1. Créer le fichier utils/AccessRestriction.js avec la classe principale
2. Importer AccessRestriction dans tous vos fichiers de commandes
3. Ajouter la vérification au début de chaque fonction execute()
4. Importer dans tous vos handlers (Button, Modal, etc.)
5. Ajouter la vérification dans interactionCreate.js pour protection globale
6. Tester le système avec un utilisateur ayant un rôle bloqué
7. Vérifier les logs pour confirmer le bon fonctionnement

BONNES PRATIQUES :
- Toujours vérifier l'accès avant toute action
- Utiliser des réponses ephemeral pour les messages de restriction
- Logger toutes les tentatives d'accès bloquées
- Maintenir la liste des rôles/utilisateurs à jour
- Tester régulièrement le système
*/

export default AccessRestriction;