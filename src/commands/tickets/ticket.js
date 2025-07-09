import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, MessageFlags } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('ticket')
        .setDescription('🎫 Créer un nouveau ticket de support'),

    async execute(interaction) {
        // Embed principal simple
        const mainEmbed = new EmbedBuilder()
            .setColor('#667eea')
            .setTitle('🎫 Système de Tickets')
            .setDescription(`
**🚀 Bienvenue dans notre système de support !**

Notre équipe est disponible pour vous accompagner dans toutes vos demandes. Sélectionnez le type de ticket qui correspond le mieux à votre besoin.

**⚡ Temps de réponse :**
• 🔴 **Urgent** : < 30 minutes
• 🟠 **Élevé** : < 1 heure  
• 🟡 **Normal** : < 4 heures
• 🟢 **Faible** : < 24 heures
`)
            .setThumbnail(interaction.guild.iconURL({ dynamic: true, size: 256 }))
            .setFooter({ 
                text: 'Support • Votre satisfaction est notre priorité',
                iconURL: interaction.client.user.displayAvatarURL({ dynamic: true })
            })
            .setTimestamp();

        // Embed des catégories avec descriptions détaillées
        const categoriesEmbed = new EmbedBuilder()
            .setColor('#764ba2')
            .setTitle('📋 CATÉGORIES DE SUPPORT DISPONIBLES')
            .setDescription(`
**Choisissez la catégorie qui correspond le mieux à votre demande :**

🔧 **SUPPORT TECHNIQUE**
└ Bugs, problèmes techniques, dysfonctionnements
└ *Équipe : Développeurs Senior • SLA : 30 min*

❓ **QUESTIONS GÉNÉRALES** 
└ Aide générale, utilisation du serveur, fonctionnalités
└ *Équipe : Support Général • SLA : 2h*

🚨 **SIGNALEMENT URGENT**
└ Violations, contenus inappropriés, comportements
└ *Équipe : Modération • SLA : 5 min*

🤝 **PARTENARIATS & BUSINESS**
└ Collaborations, sponsoring, propositions commerciales
└ *Équipe : Business Development • SLA : 4h*

💡 **SUGGESTIONS & FEEDBACK**
└ Idées d'amélioration, nouvelles fonctionnalités
└ *Équipe : Product Management • SLA : 2h*

⚖️ **APPELS & RÉCLAMATIONS**
└ Contester une sanction, réclamations officielles
└ *Équipe : Administration • SLA : 1h*

🎮 **SUPPORT GAMING**
└ Problèmes de jeu, événements, compétitions
└ *Équipe : Gaming Support • SLA : 30 min*
`)
            .setFooter({ text: '💡 Sélectionnez la catégorie appropriée pour un traitement optimal' });

        // Menu de sélection ultra-moderne
        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('ticket_category_select')
            .setPlaceholder('🎯 Sélectionnez votre catégorie de support...')
            .setMinValues(1)
            .setMaxValues(1)
            .addOptions([
                {
                    label: 'Support Technique',
                    description: 'Bugs, problèmes techniques, dysfonctionnements',
                    value: 'support',
                    emoji: '🔧'
                },
                {
                    label: 'Questions Générales',
                    description: 'Aide générale, utilisation du serveur',
                    value: 'question',
                    emoji: '❓'
                },
                {
                    label: 'Signalement Urgent',
                    description: 'Violations, contenus inappropriés',
                    value: 'report',
                    emoji: '🚨'
                },
                {
                    label: 'Partenariats & Business',
                    description: 'Collaborations, sponsoring, propositions',
                    value: 'partnership',
                    emoji: '🤝'
                },
                {
                    label: 'Suggestions & Feedback',
                    description: 'Idées d\'amélioration, nouvelles fonctionnalités',
                    value: 'suggestion',
                    emoji: '💡'
                },
                {
                    label: 'Appels & Réclamations',
                    description: 'Contester une sanction, réclamations',
                    value: 'appeal',
                    emoji: '⚖️'
                },
                {
                    label: 'Support Gaming',
                    description: 'Problèmes de jeu, événements, compétitions',
                    value: 'gaming',
                    emoji: '🎮'
                }
            ]);

        // Boutons correspondant à la liste déroulante
        const categoryButtonsRow1 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('create_ticket_support')
                    .setLabel('Support Technique')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('🔧'),
                new ButtonBuilder()
                    .setCustomId('create_ticket_question')
                    .setLabel('Questions Générales')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('❓'),
                new ButtonBuilder()
                    .setCustomId('create_ticket_report')
                    .setLabel('Signalement Urgent')
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji('🚨'),
                new ButtonBuilder()
                    .setCustomId('create_ticket_partnership')
                    .setLabel('Partenariats & Business')
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('🤝')
            );

        const categoryButtonsRow2 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('create_ticket_suggestion')
                    .setLabel('Suggestions & Feedback')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('💡'),
                new ButtonBuilder()
                    .setCustomId('create_ticket_appeal')
                    .setLabel('Appels & Réclamations')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('⚖️'),
                new ButtonBuilder()
                    .setCustomId('create_ticket_gaming')
                    .setLabel('Support Gaming')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('🎮')
            );

        // Boutons informatifs
        const infoRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('ticket_faq')
                    .setLabel('📚 FAQ')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('❔'),
                new ButtonBuilder()
                    .setCustomId('ticket_status')
                    .setLabel('📊 Statut du Service')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('🟢'),
                new ButtonBuilder()
                    .setCustomId('ticket_my_tickets')
                    .setLabel('🎫 Mes Tickets')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('📋'),
                new ButtonBuilder()
                    .setURL('https://discord.gg/support')
                    .setLabel('🌐 Centre d\'Aide')
                    .setStyle(ButtonStyle.Link)
                    .setEmoji('🔗')
            );

        const selectRow = new ActionRowBuilder().addComponents(selectMenu);

        await interaction.reply({
            embeds: [mainEmbed, categoriesEmbed],
            components: [selectRow, categoryButtonsRow1, categoryButtonsRow2, infoRow],
            flags: MessageFlags.Ephemeral
        });
    },
};
