import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, MessageFlags } from 'discord.js';
import { readdirSync, statSync } from 'fs';
import { join } from 'path';
import { pathToFileURL } from 'url';

import AccessRestriction from '../../utils/AccessRestriction.js';
export default {
    data: new SlashCommandBuilder()
        .setName('verify-bot')
        .setDescription('🔍 Vérifier l\'intégrité et la santé du bot')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addBooleanOption(option =>
            option.setName('detaille')
                .setDescription('Afficher les détails de vérification')
                .setRequired(false)),

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

            const detailed = interaction.options.getBoolean('detaille') || false;
            const results = await performHealthCheck(interaction.client, detailed);

            const healthEmbed = new EmbedBuilder()
                .setTitle('🔍 **VÉRIFICATION DE SANTÉ DU BOT**')
                .setColor(results.overall === 'healthy' ? '#2ecc71' : results.overall === 'warning' ? '#f39c12' : '#e74c3c')
                .setDescription(getOverallDescription(results.overall))
                .addFields(
                    {
                        name: '🔧 **Systèmes Core**',
                        value: formatSystemStatus(results.core),
                        inline: true
                    },
                    {
                        name: '⚡ **Handlers**',
                        value: formatHandlerStatus(results.handlers),
                        inline: true
                    },
                    {
                        name: '🎯 **Managers**',
                        value: formatManagerStatus(results.managers),
                        inline: true
                    },
                    {
                        name: '💾 **Cache & Données**',
                        value: formatCacheStatus(results.cache),
                        inline: true
                    },
                    {
                        name: '📊 **Performance**',
                        value: formatPerformanceStatus(results.performance),
                        inline: true
                    },
                    {
                        name: '🌐 **Connectivité**',
                        value: formatConnectivityStatus(results.connectivity),
                        inline: true
                    }
                );

            if (results.issues.length > 0) {
                healthEmbed.addFields({
                    name: '⚠️ **Problèmes Détectés**',
                    value: results.issues.join('\n'),
                    inline: false
                });
            }

            if (detailed && results.details.length > 0) {
                healthEmbed.addFields({
                    name: '🔍 **Détails Techniques**',
                    value: results.details.join('\n').substring(0, 1024),
                    inline: false
                });
            }

            healthEmbed.setFooter({ 
                text: `Vérification effectuée • Score: ${results.score}/100`,
                iconURL: interaction.client.user.displayAvatarURL()
            })
            .setTimestamp();

            await interaction.editReply({ embeds: [healthEmbed] });

        } catch (error) {
            console.error('Erreur vérification bot:', error);
            await interaction.editReply({
                content: '❌ Une erreur est survenue lors de la vérification.'
            });
        }
    }
};

