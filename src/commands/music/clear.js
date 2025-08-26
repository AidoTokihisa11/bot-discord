import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import MusicManager from '../../managers/MusicManager.js';

import AccessRestriction from '../../utils/AccessRestriction.js';
export default {
    data: new SlashCommandBuilder()
        .setName('clear')
        .setDescription('Vider la queue de musiques (garde la musique actuelle)')
        .setDefaultMemberPermissions(PermissionFlagsBits.Connect),

    async execute(interaction) {
        // === VÉRIFICATION D'ACCÈS GLOBALE ===
        const accessRestriction = new AccessRestriction();
        const hasAccess = await accessRestriction.checkAccess(interaction);
        if (!hasAccess) {
            return; // Accès refusé, message déjà envoyé
        }


        try {
            const member = interaction.member;
            const voiceChannel = member.voice.channel;
            const queue = MusicManager.getQueue(interaction.guildId);

            // Vérifier si l'utilisateur est dans un canal vocal
            if (!voiceChannel) {
                const embed = new EmbedBuilder()
                    .setTitle('❌ Erreur')
                    .setDescription('Vous devez être dans un canal vocal pour utiliser cette commande !')
                    .setColor('#FF0000');
                
                return await interaction.reply({ embeds: [embed] });
            }

            // Vérifier si le bot est connecté
            if (!MusicManager.isConnected(interaction.guildId)) {
                const embed = new EmbedBuilder()
                    .setTitle('❌ Non connecté')
                    .setDescription('Le bot n\'est pas connecté à un canal vocal !')
                    .setColor('#FF0000');
                
                return await interaction.reply({ embeds: [embed] });
            }

            // Vérifier si l'utilisateur est dans le même canal vocal que le bot
            if (voiceChannel.id !== queue.voiceChannel?.id) {
                const embed = new EmbedBuilder()
                    .setTitle('❌ Canal vocal différent')
                    .setDescription('Vous devez être dans le même canal vocal que le bot !')
                    .setColor('#FF0000');
                
                return await interaction.reply({ embeds: [embed] });
            }

            // Vérifier s'il y a des musiques à supprimer
            if (queue.songs.length <= 1) {
                const embed = new EmbedBuilder()
                    .setTitle('❌ Queue vide')
                    .setDescription('Il n\'y a aucune musique en attente dans la queue !')
                    .setColor('#FF0000');
                
                return await interaction.reply({ embeds: [embed] });
            }

            const songsToRemove = queue.songs.length - 1; // Garder la musique actuelle
            const currentSong = queue.songs[0]; // Sauvegarder la musique actuelle
            
            // Vider la queue en gardant seulement la musique actuelle
            queue.songs = [currentSong];

            const embed = new EmbedBuilder()
                .setTitle('🗑️ Queue vidée')
                .setDescription('Toutes les musiques en attente ont été supprimées de la queue')
                .addFields(
                    { name: '🎵 Musique actuelle conservée', value: `**${currentSong.title}**`, inline: false },
                    { name: '🗑️ Musiques supprimées', value: `${songsToRemove} musique(s)`, inline: true },
                    { name: '👤 Vidée par', value: member.user.toString(), inline: true }
                )
                .setThumbnail(currentSong.thumbnail)
                .setColor('#FF6600')
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Erreur dans la commande clear:', error);
            
            const embed = new EmbedBuilder()
                .setTitle('❌ Erreur')
                .setDescription('Une erreur est survenue lors du vidage de la queue.')
                .setColor('#FF0000');
            
            await interaction.reply({ embeds: [embed] });
        }
    }
};
