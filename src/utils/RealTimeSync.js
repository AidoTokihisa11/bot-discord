/**
 * SYSTÈME DE SYNCHRONISATION TEMPS RÉEL
 * Discord Team 7 - ID: 1368917489160818728
 * Date actuelle: 27 Août 2025
 * Fuseau horaire: Europe/Paris (CEST/CET)
 */

import { EmbedBuilder } from 'discord.js';

export class RealTimeSync {
    constructor() {
        this.targetGuildId = "1368917489160818728";
        this.targetDate = "2025-08-27";
        this.timezone = "Europe/Paris";
    }

    /**
     * Obtient l'heure actuelle précise en fuseau Paris
     */
    getCurrentParisTime() {
        const now = new Date();
        return new Date(now.toLocaleString("en-US", {timeZone: this.timezone}));
    }

    /**
     * Calcule le temps exact jusqu'à minuit
     */
    getTimeUntilMidnight() {
        const parisTime = this.getCurrentParisTime();
        const midnight = new Date(parisTime);
        
        // Aller au prochain minuit (00:00:00)
        midnight.setDate(midnight.getDate() + 1);
        midnight.setHours(0, 0, 0, 0);
        
        const timeUntilMidnight = midnight.getTime() - parisTime.getTime();
        
        return {
            milliseconds: timeUntilMidnight,
            seconds: Math.floor(timeUntilMidnight / 1000),
            minutes: Math.floor(timeUntilMidnight / (1000 * 60)),
            hours: Math.floor(timeUntilMidnight / (1000 * 60 * 60)),
            formatted: {
                hours: Math.floor(timeUntilMidnight / (1000 * 60 * 60)),
                minutes: Math.floor((timeUntilMidnight % (1000 * 60 * 60)) / (1000 * 60)),
                seconds: Math.floor((timeUntilMidnight % (1000 * 60)) / 1000)
            },
            parisTime: parisTime,
            midnight: midnight
        };
    }

    /**
     * Vérifie la synchronisation avec Discord
     */
    async validateDiscordSync(client) {
        const guild = client.guilds.cache.get(this.targetGuildId);
        const timeInfo = this.getTimeUntilMidnight();
        
        return {
            isConnected: !!guild,
            guildInfo: guild ? {
                id: guild.id,
                name: guild.name,
                memberCount: guild.memberCount,
                createdAt: guild.createdAt,
                available: guild.available
            } : null,
            timeSync: {
                currentParis: timeInfo.parisTime.toLocaleString('fr-FR', {
                    timeZone: this.timezone,
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                }),
                currentUTC: new Date().toISOString(),
                midnightTarget: timeInfo.midnight.toLocaleString('fr-FR', {
                    timeZone: this.timezone,
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                }),
                countdown: `${timeInfo.formatted.hours}h ${timeInfo.formatted.minutes}m ${timeInfo.formatted.seconds}s`,
                exactMilliseconds: timeInfo.milliseconds
            },
            validation: {
                correctDate: timeInfo.parisTime.toISOString().startsWith('2025-08-27'),
                correctGuild: guild?.id === this.targetGuildId,
                botConnected: !!client.user,
                timeValid: timeInfo.milliseconds > 0
            }
        };
    }

