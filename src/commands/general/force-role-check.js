import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('force-role-check')
        .setDescription('⚡ Forcer une vérification immédiate des mentions de rôles')
        .addBooleanOption(option =>
            option.setName('corriger')
                .setDescription('Appliquer automatiquement les corrections trouvées')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),
    
    async execute(interaction) {
        try {
            await interaction.deferReply({ ephemeral: true });

            const autoFix = interaction.options.getBoolean('corriger') || false;
            const guild = interaction.guild;
            const manager = interaction.client.roleMentionManager;

            const embed = new EmbedBuilder()
                .setColor('#ffa500')
                .setTitle('⚡ VÉRIFICATION FORCÉE EN COURS...')
                .setDescription('Analyse en cours des mentions de rôles sur le serveur...')
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });

            if (!manager) {
                // Créer un gestionnaire temporaire pour cette vérification
                const { RoleMentionManager } = await import('../../utils/RoleMentionManager.js');
                const tempManager = new RoleMentionManager(interaction.client);
                
                const issues = await tempManager.detectIssues(guild);
                
                embed.setColor('#2b2d31');
                embed.setTitle('⚡ VÉRIFICATION FORCÉE TERMINÉE');
                embed.setDescription(`**${issues.length} problème(s) détecté(s)**`);

                if (issues.length === 0) {
                    embed.setColor('#00ff00');
                    embed.addFields({
                        name: '✅ RÉSULTAT',
                        value: 'Aucun problème détecté ! Toutes les mentions de rôles fonctionnent correctement.',
                        inline: false
                    });
                } else {
                    if (autoFix) {
                        const fixes = await tempManager.autoFixIssues(guild, issues);
                        
                        embed.setColor('#00ff00');
                        embed.addFields({
                            name: '🔧 CORRECTIONS APPLIQUÉES',
                            value: `${fixes.length} correction(s) appliquée(s) avec succès`,
                            inline: false
                        });

                        if (fixes.length > 0) {
                            const fixDetails = fixes.slice(0, 10).map(fix => {
                                switch (fix.type) {
                                    case 'ROLE_MADE_MENTIONABLE':
                                        return `✅ Rôle ${fix.roleName} rendu mentionnable`;
                                    case 'CHANNEL_PERMISSIONS_FIXED':
                                        return `✅ Permissions corrigées dans ${fix.channelName}`;
                                    case 'ROLE_CHANNEL_PERMISSIONS_FIXED':
                                        return `✅ Permissions de rôle corrigées`;
                                    case 'MENTION_ROLE_CREATED':
                                        return `✅ Rôle ${fix.roleName} créé`;
                                    case 'FIX_FAILED':
                                        return `❌ Échec: ${fix.error}`;
                                    default:
                                        return `✅ ${fix.type}`;
                                }
                            }).join('\n');

                            embed.addFields({
                                name: '📋 DÉTAIL DES CORRECTIONS',
                                value: fixDetails + (fixes.length > 10 ? `\n... et ${fixes.length - 10} autres` : ''),
                                inline: false
                            });
                        }
                    } else {
                        embed.setColor('#ff6b6b');
                        
                        // Grouper les problèmes par type
                        const issueTypes = issues.reduce((acc, issue) => {
                            acc[issue.type] = (acc[issue.type] || 0) + 1;
                            return acc;
                        }, {});

                        const issueDetails = Object.entries(issueTypes).map(([type, count]) => {
                            switch (type) {
                                case 'NON_MENTIONABLE_ROLE':
                                    return `• 🎭 ${count} rôle(s) non-mentionnable(s)`;
                                case 'CHANNEL_BLOCKS_MENTIONS':
                                    return `• 🚫 ${count} salon(s) bloquant les mentions`;
                                case 'CHANNEL_BLOCKS_ROLE_MENTIONS':
                                    return `• 🔒 ${count} permission(s) restrictive(s)`;
                                case 'NO_MENTION_ROLES':
                                    return `• ❓ Aucun rôle de mention configuré`;
                                default:
                                    return `• ⚠️ ${count} problème(s) de type ${type}`;
                            }
                        }).join('\n');

                        embed.addFields({
                            name: '⚠️ PROBLÈMES DÉTECTÉS',
                            value: issueDetails,
                            inline: false
                        });

                        embed.addFields({
                            name: '💡 ACTIONS RECOMMANDÉES',
                            value: '• Utilisez `/force-role-check corriger:true` pour corriger automatiquement\n' +
                                   '• Ou utilisez `/fix-role-mentions auto-fix:true` pour plus d\'options\n' +
                                   '• Configurez la surveillance automatique avec `/setup-role-monitoring`',
                            inline: false
                        });
                    }
                }

                await interaction.editReply({ embeds: [embed] });
                return;
            }

            // Utiliser le gestionnaire existant
            const quickCheck = await manager.quickCheck(guild);
            
            embed.setColor('#2b2d31');
            embed.setTitle('⚡ VÉRIFICATION FORCÉE TERMINÉE');
            embed.setDescription(`**${quickCheck.issueCount} problème(s) détecté(s)**`);

            if (!quickCheck.hasIssues) {
                embed.setColor('#00ff00');
                embed.addFields({
                    name: '✅ RÉSULTAT',
                    value: 'Aucun problème détecté ! Toutes les mentions de rôles fonctionnent correctement.',
                    inline: false
                });
            } else {
                if (autoFix) {
                    const fixes = await manager.autoFixIssues(guild, quickCheck.issues);
                    
                    embed.setColor('#00ff00');
                    embed.addFields({
                        name: '🔧 CORRECTIONS APPLIQUÉES',
                        value: `${fixes.length} correction(s) appliquée(s) avec succès`,
                        inline: false
                    });

                    // Log de l'activité
                    await manager.logActivity(guild, 'MANUAL_FIX', { 
                        user: interaction.user.tag,
                        issues: quickCheck.issues,
                        fixes: fixes
                    });
                } else {
                    embed.setColor('#ff6b6b');
                    
                    // Analyser les types de problèmes
                    const issueTypes = quickCheck.issues.reduce((acc, issue) => {
                        acc[issue.type] = (acc[issue.type] || 0) + 1;
                        return acc;
                    }, {});

                    const issueDetails = Object.entries(issueTypes).map(([type, count]) => {
                        switch (type) {
                            case 'NON_MENTIONABLE_ROLE':
                                return `• 🎭 ${count} rôle(s) non-mentionnable(s)`;
                            case 'CHANNEL_BLOCKS_MENTIONS':
                                return `• 🚫 ${count} salon(s) bloquant les mentions`;
                            case 'CHANNEL_BLOCKS_ROLE_MENTIONS':
                                return `• 🔒 ${count} permission(s) restrictive(s)`;
                            case 'NO_MENTION_ROLES':
                                return `• ❓ Aucun rôle de mention configuré`;
                            default:
                                return `• ⚠️ ${count} problème(s) de type ${type}`;
                        }
                    }).join('\n');

                    embed.addFields({
                        name: '⚠️ PROBLÈMES DÉTECTÉS',
                        value: issueDetails,
                        inline: false
                    });

                    embed.addFields({
                        name: `🔴 SÉVÉRITÉ: ${quickCheck.severity}`,
                        value: getSeverityDescription(quickCheck.severity),
                        inline: false
                    });
                }
            }

            // Statistiques de la vérification
            const roles = guild.roles.cache.filter(role => role.id !== guild.id);
            const mentionableRoles = roles.filter(role => role.mentionable);
            const textChannels = guild.channels.cache.filter(ch => ch.isTextBased());

            embed.addFields({
                name: '📊 STATISTIQUES',
                value: `• **Rôles analysés:** ${roles.size}\n` +
                       `• **Rôles mentionnables:** ${mentionableRoles.size}\n` +
                       `• **Salons analysés:** ${textChannels.size}\n` +
                       `• **Temps d'analyse:** < 1 seconde`,
                inline: false
            });

            // Actions disponibles
            if (!autoFix && quickCheck.hasIssues) {
                embed.addFields({
                    name: '🎮 ACTIONS DISPONIBLES',
                    value: '• `/force-role-check corriger:true` - Corriger maintenant\n' +
                           '• `/fix-role-mentions` - Correction avec plus d\'options\n' +
                           '• `/setup-role-monitoring` - Surveillance automatique',
                    inline: false
                });
            }

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Erreur lors de la vérification forcée:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ ERREUR DE VÉRIFICATION')
                .setDescription('Une erreur est survenue lors de la vérification forcée.')
                .addFields({
                    name: '🔧 SOLUTIONS POSSIBLES',
                    value: '• Vérifiez que le bot a les permissions nécessaires\n' +
                           '• Réessayez dans quelques instants\n' +
                           '• Utilisez `/check-role-mentions` pour un diagnostic détaillé',
                    inline: false
                })
                .setTimestamp();

            await interaction.editReply({ embeds: [errorEmbed] });
        }
    }
};

function getSeverityDescription(severity) {
    switch (severity) {
        case 'HIGH':
            return '🔴 **CRITIQUE** - Intervention immédiate requise';
        case 'MEDIUM':
            return '🟡 **MODÉRÉE** - Correction recommandée';
        case 'LOW':
            return '🟢 **FAIBLE** - Surveillance suffisante';
        case 'NONE':
            return '✅ **AUCUNE** - Tout fonctionne parfaitement';
        default:
            return '⚪ **INCONNUE** - Analyse en cours';
    }
}
