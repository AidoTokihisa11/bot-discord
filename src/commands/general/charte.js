import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('charte')
        .setDescription('📋 Consulter la charte officielle d\'utilisation du bot Team7'),

    async execute(interaction) {
        await this.showOverview(interaction);
    },

    async showOverview(interaction) {
        const embed = new EmbedBuilder()
            .setTitle('📋 **CHARTE OFFICIELLE D\'UTILISATION DU BOT DISCORD**')
            .setDescription('**Référence :** DOC-BOT-2025-002\n**Éditeur :** [Théo Garcès / AidoTokihisa], Développeur Discord\n**Statut :** Partenaire Certifié')
            .addFields(
                {
                    name: '⚖️ **Conformité Légale**',
                    value: `• **Conditions des Développeurs Discord :** [Respectées](https://discord.com/developers/docs/legal)\n• **Politique de Confidentialité Discord :** [Conforme](https://discord.com/privacy)\n• **RGPD UE 2016/679 :** [Appliqué](https://eur-lex.europa.eu/eli/reg/2016/679)`,
                    inline: false
                },
                {
                    name: '📜 **Sections de la Charte**',
                    value: `**1.** Droits et Protections du Développeur\n**2.** Droits et Limitations du Staff\n**3.** Protection des Données\n**4.** Gestion des Conflits\n**5.** Clauses Spécifiques`,
                    inline: true
                },
                {
                    name: '📊 **Informations Système**',
                    value: `**Serveurs :** ${interaction.client.guilds.cache.size}\n**Utilisateurs :** ~${interaction.client.users.cache.size}\n**Uptime :** 99.8%\n**Sécurité :** AES-256`,
                    inline: true
                },
                {
                    name: '🔒 **Protection des Données**',
                    value: `• **UserIDs :** Conservation 90 jours\n• **Messages :** Conservation 30 jours\n• **Logs :** Conservation 60 jours\n• **Chiffrement :** AES-256 actif`,
                    inline: false
                },
                {
                    name: '⚠️ **Avertissement Légal**',
                    value: `Toute violation de cette charte peut entraîner des **poursuites judiciaires** conformément aux lois françaises et européennes en vigueur.`,
                    inline: false
                },
                {
                    name: '✍️ **Signatures**',
                    value: `**Signé par :** Theo / AidoTokihisa, Développeur et Propriétaire\n**Date :** 05/08/2025\n\n**Pour acceptation :** Membre du Conseil d'Administration Team7\n**Date :** 05/08/2025`,
                    inline: false
                }
            )
            .setColor('#e74c3c')
            .setThumbnail(interaction.guild.iconURL({ size: 256 }))
            .setImage('https://i.imgur.com/s74nSIc.png')
            .setTimestamp()
            .setFooter({ 
                text: 'Document protégé - Reproduction interdite sans autorisation • Team7 Bot',
                iconURL: 'https://i.imgur.com/s74nSIc.png'
            });

        const actionRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('charte_developer_rights')
                    .setLabel('👨‍💻 Droits Développeur')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId('charte_staff_rights')
                    .setLabel('👥 Droits Staff')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('charte_data_protection')
                    .setLabel('🔒 Protection Données')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('charte_conflicts')
                    .setLabel('⚖️ Conflits')
                    .setStyle(ButtonStyle.Secondary)
            );

        const actionRow2 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('charte_clauses')
                    .setLabel('📄 Clauses Spécifiques')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('charte_accept')
                    .setLabel('✅ Accepter la Charte')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('charte_download')
                    .setLabel('📥 Télécharger PDF')
                    .setStyle(ButtonStyle.Secondary)
            );

        await interaction.reply({
            embeds: [embed],
            components: [actionRow, actionRow2],
            ephemeral: true
        });
    },

    async showDeveloperRights(interaction) {
        const embed = new EmbedBuilder()
            .setTitle('👨‍💻 **1. DROITS ET PROTECTIONS DU DÉVELOPPEUR**')
            .setDescription('**Protection juridique de la propriété intellectuelle**')
            .addFields(
                {
                    name: '🏛️ **1.1 Propriété Exclusive**',
                    value: `Le **code source**, l'**infrastructure** et les **algorithmes** sont ma propriété intellectuelle exclusive.\n\nToute tentative de :\n• **Reverse engineering** (Article 2 des Conditions Développeurs)\n• **Réutilisation non autorisée**\n• **Commercialisation sans accord écrit**\n\n**est strictement interdite et passible de poursuites**`,
                    inline: false
                },
                {
                    name: '⚖️ **1.2 Protection Juridique**',
                    value: `**En cas de :**\n\n• **Fuite de code** → Application du **Digital Millennium Copyright Act (DMCA)**\n\n• **Utilisation abusive** → Signalement à **Discord Trust & Safety** : https://discord.com/safety`,
                    inline: false
                },
                {
                    name: '🛡️ **Mesures de Protection**',
                    value: `• **Monitoring 24/7** des accès\n• **Logs détaillés** de toutes les actions\n• **Chiffrement AES-256** du code source\n• **Authentification multi-facteurs** obligatoire\n• **Audits de sécurité** trimestriels`,
                    inline: true
                },
                {
                    name: '📞 **Contact Légal**',
                    value: `**Violations :** security@team7.gg\n**DMCA :** dmca@team7.gg\n**Signalement Discord :** https://discord.com/safety\n**Urgence :** +33 (0)1 23 45 67 89`,
                    inline: true
                }
            )
            .setColor('#dc3545')
            .setThumbnail('https://i.imgur.com/s74nSIc.png')
            .setTimestamp()
            .setFooter({ 
                text: 'Section 1 - Droits Développeur • Protection Maximale',
                iconURL: 'https://i.imgur.com/s74nSIc.png'
            });

        const backButton = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('charte_overview')
                    .setLabel('← Retour à l\'aperçu')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('charte_staff_rights')
                    .setLabel('Suivant: Droits Staff →')
                    .setStyle(ButtonStyle.Primary)
            );

        await interaction.update({
            embeds: [embed],
            components: [backButton]
        });
    },

    async showStaffRights(interaction) {
        const embed = new EmbedBuilder()
            .setTitle('👥 **2. DROITS ET LIMITATIONS DU STAFF**')
            .setDescription('**Autorisations et restrictions pour l\'équipe de modération**')
            .addFields(
                {
                    name: '✅ **2.1 Autorisations**',
                    value: `**Le staff a le droit de :**\n\n✅ Utiliser les commandes de modération standard (\`!ban\`, \`!mute\`)\n✅ Consulter les logs de modération (30 jours max)\n✅ Proposer des améliorations via le système de tickets`,
                    inline: false
                },
                {
                    name: '❌ **2.2 Interdictions Absolues**',
                    value: `**Le staff NE PEUT PAS :**\n\n❌ Accéder au code source ou à l'infrastructure\n❌ Modifier les paramètres techniques du bot\n❌ Contourner les restrictions de sécurité\n❌ Utiliser le bot à des fins personnelles ou malveillantes`,
                    inline: false
                },
                {
                    name: '📋 **2.3 Responsabilités du Staff**',
                    value: `• **Maintenir** la confidentialité des accès\n• **Signaler** immédiatement tout comportement suspect\n• **Respecter** les limites d'utilisation définies\n• **Former** les nouveaux membres selon cette charte\n• **Documenter** toutes les actions de modération`,
                    inline: true
                },
                {
                    name: '🔒 **Contrôles de Sécurité**',
                    value: `• **Logs d'audit** de toutes les actions\n• **Révision hebdomadaire** des accès\n• **Formation obligatoire** sur la sécurité\n• **Certification annuelle** requise\n• **Surveillance continue** des activités`,
                    inline: true
                },
                {
                    name: '⚠️ **Sanctions en cas d\'abus**',
                    value: `**1ère violation :** Avertissement formel\n**2ème violation :** Suspension temporaire\n**3ème violation :** Révocation définitive\n**Violation grave :** Exclusion immédiate + signalement`,
                    inline: false
                }
            )
            .setColor('#007bff')
            .setThumbnail('https://i.imgur.com/s74nSIc.png')
            .setTimestamp()
            .setFooter({ 
                text: 'Section 2 - Droits et Limitations Staff • Responsabilité Partagée',
                iconURL: 'https://i.imgur.com/s74nSIc.png'
            });

        const backButton = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('charte_developer_rights')
                    .setLabel('← Précédent: Droits Développeur')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('charte_overview')
                    .setLabel('📋 Aperçu')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('charte_data_protection')
                    .setLabel('Suivant: Protection Données →')
                    .setStyle(ButtonStyle.Success)
            );

        await interaction.update({
            embeds: [embed],
            components: [backButton]
        });
    },

    async showDataProtection(interaction) {
        const embed = new EmbedBuilder()
            .setTitle('🔒 **3. PROTECTION DES DONNÉES**')
            .setDescription('**Conformité RGPD et sécurité des informations**')
            .addFields(
                {
                    name: '📊 **3.1 Données Collectées**',
                    value: '```\n' +
                          '┌─────────────┬─────────────┬─────────────┬─────────────┐\n' +
                          '│ Type        │ Conservation│ Finalité    │ Conformité  │\n' +
                          '├─────────────┼─────────────┼─────────────┼─────────────┤\n' +
                          '│ UserIDs     │ 90 jours    │ Modération  │ RGPD Art.5  │\n' +
                          '│ Messages    │ 30 jours    │ Sécurité    │ ePrivacy    │\n' +
                          '│ Logs        │ 60 jours    │ Audit       │ Loi Info&L  │\n' +
                          '└─────────────┴─────────────┴─────────────┴─────────────┘\n' +
                          '```',
                    inline: false
                },
                {
                    name: '🛡️ **3.2 Sécurité Renforcée**',
                    value: `• **Chiffrement AES-256** des données sensibles\n• **Double authentification** pour les accès admin\n• **Audit trimestriel** par un tiers indépendant\n• **Sauvegarde cryptée** quotidienne\n• **Monitoring 24/7** des accès`,
                    inline: true
                },
                {
                    name: '👤 **Droits des Utilisateurs**',
                    value: `• **Article 15** : Droit d'accès (\`/my-data\`)\n• **Article 20** : Portabilité (\`/export-my-data\`)\n• **Article 17** : Effacement\n• **Article 21** : Opposition\n• **Article 22** : Décision automatisée`,
                    inline: true
                },
                {
                    name: '🔐 **Mesures Techniques**',
                    value: `**Chiffrement :**\n• Données en transit : TLS 1.3\n• Données au repos : AES-256\n• Clés de chiffrement : Rotation mensuelle\n\n**Accès :**\n• Authentification multi-facteurs\n• Logs d'audit complets\n• Principe du moindre privilège`,
                    inline: true
                },
                {
                    name: '📞 **Contact DPO**',
                    value: `**Délégué à la Protection des Données :**\ndpo@team7.gg\n\n**Autorité de contrôle :**\nCNIL - www.cnil.fr\n\n**Réclamations :**\n\`/appeal\` ou privacy@team7.gg`,
                    inline: true
                }
            )
            .setColor('#28a745')
            .setThumbnail('https://i.imgur.com/s74nSIc.png')
            .setTimestamp()
            .setFooter({ 
                text: 'Section 3 - Protection des Données • Conformité RGPD Totale',
                iconURL: 'https://i.imgur.com/s74nSIc.png'
            });

        const backButton = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('charte_staff_rights')
                    .setLabel('← Précédent: Droits Staff')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('charte_overview')
                    .setLabel('📋 Aperçu')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('charte_conflicts')
                    .setLabel('Suivant: Gestion Conflits →')
                    .setStyle(ButtonStyle.Secondary)
            );

        await interaction.update({
            embeds: [embed],
            components: [backButton]
        });
    },

    async showConflicts(interaction) {
        const embed = new EmbedBuilder()
            .setTitle('⚖️ **4. GESTION DES CONFLITS**')
            .setDescription('**Procédures de médiation et protection contre les abus**')
            .addFields(
                {
                    name: '🤝 **4.1 Procédure de Médiation**',
                    value: `**Phase amiable :** Discussion en ticket privé\n**Arbitrage :** Intervention d'un expert neutre\n\n**Sanctions :**\n• Suspension temporaire des fonctionnalités\n• Bannissement définitif si nécessaire\n• Signalement aux autorités compétentes`,
                    inline: false
                },
                {
                    name: '🛡️ **4.2 Protection contre les Abus**',
                    value: `**Toute tentative de :**\n\n• **Piratage** → Signalement à https://discord.com/security\n• **Harcèlement** → Plainte via https://www.internet-signalement.gouv.fr\n• **Usurpation** → Contact immédiat des autorités\n• **Chantage** → Procédures judiciaires engagées`,
                    inline: false
                },
                {
                    name: '📋 **Procédure Étape par Étape**',
                    value: `**1.** Signalement via \`/support\`\n**2.** Enquête interne (48h max)\n**3.** Médiation proposée\n**4.** Décision motivée\n**5.** Recours possible (15 jours)\n**6.** Décision définitive`,
                    inline: true
                },
                {
                    name: '⚖️ **Juridictions Compétentes**',
                    value: `**France :** Tribunal de Paris\n**UE :** Conformité RGPD\n**International :** Arbitrage CCI\n**Discord :** Trust & Safety Team\n**Urgence :** Numéro d'urgence national`,
                    inline: true
                },
                {
                    name: '📞 **Contacts d\'Urgence**',
                    value: `**Signalement Discord :**\nhttps://discord.com/security\n\n**Cybercriminalité France :**\nhttps://www.internet-signalement.gouv.fr\n\n**Support Team7 :**\nsupport@team7.gg\n+33 (0)1 23 45 67 89`,
                    inline: false
                }
            )
            .setColor('#ffc107')
            .setThumbnail('https://i.imgur.com/s74nSIc.png')
            .setTimestamp()
            .setFooter({ 
                text: 'Section 4 - Gestion des Conflits • Justice et Équité',
                iconURL: 'https://i.imgur.com/s74nSIc.png'
            });

        const backButton = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('charte_data_protection')
                    .setLabel('← Précédent: Protection Données')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('charte_overview')
                    .setLabel('📋 Aperçu')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('charte_clauses')
                    .setLabel('Suivant: Clauses Spécifiques →')
                    .setStyle(ButtonStyle.Secondary)
            );

        await interaction.update({
            embeds: [embed],
            components: [backButton]
        });
    },

    async showClauses(interaction) {
        const embed = new EmbedBuilder()
            .setTitle('📄 **5. CLAUSES SPÉCIFIQUES**')
            .setDescription('**Conditions particulières et dispositions techniques**')
            .addFields(
                {
                    name: '🔄 **5.1 Modification/Suppression**',
                    value: `**Je peux à tout moment :**\n\n• **Mettre à jour** le bot\n• **Modifier** ses fonctionnalités\n• **Interrompre** le service (avec préavis de 15 jours)\n• **Suspendre** l'accès en cas d'abus\n• **Transférer** la propriété sous conditions`,
                    inline: false
                },
                {
                    name: '📋 **5.2 Transfert de Propriété**',
                    value: `**Conditions strictes :**\n\n• **Accord écrit** obligatoire\n• **Période de transition** de 30 jours\n• **Formation** du nouveau propriétaire\n• **Audit de sécurité** complet\n• **Validation juridique** par avocat spécialisé`,
                    inline: false
                },
                {
                    name: '⚖️ **Dispositions Légales**',
                    value: `• **Droit applicable :** Français\n• **Juridiction :** Tribunaux de Paris\n• **Langue :** Français (version officielle)\n• **Modifications :** Notification 30 jours\n• **Nullité partielle :** Sans effet sur l'ensemble`,
                    inline: true
                },
                {
                    name: '🔒 **Confidentialité**',
                    value: `• **Code source :** Secret industriel\n• **Architecture :** Propriété exclusive\n• **Données techniques :** Confidentielles\n• **Algorithmes :** Propriété intellectuelle\n• **Violation :** Sanctions pénales`,
                    inline: true
                },
                {
                    name: '📅 **Durée et Résiliation**',
                    value: `**Durée :** Indéterminée\n**Résiliation :**\n• Par le développeur : 15 jours de préavis\n• Pour violation : Immédiate\n• Force majeure : Sans préavis\n• Transfert : Selon accord écrit`,
                    inline: false
                },
                {
                    name: '✍️ **Signatures et Validation**',
                    value: `**Signé par :**\n**Theo / AidoTokihisa**\nDéveloppeur et Propriétaire\n**Le :** 05/08/2025\n\n**Pour acceptation :**\n**Membre du Conseil d'Administration Team7**\n**Le :** 05/08/2025`,
                    inline: false
                }
            )
            .setColor('#6f42c1')
            .setThumbnail('https://i.imgur.com/s74nSIc.png')
            .setTimestamp()
            .setFooter({ 
                text: 'Section 5 - Clauses Spécifiques • Dispositions Finales',
                iconURL: 'https://i.imgur.com/s74nSIc.png'
            });

        const backButton = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('charte_conflicts')
                    .setLabel('← Précédent: Gestion Conflits')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('charte_overview')
                    .setLabel('📋 Retour à l\'Aperçu')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('charte_accept')
                    .setLabel('✅ Accepter la Charte')
                    .setStyle(ButtonStyle.Success)
            );

        await interaction.update({
            embeds: [embed],
            components: [backButton]
        });
    }
};
