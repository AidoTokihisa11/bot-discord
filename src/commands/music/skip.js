import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import MusicManager from '../../managers/MusicManager.js';

import AccessRestriction from '../../utils/AccessRestriction.js';
export default {
    data: new SlashCommandBuilder()
        .setName('skip')
        .setDescription('Passer à la musique suivante')
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
            
            // Passer à la musique suivante
            MusicManager.skip(interaction.guildId);

            const embed = new EmbedBuilder()
                .setTitle('⏭️ Musique passée')
                .setDescription(`**${currentSong?.title || 'Musique inconnue'}** a été passée`)
                .addFields(
                    { name: '👤 Passée par', value: member.user.toString(), inline: true }
                )
                .setColor('#FFA500')
                .setTimestamp();

            // Afficher la prochaine musique si elle existe
            if (queue.songs.length > 1) {
                const nextSong = queue.songs[1];
                embed.addFields(
                    { name: '⏭️ Prochaine musique', value: `**${nextSong.title}**`, inline: false }
                );
            }

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Erreur dans la commande skip:', error);
            
            const embed = new EmbedBuilder()
                .setTitle('❌ Erreur')
                .setDescription('Une erreur est survenue lors du passage de la musique.')
                .setColor('#FF0000');
            
            await interaction.reply({ embeds: [embed] });
        }
    }
};
