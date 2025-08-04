import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('charte')
        .setDescription('📜 Consulter la charte officielle du bot Team7')
        .addStringOption(option =>
            option.setName('section')
                .setDescription('Section spécifique à consulter')
                .addChoices(
                    { name: '📋 Vue d\'ensemble', value: 'overview' },
                    { name: '🎯 Fonctionnalités', value: 'features' },
                    { name: '🛡️ RGPD & Confidentialité', value: 'gdpr' },
                    { name: '⚖️ Conditions d\'utilisation', value: 'terms' },
                    { name: '🔒 Sécurité', value: 'security' }
                )
                .setRequired(false)
        ),

    async execute(interaction) {
        const section = interaction.options.getString('section') || 'overview';
        
        let embed;
        let components = [];

        switch (section) {
            case 'features':
                embed = this.createFeaturesEmbed();
                break;
            case 'gdpr':
                embed = this.createGDPREmbed();
                break;
            case 'terms':
                embed = this.createTermsEmbed();
                break;
            case 'security':
                embed = this.createSecurityEmbed();
                break;
            default:
                embed = this.createOverviewEmbed();
        }

        // Boutons de navigation
        const navigationRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('charte_overview')
                    .setLabel('📋 Vue d\'ensemble')
                    .setStyle(section === 'overview' ? ButtonStyle.Primary : ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('charte_features')
                    .setLabel('🎯 Fonctionnalités')
                    .setStyle(section === 'features' ? ButtonStyle.Primary : ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('charte_gdpr')
                    .setLabel('🛡️ RGPD')
                    .setStyle(section === 'gdpr' ? ButtonStyle.Primary : ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('charte_terms')
                    .setLabel('⚖️ Conditions')
                    .setStyle(section === 'terms' ? ButtonStyle.Primary : ButtonStyle.Secondary)
            );

        const actionRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('charte_security')
                    .setLabel('🔒 Sécurité')
                    .setStyle(section === 'security' ? ButtonStyle.Primary : ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('charte_accept')
                    .setLabel('✅ J\'accepte la charte')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('charte_download')
                    .setLabel('📥 Télécharger')
                    .setStyle(ButtonStyle.Secondary)
            );

        components = [navigationRow, actionRow];

        await interaction.reply({
            embeds: [embed],
            components: components,
            ephemeral: false
        });
    },

    createOverviewEmbed() {
        return new EmbedBuilder()
            .setTitle('📜 **CHARTE OFFICIELLE TEAM7 BOT**')
            .setDescription('**Document officiel de référence et d\'utilisation**')
            .addFields(
                {
                    name: '🏢 **À propos de Team7 Bot**',
                    value: '**Team7 Bot** est un assistant Discord avancé conçu pour optimiser la gestion communautaire, assurer la modération automatisée et fournir des outils d\'administration complets tout en respectant les normes RGPD les plus strictes.',
                    inline: false
                },
                {
                    name: '🎯 **Mission et objectifs**',
                    value: `• **Sécurité** : Protection des données personnelles selon RGPD\n• **Efficacité** : Automatisation des tâches administratives\n• **Transparence** : Accès complet aux données utilisateur\n• **Innovation** : Technologies de pointe pour l'expérience utilisateur`,
                    inline: false
                },
                {
                    name: '🛡️ **Engagement RGPD**',
                    value: `• **Article 15** : Droit d'accès aux données (\`/my-data\`)\n• **Article 20** : Portabilité des données (\`/export-my-data\`)\n• **Article 17** : Droit à l'effacement\n• **Article 6** : Traitement licite et transparent`,
                    inline: true
                },
                {
                    name: '⚖️ **Conformité légale**',
                    value: `• **RGPD** : Règlement européen 2016/679\n• **Discord ToS** : Respect intégral des conditions\n• **Loi Informatique et Libertés** : Conformité française\n• **Audit** : Vérifications régulières`,
                    inline: true
                },
                {
                    name: '📊 **Données collectées**',
                    value: `**Essentielles :**\n• ID utilisateur Discord (anonymisé)\n• Historique de modération (sécurité)\n• Préférences de configuration\n\n**Jamais collecté :**\n• Messages privés\n• Données sensibles\n• Informations bancaires`,
                    inline: false
                },
                {
                    name: '📞 **Contact et support**',
                    value: `**Support technique :** Commande \`/support\`\n**Réclamations RGPD :** \`/appeal\`\n**Suggestions :** \`/suggest\`\n**Documentation :** \`/help --full\``,
                    inline: false
                }
            )
            .setColor('#2c3e50')
            .setThumbnail('https://i.imgur.com/s74nSIc.png')
            .setImage('https://i.imgur.com/s74nSIc.png')
            .setTimestamp()
            .setFooter({ 
                text: 'Team7 Bot - Charte officielle v2.1 • Dernière mise à jour',
                iconURL: 'https://i.imgur.com/s74nSIc.png'
            });
    },

    createFeaturesEmbed() {
        return new EmbedBuilder()
            .setTitle('🎯 **FONCTIONNALITÉS TEAM7 BOT**')
            .setDescription('**Catalogue complet des services disponibles**')
            .addFields(
                {
                    name: '🛡️ **Modération avancée**',
                    value: `• **\`/warn\`** : Système d'avertissements graduels\n• **\`/mute\`** : Sanctions temporaires configurable\n• **\`/kick\`** : Expulsions avec historique\n• **\`/ban\`** : Bannissements avec durée\n• **\`/history\`** : Consultation complète des antécédents`,
                    inline: true
                },
                {
                    name: '🏗️ **Administration**',
                    value: `• **\`/config\`** : Configuration avancée du serveur\n• **\`/backup\`** : Sauvegarde automatique des données\n• **\`/cleanup\`** : Nettoyage intelligent des salons\n• **\`/setup-tickets\`** : Système de tickets professionnel\n• **\`/stream-notifications\`** : Notifications de streams`,
                    inline: true
                },
                {
                    name: '📊 **Statistiques et analyses**',
                    value: `• **\`/stats\`** : Analyses complètes du serveur\n• **\`/info\`** : Profils utilisateurs détaillés\n• **\`/ticket-stats\`** : Métriques du support\n• **\`/diagnostic\`** : Vérifications système\n• **\`/verify-bot\`** : Tests de fonctionnement`,
                    inline: true
                },
                {
                    name: '🔒 **Conformité RGPD**',
                    value: `• **\`/my-data\`** : Consultation des données personnelles\n• **\`/export-my-data\`** : Export multi-format (JSON/CSV/TXT)\n• **\`/appeal\`** : Système de réclamations\n• **Chiffrement** : Sécurisation AES-256\n• **Anonymisation** : Protection d'identité`,
                    inline: false
                },
                {
                    name: '🎮 **Divertissement et communauté**',
                    value: `• **\`/embed\`** : Création d'embeds personnalisés\n• **\`/ping\`** : Tests de latence avancés\n• **\`/help\`** : Documentation interactive\n• **Réactions automatiques** : Engagement communautaire\n• **Anti-spam intelligent** : Protection en temps réel`,
                    inline: true
                },
                {
                    name: '🔧 **Outils de développement**',
                    value: `• **\`/test-interactions\`** : Tests des composants\n• **\`/send-women-message\`** : Messages spécialisés\n• **\`/setup-demo-streamers\`** : Configuration de démonstration\n• **API REST** : Intégrations tierces\n• **Webhooks** : Automatisations externes`,
                    inline: true
                }
            )
            .setColor('#3498db')
            .setThumbnail('https://i.imgur.com/s74nSIc.png')
            .setImage('https://i.imgur.com/s74nSIc.png')
            .setTimestamp()
            .setFooter({ 
                text: 'Team7 Bot - Fonctionnalités v2.1 • Plus de 50 commandes disponibles',
                iconURL: 'https://i.imgur.com/s74nSIc.png'
            });
    },

    createGDPREmbed() {
        return new EmbedBuilder()
            .setTitle('🛡️ **RGPD & CONFIDENTIALITÉ**')
            .setDescription('**Engagement total pour la protection de vos données**')
            .addFields(
                {
                    name: '📋 **Droits garantis (RGPD)**',
                    value: `**Article 15 - Droit d'accès :**\n• Commande \`/my-data\` pour consulter vos données\n• Inventaire complet et transparent\n• Métadonnées de traitement incluses\n\n**Article 20 - Portabilité :**\n• Commande \`/export-my-data\` pour l'export\n• Formats : JSON, CSV, TXT\n• Données structurées et réutilisables`,
                    inline: false
                },
                {
                    name: '🔒 **Sécurité technique**',
                    value: `• **Chiffrement AES-256** : Toutes les données sensibles\n• **Hachage SHA-256** : Identifiants utilisateurs\n• **HTTPS/TLS 1.3** : Communications sécurisées\n• **Audit logs** : Traçabilité complète\n• **Backup chiffré** : Sauvegarde quotidienne`,
                    inline: true
                },
                {
                    name: '⏱️ **Rétention des données**',
                    value: `• **Données actives** : Pendant l'utilisation du bot\n• **Logs de modération** : 2 ans maximum\n• **Données exportées** : Suppression après 30 jours\n• **Cache temporaire** : Nettoyage automatique\n• **Suppression sur demande** : Sous 72h`,
                    inline: true
                },
                {
                    name: '👥 **Base légale du traitement**',
                    value: `**Article 6.1.a - Consentement :**\n• Utilisation volontaire du bot\n• Révocation possible à tout moment\n\n**Article 6.1.f - Intérêt légitime :**\n• Modération pour sécurité communautaire\n• Lutte contre le spam et abus`,
                    inline: false
                },
                {
                    name: '📊 **Transparence des traitements**',
                    value: `• **Finalité** : Modération et administration Discord\n• **Licéité** : Consentement et intérêt légitime\n• **Minimisation** : Seules les données nécessaires\n• **Exactitude** : Mise à jour en temps réel\n• **Intégrité** : Vérifications automatiques`,
                    inline: true
                },
                {
                    name: '🚨 **Exercice de vos droits**',
                    value: `• **\`/appeal\`** : Réclamations et demandes RGPD\n• **\`/support\`** : Assistance personnalisée\n• **Délai de réponse** : 72h maximum\n• **DPO Team7** : contact-rgpd@team7.fr\n• **CNIL** : Droit de plainte si insatisfait`,
                    inline: true
                }
            )
            .setColor('#27ae60')
            .setThumbnail('https://i.imgur.com/s74nSIc.png')
            .setImage('https://i.imgur.com/s74nSIc.png')
            .setTimestamp()
            .setFooter({ 
                text: 'Team7 Bot - Conformité RGPD certifiée • Protection maximale',
                iconURL: 'https://i.imgur.com/s74nSIc.png'
            });
    },

    createTermsEmbed() {
        return new EmbedBuilder()
            .setTitle('⚖️ **CONDITIONS D\'UTILISATION**')
            .setDescription('**Termes et conditions d\'utilisation de Team7 Bot**')
            .addFields(
                {
                    name: '🤝 **Acceptation des conditions**',
                    value: `L'utilisation de **Team7 Bot** implique l'acceptation pleine et entière de ces conditions. En interagissant avec le bot via des commandes, vous acceptez ces termes de manière irrévocable.`,
                    inline: false
                },
                {
                    name: '✅ **Utilisation autorisée**',
                    value: `• **Modération** : Utilisation des outils de modération\n• **Administration** : Gestion du serveur Discord\n• **Statistiques** : Consultation des données publiques\n• **RGPD** : Exercice de vos droits\n• **Support** : Assistance technique et utilisateur`,
                    inline: true
                },
                {
                    name: '❌ **Utilisation interdite**',
                    value: `• **Spam** : Utilisation abusive des commandes\n• **Contournement** : Évitement des sanctions\n• **Reverse engineering** : Ingénierie inverse\n• **Exploitation** : Recherche de vulnérabilités\n• **Revente** : Commercialisation non autorisée`,
                    inline: true
                },
                {
                    name: '🛡️ **Responsabilités de Team7**',
                    value: `• **Disponibilité** : Service 24/7 avec maintenance programmée\n• **Sécurité** : Protection des données selon RGPD\n• **Support** : Assistance technique en français\n• **Mises à jour** : Améliorations continues\n• **Conformité** : Respect des réglementations`,
                    inline: false
                },
                {
                    name: '👤 **Responsabilités utilisateur**',
                    value: `• **Respect** : Utilisation conforme aux règles Discord\n• **Vérification** : Exactitude des informations fournies\n• **Signalement** : Rapport des dysfonctionnements\n• **Sécurité** : Protection de vos accès Discord\n• **Conformité** : Respect des lois applicables`,
                    inline: true
                },
                {
                    name: '📋 **Limitation de responsabilité**',
                    value: `Team7 ne peut être tenu responsable des dommages indirects, pertes de données non imputables au bot, ou utilisations non conformes. La responsabilité est limitée au service fourni.`,
                    inline: true
                },
                {
                    name: '🔄 **Modifications des conditions**',
                    value: `Ces conditions peuvent être modifiées avec un préavis de 30 jours. Les utilisateurs seront notifiés via les canaux officiels. La poursuite de l'utilisation vaut acceptation.`,
                    inline: false
                },
                {
                    name: '⚖️ **Droit applicable et juridiction**',
                    value: `Ces conditions sont régies par le droit français. Tout litige sera soumis aux tribunaux compétents de Paris, après tentative de résolution amiable via \`/appeal\`.`,
                    inline: false
                }
            )
            .setColor('#e67e22')
            .setThumbnail('https://i.imgur.com/s74nSIc.png')
            .setImage('https://i.imgur.com/s74nSIc.png')
            .setTimestamp()
            .setFooter({ 
                text: 'Team7 Bot - Conditions d\'utilisation v2.1 • Applicables immédiatement',
                iconURL: 'https://i.imgur.com/s74nSIc.png'
            });
    },

    createSecurityEmbed() {
        return new EmbedBuilder()
            .setTitle('🔒 **SÉCURITÉ ET PROTECTION**')
            .setDescription('**Mesures de sécurité et protection des données**')
            .addFields(
                {
                    name: '🛡️ **Architecture sécurisée**',
                    value: `• **Chiffrement bout-en-bout** : AES-256 pour toutes les données\n• **Authentification** : OAuth2 avec Discord\n• **API sécurisée** : Rate limiting et validation\n• **Infrastructure** : Hébergement sécurisé certifié\n• **Monitoring** : Surveillance 24/7 des accès`,
                    inline: false
                },
                {
                    name: '🔐 **Protection des données**',
                    value: `• **Anonymisation** : Hachage SHA-256 des identifiants\n• **Segmentation** : Isolation des données par serveur\n• **Backup chiffré** : Sauvegardes quotidiennes\n• **Purge automatique** : Nettoyage des données obsolètes\n• **Audit trail** : Historique complet des accès`,
                    inline: true
                },
                {
                    name: '🚨 **Détection d\'intrusion**',
                    value: `• **IDS/IPS** : Détection temps réel\n• **Analyse comportementale** : Patterns suspects\n• **Alertes automatiques** : Notification immédiate\n• **Forensic** : Investigation post-incident\n• **Mitigation** : Réponse automatisée`,
                    inline: true
                },
                {
                    name: '🔍 **Conformité et audits**',
                    value: `• **RGPD** : Audit annuel de conformité\n• **ISO 27001** : Standards de sécurité\n• **Penetration testing** : Tests d'intrusion réguliers\n• **Code review** : Révision sécuritaire du code\n• **Vulnerability scanning** : Scan automatisé`,
                    inline: false
                },
                {
                    name: '📊 **Gestion des incidents**',
                    value: `• **Plan de réponse** : Procédure documentée\n• **Notification** : Alert sous 72h si requis\n• **Investigation** : Analyse forensique complète\n• **Remediation** : Correction et prévention\n• **Communication** : Transparence utilisateurs`,
                    inline: true
                },
                {
                    name: '🛠️ **Outils de sécurité utilisateur**',
                    value: `• **\`/my-data\`** : Vérification de vos données\n• **\`/export-my-data\`** : Sauvegarde personnelle\n• **\`/appeal\`** : Signalement d'incident\n• **Logs d'activité** : Traçabilité de vos actions\n• **Suppression** : Effacement sur demande`,
                    inline: true
                }
            )
            .setColor('#8e44ad')
            .setThumbnail('https://i.imgur.com/s74nSIc.png')
            .setImage('https://i.imgur.com/s74nSIc.png')
            .setTimestamp()
            .setFooter({ 
                text: 'Team7 Bot - Sécurité renforcée • Protection maximale des données',
                iconURL: 'https://i.imgur.com/s74nSIc.png'
            });
    }
};
