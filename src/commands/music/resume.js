import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import MusicManager from '../../managers/MusicManager.js';

export default {
    data: new SlashCommandBuilder()
        .setName('resume')
        .setDescription('Reprendre la lecture de la musique')
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

            const currentSong = MusicManager.getCurrentSong(interaction.guildId);

            if (!currentSong) {
                const embed = new EmbedBuilder()
                    .setTitle('❌ Aucune musique')
                    .setDescription('Aucune musique n\'est disponible pour reprendre la lecture !')
                    .setColor('#FF0000');
                
                return await interaction.reply({ embeds: [embed] });
            }
            
            // Reprendre la lecture
            MusicManager.resume(interaction.guildId);

            const embed = new EmbedBuilder()
                .setTitle('▶️ Lecture reprise')
                .setDescription(`**${currentSong.title}** reprend sa lecture`)
                .addFields(
                    { name: '👤 Reprise par', value: member.user.toString(), inline: true }
                )
                .setThumbnail(currentSong.thumbnail)
                .setColor('#00FF00')
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Erreur dans la commande resume:', error);
            
            const embed = new EmbedBuilder()
                .setTitle('❌ Erreur')
                .setDescription('Une erreur est survenue lors de la reprise de la lecture.')
                .setColor('#FF0000');
            
            await interaction.reply({ embeds: [embed] });
        }
    }
};
