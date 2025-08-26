import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, ChannelType, PermissionFlagsBits } from 'discord.js';

import AccessRestriction from '../../utils/AccessRestriction.js';
export default {
    data: new SlashCommandBuilder()
        .setName('config')
        .setDescription('⚙️ Configuration avancée du serveur Team7 Bot')
        .addSubcommand(subcommand =>
            subcommand
                .setName('view')
                .setDescription('Afficher la configuration actuelle')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('moderation')
                .setDescription('Configurer le système de modération')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('tickets')
                .setDescription('Configurer le système de tickets')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('logs')
                .setDescription('Configurer les logs du serveur')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('autoroles')
                .setDescription('Configurer les rôles automatiques')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('welcome')
                .setDescription('Configurer les messages de bienvenue')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('reset')
                .setDescription('Réinitialiser la configuration')
        ),

    async execute(interaction) {
        // === VÉRIFICATION D'ACCÈS GLOBALE ===
        const accessRestriction = new AccessRestriction();
        const hasAccess = await accessRestriction.checkAccess(interaction);
        if (!hasAccess) {
            return; // Accès refusé, message déjà envoyé
        }


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
            case 'view':
                await this.showConfigView(interaction);
                break;
            case 'moderation':
                await this.showModerationConfig(interaction);
                break;
            case 'tickets':
                await this.showTicketsConfig(interaction);
                break;
            case 'logs':
                await this.showLogsConfig(interaction);
                break;
            case 'autoroles':
                await this.showAutorolesConfig(interaction);
                break;
            case 'welcome':
                await this.showWelcomeConfig(interaction);
                break;
            case 'reset':
                await this.showResetConfig(interaction);
                break;
        }
    },

    async showConfigView(interaction) {
        await interaction.deferReply();

        // Récupérer la configuration actuelle (simulation)
        const config = await this.getCurrentConfig(interaction.guild);

        const embed = new EmbedBuilder()
            .setTitle('⚙️ **CONFIGURATION SERVEUR**')
            .setDescription(`**Configuration actuelle de ${interaction.guild.name}**`)
            .addFields(
                {
                    name: '🛡️ **Modération**',
                    value: `**Status :** ${config.moderation.enabled ? '🟢 Activé' : '🔴 Désactivé'}\n**Auto-mod :** ${config.moderation.automod ? '✅' : '❌'}\n**Salon logs :** ${config.moderation.logChannel || 'Non configuré'}\n**Rôle mute :** ${config.moderation.muteRole || 'Non configuré'}`,
                    inline: true
                },
                {
                    name: '🎫 **Système de tickets**',
                    value: `**Status :** ${config.tickets.enabled ? '🟢 Activé' : '🔴 Désactivé'}\n**Catégorie :** ${config.tickets.category || 'Non configurée'}\n**Rôle support :** ${config.tickets.supportRole || 'Non configuré'}\n**Tickets ouverts :** ${config.tickets.openCount || 0}`,
                    inline: true
                },
                {
                    name: '📝 **Logs**',
                    value: `**Salon général :** ${config.logs.general || 'Non configuré'}\n**Modération :** ${config.logs.moderation || 'Non configuré'}\n**Membres :** ${config.logs.members || 'Non configuré'}\n**Messages :** ${config.logs.messages || 'Non configuré'}`,
                    inline: true
                },
                {
                    name: '🎭 **Rôles automatiques**',
                    value: `**Rôle membres :** ${config.autoroles.member || 'Non configuré'}\n**Rôle bots :** ${config.autoroles.bot || 'Non configuré'}\n**Rôles niveau :** ${config.autoroles.levelRoles ? '✅ Configurés' : '❌ Non configurés'}`,
                    inline: true
                },
                {
                    name: '👋 **Messages de bienvenue**',
                    value: `**Status :** ${config.welcome.enabled ? '🟢 Activé' : '🔴 Désactivé'}\n**Salon :** ${config.welcome.channel || 'Non configuré'}\n**Message personnalisé :** ${config.welcome.customMessage ? '✅' : '❌'}\n**Embed :** ${config.welcome.embed ? '✅' : '❌'}`,
                    inline: true
                },
                {
                    name: '🔧 **Paramètres généraux**',
                    value: `**Préfixe :** ${config.general.prefix || '/'}\n**Langue :** ${config.general.language || 'Français'}\n**Timezone :** ${config.general.timezone || 'Europe/Paris'}\n**Dernière MAJ :** <t:${Math.floor(Date.now() / 1000)}:R>`,
                    inline: true
                }
            )
            .setColor('#3498db')
            .setThumbnail(interaction.guild.iconURL({ size: 256 }))
            .setImage('https://i.imgur.com/s74nSIc.png')
            .setTimestamp()
            .setFooter({ 
                text: `Configuration de ${interaction.guild.name} • Team7 Bot`,
                iconURL: 'https://i.imgur.com/s74nSIc.png'
            });

        const actionRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('config_moderation')
                    .setLabel('🛡️ Modération')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('config_tickets')
                    .setLabel('🎫 Tickets')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('config_logs')
                    .setLabel('📝 Logs')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('config_welcome')
                    .setLabel('👋 Bienvenue')
                    .setStyle(ButtonStyle.Success)
            );

        const actionRow2 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('config_autoroles')
                    .setLabel('🎭 Auto-rôles')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('config_export')
                    .setLabel('📥 Exporter config')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('config_import')
                    .setLabel('📤 Importer config')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('config_reset')
                    .setLabel('🔄 Reset')
                    .setStyle(ButtonStyle.Danger)
            );

        await interaction.editReply({
            embeds: [embed],
            components: [actionRow, actionRow2]
        });
    },

    async showModerationConfig(interaction) {
        const embed = new EmbedBuilder()
            .setTitle('🛡️ **CONFIGURATION MODÉRATION**')
            .setDescription('**Configurez le système de modération automatique**')
            .addFields(
                {
                    name: '⚙️ **Paramètres disponibles**',
                    value: `• **Auto-modération** : Filtres automatiques\n• **Salon logs** : Enregistrement des actions\n• **Rôle mute** : Rôle de sanction temporaire\n• **Niveaux d'alerte** : Système d'escalade\n• **Mots interdits** : Liste de mots bannis`,
                    inline: false
                },
                {
                    name: '🔧 **Fonctionnalités auto-mod**',
                    value: `• **Anti-spam** : Détection messages répétés\n• **Anti-flood** : Limitation fréquence\n• **Anti-caps** : Filtrage majuscules\n• **Anti-mention** : Limitation mentions\n• **Anti-lien** : Filtrage URLs`,
                    inline: true
                },
                {
                    name: '📊 **Niveaux de sanction**',
                    value: `• **Niveau 1** : Avertissement\n• **Niveau 2** : Mute temporaire\n• **Niveau 3** : Kick du serveur\n• **Niveau 4** : Ban temporaire\n• **Niveau 5** : Ban permanent`,
                    inline: true
                }
            )
            .setColor('#e74c3c')
            .setThumbnail('https://i.imgur.com/s74nSIc.png');

        const selectMenu = new ActionRowBuilder()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('config_moderation_option')
                    .setPlaceholder('🛠️ Choisissez un paramètre à configurer')
                    .addOptions([
                        {
                            label: 'Activer/Désactiver auto-mod',
                            description: 'Basculer la modération automatique',
                            value: 'toggle_automod',
                            emoji: '🔄'
                        },
                        {
                            label: 'Salon de logs',
                            description: 'Définir le salon des logs de modération',
                            value: 'set_log_channel',
                            emoji: '📝'
                        },
                        {
                            label: 'Rôle mute',
                            description: 'Configurer le rôle de mute',
                            value: 'set_mute_role',
                            emoji: '🔇'
                        },
                        {
                            label: 'Filtres anti-spam',
                            description: 'Configurer les filtres automatiques',
                            value: 'configure_filters',
                            emoji: '🚫'
                        },
                        {
                            label: 'Mots interdits',
                            description: 'Gérer la liste des mots bannis',
                            value: 'manage_blacklist',
                            emoji: '📝'
                        }
                    ])
            );

        const actionRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('config_moderation_test')
                    .setLabel('🧪 Tester la configuration')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('config_moderation_logs')
                    .setLabel('📊 Voir les logs')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('config_back')
                    .setLabel('⬅️ Retour')
                    .setStyle(ButtonStyle.Secondary)
            );

        await interaction.reply({
            embeds: [embed],
            components: [selectMenu, actionRow],
            ephemeral: true
        });
    },

    async showTicketsConfig(interaction) {
        const embed = new EmbedBuilder()
            .setTitle('🎫 **CONFIGURATION TICKETS**')
            .setDescription('**Configurez le système de support par tickets**')
            .addFields(
                {
                    name: '🏗️ **Structure des tickets**',
                    value: `• **Catégorie** : Catégorie pour les tickets\n• **Rôle support** : Équipe de support\n• **Canal création** : Salon avec bouton ticket\n• **Message d'accueil** : Premier message automatique\n• **Archivage** : Gestion des tickets fermés`,
                    inline: false
                },
                {
                    name: '🎨 **Personnalisation**',
                    value: `• **Embed personnalisé** : Design du message\n• **Boutons** : Style et couleurs\n• **Nom des tickets** : Format automatique\n• **Permissions** : Accès par rôle\n• **Transcription** : Sauvegarde auto`,
                    inline: true
                },
                {
                    name: '📊 **Statistiques**',
                    value: `• **Tickets ouverts** : Compteur actuel\n• **Temps de réponse** : Moyenne\n• **Satisfaction** : Notes utilisateurs\n• **Volume** : Tickets par jour\n• **Efficacité** : Temps de résolution`,
                    inline: true
                }
            )
            .setColor('#f39c12')
            .setThumbnail('https://i.imgur.com/s74nSIc.png');

        const selectMenu = new ActionRowBuilder()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('config_tickets_option')
                    .setPlaceholder('🎫 Choisissez un paramètre à configurer')
                    .addOptions([
                        {
                            label: 'Activer le système',
                            description: 'Activer/désactiver les tickets',
                            value: 'toggle_tickets',
                            emoji: '🔄'
                        },
                        {
                            label: 'Catégorie tickets',
                            description: 'Définir la catégorie des tickets',
                            value: 'set_category',
                            emoji: '📁'
                        },
                        {
                            label: 'Rôle support',
                            description: 'Équipe de support par défaut',
                            value: 'set_support_role',
                            emoji: '👥'
                        },
                        {
                            label: 'Message d\'accueil',
                            description: 'Personnaliser le message de bienvenue',
                            value: 'set_welcome_message',
                            emoji: '💬'
                        },
                        {
                            label: 'Bouton de création',
                            description: 'Envoyer le message avec bouton',
                            value: 'send_ticket_panel',
                            emoji: '🎮'
                        }
                    ])
            );

        const actionRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('config_tickets_stats')
                    .setLabel('📊 Statistiques')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('config_tickets_archive')
                    .setLabel('📦 Gestion archives')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('config_back')
                    .setLabel('⬅️ Retour')
                    .setStyle(ButtonStyle.Secondary)
            );

        await interaction.reply({
            embeds: [embed],
            components: [selectMenu, actionRow],
            ephemeral: true
        });
    },

    async showLogsConfig(interaction) {
        const embed = new EmbedBuilder()
            .setTitle('📝 **CONFIGURATION LOGS**')
            .setDescription('**Configurez l\'enregistrement des événements**')
            .addFields(
                {
                    name: '📋 **Types de logs disponibles**',
                    value: `• **Modération** : Actions de modération\n• **Membres** : Arrivées/départs\n• **Messages** : Éditions/suppressions\n• **Serveur** : Modifications serveur\n• **Voice** : Activité vocale\n• **Rôles** : Changements de rôles`,
                    inline: false
                },
                {
                    name: '⚙️ **Configuration par type**',
                    value: `• **Salon dédié** : Un salon par type\n• **Filtres** : Événements spécifiques\n• **Format** : Style des messages\n• **Mentions** : Notifications staff\n• **Archivage** : Durée de conservation`,
                    inline: true
                },
                {
                    name: '🔍 **Recherche et filtres**',
                    value: `• **Recherche par utilisateur**\n• **Filtrage par date**\n• **Export des logs**\n• **Statistiques d'usage**\n• **Alertes automatiques**`,
                    inline: true
                }
            )
            .setColor('#9b59b6')
            .setThumbnail('https://i.imgur.com/s74nSIc.png');

        const selectMenu = new ActionRowBuilder()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('config_logs_option')
                    .setPlaceholder('📝 Choisissez un type de log à configurer')
                    .addOptions([
                        {
                            label: 'Logs de modération',
                            description: 'Actions de modération (warn, kick, ban)',
                            value: 'moderation_logs',
                            emoji: '🛡️'
                        },
                        {
                            label: 'Logs des membres',
                            description: 'Arrivées et départs des membres',
                            value: 'member_logs',
                            emoji: '👥'
                        },
                        {
                            label: 'Logs des messages',
                            description: 'Éditions et suppressions de messages',
                            value: 'message_logs',
                            emoji: '💬'
                        },
                        {
                            label: 'Logs du serveur',
                            description: 'Modifications du serveur',
                            value: 'server_logs',
                            emoji: '⚙️'
                        },
                        {
                            label: 'Logs vocaux',
                            description: 'Activité dans les salons vocaux',
                            value: 'voice_logs',
                            emoji: '🔊'
                        }
                    ])
            );

        const actionRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('config_logs_enable_all')
                    .setLabel('✅ Activer tous')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('config_logs_disable_all')
                    .setLabel('❌ Désactiver tous')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId('config_back')
                    .setLabel('⬅️ Retour')
                    .setStyle(ButtonStyle.Secondary)
            );

        await interaction.reply({
            embeds: [embed],
            components: [selectMenu, actionRow],
            ephemeral: true
        });
    },

    async showAutorolesConfig(interaction) {
        const embed = new EmbedBuilder()
            .setTitle('🎭 **CONFIGURATION AUTO-RÔLES**')
            .setDescription('**Configurez l\'attribution automatique des rôles**')
            .addFields(
                {
                    name: '🎯 **Types d\'auto-rôles**',
                    value: `• **Nouveaux membres** : Rôle à l'arrivée\n• **Bots** : Rôle pour les bots\n• **Rôles de niveau** : Progression automatique\n• **Rôles de réaction** : Attribution par réaction\n• **Rôles temporaires** : Durée limitée`,
                    inline: false
                },
                {
                    name: '⚙️ **Conditions d\'attribution**',
                    value: `• **Délai d'attente** : Temps avant attribution\n• **Vérification** : Système de captcha\n• **Règles acceptées** : Validation règlement\n• **Boost serveur** : Rôle booster\n• **Activité** : Basé sur l'engagement`,
                    inline: true
                },
                {
                    name: '🔄 **Gestion automatique**',
                    value: `• **Suppression départ** : Retrait automatique\n• **Hiérarchie** : Respect des permissions\n• **Cumul** : Multiple rôles possibles\n• **Logs** : Traçabilité des attributions\n• **Exceptions** : Rôles exclus`,
                    inline: true
                }
            )
            .setColor('#2ecc71')
            .setThumbnail('https://i.imgur.com/s74nSIc.png');

        const selectMenu = new ActionRowBuilder()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('config_autoroles_option')
                    .setPlaceholder('🎭 Choisissez un type d\'auto-rôle')
                    .addOptions([
                        {
                            label: 'Rôle nouveaux membres',
                            description: 'Rôle donné aux nouveaux arrivants',
                            value: 'member_role',
                            emoji: '👋'
                        },
                        {
                            label: 'Rôle pour bots',
                            description: 'Rôle automatique pour les bots',
                            value: 'bot_role',
                            emoji: '🤖'
                        },
                        {
                            label: 'Rôles de niveau',
                            description: 'Système de progression par niveaux',
                            value: 'level_roles',
                            emoji: '📈'
                        },
                        {
                            label: 'Rôles de réaction',
                            description: 'Attribution par réaction à un message',
                            value: 'reaction_roles',
                            emoji: '🎭'
                        },
                        {
                            label: 'Rôle booster',
                            description: 'Rôle spécial pour les boosters',
                            value: 'booster_role',
                            emoji: '💎'
                        }
                    ])
            );

        const actionRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('config_autoroles_test')
                    .setLabel('🧪 Tester attribution')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('config_autoroles_cleanup')
                    .setLabel('🧹 Nettoyage rôles')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('config_back')
                    .setLabel('⬅️ Retour')
                    .setStyle(ButtonStyle.Secondary)
            );

        await interaction.reply({
            embeds: [embed],
            components: [selectMenu, actionRow],
            ephemeral: true
        });
    },

    async showWelcomeConfig(interaction) {
        const embed = new EmbedBuilder()
            .setTitle('👋 **CONFIGURATION BIENVENUE**')
            .setDescription('**Configurez les messages d\'accueil des nouveaux membres**')
            .addFields(
                {
                    name: '💬 **Types de messages**',
                    value: `• **Message simple** : Texte basique\n• **Embed riche** : Message formaté\n• **Image personnalisée** : Avec avatar\n• **GIF animé** : Message dynamique\n• **Message privé** : DM automatique`,
                    inline: false
                },
                {
                    name: '🎨 **Personnalisation**',
                    value: `• **Variables** : {user}, {server}, {count}\n• **Couleurs** : Thème du serveur\n• **Images** : Bannière personnalisée\n• **Boutons** : Actions rapides\n• **Mentions** : Rôles et salons`,
                    inline: true
                },
                {
                    name: '⚙️ **Options avancées**',
                    value: `• **Délai d'envoi** : Retard configurable\n• **Conditions** : Filtres d'envoi\n• **A/B Testing** : Messages variables\n• **Statistiques** : Taux d'engagement\n• **Modération** : Filtrage antispam`,
                    inline: true
                }
            )
            .setColor('#e91e63')
            .setThumbnail('https://i.imgur.com/s74nSIc.png');

        const selectMenu = new ActionRowBuilder()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('config_welcome_option')
                    .setPlaceholder('👋 Choisissez un paramètre de bienvenue')
                    .addOptions([
                        {
                            label: 'Activer/Désactiver',
                            description: 'Basculer les messages de bienvenue',
                            value: 'toggle_welcome',
                            emoji: '🔄'
                        },
                        {
                            label: 'Salon de bienvenue',
                            description: 'Définir le salon d\'accueil',
                            value: 'set_welcome_channel',
                            emoji: '📝'
                        },
                        {
                            label: 'Message personnalisé',
                            description: 'Créer un message d\'accueil',
                            value: 'set_welcome_message',
                            emoji: '💬'
                        },
                        {
                            label: 'Embed de bienvenue',
                            description: 'Créer un embed personnalisé',
                            value: 'create_welcome_embed',
                            emoji: '🎨'
                        },
                        {
                            label: 'Variables disponibles',
                            description: 'Voir les variables utilisables',
                            value: 'show_variables',
                            emoji: '📋'
                        }
                    ])
            );

        const actionRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('config_welcome_preview')
                    .setLabel('👁️ Aperçu')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('config_welcome_test')
                    .setLabel('🧪 Test message')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('config_back')
                    .setLabel('⬅️ Retour')
                    .setStyle(ButtonStyle.Secondary)
            );

        await interaction.reply({
            embeds: [embed],
            components: [selectMenu, actionRow],
            ephemeral: true
        });
    },

    async showResetConfig(interaction) {
        const embed = new EmbedBuilder()
            .setTitle('🔄 **RÉINITIALISATION CONFIGURATION**')
            .setDescription('**⚠️ ATTENTION : Cette action est irréversible !**')
            .addFields(
                {
                    name: '🗑️ **Options de réinitialisation**',
                    value: `• **Reset complet** : Toute la configuration\n• **Reset modération** : Uniquement la modération\n• **Reset tickets** : Système de tickets\n• **Reset logs** : Configuration des logs\n• **Reset autorôles** : Rôles automatiques`,
                    inline: false
                },
                {
                    name: '💾 **Sauvegarde automatique**',
                    value: `Avant toute réinitialisation, une sauvegarde automatique sera créée et vous sera envoyée en message privé.`,
                    inline: false
                },
                {
                    name: '⏱️ **Délai de sécurité**',
                    value: `Un délai de 30 secondes sera appliqué avant la réinitialisation effective pour vous permettre d'annuler.`,
                    inline: false
                }
            )
            .setColor('#e74c3c')
            .setThumbnail('https://i.imgur.com/s74nSIc.png');

        const selectMenu = new ActionRowBuilder()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('config_reset_option')
                    .setPlaceholder('⚠️ Choisissez ce que vous voulez réinitialiser')
                    .addOptions([
                        {
                            label: 'Reset complet',
                            description: 'Réinitialiser toute la configuration',
                            value: 'reset_all',
                            emoji: '🗑️'
                        },
                        {
                            label: 'Reset modération',
                            description: 'Réinitialiser uniquement la modération',
                            value: 'reset_moderation',
                            emoji: '🛡️'
                        },
                        {
                            label: 'Reset tickets',
                            description: 'Réinitialiser le système de tickets',
                            value: 'reset_tickets',
                            emoji: '🎫'
                        },
                        {
                            label: 'Reset logs',
                            description: 'Réinitialiser la configuration des logs',
                            value: 'reset_logs',
                            emoji: '📝'
                        },
                        {
                            label: 'Reset autorôles',
                            description: 'Réinitialiser les rôles automatiques',
                            value: 'reset_autoroles',
                            emoji: '🎭'
                        }
                    ])
            );

        const actionRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('config_backup_before_reset')
                    .setLabel('💾 Sauvegarder avant')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('config_cancel_reset')
                    .setLabel('❌ Annuler')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('config_back')
                    .setLabel('⬅️ Retour')
                    .setStyle(ButtonStyle.Secondary)
            );

        await interaction.reply({
            embeds: [embed],
            components: [selectMenu, actionRow],
            ephemeral: true
        });
    },

    async getCurrentConfig(guild) {
        // Simulation de récupération de configuration
        // En réalité, cela viendrait de la base de données
        return {
            moderation: {
                enabled: true,
                automod: true,
                logChannel: '#mod-logs',
                muteRole: '@Muted'
            },
            tickets: {
                enabled: true,
                category: 'Support',
                supportRole: '@Support',
                openCount: 3
            },
            logs: {
                general: '#logs',
                moderation: '#mod-logs',
                members: '#member-logs',
                messages: '#message-logs'
            },
            autoroles: {
                member: '@Membre',
                bot: '@Bot',
                levelRoles: true
            },
            welcome: {
                enabled: true,
                channel: '#bienvenue',
                customMessage: true,
                embed: true
            },
            general: {
                prefix: '/',
                language: 'Français',
                timezone: 'Europe/Paris'
            }
        };
    }
};
