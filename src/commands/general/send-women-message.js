import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('send-women-message')
        .setDescription('Envoie le message de bienvenue pour l\'espace femmes')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        try {
            await interaction.deferReply({ ephemeral: true });

            const channelId = '1368972767013376040'; // Remplacez par l'ID du canal femmes
            const channel = interaction.guild.channels.cache.get(channelId);

            if (!channel) {
                return await interaction.editReply({
                    content: '❌ Canal introuvable.'
                });
            }

            const womenEmbed = new EmbedBuilder()
                .setColor('#E91E63')
                .setTitle('🌸 **Espace Femmes** 🌸')
                .setDescription(`
> 👋 **Mesdames, Mesdemoiselles, bienvenue à vous dans cet espace dédié aux femmes de la communauté !**

**💬 Ici, tu peux :**
• Discuter en toute bienveillance
• Partager tes passions
• Poser tes questions
• Simplement papoter entre nous

**✨ Cet espace est pensé pour que chacune se sente libre, écoutée et respectée.**

**🔒 Cet endroit vous est strictement réservé. Profitez-en pleinement !**

**🌺 Bienvenue à toutes !**`)
                .addFields(
                    {
                        name: '💎 **Valeurs de cet espace**',
                        value: '🤝 Bienveillance\n💕 Respect\n🌟 Liberté d\'expression\n👭 Solidarité',
                        inline: true
                    },
                    {
                        name: '🎯 **Objectifs**',
                        value: '💬 Échanges authentiques\n🌸 Bien-être collectif\n✨ Entraide mutuelle\n🌈 Diversité célébrée',
                        inline: true
                    }
                )
                .setThumbnail(interaction.guild.iconURL({ dynamic: true, size: 256 }))
                .setFooter({ 
                    text: '🌸 Espace Femmes • Bienveillance • Respect • Solidarité 🌸',
                    iconURL: interaction.client.user.displayAvatarURL({ dynamic: true })
                })
                .setTimestamp();

            await channel.send({
                embeds: [womenEmbed]
            });

            await interaction.editReply({
                content: `✅ Message de l'espace femmes envoyé avec succès dans ${channel}`
            });

        } catch (error) {
            console.error('Erreur lors de l\'envoi du message espace femmes:', error);
            await interaction.editReply({
                content: '❌ Une erreur est survenue lors de l\'envoi du message.'
            });
        }
    }
};
