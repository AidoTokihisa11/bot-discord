import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import MusicManager from '../../managers/MusicManager.js';

export default {
    data: new SlashCommandBuilder()
        .setName('pause')
        .setDescription('Mettre en pause ou reprendre la musique')
        .setDefaultMemberPermissions(PermissionFlagsBits.Connect),

    async execute(interaction) {
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

            // Vérifier si le bot est connecté et joue de la musique
            if (!MusicManager.isConnected(interaction.guildId) || !queue.isPlaying) {
                const embed = new EmbedBuilder()
                    .setTitle('❌ Aucune musique')
                    .setDescription('Aucune musique n\'est en cours de lecture !')
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

            const currentSong = MusicManager.getCurrentSong(interaction.guildId);
            
            // Mettre en pause
            MusicManager.pause(interaction.guildId);

            const embed = new EmbedBuilder()
                .setTitle('⏸️ Musique en pause')
                .setDescription(`**${currentSong?.title || 'Musique inconnue'}** a été mise en pause`)
                .addFields(
                    { name: '👤 Mise en pause par', value: member.user.toString(), inline: true }
                )
                .setThumbnail(currentSong?.thumbnail)
                .setColor('#FFA500')
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Erreur dans la commande pause:', error);
            
            const embed = new EmbedBuilder()
                .setTitle('❌ Erreur')
                .setDescription('Une erreur est survenue lors de la mise en pause.')
                .setColor('#FF0000');
            
            await interaction.reply({ embeds: [embed] });
        }
    }
};
