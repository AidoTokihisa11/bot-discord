import Logger from './Logger.js';
import { EmbedBuilder } from 'discord.js';

class AccessRestriction {
    constructor() {
        this.logger = new Logger();
        
        // Liste des rôles interdits
        this.restrictedRoles = [
            '1388265895264129157',
            '1387716580451815464', 
            '1386784012269387946',
            '1393943850455928852',
            '1387717023928418305',
            '1387536419588931616'
        ];
        
        // Utilisateur autorisé (AidoTokihisa)
        this.authorizedUserId = '421245210220298240';
        
        // Message de restriction ultra-professionnel
        this.restrictionMessage = {
            title: '🔒 Notification Officielle de Restriction d\'Accès',
            description: '**PROCÉDURE DE DÉCOMMISSIONNEMENT EN COURS**\n\n' +
                        '> **📋 Référence :** Document IT/DISC/2025/007-R\n' +
                        '> **🏢 Émetteur :** AidoTokihisa Development\n' +
                        '> **📅 Phase :** Cessation d\'activité et révocation des accès\n' +
                        '> **🎯 Statut :** Le service ne répond plus aux commandes conformément à la procédure de retrait\n\n' +
                        '**DÉTAILS TECHNIQUES :**\n' +
                        '• Arrêt des services : mise hors ligne du système\n' +
                        '• Révocation des permissions : accès restreint aux fonctionnalités\n' +
                        '• Conformité RGPD : procédure d\'archivage sécurisée en cours\n\n' +
                        '**CONTACT AUTORISÉ :**\n' +
                        '> 👤 **AidoTokihisa** - Lead Developer & System Architect\n' +
                        '> 🆔 **ID Discord :** `421245210220298240`\n\n' +
                        '*Cette restriction s\'applique à l\'ensemble des interactions système jusqu\'à nouvel ordre.*',
            footer: 'AidoTokihisa Development • Procédure Officielle de Décommissionnement',
            color: 0x1a1a1a,
            thumbnail: 'https://i.imgur.com/EBp1lKW.png'
        };
    }
    
    /**
     * Vérifie si un utilisateur a accès au bot
     * @param {Interaction} interaction - L'interaction Discord
     * @returns {boolean} - true si l'utilisateur peut utiliser le bot
     */
    async checkAccess(interaction) {
        try {
            // AidoTokihisa (421245210220298240) a TOUJOURS accès - BYPASS TOTAL
            if (interaction.user.id === this.authorizedUserId || interaction.user.id === '421245210220298240') {
                console.log(`✅ [BYPASS TOTAL] AidoTokihisa (${interaction.user.id}) accès autorisé sans restriction`);
                return true;
            }
            
            // Vérifier si l'utilisateur a un rôle restreint
            if (interaction.member && interaction.member.roles && interaction.member.roles.cache) {
                const userRoles = interaction.member.roles.cache.map(role => role.id);
                const hasRestrictedRole = this.restrictedRoles.some(restrictedRole => 
                    userRoles.includes(restrictedRole)
                );
                
                if (hasRestrictedRole) {
                    // Log de la tentative d'accès avec notification console
                    this.logRestrictedAccess(interaction);
                    
                    // Envoyer le message de restriction
                    await this.sendRestrictionMessage(interaction);
                    
                    return false;
                }
            }
            
            return true;
            
        } catch (error) {
            // AidoTokihisa bypass même en cas d'erreur
            if (interaction.user.id === '421245210220298240') {
                console.log(`✅ [BYPASS D'URGENCE] AidoTokihisa accès autorisé malgré l'erreur`);
                return true;
            }
            
            this.logger.error('Erreur lors de la vérification d\'accès:', error);
            // En cas d'erreur, on bloque par sécurité
            return false;
        }
    }
    
    /**
     * Vérifie si un utilisateur a accès au bot (version simplifiée pour les managers)
     * @param {User} user - L'utilisateur Discord
     * @param {GuildMember} member - Le membre de la guilde
     * @returns {boolean} - true si l'utilisateur peut utiliser le bot
     */
    async checkUserAccess(user, member = null) {
        try {
            // AidoTokihisa (421245210220298240) a TOUJOURS accès - BYPASS TOTAL
            if (user.id === this.authorizedUserId || user.id === '421245210220298240') {
                console.log(`✅ [BYPASS TOTAL] AidoTokihisa (${user.id}) accès autorisé sans restriction`);
                return true;
            }
            
            // Vérifier si l'utilisateur a un rôle restreint
            if (member && member.roles && member.roles.cache) {
                const userRoles = member.roles.cache.map(role => role.id);
                const hasRestrictedRole = this.restrictedRoles.some(restrictedRole => 
                    userRoles.includes(restrictedRole)
                );
                
                if (hasRestrictedRole) {
                    // Log simple de la tentative d'accès
                    this.logger.warn(`🚨 ACCÈS RESTREINT TENTÉ par ${user.username}#${user.discriminator} (${user.id})`);
                    console.log(`🚨 ACCÈS RESTREINT TENTÉ par ${user.username}#${user.discriminator} (${user.id})`);
                    
                    return false;
                }
            }
            
            return true;
            
        } catch (error) {
            // AidoTokihisa bypass même en cas d'erreur
            if (user.id === '421245210220298240') {
                console.log(`✅ [BYPASS D'URGENCE] AidoTokihisa accès autorisé malgré l'erreur`);
                return true;
            }
            this.logger.error('Erreur lors de la vérification d\'accès utilisateur:', error);
            // En cas d'erreur, on bloque par sécurité
            return false;
        }
    }
    
