import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import MusicManager from '../../managers/MusicManager.js';

import AccessRestriction from '../../utils/AccessRestriction.js';
export default {
    data: new SlashCommandBuilder()
        .setName('nowplaying')
        .setDescription('Afficher la musique en cours de lecture'),

    async execute(interaction) {
        // === VÉRIFICATION D'ACCÈS GLOBALE ===
        const accessRestriction = new AccessRestriction();
        const hasAccess = await accessRestriction.checkAccess(interaction);
        if (!hasAccess) {
            return; // Accès refusé, message déjà envoyé
        }


        try {
            const queue = MusicManager.getQueue(interaction.guildId);
            const currentSong = MusicManager.getCurrentSong(interaction.guildId);

            if (!currentSong || !queue.isPlaying) {
                const embed = new EmbedBuilder()
                    .setTitle('❌ Aucune musique')
                    .setDescription('Aucune musique n\'est en cours de lecture !')
                    .setColor('#FF0000');
                
                return await interaction.reply({ embeds: [embed] });
            }

            const embed = new EmbedBuilder()
                .setTitle('🎵 En cours de lecture')
                .setDescription(`**[${currentSong.title}](${currentSong.url})**`)
                .addFields(
                    { name: '⏱️ Durée', value: currentSong.duration, inline: true },
                    { name: '👤 Demandée par', value: currentSong.requestedBy.toString(), inline: true },
                    { name: '📝 Position dans la queue', value: `1/${queue.songs.length}`, inline: true }
                )
                .setThumbnail(currentSong.thumbnail)
                .setColor('#00FF00')
                .setTimestamp();

            // Ajouter des informations sur la queue
            if (queue.songs.length > 1) {
                const nextSong = queue.songs[1];
                embed.addFields(
                    { name: '⏭️ Prochaine musique', value: `**${nextSong.title}**`, inline: false }
                );
            }

            // Ajouter les modes de lecture
            const modes = [];
            if (queue.loop) modes.push('🔂 Répétition');
            if (queue.loopQueue) modes.push('🔁 Répétition Queue');
            
            if (modes.length > 0) {
                embed.addFields(
                    { name: '🎛️ Modes actifs', value: modes.join(', '), inline: false }
                );
            }

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Erreur dans la commande nowplaying:', error);
            
            const embed = new EmbedBuilder()
                .setTitle('❌ Erreur')
                .setDescription('Une erreur est survenue lors de l\'affichage de la musique actuelle.')
                .setColor('#FF0000');
            
            await interaction.reply({ embeds: [embed] });
        }
    }
};
