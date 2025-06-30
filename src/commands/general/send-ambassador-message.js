import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('send-ambassador-message')
        .setDescription('Envoie le message des Ambassadeurs dans le canal spécifié')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        try {
            await interaction.deferReply({ ephemeral: true });

            const channelId = '1388284984724426893';
            const channel = interaction.guild.channels.cache.get(channelId);

            if (!channel) {
                return await interaction.editReply({
                    content: '❌ Canal introuvable.'
                });
            }

            const ambassadorEmbed = new EmbedBuilder()
                .setColor('#DAA520')
                .setAuthor({
                    name: '🎖️ CA Staff G Ambassadeur',
                    iconURL: interaction.guild.iconURL({ dynamic: true })
                })
                .setDescription(`
**Bienvenue sur ce salon qui nous permettra tous d'interagir tous ensemble !**

**Chers Ambassadeur** à travers ce salon vous pourrez nous faire part de vos ressenti personnel, du ressenti de votre communauté sur le serveur, mais aussi toute vos questions et demande que vous pourriez avoir`)
                .setThumbnail(interaction.guild.iconURL({ dynamic: true, size: 256 }))
                .setFooter({ 
                    text: 'Staff & Ambassadeurs • Communication',
                    iconURL: interaction.client.user.displayAvatarURL({ dynamic: true })
                })
                .setTimestamp();

            await channel.send({
                embeds: [ambassadorEmbed]
            });

            await interaction.editReply({
                content: `✅ Message des Ambassadeurs envoyé avec succès dans ${channel}`
            });

        } catch (error) {
            console.error('Erreur lors de l\'envoi du message Ambassadeurs:', error);
            await interaction.editReply({
                content: '❌ Une erreur est survenue lors de l\'envoi du message.'
            });
        }
    }
};
