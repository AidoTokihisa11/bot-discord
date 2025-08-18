import Logger from '../utils/Logger.js';

export default {
    name: 'messageReactionAdd',
    async execute(reaction, user, client) {
        const logger = new Logger();

        try {
            // Log de débogage pour vérifier que l'événement se déclenche
            logger.info(`🔍 Réaction détectée: ${reaction.emoji.name} par ${user.tag}`);
            
            // Ignorer les réactions du bot
            if (user.bot) {
                logger.info('🤖 Réaction du bot ignorée');
                return;
            }

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


            // Système de validation du règlement DÉSACTIVÉ (utiliser seulement les boutons)
            // if (emoji.name === '✅') {
            //     // Vérifier d'abord le footer token ajouté par /reglement
            //     const isRuleMessageByFooter = message.embeds.some(embed => (embed.footer && embed.footer.text && embed.footer.text.includes('reglement:team7')));

            //     if (isRuleMessageByFooter) {
            //         await handleRuleValidation(message, member, logger);
            //         return;
            //     }

            //     // Fallback historique: vérifier le titre/description
            //     await handleRuleValidation(message, member, logger);
            // }

        } catch (error) {
            logger.error('Erreur dans messageReactionAdd:', error);
        }
    }
};

async function handleRuleValidation(message, member, logger) {
    try {
        const guild = member.guild;
    const validationRoleId = '1387536419588931616';

        logger.info(`🎯 Traitement de la validation pour ${member.user.tag}`);
        logger.info(`📋 ID du rôle de validation: ${validationRoleId}`);

        // Vérifier si le message contient le règlement (recherche dans les embeds)
        const isRuleMessage = message.embeds.some(embed => 
            embed.title?.includes('RÈGLEMENT') || 
            embed.title?.includes('VALIDATION') ||
            embed.description?.includes('VALIDATION DU RÈGLEMENT')
        );

        logger.info(`📝 Message de règlement détecté: ${isRuleMessage}`);
        if (!isRuleMessage) {
            logger.info('❌ Ce n\'est pas un message de règlement, arrêt du traitement');
            return;
        }

        // Vérifier si le membre a déjà le rôle
        if (member.roles.cache.has(validationRoleId)) {
            logger.info(`${member.user.tag} a déjà le rôle de validation (${validationRoleId})`);
            return;
        }

        // Récupérer le rôle de validation via fetch pour éviter cache stale
        let validationRole;
        try {
            validationRole = await guild.roles.fetch(validationRoleId);
        } catch (fetchError) {
            logger.error(`Erreur lors de la récupération du rôle ${validationRoleId}:`, fetchError);
        }

        if (!validationRole) {
            logger.error(`Rôle de validation introuvable: ${validationRoleId}`);
            return;
        }

        // Log roles avant
        logger.info(`Rôles avant ajout pour ${member.user.tag}: ${member.roles.cache.map(r => `${r.name}:${r.id}`).join(', ')}`);

        // Attribuer le rôle
        try {
            await member.roles.add(validationRole, 'Validation du règlement');
            // re-fetch member to update roles cache
            await member.fetch();
            logger.success(`Rôle ${validationRole.name} (${validationRole.id}) attribué à ${member.user.tag}`);
            logger.info(`Rôles après ajout pour ${member.user.tag}: ${member.roles.cache.map(r => `${r.name}:${r.id}`).join(', ')}`);
        } catch (addError) {
            logger.error(`Erreur lors de l'attribution du rôle ${validationRoleId} à ${member.user.tag}:`, addError);
        }

        // Envoyer un message de confirmation en MP
        try {
            const welcomeMessage = `🎉 Bienvenue sur ${guild.name} !\n\n✅ Règlement validé avec succès !\nVous avez maintenant accès à l'ensemble du serveur.\n\n🎯 Prochaines étapes :\n• Explorez les différents canaux\n• Présentez-vous si vous le souhaitez\n• Participez aux discussions\n• N'hésitez pas à utiliser le système de tickets pour toute question\n\n🛡️ Rappel : Le respect du règlement est obligatoire en permanence.\n\nBonne découverte ! 🚀`;

            await member.send(welcomeMessage);
        } catch (dmError) {
            logger.warn(`Impossible d'envoyer un MP à ${member.user.tag}: ${dmError.message}`);

            // Fallback: envoyer la notification dans un channel configuré ou trouvé automatiquement
            try {
                const logChannelId = process.env.LOG_CHANNEL_ID;
                let fallbackChannel = null;

                if (logChannelId) {
                    fallbackChannel = guild.channels.cache.get(logChannelId);
                }

                if (!fallbackChannel) {
                    // Essayer quelques noms de canaux courants
                    fallbackChannel = guild.channels.cache.find(ch => ['welcome', 'bienvenue', 'annonces', 'welcome-channel'].includes((ch.name || '').toLowerCase()));
                }

                if (fallbackChannel && fallbackChannel.isTextBased()) {
                    await fallbackChannel.send({ content: `${member} ${welcomeMessage}` });
                    logger.info(`Notification de bienvenue envoyée dans ${fallbackChannel.name} pour ${member.user.tag}`);
                } else {
                    logger.warn('Aucun canal de fallback trouvé pour envoyer la notification de bienvenue');
                }
            } catch (fallbackError) {
                logger.error('Erreur lors de l\'envoi de la notification de bienvenue en fallback:', fallbackError);
            }
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
