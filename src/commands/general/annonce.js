import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import Logger from '../../utils/Logger.js';

export default {
    data: new SlashCommandBuilder()
        .setName('annonce')
        .setDescription('📢 Publie une annonce officielle concernant les nouveaux systèmes')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const { guild, client } = interaction;
        const logger = new Logger();

        try {
            await interaction.deferReply({ ephemeral: true });

            // ID du canal d'annonce
            const announcementChannelId = '1368918195435475024';
            const announcementChannel = guild.channels.cache.get(announcementChannelId);

            if (!announcementChannel) {
                return await interaction.editReply({
                    content: '❌ Canal d\'annonce introuvable. Vérifiez l\'ID du canal.'
                });
            }

            // Embed principal de l'annonce
            const announcementEmbed = new EmbedBuilder()
                .setColor('#00ff88')
                .setTitle('🎉 **MISE À JOUR MAJEURE DU SERVEUR**')
                .setDescription(`**Chers membres de ${guild.name},**

Nous sommes ravis de vous annoncer la mise en service de nos nouveaux systèmes automatisés pour améliorer votre expérience sur le serveur !`)
                .addFields(
                    {
                        name: '📋 **SYSTÈME DE RÈGLEMENT**',
                        value: '• **Validation automatique** par réaction ✅\n• **Attribution de rôle** instantanée\n• **Messages de bienvenue** personnalisés\n• **Gestion des révocations** automatique',
                        inline: true
                    },
                    {
                        name: '🎫 **SYSTÈME DE TICKETS**',
                        value: '• **Support 24h/7j** disponible\n• **6 types de demandes** spécialisées\n• **Temps de réponse** garantis\n• **Interface moderne** et intuitive',
                        inline: true
                    },
                    {
                        name: '⚠️ **INFORMATION IMPORTANTE**',
                        value: '**Pour les membres existants :**\n\n🔹 Le rôle <@&1386990308679483393> vous a été attribué **par défaut**\n🔹 **Ne réagissez PAS** au message de règlement si vous avez déjà ce rôle\n🔹 Cela pourrait causer des **perturbations techniques**\n\n💡 **Seuls les nouveaux membres** doivent valider le règlement',
                        inline: false
                    },
                    {
                        name: '🎯 **COMMENT UTILISER CES SYSTÈMES**',
                        value: '**📋 Règlement :** Consultez le canal dédié pour les règles\n**🎫 Tickets :** Utilisez les boutons dans le canal support\n**❓ Questions :** Notre équipe est là pour vous aider !',
                        inline: false
                    }
                )
                .setThumbnail(guild.iconURL({ dynamic: true }))
                .setFooter({ 
                    text: '🎉 Merci de votre compréhension et bonne utilisation !',
                    iconURL: client.user.displayAvatarURL()
                })
                .setTimestamp();

            // Publier l'annonce
            const message = await announcementChannel.send({
                content: '@everyone',
                embeds: [announcementEmbed]
            });

            // Ajouter des réactions pour l'engagement
            await message.react('🎉');
            await message.react('👍');
            await message.react('❤️');

            logger.success(`Annonce publiée avec succès dans #${announcementChannel.name}`);

            await interaction.editReply({
                content: `✅ **Annonce publiée avec succès !**\n\n📢 L'annonce a été diffusée dans ${announcementChannel}\n🎯 Les membres ont été informés des nouveaux systèmes et des précautions à prendre.\n\n**Message ID :** \`${message.id}\``
            });

        } catch (error) {
            logger.error('Erreur lors de la publication de l\'annonce:', error);
            
            await interaction.editReply({
                content: '❌ Une erreur est survenue lors de la publication de l\'annonce. Vérifiez les permissions du bot.'
            });
        }
    }
};
