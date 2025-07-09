import { EmbedBuilder, WebhookClient, MessageFlags } from 'discord.js';
import moment from 'moment';

class ErrorHandler {
    constructor(client, logger) {
        this.client = client;
        this.logger = logger;
        this.webhook = process.env.ERROR_WEBHOOK_URL ? new WebhookClient({ url: process.env.ERROR_WEBHOOK_URL }) : null;
    }

    async handleError(error, context = 'Unknown', interaction = null) {
        const errorId = this.generateErrorId();
        const timestamp = moment().format('DD/MM/YYYY HH:mm:ss');

        // Log l'erreur
        this.logger.error(`[${errorId}] ${context}:`, error);

        // Créer l'embed d'erreur
        const errorEmbed = new EmbedBuilder()
            .setColor('#ff0000')
            .setTitle('🚨 Erreur Système')
            .setDescription(`**ID d'erreur:** \`${errorId}\`\n**Contexte:** ${context}`)
            .addFields(
                {
                    name: '📝 Message d\'erreur',
                    value: `\`\`\`${error.message || 'Erreur inconnue'}\`\`\``,
                    inline: false
                },
                {
                    name: '🕐 Horodatage',
                    value: timestamp,
                    inline: true
                },
                {
                    name: '🔧 Type',
                    value: error.name || 'Error',
                    inline: true
                }
            )
            .setTimestamp()
            .setFooter({ text: 'Système de gestion d\'erreurs' });

        // Ajouter la stack trace si disponible
        if (error.stack) {
            const stackTrace = error.stack.length > 1000 
                ? error.stack.substring(0, 1000) + '...' 
                : error.stack;
            
            errorEmbed.addFields({
                name: '📋 Stack Trace',
                value: `\`\`\`${stackTrace}\`\`\``,
                inline: false
            });
        }

        // Ajouter des informations sur l'interaction si disponible
        if (interaction) {
            errorEmbed.addFields(
                {
                    name: '👤 Utilisateur',
                    value: `${interaction.user.tag} (${interaction.user.id})`,
                    inline: true
                },
                {
                    name: '🏠 Serveur',
                    value: interaction.guild ? `${interaction.guild.name} (${interaction.guild.id})` : 'Message privé',
                    inline: true
                },
                {
                    name: '⚡ Commande',
                    value: interaction.commandName || 'Inconnue',
                    inline: true
                }
            );
        }

        // Envoyer via webhook si configuré
        if (this.webhook) {
            try {
                await this.webhook.send({
                    username: 'Error Handler',
                    avatarURL: this.client.user?.displayAvatarURL(),
                    embeds: [errorEmbed]
                });
            } catch (webhookError) {
                this.logger.error('Erreur lors de l\'envoi du webhook d\'erreur:', webhookError);
            }
        }

        // Répondre à l'utilisateur si c'est une interaction
        if (interaction && !interaction.replied && !interaction.deferred) {
            try {
                const userErrorEmbed = new EmbedBuilder()
                    .setColor('#ff6b6b')
                    .setTitle('❌ Une erreur est survenue')
                    .setDescription(`Désolé, une erreur inattendue s'est produite lors de l'exécution de cette commande.`)
                    .addFields(
                        {
                            name: '🆔 ID d\'erreur',
                            value: `\`${errorId}\``,
                            inline: true
                        },
                        {
                            name: '⏰ Que faire ?',
                            value: 'Veuillez réessayer dans quelques instants. Si le problème persiste, contactez un administrateur avec l\'ID d\'erreur.',
                            inline: false
                        }
                    )
                    .setTimestamp()
                    .setFooter({ text: 'Erreur système' });

                await interaction.reply({
                    embeds: [userErrorEmbed],
                    flags: MessageFlags.Ephemeral
                });
            } catch (replyError) {
                this.logger.error('Impossible de répondre à l\'interaction:', replyError);
            }
        }

        return errorId;
    }

    generateErrorId() {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substr(2, 5);
        return `ERR_${timestamp}_${random}`.toUpperCase();
    }

    async handleCommandError(interaction, error) {
        const context = `Commande: ${interaction.commandName}`;
        return await this.handleError(error, context, interaction);
    }

    async handleEventError(eventName, error, ...args) {
        const context = `Événement: ${eventName}`;
        return await this.handleError(error, context);
    }

    async handleTicketError(action, error, ticketData = null) {
        const context = `Ticket ${action}`;
        return await this.handleError(error, context);
    }

    // Méthode pour créer des rapports d'erreur personnalisés
    createErrorReport(errorId, additionalInfo = {}) {
        return {
            id: errorId,
            timestamp: moment().toISOString(),
            bot: {
                version: '2.0.0',
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                platform: process.platform,
                nodeVersion: process.version
            },
            client: this.client ? {
                guilds: this.client.guilds.cache.size,
                users: this.client.users.cache.size,
                channels: this.client.channels.cache.size,
                ping: this.client.ws.ping
            } : null,
            ...additionalInfo
        };
    }

    // Méthode pour les erreurs critiques qui nécessitent un redémarrage
    async handleCriticalError(error, context = 'Critical Error') {
        const errorId = await this.handleError(error, `CRITIQUE: ${context}`);
        
        // Notifier tous les administrateurs si possible
        if (this.client && this.client.isReady()) {
            const criticalEmbed = new EmbedBuilder()
                .setColor('#8B0000')
                .setTitle('🚨 ERREUR CRITIQUE')
                .setDescription(`Le bot a rencontré une erreur critique et va redémarrer.`)
                .addFields(
                    {
                        name: '🆔 ID d\'erreur',
                        value: `\`${errorId}\``,
                        inline: true
                    },
                    {
                        name: '📝 Contexte',
                        value: context,
                        inline: true
                    },
                    {
                        name: '⚠️ Action',
                        value: 'Redémarrage automatique en cours...',
                        inline: false
                    }
                )
                .setTimestamp();

            // Envoyer dans tous les canaux de log configurés
            this.client.guilds.cache.forEach(async (guild) => {
                try {
                    const guildData = this.client.db?.getGuild(guild.id);
                    if (guildData?.settings?.logChannel) {
                        const logChannel = guild.channels.cache.get(guildData.settings.logChannel);
                        if (logChannel) {
                            await logChannel.send({ embeds: [criticalEmbed] });
                        }
                    }
                } catch (err) {
                    // Ignorer les erreurs de notification
                }
            });
        }

        return errorId;
    }
}

export default ErrorHandler;
