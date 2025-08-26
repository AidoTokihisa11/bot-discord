import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import MusicManager from '../../managers/MusicManager.js';

import AccessRestriction from '../../utils/AccessRestriction.js';
export default {
    data: new SlashCommandBuilder()
        .setName('remove')
        .setDescription('Supprimer une musique de la queue')
        .addIntegerOption(option =>
            option.setName('position')
                .setDescription('Position de la musique à supprimer (1 = musique actuelle)')
                .setRequired(true)
                .setMinValue(1))
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
            const position = interaction.options.getInteger('position');

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

            // Vérifier si la position est valide
            if (position > queue.songs.length) {
                const embed = new EmbedBuilder()
                    .setTitle('❌ Position invalide')
                    .setDescription(`Il n'y a que ${queue.songs.length} musique(s) dans la queue !`)
                    .setColor('#FF0000');
                
                return await interaction.reply({ embeds: [embed] });
            }

            // Empêcher de supprimer la musique en cours si c'est la seule
            if (position === 1 && queue.songs.length === 1) {
                const embed = new EmbedBuilder()
                    .setTitle('❌ Action non autorisée')
                    .setDescription('Vous ne pouvez pas supprimer la seule musique en cours. Utilisez `/stop` pour arrêter complètement.')
                    .setColor('#FF0000');
                
                return await interaction.reply({ embeds: [embed] });
            }

            // Gérer la suppression de la musique en cours
            if (position === 1) {
                const currentSong = queue.songs[0];
                MusicManager.skip(interaction.guildId);
                
                const embed = new EmbedBuilder()
                    .setTitle('⏭️ Musique supprimée et passée')
                    .setDescription(`**${currentSong.title}** a été supprimée et la lecture est passée à la suivante`)
                    .addFields(
                        { name: '👤 Supprimée par', value: member.user.toString(), inline: true }
                    )
                    .setColor('#FF6600')
                    .setTimestamp();

                return await interaction.reply({ embeds: [embed] });
            }

            // Supprimer une musique de la queue (pas la musique actuelle)
            const removedSong = MusicManager.remove(interaction.guildId, position - 1);

            if (!removedSong) {
                const embed = new EmbedBuilder()
                    .setTitle('❌ Erreur')
                    .setDescription('Impossible de supprimer cette musique.')
                    .setColor('#FF0000');
                
                return await interaction.reply({ embeds: [embed] });
            }

            const embed = new EmbedBuilder()
                .setTitle('🗑️ Musique supprimée')
                .setDescription(`**${removedSong.title}** a été supprimée de la queue`)
                .addFields(
                    { name: '📍 Position', value: `${position}`, inline: true },
                    { name: '👤 Supprimée par', value: member.user.toString(), inline: true },
                    { name: '📝 Musiques restantes', value: `${queue.songs.length}`, inline: true }
                )
                .setThumbnail(removedSong.thumbnail)
                .setColor('#FF6600')
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Erreur dans la commande remove:', error);
            
            const embed = new EmbedBuilder()
                .setTitle('❌ Erreur')
                .setDescription('Une erreur est survenue lors de la suppression de la musique.')
                .setColor('#FF0000');
            
            await interaction.reply({ embeds: [embed] });
        }
    }
};
