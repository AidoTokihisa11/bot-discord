import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('test-interactions')
        .setDescription('🧪 Tester toutes les interactions du bot')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcommand =>
            subcommand
                .setName('boutons')
                .setDescription('🔘 Tester tous les types de boutons'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('modals')
                .setDescription('📝 Tester tous les modals'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('tickets')
                .setDescription('🎫 Tester le système de tickets'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('embeds')
                .setDescription('🎨 Tester le système d\'embeds')),

    async execute(interaction) {
        try {
            const subcommand = interaction.options.getSubcommand();

            switch (subcommand) {
                case 'boutons':
                    await testButtons(interaction);
                    break;
                case 'modals':
                    await testModals(interaction);
                    break;
                case 'tickets':
                    await testTickets(interaction);
                    break;
                case 'embeds':
                    await testEmbeds(interaction);
                    break;
            }

        } catch (error) {
            console.error('Erreur test interactions:', error);
            await interaction.reply({
                content: '❌ Une erreur est survenue lors du test.',
                ephemeral: true
            });
        }
    }
};

async function testButtons(interaction) {
    const testEmbed = new EmbedBuilder()
        .setTitle('🧪 **TEST DES BOUTONS**')
        .setDescription('Cliquez sur les boutons ci-dessous pour tester les interactions.')
        .setColor('#3498db')
        .addFields({
            name: '📋 **Instructions**',
            value: 'Chaque bouton teste une partie différente du système.',
            inline: false
        });

    const buttonRow1 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('ticket_support')
                .setLabel('Test Ticket Support')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('🔧'),
            new ButtonBuilder()
                .setCustomId('ticket_suggestion')
                .setLabel('Test Suggestion')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('💡'),
            new ButtonBuilder()
                .setCustomId('ticket_faq')
                .setLabel('Test FAQ')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('❓')
        );

    const buttonRow2 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('builder_step1')
                .setLabel('Test Embed Builder')
                .setStyle(ButtonStyle.Success)
                .setEmoji('🏗️'),
            new ButtonBuilder()
                .setCustomId(`ia_deploy_${interaction.user.id}`)
                .setLabel('Test IA Deploy')
                .setStyle(ButtonStyle.Success)
                .setEmoji('🤖'),
            new ButtonBuilder()
                .setCustomId(`ia_customize_${interaction.user.id}`)
                .setLabel('Test IA Customize')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('⚙️')
        );

    await interaction.reply({
        embeds: [testEmbed],
        components: [buttonRow1, buttonRow2],
        ephemeral: true
    });
}

async function testModals(interaction) {
    const testEmbed = new EmbedBuilder()
        .setTitle('📝 **TEST DES MODALS**')
        .setDescription('Les modals seront testés via les boutons de tickets et d\'embeds.')
        .setColor('#9b59b6')
        .addFields({
            name: '✅ **Modals Disponibles**',
            value: `• Création de tickets\n• Suggestions\n• Embed builder\n• Personnalisation IA\n• Feedback`,
            inline: false
        });

    await interaction.reply({
        embeds: [testEmbed],
        ephemeral: true
    });
}

async function testTickets(interaction) {
    const testEmbed = new EmbedBuilder()
        .setTitle('🎫 **TEST DU SYSTÈME DE TICKETS**')
        .setDescription('Panel de test pour le système de tickets complet.')
        .setColor('#e74c3c');

    const ticketButtons = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('ticket_support')
                .setLabel('Support')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('🔧'),
            new ButtonBuilder()
                .setCustomId('ticket_general')
                .setLabel('Général')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('❓'),
            new ButtonBuilder()
                .setCustomId('ticket_report')
                .setLabel('Signalement')
                .setStyle(ButtonStyle.Danger)
                .setEmoji('🚨')
        );

    const quickActions = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('ticket_status')
                .setLabel('Statut')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('📊'),
            new ButtonBuilder()
                .setCustomId('ticket_my_tickets')
                .setLabel('Mes Tickets')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('📋')
        );

    await interaction.reply({
        embeds: [testEmbed],
        components: [ticketButtons, quickActions],
        ephemeral: true
    });
}

async function testEmbeds(interaction) {
    const testEmbed = new EmbedBuilder()
        .setTitle('🎨 **TEST DU SYSTÈME D\'EMBEDS**')
        .setDescription('Test des fonctionnalités d\'embeds et templates.')
        .setColor('#f39c12');

    const embedButtons = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('builder_step1')
                .setLabel('Builder Étape 1')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('1️⃣'),
            new ButtonBuilder()
                .setCustomId('builder_preview')
                .setLabel('Aperçu')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('👁️')
        );

    // Initialiser les données de test pour l'embed builder
    if (!interaction.client.embedBuilder) {
        interaction.client.embedBuilder = new Map();
    }

    interaction.client.embedBuilder.set(interaction.user.id, {
        data: {
            title: 'Test Embed',
            description: 'Description de test',
            color: '#3498db'
        },
        targetChannel: interaction.channel,
        timestamp: Date.now()
    });

    await interaction.reply({
        embeds: [testEmbed],
        components: [embedButtons],
        ephemeral: true
    });
}