    /**
     * Log de la tentative d'accès non autorisée
     * @param {Interaction} interaction 
     */
    logRestrictedAccess(interaction) {
        const logData = {
            timestamp: new Date().toISOString(),
            userId: interaction.user.id,
            username: interaction.user.username,
            discriminator: interaction.user.discriminator,
            guildId: interaction.guild?.id || 'DM',
            guildName: interaction.guild?.name || 'Message Privé',
            interactionType: this.getInteractionType(interaction),
            interactionData: this.getInteractionData(interaction),
            userRoles: interaction.member?.roles?.cache?.map(role => ({
                id: role.id,
                name: role.name
            })) || []
        };
        
        // Log critique avec couleurs pour visibilité console
        console.log('\n🚨🚨🚨 SYSTÈME DE SÉCURITÉ : ACCÈS NON AUTORISÉ DÉTECTÉ 🚨🚨🚨');
        console.log('═══════════════════════════════════════════════════════════════');
        console.log(`⏰ TIMESTAMP: ${logData.timestamp}`);
        console.log(`👤 UTILISATEUR: ${logData.username}#${logData.discriminator} (ID: ${logData.userId})`);
        console.log(`🏢 SERVEUR: ${logData.guildName} (ID: ${logData.guildId})`);
        console.log(`🔗 TYPE D'INTERACTION: ${logData.interactionType}`);
        console.log(`📋 DONNÉES INTERACTION: ${logData.interactionData}`);
        console.log(`🎭 RÔLES UTILISATEUR: ${logData.userRoles.map(r => `${r.name} (${r.id})`).join(', ')}`);
        console.log(`🚫 ACTION: ACCÈS BLOQUÉ - MESSAGE DE RESTRICTION ENVOYÉ`);
        console.log('═══════════════════════════════════════════════════════════════\n');
        
        // Log dans le fichier également
        this.logger.warn('🚨 ACCÈS RESTREINT TENTÉ:', logData);
    }
    
    /**
     * Envoie le message de restriction à l'utilisateur (UNIQUEMENT dans le channel, PAS en MP)
     * @param {Interaction} interaction 
     */
    async sendRestrictionMessage(interaction) {
        try {
            const embed = new EmbedBuilder()
                .setTitle(this.restrictionMessage.title)
                .setDescription(this.restrictionMessage.description)
                .setFooter({ text: this.restrictionMessage.footer })
                .setColor(this.restrictionMessage.color)
                .setThumbnail(this.restrictionMessage.thumbnail)
                .setTimestamp()
                .addFields([
                    {
                        name: '🚨 Type de Restriction',
                        value: '`ACCÈS SYSTÈME BLOQUÉ`',
                        inline: true
                    },
                    {
                        name: '⏰ Timestamp',
                        value: `<t:${Math.floor(Date.now() / 1000)}:F>`,
                        inline: true
                    },
                    {
                        name: '📊 Statut',
                        value: '🔴 **INACTIF**',
                        inline: true
                    }
                ]);
            
            // TOUJOURS en ephemeral (visible uniquement par l'utilisateur dans le channel)
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({
                    embeds: [embed],
                    ephemeral: true
                });
            } else {
                await interaction.reply({
                    embeds: [embed],
                    ephemeral: true
                });
            }
            
        } catch (error) {
            this.logger.error('Erreur lors de l\'envoi du message de restriction:', error);
            
            // Fallback: message simple mais toujours en ephemeral
            try {
                const simpleMessage = '� **ACCÈS SYSTÈME SUSPENDU** - Fonctionnalités temporairement indisponibles (Documentation officielle)';
                
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({
                        content: simpleMessage,
                        ephemeral: true
                    });
                } else {
                    await interaction.reply({
                        content: simpleMessage,
                        ephemeral: true
                    });
                }
            } catch (fallbackError) {
                this.logger.error('Erreur critique lors du fallback de restriction:', fallbackError);
            }
        }
    }
    
    /**
     * Détermine le type d'interaction
     * @param {Interaction} interaction 
     * @returns {string}
     */
    getInteractionType(interaction) {
        if (interaction.isChatInputCommand()) return `Commande: /${interaction.commandName}`;
        if (interaction.isButton()) return `Bouton: ${interaction.customId}`;
        if (interaction.isStringSelectMenu()) return `Menu: ${interaction.customId}`;
        if (interaction.isModalSubmit()) return `Modal: ${interaction.customId}`;
        if (interaction.isContextMenuCommand()) return `Menu contextuel: ${interaction.commandName}`;
        return 'Type inconnu';
    }
    
    /**
     * Récupère les données spécifiques de l'interaction
     * @param {Interaction} interaction 
     * @returns {string}
     */
    getInteractionData(interaction) {
        if (interaction.isChatInputCommand()) {
            const options = interaction.options.data.map(opt => 
                `${opt.name}: ${opt.value}`
            ).join(', ');
            return options || 'Aucune option';
        }
        if (interaction.isButton()) return `Bouton cliqué: ${interaction.customId}`;
        if (interaction.isStringSelectMenu()) return `Sélection: ${interaction.values?.join(', ') || 'Aucune'}`;
        if (interaction.isModalSubmit()) return `Modal soumis: ${interaction.customId}`;
        return 'Données non disponibles';
    }
}

export default AccessRestriction;
