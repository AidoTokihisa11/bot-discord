import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import MusicManager from '../../managers/MusicManager.js';

import AccessRestriction from '../../utils/AccessRestriction.js';
export default {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Jouer une musique depuis YouTube')
        .addStringOption(option =>
            option.setName('query')
                .setDescription('Nom de la musique ou URL YouTube')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Connect),

    async execute(interaction) {
        // === VÉRIFICATION D'ACCÈS GLOBALE ===
        const accessRestriction = new AccessRestriction();
        const hasAccess = await accessRestriction.checkAccess(interaction);
        if (!hasAccess) {
            return; // Accès refusé, message déjà envoyé
        }


        try {
            await interaction.deferReply();

            const query = interaction.options.getString('query');
            const member = interaction.member;
            const voiceChannel = member.voice.channel;

            // Vérifier si l'utilisateur est dans un canal vocal
            if (!voiceChannel) {
                const embed = new EmbedBuilder()
                    .setTitle('❌ Erreur')
                    .setDescription('Vous devez être dans un canal vocal pour utiliser cette commande !')
                    .setColor('#FF0000');
                
                return await interaction.editReply({ embeds: [embed] });
            }

            // Vérifier les permissions du bot
            const permissions = voiceChannel.permissionsFor(interaction.client.user);
            if (!permissions.has(PermissionFlagsBits.Connect) || !permissions.has(PermissionFlagsBits.Speak)) {
                const embed = new EmbedBuilder()
                    .setTitle('❌ Permissions insuffisantes')
                    .setDescription('Je n\'ai pas les permissions pour rejoindre ou parler dans ce canal vocal !')
                    .setColor('#FF0000');
                
                return await interaction.editReply({ embeds: [embed] });
            }

            // Rejoindre le canal vocal si pas déjà connecté
            if (!MusicManager.isConnected(interaction.guildId)) {
                await MusicManager.joinChannel(voiceChannel, interaction.channel);
            }

            // Rechercher la musique
            const loadingEmbed = new EmbedBuilder()
                .setTitle('🔍 Recherche en cours...')
                .setDescription(`Recherche de: **${query}**`)
                .setColor('#FFFF00');
            
            await interaction.editReply({ embeds: [loadingEmbed] });

            const song = await MusicManager.searchMusic(query);

            if (!song) {
                const embed = new EmbedBuilder()
                    .setTitle('❌ Aucun résultat')
                    .setDescription(`Aucune musique trouvée pour: **${query}**`)
                    .setColor('#FF0000');
                
                return await interaction.editReply({ embeds: [embed] });
            }

            // Ajouter à la queue
            const addedSong = await MusicManager.addToQueue(interaction.guildId, song, member.user);
            const queue = MusicManager.getQueue(interaction.guildId);

            if (queue.songs.length === 1 && !queue.isPlaying) {
                // Première musique, commencer la lecture
                await MusicManager.play(interaction.guildId);
                
                const embed = new EmbedBuilder()
                    .setTitle('🎵 Lecture commencée')
                    .setDescription(`**[${addedSong.title}](${addedSong.url})**`)
                    .addFields(
                        { name: '⏱️ Durée', value: addedSong.duration, inline: true },
                        { name: '👤 Demandée par', value: addedSong.requestedBy.toString(), inline: true }
                    )
                    .setThumbnail(addedSong.thumbnail)
                    .setColor('#00FF00')
                    .setTimestamp();

                await interaction.editReply({ embeds: [embed] });
            } else {
                // Ajoutée à la queue
                const embed = new EmbedBuilder()
                    .setTitle('✅ Ajoutée à la queue')
                    .setDescription(`**[${addedSong.title}](${addedSong.url})**`)
                    .addFields(
                        { name: '⏱️ Durée', value: addedSong.duration, inline: true },
                        { name: '👤 Demandée par', value: addedSong.requestedBy.toString(), inline: true },
                        { name: '📝 Position dans la queue', value: `${queue.songs.length}`, inline: true }
                    )
                    .setThumbnail(addedSong.thumbnail)
                    .setColor('#0099FF')
                    .setTimestamp();

                await interaction.editReply({ embeds: [embed] });
            }

        } catch (error) {
            console.error('Erreur dans la commande play:', error);
            
            const embed = new EmbedBuilder()
                .setTitle('❌ Erreur')
                .setDescription('Une erreur est survenue lors de la lecture de la musique.')
                .setColor('#FF0000');
            
            if (interaction.deferred) {
                await interaction.editReply({ embeds: [embed] });
            } else {
                await interaction.reply({ embeds: [embed] });
            }
        }
    }
};
