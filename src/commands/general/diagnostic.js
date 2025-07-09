import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, MessageFlags } from 'discord.js';
import { version as djsVersion } from 'discord.js';
import os from 'os';

export default {
    data: new SlashCommandBuilder()
        .setName('diagnostic')
        .setDescription('📊 Affiche les statistiques et diagnostics du bot')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        try {
            // Utiliser le validateur d'interactions pour une déférence rapide
            const validator = interaction.client.interactionValidator;
            const deferred = await validator.quickDefer(interaction, { flags: MessageFlags.Ephemeral });
            
            if (!deferred) {
                return; // Interaction expirée ou déjà traitée
            }

            const client = interaction.client;
            const uptime = client.uptime;
            const uptimeSeconds = Math.floor(uptime / 1000);
            const days = Math.floor(uptimeSeconds / 86400);
            const hours = Math.floor((uptimeSeconds % 86400) / 3600);
            const minutes = Math.floor((uptimeSeconds % 3600) / 60);
            const seconds = uptimeSeconds % 60;

            // Statistiques du cache
            const cacheStats = client.cacheManager?.getCacheStats() || {};

            // Statistiques mémoire
            const memoryUsage = process.memoryUsage();
            const totalMemory = os.totalmem();
            const freeMemory = os.freemem();
            const usedMemory = totalMemory - freeMemory;

            // Statistiques Discord
            const guilds = client.guilds.cache.size;
            const users = client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0);
            const channels = client.channels.cache.size;

            const diagnosticEmbed = new EmbedBuilder()
                .setTitle('📊 **DIAGNOSTIC DU BOT**')
                .setColor('#5865F2')
                .setDescription('**État de santé et performances du système**')
                .addFields(
                    {
                        name: '⏱️ **Temps de Fonctionnement**',
                        value: `\`\`\`
${days}j ${hours}h ${minutes}m ${seconds}s
Démarré: <t:${Math.floor((Date.now() - uptime) / 1000)}:R>
\`\`\``,
                        inline: true
                    },
                    {
                        name: '💾 **Mémoire (RAM)**',
                        value: `\`\`\`
Utilisée: ${(memoryUsage.heapUsed / 1024 / 1024).toFixed(1)} MB
Allouée: ${(memoryUsage.heapTotal / 1024 / 1024).toFixed(1)} MB
Système: ${(usedMemory / 1024 / 1024 / 1024).toFixed(1)} GB
\`\`\``,
                        inline: true
                    },
                    {
                        name: '🖥️ **Système**',
                        value: `\`\`\`
OS: ${os.type()} ${os.release()}
CPU: ${os.cpus()[0].model.substring(0, 30)}...
Charge: ${os.loadavg()[0].toFixed(2)}
\`\`\``,
                        inline: true
                    },
                    {
                        name: '🌐 **Discord Stats**',
                        value: `\`\`\`
Serveurs: ${guilds}
Utilisateurs: ${users.toLocaleString()}
Salons: ${channels}
Latence: ${client.ws.ping}ms
\`\`\``,
                        inline: true
                    },
                    {
                        name: '🧠 **Cache & Données**',
                        value: `\`\`\`
Commandes: ${cacheStats.commands || 0}
Templates: ${cacheStats.embedTemplates || 0}
Constructeur: ${cacheStats.embedBuilder || 0}
IA: ${cacheStats.embedIA || 0}
Temp: ${cacheStats.tempData || 0}
Cooldowns: ${cacheStats.cooldowns || 0}
\`\`\``,
                        inline: true
                    },
                    {
                        name: '⚙️ **Versions**',
                        value: `\`\`\`
Node.js: ${process.version}
Discord.js: v${djsVersion}
Bot: v2.0.0
Plateforme: ${process.platform}
\`\`\``,
                        inline: true
                    }
                )
                .setFooter({ 
                    text: `Diagnostic généré • Santé: ${getHealthStatus(client)}`,
                    iconURL: client.user.displayAvatarURL()
                })
                .setTimestamp();

            // Indicateurs de performance
            const performanceIndicators = getPerformanceIndicators(client, memoryUsage, cacheStats);
            if (performanceIndicators.length > 0) {
                diagnosticEmbed.addFields({
                    name: '⚠️ **Alertes Performance**',
                    value: performanceIndicators.join('\n'),
                    inline: false
                });
            }

            await interaction.editReply({ embeds: [diagnosticEmbed] });

        } catch (error) {
            console.error('Erreur diagnostic:', error);
            await interaction.editReply({
                content: '❌ Une erreur est survenue lors de la génération du diagnostic.'
            });
        }
    }
};

function getHealthStatus(client) {
    const ping = client.ws.ping;
    const memUsage = process.memoryUsage().heapUsed / 1024 / 1024;
    
    if (ping > 1000 || memUsage > 500) return '🔴 Critique';
    if (ping > 500 || memUsage > 300) return '🟡 Attention';
    return '🟢 Excellent';
}

function getPerformanceIndicators(client, memoryUsage, cacheStats) {
    const indicators = [];
    
    if (client.ws.ping > 1000) {
        indicators.push('🔴 **Latence élevée** (>1000ms)');
    }
    
    if (memoryUsage.heapUsed > 500 * 1024 * 1024) {
        indicators.push('🟡 **Utilisation mémoire élevée** (>500MB)');
    }
    
    if ((cacheStats.embedTemplates || 0) > 100) {
        indicators.push('🟡 **Cache templates volumineux** (>100 entrées)');
    }
    
    if ((cacheStats.tempData || 0) > 50) {
        indicators.push('🟡 **Données temporaires élevées** (>50 entrées)');
    }
    
    return indicators;
}