    /**
     * Génère un embed de status de synchronisation
     */
    createSyncStatusEmbed(syncData) {
        const embed = new EmbedBuilder()
            .setColor(syncData.validation.correctDate && syncData.validation.correctGuild ? '#00ff00' : '#ff6600')
            .setTitle('🔄 SYNCHRONISATION TEMPS RÉEL - TEAM 7')
            .setDescription('**════════════════════════════════════════**\n' +
                          '**📊 STATUT DE SYNCHRONISATION DISCORD**\n' +
                          '**════════════════════════════════════════**')
            .addFields(
                {
                    name: '🏠 Serveur Discord Team 7',
                    value: `**ID :** ${this.targetGuildId}\n` +
                           `**Nom :** ${syncData.guildInfo?.name || 'NON CONNECTÉ'}\n` +
                           `**Membres :** ${syncData.guildInfo?.memberCount || 0}\n` +
                           `**Statut :** ${syncData.isConnected ? '🟢 CONNECTÉ' : '🔴 DÉCONNECTÉ'}`,
                    inline: true
                },
                {
                    name: '⏰ Synchronisation Temporelle',
                    value: `**Paris :** ${syncData.timeSync.currentParis}\n` +
                           `**UTC :** ${syncData.timeSync.currentUTC.substring(0, 19)}Z\n` +
                           `**Minuit :** ${syncData.timeSync.midnightTarget}\n` +
                           `**Restant :** ${syncData.timeSync.countdown}`,
                    inline: true
                },
                {
                    name: '✅ Validation Système',
                    value: `**Date 27/08/2025 :** ${syncData.validation.correctDate ? '✅' : '❌'}\n` +
                           `**Guild Team 7 :** ${syncData.validation.correctGuild ? '✅' : '❌'}\n` +
                           `**Bot connecté :** ${syncData.validation.botConnected ? '✅' : '❌'}\n` +
                           `**Temps valide :** ${syncData.validation.timeValid ? '✅' : '❌'}`,
                    inline: true
                }
            )
            .setFooter({ 
                text: `Sync ID: ${this.targetGuildId} | Fuseau: ${this.timezone} | Auto-refresh` 
            })
            .setTimestamp();

        return embed;
    }

    /**
     * Lance un monitoring en temps réel
     */
    startRealTimeMonitoring(client, updateInterval = 30000) {
        console.log(`🔄 [MONITORING] Démarrage surveillance temps réel - Team 7 (${this.targetGuildId})`);
        
        const monitor = setInterval(async () => {
            try {
                const syncData = await this.validateDiscordSync(client);
                const timeInfo = this.getTimeUntilMidnight();
                
                console.log(`⏰ [TEMPS RÉEL] ${syncData.timeSync.currentParis} | Restant: ${syncData.timeSync.countdown}`);
                
                // Mettre à jour le statut du bot avec le compte à rebours
                if (timeInfo.formatted.hours === 0 && timeInfo.formatted.minutes <= 10) {
                    client.user.setActivity(`🚫 SUPPRESSION DANS ${timeInfo.formatted.minutes}M${timeInfo.formatted.seconds}S`, { type: 4 });
                } else if (timeInfo.formatted.hours <= 1) {
                    client.user.setActivity(`🚫 SUPPRESSION DANS ${timeInfo.formatted.hours}H${timeInfo.formatted.minutes}M`, { type: 4 });
                }
                
                // Alertes critiques
                if (timeInfo.formatted.hours === 0 && timeInfo.formatted.minutes === 5 && timeInfo.formatted.seconds === 0) {
                    console.log(`🚨 [ALERTE CRITIQUE] 5 MINUTES avant suppression automatique !`);
                }
                
                if (timeInfo.formatted.hours === 0 && timeInfo.formatted.minutes === 1 && timeInfo.formatted.seconds === 0) {
                    console.log(`🚨 [ALERTE FINALE] 1 MINUTE avant suppression automatique !`);
                }
                
                // Arrêter le monitoring si on atteint minuit
                if (timeInfo.milliseconds <= 0) {
                    console.log(`🕛 [MINUIT ATTEINT] Arrêt du monitoring - Suppression imminente`);
                    clearInterval(monitor);
                }
                
            } catch (error) {
                console.error(`❌ [ERREUR MONITORING] ${error.message}`);
            }
        }, updateInterval);
        
        return monitor;
    }

    /**
     * Valide que nous sommes bien le 27 août 2025
     */
    validateCurrentDate() {
        const parisTime = this.getCurrentParisTime();
        const dateStr = parisTime.toISOString().split('T')[0];
        
        return {
            isCorrectDate: dateStr === '2025-08-27',
            currentDate: dateStr,
            expectedDate: '2025-08-27',
            parisTime: parisTime.toLocaleString('fr-FR', {timeZone: this.timezone})
        };
    }
}

export default RealTimeSync;
