import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, SelectMenuBuilder, PermissionFlagsBits } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('automod')
        .setDescription('🛡️ Système de modération automatique avancé')
        .addSubcommand(subcommand =>
            subcommand
                .setName('status')
                .setDescription('Afficher le statut de l\'automodération')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('setup')
                .setDescription('Configuration rapide de l\'automodération')
                .addStringOption(option =>
                    option.setName('niveau')
                        .setDescription('Niveau de sécurité')
                        .addChoices(
                            { name: '🟢 Basique - Protection minimale', value: 'basic' },
                            { name: '🟡 Modéré - Protection équilibrée', value: 'moderate' },
                            { name: '🟠 Élevé - Protection renforcée', value: 'high' },
                            { name: '🔴 Maximum - Protection totale', value: 'maximum' },
                            { name: '⚙️ Personnalisé - Configuration manuelle', value: 'custom' }
                        )
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('filters')
                .setDescription('Gérer les filtres de contenu')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('whitelist')
                .setDescription('Gérer les exceptions et listes blanches')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('actions')
                .setDescription('Configurer les actions automatiques')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('logs')
                .setDescription('Voir les logs de modération automatique')
                .addIntegerOption(option =>
                    option.setName('limite')
                        .setDescription('Nombre d\'événements à afficher')
                        .setMinValue(1)
                        .setMaxValue(50)
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('stats')
                .setDescription('Statistiques de la modération automatique')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('test')
                .setDescription('Tester les filtres de modération')
                .addStringOption(option =>
                    option.setName('message')
                        .setDescription('Message à tester')
                        .setRequired(true)
                )
        ),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        // Vérifier les permissions
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
            const errorEmbed = new EmbedBuilder()
                .setTitle('❌ **Permissions insuffisantes**')
                .setDescription('Vous devez avoir la permission "Gérer le serveur" pour utiliser cette commande.')
                .setColor('#e74c3c');
            return await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }

        switch (subcommand) {
            case 'status':
                await this.showStatus(interaction);
                break;
            case 'setup':
                await this.setupAutomod(interaction);
                break;
            case 'filters':
                await this.manageFilters(interaction);
                break;
            case 'whitelist':
                await this.manageWhitelist(interaction);
                break;
            case 'actions':
                await this.manageActions(interaction);
                break;
            case 'logs':
                await this.showLogs(interaction);
                break;
            case 'stats':
                await this.showStats(interaction);
                break;
            case 'test':
                await this.testFilters(interaction);
                break;
        }
    },

    async showStatus(interaction) {
        await interaction.deferReply();

        // Récupérer le statut actuel (simulation)
        const status = await this.getAutomodStatus(interaction.guild.id);

        const embed = new EmbedBuilder()
            .setTitle('🛡️ **STATUT AUTOMODÉRATION**')
            .setDescription(`**Système de modération automatique de ${interaction.guild.name}**`)
            .addFields(
                {
                    name: '⚡ **État général**',
                    value: `**Statut :** ${status.enabled ? '✅ Activé' : '❌ Désactivé'}\n**Niveau :** ${status.level}\n**Dernière mise à jour :** <t:${Math.floor(status.lastUpdate / 1000)}:R>\n**Performance :** ${status.performance}%`,
                    inline: true
                },
                {
                    name: '🔍 **Filtres actifs**',
                    value: `${status.filters.spam ? '✅' : '❌'} **Anti-spam**\n${status.filters.profanity ? '✅' : '❌'} **Langage inapproprié**\n${status.filters.links ? '✅' : '❌'} **Liens suspects**\n${status.filters.mentions ? '✅' : '❌'} **Mentions excessives**\n${status.filters.caps ? '✅' : '❌'} **MAJUSCULES**\n${status.filters.zalgo ? '✅' : '❌'} **Texte déformé**`,
                    inline: true
                },
                {
                    name: '⚙️ **Actions configurées**',
                    value: `**Suppression :** ${status.actions.delete ? '✅' : '❌'}\n**Avertissement :** ${status.actions.warn ? '✅' : '❌'}\n**Timeout :** ${status.actions.timeout ? '✅' : '❌'}\n**Kick :** ${status.actions.kick ? '✅' : '❌'}\n**Ban :** ${status.actions.ban ? '✅' : '❌'}\n**Log :** ${status.actions.log ? '✅' : '❌'}`,
                    inline: true
                },
                {
                    name: '📊 **Statistiques dernières 24h**',
                    value: `**Messages analysés :** ${status.stats.analyzed.toLocaleString()}\n**Infractions détectées :** ${status.stats.violations}\n**Actions exécutées :** ${status.stats.actions}\n**Faux positifs :** ${status.stats.falsePositives}`,
                    inline: true
                },
                {
                    name: '🚨 **Alertes récentes**',
                    value: `**Attaques détectées :** ${status.alerts.attacks}\n**Raids bloqués :** ${status.alerts.raids}\n**Comptes suspects :** ${status.alerts.suspiciousAccounts}\n**Dernière alerte :** ${status.alerts.lastAlert || 'Aucune'}`,
                    inline: true
                },
                {
                    name: '🎯 **Efficacité**',
                    value: `**Précision :** ${status.efficiency.accuracy}%\n**Vitesse :** ${status.efficiency.speed}ms avg\n**Disponibilité :** ${status.efficiency.uptime}%\n**Score global :** ${status.efficiency.overall}/100`,
                    inline: true
                }
            )
            .setColor(status.enabled ? '#27ae60' : '#e74c3c')
            .setThumbnail(interaction.guild.iconURL({ size: 256 }))
            .setImage('https://i.imgur.com/s74nSIc.png')
            .setTimestamp()
            .setFooter({ 
                text: `Team7 AutoMod v2.1 • Dernière analyse il y a ${status.lastScan}`,
                iconURL: 'https://i.imgur.com/s74nSIc.png'
            });

        const actionRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('automod_toggle')
                    .setLabel(status.enabled ? '❌ Désactiver' : '✅ Activer')
                    .setStyle(status.enabled ? ButtonStyle.Danger : ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('automod_setup')
                    .setLabel('⚙️ Configuration')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('automod_test')
                    .setLabel('🧪 Test filtres')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('automod_refresh')
                    .setLabel('🔄 Actualiser')
                    .setStyle(ButtonStyle.Secondary)
            );

        const actionRow2 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('automod_filters')
                    .setLabel('🔍 Gérer filtres')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('automod_actions')
                    .setLabel('⚡ Actions auto')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('automod_logs')
                    .setLabel('📋 Voir logs')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('automod_stats')
                    .setLabel('📊 Statistiques')
                    .setStyle(ButtonStyle.Secondary)
            );

        await interaction.editReply({
            embeds: [embed],
            components: [actionRow, actionRow2]
        });
    },

    async setupAutomod(interaction) {
        const niveau = interaction.options.getString('niveau');
        await interaction.deferReply();

        // Configuration selon le niveau choisi
        const configs = {
            basic: {
                name: '🟢 Configuration Basique',
                description: 'Protection minimale contre les abus évidents',
                filters: {
                    spam: true, profanity: false, links: false, 
                    mentions: false, caps: false, zalgo: true
                },
                thresholds: { spam: 5, mentions: 10, caps: 70 },
                actions: { delete: true, warn: false, timeout: false, kick: false, ban: false }
            },
            moderate: {
                name: '🟡 Configuration Modérée',
                description: 'Protection équilibrée pour la plupart des serveurs',
                filters: {
                    spam: true, profanity: true, links: true, 
                    mentions: true, caps: true, zalgo: true
                },
                thresholds: { spam: 4, mentions: 8, caps: 60 },
                actions: { delete: true, warn: true, timeout: true, kick: false, ban: false }
            },
            high: {
                name: '🟠 Configuration Élevée',
                description: 'Protection renforcée avec sanctions automatiques',
                filters: {
                    spam: true, profanity: true, links: true, 
                    mentions: true, caps: true, zalgo: true
                },
                thresholds: { spam: 3, mentions: 6, caps: 50 },
                actions: { delete: true, warn: true, timeout: true, kick: true, ban: false }
            },
            maximum: {
                name: '🔴 Configuration Maximum',
                description: 'Protection totale avec toutes les sanctions',
                filters: {
                    spam: true, profanity: true, links: true, 
                    mentions: true, caps: true, zalgo: true
                },
                thresholds: { spam: 2, mentions: 4, caps: 40 },
                actions: { delete: true, warn: true, timeout: true, kick: true, ban: true }
            }
        };

        const config = configs[niveau];
        
        if (!config) {
            const customEmbed = new EmbedBuilder()
                .setTitle('⚙️ **CONFIGURATION PERSONNALISÉE**')
                .setDescription('**Configurez manuellement chaque aspect de l\'automodération**')
                .addFields(
                    {
                        name: '🔧 **Étapes de configuration**',
                        value: `1. **Sélectionner les filtres** à activer\n2. **Définir les seuils** de déclenchement\n3. **Configurer les actions** automatiques\n4. **Paramétrer les exceptions** et listes blanches\n5. **Tester et ajuster** la configuration`,
                        inline: false
                    }
                )
                .setColor('#9b59b6');

            const customRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('automod_custom_filters')
                        .setLabel('🔍 Configurer filtres')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId('automod_custom_actions')
                        .setLabel('⚡ Configurer actions')
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId('automod_import_config')
                        .setLabel('📥 Importer config')
                        .setStyle(ButtonStyle.Success)
                );

            return await interaction.editReply({
                embeds: [customEmbed],
                components: [customRow]
            });
        }

        const embed = new EmbedBuilder()
            .setTitle('⚙️ **CONFIGURATION AUTOMODÉRATION**')
            .setDescription(`**${config.name}**\n${config.description}`)
            .addFields(
                {
                    name: '🔍 **Filtres qui seront activés**',
                    value: Object.entries(config.filters)
                        .map(([filter, enabled]) => `${enabled ? '✅' : '❌'} **${this.getFilterName(filter)}**`)
                        .join('\n'),
                    inline: true
                },
                {
                    name: '🎯 **Seuils de déclenchement**',
                    value: Object.entries(config.thresholds)
                        .map(([key, value]) => `**${this.getFilterName(key)} :** ${value}`)
                        .join('\n'),
                    inline: true
                },
                {
                    name: '⚡ **Actions automatiques**',
                    value: Object.entries(config.actions)
                        .map(([action, enabled]) => `${enabled ? '✅' : '❌'} **${this.getActionName(action)}**`)
                        .join('\n'),
                    inline: true
                },
                {
                    name: '📋 **Ce qui sera configuré**',
                    value: `• **Filtres de contenu** selon le niveau choisi\n• **Actions automatiques** progressives\n• **Logs de modération** dans #logs-automod\n• **Exceptions** pour les modérateurs\n• **Notifications** des actions importantes`,
                    inline: false
                },
                {
                    name: '⚠️ **Important**',
                    value: `Cette configuration va **écraser** les paramètres actuels. Une **sauvegarde automatique** sera créée.`,
                    inline: false
                }
            )
            .setColor('#f39c12')
            .setThumbnail('https://i.imgur.com/s74nSIc.png')
            .setTimestamp();

        const actionRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`automod_confirm_setup_${niveau}`)
                    .setLabel('✅ Appliquer configuration')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId(`automod_preview_${niveau}`)
                    .setLabel('👁️ Aperçu détaillé')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('automod_setup_cancel')
                    .setLabel('❌ Annuler')
                    .setStyle(ButtonStyle.Danger)
            );

        await interaction.editReply({
            embeds: [embed],
            components: [actionRow]
        });
    },

    async manageFilters(interaction) {
        const embed = new EmbedBuilder()
            .setTitle('🔍 **GESTION DES FILTRES**')
            .setDescription('**Configurez les filtres de détection automatique**')
            .addFields(
                {
                    name: '🚫 **Filtres de contenu**',
                    value: `✅ **Anti-spam :** Messages répétitifs (seuil: 3)\n❌ **Langage inapproprié :** Mots interdits et variantes\n✅ **Liens suspects :** URLs malveillantes et raccourcisseurs\n✅ **Mentions excessives :** Plus de 5 mentions (seuil: 5)\n❌ **MAJUSCULES :** Messages en caps lock (seuil: 70%)\n✅ **Texte déformé :** Caractères zalgo et unicode`,
                    inline: true
                },
                {
                    name: '🎯 **Filtres comportementaux**',
                    value: `✅ **Flood :** Messages trop rapides\n✅ **Raid :** Arrivée massive d'utilisateurs\n❌ **Bot suspect :** Comportement automatisé\n✅ **Compte jeune :** Moins de 7 jours\n❌ **Absence d'avatar :** Profil incomplet\n✅ **Nom suspect :** Caractères invisibles`,
                    inline: true
                },
                {
                    name: '🔧 **Filtres avancés**',
                    value: `❌ **IA toxicité :** Détection par IA (bêta)\n❌ **Sentiment négatif :** Analyse émotionnelle\n✅ **Phishing :** Tentatives d'hameçonnage\n❌ **Contenu NSFW :** Images inappropriées\n✅ **Doxxing :** Informations personnelles\n❌ **Contournement :** Bypass des filtres`,
                    inline: true
                }
            )
            .setColor('#3498db')
            .setThumbnail('https://i.imgur.com/s74nSIc.png');

        const filterSelect = new ActionRowBuilder()
            .addComponents(
                new SelectMenuBuilder()
                    .setCustomId('automod_filter_config')
                    .setPlaceholder('🔧 Configurer un filtre spécifique')
                    .addOptions([
                        {
                            label: 'Anti-spam',
                            value: 'spam',
                            emoji: '🚫',
                            description: 'Messages répétitifs et flood'
                        },
                        {
                            label: 'Langage inapproprié',
                            value: 'profanity',
                            emoji: '🤬',
                            description: 'Mots interdits et variantes'
                        },
                        {
                            label: 'Liens suspects',
                            value: 'links',
                            emoji: '🔗',
                            description: 'URLs malveillantes'
                        },
                        {
                            label: 'Mentions excessives',
                            value: 'mentions',
                            emoji: '📢',
                            description: 'Trop de mentions'
                        },
                        {
                            label: 'Texte en majuscules',
                            value: 'caps',
                            emoji: '🔤',
                            description: 'Messages en CAPS LOCK'
                        },
                        {
                            label: 'Caractères déformés',
                            value: 'zalgo',
                            emoji: '👾',
                            description: 'Texte zalgo et unicode'
                        }
                    ])
            );

        const actionRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('automod_filters_quick_enable')
                    .setLabel('⚡ Activation rapide')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('automod_filters_import')
                    .setLabel('📥 Importer liste')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('automod_filters_export')
                    .setLabel('📤 Exporter config')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('automod_filters_test')
                    .setLabel('🧪 Tester filtres')
                    .setStyle(ButtonStyle.Secondary)
            );

        await interaction.reply({
            embeds: [embed],
            components: [filterSelect, actionRow],
            ephemeral: true
        });
    },

    async manageWhitelist(interaction) {
        const embed = new EmbedBuilder()
            .setTitle('📝 **GESTION DES EXCEPTIONS**')
            .setDescription('**Configurez les exceptions et listes blanches**')
            .addFields(
                {
                    name: '👥 **Utilisateurs exemptés**',
                    value: `• **Administrateurs :** Exemption totale\n• **Modérateurs :** Exemption partielle\n• **Bots vérifiés :** 3 bots dans la liste\n• **Utilisateurs de confiance :** 12 membres\n• **Comptes anciens :** > 1 an automatique`,
                    inline: true
                },
                {
                    name: '📝 **Salons exemptés**',
                    value: `• **#staff-général :** Toutes exemptions\n• **#bot-commands :** Anti-spam désactivé\n• **#logs :** Filtres désactivés\n• **Salons vocaux :** Pas de restrictions\n• **Catégorie Staff :** Exemption complète`,
                    inline: true
                },
                {
                    name: '🔗 **Domaines autorisés**',
                    value: `• **discord.gg :** Invitations Discord\n• **youtube.com :** Liens YouTube\n• **twitter.com :** Liens Twitter\n• **github.com :** Liens GitHub\n• **team7.gg :** Domaine officiel`,
                    inline: true
                },
                {
                    name: '🏷️ **Rôles avec privilèges**',
                    value: `• **@Administrateur :** Toutes exemptions\n• **@Modérateur :** Exemptions mineures\n• **@Helper :** Anti-spam réduit\n• **@VIP :** Seuils augmentés\n• **@Booster :** Privilèges étendus`,
                    inline: true
                },
                {
                    name: '📋 **Types d\'exemptions**',
                    value: `• **Exemption totale :** Aucun filtre appliqué\n• **Exemption partielle :** Filtres réduits\n• **Seuils augmentés :** Limites plus élevées\n• **Logs uniquement :** Action sans sanction\n• **Révision manuelle :** Validation humaine`,
                    inline: true
                },
                {
                    name: '⚙️ **Configuration automatique**',
                    value: `• **Nouveaux admins :** Ajout automatique\n• **Départ de staff :** Retrait automatique\n• **Rotation :** Révision mensuelle\n• **Audit :** Contrôle hebdomadaire\n• **Backup :** Sauvegarde quotidienne`,
                    inline: true
                }
            )
            .setColor('#27ae60')
            .setThumbnail('https://i.imgur.com/s74nSIc.png');

        const typeSelect = new ActionRowBuilder()
            .addComponents(
                new SelectMenuBuilder()
                    .setCustomId('automod_whitelist_type')
                    .setPlaceholder('📝 Gérer un type d\'exception')
                    .addOptions([
                        {
                            label: 'Utilisateurs exemptés',
                            value: 'users',
                            emoji: '👥',
                            description: 'Gérer les utilisateurs dans la liste blanche'
                        },
                        {
                            label: 'Salons exemptés',
                            value: 'channels',
                            emoji: '📝',
                            description: 'Configurer les salons sans restrictions'
                        },
                        {
                            label: 'Domaines autorisés',
                            value: 'domains',
                            emoji: '🔗',
                            description: 'Liste des domaines de confiance'
                        },
                        {
                            label: 'Rôles privilégiés',
                            value: 'roles',
                            emoji: '🏷️',
                            description: 'Rôles avec exemptions automatiques'
                        },
                        {
                            label: 'Mots-clés autorisés',
                            value: 'keywords',
                            emoji: '🔤',
                            description: 'Exceptions pour mots spécifiques'
                        }
                    ])
            );

        const actionRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('automod_whitelist_add')
                    .setLabel('➕ Ajouter exception')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('automod_whitelist_bulk')
                    .setLabel('📋 Import en masse')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('automod_whitelist_audit')
                    .setLabel('🔍 Audit exceptions')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('automod_whitelist_export')
                    .setLabel('📤 Exporter liste')
                    .setStyle(ButtonStyle.Secondary)
            );

        await interaction.reply({
            embeds: [embed],
            components: [typeSelect, actionRow],
            ephemeral: true
        });
    },

    async manageActions(interaction) {
        const embed = new EmbedBuilder()
            .setTitle('⚡ **ACTIONS AUTOMATIQUES**')
            .setDescription('**Configurez les sanctions et réponses automatiques**')
            .addFields(
                {
                    name: '🗑️ **Actions immédiates**',
                    value: `✅ **Suppression message :** Automatique sur détection\n✅ **Suppression réactions :** Pour messages suspects\n❌ **Édition message :** Remplacer par avertissement\n✅ **Pin/Unpin :** Gestion automatique\n❌ **Thread :** Création pour discussion`,
                    inline: true
                },
                {
                    name: '⚠️ **Sanctions utilisateur**',
                    value: `✅ **Avertissement :** Message privé automatique\n✅ **Timeout :** 5 minutes par défaut\n❌ **Kick :** Après 3 infractions\n❌ **Ban temporaire :** 24h pour récidive\n❌ **Ban permanent :** Infractions graves`,
                    inline: true
                },
                {
                    name: '📋 **Logs et notifications**',
                    value: `✅ **Log détaillé :** #logs-automod\n✅ **Notification staff :** @Modérateur ping\n❌ **DM utilisateur :** Message d'explication\n✅ **Rapport public :** #infractions\n❌ **Webhook externe :** API tierces`,
                    inline: true
                },
                {
                    name: '🔄 **Actions progressives**',
                    value: `**1ère infraction :** Avertissement + suppression\n**2ème infraction :** Timeout 5 min\n**3ème infraction :** Timeout 1 heure\n**4ème infraction :** Kick du serveur\n**5ème infraction :** Ban temporaire 24h\n**Infractions graves :** Ban immédiat`,
                    inline: false
                },
                {
                    name: '⏰ **Délais et cooldowns**',
                    value: `**Analyse message :** < 100ms\n**Action rapide :** < 500ms\n**Cooldown utilisateur :** 30 secondes\n**Reset compteur :** 7 jours\n**Révision manuelle :** 24h max`,
                    inline: true
                },
                {
                    name: '🎯 **Conditions spéciales**',
                    value: `**Nouveaux membres :** Sanctions réduites\n**Membres anciens :** Tolérance accrue\n**Staff :** Logs uniquement\n**Bots :** Règles spécifiques\n**Raid détecté :** Mode urgence`,
                    inline: true
                }
            )
            .setColor('#e67e22')
            .setThumbnail('https://i.imgur.com/s74nSIc.png');

        const actionSelect = new ActionRowBuilder()
            .addComponents(
                new SelectMenuBuilder()
                    .setCustomId('automod_action_config')
                    .setPlaceholder('⚙️ Configurer une action spécifique')
                    .addOptions([
                        {
                            label: 'Suppression automatique',
                            value: 'delete',
                            emoji: '🗑️',
                            description: 'Paramètres de suppression des messages'
                        },
                        {
                            label: 'Système d\'avertissements',
                            value: 'warn',
                            emoji: '⚠️',
                            description: 'Configuration des warnings'
                        },
                        {
                            label: 'Timeouts automatiques',
                            value: 'timeout',
                            emoji: '⏱️',
                            description: 'Durées et conditions de timeout'
                        },
                        {
                            label: 'Kicks automatiques',
                            value: 'kick',
                            emoji: '👢',
                            description: 'Conditions de kick automatique'
                        },
                        {
                            label: 'Bans automatiques',
                            value: 'ban',
                            emoji: '🔨',
                            description: 'Règles de ban automatique'
                        },
                        {
                            label: 'Logs et notifications',
                            value: 'log',
                            emoji: '📋',
                            description: 'Configuration des logs'
                        }
                    ])
            );

        const actionRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('automod_actions_escalation')
                    .setLabel('📈 Escalade progressive')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('automod_actions_conditions')
                    .setLabel('🎯 Conditions spéciales')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('automod_actions_test')
                    .setLabel('🧪 Tester actions')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('automod_actions_preview')
                    .setLabel('👁️ Aperçu config')
                    .setStyle(ButtonStyle.Success)
            );

        await interaction.reply({
            embeds: [embed],
            components: [actionSelect, actionRow],
            ephemeral: true
        });
    },

    async showLogs(interaction) {
        await interaction.deferReply();

        const limite = interaction.options.getInteger('limite') || 20;
        
        // Récupérer les logs d'automodération (simulation)
        const logs = await this.getAutomodLogs(interaction.guild.id, limite);

        const embed = new EmbedBuilder()
            .setTitle('📋 **LOGS AUTOMODÉRATION**')
            .setDescription(`**${logs.length} dernières actions automatiques**`)
            .setColor('#3498db')
            .setThumbnail(interaction.guild.iconURL({ size: 256 }))
            .setTimestamp()
            .setFooter({ 
                text: `Team7 AutoMod • ${logs.length} événements`,
                iconURL: 'https://i.imgur.com/s74nSIc.png'
            });

        if (logs.length === 0) {
            embed.addFields({
                name: '📭 **Aucune activité récente**',
                value: 'Aucune action de modération automatique dans la période sélectionnée.',
                inline: false
            });
        } else {
            // Statistiques rapides
            const stats = this.analyzeLogsStats(logs);
            embed.addFields({
                name: '📊 **Résumé rapide**',
                value: `**Actions totales :** ${logs.length}\n**Types :** ${stats.types.join(', ')}\n**Période :** ${stats.timespan}\n**Efficacité :** ${stats.efficiency}%`,
                inline: false
            });

            // Afficher les logs récents
            for (const log of logs.slice(0, 8)) {
                embed.addFields({
                    name: `${this.getActionEmoji(log.action)} **${log.action}**`,
                    value: `**Utilisateur :** ${log.user}\n**Raison :** ${log.reason}\n**Date :** <t:${Math.floor(log.timestamp / 1000)}:R>\n**Canal :** ${log.channel}`,
                    inline: true
                });
            }

            if (logs.length > 8) {
                embed.addFields({
                    name: '📎 **Plus de logs**',
                    value: `${logs.length - 8} action(s) supplémentaire(s). Utilisez les boutons pour naviguer.`,
                    inline: false
                });
            }
        }

        const actionRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('automod_logs_filter')
                    .setLabel('🔍 Filtrer')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('automod_logs_export')
                    .setLabel('📤 Exporter')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('automod_logs_clear')
                    .setLabel('🗑️ Nettoyer')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId('automod_logs_refresh')
                    .setLabel('🔄 Actualiser')
                    .setStyle(ButtonStyle.Secondary)
            );

        await interaction.editReply({
            embeds: [embed],
            components: [actionRow]
        });
    },

    async showStats(interaction) {
        await interaction.deferReply();

        // Générer les statistiques (simulation)
        const stats = await this.getAutomodStats(interaction.guild.id);

        const embed = new EmbedBuilder()
            .setTitle('📊 **STATISTIQUES AUTOMODÉRATION**')
            .setDescription(`**Analyse des performances de ${interaction.guild.name}**`)
            .addFields(
                {
                    name: '⚡ **Performance générale**',
                    value: `**Messages analysés :** ${stats.analyzed.toLocaleString()}\n**Infractions détectées :** ${stats.violations}\n**Actions exécutées :** ${stats.actions}\n**Temps de réponse :** ${stats.responseTime}ms`,
                    inline: true
                },
                {
                    name: '🎯 **Efficacité**',
                    value: `**Précision :** ${stats.accuracy}%\n**Faux positifs :** ${stats.falsePositives}\n**Échappés :** ${stats.missed}\n**Score global :** ${stats.overallScore}/100`,
                    inline: true
                },
                {
                    name: '📈 **Tendances (7 jours)**',
                    value: `**Évolution :** ${stats.trend > 0 ? '📈' : '📉'} ${Math.abs(stats.trend)}%\n**Pic d'activité :** ${stats.peakTime}\n**Heure calme :** ${stats.quietTime}\n**Prédiction :** ${stats.prediction}`,
                    inline: true
                },
                {
                    name: '🔍 **Détails par filtre**',
                    value: Object.entries(stats.filterStats)
                        .map(([filter, data]) => `**${this.getFilterName(filter)} :** ${data.detections} (${data.accuracy}%)`)
                        .join('\n'),
                    inline: true
                },
                {
                    name: '⚡ **Actions exécutées**',
                    value: Object.entries(stats.actionStats)
                        .map(([action, count]) => `**${this.getActionName(action)} :** ${count}`)
                        .join('\n'),
                    inline: true
                },
                {
                    name: '🏆 **Records et achievements**',
                    value: `**Plus long sans incident :** ${stats.records.cleanStreak}\n**Pic d'infractions :** ${stats.records.maxViolations}/jour\n**Meilleur score :** ${stats.records.bestScore}%\n**Uptime :** ${stats.records.uptime}%`,
                    inline: true
                }
            )
            .setColor('#9b59b6')
            .setThumbnail(interaction.guild.iconURL({ size: 256 }))
            .setImage('https://i.imgur.com/s74nSIc.png')
            .setTimestamp()
            .setFooter({ 
                text: `Dernière mise à jour • Team7 AutoMod Analytics`,
                iconURL: 'https://i.imgur.com/s74nSIc.png'
            });

        const actionRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('automod_stats_detailed')
                    .setLabel('📊 Rapport détaillé')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('automod_stats_export')
                    .setLabel('📤 Exporter données')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('automod_stats_compare')
                    .setLabel('📈 Comparer périodes')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('automod_optimize')
                    .setLabel('🎯 Optimiser config')
                    .setStyle(ButtonStyle.Success)
            );

        await interaction.editReply({
            embeds: [embed],
            components: [actionRow]
        });
    },

    async testFilters(interaction) {
        const message = interaction.options.getString('message');
        await interaction.deferReply({ ephemeral: true });

        // Tester le message contre tous les filtres (simulation)
        const testResults = await this.testMessageAgainstFilters(message);

        const embed = new EmbedBuilder()
            .setTitle('🧪 **TEST DES FILTRES**')
            .setDescription('**Résultats de l\'analyse du message**')
            .addFields(
                {
                    name: '📝 **Message testé**',
                    value: `\`\`\`${message.length > 100 ? message.substring(0, 100) + '...' : message}\`\`\``,
                    inline: false
                },
                {
                    name: '🎯 **Résultat global**',
                    value: `**Statut :** ${testResults.blocked ? '❌ Bloqué' : '✅ Autorisé'}\n**Score de risque :** ${testResults.riskScore}/100\n**Confiance :** ${testResults.confidence}%\n**Temps d'analyse :** ${testResults.processingTime}ms`,
                    inline: true
                },
                {
                    name: '⚡ **Actions qui seraient exécutées**',
                    value: testResults.actions.length > 0 
                        ? testResults.actions.map(action => `• **${action.type}** : ${action.reason}`).join('\n')
                        : '• Aucune action nécessaire',
                    inline: true
                }
            )
            .setColor(testResults.blocked ? '#e74c3c' : '#27ae60')
            .setThumbnail('https://i.imgur.com/s74nSIc.png')
            .setTimestamp();

        // Détails par filtre
        if (testResults.filterDetails.length > 0) {
            for (const detail of testResults.filterDetails) {
                embed.addFields({
                    name: `${detail.triggered ? '❌' : '✅'} **${this.getFilterName(detail.filter)}**`,
                    value: `**Score :** ${detail.score}/100\n**Seuil :** ${detail.threshold}\n**Détails :** ${detail.details}`,
                    inline: true
                });
            }
        }

        const actionRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('automod_test_another')
                    .setLabel('🧪 Tester autre message')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('automod_test_adjust')
                    .setLabel('⚙️ Ajuster filtres')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('automod_test_whitelist')
                    .setLabel('📝 Ajouter exception')
                    .setStyle(ButtonStyle.Success)
                    .setDisabled(!testResults.blocked)
            );

        await interaction.editReply({
            embeds: [embed],
            components: [actionRow]
        });
    },

    // Méthodes utilitaires
    async getAutomodStatus(guildId) {
        return {
            enabled: true,
            level: '🟡 Modéré',
            lastUpdate: Date.now() - 3600000,
            performance: 94,
            filters: {
                spam: true, profanity: false, links: true,
                mentions: true, caps: false, zalgo: true
            },
            actions: {
                delete: true, warn: true, timeout: true,
                kick: false, ban: false, log: true
            },
            stats: {
                analyzed: 15847, violations: 23, actions: 18, falsePositives: 2
            },
            alerts: {
                attacks: 0, raids: 1, suspiciousAccounts: 3,
                lastAlert: 'Hier à 14:32'
            },
            efficiency: {
                accuracy: 91, speed: 85, uptime: 99.8, overall: 92
            },
            lastScan: '2 minutes'
        };
    },

    async getAutomodLogs(guildId, limit) {
        return [
            {
                action: 'Message supprimé',
                user: 'Spammer#1234',
                reason: 'Anti-spam: 5 messages identiques',
                channel: '#général',
                timestamp: Date.now() - 300000
            },
            {
                action: 'Timeout appliqué',
                user: 'Flooder#5678',
                reason: 'Flood: 10 messages en 3 secondes',
                channel: '#chat',
                timestamp: Date.now() - 600000
            },
            {
                action: 'Lien bloqué',
                user: 'Suspicious#9999',
                reason: 'URL raccourcie suspecte',
                channel: '#général',
                timestamp: Date.now() - 900000
            }
        ].slice(0, limit);
    },

    async getAutomodStats(guildId) {
        return {
            analyzed: 45678,
            violations: 234,
            actions: 198,
            responseTime: 85,
            accuracy: 91,
            falsePositives: 8,
            missed: 12,
            overallScore: 87,
            trend: 15.2,
            peakTime: '20h-22h',
            quietTime: '4h-6h',
            prediction: 'Stable',
            filterStats: {
                spam: { detections: 89, accuracy: 94 },
                profanity: { detections: 45, accuracy: 89 },
                links: { detections: 67, accuracy: 92 }
            },
            actionStats: {
                delete: 156, warn: 78, timeout: 34, kick: 12, ban: 3
            },
            records: {
                cleanStreak: '3 jours, 14 heures',
                maxViolations: 45,
                bestScore: 98,
                uptime: 99.94
            }
        };
    },

    async testMessageAgainstFilters(message) {
        // Simulation de test de message
        const hasSpam = message.length > 200 || /(.)\1{4,}/.test(message);
        const hasProfanity = /badword|spam|test/.test(message.toLowerCase());
        const hasLinks = /https?:\/\//.test(message);
        
        const blocked = hasSpam || hasProfanity;
        
        return {
            blocked,
            riskScore: blocked ? 75 : 15,
            confidence: 89,
            processingTime: Math.random() * 100 + 50,
            actions: blocked ? [
                { type: 'Suppression', reason: 'Message détecté comme spam' },
                { type: 'Avertissement', reason: 'Notification automatique' }
            ] : [],
            filterDetails: [
                {
                    filter: 'spam',
                    triggered: hasSpam,
                    score: hasSpam ? 85 : 10,
                    threshold: 70,
                    details: hasSpam ? 'Message trop long ou répétitif' : 'Contenu normal'
                },
                {
                    filter: 'profanity',
                    triggered: hasProfanity,
                    score: hasProfanity ? 90 : 5,
                    threshold: 50,
                    details: hasProfanity ? 'Mots interdits détectés' : 'Langage approprié'
                },
                {
                    filter: 'links',
                    triggered: false,
                    score: hasLinks ? 30 : 0,
                    threshold: 60,
                    details: hasLinks ? 'Lien détecté mais autorisé' : 'Aucun lien'
                }
            ]
        };
    },

    analyzeLogsStats(logs) {
        const types = [...new Set(logs.map(log => log.action))];
        const oldest = Math.min(...logs.map(log => log.timestamp));
        const newest = Math.max(...logs.map(log => log.timestamp));
        const timespan = `${Math.round((newest - oldest) / (1000 * 60 * 60))}h`;
        
        return {
            types: types.slice(0, 3),
            timespan,
            efficiency: 92
        };
    },

    getFilterName(filter) {
        const names = {
            spam: 'Anti-spam',
            profanity: 'Langage inapproprié',
            links: 'Liens suspects',
            mentions: 'Mentions excessives',
            caps: 'Majuscules',
            zalgo: 'Texte déformé'
        };
        return names[filter] || filter;
    },

    getActionName(action) {
        const names = {
            delete: 'Suppression',
            warn: 'Avertissement',
            timeout: 'Timeout',
            kick: 'Kick',
            ban: 'Ban',
            log: 'Log'
        };
        return names[action] || action;
    },

    getActionEmoji(action) {
        const emojis = {
            'Message supprimé': '🗑️',
            'Timeout appliqué': '⏱️',
            'Lien bloqué': '🔗',
            'Avertissement': '⚠️',
            'Kick': '👢',
            'Ban': '🔨'
        };
        return emojis[action] || '⚡';
    }
};
