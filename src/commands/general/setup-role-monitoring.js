import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ChannelType } from 'discord.js';
import RoleMentionManager from '../../utils/RoleMentionManager.js';

export default {
    data: new SlashCommandBuilder()
        .setName('setup-role-monitoring')
        .setDescription('🔧 Configurer la surveillance sécurisée des mentions de rôles')
        .addBooleanOption(option =>
            option.setName('activer')
                .setDescription('Activer ou désactiver la surveillance (LECTURE SEULE)')
                .setRequired(true))
        .addChannelOption(option =>
            option.setName('salon-logs')
                .setDescription('Salon pour les notifications (optionnel)')
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(false))
        .addIntegerOption(option =>
            option.setName('intervalle')
                .setDescription('Intervalle de vérification en minutes (défaut: 60)')
                .setMinValue(30)
                .setMaxValue(1440)
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    
    async execute(interaction) {
        try {
            await interaction.deferReply({ ephemeral: true });

            const enable = interaction.options.getBoolean('activer');
            const logChannel = interaction.options.getChannel('salon-logs');
            const interval = interaction.options.getInteger('intervalle') || 60;

            const guild = interaction.guild;
            
            // Initialiser le gestionnaire s'il n'existe pas
            if (!interaction.client.roleMentionManager) {
                interaction.client.roleMentionManager = new RoleMentionManager(interaction.client);
            }

            const manager = interaction.client.roleMentionManager;

            const embed = new EmbedBuilder()
                .setColor('#2b2d31')
                .setTitle('🔒 CONFIGURATION SÉCURISÉE DE LA SURVEILLANCE')
                .setTimestamp();

            if (enable) {
                // Configurer la surveillance EN MODE SÉCURISÉ UNIQUEMENT
                const options = {
                    autoFix: false, // TOUJOURS DÉSACTIVÉ POUR LA SÉCURITÉ
                    logChannel: logChannel?.id || null,
                    notifyAdmins: true, // TOUJOURS ACTIVÉ
                    checkInterval: Math.max(interval, 30) * 60 * 1000 // Minimum 30 minutes
                };

                await manager.initializeGuildMonitoring(guild, options);

                // Effectuer une vérification initiale
                const initialCheck = await manager.quickCheck(guild);

                embed.setColor('#00ff00');
                embed.setDescription('✅ **SURVEILLANCE SÉCURISÉE ACTIVÉE**\n\n🔒 **MODE SÉCURISÉ FORCÉ** - Aucune modification automatique ne sera jamais effectuée');
                
                embed.addFields(
                    {
                        name: '🛡️ GARANTIES DE SÉCURITÉ',
                        value: '• **Correction automatique:** ❌ DÉSACTIVÉE DÉFINITIVEMENT\n' +
                               '• **Mode lecture seule:** ✅ Analyse uniquement\n' +
                               '• **Approbation requise:** ✅ Pour toute modification\n' +
                               '• **Aucun risque:** ✅ Votre serveur reste intact',
                        inline: false
                    },
                    {
                        name: '⚙️ CONFIGURATION ACTIVE',
                        value: `• **Salon de logs:** ${logChannel ? `${logChannel}` : '❌ Salon système utilisé'}\n` +
                               `• **Notifications admin:** ✅ Toujours activées\n` +
                               `• **Intervalle:** ${Math.max(interval, 30)} minutes\n` +
                               `• **Type:** 🔍 Surveillance passive uniquement`,
                        inline: false
                    },
                    {
                        name: '📊 VÉRIFICATION INITIALE',
                        value: `• **Problèmes détectés:** ${initialCheck.issueCount}\n` +
                               `• **Sévérité:** ${this.getSeverityEmoji(initialCheck.severity)} ${initialCheck.severity}\n` +
                               `• **Statut:** ${initialCheck.hasIssues ? '⚠️ Attention requise' : '✅ Tout va bien'}`,
                        inline: false
                    }
                );

                if (initialCheck.hasIssues) {
                    const issueTypes = [...new Set(initialCheck.issues.map(i => i.type))];
                    embed.addFields({
                        name: '🔍 TYPES DE PROBLÈMES DÉTECTÉS',
                        value: issueTypes.map(type => {
                            switch (type) {
                                case 'NON_MENTIONABLE_ROLE':
                                    return '• 🎭 Rôles non-mentionnables';
                                case 'CHANNEL_BLOCKS_MENTIONS':
                                    return '• 🚫 Salons bloquant les mentions';
                                case 'CHANNEL_BLOCKS_ROLE_MENTIONS':
                                    return '• 🔒 Permissions restrictives';
                                case 'NO_MENTION_ROLES':
                                    return '• ❓ Aucun rôle de mention';
                                default:
                                    return `• ⚠️ ${type}`;
                            }
                        }).join('\n'),
                        inline: false
                    });

                    embed.addFields({
                        name: '🔧 ACTIONS SÉCURISÉES DISPONIBLES',
                        value: '• **`/fix-role-mentions`** - Analyse et correction avec votre approbation\n' +
                               '• **`/check-role-mentions`** - Diagnostic détaillé en lecture seule\n' +
                               '• **`/force-role-check`** - Vérification immédiate\n\n' +
                               '⚠️ **IMPORTANT:** Toutes les corrections nécessitent votre validation explicite',
                        inline: false
                    });
                }

                embed.addFields({
                    name: '📋 FONCTIONNEMENT DE LA SURVEILLANCE',
                    value: `• **Vérification automatique** toutes les ${Math.max(interval, 30)} minutes\n` +
                           '• **Détection des problèmes** en mode lecture seule\n' +
                           '• **Notifications** envoyées en cas de problème\n' +
                           '• **Aucune modification** sans votre approbation\n' +
                           '• **Logs détaillés** de toutes les activités',
                    inline: false
                });

            } else {
                // Désactiver la surveillance
                manager.stopMonitoring(guild.id);

                embed.setColor('#ff6b6b');
                embed.setDescription('❌ **SURVEILLANCE DÉSACTIVÉE**');
                embed.addFields({
                    name: 'ℹ️ INFORMATION',
                    value: 'La surveillance automatique des mentions de rôles a été désactivée pour ce serveur.\n\n' +
                           '**Commandes manuelles toujours disponibles:**\n' +
                           '• `/check-role-mentions` - Diagnostic complet\n' +
                           '• `/fix-role-mentions` - Correction sécurisée avec approbation\n' +
                           '• `/force-role-check` - Vérification immédiate',
                    inline: false
                });
            }

            // Guide de sécurité
            embed.addFields({
                name: '🛡️ POLITIQUE DE SÉCURITÉ',
                value: '• **Zéro modification automatique** - Votre serveur ne sera jamais modifié sans votre accord\n' +
                       '• **Analyse passive uniquement** - La surveillance ne fait que détecter les problèmes\n' +
                       '• **Contrôle total** - Vous décidez de chaque action à entreprendre\n' +
                       '• **Transparence complète** - Tous les problèmes détectés vous sont signalés\n' +
                       '• **Réversibilité** - Toutes les corrections peuvent être annulées',
                inline: false
            });

            // Commandes utiles
            embed.addFields({
                name: '📚 COMMANDES DISPONIBLES',
                value: '• `/setup-role-monitoring` - Configurer la surveillance sécurisée\n' +
                       '• `/check-role-mentions` - Diagnostic détaillé (lecture seule)\n' +
                       '• `/fix-role-mentions` - Correction avec approbation obligatoire\n' +
                       '• `/role-monitoring-status` - Voir le statut de surveillance\n' +
                       '• `/force-role-check` - Vérification manuelle immédiate',
                inline: false
            });

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Erreur lors de la configuration de la surveillance:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ ERREUR DE CONFIGURATION')
                .setDescription('Une erreur est survenue lors de la configuration de la surveillance sécurisée.')
                .addFields({
                    name: '🔧 SOLUTIONS POSSIBLES',
                    value: '• Vérifiez que le bot a les permissions de lecture nécessaires\n' +
                           '• Assurez-vous que le salon de logs est accessible au bot\n' +
                           '• Réessayez dans quelques instants\n' +
                           '• Contactez le support si le problème persiste',
                    inline: false
                })
                .addFields({
                    name: '🛡️ SÉCURITÉ GARANTIE',
                    value: 'Même en cas d\'erreur, aucune modification n\'a été apportée à votre serveur.',
                    inline: false
                })
                .setTimestamp();

            await interaction.editReply({ embeds: [errorEmbed] });
        }
    },

    getSeverityEmoji(severity) {
        switch (severity) {
            case 'HIGH': return '🔴';
            case 'MEDIUM': return '🟡';
            case 'LOW': return '🟢';
            case 'NONE': return '✅';
            default: return '⚪';
        }
    }
};
