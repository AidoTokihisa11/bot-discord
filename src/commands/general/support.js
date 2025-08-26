import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';

import AccessRestriction from '../../utils/AccessRestriction.js';
export default {
    data: new SlashCommandBuilder()
        .setName('support')
        .setDescription('🆘 Obtenir de l\'aide et contacter le support Team7')
        .addStringOption(option =>
            option.setName('type')
                .setDescription('Type de support demandé')
                .addChoices(
                    { name: '🐛 Signaler un bug', value: 'bug' },
                    { name: '❓ Question générale', value: 'question' },
                    { name: '🔧 Aide technique', value: 'technical' },
                    { name: '📋 Demande RGPD', value: 'gdpr' },
                    { name: '💡 Suggestion d\'amélioration', value: 'suggestion' }
                )
                .setRequired(false)
        ),

    async execute(interaction) {
        // === VÉRIFICATION D'ACCÈS GLOBALE ===
        const accessRestriction = new AccessRestriction();
        const hasAccess = await accessRestriction.checkAccess(interaction);
        if (!hasAccess) {
            return; // Accès refusé, message déjà envoyé
        }


        const supportType = interaction.options.getString('type');
        
        if (supportType) {
            // Traitement direct selon le type
            await this.handleDirectSupport(interaction, supportType);
        } else {
            // Menu principal du support
            await this.showSupportMenu(interaction);
        }
    },

    async showSupportMenu(interaction) {
        const embed = new EmbedBuilder()
            .setTitle('🆘 **CENTRE DE SUPPORT TEAM7**')
            .setDescription('**Assistance professionnelle 24/7**\n\n*Sélectionnez le type d\'aide dont vous avez besoin :*')
            .addFields(
                {
                    name: '🐛 **Signalement de bugs**',
                    value: '• Dysfonctionnements techniques\n• Erreurs de commandes\n• Problèmes d\'affichage\n• Comportements inattendus',
                    inline: true
                },
                {
                    name: '❓ **Questions générales**',
                    value: '• Utilisation des commandes\n• Configuration du bot\n• Fonctionnalités disponibles\n• Bonnes pratiques',
                    inline: true
                },
                {
                    name: '🔧 **Support technique**',
                    value: '• Problèmes de permissions\n• Configuration serveur\n• Intégrations avancées\n• Optimisation performance',
                    inline: true
                },
                {
                    name: '📋 **Demandes RGPD**',
                    value: '• Droit d\'accès aux données\n• Portabilité des données\n• Droit à l\'effacement\n• Rectification d\'informations',
                    inline: true
                },
                {
                    name: '💡 **Suggestions**',
                    value: '• Nouvelles fonctionnalités\n• Améliorations UX\n• Optimisations\n• Retours d\'expérience',
                    inline: true
                },
                {
                    name: '📊 **Informations support**',
                    value: `**Temps de réponse :** < 2h en moyenne\n**Disponibilité :** 24/7\n**Langues :** Français, Anglais\n**SLA :** 99.9% de disponibilité`,
                    inline: true
                }
            )
            .setColor('#3498db')
            .setThumbnail('https://i.imgur.com/s74nSIc.png')
            .setImage('https://i.imgur.com/s74nSIc.png')
            .setTimestamp()
            .setFooter({ 
                text: 'Team7 Support • Assistance professionnelle',
                iconURL: 'https://i.imgur.com/s74nSIc.png'
            });

        const actionRow1 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('support_bug')
                    .setLabel('🐛 Signaler un bug')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId('support_question')
                    .setLabel('❓ Question générale')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('support_technical')
                    .setLabel('🔧 Aide technique')
                    .setStyle(ButtonStyle.Secondary)
            );

        const actionRow2 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('support_gdpr')
                    .setLabel('📋 Demande RGPD')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('support_suggestion')
                    .setLabel('💡 Suggestion')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('support_emergency')
                    .setLabel('🚨 Urgence')
                    .setStyle(ButtonStyle.Danger)
            );

        await interaction.reply({
            embeds: [embed],
            components: [actionRow1, actionRow2],
            ephemeral: false
        });
    },

    async handleDirectSupport(interaction, type) {
        let embed;
        let components = [];

        switch (type) {
            case 'bug':
                embed = this.createBugReportEmbed();
                components = [this.createBugReportButtons()];
                break;
            case 'question':
                embed = this.createQuestionEmbed();
                components = [this.createQuestionButtons()];
                break;
            case 'technical':
                embed = this.createTechnicalEmbed();
                components = [this.createTechnicalButtons()];
                break;
            case 'gdpr':
                embed = this.createGDPRSupportEmbed();
                components = [this.createGDPRButtons()];
                break;
            case 'suggestion':
                embed = this.createSuggestionEmbed();
                components = [this.createSuggestionButtons()];
                break;
        }

        await interaction.reply({
            embeds: [embed],
            components: components,
            ephemeral: true
        });
    },

    createBugReportEmbed() {
        return new EmbedBuilder()
            .setTitle('🐛 **SIGNALEMENT DE BUG**')
            .setDescription('**Aidez-nous à améliorer Team7 Bot**')
            .addFields(
                {
                    name: '📋 **Informations à fournir**',
                    value: `• **Description détaillée** : Que s'est-il passé ?\n• **Étapes de reproduction** : Comment reproduire le bug ?\n• **Résultat attendu** : Que devrait-il se passer ?\n• **Captures d'écran** : Si applicable\n• **Environnement** : Serveur, salon, permissions`,
                    inline: false
                },
                {
                    name: '⏱️ **Délais de traitement**',
                    value: `• **Critique** : < 1h\n• **Majeur** : < 4h\n• **Mineur** : < 24h\n• **Cosmétique** : < 72h`,
                    inline: true
                },
                {
                    name: '🔄 **Suivi**',
                    value: `• **Accusé de réception** : Immédiat\n• **Investigation** : Sous 2h\n• **Correction** : Selon priorité\n• **Notification** : Automatique`,
                    inline: true
                }
            )
            .setColor('#e74c3c')
            .setThumbnail('https://i.imgur.com/s74nSIc.png');
    },

    createQuestionEmbed() {
        return new EmbedBuilder()
            .setTitle('❓ **QUESTIONS GÉNÉRALES**')
            .setDescription('**FAQ et assistance utilisateur**')
            .addFields(
                {
                    name: '📚 **Ressources disponibles**',
                    value: `• **\`/help\`** : Documentation complète\n• **\`/charte\`** : Conditions d'utilisation\n• **\`/info\`** : Informations utilisateur\n• **Tutoriels** : Guides pas à pas`,
                    inline: true
                },
                {
                    name: '🔧 **Commandes utiles**',
                    value: `• **\`/diagnostic\`** : Vérification système\n• **\`/verify-bot\`** : Test fonctionnement\n• **\`/config\`** : Configuration serveur\n• **\`/stats\`** : Statistiques détaillées`,
                    inline: true
                },
                {
                    name: '💬 **Types de questions**',
                    value: `• Configuration initiale\n• Utilisation des commandes\n• Résolution de problèmes\n• Optimisation serveur\n• Meilleures pratiques`,
                    inline: false
                }
            )
            .setColor('#3498db')
            .setThumbnail('https://i.imgur.com/s74nSIc.png');
    },

    createTechnicalEmbed() {
        return new EmbedBuilder()
            .setTitle('🔧 **SUPPORT TECHNIQUE**')
            .setDescription('**Assistance technique avancée**')
            .addFields(
                {
                    name: '⚙️ **Domaines d\'expertise**',
                    value: `• **Permissions Discord** : Configuration et dépannage\n• **Intégrations API** : Webhook, bots tiers\n• **Performance** : Optimisation et monitoring\n• **Sécurité** : Configuration sécurisée`,
                    inline: false
                },
                {
                    name: '🛠️ **Diagnostics disponibles**',
                    value: `• Analyse des permissions\n• Test de connectivité\n• Vérification configuration\n• Audit de sécurité`,
                    inline: true
                },
                {
                    name: '📊 **Monitoring**',
                    value: `• Performances en temps réel\n• Logs détaillés\n• Métriques d'usage\n• Alertes automatiques`,
                    inline: true
                }
            )
            .setColor('#f39c12')
            .setThumbnail('https://i.imgur.com/s74nSIc.png');
    },

    createGDPRSupportEmbed() {
        return new EmbedBuilder()
            .setTitle('📋 **SUPPORT RGPD**')
            .setDescription('**Protection des données et droits utilisateurs**')
            .addFields(
                {
                    name: '🛡️ **Droits disponibles**',
                    value: `• **\`/my-data\`** : Consulter vos données (Art. 15)\n• **\`/export-my-data\`** : Portabilité (Art. 20)\n• **\`/appeal\`** : Rectification/Effacement\n• **Support dédié** : Délégué à la protection`,
                    inline: false
                },
                {
                    name: '⏱️ **Délais légaux**',
                    value: `• **Réponse** : < 72h\n• **Traitement** : < 1 mois\n• **Urgence** : < 24h\n• **Complexe** : + 2 mois`,
                    inline: true
                },
                {
                    name: '📞 **Contact DPO**',
                    value: `• **Email** : dpo@team7.fr\n• **Formulaire** : \`/appeal\`\n• **Téléphone** : +33 1 XX XX XX XX\n• **Courrier** : Team7 DPO Service`,
                    inline: true
                }
            )
            .setColor('#27ae60')
            .setThumbnail('https://i.imgur.com/s74nSIc.png');
    },

    createSuggestionEmbed() {
        return new EmbedBuilder()
            .setTitle('💡 **SUGGESTIONS D\'AMÉLIORATION**')
            .setDescription('**Votre feedback façonne Team7 Bot**')
            .addFields(
                {
                    name: '🎯 **Types de suggestions**',
                    value: `• **Nouvelles fonctionnalités** : Commandes, outils\n• **Améliorations UX** : Interface, ergonomie\n• **Performance** : Optimisations techniques\n• **Intégrations** : Services tiers, API`,
                    inline: false
                },
                {
                    name: '📈 **Processus d\'évaluation**',
                    value: `• **Réception** : Immédiate\n• **Évaluation** : 7 jours\n• **Priorisation** : Roadmap\n• **Développement** : Selon planning`,
                    inline: true
                },
                {
                    name: '🏆 **Programme contributeur**',
                    value: `• **Badge contributeur** : Suggestions acceptées\n• **Accès beta** : Nouvelles fonctionnalités\n• **Mentions** : Changelog officiel\n• **Récompenses** : Avantages exclusifs`,
                    inline: true
                }
            )
            .setColor('#9b59b6')
            .setThumbnail('https://i.imgur.com/s74nSIc.png');
    },

    createBugReportButtons() {
        return new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('support_bug_form')
                    .setLabel('📝 Formulaire de bug')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId('support_bug_critical')
                    .setLabel('🚨 Bug critique')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId('support_bug_status')
                    .setLabel('📊 Statut des bugs')
                    .setStyle(ButtonStyle.Secondary)
            );
    },

    createQuestionButtons() {
        return new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('support_faq')
                    .setLabel('📚 FAQ complète')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('support_tutorial')
                    .setLabel('🎓 Tutoriels')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('support_ask_question')
                    .setLabel('❓ Poser une question')
                    .setStyle(ButtonStyle.Success)
            );
    },

    createTechnicalButtons() {
        return new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('support_diagnostic')
                    .setLabel('🔍 Diagnostic')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('support_performance')
                    .setLabel('📊 Performance')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('support_technical_form')
                    .setLabel('🔧 Assistance technique')
                    .setStyle(ButtonStyle.Success)
            );
    },

    createGDPRButtons() {
        return new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('support_gdpr_access')
                    .setLabel('👁️ Accès aux données')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('support_gdpr_export')
                    .setLabel('📥 Export des données')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('support_gdpr_delete')
                    .setLabel('🗑️ Suppression')
                    .setStyle(ButtonStyle.Danger)
            );
    },

    createSuggestionButtons() {
        return new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('support_suggest_feature')
                    .setLabel('✨ Nouvelle fonctionnalité')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('support_suggest_improvement')
                    .setLabel('📈 Amélioration')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('support_roadmap')
                    .setLabel('🗺️ Roadmap')
                    .setStyle(ButtonStyle.Secondary)
            );
    }
};
