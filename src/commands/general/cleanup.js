import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, MessageFlags } from 'discord.js';

import AccessRestriction from '../../utils/AccessRestriction.js';
export default {
    data: new SlashCommandBuilder()
        .setName('cleanup')
        .setDescription('🧹 Commandes de nettoyage et maintenance du bot')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcommand =>
            subcommand
                .setName('cache')
                .setDescription('🗑️ Nettoyer le cache du bot'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('user')
                .setDescription('👤 Nettoyer les données d\'un utilisateur spécifique')
                .addUserOption(option =>
                    option.setName('utilisateur')
                        .setDescription('Utilisateur dont nettoyer les données')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('stats')
                .setDescription('📊 Afficher les statistiques de cache')),

    async execute(interaction) {
        // === VÉRIFICATION D'ACCÈS GLOBALE ===
        const accessRestriction = new AccessRestriction();
        const hasAccess = await accessRestriction.checkAccess(interaction);
        if (!hasAccess) {
            return; // Accès refusé, message déjà envoyé
        }


        try {
            // Utiliser le validateur d'interactions pour une déférence rapide
            const validator = interaction.client.interactionValidator;
            const deferred = await validator.quickDefer(interaction, { flags: MessageFlags.Ephemeral });
            
            if (!deferred) {
                return; // Interaction expirée ou déjà traitée
            }

            const subcommand = interaction.options.getSubcommand();
            const cacheManager = interaction.client.cacheManager;

            if (!cacheManager) {
                return await interaction.editReply({
                    content: '❌ Gestionnaire de cache non disponible.'
                });
            }

            switch (subcommand) {
                case 'cache':
                    await handleCacheCleanup(interaction, cacheManager);
                    break;
                case 'user':
                    await handleUserCleanup(interaction, cacheManager);
                    break;
                case 'stats':
                    await handleCacheStats(interaction, cacheManager);
                    break;
            }

        } catch (error) {
            console.error('Erreur cleanup:', error);
            await interaction.editReply({
                content: '❌ Une erreur est survenue lors du nettoyage.'
            });
        }
    }
};

async function handleCacheCleanup(interaction, cacheManager) {
    const statsBefore = cacheManager.getCacheStats();
    
    cacheManager.forceCleanup();
    
    const statsAfter = cacheManager.getCacheStats();

    const cleanupEmbed = new EmbedBuilder()
        .setTitle('🧹 **NETTOYAGE DU CACHE EFFECTUÉ**')
        .setColor('#2ecc71')
        .setDescription('**Le cache du bot a été nettoyé avec succès !**')
        .addFields(
            {
                name: '📊 **Avant Nettoyage**',
                value: `\`\`\`
Templates: ${statsBefore.embedTemplates}
Constructeur: ${statsBefore.embedBuilder}
IA: ${statsBefore.embedIA}
Données temp: ${statsBefore.tempData}
Cooldowns: ${statsBefore.cooldowns}
\`\`\``,
                inline: true
            },
            {
                name: '✨ **Après Nettoyage**',
                value: `\`\`\`
Templates: ${statsAfter.embedTemplates}
Constructeur: ${statsAfter.embedBuilder}
IA: ${statsAfter.embedIA}
Données temp: ${statsAfter.tempData}
Cooldowns: ${statsAfter.cooldowns}
\`\`\``,
                inline: true
            },
            {
                name: '💾 **Mémoire Libérée**',
                value: `\`\`\`
${((statsBefore.embedTemplates + statsBefore.embedBuilder + statsBefore.embedIA + statsBefore.tempData) - 
   (statsAfter.embedTemplates + statsAfter.embedBuilder + statsAfter.embedIA + statsAfter.tempData))} entrées supprimées
\`\`\``,
                inline: false
            }
        )
        .setFooter({ text: 'Nettoyage automatique actif toutes les 30 minutes' })
        .setTimestamp();

    await interaction.editReply({ embeds: [cleanupEmbed] });
}

async function handleUserCleanup(interaction, cacheManager) {
    const user = interaction.options.getUser('utilisateur');
    const cleaned = cacheManager.cleanUserData(user.id);

    const userCleanupEmbed = new EmbedBuilder()
        .setTitle('👤 **NETTOYAGE UTILISATEUR**')
        .setColor(cleaned > 0 ? '#2ecc71' : '#95a5a6')
        .setDescription(`**Nettoyage des données de ${user}**`)
        .addFields({
            name: '📊 **Résultat**',
            value: cleaned > 0 ? 
                `✅ **${cleaned} éléments supprimés** du cache pour cet utilisateur.` :
                `ℹ️ **Aucune donnée trouvée** dans le cache pour cet utilisateur.`,
            inline: false
        })
        .setThumbnail(user.displayAvatarURL({ dynamic: true }))
        .setFooter({ text: `Nettoyage effectué par ${interaction.user.tag}` })
        .setTimestamp();

    await interaction.editReply({ embeds: [userCleanupEmbed] });
}

async function handleCacheStats(interaction, cacheManager) {
    const stats = cacheManager.getCacheStats();
    const memoryUsage = process.memoryUsage();

    const statsEmbed = new EmbedBuilder()
        .setTitle('📊 **STATISTIQUES DU CACHE**')
        .setColor('#3498db')
        .setDescription('**État actuel du cache et de la mémoire**')
        .addFields(
            {
                name: '🗂️ **Collections Actives**',
                value: `\`\`\`
📝 Templates Embed: ${stats.embedTemplates}
🏗️ Constructeur: ${stats.embedBuilder}
🤖 IA: ${stats.embedIA}
⏱️ Données Temp: ${stats.tempData}
❄️ Cooldowns: ${stats.cooldowns}
⚙️ Commandes: ${stats.commands}
\`\`\``,
                inline: true
            },
            {
                name: '💾 **Mémoire Process**',
                value: `\`\`\`
Utilisée: ${(memoryUsage.heapUsed / 1024 / 1024).toFixed(1)} MB
Allouée: ${(memoryUsage.heapTotal / 1024 / 1024).toFixed(1)} MB
RSS: ${(memoryUsage.rss / 1024 / 1024).toFixed(1)} MB
\`\`\``,
                inline: true
            },
            {
                name: '🎯 **Recommandations**',
                value: getRecommendations(stats, memoryUsage),
                inline: false
            }
        )
        .setFooter({ text: 'Statistiques en temps réel' })
        .setTimestamp();

    await interaction.editReply({ embeds: [statsEmbed] });
}

function getRecommendations(stats, memoryUsage) {
    const recommendations = [];
    
    if (stats.embedTemplates > 50) {
        recommendations.push('🟡 Beaucoup de templates en mémoire');
    }
    
    if (stats.tempData > 30) {
        recommendations.push('🟡 Données temporaires élevées');
    }
    
    if (memoryUsage.heapUsed > 300 * 1024 * 1024) {
        recommendations.push('🔴 Utilisation mémoire élevée');
    }
    
    if (recommendations.length === 0) {
        return '✅ **Tout semble optimal !**';
    }
    
    return recommendations.join('\n');
}
