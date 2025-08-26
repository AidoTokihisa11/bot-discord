import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import MusicManager from '../../managers/MusicManager.js';

import AccessRestriction from '../../utils/AccessRestriction.js';
export default {
    data: new SlashCommandBuilder()
        .setName('queue')
        .setDescription('Afficher la queue de musiques')
        .addIntegerOption(option =>
            option.setName('page')
                .setDescription('Numéro de page à afficher')
                .setMinValue(1)),

    async execute(interaction) {
        // === VÉRIFICATION D'ACCÈS GLOBALE ===
        const accessRestriction = new AccessRestriction();
        const hasAccess = await accessRestriction.checkAccess(interaction);
        if (!hasAccess) {
            return; // Accès refusé, message déjà envoyé
        }


        try {
            const page = interaction.options.getInteger('page') || 1;
            const queueData = MusicManager.getQueueList(interaction.guildId, page, 10);
            
            if (queueData.totalSongs === 0) {
                const embed = new EmbedBuilder()
                    .setTitle('📝 Queue vide')
                    .setDescription('Aucune musique dans la queue. Utilisez `/play` pour ajouter des musiques !')
                    .setColor('#FFA500');
                
                return await interaction.reply({ embeds: [embed] });
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
                    const position = ((page - 1) * 10) + index + 2;
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

            // Boutons de navigation si plusieurs pages
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

            await interaction.reply({ 
                embeds: [embed], 
                components: components 
            });

        } catch (error) {
            console.error('Erreur dans la commande queue:', error);
            
            const embed = new EmbedBuilder()
                .setTitle('❌ Erreur')
                .setDescription('Une erreur est survenue lors de l\'affichage de la queue.')
                .setColor('#FF0000');
            
            await interaction.reply({ embeds: [embed] });
        }
    }
};
