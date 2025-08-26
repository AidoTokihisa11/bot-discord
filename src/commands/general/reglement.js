import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, MessageFlags, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import Logger from '../../utils/Logger.js';

import AccessRestriction from '../../utils/AccessRestriction.js';
export default {
    data: new SlashCommandBuilder()
        .setName('reglement')
        .setDescription('📋 Affiche le règlement complet du serveur avec système de validation')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        // === VÉRIFICATION D'ACCÈS GLOBALE ===
        const accessRestriction = new AccessRestriction();
        const hasAccess = await accessRestriction.checkAccess(interaction);
        if (!hasAccess) {
            return; // Accès refusé, message déjà envoyé
        }


        const { guild, channel } = interaction;
        const logger = new Logger();

        try {
            const validator = interaction.client.interactionValidator;
            const deferred = await validator.quickDefer(interaction, { flags: MessageFlags.Ephemeral });
            if (!deferred) return;

            // Embed: contenu exact fourni par l'utilisateur (mot pour mot)
            const ruleEmbed = new EmbedBuilder()
                .setColor('#2F3136')
                .setDescription(`📜 **RÈGLEMENT GÉNÉRAL DU SERVEUR**
Bienvenue sur notre serveur Discord ! <a:pikachu:1393960165966876753> 
Afin de garantir une ambiance agréable et respectueuse pour tous, merci de lire et de respecter les règles suivantes :

**1. 🤝 Respect et comportement**
Le respect entre membres est obligatoire. Aucun comportement toxique, harcèlement, discrimination, racisme, sexisme, ou propos haineux ne sera toléré.

Les débats sont autorisés tant qu’ils restent cordiaux.

Pas d’attaques personnelles, ni d’incitation à la haine ou à la violence.

**2. 🗣️ Langage et contenu**
Le langage SMS, vulgaire ou inapproprié est à éviter.

Les contenus choquants, NSFW, violents, ou illégaux sont strictement interdits.

Ne postez pas de spoilers sans avertissement clair.

**3. 📢 Publicité et spam**
La publicité pour d'autres serveurs, chaînes ou réseaux sociaux est interdite sans l’accord d’un administrateur.

Pas de spam, de flood, ou de ping abusif (utilisation excessive de @).

**4. 🔐 Confidentialité**
Ne partagez jamais d’informations personnelles (adresse, numéro, mot de passe…).

Le doxxing ou la tentative de collecte d’informations personnelles entraînera un ban immédiat.

**5. 👮‍♂️ Modération et sanctions**
Le staff est là pour faire respecter les règles. Leurs décisions doivent être respectées.

En cas de problème, utiliser le salon <#1398336201844457485>  option "signalement" 

Les sanctions peuvent aller du mute temporaire au bannissement définitif, selon la gravité de l’infraction.

**6. 🛠️ Utilisation des salons**
Respectez les thématiques de chaque salon (texte, vocal, images…).

Ne perturbez pas les salons vocaux avec des bruits forts ou une mauvaise qualité de micro.

Lisez les descriptions des salons pour bien les utiliser.

**7. 📌 Mise à jour du règlement**
Le règlement peut être modifié à tout moment. Il est de votre responsabilité de rester informé des mises à jour.

En restant sur ce serveur, vous acceptez automatiquement les règles énoncées ci-dessus.


Maintenant rends toi dans le salon <#1368919061425164288>  pour choisir tes jeux préférés ! <a:licorne:1165016593307279450> <a:GatoXD:1394093700837150740>`)
                .setThumbnail('https://i.pinimg.com/originals/45/90/c5/4590c5b9594ea14b91456b15e4e08ba7.jpg')
                .setImage('https://i.pinimg.com/originals/45/90/c5/4590c5b9594ea14b91456b15e4e08ba7.jpg')
                .setFooter({ text: 'reglement:team7' });

            // Créer le bouton de validation
            const validationButton = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('reglement_validate')
                        .setLabel('✅ J\'ai lu et j\'accepte le règlement')
                        .setStyle(ButtonStyle.Success)
                );

            const message = await channel.send({ embeds: [ruleEmbed], components: [validationButton] });

            logger.success(`Règlement publié avec succès dans #${channel.name}`);
            logger.info(`Message ID pour les boutons: ${message.id}`);

            await interaction.editReply({
                content: `✅ **Règlement publié avec succès !**\n\n📋 Le règlement complet a été affiché dans ${channel}\n\n**Message ID :** \`${message.id}\``
            });
        } catch (error) {
            logger.error('Erreur lors de la publication du règlement:', error);
            await interaction.editReply({ content: '❌ Une erreur est survenue lors de la publication du règlement. Vérifiez les permissions du bot.' });
        }
    }
};