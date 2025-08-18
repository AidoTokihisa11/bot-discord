import { SlashCommandBuilder, EmbedBuilder, P                                            name: '6. 🎯 Utilisation des salons',
                        value: 'Respectez les thématiques de chaque salon (texte, vocal, images...).\n\nNe perturbez pas les salons vocaux avec des bruits forts ou une mauvaise qualité de micro.\n\nLisez les descriptions des salons pour bien les utiliser.',
                        inline: false
                    },
                    {
                        name: '7. 📝 Mise à jour du règlement',me: '4. 🔒 Confidentialité',
                        value: 'Ne partagez jamais d\'informations personnelles (adresse, numéro, mot de passe...).\n\nLe doxxing ou la tentative de collecte d\'informations personnelles entraînera un ban immédiat.',
                        inline: false
                    },
                    {
                        name: '5. 👮 Modération et sanctions',
                        value: 'Le staff est là pour faire respecter les règles. Leurs décisions doivent être respectées.\n\nEn cas de problème, utiliser le salon <#1398336201844457485> option "signalement"\n\nLes sanctions peuvent aller du mute temporaire au bannissement définitif, selon la gravité de l\'infraction.',
                        inline: false
                    },
                    {
                        name: '6. 🔧 Utilisation des salons',agsBits, MessageFlags } from 'discord.js';
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
            // Utiliser le validateur d'interactions pour une déférence rapide
            const validator = interaction.client.interactionValidator;
            const deferred = await validator.quickDefer(interaction, { flags: MessageFlags.Ephemeral });
            
            if (!deferred) {
                return; // Interaction expirée ou déjà traitée
            }

            // Embed simple et propre du règlement
            const ruleEmbed = new EmbedBuilder()
                .setColor('#5865F2')
                .setTitle('� **RÈGLEMENT GÉNÉRAL DU SERVEUR**')
                .setDescription(`Bienvenue sur notre serveur Discord ! <a:pikachu:1393960165966876753>
Afin de garantir une ambiance agréable et respectueuse pour tous, merci de lire et de respecter les règles suivantes :`)
                .addFields(
                    {
                        name: '1. 👥 Respect et comportement',
                        value: 'Le respect entre membres est obligatoire. Aucun comportement toxique, harcèlement, discrimination, racisme, sexisme, ou propos haineux ne sera toléré.\n\nLes débats sont autorisés tant qu\'ils restent cordiaux.\n\nPas d\'attaques personnelles, ni d\'incitation à la haine ou à la violence.',
                        inline: false
                    },
                    {
                        name: '2. �️ Langage et contenu',
                        value: 'Le langage SMS, vulgaire ou inapproprié est à éviter.\n\nLes contenus choquants, NSFW, violents, ou illégaux sont strictement interdits.\n\nNe postez pas de spoilers sans avertissement clair.',
                        inline: false
                    },
                    {
                        name: '3. 📢 Publicité et spam',
                        value: 'La publicité pour d\'autres serveurs, chaînes ou réseaux sociaux est interdite sans l\'accord d\'un administrateur.\n\nPas de spam, de flood, ou de ping abusif (utilisation excessive de @).',
                        inline: false
                    },
                    {
                        name: '4. 🔐 Confidentialité',
                        value: 'Ne partagez jamais d\'informations personnelles (adresse, numéro, mot de passe…).\n\nLe doxxing ou la tentative de collecte d\'informations personnelles entraînera un ban immédiat.',
                        inline: false
                    },
                    {
                        name: '5. �‍♂️ Modération et sanctions',
                        value: 'Le staff est là pour faire respecter les règles. Leurs décisions doivent être respectées.\n\nEn cas de problème, utiliser le salon <#1398336201844457485> option "signalement"\n\nLes sanctions peuvent aller du mute temporaire au bannissement définitif, selon la gravité de l\'infraction.',
                        inline: false
                    },
                    {
                        name: '6. �️ Utilisation des salons',
                        value: 'Respectez les thématiques de chaque salon (texte, vocal, images…).\n\nNe perturbez pas les salons vocaux avec des bruits forts ou une mauvaise qualité de micro.\n\nLisez les descriptions des salons pour bien les utiliser.',
                        inline: false
                    },
                    {
                        name: '7. 📌 Mise à jour du règlement',
                        value: 'Le règlement peut être modifié à tout moment. Il est de votre responsabilité de rester informé des mises à jour.\n\nEn restant sur ce serveur, vous acceptez automatiquement les règles énoncées ci-dessus.\n\nMaintenant rends toi dans le salon <#1368919061425164288> pour choisir tes jeux préférés ! <a:licorne:1165016593307279450> <a:GatoXD:1394093700837150740>',
                        inline: false
                    }
                )
                .setThumbnail('https://i.pinimg.com/originals/45/90/c5/4590c5b9594ea14b91456b15e4e08ba7.jpg')
                .setFooter({ 
                    text: '� Règlement Officiel • Réagissez avec ✅ pour valider',
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
