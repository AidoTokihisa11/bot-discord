import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import MusicManager from '../managers/MusicManager.js';

export default class MusicButtonHandler {
    static async handleQueueButton(interaction) {
        try {
            const customId = interaction.customId;
            
            if (!customId.startsWith('queue_')) return false;

            const [, action, page] = customId.split('_');
            const targetPage = parseInt(page);

            const queueData = MusicManager.getQueueList(interaction.guildId, targetPage, 10);
            
            if (queueData.totalSongs === 0) {
                const embed = new EmbedBuilder()
                    .setTitle('📝 Queue vide')
                    .setDescription('Aucune musique dans la queue.')
                    .setColor('#FFA500');
                
                return await interaction.update({ embeds: [embed], components: [] });
            }

            const currentSong = queueData.songs[0];
            let description = '';

            // Musique en cours de lecture
            if (queueData.isPlaying && currentSong) {
                description += `**🎵 En cours de lecture:**\n`;
                description += `**[${currentSong.title}](${currentSong.url})**\n`;
                description += `⏱️ ${currentSong.duration} | 👤 ${currentSong.requestedBy}\n\n`;
            }

            // Prochaines musiques
            if (queueData.songs.length > 1) {
                description += `**📋 Prochaines musiques:**\n`;
                
                queueData.songs.slice(1).forEach((song, index) => {
                    const position = ((targetPage - 1) * 10) + index + 2;
                    description += `**${position}.** [${song.title}](${song.url})\n`;
                    description += `⏱️ ${song.duration} | 👤 ${song.requestedBy}\n\n`;
                });
            }

            const embed = new EmbedBuilder()
                .setTitle('📝 Queue de musiques')
                .setDescription(description)
                .addFields(
                    { name: '📊 Total', value: `${queueData.totalSongs} musique(s)`, inline: true },
                    { name: '📄 Page', value: `${queueData.currentPage}/${queueData.totalPages}`, inline: true }
                )
                .setColor('#0099FF')
                .setTimestamp();

            // Ajouter l'image de la musique actuelle
            if (currentSong?.thumbnail) {
                embed.setThumbnail(currentSong.thumbnail);
            }

            // Boutons de navigation
            const components = [];
            if (queueData.totalPages > 1) {
                const row = new ActionRowBuilder();
                
                // Bouton page précédente
                if (queueData.currentPage > 1) {
                    row.addComponents(
                        new ButtonBuilder()
                            .setCustomId(`queue_prev_${queueData.currentPage - 1}`)
                            .setLabel('◀️ Précédent')
                            .setStyle(ButtonStyle.Primary)
                    );
                }

                // Bouton page suivante
                if (queueData.currentPage < queueData.totalPages) {
                    row.addComponents(
                        new ButtonBuilder()
                            .setCustomId(`queue_next_${queueData.currentPage + 1}`)
                            .setLabel('Suivant ▶️')
                            .setStyle(ButtonStyle.Primary)
                    );
                }

                if (row.components.length > 0) {
                    components.push(row);
                }
            }

            await interaction.update({ 
                embeds: [embed], 
                components: components 
            });

            return true;

        } catch (error) {
            console.error('Erreur dans MusicButtonHandler:', error);
            
            const embed = new EmbedBuilder()
                .setTitle('❌ Erreur')
                .setDescription('Une erreur est survenue lors de la navigation dans la queue.')
                .setColor('#FF0000');
            
            await interaction.update({ embeds: [embed], components: [] });
            return true;
        }
    }
}
