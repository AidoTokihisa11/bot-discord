import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import Logger from '../../utils/Logger.js';

export default {
    data: new SlashCommandBuilder()
        .setName('reglement')
        .setDescription('📋 Affiche le règlement complet du serveur avec système de validation')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const { guild, channel } = interaction;
        const logger = new Logger();

        try {
            await interaction.deferReply({ ephemeral: true });

            // Embed simple et propre du règlement
            const ruleEmbed = new EmbedBuilder()
                .setColor('#5865F2')
                .setTitle('📋 **RÈGLEMENT OFFICIEL DU SERVEUR**')
                .setDescription(`
🏛️ **BIENVENUE SUR ${guild.name.toUpperCase()}** 🏛️

**Bienvenue dans notre communauté !** 🎉
Respectez ces règles pour maintenir un environnement sain et agréable.`)
                .addFields(
                    {
                        name: '🚨 **RÈGLES ESSENTIELLES**',
                        value: '• **Respectez** tous les membres\n• **Aucune insulte** ou harcèlement\n• **Pas de contenu NSFW** ou inapproprié\n• **Utilisez** les bons canaux\n• **Pas de spam** ou flood',
                        inline: true
                    },
                    {
                        name: '💬 **COMMUNICATION**',
                        value: '• **Français correct** exigé\n• **Pas de CAPS LOCK** excessif\n• **Évitez** les mentions abusives\n• **Soyez constructifs** dans vos échanges\n• **Respectez** les discussions',
                        inline: true
                    },
                    {
                        name: '⚖️ **SANCTIONS**',
                        value: '🟡 **Avertissement** → 🟠 **Timeout** → 🔴 **Exclusion/Ban**\n\n**Appel possible** via système de tickets',
                        inline: false
                    },
                    {
                        name: '🛡️ **VOS DROITS & DEVOIRS**',
                        value: '✅ **Droits :** Liberté d\'expression, égalité, protection, support\n📋 **Devoirs :** Respecter le règlement, signaler les problèmes, contribuer positivement',
                        inline: false
                    },
                    {
                        name: '📞 **SUPPORT & CONTACT**',
                        value: '• **Système de tickets** - Support officiel 24h/7j\n• **Équipe de modération** disponible\n• **Décisions équitables** et transparentes',
                        inline: false
                    },
                    {
                        name: '✅ **VALIDATION OBLIGATOIRE**',
                        value: '🎯 **Pour accéder au serveur complet :**\n**1️⃣** Lisez ce règlement\n**2️⃣** Réagissez avec ✅ ci-dessous\n**3️⃣** Recevez votre rôle automatiquement\n\n⚠️ **En réagissant, vous acceptez ce règlement intégralement**',
                        inline: false
                    }
                )
                .setThumbnail(guild.iconURL({ dynamic: true }))
                .setFooter({ 
                    text: '📋 Règlement Officiel • Réagissez avec ✅ pour valider',
                    iconURL: guild.iconURL({ dynamic: true })
                })
                .setTimestamp();

            // Envoyer l'embed
            const message = await channel.send({
                embeds: [ruleEmbed]
            });

            // Ajouter la réaction de validation
            await message.react('✅');

            logger.success(`Règlement publié avec succès dans #${channel.name}`);
            logger.info(`Message ID pour les réactions: ${message.id}`);

            await interaction.editReply({
                content: `✅ **Règlement publié avec succès !**\n\n📋 Le règlement complet a été affiché dans ${channel}\n🎯 Les membres peuvent maintenant réagir avec ✅ pour obtenir le rôle de validation.\n\n**Message ID :** \`${message.id}\` (pour référence)`
            });

        } catch (error) {
            logger.error('Erreur lors de la publication du règlement:', error);
            
            await interaction.editReply({
                content: '❌ Une erreur est survenue lors de la publication du règlement. Vérifiez les permissions du bot.'
            });
        }
    }
};
