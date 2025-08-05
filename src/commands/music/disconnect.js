import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import MusicManager from '../../managers/MusicManager.js';

export default {
    data: new SlashCommandBuilder()
        .setName('disconnect')
        .setDescription('Déconnecter le bot du canal vocal')
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
            const channelName = queue.voiceChannel?.name || 'Canal inconnu';
            
            // Déconnecter le bot
            MusicManager.disconnect(interaction.guildId);

            const embed = new EmbedBuilder()
                .setTitle('👋 Déconnexion')
                .setDescription(`Déconnecté du canal vocal **${channelName}**`)
                .addFields(
                    { name: '🗑️ Musiques supprimées', value: `${songsCleared} musique(s)`, inline: true },
                    { name: '👤 Déconnecté par', value: member.user.toString(), inline: true }
                )
                .setColor('#FF6600')
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Erreur dans la commande disconnect:', error);
            
            const embed = new EmbedBuilder()
                .setTitle('❌ Erreur')
                .setDescription('Une erreur est survenue lors de la déconnexion.')
                .setColor('#FF0000');
            
            await interaction.reply({ embeds: [embed] });
        }
    }
};
