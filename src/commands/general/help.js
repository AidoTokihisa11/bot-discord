import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('❓ Affiche l\'aide et la liste des commandes disponibles')
        .addStringOption(option =>
            option.setName('commande')
                .setDescription('Commande spécifique pour laquelle obtenir de l\'aide')
                .setRequired(false)
        ),
    
    cooldown: 3,
    category: 'general',
    
    async execute(interaction, client) {
        const commandName = interaction.options.getString('commande');
        
        if (commandName) {
            return await showCommandHelp(interaction, client, commandName);
        }
        
        return await showMainHelp(interaction, client);
    },
};

async function showMainHelp(interaction, client) {
    const embed = new EmbedBuilder()
        .setColor('#7289da')
        .setTitle('🤖 Centre d\'aide - Bot Discord Avancé')
        .setDescription(`Salut **${interaction.user.displayName}** ! 👋\n\nJe suis un bot Discord moderne avec de nombreuses fonctionnalités. Voici comment m'utiliser :`)
        .addFields(
            {
                name: '📚 Navigation',
                value: '• Utilisez le menu déroulant ci-dessous pour explorer les catégories\n• Cliquez sur les boutons pour des actions rapides\n• Tapez `/help <commande>` pour une aide détaillée',
                inline: false
            },
            {
                name: '🎯 Commandes populaires',
                value: '• `/ping` - Vérifier la latence\n• `/ticket` - Créer un ticket de support\n• `/stats` - Voir les statistiques\n• `/config` - Configurer le bot',
                inline: true
            },
            {
                name: '🔗 Liens utiles',
                value: '• [Support](https://discord.gg/support)\n• [Documentation](https://docs.bot.com)\n• [Inviter le bot](https://discord.com/oauth2/authorize)',
                inline: true
            }
        )
        .setThumbnail(client.user.displayAvatarURL({ dynamic: true }))
        .setTimestamp()
        .setFooter({ 
            text: `Version 2.0.0 • ${client.commands.size} commandes disponibles`, 
            iconURL: client.user.displayAvatarURL() 
        });

    // Créer le menu de sélection des catégories
    const categoryMenu = new StringSelectMenuBuilder()
        .setCustomId('help_category_select')
        .setPlaceholder('📂 Sélectionnez une catégorie...')
        .addOptions([
            {
                label: 'Général',
                description: 'Commandes générales et utilitaires',
                value: 'general',
                emoji: '⚡'
            },
            {
                label: 'Tickets',
                description: 'Système de tickets et support',
                value: 'tickets',
                emoji: '🎫'
            },
            {
                label: 'Modération',
                description: 'Outils de modération',
                value: 'moderation',
                emoji: '🛡️'
            },
            {
                label: 'Configuration',
                description: 'Paramètres et configuration',
                value: 'config',
                emoji: '⚙️'
            },
            {
                label: 'Statistiques',
                description: 'Statistiques et informations',
                value: 'stats',
                emoji: '📊'
            }
        ]);

    // Créer les boutons d'action rapide
    const quickActions = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('help_quick_setup')
                .setLabel('🚀 Configuration rapide')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('help_create_ticket')
                .setLabel('🎫 Créer un ticket')
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('help_bot_stats')
                .setLabel('📊 Statistiques')
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setLabel('🔗 Support')
                .setStyle(ButtonStyle.Link)
                .setURL('https://discord.gg/support')
        );

    const selectRow = new ActionRowBuilder().addComponents(categoryMenu);

    await interaction.reply({
        embeds: [embed],
        components: [selectRow, quickActions],
        ephemeral: false
    });
}

async function showCommandHelp(interaction, client, commandName) {
    const command = client.commands.get(commandName.toLowerCase());
    
    if (!command) {
        const embed = new EmbedBuilder()
            .setColor('#ff6b6b')
            .setTitle('❌ Commande introuvable')
            .setDescription(`La commande \`${commandName}\` n'existe pas.`)
            .addFields({
                name: '💡 Suggestion',
                value: 'Utilisez `/help` sans paramètre pour voir toutes les commandes disponibles.',
                inline: false
            })
            .setTimestamp();

        return await interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // Créer l'embed d'aide détaillée
    const embed = new EmbedBuilder()
        .setColor('#00d4ff')
        .setTitle(`📖 Aide - /${command.data.name}`)
        .setDescription(command.data.description || 'Aucune description disponible')
        .addFields(
            {
                name: '📝 Utilisation',
                value: `\`/${command.data.name}\``,
                inline: true
            },
            {
                name: '📂 Catégorie',
                value: command.category || 'Non définie',
                inline: true
            },
            {
                name: '⏱️ Cooldown',
                value: `${command.cooldown || 3} secondes`,
                inline: true
            }
        );

    // Ajouter les options si elles existent
    if (command.data.options && command.data.options.length > 0) {
        const optionsText = command.data.options.map(option => {
            const required = option.required ? '**[Requis]**' : '*[Optionnel]*';
            return `• \`${option.name}\` ${required} - ${option.description}`;
        }).join('\n');

        embed.addFields({
            name: '⚙️ Options',
            value: optionsText,
            inline: false
        });
    }

    // Ajouter les permissions si elles existent
    if (command.permissions) {
        embed.addFields({
            name: '🔒 Permissions requises',
            value: `\`${command.permissions.join(', ')}\``,
            inline: false
        });
    }

    // Ajouter des exemples d'utilisation
    const examples = getCommandExamples(command.data.name);
    if (examples.length > 0) {
        embed.addFields({
            name: '💡 Exemples',
            value: examples.join('\n'),
            inline: false
        });
    }

    // Bouton de retour
    const backButton = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('help_back_main')
                .setLabel('⬅️ Retour au menu principal')
                .setStyle(ButtonStyle.Secondary)
        );

    await interaction.reply({
        embeds: [embed],
        components: [backButton],
        ephemeral: true
    });
}

