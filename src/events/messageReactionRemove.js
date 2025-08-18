import Logger from '../utils/Logger.js';

export default {
    name: 'messageReactionRemove',
    async execute(reaction, user, client) {
        const logger = new Logger();

        try {
            // Ignorer les réactions du bot
            if (user.bot) return;

            // Vérifier si la réaction est partielle et la récupérer complètement
            if (reaction.partial) {
                try {
                    await reaction.fetch();
                } catch (error) {
                    logger.error('Erreur lors de la récupération de la réaction:', error);
                    return;
                }
            }

            const { message, emoji } = reaction;
            const guild = message.guild;
            const member = guild.members.cache.get(user.id);

            if (!member) return;


            // Système de révocation du règlement (fallback pour l'ancien système)
            if (emoji.name === '✅') {
                await handleRuleRevocation(message, member, logger);
            }

        } catch (error) {
            logger.error('Erreur dans messageReactionRemove:', error);
        }
    }
};

async function handleRuleRevocation(message, member, logger) {
    try {
        const guild = member.guild;
    const validationRoleId = '1387543998448668843';

        // Vérifier si le message contient le règlement (recherche dans les embeds)
        const isRuleMessage = message.embeds.some(embed => 
            embed.title?.includes('RÈGLEMENT') || 
            embed.title?.includes('VALIDATION') ||
            embed.description?.includes('VALIDATION DU RÈGLEMENT')
        );

        if (!isRuleMessage) return;

        // Vérifier si le membre a le rôle
        if (!member.roles.cache.has(validationRoleId)) {
            logger.info(`${member.user.tag} n'a pas le rôle de validation`);
            return;
        }

        // Récupérer le rôle de validation
        const validationRole = guild.roles.cache.get(validationRoleId);
        if (!validationRole) {
            logger.error(`Rôle de validation introuvable: ${validationRoleId}`);
            return;
        }

        // Retirer le rôle
        await member.roles.remove(validationRole, 'Révocation de la validation du règlement');

        // Envoyer un message d'information en MP
        try {
            const revocationMessage = `⚠️ Révocation de la validation - ${guild.name}\n\n❌ Votre validation du règlement a été révoquée.\nVous avez retiré votre réaction ✅ du message de règlement.\n\n🔒 Conséquences :\n• Accès limité aux canaux du serveur\n• Certaines fonctionnalités peuvent être restreintes\n• Participation aux activités limitée\n\n🔄 Pour retrouver l'accès complet :\n• Retournez sur le message du règlement\n• Relisez attentivement les règles\n• Réagissez à nouveau avec ✅\n\n💡 Besoin d'aide ?\nUtilisez le système de tickets pour contacter l'équipe de modération.\n\n🛡️ Rappel : La validation du règlement est obligatoire pour participer pleinement à la communauté.`;

            await member.send(revocationMessage);
        } catch (dmError) {
            logger.warn(`Impossible d'envoyer un MP à ${member.user.tag}: ${dmError.message}`);
        }

        // Log de l'action
        logger.warn(`Rôle de validation retiré à ${member.user.tag} (${member.id})`);

        // Optionnel : Envoyer une notification dans un canal de logs
        try {
            const logChannelId = process.env.LOG_CHANNEL_ID; // Vous pouvez configurer cela
            let logChannel = null;

            if (logChannelId) {
                logChannel = guild.channels.cache.get(logChannelId);
            }

            if (!logChannel) {
                logChannel = guild.channels.cache.find(ch => ['logs', 'logs-charte', 'annonces'].includes((ch.name || '').toLowerCase()));
            }

            if (logChannel && logChannel.isTextBased()) {
                const logEmbed = {
                    color: 0xff6b6b,
                    title: '❌ Validation Révoquée',
                    description: `${member} a retiré sa validation du règlement et perdu le rôle <@&${validationRoleId}>`,
                    fields: [
                        {
                            name: 'Utilisateur',
                            value: `${member.user.tag} (${member.id})`,
                            inline: true
                        },
                        {
                            name: 'Date',
                            value: `<t:${Math.floor(Date.now() / 1000)}:F>`,
                            inline: true
                        },
                        {
                            name: 'Action',
                            value: 'Réaction ✅ retirée du règlement',
                            inline: false
                        }
                    ],
                    thumbnail: {
                        url: member.user.displayAvatarURL({ dynamic: true })
                    },
                    timestamp: new Date().toISOString()
                };

                await logChannel.send({ embeds: [logEmbed] });
            }
        } catch (logError) {
            logger.error('Erreur lors de l\'envoi du log de révocation:', logError);
        }

    } catch (error) {
        logger.error('Erreur lors de la révocation du règlement:', error);
    }
}
