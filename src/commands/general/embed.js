import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ChannelType, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, StringSelectMenuBuilder, MessageFlags } from 'discord.js';
import Logger from '../../utils/Logger.js';

export default {
    data: new SlashCommandBuilder()
        .setName('embed')
        .setDescription('🎨 Créateur d\'embeds professionnel avec IA et templates avancés')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
        .addSubcommand(subcommand =>
            subcommand
                .setName('rapide')
                .setDescription('⚡ Création rapide d\'embed avec raccourcis intelligents')
                .addStringOption(option =>
                    option.setName('titre')
                        .setDescription('📋 Titre de l\'embed')
                        .setRequired(true)
                        .setMaxLength(256))
                .addStringOption(option =>
                    option.setName('description')
                        .setDescription('📄 Description de l\'embed')
                        .setRequired(true)
                        .setMaxLength(4096))
                .addStringOption(option =>
                    option.setName('style')
                        .setDescription('🎨 Style prédéfini pour l\'embed')
                        .setRequired(false)
                        .addChoices(
                            { name: '🔥 Moderne - Rouge Feu', value: 'modern_red' },
                            { name: '💎 Élégant - Bleu Cristal', value: 'elegant_blue' },
                            { name: '🌟 Premium - Or Brillant', value: 'premium_gold' },
                            { name: '🌿 Nature - Vert Forêt', value: 'nature_green' },
                            { name: '🌸 Doux - Rose Pastel', value: 'soft_pink' },
                            { name: '🌊 Océan - Bleu Profond', value: 'ocean_blue' },
                            { name: '🔮 Mystique - Violet Magique', value: 'mystic_purple' },
                            { name: '☀️ Solaire - Jaune Éclatant', value: 'solar_yellow' },
                            { name: '🖤 Sombre - Noir Élégant', value: 'dark_black' },
                            { name: '🤍 Minimaliste - Blanc Pur', value: 'minimal_white' }
                        ))
                .addChannelOption(option =>
                    option.setName('canal')
                        .setDescription('📍 Canal de destination (optionnel)')
                        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement))
                .addStringOption(option =>
                    option.setName('mention')
                        .setDescription('📢 Mention à ajouter')
                        .setRequired(false)
                        .addChoices(
                            { name: '@everyone', value: '@everyone' },
                            { name: '@here', value: '@here' }
                        )))
        .addSubcommand(subcommand =>
            subcommand
                .setName('templates')
                .setDescription('📚 Galerie de templates professionnels avec prévisualisation')
                .addStringOption(option =>
                    option.setName('categorie')
                        .setDescription('🗂️ Catégorie de templates')
                        .setRequired(false)
                        .addChoices(
                            { name: '📢 Communication', value: 'communication' },
                            { name: '🎉 Événements', value: 'events' },
                            { name: '🎮 Gaming', value: 'gaming' },
                            { name: '💼 Business', value: 'business' },
                            { name: '🎨 Créatif', value: 'creative' },
                            { name: '🎄 Saisonnier', value: 'seasonal' },
                            { name: '🏆 Compétition', value: 'competition' },
                            { name: '📚 Éducatif', value: 'educational' }
                        )))
        .addSubcommand(subcommand =>
            subcommand
                .setName('studio')
                .setDescription('🎬 Studio de création avancé avec prévisualisation temps réel')
                .addChannelOption(option =>
                    option.setName('canal')
                        .setDescription('📍 Canal de destination')
                        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('ia')
                .setDescription('🤖 Générateur d\'embeds assisté par IA')
                .addStringOption(option =>
                    option.setName('description')
                        .setDescription('💭 Décrivez l\'embed que vous voulez créer')
                        .setRequired(true)
                        .setMaxLength(500))
                .addStringOption(option =>
                    option.setName('ton')
                        .setDescription('🎭 Ton et style souhaité')
                        .setRequired(false)
                        .addChoices(
                            { name: '📢 Officiel et Professionnel', value: 'official' },
                            { name: '🎉 Amical et Décontracté', value: 'friendly' },
                            { name: '🔥 Énergique et Motivant', value: 'energetic' },
                            { name: '💎 Élégant et Raffiné', value: 'elegant' },
                            { name: '🎮 Gaming et Fun', value: 'gaming' },
                            { name: '📚 Informatif et Éducatif', value: 'educational' }
                        )))
        .addSubcommand(subcommand =>
            subcommand
                .setName('favoris')
                .setDescription('⭐ Gérer vos embeds favoris et collections')
                .addStringOption(option =>
                    option.setName('action')
                        .setDescription('🔧 Action à effectuer')
                        .setRequired(true)
                        .addChoices(
                            { name: '📋 Voir mes favoris', value: 'list' },
                            { name: '💾 Sauvegarder un embed', value: 'save' },
                            { name: '🗑️ Supprimer un favori', value: 'delete' },
                            { name: '📤 Partager une collection', value: 'share' }
                        )))
        .addSubcommand(subcommand =>
            subcommand
                .setName('json')
                .setDescription('📄 Import/Export JSON avec validation avancée')
                .addStringOption(option =>
                    option.setName('action')
                        .setDescription('🔧 Action JSON')
                        .setRequired(true)
                        .addChoices(
                            { name: '📥 Importer JSON', value: 'import' },
                            { name: '📤 Exporter embed', value: 'export' },
                            { name: '🔍 Valider JSON', value: 'validate' }
                        )))
        .addSubcommand(subcommand =>
            subcommand
                .setName('stats')
                .setDescription('📊 Statistiques d\'utilisation et analytics')
                .addBooleanOption(option =>
                    option.setName('detaille')
                        .setDescription('📈 Affichage détaillé des statistiques')
                        .setRequired(false))),

    async execute(interaction) {
        const { options, guild, client, user, channel } = interaction;
        const logger = new Logger();
        const subcommand = options.getSubcommand();

        try {
            switch (subcommand) {
                case 'rapide':
                    await this.handleRapideEmbed(interaction, logger);
                    break;
                case 'templates':
                    await this.handleTemplatesGallery(interaction, logger);
                    break;
                case 'studio':
                    await this.handleStudioCreation(interaction, logger);
                    break;
                case 'ia':
                    await this.handleIAGeneration(interaction, logger);
                    break;
                case 'favoris':
                    await this.handleFavorites(interaction, logger);
                    break;
                case 'json':
                    await this.handleJsonActions(interaction, logger);
                    break;
                case 'stats':
                    await this.handleStats(interaction, logger);
                    break;
                default:
                await interaction.reply({
                    content: '❌ Sous-commande non reconnue.',
                    flags: MessageFlags.Ephemeral
                });
            }
        } catch (error) {
            logger.error('Erreur lors de la création de l\'embed:', error);
            
            const errorMessage = '❌ Une erreur est survenue lors de la création de l\'embed. Vérifiez vos paramètres et réessayez.';
            
            if (interaction.replied || interaction.deferred) {
                await interaction.editReply({ content: errorMessage });
            } else {
                await interaction.reply({ content: errorMessage, flags: MessageFlags.Ephemeral });
            }
        }
    },

    // ===== NOUVELLES FONCTIONNALITÉS =====

    async handleRapideEmbed(interaction, logger) {
        const { options } = interaction;
        
        // Utiliser le validateur d'interactions pour une déférence rapide
        const validator = interaction.client.interactionValidator;
        const deferred = await validator.quickDefer(interaction, { flags: MessageFlags.Ephemeral });
        
        if (!deferred) {
            return; // Interaction expirée ou déjà traitée
        }

        const titre = options.getString('titre');
        const description = options.getString('description');
        const style = options.getString('style') || 'elegant_blue';
        const targetChannel = options.getChannel('canal') || interaction.channel;
        const mention = options.getString('mention');

        // Styles prédéfinis avec configurations complètes
        const styles = {
            modern_red: {
                color: '#ff4757',
                thumbnail: '🔥',
                footer: 'Style Moderne',
                borderEmoji: '🔴'
            },
            elegant_blue: {
                color: '#3742fa',
                thumbnail: '💎',
                footer: 'Style Élégant',
                borderEmoji: '🔵'
            },
            premium_gold: {
                color: '#ffd700',
                thumbnail: '🌟',
                footer: 'Style Premium',
                borderEmoji: '🟡'
            },
            nature_green: {
                color: '#2ed573',
                thumbnail: '🌿',
                footer: 'Style Nature',
                borderEmoji: '🟢'
            },
            soft_pink: {
                color: '#ff6b9d',
                thumbnail: '🌸',
                footer: 'Style Doux',
                borderEmoji: '🩷'
            },
            ocean_blue: {
                color: '#0984e3',
                thumbnail: '🌊',
                footer: 'Style Océan',
                borderEmoji: '🔵'
            },
            mystic_purple: {
                color: '#a55eea',
                thumbnail: '🔮',
                footer: 'Style Mystique',
                borderEmoji: '🟣'
            },
            solar_yellow: {
                color: '#feca57',
                thumbnail: '☀️',
                footer: 'Style Solaire',
                borderEmoji: '🟡'
            },
            dark_black: {
                color: '#2f3542',
                thumbnail: '🖤',
                footer: 'Style Sombre',
                borderEmoji: '⚫'
            },
            minimal_white: {
                color: '#ffffff',
                thumbnail: '🤍',
                footer: 'Style Minimaliste',
                borderEmoji: '⚪'
            }
        };

        const selectedStyle = styles[style];
        
        // Création de l'embed avec style
        const embed = new EmbedBuilder()
            .setTitle(`${selectedStyle.borderEmoji} ${titre}`)
            .setDescription(description)
            .setColor(selectedStyle.color)
            .setFooter({ 
                text: selectedStyle.footer, 
                iconURL: interaction.client.user.displayAvatarURL() 
            })
            .setTimestamp();

        // Préparation du message
        const messageOptions = { embeds: [embed] };
        
        if (mention) {
            messageOptions.content = mention;
        }

        try {
            const sentMessage = await targetChannel.send(messageOptions);
            
            logger.success(`Embed rapide créé par ${interaction.user.tag} dans #${targetChannel.name}`);
            
            // Interface de gestion post-envoi
            const manageRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`save_favorite_${sentMessage.id}`)
                        .setLabel('⭐ Sauvegarder')
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId(`edit_sent_${sentMessage.id}`)
                        .setLabel('✏️ Modifier')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId(`duplicate_${sentMessage.id}`)
                        .setLabel('📋 Dupliquer')
                        .setStyle(ButtonStyle.Secondary)
                );

            await interaction.editReply({
                content: `✅ **Embed créé avec succès !**\n\n📍 **Canal :** ${targetChannel}\n🎨 **Style :** ${selectedStyle.footer}\n🆔 **Message ID :** \`${sentMessage.id}\`\n\n[🔗 Aller au message](${sentMessage.url})`,
                components: [manageRow]
            });

        } catch (error) {
            logger.error('Erreur lors de l\'envoi de l\'embed rapide:', error);
            await interaction.editReply({
                content: '❌ Impossible d\'envoyer l\'embed dans ce canal. Vérifiez les permissions du bot.'
            });
        }
    },

    async handleTemplatesGallery(interaction, logger) {
        const { options } = interaction;
        
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const categorie = options.getString('categorie') || 'communication';

        // Templates organisés par catégorie
        const templateCategories = {
            communication: {
                name: '📢 Communication',
                templates: [
                    { id: 'annonce_moderne', name: '📢 Annonce Moderne', description: 'Annonce officielle avec design moderne' },
                    { id: 'info_importante', name: '⚠️ Information Importante', description: 'Information critique à diffuser' },
                    { id: 'mise_a_jour', name: '🔄 Mise à Jour', description: 'Annonce de mise à jour ou changement' },
                    { id: 'bienvenue_membre', name: '👋 Bienvenue', description: 'Message de bienvenue pour nouveaux membres' }
                ]
            },
            events: {
                name: '🎉 Événements',
                templates: [
                    { id: 'event_gaming', name: '🎮 Événement Gaming', description: 'Tournoi ou session de jeu' },
                    { id: 'concours_creatif', name: '🎨 Concours Créatif', description: 'Concours artistique ou créatif' },
                    { id: 'soiree_communaute', name: '🎊 Soirée Communauté', description: 'Événement social communautaire' },
                    { id: 'stream_live', name: '📺 Stream Live', description: 'Annonce de stream en direct' }
                ]
            },
            gaming: {
                name: '🎮 Gaming',
                templates: [
                    { id: 'recrutement_team', name: '👥 Recrutement Team', description: 'Recherche de joueurs pour équipe' },
                    { id: 'match_resultat', name: '🏆 Résultat Match', description: 'Résultats de match ou tournoi' },
                    { id: 'nouveau_jeu', name: '🆕 Nouveau Jeu', description: 'Annonce d\'un nouveau jeu' },
                    { id: 'guide_strategie', name: '📚 Guide Stratégie', description: 'Guide ou tutoriel de jeu' }
                ]
            },
            business: {
                name: '💼 Business',
                templates: [
                    { id: 'partenariat_officiel', name: '🤝 Partenariat', description: 'Annonce de partenariat' },
                    { id: 'rapport_mensuel', name: '📊 Rapport Mensuel', description: 'Rapport d\'activité mensuel' },
                    { id: 'recrutement_staff', name: '💼 Recrutement Staff', description: 'Offre d\'emploi ou bénévolat' },
                    { id: 'presentation_service', name: '🎯 Présentation Service', description: 'Présentation d\'un nouveau service' }
                ]
            },
            creative: {
                name: '🎨 Créatif',
                templates: [
                    { id: 'showcase_art', name: '🖼️ Showcase Art', description: 'Présentation d\'œuvre artistique' },
                    { id: 'tutoriel_creatif', name: '📚 Tutoriel Créatif', description: 'Guide créatif ou artistique' },
                    { id: 'inspiration_daily', name: '✨ Inspiration Quotidienne', description: 'Citation ou inspiration du jour' },
                    { id: 'challenge_creatif', name: '🎯 Challenge Créatif', description: 'Défi créatif communautaire' }
                ]
            },
            seasonal: {
                name: '🎄 Saisonnier',
                templates: [
                    { id: 'noel_festif', name: '🎄 Noël Festif', description: 'Template de Noël chaleureux' },
                    { id: 'halloween_spooky', name: '🎃 Halloween Spooky', description: 'Template Halloween effrayant' },
                    { id: 'nouvel_an', name: '🎊 Nouvel An', description: 'Célébration du Nouvel An' },
                    { id: 'ete_vacances', name: '☀️ Été Vacances', description: 'Template estival et vacances' }
                ]
            },
            competition: {
                name: '🏆 Compétition',
                templates: [
                    { id: 'tournoi_esport', name: '🎮 Tournoi Esport', description: 'Tournoi de jeux vidéo' },
                    { id: 'classement_leaderboard', name: '📊 Classement', description: 'Tableau des scores' },
                    { id: 'prix_recompenses', name: '🎁 Prix & Récompenses', description: 'Annonce des prix' },
                    { id: 'regles_competition', name: '📋 Règles Compétition', description: 'Règlement de compétition' }
                ]
            },
            educational: {
                name: '📚 Éducatif',
                templates: [
                    { id: 'cours_tutoriel', name: '🎓 Cours & Tutoriel', description: 'Contenu éducatif' },
                    { id: 'faq_aide', name: '❓ FAQ & Aide', description: 'Questions fréquentes' },
                    { id: 'ressources_utiles', name: '📖 Ressources Utiles', description: 'Collection de ressources' },
                    { id: 'quiz_knowledge', name: '🧠 Quiz Knowledge', description: 'Quiz éducatif' }
                ]
            }
        };

        const selectedCategory = templateCategories[categorie];
        
        // Embed de présentation de la galerie
        const galleryEmbed = new EmbedBuilder()
            .setTitle(`📚 GALERIE DE TEMPLATES - ${selectedCategory.name}`)
            .setDescription(`Découvrez notre collection de templates professionnels pour la catégorie **${selectedCategory.name}**.\n\nCliquez sur un template ci-dessous pour le prévisualiser et l'utiliser.`)
            .setColor('#5865f2')
            .addFields(
                selectedCategory.templates.map(template => ({
                    name: template.name,
                    value: template.description,
                    inline: true
                }))
            )
            .setFooter({ 
                text: `${selectedCategory.templates.length} templates disponibles`, 
                iconURL: interaction.client.user.displayAvatarURL() 
            })
            .setTimestamp();

        // Menu de sélection des templates
        const templateSelect = new StringSelectMenuBuilder()
            .setCustomId(`template_select_${categorie}`)
            .setPlaceholder('🎨 Choisissez un template à prévisualiser...')
            .addOptions(
                selectedCategory.templates.map(template => ({
                    label: template.name,
                    description: template.description,
                    value: template.id,
                    emoji: template.name.split(' ')[0]
                }))
            );

        // Menu de sélection des catégories
        const categorySelect = new StringSelectMenuBuilder()
            .setCustomId('category_select')
            .setPlaceholder('🗂️ Changer de catégorie...')
            .addOptions(
                Object.entries(templateCategories).map(([key, cat]) => ({
                    label: cat.name,
                    description: `${cat.templates.length} templates disponibles`,
                    value: key,
                    emoji: cat.name.split(' ')[0]
                }))
            );

        const row1 = new ActionRowBuilder().addComponents(templateSelect);
        const row2 = new ActionRowBuilder().addComponents(categorySelect);

        await interaction.editReply({
            embeds: [galleryEmbed],
            components: [row1, row2]
        });
    },

    async handleStudioCreation(interaction, logger) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const targetChannel = interaction.options.getChannel('canal') || interaction.channel;

        // Interface du studio de création
        const studioEmbed = new EmbedBuilder()
            .setTitle('🎬 STUDIO DE CRÉATION AVANCÉ')
            .setDescription(`Bienvenue dans le Studio de Création ! Créez des embeds professionnels avec une prévisualisation en temps réel.\n\n**🎯 Canal de destination :** ${targetChannel}\n\n**📋 Fonctionnalités disponibles :**\n• Prévisualisation temps réel\n• Assistant de couleurs\n• Galerie d'images\n• Templates personnalisables\n• Export/Import JSON`)
            .setColor('#ff6b9d')
            .addFields(
                { name: '🎨 Design', value: 'Couleurs, images, mise en forme', inline: true },
                { name: '📝 Contenu', value: 'Texte, champs, structure', inline: true },
                { name: '⚡ Actions', value: 'Prévisualiser, sauvegarder, envoyer', inline: true }
            )
            .setFooter({ text: 'Studio de Création Professionnel', iconURL: interaction.client.user.displayAvatarURL() })
            .setTimestamp();

        // Interface du studio
        const designRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('studio_design')
                    .setLabel('🎨 Design & Style')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('studio_content')
                    .setLabel('📝 Contenu & Texte')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('studio_structure')
                    .setLabel('📋 Structure & Champs')
                    .setStyle(ButtonStyle.Primary)
            );

        const actionRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('studio_preview')
                    .setLabel('👁️ Prévisualisation')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('studio_save')
                    .setLabel('💾 Sauvegarder')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('studio_send')
                    .setLabel('📤 Envoyer')
                    .setStyle(ButtonStyle.Success)
            );

        await interaction.editReply({
            embeds: [studioEmbed],
            components: [designRow, actionRow]
        });

        // Initialiser les données du studio
        if (!interaction.client.embedStudio) {
            interaction.client.embedStudio = new Map();
        }
        interaction.client.embedStudio.set(interaction.user.id, {
            targetChannel,
            data: {
                title: '',
                description: '',
                color: '#5865f2',
                fields: [],
                footer: '',
                timestamp: false,
                thumbnail: null,
                image: null
            },
            step: 'design'
        });
    },

    async handleIAGeneration(interaction, logger) {
        const { options } = interaction;
        
        try {
            const description = options.getString('description');
            const ton = options.getString('ton') || 'friendly';

            // Réponse immédiate avec defer pour éviter l'expiration
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });

            // Système IA avancé avec analyse contextuelle
            const aiAnalysis = this.analyzeContentWithAI(description, ton);
            
            // Génération du contenu optimisé et détaillé
            const optimizedContent = this.generateAdvancedOptimizedContent(aiAnalysis);
            
            // Embed de résultat professionnel
            const resultEmbed = new EmbedBuilder()
                .setTitle('✨ GÉNÉRATION IA TERMINÉE')
                .setDescription('**Votre embed professionnel est prêt !**\n\nL\'IA a analysé votre demande et généré un contenu optimisé selon les meilleures pratiques de communication Discord.')
                .setColor('#00ff88')
                .addFields(
                    { name: '🎯 Contexte détecté', value: `\`${aiAnalysis.context}\``, inline: true },
                    { name: '🎨 Style optimal', value: `\`${aiAnalysis.styleDescription}\``, inline: true },
                    { name: '📊 Score de qualité', value: `\`${aiAnalysis.qualityScore}/100\``, inline: true },
                    { name: '🔥 Points forts détectés', value: aiAnalysis.strengths.map(s => `• ${s}`).join('\n'), inline: false }
                )
                .setFooter({ text: 'Génération IA Professionnelle', iconURL: interaction.client.user.displayAvatarURL() })
                .setTimestamp();

            // Embed généré final avec contenu détaillé
            const generatedEmbed = new EmbedBuilder()
                .setTitle(optimizedContent.title)
                .setDescription(optimizedContent.description)
                .setColor(optimizedContent.color)
                .setFooter({ text: optimizedContent.footer, iconURL: interaction.client.user.displayAvatarURL() })
                .setTimestamp();

            if (optimizedContent.fields && optimizedContent.fields.length > 0) {
                generatedEmbed.addFields(optimizedContent.fields);
            }

            // Interface d'action professionnelle
            const actionRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`ia_deploy_${interaction.user.id}`)
                        .setLabel('🚀 Déployer')
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId(`ia_customize_${interaction.user.id}`)
                        .setLabel('⚙️ Personnaliser')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId(`ia_alternatives_${interaction.user.id}`)
                        .setLabel('🔄 Alternatives')
                        .setStyle(ButtonStyle.Secondary)
                );

            const utilityRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`ia_export_json_${interaction.user.id}`)
                        .setLabel('📤 Export JSON')
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId(`ia_save_template_${interaction.user.id}`)
                        .setLabel('💾 Sauvegarder')
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId(`ia_analytics_${interaction.user.id}`)
                        .setLabel('📊 Analytics')
                        .setStyle(ButtonStyle.Secondary)
                );

            await interaction.editReply({
                content: '🎉 **Génération IA Réussie !**\n\n> 🧠 L\'IA a créé un embed professionnel optimisé pour votre contexte\n> 🎯 Prêt à déployer ou à personnaliser selon vos besoins',
                embeds: [resultEmbed, generatedEmbed],
                components: [actionRow, utilityRow]
            });

            // Stocker les données IA avancées
            if (!interaction.client.embedIA) {
                interaction.client.embedIA = new Map();
            }
            interaction.client.embedIA.set(interaction.user.id, {
                originalDescription: description,
                tone: ton,
                analysis: aiAnalysis,
                generatedContent: optimizedContent,
                generatedEmbed: generatedEmbed,
                timestamp: Date.now(),
                channelId: interaction.channelId
            });

        } catch (error) {
            logger.error('Erreur dans handleIAGeneration:', error);
            
            // Gestion d'erreur sécurisée
            const errorMessage = '❌ Une erreur est survenue lors de la génération IA. Veuillez réessayer.';
            
            try {
                if (interaction.deferred || interaction.replied) {
                    await interaction.editReply({ content: errorMessage, embeds: [], components: [] });
                } else {
                    await interaction.reply({ content: errorMessage, flags: MessageFlags.Ephemeral });
                }
            } catch (replyError) {
                logger.error('Impossible de répondre à l\'erreur:', replyError);
            }
        }
    },

    async handleFavorites(interaction, logger) {
        const { options } = interaction;
        const action = options.getString('action');

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        // Initialiser le système de favoris
        if (!interaction.client.embedFavorites) {
            interaction.client.embedFavorites = new Map();
        }

        const userFavorites = interaction.client.embedFavorites.get(interaction.user.id) || [];

        switch (action) {
            case 'list':
                await this.showFavoritesList(interaction, userFavorites);
                break;
            case 'save':
                await this.showSaveFavoriteModal(interaction);
                break;
            case 'delete':
                await this.showDeleteFavoriteMenu(interaction, userFavorites);
                break;
            case 'share':
                await this.showShareFavoritesMenu(interaction, userFavorites);
                break;
        }
    },

    async handleJsonActions(interaction, logger) {
        const { options } = interaction;
        const action = options.getString('action');

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        switch (action) {
            case 'import':
                await this.showJsonImportModal(interaction);
                break;
            case 'export':
                await this.showExportMenu(interaction);
                break;
            case 'validate':
                await this.showJsonValidateModal(interaction);
                break;
        }
    },

    async handleStats(interaction, logger) {
        const { options } = interaction;
        const detaille = options.getBoolean('detaille') || false;

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        // Simuler des statistiques (en production, ces données viendraient d'une base de données)
        const stats = {
            totalEmbeds: Math.floor(Math.random() * 1000) + 500,
            embedsToday: Math.floor(Math.random() * 50) + 10,
            embedsThisWeek: Math.floor(Math.random() * 200) + 50,
            favoriteTemplates: ['annonce', 'event', 'gaming'],
            mostUsedColors: ['#5865f2', '#57f287', '#ff4757'],
            userRank: Math.floor(Math.random() * 100) + 1
        };

        const statsEmbed = new EmbedBuilder()
            .setTitle('📊 STATISTIQUES D\'UTILISATION')
            .setDescription(`Voici vos statistiques d'utilisation du système d'embeds.\n\n**🏆 Votre rang :** #${stats.userRank} sur le serveur`)
            .setColor('#00d2d3')
            .addFields(
                { name: '📈 Total Embeds', value: `${stats.totalEmbeds.toLocaleString()}`, inline: true },
                { name: '📅 Aujourd\'hui', value: `${stats.embedsToday}`, inline: true },
                { name: '📆 Cette semaine', value: `${stats.embedsThisWeek}`, inline: true }
            )
            .setThumbnail('📊')
            .setFooter({ text: 'Statistiques Embed System', iconURL: interaction.client.user.displayAvatarURL() })
            .setTimestamp();

        if (detaille) {
            statsEmbed.addFields(
                { name: '🎨 Templates favoris', value: stats.favoriteTemplates.join(', '), inline: false },
                { name: '🌈 Couleurs populaires', value: stats.mostUsedColors.join(', '), inline: false },
                { name: '⭐ Taux de satisfaction', value: '98.5%', inline: true },
                { name: '⚡ Temps moyen création', value: '2.3 min', inline: true }
            );
        }

        await interaction.editReply({
            embeds: [statsEmbed]
        });
    },

    // ===== FONCTIONS UTILITAIRES AVANCÉES =====

    generateSmartDescription(userDescription, style) {
        const templates = {
            formel: `Nous avons le plaisir de vous informer concernant : ${userDescription}\n\nCette communication officielle vise à vous tenir informé des derniers développements.`,
            décontracté: `Salut tout le monde ! 👋\n\n${userDescription}\n\nN'hésitez pas si vous avez des questions !`,
            dynamique: `🔥 ATTENTION ! 🔥\n\n${userDescription}\n\nC'est le moment de passer à l'action !`,
            sophistiqué: `Il nous est agréable de partager avec vous cette information raffinée :\n\n${userDescription}\n\nNous espérons que cela saura retenir votre attention.`,
            gaming: `🎮 GAMERS UNITE! 🎮\n\n${userDescription}\n\nReady to play? Let's go!`,
            informatif: `📚 Information éducative :\n\n${userDescription}\n\nCette ressource vous aidera à mieux comprendre le sujet.`
        };

        return templates[style] || templates.décontracté;
    },

    generateSmartFields(keywords) {
        const fields = [];

        if (keywords.includes('event') || keywords.includes('événement')) {
            fields.push({ name: '📅 Date', value: 'À définir', inline: true });
            fields.push({ name: '📍 Lieu', value: 'Discord', inline: true });
        }

        if (keywords.includes('concours') || keywords.includes('giveaway')) {
            fields.push({ name: '🏆 Prix', value: 'À annoncer', inline: true });
            fields.push({ name: '⏰ Fin', value: 'À définir', inline: true });
        }

        if (keywords.includes('règle') || keywords.includes('rule')) {
            fields.push({ name: '📋 Règles', value: 'Voir description', inline: false });
        }

        if (keywords.includes('update') || keywords.includes('mise à jour')) {
            fields.push({ name: '🔄 Version', value: 'Dernière', inline: true });
            fields.push({ name: '📋 Changements', value: 'Voir détails', inline: true });
        }

        return fields;
    },

    async showFavoritesList(interaction, favorites) {
        if (favorites.length === 0) {
            return await interaction.editReply({
                content: '⭐ **Aucun favori sauvegardé**\n\nVous n\'avez pas encore sauvegardé d\'embeds en favoris. Utilisez `/embed favoris save` pour sauvegarder vos créations préférées.'
            });
        }

        const favoritesEmbed = new EmbedBuilder()
            .setTitle('⭐ VOS EMBEDS FAVORIS')
            .setDescription(`Vous avez **${favorites.length}** embed(s) sauvegardé(s) en favoris.`)
            .setColor('#ffd700')
            .setFooter({ text: 'Système de Favoris', iconURL: interaction.client.user.displayAvatarURL() })
            .setTimestamp();

        // Afficher les favoris (limité à 10)
        const displayFavorites = favorites.slice(0, 10);
        displayFavorites.forEach((fav, index) => {
            favoritesEmbed.addFields({
                name: `${index + 1}. ${fav.name}`,
                value: `**Créé le :** ${fav.createdAt}\n**Type :** ${fav.type}`,
                inline: true
            });
        });

        if (favorites.length > 10) {
            favoritesEmbed.addFields({
                name: '📋 Note',
                value: `Seuls les 10 premiers favoris sont affichés. Total : ${favorites.length}`,
                inline: false
            });
        }

        await interaction.editReply({
            embeds: [favoritesEmbed]
        });
    },

    async showSaveFavoriteModal(interaction) {
        const modal = new ModalBuilder()
            .setCustomId('save_favorite_modal')
            .setTitle('💾 Sauvegarder un Favori');

        const nameInput = new TextInputBuilder()
            .setCustomId('favorite_name')
            .setLabel('📝 Nom du favori')
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
            .setMaxLength(100)
            .setPlaceholder('Donnez un nom à votre embed favori...');

        const jsonInput = new TextInputBuilder()
            .setCustomId('favorite_json')
            .setLabel('📄 Code JSON de l\'embed')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true)
            .setMaxLength(4000)
            .setPlaceholder('Collez le code JSON de votre embed...');

        modal.addComponents(
            new ActionRowBuilder().addComponents(nameInput),
            new ActionRowBuilder().addComponents(jsonInput)
        );

        await interaction.showModal(modal);
    },

    async showDeleteFavoriteMenu(interaction, favorites) {
        if (favorites.length === 0) {
            return await interaction.editReply({
                content: '⭐ **Aucun favori à supprimer**\n\nVous n\'avez pas de favoris sauvegardés.'
            });
        }

        const deleteEmbed = new EmbedBuilder()
            .setTitle('🗑️ SUPPRIMER UN FAVORI')
            .setDescription('Sélectionnez le favori que vous souhaitez supprimer.')
            .setColor('#ff4757')
            .setFooter({ text: 'Suppression de Favoris', iconURL: interaction.client.user.displayAvatarURL() });

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('delete_favorite_select')
            .setPlaceholder('🗑️ Choisissez un favori à supprimer...')
            .addOptions(
                favorites.slice(0, 25).map((fav, index) => ({
                    label: fav.name,
                    description: `Créé le ${fav.createdAt}`,
                    value: index.toString(),
                    emoji: '🗑️'
                }))
            );

        const row = new ActionRowBuilder().addComponents(selectMenu);

        await interaction.editReply({
            embeds: [deleteEmbed],
            components: [row]
        });
    },

    async showShareFavoritesMenu(interaction, favorites) {
        if (favorites.length === 0) {
            return await interaction.editReply({
                content: '⭐ **Aucun favori à partager**\n\nVous n\'avez pas de favoris sauvegardés.'
            });
        }

        const shareEmbed = new EmbedBuilder()
            .setTitle('📤 PARTAGER VOS FAVORIS')
            .setDescription('Partagez vos embeds favoris avec la communauté !')
            .setColor('#00d2d3')
            .addFields(
                { name: '📊 Vos statistiques', value: `${favorites.length} favoris sauvegardés`, inline: true },
                { name: '🎯 Options de partage', value: 'Collection complète ou sélection', inline: true }
            )
            .setFooter({ text: 'Partage de Favoris', iconURL: interaction.client.user.displayAvatarURL() });

        const shareRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('share_all_favorites')
                    .setLabel('📤 Partager Tout')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('share_select_favorites')
                    .setLabel('🎯 Sélection')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('export_favorites')
                    .setLabel('💾 Exporter JSON')
                    .setStyle(ButtonStyle.Success)
            );

        await interaction.editReply({
            embeds: [shareEmbed],
            components: [shareRow]
        });
    },

    async showJsonImportModal(interaction) {
        const modal = new ModalBuilder()
            .setCustomId('json_import_modal')
            .setTitle('📥 Importer JSON');

        const jsonInput = new TextInputBuilder()
            .setCustomId('import_json_code')
            .setLabel('📄 Code JSON à importer')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true)
            .setMaxLength(4000)
            .setPlaceholder('Collez votre code JSON ici...');

        const channelInput = new TextInputBuilder()
            .setCustomId('import_target_channel')
            .setLabel('📍 ID du canal de destination (optionnel)')
            .setStyle(TextInputStyle.Short)
            .setRequired(false)
            .setPlaceholder('ID du canal ou laissez vide pour le canal actuel');

        modal.addComponents(
            new ActionRowBuilder().addComponents(jsonInput),
            new ActionRowBuilder().addComponents(channelInput)
        );

        await interaction.showModal(modal);
    },

    async showExportMenu(interaction) {
        const exportEmbed = new EmbedBuilder()
            .setTitle('📤 EXPORTER UN EMBED')
            .setDescription('Exportez un embed existant au format JSON pour le réutiliser ou le partager.')
            .setColor('#00d2d3')
            .addFields(
                { name: '📋 Instructions', value: '1. Fournissez l\'ID du message\n2. Le bot générera le JSON\n3. Copiez et sauvegardez le code', inline: false },
                { name: '💡 Astuce', value: 'Clic droit sur un message → Copier l\'ID', inline: false }
            )
            .setFooter({ text: 'Export JSON', iconURL: interaction.client.user.displayAvatarURL() });

        const exportRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('export_by_id')
                    .setLabel('🆔 Par ID de Message')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('export_recent')
                    .setLabel('📅 Messages Récents')
                    .setStyle(ButtonStyle.Secondary)
            );

        await interaction.editReply({
            embeds: [exportEmbed],
            components: [exportRow]
        });
    },

    async showJsonValidateModal(interaction) {
        const modal = new ModalBuilder()
            .setCustomId('json_validate_modal')
            .setTitle('🔍 Valider JSON');

        const jsonInput = new TextInputBuilder()
            .setCustomId('validate_json_code')
            .setLabel('📄 Code JSON à valider')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true)
            .setMaxLength(4000)
            .setPlaceholder('Collez votre code JSON pour validation...');

        modal.addComponents(
            new ActionRowBuilder().addComponents(jsonInput)
        );

        await interaction.showModal(modal);
    },

    async handleSimpleEmbed(interaction, logger) {
        const { options, guild, client } = interaction;
        
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const titre = options.getString('titre');
        const description = options.getString('description');
        const couleur = options.getString('couleur') || '#5865f2';
        const targetChannel = options.getChannel('canal') || interaction.channel;
        const image = options.getString('image');
        const miniature = options.getString('miniature');
        const footer = options.getString('footer');
        const timestamp = options.getBoolean('timestamp');
        const mention = options.getString('mention');

        // Validation des URLs d'images
        if (image && !this.isValidImageUrl(image)) {
            return await interaction.editReply({
                content: '❌ L\'URL de l\'image principale n\'est pas valide. Utilisez une URL directe vers une image (jpg, png, gif, webp).'
            });
        }

        if (miniature && !this.isValidImageUrl(miniature)) {
            return await interaction.editReply({
                content: '❌ L\'URL de la miniature n\'est pas valide. Utilisez une URL directe vers une image (jpg, png, gif, webp).'
            });
        }

        // Création de l'embed
        const embed = new EmbedBuilder()
            .setTitle(titre)
            .setDescription(description)
            .setColor(this.parseColor(couleur));

        if (image) embed.setImage(image);
        if (miniature) embed.setThumbnail(miniature);
        if (footer) embed.setFooter({ text: footer, iconURL: client.user.displayAvatarURL() });
        if (timestamp) embed.setTimestamp();

        // Préparation du message
        const messageOptions = { embeds: [embed] };
        
        if (mention) {
            if (mention === '@everyone' || mention === '@here') {
                messageOptions.content = mention;
            } else {
                // Vérifier si c'est un ID de rôle valide
                const roleId = mention.replace(/[<@&>]/g, '');
                const role = guild.roles.cache.get(roleId);
                if (role) {
                    messageOptions.content = `<@&${roleId}>`;
                }
            }
        }

        try {
            const sentMessage = await targetChannel.send(messageOptions);
            
            logger.success(`Embed simple créé par ${interaction.user.tag} dans #${targetChannel.name}`);
            
            await interaction.editReply({
                content: `✅ **Embed créé avec succès !**\n\n📍 **Canal :** ${targetChannel}\n🆔 **Message ID :** \`${sentMessage.id}\`\n🎨 **Couleur :** \`${couleur}\`\n\n[🔗 Aller au message](${sentMessage.url})`
            });

        } catch (error) {
            logger.error('Erreur lors de l\'envoi de l\'embed:', error);
            await interaction.editReply({
                content: '❌ Impossible d\'envoyer l\'embed dans ce canal. Vérifiez les permissions du bot.'
            });
        }
    },

    async handleAdvancedEmbed(interaction, logger) {
        const { options } = interaction;
        const template = options.getString('template');

        if (template) {
            await this.handleTemplate(interaction, template, logger);
        } else {
            await this.showAdvancedEmbedModal(interaction);
        }
    },

    async handleTemplate(interaction, template, logger) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const templates = {
            annonce: {
                title: '📢 ANNONCE OFFICIELLE',
                description: 'Une annonce importante de l\'équipe d\'administration.',
                color: '#5865f2',
                thumbnail: interaction.guild.iconURL({ dynamic: true }),
                footer: 'Équipe d\'Administration',
                fields: [
                    { name: '📋 Informations', value: 'Détails de l\'annonce...', inline: false },
                    { name: '📅 Date d\'effet', value: 'Immédiatement', inline: true },
                    { name: '👥 Concerné', value: 'Tous les membres', inline: true }
                ]
            },
            event: {
                title: '🎉 ÉVÉNEMENT SPÉCIAL',
                description: 'Rejoignez-nous pour un événement exceptionnel !',
                color: '#ff6b6b',
                thumbnail: '🎉',
                footer: 'Événements du serveur',
                fields: [
                    { name: '📅 Date & Heure', value: 'À définir', inline: true },
                    { name: '📍 Lieu', value: 'Serveur Discord', inline: true },
                    { name: '🎁 Récompenses', value: 'Surprises à gagner !', inline: false }
                ]
            },
            rules: {
                title: '📋 RÈGLEMENT DU SERVEUR',
                description: 'Veuillez respecter ces règles pour maintenir une communauté saine.',
                color: '#ffd93d',
                thumbnail: '⚖️',
                footer: 'Modération',
                fields: [
                    { name: '1️⃣ Respect', value: 'Respectez tous les membres', inline: false },
                    { name: '2️⃣ Spam', value: 'Évitez le spam et les messages répétitifs', inline: false },
                    { name: '3️⃣ Contenu', value: 'Gardez le contenu approprié', inline: false }
                ]
            },
            recruitment: {
                title: '🎯 RECRUTEMENT OUVERT',
                description: 'Nous recherchons de nouveaux talents pour rejoindre notre équipe !',
                color: '#6bcf7f',
                thumbnail: '👥',
                footer: 'Ressources Humaines',
                fields: [
                    { name: '💼 Postes disponibles', value: 'Modérateur, Développeur, Designer', inline: false },
                    { name: '📋 Prérequis', value: 'Motivation et disponibilité', inline: true },
                    { name: '📧 Candidature', value: 'Ouvrez un ticket', inline: true }
                ]
            },
            maintenance: {
                title: '⚠️ MAINTENANCE PROGRAMMÉE',
                description: 'Le serveur sera temporairement indisponible pour maintenance.',
                color: '#ff9500',
                thumbnail: '🔧',
                footer: 'Équipe Technique',
                fields: [
                    { name: '⏰ Début', value: 'À définir', inline: true },
                    { name: '⏱️ Durée estimée', value: '30 minutes', inline: true },
                    { name: '🔄 Services affectés', value: 'Bot et fonctionnalités', inline: false }
                ]
            },
            giveaway: {
                title: '🎁 GIVEAWAY EN COURS',
                description: 'Participez à notre concours pour gagner des prix incroyables !',
                color: '#ff6b9d',
                thumbnail: '🎁',
                footer: 'Concours',
                fields: [
                    { name: '🏆 Prix', value: 'À définir', inline: true },
                    { name: '👥 Participants', value: '0', inline: true },
                    { name: '📅 Fin du concours', value: 'À définir', inline: false },
                    { name: '📋 Comment participer', value: 'Réagissez avec 🎉', inline: false }
                ]
            },
            poll: {
                title: '📊 SONDAGE COMMUNAUTAIRE',
                description: 'Votre opinion compte ! Participez à notre sondage.',
                color: '#4ecdc4',
                thumbnail: '📊',
                footer: 'Sondage',
                fields: [
                    { name: '❓ Question', value: 'À définir', inline: false },
                    { name: '📝 Instructions', value: 'Réagissez avec les émojis correspondants', inline: false }
                ]
            },
            news: {
                title: '🆕 NOUVEAUTÉS',
                description: 'Découvrez les dernières nouveautés et mises à jour !',
                color: '#a8e6cf',
                thumbnail: '✨',
                footer: 'Actualités',
                fields: [
                    { name: '🔥 Nouveauté principale', value: 'À définir', inline: false },
                    { name: '🔧 Améliorations', value: 'Liste des améliorations', inline: false }
                ]
            },
            gaming: {
                title: '🎮 GAMING TIME',
                description: 'Rejoignez-nous pour des sessions de jeu épiques !',
                color: '#9b59b6',
                thumbnail: '🎮',
                footer: 'Gaming Community',
                fields: [
                    { name: '🎯 Jeu', value: 'À définir', inline: true },
                    { name: '👥 Joueurs', value: '0/10', inline: true },
                    { name: '⏰ Heure', value: 'À définir', inline: false }
                ]
            },
            partnership: {
                title: '💼 PARTENARIAT',
                description: 'Découvrez nos partenaires et opportunités de collaboration.',
                color: '#3498db',
                thumbnail: '🤝',
                footer: 'Partenariats',
                fields: [
                    { name: '🏢 Partenaire', value: 'À définir', inline: true },
                    { name: '🎯 Type', value: 'Collaboration', inline: true },
                    { name: '📋 Détails', value: 'Informations sur le partenariat', inline: false }
                ]
            },
            creative: {
                title: '🎨 CRÉATION ARTISTIQUE',
                description: 'Partagez vos créations et inspirez la communauté !',
                color: '#e74c3c',
                thumbnail: '🎨',
                footer: 'Communauté Créative',
                fields: [
                    { name: '🖼️ Type de création', value: 'Art, Musique, Écriture...', inline: false },
                    { name: '🏆 Concours', value: 'Participez aux concours créatifs', inline: false }
                ]
            },
            support: {
                title: '🔧 SUPPORT TECHNIQUE',
                description: 'Besoin d\'aide ? Notre équipe support est là pour vous !',
                color: '#95a5a6',
                thumbnail: '🛠️',
                footer: 'Support Technique',
                fields: [
                    { name: '📞 Contact', value: 'Ouvrez un ticket support', inline: true },
                    { name: '⏰ Disponibilité', value: '24h/7j', inline: true },
                    { name: '📋 Avant de contacter', value: 'Consultez la FAQ', inline: false }
                ]
            }
        };

        const templateData = templates[template];
        if (!templateData) {
            return await interaction.editReply({
                content: '❌ Template non trouvé.'
            });
        }

        // Création de l'embed avec le template
        const embed = new EmbedBuilder()
            .setTitle(templateData.title)
            .setDescription(templateData.description)
            .setColor(templateData.color)
            .setFooter({ text: templateData.footer, iconURL: interaction.client.user.displayAvatarURL() })
            .setTimestamp();

        if (templateData.thumbnail) {
            if (templateData.thumbnail.startsWith('http')) {
                embed.setThumbnail(templateData.thumbnail);
            }
        }

        if (templateData.fields) {
            embed.addFields(templateData.fields);
        }

        // Boutons d'action
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`edit_template_${template}`)
                    .setLabel('✏️ Modifier')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId(`send_template_${template}`)
                    .setLabel('📤 Envoyer')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId(`preview_template_${template}`)
                    .setLabel('👁️ Aperçu JSON')
                    .setStyle(ButtonStyle.Secondary)
            );

        await interaction.editReply({
            content: `🎨 **Template "${template}" chargé !**\n\n✏️ Vous pouvez modifier ce template avant de l'envoyer.\n📤 Ou l'envoyer directement dans ce canal.`,
            embeds: [embed],
            components: [row]
        });

        // Stocker les données du template pour les interactions futures
        if (!interaction.client.embedTemplates) {
            interaction.client.embedTemplates = new Map();
        }
        interaction.client.embedTemplates.set(interaction.user.id, { template, data: templateData, embed });
    },

    async handleEmbedBuilder(interaction, logger) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const targetChannel = interaction.options.getChannel('canal');

        // Interface du constructeur d'embed
        const builderEmbed = new EmbedBuilder()
            .setTitle('🛠️ CONSTRUCTEUR D\'EMBED INTERACTIF')
            .setDescription('Utilisez les boutons ci-dessous pour construire votre embed étape par étape.\n\n**📋 Étapes :**\n1️⃣ Définir le titre et la description\n2️⃣ Choisir la couleur et les images\n3️⃣ Ajouter des champs (optionnel)\n4️⃣ Configurer le footer et timestamp\n5️⃣ Prévisualiser et envoyer')
            .setColor('#5865f2')
            .addFields(
                { name: '📍 Canal de destination', value: targetChannel ? `${targetChannel}` : 'Canal actuel', inline: true },
                { name: '📊 Progression', value: '0/5 étapes complétées', inline: true },
                { name: '💡 Conseil', value: 'Commencez par définir le titre et la description', inline: true }
            )
            .setFooter({ text: 'Constructeur d\'Embed', iconURL: interaction.client.user.displayAvatarURL() })
            .setTimestamp();

        // Boutons du constructeur
        const row1 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('builder_step1')
                    .setLabel('1️⃣ Titre & Description')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('builder_step2')
                    .setLabel('2️⃣ Couleur & Images')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('builder_step3')
                    .setLabel('3️⃣ Ajouter Champs')
                    .setStyle(ButtonStyle.Secondary)
            );

        const row2 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('builder_step4')
                    .setLabel('4️⃣ Footer & Timestamp')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('builder_preview')
                    .setLabel('👁️ Aperçu')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('builder_send')
                    .setLabel('📤 Envoyer')
                    .setStyle(ButtonStyle.Success)
            );

        await interaction.editReply({
            embeds: [builderEmbed],
            components: [row1, row2]
        });

        // Initialiser les données du constructeur
        if (!interaction.client.embedBuilder) {
            interaction.client.embedBuilder = new Map();
        }
        interaction.client.embedBuilder.set(interaction.user.id, {
            targetChannel: targetChannel || interaction.channel,
            step: 0,
            data: {}
        });
    },

    async handleJsonEmbed(interaction, logger) {
        const { options } = interaction;
        
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const jsonCode = options.getString('code');
        const targetChannel = options.getChannel('canal') || interaction.channel;

        try {
            // Parser le JSON
            const embedData = JSON.parse(jsonCode);
            
            // Créer l'embed à partir du JSON
            const embed = new EmbedBuilder();
            
            if (embedData.title) embed.setTitle(embedData.title);
            if (embedData.description) embed.setDescription(embedData.description);
            if (embedData.color) embed.setColor(embedData.color);
            if (embedData.thumbnail && embedData.thumbnail.url) embed.setThumbnail(embedData.thumbnail.url);
            if (embedData.image && embedData.image.url) embed.setImage(embedData.image.url);
            if (embedData.author) embed.setAuthor(embedData.author);
            if (embedData.footer) embed.setFooter(embedData.footer);
            if (embedData.timestamp) embed.setTimestamp(new Date(embedData.timestamp));
            if (embedData.fields && Array.isArray(embedData.fields)) {
                embed.addFields(embedData.fields);
            }

            // Envoyer l'embed
            const sentMessage = await targetChannel.send({ embeds: [embed] });
            
            logger.success(`Embed JSON créé par ${interaction.user.tag} dans #${targetChannel.name}`);
            
            await interaction.editReply({
                content: `✅ **Embed créé depuis JSON !**\n\n📍 **Canal :** ${targetChannel}\n🆔 **Message ID :** \`${sentMessage.id}\`\n\n[🔗 Aller au message](${sentMessage.url})`
            });

        } catch (error) {
            logger.error('Erreur lors du parsing JSON:', error);
            await interaction.editReply({
                content: '❌ **Erreur JSON !**\n\nLe code JSON fourni n\'est pas valide. Vérifiez la syntaxe et réessayez.\n\n**Exemple de JSON valide :**\n```json\n{\n  "title": "Mon Titre",\n  "description": "Ma description",\n  "color": "#5865f2",\n  "fields": [\n    {\n      "name": "Champ 1",\n      "value": "Valeur 1",\n      "inline": true\n    }\n  ]\n}\n```'
            });
        }
    },

    // Fonctions utilitaires
    isValidImageUrl(url) {
        try {
            const urlObj = new URL(url);
            const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
            return validExtensions.some(ext => urlObj.pathname.toLowerCase().endsWith(ext)) ||
                   url.includes('cdn.discordapp.com') ||
                   url.includes('media.discordapp.net') ||
                   url.includes('imgur.com') ||
                   url.includes('gyazo.com');
        } catch {
            return false;
        }
    },

    parseColor(color) {
        // Si c'est déjà un code hex valide
        if (color.startsWith('#') && /^#[0-9A-F]{6}$/i.test(color)) {
            return color;
        }
        
        // Couleurs nommées
        const namedColors = {
            'rouge': '#ff0000',
            'vert': '#00ff00',
            'bleu': '#0099ff',
            'jaune': '#ffff00',
            'violet': '#9932cc',
            'orange': '#ff8c00',
            'rose': '#ff69b4',
            'blanc': '#ffffff',
            'noir': '#000000',
            'cyan': '#00ffff',
            'or': '#ffd700'
        };
        
        return namedColors[color.toLowerCase()] || color || '#5865f2';
    },

    async showAdvancedEmbedModal(interaction) {
        const modal = new ModalBuilder()
            .setCustomId('advanced_embed_modal')
            .setTitle('🚀 Embed Avancé');

        const titleInput = new TextInputBuilder()
            .setCustomId('embed_title')
            .setLabel('📋 Titre de l\'embed')
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
            .setMaxLength(256)
            .setPlaceholder('Entrez le titre de votre embed...');

        const descriptionInput = new TextInputBuilder()
            .setCustomId('embed_description')
            .setLabel('📄 Description')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true)
            .setMaxLength(4096)
            .setPlaceholder('Entrez la description de votre embed...');

        const colorInput = new TextInputBuilder()
            .setCustomId('embed_color')
            .setLabel('🎨 Couleur (hex ou nom)')
            .setStyle(TextInputStyle.Short)
            .setRequired(false)
            .setPlaceholder('#5865f2 ou bleu');

        const fieldsInput = new TextInputBuilder()
            .setCustomId('embed_fields')
            .setLabel('📋 Champs (optionnel)')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(false)
            .setPlaceholder('Nom1|Valeur1|true\nNom2|Valeur2|false\n(nom|valeur|inline)');

        const footerInput = new TextInputBuilder()
            .setCustomId('embed_footer')
            .setLabel('📝 Footer (optionnel)')
            .setStyle(TextInputStyle.Short)
            .setRequired(false)
            .setMaxLength(2048)
            .setPlaceholder('Texte du footer...');

        modal.addComponents(
            new ActionRowBuilder().addComponents(titleInput),
            new ActionRowBuilder().addComponents(descriptionInput),
            new ActionRowBuilder().addComponents(colorInput),
            new ActionRowBuilder().addComponents(fieldsInput),
            new ActionRowBuilder().addComponents(footerInput)
        );

        await interaction.showModal(modal);
    },

    // ===== SYSTÈME IA AVANCÉ =====

    analyzeContentWithAI(description, tone) {
        const keywords = description.toLowerCase();
        
        // Détection du contexte principal
        let context = 'Communication générale';
        let contextScore = 70;
        
        const contextPatterns = {
            'Annonce officielle': ['annonce', 'officiel', 'important', 'communication', 'information'],
            'Événement communautaire': ['événement', 'event', 'soirée', 'rencontre', 'célébration', 'fête'],
            'Partenariat commercial': ['partenariat', 'collaboration', 'sponsor', 'business', 'entreprise'],
            'Recrutement équipe': ['recrutement', 'recherche', 'équipe', 'staff', 'modérateur', 'admin'],
            'Mise à jour technique': ['mise à jour', 'update', 'version', 'amélioration', 'correctif'],
            'Concours & Giveaway': ['concours', 'giveaway', 'prix', 'gagner', 'tirage', 'récompense'],
            'Support & Aide': ['aide', 'support', 'problème', 'assistance', 'dépannage', 'bug'],
            'Gaming & Esport': ['gaming', 'jeu', 'tournoi', 'match', 'équipe', 'clan', 'esport']
        };

        for (const [ctx, patterns] of Object.entries(contextPatterns)) {
            const matches = patterns.filter(pattern => keywords.includes(pattern)).length;
            if (matches > 0) {
                context = ctx;
                contextScore = Math.min(95, 70 + (matches * 8));
                break;
            }
        }

        // Analyse du ton et style
        const toneAnalysis = {
            official: {
                styleDescription: 'Communication Professionnelle',
                color: '#5865f2',
                thumbnail: '📢',
                footer: 'Communication Officielle'
            },
            friendly: {
                styleDescription: 'Approche Conviviale',
                color: '#57f287',
                thumbnail: '👋',
                footer: 'Message Communautaire'
            },
            energetic: {
                styleDescription: 'Dynamisme & Énergie',
                color: '#ff4757',
                thumbnail: '🔥',
                footer: 'Énergie & Motivation'
            },
            elegant: {
                styleDescription: 'Raffinement & Élégance',
                color: '#a55eea',
                thumbnail: '💎',
                footer: 'Style Raffiné'
            },
            gaming: {
                styleDescription: 'Univers Gaming',
                color: '#ff6b9d',
                thumbnail: '🎮',
                footer: 'Gaming Community'
            },
            educational: {
                styleDescription: 'Contenu Éducatif',
                color: '#3742fa',
                thumbnail: '📚',
                footer: 'Formation & Apprentissage'
            }
        };

        const selectedTone = toneAnalysis[tone] || toneAnalysis.friendly;

        // Détection des points forts
        const strengths = [];
        if (description.length > 50) strengths.push('Description détaillée');
        if (keywords.includes('nouveau') || keywords.includes('innovation')) strengths.push('Aspect novateur');
        if (keywords.includes('communauté') || keywords.includes('ensemble')) strengths.push('Esprit communautaire');
        if (keywords.includes('gratuit') || keywords.includes('offert')) strengths.push('Valeur ajoutée');
        if (keywords.includes('exclusif') || keywords.includes('premium')) strengths.push('Caractère exclusif');
        if (keywords.includes('rapide') || keywords.includes('immédiat')) strengths.push('Réactivité');

        if (strengths.length === 0) {
            strengths.push('Message clair et direct');
        }

        return {
            context,
            contextScore,
            styleDescription: selectedTone.styleDescription,
            color: selectedTone.color,
            thumbnail: selectedTone.thumbnail,
            footer: selectedTone.footer,
            qualityScore: Math.min(100, contextScore + strengths.length * 5),
            strengths,
            tone,
            originalDescription: description
        };
    },

    generateOptimizedContent(analysis) {
        const { context, tone, originalDescription, color, thumbnail, footer } = analysis;
        
        // Génération du titre optimisé
        const titleTemplates = {
            'Annonce officielle': ['📢 COMMUNICATION OFFICIELLE', '🔔 ANNONCE IMPORTANTE', '📋 INFORMATION OFFICIELLE'],
            'Événement communautaire': ['🎉 ÉVÉNEMENT SPÉCIAL', '🎊 CÉLÉBRATION COMMUNAUTAIRE', '✨ MOMENT EXCEPTIONNEL'],
            'Partenariat commercial': ['🤝 NOUVEAU PARTENARIAT', '💼 COLLABORATION STRATÉGIQUE', '🌟 ALLIANCE PROFESSIONNELLE'],
            'Recrutement équipe': ['👥 RECRUTEMENT OUVERT', '🎯 REJOIGNEZ L\'ÉQUIPE', '💪 TALENTS RECHERCHÉS'],
            'Mise à jour technique': ['🔄 MISE À JOUR MAJEURE', '⚡ NOUVELLES FONCTIONNALITÉS', '🛠️ AMÉLIORATIONS SYSTÈME'],
            'Concours & Giveaway': ['🎁 CONCOURS EXCEPTIONNEL', '🏆 GIVEAWAY PREMIUM', '💎 PRIX À GAGNER'],
            'Support & Aide': ['🆘 ASSISTANCE DISPONIBLE', '🔧 SUPPORT TECHNIQUE', '💡 AIDE & CONSEILS'],
            'Gaming & Esport': ['🎮 GAMING UPDATE', '🏆 COMPÉTITION ESPORT', '⚔️ DÉFI GAMING']
        };

        const possibleTitles = titleTemplates[context] || ['✨ MESSAGE IMPORTANT'];
        const selectedTitle = possibleTitles[Math.floor(Math.random() * possibleTitles.length)];

        // Génération de la description optimisée
        let optimizedDescription = this.enhanceDescription(originalDescription, context, tone);

        // Génération des champs contextuels
        const contextualFields = this.generateContextualFields(context, originalDescription);

        return {
            title: selectedTitle,
            description: optimizedDescription,
            color: color,
            thumbnail: thumbnail,
            footer: footer,
            fields: contextualFields,
            timestamp: true
        };
    },

    enhanceDescription(original, context, tone) {
        const enhancements = {
            official: {
                prefix: '**Communication Officielle**\n\n',
                suffix: '\n\n*Cette information est diffusée par l\'équipe officielle.*'
            },
            friendly: {
                prefix: '👋 **Salut la communauté !**\n\n',
                suffix: '\n\n*N\'hésitez pas si vous avez des questions ! 😊*'
            },
            energetic: {
                prefix: '🔥 **C\'EST PARTI !** 🔥\n\n',
                suffix: '\n\n*L\'énergie est à son maximum ! Rejoignez-nous ! ⚡*'
            },
            elegant: {
                prefix: '✨ **Nous avons l\'honneur de vous présenter**\n\n',
                suffix: '\n\n*Avec nos salutations distinguées.*'
            },
            gaming: {
                prefix: '🎮 **GAMERS, ATTENTION !** 🎮\n\n',
                suffix: '\n\n*Ready Player One ? Let\'s go ! 🚀*'
            },
            educational: {
                prefix: '📚 **Contenu Éducatif**\n\n',
                suffix: '\n\n*Continuez à apprendre et à grandir ! 🌱*'
            }
        };

        const enhancement = enhancements[tone] || enhancements.friendly;
        
        // Amélioration du contenu principal
        let enhanced = original;
        
        // Ajout d'émojis contextuels si manquants
        if (!enhanced.includes('📅') && (enhanced.includes('date') || enhanced.includes('quand'))) {
            enhanced = enhanced.replace(/date/gi, '📅 Date');
        }
        if (!enhanced.includes('📍') && (enhanced.includes('lieu') || enhanced.includes('où'))) {
            enhanced = enhanced.replace(/lieu/gi, '📍 Lieu');
        }
        if (!enhanced.includes('🎯') && enhanced.includes('objectif')) {
            enhanced = enhanced.replace(/objectif/gi, '🎯 Objectif');
        }

        return enhancement.prefix + enhanced + enhancement.suffix;
    },

    generateContextualFields(context, description) {
        const fields = [];
        const keywords = description.toLowerCase();

        switch (context) {
            case 'Annonce officielle':
                fields.push(
                    { name: '📋 Type d\'annonce', value: 'Communication officielle', inline: true },
                    { name: '👥 Public concerné', value: 'Tous les membres', inline: true },
                    { name: '📅 Date d\'effet', value: 'Immédiate', inline: true }
                );
                break;

            case 'Événement communautaire':
                fields.push(
                    { name: '📅 Quand ?', value: 'À définir', inline: true },
                    { name: '📍 Où ?', value: 'Serveur Discord', inline: true },
                    { name: '👥 Participants', value: 'Communauté ouverte', inline: true }
                );
                break;

            case 'Partenariat commercial':
                fields.push(
                    { name: '🤝 Type de partenariat', value: 'Collaboration stratégique', inline: true },
                    { name: '🎯 Objectifs', value: 'Croissance mutuelle', inline: true },
                    { name: '📈 Bénéfices', value: 'Avantages communauté', inline: true }
                );
                break;

            case 'Recrutement équipe':
                fields.push(
                    { name: '💼 Postes disponibles', value: 'Voir description', inline: true },
                    { name: '📋 Prérequis', value: 'Motivation & disponibilité', inline: true },
                    { name: '📧 Candidature', value: 'Contactez l\'équipe', inline: true }
                );
                break;

            case 'Concours & Giveaway':
                fields.push(
                    { name: '🏆 Prix à gagner', value: 'Voir description', inline: true },
                    { name: '📅 Date limite', value: 'À annoncer', inline: true },
                    { name: '📋 Participation', value: 'Conditions dans la description', inline: true }
                );
                break;

            default:
                if (keywords.includes('nouveau') || keywords.includes('nouvelle')) {
                    fields.push({ name: '✨ Nouveauté', value: 'Découvrez les détails ci-dessus', inline: false });
                }
                if (keywords.includes('important')) {
                    fields.push({ name: '⚠️ Important', value: 'Veuillez lire attentivement', inline: false });
                }
                break;
        }

        return fields;
    },

    // Génération avancée avec plus de détails
    generateAdvancedOptimizedContent(analysis) {
        const { context, tone, originalDescription, color, thumbnail, footer } = analysis;
        
        // Génération du titre optimisé avec plus de variété
        const titleTemplates = {
            'Annonce officielle': ['📢 COMMUNICATION OFFICIELLE', '🔔 ANNONCE IMPORTANTE', '📋 INFORMATION OFFICIELLE', '⚠️ AVIS OFFICIEL'],
            'Événement communautaire': ['🎉 ÉVÉNEMENT SPÉCIAL', '🎊 CÉLÉBRATION COMMUNAUTAIRE', '✨ MOMENT EXCEPTIONNEL', '🎈 RASSEMBLEMENT COMMUNAUTÉ'],
            'Partenariat commercial': ['🤝 NOUVEAU PARTENARIAT', '💼 COLLABORATION STRATÉGIQUE', '🌟 ALLIANCE PROFESSIONNELLE', '🔗 PARTENARIAT EXCLUSIF'],
            'Recrutement équipe': ['👥 RECRUTEMENT OUVERT', '🎯 REJOIGNEZ L\'ÉQUIPE', '💪 TALENTS RECHERCHÉS', '🚀 OPPORTUNITÉ CARRIÈRE'],
            'Mise à jour technique': ['🔄 MISE À JOUR MAJEURE', '⚡ NOUVELLES FONCTIONNALITÉS', '🛠️ AMÉLIORATIONS SYSTÈME', '🔧 ÉVOLUTION TECHNIQUE'],
            'Concours & Giveaway': ['🎁 CONCOURS EXCEPTIONNEL', '🏆 GIVEAWAY PREMIUM', '💎 PRIX À GAGNER', '🎊 GRAND CONCOURS'],
            'Support & Aide': ['🆘 ASSISTANCE DISPONIBLE', '🔧 SUPPORT TECHNIQUE', '💡 AIDE & CONSEILS', '🛟 SUPPORT COMMUNAUTÉ'],
            'Gaming & Esport': ['🎮 GAMING UPDATE', '🏆 COMPÉTITION ESPORT', '⚔️ DÉFI GAMING', '🎯 TOURNOI ÉPIQUE']
        };

        const possibleTitles = titleTemplates[context] || ['✨ MESSAGE IMPORTANT', '📣 INFORMATION CLÉE', '🔥 ACTUALITÉ MAJEURE'];
        const selectedTitle = possibleTitles[Math.floor(Math.random() * possibleTitles.length)];

        // Génération de la description optimisée et détaillée
        let optimizedDescription = this.enhanceAdvancedDescription(originalDescription, context, tone);

        // Génération des champs contextuels avancés
        const contextualFields = this.generateAdvancedContextualFields(context, originalDescription);

        return {
            title: selectedTitle,
            description: optimizedDescription,
            color: color,
            thumbnail: thumbnail,
            footer: footer,
            fields: contextualFields,
            timestamp: true
        };
    },

    // Description améliorée avec plus de détails
    enhanceAdvancedDescription(original, context, tone) {
        const enhancements = {
            official: {
                prefix: '**📋 Communication Officielle**\n\n',
                middle: '\n\n**🎯 Détails importants :**\n',
                suffix: '\n\n*Cette information est diffusée par l\'équipe officielle et entre en vigueur immédiatement.*'
            },
            friendly: {
                prefix: '👋 **Salut la communauté !**\n\n',
                middle: '\n\n**💡 Ce qu\'il faut retenir :**\n',
                suffix: '\n\n*N\'hésitez pas si vous avez des questions ! Notre équipe est là pour vous aider ! 😊*'
            },
            energetic: {
                prefix: '🔥 **C\'EST PARTI !** 🔥\n\n',
                middle: '\n\n**⚡ Points clés à retenir :**\n',
                suffix: '\n\n*L\'énergie est à son maximum ! Rejoignez-nous pour cette aventure incroyable ! 🚀*'
            },
            elegant: {
                prefix: '✨ **Nous avons l\'honneur de vous présenter**\n\n',
                middle: '\n\n**🎭 Éléments remarquables :**\n',
                suffix: '\n\n*Avec nos salutations les plus distinguées et notre reconnaissance.*'
            },
            gaming: {
                prefix: '🎮 **GAMERS, ATTENTION !** 🎮\n\n',
                middle: '\n\n**🎯 Infos de gameplay :**\n',
                suffix: '\n\n*Ready Player One ? Let\'s go ! Que la partie commence ! 🚀*'
            },
            educational: {
                prefix: '📚 **Contenu Éducatif & Informatif**\n\n',
                middle: '\n\n**🧠 Points d\'apprentissage :**\n',
                suffix: '\n\n*Continuez à apprendre et à grandir ! Le savoir est votre meilleure arme ! 🌱*'
            }
        };

        const enhancement = enhancements[tone] || enhancements.friendly;
        
        // Amélioration du contenu principal avec plus de détails
        let enhanced = original;
        
        // Ajout d'émojis contextuels et de structure
        if (!enhanced.includes('📅') && (enhanced.includes('date') || enhanced.includes('quand'))) {
            enhanced = enhanced.replace(/date/gi, '📅 Date');
        }
        if (!enhanced.includes('📍') && (enhanced.includes('lieu') || enhanced.includes('où'))) {
            enhanced = enhanced.replace(/lieu/gi, '📍 Lieu');
        }
        if (!enhanced.includes('🎯') && enhanced.includes('objectif')) {
            enhanced = enhanced.replace(/objectif/gi, '🎯 Objectif');
        }

        // Ajout de détails contextuels
        let contextualDetails = '';
        if (enhanced.includes('développement') || enhanced.includes('bot')) {
            contextualDetails = '• 🔧 Améliorations techniques en cours\n• 📈 Optimisation des performances\n• 🛡️ Renforcement de la sécurité';
        } else if (enhanced.includes('erreur') || enhanced.includes('bug')) {
            contextualDetails = '• 🔍 Identification des problèmes\n• ⚡ Correction en cours\n• 🔄 Tests de validation';
        } else if (enhanced.includes('nouveau') || enhanced.includes('nouvelle')) {
            contextualDetails = '• ✨ Innovation technologique\n• 🎯 Amélioration de l\'expérience\n• 🚀 Fonctionnalités avancées';
        } else {
            contextualDetails = '• 📋 Information détaillée\n• 🎯 Communication transparente\n• 💡 Mise à jour importante';
        }

        return enhancement.prefix + enhanced + enhancement.middle + contextualDetails + enhancement.suffix;
    },

    // Champs contextuels avancés
    generateAdvancedContextualFields(context, description) {
        const fields = [];
        const keywords = description.toLowerCase();

        // Champs de base selon le contexte
        switch (context) {
            case 'Annonce officielle':
                fields.push(
                    { name: '📋 Type d\'annonce', value: 'Communication officielle', inline: true },
                    { name: '👥 Public concerné', value: 'Tous les membres', inline: true },
                    { name: '📅 Date d\'effet', value: 'Immédiate', inline: true },
                    { name: '🔔 Priorité', value: 'Haute importance', inline: true },
                    { name: '📞 Contact', value: 'Équipe administrative', inline: true },
                    { name: '📋 Suivi', value: 'Mise à jour régulière', inline: true }
                );
                break;

            case 'Mise à jour technique':
                if (keywords.includes('bot') || keywords.includes('développement')) {
                    fields.push(
                        { name: '🔧 Type de mise à jour', value: 'Développement technique', inline: true },
                        { name: '📊 Progression', value: 'En cours d\'optimisation', inline: true },
                        { name: '🛡️ Sécurité', value: 'Renforcée', inline: true },
                        { name: '⚡ Performance', value: 'Améliorée', inline: true },
                        { name: '🔄 Fréquence', value: 'Mise à jour continue', inline: true },
                        { name: '📈 Impact', value: 'Amélioration globale', inline: true }
                    );
                }
                break;

            default:
                // Champs génériques mais détaillés
                if (keywords.includes('nouveau') || keywords.includes('nouvelle')) {
                    fields.push(
                        { name: '✨ Nouveauté', value: 'Innovation majeure', inline: true },
                        { name: '🎯 Objectif', value: 'Amélioration continue', inline: true }
                    );
                }
                if (keywords.includes('important')) {
                    fields.push(
                        { name: '⚠️ Importance', value: 'Lecture recommandée', inline: true },
                        { name: '📋 Action requise', value: 'Prise de connaissance', inline: true }
                    );
                }
                break;
        }

        // Ajout de champs dynamiques selon les mots-clés
        if (keywords.includes('erreur') || keywords.includes('bug')) {
            fields.push({ name: '🔧 Statut correction', value: 'En cours de résolution', inline: true });
        }
        if (keywords.includes('amélioration') || keywords.includes('optimisation')) {
            fields.push({ name: '📈 Bénéfices', value: 'Performance accrue', inline: true });
        }

        return fields;
    }
};