function getCommandExamples(commandName) {
    const examples = {
        'ping': ['`/ping` - Vérifier la latence du bot'],
        'help': [
            '`/help` - Afficher l\'aide générale',
            '`/help commande:ping` - Aide pour la commande ping'
        ],
        'ticket': [
            '`/ticket create` - Créer un nouveau ticket',
            '`/ticket close` - Fermer le ticket actuel'
        ],
        'config': [
            '`/config show` - Afficher la configuration',
            '`/config set moderator_role:@Modérateur` - Définir le rôle modérateur'
        ],
        'stats': ['`/stats` - Afficher les statistiques du bot'],
        'userinfo': [
            '`/userinfo` - Vos informations',
            '`/userinfo user:@utilisateur` - Informations d\'un utilisateur'
        ],
        'serverinfo': ['`/serverinfo` - Informations du serveur'],
        'clear': [
            '`/clear amount:10` - Supprimer 10 messages',
            '`/clear amount:50 user:@utilisateur` - Supprimer 50 messages d\'un utilisateur'
        ]
    };

    return examples[commandName] || [];
}

// Gestionnaire pour les interactions du menu d'aide
export async function handleHelpInteraction(interaction, client) {
    if (interaction.isStringSelectMenu() && interaction.customId === 'help_category_select') {
        const category = interaction.values[0];
        await showCategoryCommands(interaction, client, category);
    }
    
    if (interaction.isButton()) {
        switch (interaction.customId) {
            case 'help_back_main':
                await showMainHelp(interaction, client);
                break;
            case 'help_quick_setup':
                await interaction.reply({
                    content: '🚀 Utilisez `/config setup` pour configurer rapidement le bot !',
                    ephemeral: true
                });
                break;
            case 'help_create_ticket':
                await interaction.reply({
                    content: '🎫 Utilisez `/ticket create` pour créer un nouveau ticket !',
                    ephemeral: true
                });
                break;
            case 'help_bot_stats':
                await interaction.reply({
                    content: '📊 Utilisez `/stats` pour voir les statistiques du bot !',
                    ephemeral: true
                });
                break;
        }
    }
}

async function showCategoryCommands(interaction, client, category) {
    const categoryCommands = client.commands.filter(cmd => cmd.category === category);
    
    const categoryInfo = {
        'general': { name: 'Général', emoji: '⚡', color: '#7289da' },
        'tickets': { name: 'Tickets', emoji: '🎫', color: '#f39c12' },
        'moderation': { name: 'Modération', emoji: '🛡️', color: '#e74c3c' },
        'config': { name: 'Configuration', emoji: '⚙️', color: '#95a5a6' },
        'stats': { name: 'Statistiques', emoji: '📊', color: '#3498db' }
    };

    const info = categoryInfo[category] || { name: 'Inconnue', emoji: '❓', color: '#95a5a6' };

    const embed = new EmbedBuilder()
        .setColor(info.color)
        .setTitle(`${info.emoji} Commandes - ${info.name}`)
        .setDescription(`Voici toutes les commandes de la catégorie **${info.name}** :`)
        .setTimestamp();

    if (categoryCommands.size === 0) {
        embed.addFields({
            name: '❌ Aucune commande',
            value: 'Aucune commande n\'est disponible dans cette catégorie.',
            inline: false
        });
    } else {
        const commandList = categoryCommands.map(cmd => 
            `• \`/${cmd.data.name}\` - ${cmd.data.description}`
        ).join('\n');

        embed.addFields({
            name: `📋 Commandes (${categoryCommands.size})`,
            value: commandList,
            inline: false
        });
    }

    const backButton = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('help_back_main')
                .setLabel('⬅️ Retour au menu principal')
                .setStyle(ButtonStyle.Secondary)
        );

    await interaction.update({
        embeds: [embed],
        components: [backButton]
    });
}
