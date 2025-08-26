import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';

import AccessRestriction from '../../utils/AccessRestriction.js';
export default {
    data: new SlashCommandBuilder()
        .setName('suggest')
        .setDescription('💡 Proposer des améliorations pour Team7 Bot')
        .addStringOption(option =>
            option.setName('type')
                .setDescription('Type de suggestion')
                .addChoices(
                    { name: '✨ Nouvelle fonctionnalité', value: 'feature' },
                    { name: '🔧 Amélioration existante', value: 'improvement' },
                    { name: '🎨 Interface utilisateur', value: 'ui' },
                    { name: '⚡ Performance', value: 'performance' },
                    { name: '🔗 Intégration', value: 'integration' },
                    { name: '📚 Documentation', value: 'documentation' }
                )
                .setRequired(false)
        )
        .addStringOption(option =>
            option.setName('titre')
                .setDescription('Titre court de votre suggestion')
                .setMaxLength(100)
                .setRequired(false)
        )
        .addStringOption(option =>
            option.setName('description')
                .setDescription('Description détaillée de votre suggestion')
                .setMaxLength(1000)
                .setRequired(false)
        ),

    async execute(interaction) {
        // === VÉRIFICATION D'ACCÈS GLOBALE ===
        const accessRestriction = new AccessRestriction();
        const hasAccess = await accessRestriction.checkAccess(interaction);
        if (!hasAccess) {
            return; // Accès refusé, message déjà envoyé
        }


        const type = interaction.options.getString('type');
        const titre = interaction.options.getString('titre');
        const description = interaction.options.getString('description');
        
        if (type && titre && description) {
            // Suggestion directe
            await this.handleDirectSuggestion(interaction, type, titre, description);
        } else if (type) {
            // Afficher le formulaire pour le type spécifique
            await this.showTypeSpecificForm(interaction, type);
        } else {
            // Menu principal des suggestions
            await this.showSuggestionMenu(interaction);
        }
    },

    async showSuggestionMenu(interaction) {
        const embed = new EmbedBuilder()
            .setTitle('💡 **CENTRE DE SUGGESTIONS TEAM7**')
            .setDescription('**Votre feedback façonne l\'avenir de Team7 Bot**\n\n*Aidez-nous à améliorer votre expérience en proposant vos idées !*')
            .addFields(
                {
                    name: '✨ **Nouvelles fonctionnalités**',
                    value: '• Commandes inédites\n• Outils innovants\n• Mécaniques de jeu\n• Intégrations services tiers\n• Automatisations avancées',
                    inline: true
                },
                {
                    name: '🔧 **Améliorations existantes**',
                    value: '• Optimisation commandes\n• Nouvelles options\n• Personnalisation poussée\n• Ergonomie améliorée\n• Fonctionnalités étendues',
                    inline: true
                },
                {
                    name: '🎨 **Interface utilisateur**',
                    value: '• Design des embeds\n• Navigation intuitive\n• Boutons interactifs\n• Menus déroulants\n• Expérience visuelle',
                    inline: true
                },
                {
                    name: '⚡ **Performance & Technique**',
                    value: '• Vitesse d\'exécution\n• Optimisation mémoire\n• Réduction latence\n• Stabilité système\n• Efficacité énergétique',
                    inline: true
                },
                {
                    name: '🔗 **Intégrations**',
                    value: '• API externes\n• Services populaires\n• Webhooks avancés\n• Synchronisation données\n• Écosystème étendu',
                    inline: true
                },
                {
                    name: '📚 **Documentation**',
                    value: '• Guides utilisateur\n• Tutoriels vidéo\n• FAQ détaillée\n• Exemples pratiques\n• Aide contextuelle',
                    inline: true
                },
                {
                    name: '🏆 **Programme Contributeur**',
                    value: `**Avantages exclusifs :**\n• Badge "Contributeur Team7"\n• Accès prioritaire aux bêta\n• Mention dans les changelogs\n• Consultation avant releases\n• Récompenses spéciales`,
                    inline: false
                },
                {
                    name: '📊 **Processus d\'évaluation**',
                    value: `**1.** Réception et accusé (immédiat)\n**2.** Évaluation technique (48h)\n**3.** Vote communauté (7 jours)\n**4.** Priorisation roadmap (mensuel)\n**5.** Développement et release`,
                    inline: false
                }
            )
            .setColor('#9b59b6')
            .setThumbnail('https://i.imgur.com/s74nSIc.png')
            .setImage('https://i.imgur.com/s74nSIc.png')
            .setTimestamp()
            .setFooter({ 
                text: 'Team7 Bot - Centre de suggestions • Innovation collaborative',
                iconURL: 'https://i.imgur.com/s74nSIc.png'
            });

        const actionRow1 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('suggest_feature')
                    .setLabel('✨ Nouvelle fonctionnalité')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('suggest_improvement')
                    .setLabel('🔧 Amélioration')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('suggest_ui')
                    .setLabel('🎨 Interface')
                    .setStyle(ButtonStyle.Secondary)
            );

        const actionRow2 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('suggest_performance')
                    .setLabel('⚡ Performance')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('suggest_integration')
                    .setLabel('🔗 Intégration')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('suggest_documentation')
                    .setLabel('📚 Documentation')
                    .setStyle(ButtonStyle.Secondary)
            );

        const actionRow3 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('suggest_roadmap')
                    .setLabel('🗺️ Voir la roadmap')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('suggest_popular')
                    .setLabel('🔥 Suggestions populaires')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('suggest_my_suggestions')
                    .setLabel('📋 Mes suggestions')
                    .setStyle(ButtonStyle.Primary)
            );

        await interaction.reply({
            embeds: [embed],
            components: [actionRow1, actionRow2, actionRow3],
            ephemeral: false
        });
    },

    async showTypeSpecificForm(interaction, type) {
        let embed;
        let components = [];

        switch (type) {
            case 'feature':
                embed = this.createFeatureEmbed();
                components = [this.createFeatureButtons()];
                break;
            case 'improvement':
                embed = this.createImprovementEmbed();
                components = [this.createImprovementButtons()];
                break;
            case 'ui':
                embed = this.createUIEmbed();
                components = [this.createUIButtons()];
                break;
            case 'performance':
                embed = this.createPerformanceEmbed();
                components = [this.createPerformanceButtons()];
                break;
            case 'integration':
                embed = this.createIntegrationEmbed();
                components = [this.createIntegrationButtons()];
                break;
            case 'documentation':
                embed = this.createDocumentationEmbed();
                components = [this.createDocumentationButtons()];
                break;
        }

        await interaction.reply({
            embeds: [embed],
            components: components,
            ephemeral: true
        });
    },

    async handleDirectSuggestion(interaction, type, titre, description) {
        // Simuler l'enregistrement de la suggestion
        const suggestionId = Date.now().toString(36) + Math.random().toString(36).substr(2);
        
        const embed = new EmbedBuilder()
            .setTitle('✅ **SUGGESTION ENREGISTRÉE**')
            .setDescription('**Merci pour votre contribution !**')
            .addFields(
                {
                    name: '📋 **Détails de votre suggestion**',
                    value: `**Type :** ${this.getTypeLabel(type)}\n**Titre :** ${titre}\n**ID :** \`${suggestionId}\``,
                    inline: false
                },
                {
                    name: '📝 **Description**',
                    value: description,
                    inline: false
                },
                {
                    name: '🔄 **Prochaines étapes**',
                    value: `• **Évaluation technique** : 48h\n• **Review communauté** : 7 jours\n• **Décision finale** : 14 jours\n• **Notification** : Automatique`,
                    inline: true
                },
                {
                    name: '📊 **Suivi**',
                    value: `Utilisez \`/suggest-status ${suggestionId}\` pour suivre l'avancement de votre suggestion.`,
                    inline: true
                }
            )
            .setColor('#27ae60')
            .setThumbnail('https://i.imgur.com/s74nSIc.png')
            .setTimestamp()
            .setFooter({ 
                text: `Suggestion ${suggestionId} • Team7 Bot`,
                iconURL: 'https://i.imgur.com/s74nSIc.png'
            });

        const actionRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`suggest_vote_${suggestionId}`)
                    .setLabel('👍 Voter pour cette suggestion')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId(`suggest_share_${suggestionId}`)
                    .setLabel('📤 Partager')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('suggest_new')
                    .setLabel('💡 Nouvelle suggestion')
                    .setStyle(ButtonStyle.Primary)
            );

        await interaction.reply({
            embeds: [embed],
            components: [actionRow],
            ephemeral: false
        });
    },

    createFeatureEmbed() {
        return new EmbedBuilder()
            .setTitle('✨ **NOUVELLE FONCTIONNALITÉ**')
            .setDescription('**Proposez une fonctionnalité inédite**')
            .addFields(
                {
                    name: '💭 **Idées populaires**',
                    value: `• **Mini-jeux** : Quiz, devinettes, concours\n• **Économie virtuelle** : Monnaie, boutique, échanges\n• **IA conversationnelle** : Chatbot intelligent\n• **Musique** : Player, playlists, radios\n• **Réseaux sociaux** : Twitter, Instagram, TikTok`,
                    inline: false
                },
                {
                    name: '📋 **Informations à fournir**',
                    value: `• **Nom de la fonctionnalité**\n• **Description détaillée**\n• **Cas d'usage concrets**\n• **Bénéfices attendus**\n• **Exemples de commandes**\n• **Intégrations nécessaires**`,
                    inline: true
                },
                {
                    name: '🎯 **Critères d\'évaluation**',
                    value: `• **Originalité** : Innovation\n• **Utilité** : Valeur ajoutée\n• **Faisabilité** : Complexité technique\n• **Demande** : Intérêt communauté\n• **Cohérence** : Avec l'écosystème`,
                    inline: true
                }
            )
            .setColor('#f1c40f')
            .setThumbnail('https://i.imgur.com/s74nSIc.png');
    },

    createImprovementEmbed() {
        return new EmbedBuilder()
            .setTitle('🔧 **AMÉLIORATION EXISTANTE**')
            .setDescription('**Optimisez les fonctionnalités actuelles**')
            .addFields(
                {
                    name: '🎯 **Domaines d\'amélioration**',
                    value: `• **Commandes** : Nouvelles options, paramètres\n• **Interfaces** : Meilleure ergonomie\n• **Performances** : Vitesse, stabilité\n• **Personnalisation** : Options avancées\n• **Accessibilité** : Facilité d'usage`,
                    inline: false
                },
                {
                    name: '📝 **Format de suggestion**',
                    value: `• **Fonctionnalité concernée**\n• **Problème identifié**\n• **Solution proposée**\n• **Avantages attendus**\n• **Impact utilisateur**`,
                    inline: true
                },
                {
                    name: '✅ **Exemples réussis**',
                    value: `• Pagination dans l'historique\n• Export multiple formats\n• Boutons interactifs\n• Configuration modulaire\n• Notifications intelligentes`,
                    inline: true
                }
            )
            .setColor('#3498db')
            .setThumbnail('https://i.imgur.com/s74nSIc.png');
    },

    createUIEmbed() {
        return new EmbedBuilder()
            .setTitle('🎨 **INTERFACE UTILISATEUR**')
            .setDescription('**Améliorez l\'expérience visuelle**')
            .addFields(
                {
                    name: '🖼️ **Éléments UI**',
                    value: `• **Embeds** : Design, couleurs, layout\n• **Boutons** : Style, organisation, labels\n• **Menus** : Navigation, options\n• **Modals** : Formulaires, saisie\n• **Réactions** : Émojis, interactions`,
                    inline: false
                },
                {
                    name: '🎨 **Principes de design**',
                    value: `• **Simplicité** : Interface épurée\n• **Consistance** : Cohérence visuelle\n• **Lisibilité** : Texte clair\n• **Accessibilité** : Pour tous\n• **Responsivité** : Multi-plateforme`,
                    inline: true
                },
                {
                    name: '💡 **Suggestions appréciées**',
                    value: `• Thèmes personnalisables\n• Mode sombre/clair\n• Icônes expressives\n• Animations subtiles\n• Feedback visuel`,
                    inline: true
                }
            )
            .setColor('#e91e63')
            .setThumbnail('https://i.imgur.com/s74nSIc.png');
    },

    createPerformanceEmbed() {
        return new EmbedBuilder()
            .setTitle('⚡ **PERFORMANCE & TECHNIQUE**')
            .setDescription('**Optimisez les performances du bot**')
            .addFields(
                {
                    name: '🚀 **Axes d\'optimisation**',
                    value: `• **Vitesse** : Temps de réponse réduit\n• **Mémoire** : Usage RAM optimisé\n• **CPU** : Traitement efficace\n• **Réseau** : Bande passante\n• **Base de données** : Requêtes optimisées`,
                    inline: false
                },
                {
                    name: '📊 **Métriques actuelles**',
                    value: `• **Latence** : ~50ms moyenne\n• **Uptime** : 99.9%\n• **CPU** : 15% utilisation\n• **RAM** : 512MB utilisés\n• **Requêtes/min** : 1,500`,
                    inline: true
                },
                {
                    name: '🎯 **Objectifs performance**',
                    value: `• Latence < 30ms\n• Uptime 99.99%\n• Support 10k users\n• Cache intelligent\n• Scaling automatique`,
                    inline: true
                }
            )
            .setColor('#e67e22')
            .setThumbnail('https://i.imgur.com/s74nSIc.png');
    },

    createIntegrationEmbed() {
        return new EmbedBuilder()
            .setTitle('🔗 **INTÉGRATIONS**')
            .setDescription('**Connectez Team7 Bot à l\'écosystème**')
            .addFields(
                {
                    name: '🌐 **Services populaires**',
                    value: `• **Social** : Twitter, Instagram, TikTok\n• **Streaming** : Twitch, YouTube, Spotify\n• **Productivité** : Google, Notion, Trello\n• **Gaming** : Steam, Epic, Battle.net\n• **E-commerce** : Amazon, PayPal`,
                    inline: false
                },
                {
                    name: '🔧 **Types d\'intégration**',
                    value: `• **API REST** : Données temps réel\n• **Webhooks** : Notifications\n• **OAuth** : Authentification\n• **WebSocket** : Communication\n• **RSS/Atom** : Flux d'actualités`,
                    inline: true
                },
                {
                    name: '💡 **Exemples d\'usage**',
                    value: `• Notifications tweets\n• Stats de jeu\n• Agenda partagé\n• Boutique intégrée\n• Synchronisation playlists`,
                    inline: true
                }
            )
            .setColor('#16a085')
            .setThumbnail('https://i.imgur.com/s74nSIc.png');
    },

    createDocumentationEmbed() {
        return new EmbedBuilder()
            .setTitle('📚 **DOCUMENTATION**')
            .setDescription('**Améliorez la documentation et l\'aide**')
            .addFields(
                {
                    name: '📖 **Types de documentation**',
                    value: `• **Guides débutant** : Premiers pas\n• **Tutoriels avancés** : Fonctionnalités\n• **API docs** : Développeurs\n• **FAQ** : Questions fréquentes\n• **Troubleshooting** : Résolution problèmes`,
                    inline: false
                },
                {
                    name: '🎥 **Formats multimédia**',
                    value: `• **Guides texte** : Étape par étape\n• **Vidéos** : Démonstrations\n• **GIFs** : Actions rapides\n• **Infographies** : Schémas\n• **Aide interactive** : In-app`,
                    inline: true
                },
                {
                    name: '🌟 **Qualité souhaitée**',
                    value: `• Clarté et simplicité\n• Exemples concrets\n• Mise à jour régulière\n• Recherche intégrée\n• Feedback utilisateur`,
                    inline: true
                }
            )
            .setColor('#8e44ad')
            .setThumbnail('https://i.imgur.com/s74nSIc.png');
    },

    createFeatureButtons() {
        return new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('suggest_feature_form')
                    .setLabel('✨ Proposer une fonctionnalité')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('suggest_feature_ideas')
                    .setLabel('💭 Voir les idées')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('suggest_feature_vote')
                    .setLabel('🗳️ Voter sur les propositions')
                    .setStyle(ButtonStyle.Primary)
            );
    },

    createImprovementButtons() {
        return new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('suggest_improvement_form')
                    .setLabel('🔧 Proposer amélioration')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('suggest_improvement_list')
                    .setLabel('📋 Améliorations en cours')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('suggest_improvement_priority')
                    .setLabel('⭐ Priorités communauté')
                    .setStyle(ButtonStyle.Success)
            );
    },

    createUIButtons() {
        return new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('suggest_ui_form')
                    .setLabel('🎨 Proposer design')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('suggest_ui_mockup')
                    .setLabel('🖼️ Partager mockup')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('suggest_ui_themes')
                    .setLabel('🌈 Thèmes communauté')
                    .setStyle(ButtonStyle.Primary)
            );
    },

    createPerformanceButtons() {
        return new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('suggest_performance_form')
                    .setLabel('⚡ Proposer optimisation')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('suggest_performance_metrics')
                    .setLabel('📊 Voir métriques')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('suggest_performance_report')
                    .setLabel('🐛 Signaler lenteur')
                    .setStyle(ButtonStyle.Danger)
            );
    },

    createIntegrationButtons() {
        return new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('suggest_integration_form')
                    .setLabel('🔗 Proposer intégration')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('suggest_integration_popular')
                    .setLabel('🔥 Intégrations demandées')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('suggest_integration_api')
                    .setLabel('🛠️ API disponibles')
                    .setStyle(ButtonStyle.Secondary)
            );
    },

    createDocumentationButtons() {
        return new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('suggest_doc_form')
                    .setLabel('📚 Proposer documentation')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('suggest_doc_missing')
                    .setLabel('❓ Signaler manque')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId('suggest_doc_contribute')
                    .setLabel('✍️ Contribuer')
                    .setStyle(ButtonStyle.Success)
            );
    },

    getTypeLabel(type) {
        const labels = {
            'feature': '✨ Nouvelle fonctionnalité',
            'improvement': '🔧 Amélioration existante',
            'ui': '🎨 Interface utilisateur',
            'performance': '⚡ Performance',
            'integration': '🔗 Intégration',
            'documentation': '📚 Documentation'
        };
        return labels[type] || type;
    }
};