async function performHealthCheck(client, detailed = false) {
    const results = {
        overall: 'healthy',
        score: 100,
        issues: [],
        details: [],
        core: {},
        handlers: {},
        managers: {},
        cache: {},
        performance: {},
        connectivity: {}
    };

    // Vérification des systèmes core
    results.core = {
        client: client ? '✅' : '❌',
        database: client.db ? '✅' : '❌',
        logger: client.logger ? '✅' : '❌',
        errorHandler: client.errorHandler ? '✅' : '❌',
        cacheManager: client.cacheManager ? '✅' : '❌'
    };

    // Vérification des handlers
    results.handlers = {
        buttonHandler: client.buttonHandler ? '✅' : '⚠️',
        ticketManager: client.ticketManager ? '✅' : '⚠️',
        roleMentionManager: client.roleMentionManager ? '✅' : '❌'
    };

    // Vérification des collections
    results.cache = {
        commands: client.commands?.size > 0 ? '✅' : '❌',
        events: client.events?.size > 0 ? '✅' : '❌',
        embedTemplates: client.embedTemplates ? '✅' : '❌',
        embedBuilder: client.embedBuilder ? '✅' : '❌',
        embedIA: client.embedIA ? '✅' : '❌'
    };

    // Vérification de la performance
    const memUsage = process.memoryUsage();
    results.performance = {
        ping: client.ws.ping < 500 ? '✅' : client.ws.ping < 1000 ? '⚠️' : '❌',
        memory: memUsage.heapUsed < 300 * 1024 * 1024 ? '✅' : memUsage.heapUsed < 500 * 1024 * 1024 ? '⚠️' : '❌',
        uptime: client.uptime > 0 ? '✅' : '❌'
    };

    // Vérification de la connectivité
    results.connectivity = {
        discord: client.ws.status === 0 ? '✅' : '❌',
        guilds: client.guilds.cache.size > 0 ? '✅' : '❌',
        ready: client.isReady() ? '✅' : '❌'
    };

    // Calcul du score et détection des problèmes
    let score = 100;
    
    // Vérifications critiques
    if (!client.db) {
        results.issues.push('🔴 **Base de données non initialisée**');
        score -= 20;
        results.overall = 'critical';
    }
    
    if (!client.commands || client.commands.size === 0) {
        results.issues.push('🔴 **Aucune commande chargée**');
        score -= 15;
        results.overall = 'critical';
    }
    
    if (client.ws.ping > 1000) {
        results.issues.push('🟡 **Latence élevée Discord**');
        score -= 10;
        if (results.overall === 'healthy') results.overall = 'warning';
    }
    
    if (memUsage.heapUsed > 500 * 1024 * 1024) {
        results.issues.push('🟡 **Utilisation mémoire critique**');
        score -= 15;
        if (results.overall === 'healthy') results.overall = 'warning';
    }

    if (!client.cacheManager) {
        results.issues.push('⚠️ **Gestionnaire de cache manquant**');
        score -= 5;
        if (results.overall === 'healthy') results.overall = 'warning';
    }

    results.score = Math.max(0, score);

    if (detailed) {
        results.details.push(`🔍 Ping Discord: ${client.ws.ping}ms`);
        results.details.push(`💾 Mémoire: ${(memUsage.heapUsed / 1024 / 1024).toFixed(1)}MB`);
        results.details.push(`⏱️ Uptime: ${Math.floor(client.uptime / 1000)}s`);
        results.details.push(`🏠 Serveurs: ${client.guilds.cache.size}`);
        results.details.push(`⚙️ Commandes: ${client.commands?.size || 0}`);
    }

    return results;
}

function getOverallDescription(status) {
    switch (status) {
        case 'healthy':
            return '✅ **Tous les systèmes sont opérationnels !**\nLe bot fonctionne parfaitement.';
        case 'warning':
            return '⚠️ **Quelques problèmes détectés**\nLe bot fonctionne mais nécessite une attention.';
        case 'critical':
            return '🔴 **Problèmes critiques détectés !**\nLe bot peut ne pas fonctionner correctement.';
        default:
            return '❓ **Statut inconnu**';
    }
}

function formatSystemStatus(core) {
    return Object.entries(core)
        .map(([key, status]) => `${status} ${key}`)
        .join('\n');
}

function formatHandlerStatus(handlers) {
    return Object.entries(handlers)
        .map(([key, status]) => `${status} ${key}`)
        .join('\n');
}

function formatManagerStatus(managers) {
    return Object.entries(managers)
        .map(([key, status]) => `${status} ${key}`)
        .join('\n');
}

function formatCacheStatus(cache) {
    return Object.entries(cache)
        .map(([key, status]) => `${status} ${key}`)
        .join('\n');
}

function formatPerformanceStatus(performance) {
    return Object.entries(performance)
        .map(([key, status]) => `${status} ${key}`)
        .join('\n');
}

function formatConnectivityStatus(connectivity) {
    return Object.entries(connectivity)
        .map(([key, status]) => `${status} ${key}`)
        .join('\n');
}
