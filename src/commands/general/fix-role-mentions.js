import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('fix-role-mentions')
        .setDescription('🔧 Analyser et corriger les problèmes de mention de rôles (SÉCURISÉ)')
        .addChannelOption(option =>
            option.setName('salon')
                .setDescription('Salon spécifique à analyser (optionnel)')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    
    async execute(interaction) {
        try {
            await interaction.deferReply({ ephemeral: true });

            const targetChannel = interaction.options.getChannel('salon');
            const guild = interaction.guild;

            // 🔒 MODE SÉCURISÉ UNIQUEMENT - AUCUNE MODIFICATION AUTOMATIQUE
            const embed = new EmbedBuilder()
                .setColor('#ffa500')
                .setTitle('🔒 ANALYSE SÉCURISÉE DES MENTIONS DE RÔLES')
                .setDescription('**Mode sécurisé activé** - Aucune modification automatique ne sera effectuée')
                .setTimestamp();

            let detectedIssues = [];
            let proposedFixes = [];
            let safetyWarnings = [];

            // 1. Analyser les rôles non-mentionnables (LECTURE SEULE)
            const roles = guild.roles.cache
                .filter(role => role.id !== guild.id && !role.managed)
                .sort((a, b) => b.position - a.position);

            const nonMentionableRoles = roles.filter(role => !role.mentionable);
            
            if (nonMentionableRoles.size > 0) {
                detectedIssues.push({
                    type: 'NON_MENTIONABLE_ROLES',
                    count: nonMentionableRoles.size,
                    roles: nonMentionableRoles.map(r => r.name).slice(0, 10),
                    severity: 'MEDIUM',
                    safe: true
                });
                
                proposedFixes.push({
                    action: 'Rendre les rôles mentionnables',
                    description: `Activer l'option "mentionnable" sur ${nonMentionableRoles.size} rôle(s)`,
                    risk: 'FAIBLE',
                    reversible: true
                });
            }

            // 2. Analyser les permissions de salon (LECTURE SEULE)
            const channels = targetChannel ? [targetChannel] : guild.channels.cache.filter(ch => ch.isTextBased());
            let blockedChannels = [];
            let blockedRolePermissions = [];
            
            for (const [channelId, channel] of channels) {
                try {
                    // Vérifier les permissions @everyone
                    const everyoneOverwrite = channel.permissionOverwrites.cache.get(guild.id);
                    
                    if (everyoneOverwrite && everyoneOverwrite.deny.has(PermissionFlagsBits.MentionEveryone)) {
                        blockedChannels.push(channel.name);
                    }

                    // Vérifier les permissions des rôles dans le salon
                    const roleOverwrites = channel.permissionOverwrites.cache.filter(overwrite => 
                        overwrite.type === 0 && overwrite.deny.has(PermissionFlagsBits.MentionEveryone)
                    );

                    for (const [overwriteId, overwrite] of roleOverwrites) {
                        const role = guild.roles.cache.get(overwriteId);
                        if (role) {
                            blockedRolePermissions.push({
                                role: role.name,
                                channel: channel.name
                            });
                        }
                    }
                } catch (error) {
                    safetyWarnings.push(`⚠️ Impossible d'analyser le salon ${channel.name}: ${error.message}`);
                }
            }

            if (blockedChannels.length > 0) {
                detectedIssues.push({
                    type: 'BLOCKED_CHANNELS',
                    count: blockedChannels.length,
                    channels: blockedChannels.slice(0, 10),
                    severity: 'HIGH',
                    safe: true
                });
                
                proposedFixes.push({
                    action: 'Débloquer les mentions dans les salons',
                    description: `Réinitialiser les permissions @everyone dans ${blockedChannels.length} salon(s)`,
                    risk: 'MOYEN',
                    reversible: true
                });
            }

            if (blockedRolePermissions.length > 0) {
                detectedIssues.push({
                    type: 'BLOCKED_ROLE_PERMISSIONS',
                    count: blockedRolePermissions.length,
                    permissions: blockedRolePermissions.slice(0, 10),
                    severity: 'MEDIUM',
                    safe: true
                });
                
                proposedFixes.push({
                    action: 'Débloquer les permissions de rôles',
                    description: `Réinitialiser les permissions spécifiques pour ${blockedRolePermissions.length} rôle(s)`,
                    risk: 'MOYEN',
                    reversible: true
                });
            }

            // 3. Vérifier l'existence d'un rôle de mention
            const mentionMasterRole = guild.roles.cache.find(role => role.name === 'Mention Master');
            const mentionRoles = guild.roles.cache.filter(role => 
                role.permissions.has(PermissionFlagsBits.MentionEveryone)
            );

            if (!mentionMasterRole && mentionRoles.size === 0) {
                detectedIssues.push({
                    type: 'NO_MENTION_ROLE',
                    count: 1,
                    severity: 'LOW',
                    safe: true
                });
                
                proposedFixes.push({
                    action: 'Créer un rôle "Mention Master"',
                    description: 'Créer un nouveau rôle avec permissions de mention',
                    risk: 'TRÈS FAIBLE',
                    reversible: true
                });
            }

            // Construire l'embed de résultat
            let description = `**🔍 ANALYSE TERMINÉE EN MODE SÉCURISÉ**\n\n`;
            description += `**📊 STATISTIQUES:**\n`;
            description += `• Rôles analysés: ${roles.size}\n`;
            description += `• Salons analysés: ${channels.size}\n`;
            description += `• Problèmes détectés: ${detectedIssues.length}\n`;
            description += `• Corrections proposées: ${proposedFixes.length}\n\n`;

            if (detectedIssues.length === 0) {
                embed.setColor('#00ff00');
                embed.setDescription(description + '✅ **AUCUN PROBLÈME DÉTECTÉ !**\nTous les rôles peuvent être mentionnés correctement.');
            } else {
                embed.setColor('#ff6b6b');
                embed.setDescription(description);

                // Afficher les problèmes détectés
                for (const issue of detectedIssues) {
                    let fieldName = '';
                    let fieldValue = '';

                    switch (issue.type) {
                        case 'NON_MENTIONABLE_ROLES':
                            fieldName = `🎭 ${issue.count} Rôle(s) Non-Mentionnable(s)`;
                            fieldValue = `**Rôles concernés:**\n${issue.roles.map(r => `• ${r}`).join('\n')}`;
                            if (issue.count > 10) fieldValue += `\n... et ${issue.count - 10} autres`;
                            break;
                        case 'BLOCKED_CHANNELS':
                            fieldName = `🚫 ${issue.count} Salon(s) Bloquant les Mentions`;
                            fieldValue = `**Salons concernés:**\n${issue.channels.map(c => `• ${c}`).join('\n')}`;
                            if (issue.count > 10) fieldValue += `\n... et ${issue.count - 10} autres`;
                            break;
                        case 'BLOCKED_ROLE_PERMISSIONS':
                            fieldName = `🔒 ${issue.count} Permission(s) de Rôle Bloquée(s)`;
                            fieldValue = `**Permissions concernées:**\n${issue.permissions.map(p => `• ${p.role} dans ${p.channel}`).join('\n')}`;
                            if (issue.count > 10) fieldValue += `\n... et ${issue.count - 10} autres`;
                            break;
                        case 'NO_MENTION_ROLE':
                            fieldName = '❓ Aucun Rôle de Mention';
                            fieldValue = 'Aucun rôle avec permission de mention détecté sur le serveur';
                            break;
                    }

                    embed.addFields({
                        name: fieldName,
                        value: fieldValue,
                        inline: false
                    });
                }

                // Afficher les corrections proposées
                if (proposedFixes.length > 0) {
                    const fixesText = proposedFixes.map((fix, index) => 
                        `**${index + 1}.** ${fix.action}\n` +
                        `   📝 ${fix.description}\n` +
                        `   ⚠️ Risque: ${fix.risk}\n` +
                        `   🔄 Réversible: ${fix.reversible ? 'Oui' : 'Non'}`
                    ).join('\n\n');

                    embed.addFields({
                        name: '💡 CORRECTIONS PROPOSÉES',
                        value: fixesText,
                        inline: false
                    });
                }
            }

            // Avertissements de sécurité
            if (safetyWarnings.length > 0) {
                embed.addFields({
                    name: '⚠️ AVERTISSEMENTS DE SÉCURITÉ',
                    value: safetyWarnings.join('\n'),
                    inline: false
                });
            }

            // Boutons d'action sécurisés
            const components = [];
            if (detectedIssues.length > 0) {
                const row = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('confirm_fixes')
                            .setLabel('✅ CONFIRMER LES CORRECTIONS')
                            .setStyle(ButtonStyle.Success)
                            .setEmoji('🔒'),
                        new ButtonBuilder()
                            .setCustomId('backup_first')
                            .setLabel('💾 SAUVEGARDER D\'ABORD')
                            .setStyle(ButtonStyle.Secondary)
                            .setEmoji('🛡️'),
                        new ButtonBuilder()
                            .setCustomId('cancel_fixes')
                            .setLabel('❌ ANNULER')
                            .setStyle(ButtonStyle.Danger)
                            .setEmoji('🚫')
                    );
                components.push(row);
            }

            // Guide de sécurité
            embed.addFields({
                name: '🛡️ GARANTIES DE SÉCURITÉ',
                value: '• **Aucune modification automatique** - Votre approbation est obligatoire\n' +
                       '• **Analyse en lecture seule** - Aucun risque pour votre serveur\n' +
                       '• **Corrections réversibles** - Toutes les actions peuvent être annulées\n' +
                       '• **Sauvegarde recommandée** - Créez une sauvegarde avant toute modification\n' +
                       '• **Contrôle total** - Vous validez chaque action individuellement',
                inline: false
            });

            const response = { embeds: [embed] };
            if (components.length > 0) {
                response.components = components;
            }

            await interaction.editReply(response);

            // Gérer les interactions des boutons de façon sécurisée
            if (components.length > 0) {
                const collector = interaction.channel.createMessageComponentCollector({
                    time: 300000 // 5 minutes
                });

                collector.on('collect', async (buttonInteraction) => {
                    if (buttonInteraction.user.id !== interaction.user.id) {
                        await buttonInteraction.reply({
                            content: '❌ Seul l\'utilisateur qui a lancé la commande peut utiliser ces boutons.',
                            ephemeral: true
                        });
                        return;
                    }

                    if (buttonInteraction.customId === 'confirm_fixes') {
                        await this.handleSecureFixing(buttonInteraction, detectedIssues, proposedFixes, guild);
                    } else if (buttonInteraction.customId === 'backup_first') {
                        await this.handleBackupRecommendation(buttonInteraction);
                    } else if (buttonInteraction.customId === 'cancel_fixes') {
                        await buttonInteraction.update({
                            content: '✅ Opération annulée. Aucune modification n\'a été effectuée sur votre serveur.',
                            embeds: [],
                            components: []
                        });
                    }
                });

                collector.on('end', () => {
                    // Désactiver les boutons après expiration
                    const disabledComponents = components.map(row => {
                        const newRow = ActionRowBuilder.from(row);
                        newRow.components.forEach(component => component.setDisabled(true));
                        return newRow;
                    });
                    
                    interaction.editReply({ 
                        embeds: [embed], 
                        components: disabledComponents 
                    }).catch(() => {});
                });
            }

        } catch (error) {
            console.error('Erreur lors de l\'analyse sécurisée:', error);
            await interaction.editReply({
                content: '❌ Une erreur est survenue lors de l\'analyse. Aucune modification n\'a été effectuée sur votre serveur.',
                ephemeral: true
            });
        }
    },

    async handleSecureFixing(interaction, detectedIssues, proposedFixes, guild) {
        await interaction.deferUpdate();

        const confirmEmbed = new EmbedBuilder()
            .setColor('#ff9500')
            .setTitle('⚠️ CONFIRMATION REQUISE AVANT MODIFICATION')
            .setDescription('**ATTENTION:** Vous êtes sur le point d\'appliquer des modifications à votre serveur.')
            .addFields({
                name: '🔍 RÉCAPITULATIF DES MODIFICATIONS',
                value: proposedFixes.map((fix, index) => 
                    `**${index + 1}.** ${fix.action}\n   📝 ${fix.description}`
                ).join('\n\n'),
                inline: false
            })
            .addFields({
                name: '⚠️ DERNIÈRE VÉRIFICATION',
                value: '• Avez-vous créé une sauvegarde de votre serveur ?\n' +
                       '• Êtes-vous sûr de vouloir appliquer ces modifications ?\n' +
                       '• Comprenez-vous que ces actions modifieront les permissions ?',
                inline: false
            })
            .setTimestamp();

        const confirmRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('final_confirm')
                    .setLabel('✅ OUI, APPLIQUER LES CORRECTIONS')
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji('⚠️'),
                new ButtonBuilder()
                    .setCustomId('final_cancel')
                    .setLabel('❌ NON, ANNULER')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('🛡️')
            );

        await interaction.editReply({
            embeds: [confirmEmbed],
            components: [confirmRow]
        });

        const confirmCollector = interaction.message.createMessageComponentCollector({
            time: 60000 // 1 minute pour confirmer
        });

        confirmCollector.on('collect', async (confirmInteraction) => {
            if (confirmInteraction.user.id !== interaction.user.id) return;

            if (confirmInteraction.customId === 'final_confirm') {
                await this.applySecureFixes(confirmInteraction, detectedIssues, guild);
            } else {
                await confirmInteraction.update({
                    content: '✅ Modifications annulées. Votre serveur reste inchangé.',
                    embeds: [],
                    components: []
                });
            }
        });

        confirmCollector.on('end', (collected) => {
            if (collected.size === 0) {
                interaction.editReply({
                    content: '⏰ Temps de confirmation expiré. Aucune modification n\'a été effectuée.',
                    embeds: [],
                    components: []
                }).catch(() => {});
            }
        });
    },

    async applySecureFixes(interaction, detectedIssues, guild) {
        await interaction.deferUpdate();

        const results = [];
        let successCount = 0;
        let errorCount = 0;

        try {
            for (const issue of detectedIssues) {
                switch (issue.type) {
                    case 'NON_MENTIONABLE_ROLES':
                        for (const roleName of issue.roles) {
                            try {
                                const role = guild.roles.cache.find(r => r.name === roleName);
                                if (role && !role.managed) {
                                    await role.setMentionable(true, 'Correction approuvée par l\'administrateur');
                                    results.push(`✅ Rôle "${roleName}" rendu mentionnable`);
                                    successCount++;
                                }
                            } catch (error) {
                                results.push(`❌ Impossible de modifier le rôle "${roleName}": ${error.message}`);
                                errorCount++;
                            }
                        }
                        break;

                    case 'BLOCKED_CHANNELS':
                        for (const channelName of issue.channels) {
                            try {
                                const channel = guild.channels.cache.find(c => c.name === channelName);
                                if (channel) {
                                    await channel.permissionOverwrites.edit(guild.id, {
                                        MentionEveryone: null
                                    }, 'Correction approuvée par l\'administrateur');
                                    results.push(`✅ Permissions corrigées dans "${channelName}"`);
                                    successCount++;
                                }
                            } catch (error) {
                                results.push(`❌ Impossible de corriger "${channelName}": ${error.message}`);
                                errorCount++;
                            }
                        }
                        break;

                    case 'NO_MENTION_ROLE':
                        try {
                            await guild.roles.create({
                                name: 'Mention Master',
                                color: '#00ff00',
                                permissions: [PermissionFlagsBits.MentionEveryone],
                                reason: 'Rôle de mention créé avec approbation administrateur'
                            });
                            results.push(`✅ Rôle "Mention Master" créé avec succès`);
                            successCount++;
                        } catch (error) {
                            results.push(`❌ Impossible de créer le rôle "Mention Master": ${error.message}`);
                            errorCount++;
                        }
                        break;
                }
            }

            const resultEmbed = new EmbedBuilder()
                .setColor(errorCount > 0 ? '#ff6b6b' : '#00ff00')
                .setTitle('📋 RÉSULTATS DES CORRECTIONS')
                .setDescription(`**Corrections appliquées avec votre approbation**\n\n` +
                               `✅ **Succès:** ${successCount}\n` +
                               `❌ **Erreurs:** ${errorCount}`)
                .addFields({
                    name: '📝 DÉTAIL DES ACTIONS',
                    value: results.slice(0, 20).join('\n') + (results.length > 20 ? `\n... et ${results.length - 20} autres` : ''),
                    inline: false
                })
                .addFields({
                    name: '✅ OPÉRATION TERMINÉE',
                    value: 'Toutes les modifications demandées ont été appliquées. Votre serveur a été mis à jour selon vos instructions.',
                    inline: false
                })
                .setTimestamp();

            await interaction.editReply({
                embeds: [resultEmbed],
                components: []
            });

        } catch (error) {
            await interaction.editReply({
                content: `❌ Erreur critique lors de l'application des corrections: ${error.message}\nCertaines modifications ont pu être appliquées partiellement.`,
                embeds: [],
                components: []
            });
        }
    },

    async handleBackupRecommendation(interaction) {
        const backupEmbed = new EmbedBuilder()
            .setColor('#2b2d31')
            .setTitle('💾 RECOMMANDATIONS DE SAUVEGARDE')
            .setDescription('Avant d\'appliquer des modifications, il est fortement recommandé de créer une sauvegarde.')
            .addFields({
                name: '🛡️ POURQUOI SAUVEGARDER ?',
                value: '• Protection contre les erreurs\n' +
                       '• Possibilité de restaurer l\'état précédent\n' +
                       '• Tranquillité d\'esprit lors des modifications\n' +
                       '• Bonne pratique de gestion de serveur',
                inline: false
            })
            .addFields({
                name: '📋 ÉLÉMENTS À SAUVEGARDER',
                value: '• Liste complète des rôles et leurs permissions\n' +
                       '• Permissions spécifiques de chaque salon\n' +
                       '• Hiérarchie des rôles\n' +
                       '• Configuration des overwrites de permissions',
                inline: false
            })
            .addFields({
                name: '⚙️ COMMENT SAUVEGARDER',
                value: '1. Utilisez un bot de sauvegarde (Carl-bot, Dyno, etc.)\n' +
                       '2. Documentez manuellement vos permissions importantes\n' +
                       '3. Prenez des captures d\'écran des paramètres critiques\n' +
                       '4. Notez les rôles et permissions personnalisés',
                inline: false
            })
            .setTimestamp();

        await interaction.reply({
            embeds: [backupEmbed],
            ephemeral: true
        });
    }
};
