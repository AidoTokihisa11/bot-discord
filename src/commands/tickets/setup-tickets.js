import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ChannelType } from 'discord.js';
import TicketManager from '../../managers/TicketManager.js';

export default {
    data: new SlashCommandBuilder()
        .setName('setup-tickets')
        .setDescription('🎫 Configure le système de tickets avancé pour votre serveur')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const { client, guild, user } = interaction;

        try {
            await interaction.deferReply({ ephemeral: true });

            // Initialiser le gestionnaire de tickets
            if (!client.ticketManager) {
                client.ticketManager = new TicketManager(client);
            }

            // Vérifier que c'est le bon serveur
            if (guild.id !== '1368917489160818728') {
                return await interaction.editReply({
                    content: '❌ Cette commande ne peut être utilisée que sur le serveur configuré.'
                });
            }

            // Initialiser le TicketManager avec les bons IDs
            client.ticketManager.moderatorRoleId = '1386784012269387946';

            // Récupérer le canal de tickets configuré
            const ticketChannel = guild.channels.cache.get('1368921898867621908');
            if (!ticketChannel) {
                return await interaction.editReply({
                    content: '❌ Canal de tickets introuvable ! Vérifiez la configuration.'
                });
            }

            // Créer le panneau de tickets dans le canal configuré
            const ticketPanel = await client.ticketManager.createTicketPanel(ticketChannel);

            // Embed de confirmation
            const confirmEmbed = new EmbedBuilder()
                .setColor('#00ff88')
                .setTitle('✅ Système de Tickets Configuré')
                .setDescription(`
**Le système de tickets a été configuré avec succès !**

**📍 Panneau créé dans :** <#${ticketChannel.id}>
**🎯 Message ID :** \`${ticketPanel.id}\`
**⚙️ Configuré par :** ${user}

**🔧 Fonctionnalités activées :**
• 6 catégories de tickets disponibles
• Notifications automatiques aux modérateurs
• Interface moderne avec boutons et modals
• Système de priorités avancé
• Statistiques en temps réel
• Gestion automatique des permissions

**📋 Catégories disponibles :**
🔧 Support Technique (< 2h)
❓ Questions Générales (< 4h)
🚨 Signalement (< 1h)
🤝 Partenariat (< 24h)
💡 Suggestion (< 12h)
⚖️ Appel de Sanction (< 6h)

**🎉 Le système est maintenant opérationnel !**
                `)
                .addFields(
                    {
                        name: '👥 Rôle Modérateur',
                        value: `<@&${client.ticketManager.moderatorRoleId}>`,
                        inline: true
                    },
                    {
                        name: '📊 Statistiques',
                        value: `Tickets ouverts: \`${await client.ticketManager.getOpenTicketsCount()}\``,
                        inline: true
                    },
                    {
                        name: '🔗 Commandes utiles',
                        value: '`/ticket-stats` - Voir les statistiques\n`/ticket-config` - Configuration avancée',
                        inline: false
                    }
                )
                .setThumbnail(guild.iconURL({ dynamic: true }))
                .setTimestamp()
                .setFooter({ 
                    text: `Configuré par ${user.tag}`, 
                    iconURL: user.displayAvatarURL() 
                });

            await interaction.editReply({
                embeds: [confirmEmbed]
            });

            // Log de l'action
            if (client.logger) {
                client.logger.success(`🎫 Système de tickets configuré dans #${ticketChannel.name} par ${user.tag}`);
            } else {
                console.log(`🎫 Système de tickets configuré dans #${ticketChannel.name} par ${user.tag}`);
            }

        } catch (error) {
            client.logger.error('Erreur lors de la configuration des tickets:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Erreur de Configuration')
                .setDescription(`
Une erreur est survenue lors de la configuration du système de tickets.

**Erreur :** \`${error.message}\`

**Solutions possibles :**
• Vérifiez que le bot a les permissions nécessaires
• Assurez-vous que le salon existe et est accessible
• Contactez un administrateur si le problème persiste
                `)
                .setTimestamp();

            await interaction.editReply({
                embeds: [errorEmbed]
            });
        }
    }
};
