import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, MessageFlags } from 'discord.js';

import AccessRestriction from '../../utils/AccessRestriction.js';
export default {
    data: new SlashCommandBuilder()
        .setName('send-women-message')
        .setDescription('Envoie le message de bienvenue pour l\'espace femmes')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        // === VÉRIFICATION D'ACCÈS GLOBALE ===
        const accessRestriction = new AccessRestriction();
        const hasAccess = await accessRestriction.checkAccess(interaction);
        if (!hasAccess) {
            return; // Accès refusé, message déjà envoyé
        }


        try {
            // Utiliser le validateur d'interactions pour une déférence rapide
            const validator = interaction.client.interactionValidator;
            const deferred = await validator.quickDefer(interaction, { flags: MessageFlags.Ephemeral });
            
            if (!deferred) {
                return; // Interaction expirée ou déjà traitée
            }

            const channelIds = ['1368972767013376040', '1391778610972463137']; // IDs des canaux femmes
            const channels = [];
            
            for (const channelId of channelIds) {
                const channel = interaction.guild.channels.cache.get(channelId);
                if (channel) {
                    channels.push(channel);
                }
            }

            if (channels.length === 0) {
                return await interaction.editReply({
                    content: '❌ Aucun canal trouvé.'
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
• Simplement papoter entre vous

**✨ Cet espace est pensé pour que chacune se sente libre, écoutée et respectée.**

**🔒 Cet endroit vous est strictement réservé. Profitez-en pleinement !**

**🌺 Bienvenue à toutes !**

<@&1387540586084569179>`)
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

            // Envoyer le message dans tous les canaux trouvés
            const sentChannels = [];
            for (const channel of channels) {
                try {
                    await channel.send({
                        embeds: [womenEmbed]
                    });
                    sentChannels.push(channel.toString());
                } catch (error) {
                    console.error(`Erreur lors de l'envoi dans ${channel.name}:`, error);
                }
            }

            if (sentChannels.length > 0) {
                await interaction.editReply({
                    content: `✅ Message de l'espace femmes envoyé avec succès dans ${sentChannels.join(', ')}`
                });
            } else {
                await interaction.editReply({
                    content: '❌ Impossible d\'envoyer le message dans les canaux.'
                });
            }

        } catch (error) {
            console.error('Erreur lors de l\'envoi du message espace femmes:', error);
            await interaction.editReply({
                content: '❌ Une erreur est survenue lors de l\'envoi du message.'
            });
        }
    }
};
