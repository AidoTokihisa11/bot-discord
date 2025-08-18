import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import MusicManager from '../../managers/MusicManager.js';

export default {
    data: new SlashCommandBuilder()
        .setName('stop')
        .setDescription('Arrêter la musique et vider la queue')
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

            const songsCleared = queue.songs.length;
            
            // Arrêter la musique et vider la queue
            MusicManager.stop(interaction.guildId);

            const embed = new EmbedBuilder()
                .setTitle('⏹️ Musique arrêtée')
                .setDescription('La lecture a été arrêtée et la queue a été vidée')
                .addFields(
                    { name: '🗑️ Musiques supprimées', value: `${songsCleared} musique(s)`, inline: true },
                    { name: '👤 Arrêtée par', value: member.user.toString(), inline: true }
                )
                .setColor('#FF0000')
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Erreur dans la commande stop:', error);
            
            const embed = new EmbedBuilder()
                .setTitle('❌ Erreur')
                .setDescription('Une erreur est survenue lors de l\'arrêt de la musique.')
                .setColor('#FF0000');
            
            await interaction.reply({ embeds: [embed] });
        }
    }
};
