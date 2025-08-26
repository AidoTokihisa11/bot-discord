import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import MusicManager from '../../managers/MusicManager.js';

import AccessRestriction from '../../utils/AccessRestriction.js';
export default {
    data: new SlashCommandBuilder()
        .setName('shuffle')
        .setDescription('Mélanger la queue de musiques')
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

            // Vérifier s'il y a assez de musiques à mélanger
            if (queue.songs.length < 2) {
                const embed = new EmbedBuilder()
                    .setTitle('❌ Queue insuffisante')
                    .setDescription('Il faut au moins 2 musiques dans la queue pour mélanger !')
                    .setColor('#FF0000');
                
                return await interaction.reply({ embeds: [embed] });
            }

            const beforeCount = queue.songs.length;
            
            // Mélanger la queue
            MusicManager.shuffle(interaction.guildId);

            const embed = new EmbedBuilder()
                .setTitle('🔀 Queue mélangée')
                .setDescription('La queue de musiques a été mélangée !')
                .addFields(
                    { name: '🎵 Musiques mélangées', value: `${beforeCount} musique(s)`, inline: true },
                    { name: '👤 Mélangée par', value: member.user.toString(), inline: true }
                )
                .setColor('#9932CC')
                .setTimestamp();

            // Afficher les 3 prochaines musiques
            if (queue.songs.length > 1) {
                const nextSongs = queue.songs.slice(1, 4).map((song, index) => 
                    `**${index + 2}.** ${song.title}`
                ).join('\n');
                
                embed.addFields(
                    { name: '⏭️ Prochaines musiques', value: nextSongs, inline: false }
                );
            }

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Erreur dans la commande shuffle:', error);
            
            const embed = new EmbedBuilder()
                .setTitle('❌ Erreur')
                .setDescription('Une erreur est survenue lors du mélange de la queue.')
                .setColor('#FF0000');
            
            await interaction.reply({ embeds: [embed] });
        }
    }
};
