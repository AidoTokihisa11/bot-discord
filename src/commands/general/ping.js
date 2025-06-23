import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('🏓 Affiche la latence du bot et de l\'API Discord'),
    
    cooldown: 5,
    category: 'general',
    
    async execute(interaction, client) {
        const sent = await interaction.reply({ 
            content: '🏓 Calcul de la latence...', 
            fetchReply: true 
        });
        
        const botLatency = sent.createdTimestamp - interaction.createdTimestamp;
        const apiLatency = Math.round(client.ws.ping);
        
        // Déterminer la qualité de la connexion
        const getLatencyStatus = (latency) => {
            if (latency < 100) return { emoji: '🟢', status: 'Excellente', color: '#00ff00' };
            if (latency < 200) return { emoji: '🟡', status: 'Bonne', color: '#ffff00' };
            if (latency < 300) return { emoji: '🟠', status: 'Moyenne', color: '#ff8000' };
            return { emoji: '🔴', status: 'Mauvaise', color: '#ff0000' };
        };
        
        const botStatus = getLatencyStatus(botLatency);
        const apiStatus = getLatencyStatus(apiLatency);
        
        // Calculer l'uptime
        const uptime = process.uptime();
        const days = Math.floor(uptime / 86400);
        const hours = Math.floor(uptime / 3600) % 24;
        const minutes = Math.floor(uptime / 60) % 60;
        const seconds = Math.floor(uptime % 60);
        
        const uptimeString = `${days}j ${hours}h ${minutes}m ${seconds}s`;
        
        // Obtenir les statistiques système
        const memoryUsage = process.memoryUsage();
        const memoryUsed = Math.round(memoryUsage.heapUsed / 1024 / 1024);
        const memoryTotal = Math.round(memoryUsage.heapTotal / 1024 / 1024);
        
        const embed = new EmbedBuilder()
            .setColor('#00d4ff')
            .setTitle('🏓 Pong ! Statistiques de latence')
            .setDescription('Voici les informations de performance du bot')
            .addFields(
                {
                    name: '🤖 Latence du Bot',
                    value: `${botStatus.emoji} **${botLatency}ms** - ${botStatus.status}`,
                    inline: true
                },
                {
                    name: '🌐 Latence API Discord',
                    value: `${apiStatus.emoji} **${apiLatency}ms** - ${apiStatus.status}`,
                    inline: true
                },
                {
                    name: '⏱️ Temps de réponse',
                    value: `**${Date.now() - interaction.createdTimestamp}ms**`,
                    inline: true
                },
                {
                    name: '⏰ Temps de fonctionnement',
                    value: `**${uptimeString}**`,
                    inline: true
                },
                {
                    name: '💾 Utilisation mémoire',
                    value: `**${memoryUsed}MB** / ${memoryTotal}MB`,
                    inline: true
                },
                {
                    name: '📊 Charge CPU',
                    value: `**${(process.cpuUsage().user / 1000000).toFixed(2)}%**`,
                    inline: true
                }
            )
            .setThumbnail(client.user.displayAvatarURL({ dynamic: true }))
            .setTimestamp()
            .setFooter({ 
                text: `Demandé par ${interaction.user.tag}`, 
                iconURL: interaction.user.displayAvatarURL({ dynamic: true }) 
            });
        
        // Ajouter des informations sur le serveur si disponible
        if (interaction.guild) {
            const guild = interaction.guild;
            embed.addFields({
                name: '🏠 Informations du serveur',
                value: `**${guild.name}**\n👥 ${guild.memberCount} membres\n📺 ${guild.channels.cache.size} salons`,
                inline: false
            });
        }
        
        // Ajouter une barre de progression pour la latence
        const createProgressBar = (value, max = 500) => {
            const percentage = Math.min(value / max, 1);
            const filled = Math.round(percentage * 10);
            const empty = 10 - filled;
            return '█'.repeat(filled) + '░'.repeat(empty);
        };
        
        embed.addFields({
            name: '📈 Graphique de latence',
            value: `Bot: ${createProgressBar(botLatency)} ${botLatency}ms\nAPI: ${createProgressBar(apiLatency)} ${apiLatency}ms`,
            inline: false
        });
        
        await interaction.editReply({ 
            content: null, 
            embeds: [embed] 
        });
    },
};
