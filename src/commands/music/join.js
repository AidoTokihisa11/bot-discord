import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import MusicManager from '../../managers/MusicManager.js';

import AccessRestriction from '../../utils/AccessRestriction.js';
export default {
    data: new SlashCommandBuilder()
        .setName('join')
        .setDescription('Faire rejoindre le bot dans votre canal vocal')
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

            // Vérifier si l'utilisateur est dans un canal vocal
            if (!voiceChannel) {
                const embed = new EmbedBuilder()
                    .setTitle('❌ Erreur')
                    .setDescription('Vous devez être dans un canal vocal pour utiliser cette commande !')
                    .setColor('#FF0000');
                
                return await interaction.reply({ embeds: [embed] });
            }

            // Vérifier les permissions du bot
            const permissions = voiceChannel.permissionsFor(interaction.client.user);
            if (!permissions.has(PermissionFlagsBits.Connect) || !permissions.has(PermissionFlagsBits.Speak)) {
                const embed = new EmbedBuilder()
                    .setTitle('❌ Permissions insuffisantes')
                    .setDescription('Je n\'ai pas les permissions pour rejoindre ou parler dans ce canal vocal !')
                    .setColor('#FF0000');
                
                return await interaction.reply({ embeds: [embed] });
            }

            // Vérifier si le bot est déjà connecté
            if (MusicManager.isConnected(interaction.guildId)) {
                const queue = MusicManager.getQueue(interaction.guildId);
                
                if (queue.voiceChannel?.id === voiceChannel.id) {
                    const embed = new EmbedBuilder()
                        .setTitle('✅ Déjà connecté')
                        .setDescription(`Je suis déjà connecté au canal **${voiceChannel.name}** !`)
                        .setColor('#FFA500');
                    
                    return await interaction.reply({ embeds: [embed] });
                } else {
                    // Déconnecter de l'ancien canal et rejoindre le nouveau
                    MusicManager.disconnect(interaction.guildId);
                }
            }

            // Rejoindre le canal vocal
            await MusicManager.joinChannel(voiceChannel, interaction.channel);

            const embed = new EmbedBuilder()
                .setTitle('🎵 Bot connecté')
                .setDescription(`✅ J'ai rejoint le canal vocal **${voiceChannel.name}** !`)
                .addFields(
                    { name: '👥 Membres connectés', value: `${voiceChannel.members.size}`, inline: true },
                    { name: '👤 Invité par', value: member.user.toString(), inline: true }
                )
                .setColor('#00FF00')
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Erreur dans la commande join:', error);
            
            const embed = new EmbedBuilder()
                .setTitle('❌ Erreur')
                .setDescription('Une erreur est survenue lors de la connexion au canal vocal.')
                .setColor('#FF0000');
            
            await interaction.reply({ embeds: [embed] });
        }
    }
};
