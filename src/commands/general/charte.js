import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('charte')
        .setDescription('📋 Consulter la charte officielle d\'utilisation du bot Team7'),

    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setTitle('📋 **CHARTE OFFICIELLE D\'UTILISATION DU BOT DISCORD**')
            .setDescription('**Référence :** DOC-BOT-2025-002\n**Éditeur :** [Théo Garcès / AidoTokihisa], Développeur Discord\n**Statut :** Partenaire Certifié\n\n**Conformité :**\n• **Conditions des Développeurs Discord :** https://discord.com/developers/docs/legal\n• **Politique de Confidentialité Discord :** https://discord.com/privacy\n• **RGPD UE 2016/679 :** https://eur-lex.europa.eu/eli/reg/2016/679')
            .addFields(
                {
                    name: '👨‍💻 **1. DROITS ET PROTECTIONS DU DÉVELOPPEUR**',
                    value: `**1.1 Propriété Exclusive**\nLe code source, l'infrastructure et les algorithmes sont ma propriété intellectuelle exclusive.\n\nToute tentative de :\n• Reverse engineering (Article 2 des Conditions Développeurs)\n• Réutilisation non autorisée\n• Commercialisation sans accord écrit\n**est strictement interdite et passible de poursuites**\n\n**1.2 Protection Juridique**\nEn cas de :\n• **Fuite de code** → Application du Digital Millennium Copyright Act (DMCA)\n• **Utilisation abusive** → Signalement à Discord Trust & Safety : https://discord.com/safety`,
                    inline: false
                },
                {
                    name: '👥 **2. DROITS ET LIMITATIONS DU STAFF**',
                    value: `**2.1 Autorisations**\nLe staff a le droit de :\n✅ Utiliser les commandes de modération standard (!ban, !mute)\n✅ Consulter les logs de modération (30 jours max)\n✅ Proposer des améliorations via le système de tickets\n\n**2.2 Interdictions Absolues**\nLe staff NE PEUT PAS :\n❌ Accéder au code source ou à l'infrastructure\n❌ Modifier les paramètres techniques du bot\n❌ Contourner les restrictions de sécurité\n❌ Utiliser le bot à des fins personnelles ou malveillantes\n\n**2.3 Responsabilités du Staff**\n• Maintenir la confidentialité des accès\n• Signaler immédiatement tout comportement suspect\n• Respecter les limites d'utilisation définies`,
                    inline: false
                },
                {
                    name: '🔒 **3. PROTECTION DES DONNÉES**',
                    value: `**3.1 Données Collectées**\n\`\`\`\nType        Conservation  Finalité     Conformité\nUserIDs     90 jours      Modération   RGPD Art.5\nMessages    30 jours      Sécurité     Directive ePrivacy\nLogs        60 jours      Audit        Loi Informatique et Libertés\n\`\`\`\n\n**3.2 Sécurité Renforcée**\n• Chiffrement AES-256 des données sensibles\n• Double authentification pour les accès admin\n• Audit trimestriel par un tiers indépendant`,
                    inline: false
                },
                {
                    name: '⚖️ **4. GESTION DES CONFLITS**',
                    value: `**4.1 Procédure de Médiation**\n• **Phase amiable :** Discussion en ticket privé\n• **Arbitrage :** Intervention d'un expert neutre\n• **Sanctions :**\n  - Suspension temporaire des fonctionnalités\n  - Bannissement définitif si nécessaire\n\n**4.2 Protection contre les Abus**\nToute tentative de :\n• **Piratage** → Signalement à https://discord.com/security\n• **Harcèlement** → Plainte via https://www.internet-signalement.gouv.fr`,
                    inline: false
                },
                {
                    name: '📄 **5. CLAUSES SPÉCIFIQUES**',
                    value: `**5.1 Modification/Suppression**\nJe peux à tout moment :\n• Mettre à jour le bot\n• Modifier ses fonctionnalités\n• Interrompre le service (avec préavis de 15 jours)\n\n**5.2 Transfert de Propriété**\nConditions strictes :\n• Accord écrit obligatoire\n• Période de transition de 30 jours\n• Formation du nouveau propriétaire`,
                    inline: false
                },
                {
                    name: '✍️ **SIGNATURES**',
                    value: `**Signé par :**\n**Theo / AidoTokihisa**, Développeur et Propriétaire\n**Le :** 05/08/2025\n\n**Pour acceptation :**\n**Membre du Conseil d'Administration Team7**\n**Le :** 05/08/2025`,
                    inline: false
                },
                {
                    name: '⚠️ **AVERTISSEMENT LÉGAL**',
                    value: `Toute violation de cette charte peut entraîner des **poursuites judiciaires** conformément aux lois françaises et européennes en vigueur.\n\n**Document protégé - Reproduction interdite sans autorisation**`,
                    inline: false
                }
            )
            .setColor('#e74c3c')
            .setThumbnail(interaction.guild.iconURL({ size: 256 }))
            .setImage('https://i.imgur.com/s74nSIc.png')
            .setTimestamp()
            .setFooter({ 
                text: 'Charte Officielle Team7 Bot • DOC-BOT-2025-002',
                iconURL: 'https://i.imgur.com/s74nSIc.png'
            });

        const actionRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('charte_validate')
                    .setLabel('✅ J\'ai lu et j\'accepte cette charte')
                    .setStyle(ButtonStyle.Success)
            );

        await interaction.reply({
            embeds: [embed],
            components: [actionRow]
        });
    }
};
