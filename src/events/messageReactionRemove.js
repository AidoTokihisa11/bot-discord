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

            // Système de rôles gaming avancé (priorité)
            if (client.gamingRoleManager) {
                const gameData = client.gamingRoleManager.getGameByEmoji(emoji.name);
                if (gameData) {
                    const handled = await client.gamingRoleManager.handleRoleRemove(reaction, user, gameData.key);
                    if (handled) {
                        logger.info(`🎮 Rôle gaming retiré pour ${user.tag}: ${gameData.config.name}`);
                        return;
                    }
                }
            }


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
        const validationRoleId = '1387536419588931616';

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
            const revocationMessage = `
⚠️ **Révocation de la validation - ${guild.name}**

❌ **Votre validation du règlement a été révoquée.**
Vous avez retiré votre réaction ✅ du message de règlement.

**🔒 Conséquences :**
• Accès limité aux canaux du serveur
• Certaines fonctionnalités peuvent être restreintes
• Participation aux activités limitée

**🔄 Pour retrouver l'accès complet :**
• Retournez sur le message du règlement
• Relisez attentivement les règles
• Réagissez à nouveau avec ✅

**💡 Besoin d'aide ?**
Utilisez le système de tickets pour contacter l'équipe de modération.

**🛡️ Rappel :** La validation du règlement est obligatoire pour participer pleinement à la communauté.`;

            await member.send(revocationMessage);
        } catch (dmError) {
            // Ignorer si on ne peut pas envoyer de MP
            logger.warn(`Impossible d'envoyer un MP à ${member.user.tag}:`, dmError.message);
        }

        // Log de l'action
        logger.warn(`Rôle de validation retiré à ${member.user.tag} (${member.id})`);

        // Optionnel : Envoyer une notification dans un canal de logs
        const logChannelId = process.env.LOG_CHANNEL_ID; // Vous pouvez configurer cela
        if (logChannelId) {
            const logChannel = guild.channels.cache.get(logChannelId);
            if (logChannel) {
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
        }

    } catch (error) {
        logger.error('Erreur lors de la révocation du règlement:', error);
    }
}
