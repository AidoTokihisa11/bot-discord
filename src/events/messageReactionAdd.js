import Logger from '../utils/Logger.js';

export default {
    name: 'messageReactionAdd',
    async execute(reaction, user) {
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

            // Système de validation du règlement
            if (emoji.name === '✅') {
                await handleRuleValidation(message, member, logger);
            }

        } catch (error) {
            logger.error('Erreur dans messageReactionAdd:', error);
        }
    }
};

async function handleRuleValidation(message, member, logger) {
    try {
        const guild = member.guild;
        const validationRoleId = '1386990308679483393';

        // Vérifier si le message contient le règlement (recherche dans les embeds)
        const isRuleMessage = message.embeds.some(embed => 
            embed.title?.includes('RÈGLEMENT') || 
            embed.title?.includes('VALIDATION') ||
            embed.description?.includes('VALIDATION DU RÈGLEMENT')
        );

        if (!isRuleMessage) return;

        // Vérifier si le membre a déjà le rôle
        if (member.roles.cache.has(validationRoleId)) {
            logger.info(`${member.user.tag} a déjà le rôle de validation`);
            return;
        }

        // Récupérer le rôle de validation
        const validationRole = guild.roles.cache.get(validationRoleId);
        if (!validationRole) {
            logger.error(`Rôle de validation introuvable: ${validationRoleId}`);
            return;
        }

        // Attribuer le rôle
        await member.roles.add(validationRole, 'Validation du règlement');

        // Envoyer un message de confirmation en MP
        try {
            const welcomeMessage = `
🎉 **Bienvenue sur ${guild.name} !**

✅ **Règlement validé avec succès !**
Vous avez maintenant accès à l'ensemble du serveur.

**🎯 Prochaines étapes :**
• Explorez les différents canaux
• Présentez-vous si vous le souhaitez
• Participez aux discussions
• N'hésitez pas à utiliser le système de tickets pour toute question

**🛡️ Rappel :** Le respect du règlement est obligatoire en permanence.

Bonne découverte ! 🚀`;

            await member.send(welcomeMessage);
        } catch (dmError) {
            // Ignorer si on ne peut pas envoyer de MP
            logger.warn(`Impossible d'envoyer un MP à ${member.user.tag}:`, dmError.message);
        }

        // Log de l'action
        logger.success(`Rôle de validation attribué à ${member.user.tag} (${member.id})`);

        // Optionnel : Envoyer une notification dans un canal de logs
        const logChannelId = process.env.LOG_CHANNEL_ID; // Vous pouvez configurer cela
        if (logChannelId) {
            const logChannel = guild.channels.cache.get(logChannelId);
            if (logChannel) {
                const logEmbed = {
                    color: 0x00ff88,
                    title: '✅ Nouveau Membre Validé',
                    description: `${member} a validé le règlement et reçu le rôle <@&${validationRoleId}>`,
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
        logger.error('Erreur lors de la validation du règlement:', error);
    }
}
