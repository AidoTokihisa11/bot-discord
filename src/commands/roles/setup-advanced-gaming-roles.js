import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import Logger from '../../utils/Logger.js';

const logger = new Logger();

const TARGET_CHANNEL_ID = '1368919061425164288';

export default {
    data: new SlashCommandBuilder()
        .setName('setup-advanced-gaming-roles')
        .setDescription('🎮 Configure le système avancé de rôles gaming avec toutes les fonctionnalités')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
        .setDMPermission(false),

    async execute(interaction, client) {
        try {
            // Vérifier les permissions
            if (!interaction.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
                return await interaction.reply({
                    content: '❌ Vous devez avoir la permission "Gérer les rôles" pour utiliser cette commande.',
                    ephemeral: true
                });
            }

            await interaction.deferReply();

            // Vérifier que le gestionnaire gaming existe
            if (!client.gamingRoleManager) {
                return await interaction.editReply({
                    content: '❌ Le gestionnaire de rôles gaming n\'est pas initialisé.'
                });
            }

            // Récupérer le canal cible
            const targetChannel = interaction.guild.channels.cache.get(TARGET_CHANNEL_ID);
            if (!targetChannel) {
                return await interaction.editReply({
                    content: `❌ Canal introuvable avec l'ID: ${TARGET_CHANNEL_ID}`
                });
            }

            // Obtenir les jeux actifs
            const activeGames = client.gamingRoleManager.getActiveGames();
            
            // Vérifier que tous les rôles et catégories existent
            const missingElements = [];
            const validGames = {};

            for (const [gameKey, gameConfig] of Object.entries(activeGames)) {
                const role = interaction.guild.roles.cache.get(gameConfig.roleId);
                const category = interaction.guild.channels.cache.get(gameConfig.categoryId);
                
                if (!role) {
                    missingElements.push(`❌ Rôle ${gameConfig.name} (${gameConfig.roleId})`);
                }
                if (!category) {
                    missingElements.push(`❌ Catégorie ${gameConfig.name} (${gameConfig.categoryId})`);
                }
                
                if (role && category) {
                    validGames[gameKey] = { ...gameConfig, role, category };
                }
            }

            if (missingElements.length > 0) {
                return await interaction.editReply({
                    content: `❌ **Éléments manquants:**\n${missingElements.join('\n')}`
                });
            }

            // Créer l'embed principal ultra stylé
            const mainEmbed = new EmbedBuilder()
                .setColor(0x2F3136)
                .setTitle('🎮 **SÉLECTION DES RÔLES GAMING**')
                .setDescription(`
**Bienvenue dans notre système de rôles gaming avancé !**

🔥 **Fonctionnalités exclusives :**
• **Accès instantané** aux salons de vos jeux favoris
• **Notifications personnalisées** en messages privés
• **Système de cooldown** anti-spam (30 secondes)
• **Statistiques détaillées** de votre activité
• **Gestion automatique** des permissions

⚡ **Comment ça marche ?**
Cliquez simplement sur les boutons ci-dessous pour obtenir ou retirer vos rôles gaming !
                `)
                .setThumbnail(interaction.guild.iconURL({ dynamic: true, size: 256 }))
                .setFooter({ 
                    text: `${interaction.guild.name} • Système Gaming Avancé • ${Object.keys(validGames).length} jeux disponibles`,
                    iconURL: interaction.guild.iconURL()
                })
                .setTimestamp();

            // Créer l'embed des jeux
            const gamesEmbed = new EmbedBuilder()
                .setColor(0x5865F2)
                .setTitle('🎯 **JEUX DISPONIBLES**')
                .setDescription('Choisissez vos jeux préférés et accédez instantanément à leurs communautés !')
                .addFields(
                    Object.entries(validGames).map(([gameKey, gameConfig]) => ({
                        name: `${gameConfig.emoji} **${gameConfig.name}**`,
                        value: `${gameConfig.description}\n🏷️ <@&${gameConfig.roleId}>`,
                        inline: true
                    }))
                );

            // Créer l'embed des règles
            const rulesEmbed = new EmbedBuilder()
                .setColor(0xED4245)
                .setTitle('📋 **RÈGLES & INFORMATIONS**')
                .addFields(
                    {
                        name: '⏰ Cooldown',
                        value: 'Attendez **30 secondes** entre chaque changement de rôle',
                        inline: true
                    },
                    {
                        name: '🔔 Notifications',
                        value: 'Vous recevrez un **MP** à chaque changement',
                        inline: true
                    },
                    {
                        name: '👥 Rôles multiples',
                        value: 'Vous pouvez avoir **plusieurs rôles** gaming',
                        inline: true
                    },
                    {
                        name: '🔒 Accès automatique',
                        value: 'Les salons s\'affichent/cachent **automatiquement**',
                        inline: true
                    },
                    {
                        name: '📊 Statistiques',
                        value: 'Toutes vos actions sont **enregistrées**',
                        inline: true
                    },
                    {
                        name: '🛡️ Sécurité',
                        value: 'Système **anti-spam** intégré',
                        inline: true
                    }
                );

            // Créer les boutons pour chaque jeu
            const gameButtons = [];
            const buttonsPerRow = 3;
            
            const gameEntries = Object.entries(validGames);
            for (let i = 0; i < gameEntries.length; i += buttonsPerRow) {
                const row = new ActionRowBuilder();
                
                for (let j = i; j < Math.min(i + buttonsPerRow, gameEntries.length); j++) {
                    const [gameKey, gameConfig] = gameEntries[j];
                    
                    row.addComponents(
                        new ButtonBuilder()
                            .setCustomId(`gaming_role_${gameKey}`)
                            .setLabel(gameConfig.name)
                            .setEmoji(gameConfig.emoji)
                            .setStyle(ButtonStyle.Secondary)
                    );
                }
                
                gameButtons.push(row);
            }

            // Ajouter un bouton pour les statistiques
            const statsRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('gaming_stats')
                        .setLabel('Voir les Statistiques')
                        .setEmoji('📊')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId('gaming_help')
                        .setLabel('Aide & Support')
                        .setEmoji('❓')
                        .setStyle(ButtonStyle.Success)
                );

            gameButtons.push(statsRow);

            // Envoyer le message dans le canal cible
            const roleMessage = await targetChannel.send({ 
                embeds: [mainEmbed, gamesEmbed, rulesEmbed], 
                components: gameButtons 
            });

            // Ajouter aussi les réactions pour la compatibilité
            for (const gameConfig of Object.values(validGames)) {
                try {
                    await roleMessage.react(gameConfig.emoji);
                    await new Promise(resolve => setTimeout(resolve, 1000));
                } catch (error) {
                    logger.warn(`Impossible d'ajouter la réaction ${gameConfig.emoji}:`, error);
                }
            }

            // Configurer les rôles réactifs dans le gestionnaire standard
            for (const [gameKey, gameConfig] of Object.entries(validGames)) {
                try {
                    await client.reactionRoleManager.addReactionRole({
                        messageId: roleMessage.id,
                        channelId: TARGET_CHANNEL_ID,
                        guildId: interaction.guild.id,
                        emoji: gameConfig.emoji,
                        roleId: gameConfig.roleId,
                        type: 'toggle',
                        description: `${gameConfig.description} - Système Gaming Avancé`
                    });
                } catch (error) {
                    logger.error(`Erreur lors de la configuration du rôle ${gameConfig.name}:`, error);
                }
            }

            // Enregistrer l'ID du message pour les boutons
            if (!client.db.data.gamingRoles) {
                client.db.data.gamingRoles = {};
            }
            if (!client.db.data.gamingRoles.messages) {
                client.db.data.gamingRoles.messages = [];
            }
            
            client.db.data.gamingRoles.messages.push({
                messageId: roleMessage.id,
                channelId: TARGET_CHANNEL_ID,
                guildId: interaction.guild.id,
                createdAt: new Date().toISOString(),
                createdBy: interaction.user.id
            });
            
            await client.db.save();

            // Créer l'embed de confirmation
            const confirmEmbed = new EmbedBuilder()
                .setColor(0x00FF88)
                .setTitle('✅ **SYSTÈME GAMING CONFIGURÉ**')
                .setDescription(`Le système avancé de rôles gaming a été configuré avec succès !`)
                .addFields(
                    {
                        name: '📍 Canal',
                        value: `${targetChannel}`,
                        inline: true
                    },
                    {
                        name: '🎮 Jeux Configurés',
                        value: Object.keys(validGames).length.toString(),
                        inline: true
                    },
                    {
                        name: '🔗 Message',
                        value: `[Aller au message](${roleMessage.url})`,
                        inline: true
                    },
                    {
                        name: '⚡ Fonctionnalités',
                        value: '• Boutons interactifs\n• Réactions classiques\n• Cooldown anti-spam\n• Notifications MP\n• Gestion auto des salons\n• Statistiques détaillées',
                        inline: false
                    }
                )
                .setThumbnail('https://cdn.discordapp.com/emojis/852881450667081728.gif')
                .setFooter({ 
                    text: `Configuré par ${interaction.user.tag}`,
                    iconURL: interaction.user.displayAvatarURL()
                })
                .setTimestamp();

            await interaction.editReply({ embeds: [confirmEmbed] });

            // Log de l'action
            logger.success(`Système gaming avancé configuré par ${interaction.user.tag} dans ${targetChannel.name}`);

        } catch (error) {
            logger.error('Erreur dans setup-advanced-gaming-roles:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor(0xFF6B6B)
                .setTitle('❌ **ERREUR**')
                .setDescription('Une erreur est survenue lors de la configuration du système gaming.')
                .addFields({
                    name: '🔧 Solution',
                    value: 'Vérifiez que le bot a toutes les permissions nécessaires et réessayez.',
                    inline: false
                })
                .setTimestamp();

            if (interaction.replied || interaction.deferred) {
                await interaction.editReply({ embeds: [errorEmbed] });
            } else {
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
        }
    }
};
