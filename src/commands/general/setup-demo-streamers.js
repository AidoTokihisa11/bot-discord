import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ChannelType } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('setup-demo-streamers')
        .setDescription('🎮 Configuration rapide avec des streamers populaires pour la démo')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
        .addChannelOption(option =>
            option
                .setName('channel')
                .setDescription('Canal où envoyer les notifications')
                .setRequired(true)
                .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
        )
        .addRoleOption(option =>
            option
                .setName('role')
                .setDescription('Rôle à mentionner (optionnel)')
                .setRequired(false)
        ),

    async execute(interaction) {
        try {
            await interaction.deferReply({ ephemeral: true });

            const channel = interaction.options.getChannel('channel');
            const role = interaction.options.getRole('role');
            const streamManager = interaction.client.streamManager;

            if (!streamManager) {
                return await interaction.editReply({
                    content: '❌ Le système de notifications de stream n\'est pas initialisé.'
                });
            }

            // Liste des streamers populaires à ajouter
            const popularStreamers = [
                { platform: 'twitch', username: 'ninja', name: 'Ninja' },
                { platform: 'twitch', username: 'pokimane', name: 'Pokimane' },
                { platform: 'twitch', username: 'shroud', name: 'shroud' },
                { platform: 'twitch', username: 'xqc', name: 'xQc' },
                { platform: 'youtube', username: 'mrbeast', name: 'MrBeast' },
                { platform: 'youtube', username: 'pewdiepie', name: 'PewDiePie' },
                { platform: 'kick', username: 'adin', name: 'Adin Ross' },
                { platform: 'kick', username: 'trainwreck', name: 'Trainwreck' }
            ];

            let addedCount = 0;
            let skippedCount = 0;
            const results = [];

            for (const streamer of popularStreamers) {
                const customMessage = role 
                    ? `🔴 ${streamer.name} est maintenant en LIVE ! 🎮`
                    : `🔴 ${streamer.name} est maintenant en LIVE ! 🎮`;

                const result = await streamManager.addStreamer(
                    interaction.guild.id,
                    streamer.platform,
                    streamer.username,
                    channel.id,
                    role?.id,
                    customMessage
                );

                if (result.success) {
                    addedCount++;
                    results.push(`✅ ${streamer.name} (${streamer.platform.toUpperCase()})`);
                } else {
                    skippedCount++;
                    results.push(`⚠️ ${streamer.name} (${result.error || 'déjà configuré'})`);
                }
            }

            const embed = new EmbedBuilder()
                .setColor('#00ff88')
                .setTitle('🎮 Configuration des streamers populaires')
                .setDescription(`Configuration terminée pour ${popularStreamers.length} streamers`)
                .addFields(
                    { name: '✅ Ajoutés', value: `${addedCount} streamers`, inline: true },
                    { name: '⚠️ Ignorés', value: `${skippedCount} streamers`, inline: true },
                    { name: '📢 Canal', value: `${channel}`, inline: true }
                )
                .setTimestamp();

            if (role) {
                embed.addFields({ name: '🏷️ Rôle à mentionner', value: `${role}`, inline: true });
            }

            // Ajouter la liste des résultats si elle n'est pas trop longue
            if (results.length <= 10) {
                embed.addFields({
                    name: '📋 Détails',
                    value: results.join('\n'),
                    inline: false
                });
            }

            await interaction.editReply({ embeds: [embed] });

            // Envoyer un message de confirmation dans le canal de notifications
            if (addedCount > 0) {
                try {
                    const confirmEmbed = new EmbedBuilder()
                        .setColor('#6441a4')
                        .setTitle('🎮 Système de notifications activé !')
                        .setDescription(`**${addedCount} streamers populaires** sont maintenant surveillés dans ce canal`)
                        .addFields(
                            { name: '🔍 Vérification', value: 'Toutes les 2 minutes', inline: true },
                            { name: '🎯 Mode', value: 'Démonstration', inline: true },
                            { name: '⚡ Statut', value: 'Actif', inline: true }
                        )
                        .setFooter({ text: 'Utilisez /stream-notifications demo pour voir des exemples de notifications' })
                        .setTimestamp();

                    await channel.send({ embeds: [confirmEmbed] });
                } catch (error) {
                    console.error('Erreur lors de l\'envoi du message de confirmation:', error);
                }
            }

        } catch (error) {
            console.error('Erreur dans setup-demo-streamers:', error);
            await interaction.editReply({
                content: '❌ Une erreur est survenue lors de la configuration.'
            });
        }
    }
};
