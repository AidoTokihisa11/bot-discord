import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('appeal')
        .setDescription('⚖️ Déposer une réclamation ou exercer vos droits RGPD')
        .addStringOption(option =>
            option.setName('type')
                .setDescription('Type de demande')
                .addChoices(
                    { name: '🔍 Droit d\'accès (Art. 15)', value: 'access' },
                    { name: '✏️ Droit de rectification (Art. 16)', value: 'rectification' },
                    { name: '🗑️ Droit à l\'effacement (Art. 17)', value: 'erasure' },
                    { name: '⏸️ Droit de limitation (Art. 18)', value: 'restriction' },
                    { name: '📤 Droit de portabilité (Art. 20)', value: 'portability' },
                    { name: '🚫 Droit d\'opposition (Art. 21)', value: 'objection' },
                    { name: '⚖️ Réclamation modération', value: 'moderation' }
                )
                .setRequired(false)
        ),

    async execute(interaction) {
        const appealType = interaction.options.getString('type');
        
        if (appealType) {
            await this.handleDirectAppeal(interaction, appealType);
        } else {
            await this.showAppealMenu(interaction);
        }
    },

    async showAppealMenu(interaction) {
        const embed = new EmbedBuilder()
            .setTitle('⚖️ **CENTRE DE RÉCLAMATIONS RGPD**')
            .setDescription('**Exercez vos droits en toute simplicité**\n\n*Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez de droits sur vos données personnelles.*')
            .addFields(
                {
                    name: '🔍 **Droit d\'accès (Article 15)**',
                    value: '• Consulter vos données personnelles\n• Connaître les finalités de traitement\n• Vérifier la licéité du traitement\n• Obtenir des informations sur les destinataires',
                    inline: true
                },
                {
                    name: '✏️ **Droit de rectification (Article 16)**',
                    value: '• Corriger des données inexactes\n• Compléter des données incomplètes\n• Mettre à jour vos informations\n• Modifier des paramètres incorrects',
                    inline: true
                },
                {
                    name: '🗑️ **Droit à l\'effacement (Article 17)**',
                    value: '• Supprimer vos données personnelles\n• "Droit à l\'oubli" numérique\n• Effacement après fin d\'utilisation\n• Retrait du consentement',
                    inline: true
                },
                {
                    name: '⏸️ **Droit de limitation (Article 18)**',
                    value: '• Limiter le traitement temporairement\n• Suspension en cas de contestation\n• Conservation sans traitement\n• Notification des modifications',
                    inline: true
                },
                {
                    name: '📤 **Droit de portabilité (Article 20)**',
                    value: '• Récupérer vos données structurées\n• Format lisible par machine\n• Transmission à un autre responsable\n• Export JSON, CSV, TXT disponible',
                    inline: true
                },
                {
                    name: '🚫 **Droit d\'opposition (Article 21)**',
                    value: '• S\'opposer au traitement\n• Motifs légitimes particuliers\n• Arrêt du traitement concerné\n• Exceptions pour intérêt public',
                    inline: true
                },
                {
                    name: '⚖️ **Réclamations modération**',
                    value: '• Contester une sanction\n• Signaler un abus de pouvoir\n• Demander révision d\'une décision\n• Faire appel d\'un bannissement',
                    inline: false
                },
                {
                    name: '📋 **Informations importantes**',
                    value: `**Délai de réponse :** 72 heures maximum\n**Délai de traitement :** 1 mois (extensible à 3 mois si complexe)\n**Gratuité :** Toutes les demandes sont gratuites\n**Preuves :** Justificatifs requis pour l'identité`,
                    inline: false
                }
            )
            .setColor('#e67e22')
            .setThumbnail('https://i.imgur.com/s74nSIc.png')
            .setImage('https://i.imgur.com/s74nSIc.png')
            .setTimestamp()
            .setFooter({ 
                text: 'Team7 Bot - Centre RGPD • Vos droits, notre priorité',
                iconURL: 'https://i.imgur.com/s74nSIc.png'
            });

        const actionRow1 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('appeal_access')
                    .setLabel('🔍 Droit d\'accès')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('appeal_rectification')
                    .setLabel('✏️ Rectification')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('appeal_erasure')
                    .setLabel('🗑️ Effacement')
                    .setStyle(ButtonStyle.Danger)
            );

        const actionRow2 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('appeal_restriction')
                    .setLabel('⏸️ Limitation')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('appeal_portability')
                    .setLabel('📤 Portabilité')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('appeal_objection')
                    .setLabel('🚫 Opposition')
                    .setStyle(ButtonStyle.Danger)
            );

        const actionRow3 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('appeal_moderation')
                    .setLabel('⚖️ Réclamation modération')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('appeal_status')
                    .setLabel('📊 Suivi de demande')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('appeal_help')
                    .setLabel('ℹ️ Aide RGPD')
                    .setStyle(ButtonStyle.Secondary)
            );

        await interaction.reply({
            embeds: [embed],
            components: [actionRow1, actionRow2, actionRow3],
            ephemeral: true
        });
    },

    async handleDirectAppeal(interaction, type) {
        let embed;
        let components = [];

        switch (type) {
            case 'access':
                embed = this.createAccessEmbed();
                components = [this.createAccessButtons()];
                break;
            case 'rectification':
                embed = this.createRectificationEmbed();
                components = [this.createRectificationButtons()];
                break;
            case 'erasure':
                embed = this.createErasureEmbed();
                components = [this.createErasureButtons()];
                break;
            case 'restriction':
                embed = this.createRestrictionEmbed();
                components = [this.createRestrictionButtons()];
                break;
            case 'portability':
                embed = this.createPortabilityEmbed();
                components = [this.createPortabilityButtons()];
                break;
            case 'objection':
                embed = this.createObjectionEmbed();
                components = [this.createObjectionButtons()];
                break;
            case 'moderation':
                embed = this.createModerationAppealEmbed();
                components = [this.createModerationButtons()];
                break;
        }

        await interaction.reply({
            embeds: [embed],
            components: components,
            ephemeral: true
        });
    },

    createAccessEmbed() {
        return new EmbedBuilder()
            .setTitle('🔍 **DROIT D\'ACCÈS (Article 15 RGPD)**')
            .setDescription('**Consultez et vérifiez vos données personnelles**')
            .addFields(
                {
                    name: '📋 **Informations que vous pouvez obtenir**',
                    value: `• **Données stockées** : Toutes vos données personnelles\n• **Finalités** : Pourquoi nous traitons vos données\n• **Base légale** : Fondement juridique du traitement\n• **Destinataires** : Qui a accès à vos données\n• **Durée de conservation** : Combien de temps nous gardons vos données\n• **Droits** : Tous vos droits sur vos données`,
                    inline: false
                },
                {
                    name: '⚡ **Accès rapide**',
                    value: `Utilisez la commande **\`/my-data\`** pour un accès immédiat à vos données personnelles avec interface interactive.`,
                    inline: false
                },
                {
                    name: '📊 **Demande détaillée**',
                    value: `Pour une analyse complète avec métadonnées juridiques et techniques, utilisez le formulaire ci-dessous.`,
                    inline: false
                }
            )
            .setColor('#3498db')
            .setThumbnail('https://i.imgur.com/s74nSIc.png');
    },

    createRectificationEmbed() {
        return new EmbedBuilder()
            .setTitle('✏️ **DROIT DE RECTIFICATION (Article 16 RGPD)**')
            .setDescription('**Corrigez vos données personnelles inexactes**')
            .addFields(
                {
                    name: '🔧 **Types de rectifications possibles**',
                    value: `• **Données incorrectes** : Correction d'informations erronées\n• **Données incomplètes** : Ajout d'informations manquantes\n• **Données obsolètes** : Mise à jour d'informations périmées\n• **Paramètres incorrects** : Modification de préférences`,
                    inline: false
                },
                {
                    name: '📝 **Informations à fournir**',
                    value: `• **Données à corriger** : Spécifiez les informations inexactes\n• **Correction souhaitée** : Nouvelles données correctes\n• **Justification** : Preuve de l'inexactitude si nécessaire\n• **Documents** : Pièces justificatives si applicable`,
                    inline: false
                },
                {
                    name: '⏱️ **Délais de traitement**',
                    value: `• **Accusé de réception** : Immédiat\n• **Vérification** : 72 heures\n• **Rectification** : 7 jours maximum\n• **Notification** : Automatique`,
                    inline: false
                }
            )
            .setColor('#f39c12')
            .setThumbnail('https://i.imgur.com/s74nSIc.png');
    },

    createErasureEmbed() {
        return new EmbedBuilder()
            .setTitle('🗑️ **DROIT À L\'EFFACEMENT (Article 17 RGPD)**')
            .setDescription('**"Droit à l\'oubli" - Supprimez vos données personnelles**')
            .addFields(
                {
                    name: '✅ **Motifs d\'effacement recevables**',
                    value: `• **Données plus nécessaires** : Finalité atteinte\n• **Retrait du consentement** : Vous retirez votre accord\n• **Opposition légitime** : Motifs impérieux particuliers\n• **Traitement illicite** : Non-conformité RGPD\n• **Obligation légale** : Suppression requise par la loi`,
                    inline: false
                },
                {
                    name: '❌ **Limitations possibles**',
                    value: `• **Liberté d'expression** : Intérêt public à l'information\n• **Obligation légale** : Conservation imposée par la loi\n• **Intérêt public** : Santé, recherche scientifique\n• **Constatation de droits** : Preuves juridiques`,
                    inline: false
                },
                {
                    name: '🔄 **Processus d\'effacement**',
                    value: `• **Évaluation** : Vérification des motifs\n• **Suppression** : Effacement sécurisé\n• **Vérification** : Contrôle de l'effacement\n• **Confirmation** : Attestation de suppression`,
                    inline: false
                }
            )
            .setColor('#e74c3c')
            .setThumbnail('https://i.imgur.com/s74nSIc.png');
    },

    createRestrictionEmbed() {
        return new EmbedBuilder()
            .setTitle('⏸️ **DROIT DE LIMITATION (Article 18 RGPD)**')
            .setDescription('**Limitez temporairement le traitement de vos données**')
            .addFields(
                {
                    name: '🔒 **Cas de limitation**',
                    value: `• **Exactitude contestée** : Pendant vérification des données\n• **Traitement illicite** : Alternative à l'effacement\n• **Données non nécessaires** : Mais nécessaires pour vous\n• **Opposition en cours** : Pendant évaluation des motifs`,
                    inline: false
                },
                {
                    name: '📋 **Conséquences de la limitation**',
                    value: `• **Conservation** : Vos données sont conservées\n• **Pas de traitement** : Aucune utilisation sans accord\n• **Accès restreint** : Stockage seulement\n• **Notification** : Information avant levée`,
                    inline: false
                },
                {
                    name: '🔓 **Levée de la limitation**',
                    value: `• **Consentement** : Avec votre accord explicite\n• **Protection des droits** : Défense juridique\n• **Intérêt public** : Motifs impérieux\n• **Tiers** : Protection des droits d'autrui`,
                    inline: false
                }
            )
            .setColor('#95a5a6')
            .setThumbnail('https://i.imgur.com/s74nSIc.png');
    },

    createPortabilityEmbed() {
        return new EmbedBuilder()
            .setTitle('📤 **DROIT DE PORTABILITÉ (Article 20 RGPD)**')
            .setDescription('**Récupérez vos données dans un format structuré**')
            .addFields(
                {
                    name: '📥 **Accès rapide**',
                    value: `Utilisez la commande **\`/export-my-data\`** pour un export immédiat de toutes vos données personnelles en formats JSON, CSV ou TXT.`,
                    inline: false
                },
                {
                    name: '📊 **Formats disponibles**',
                    value: `• **JSON** : Format structuré pour applications\n• **CSV** : Compatible tableurs (Excel, Sheets)\n• **TXT** : Format texte lisible\n• **Métadonnées** : Informations de traitement incluses`,
                    inline: true
                },
                {
                    name: '🔄 **Transmission directe**',
                    value: `• **Vers un autre responsable** : Transfer automatique\n• **API standard** : Format interopérable\n• **Vérification** : Contrôle d'intégrité\n• **Sécurisation** : Chiffrement des données`,
                    inline: true
                },
                {
                    name: '⚠️ **Conditions d\'application**',
                    value: `• **Traitement automatisé** : Données traitées par ordinateur\n• **Base consentement/contrat** : Fondement juridique\n• **Données fournies** : Que vous avez communiquées\n• **Faisabilité technique** : Techniquement possible`,
                    inline: false
                }
            )
            .setColor('#27ae60')
            .setThumbnail('https://i.imgur.com/s74nSIc.png');
    },

    createObjectionEmbed() {
        return new EmbedBuilder()
            .setTitle('🚫 **DROIT D\'OPPOSITION (Article 21 RGPD)**')
            .setDescription('**Opposez-vous au traitement de vos données**')
            .addFields(
                {
                    name: '⚖️ **Motifs d\'opposition**',
                    value: `• **Situation particulière** : Circonstances spécifiques à votre situation\n• **Intérêts légitimes** : Vos intérêts prévalent\n• **Droits fondamentaux** : Atteinte à vos libertés\n• **Finalité non nécessaire** : Traitement disproportionné`,
                    inline: false
                },
                {
                    name: '🔍 **Évaluation de la demande**',
                    value: `• **Motifs légitimes impérieux** : Vérification des raisons\n• **Intérêts en balance** : Pesée des intérêts\n• **Droits des tiers** : Protection d'autrui\n• **Obligations légales** : Respect de la loi`,
                    inline: true
                },
                {
                    name: '✅ **Conséquences de l\'opposition**',
                    value: `• **Arrêt du traitement** : Si opposition justifiée\n• **Conservation** : Données conservées sans traitement\n• **Exception** : Sauf motifs légitimes impérieux\n• **Information** : Notification de la décision`,
                    inline: true
                },
                {
                    name: '📢 **Opposition au marketing**',
                    value: `Opposition absolue pour la prospection commerciale, y compris le profilage lié au marketing direct.`,
                    inline: false
                }
            )
            .setColor('#e74c3c')
            .setThumbnail('https://i.imgur.com/s74nSIc.png');
    },

    createModerationAppealEmbed() {
        return new EmbedBuilder()
            .setTitle('⚖️ **RÉCLAMATION MODÉRATION**')
            .setDescription('**Contestez une décision de modération**')
            .addFields(
                {
                    name: '📋 **Types de réclamations**',
                    value: `• **Sanction injustifiée** : Contestation d'un avertissement/ban\n• **Erreur de modération** : Mauvaise interprétation des règles\n• **Abus de pouvoir** : Comportement inapproprié d'un modérateur\n• **Sanction disproportionnée** : Punition trop sévère`,
                    inline: false
                },
                {
                    name: '📝 **Informations requises**',
                    value: `• **ID de la sanction** : Référence de la modération\n• **Date et heure** : Moment de l'incident\n• **Modérateur concerné** : Si connu\n• **Contexte** : Circonstances de l'incident\n• **Preuves** : Captures d'écran, logs, témoins`,
                    inline: true
                },
                {
                    name: '🔍 **Processus d\'examen**',
                    value: `• **Réception** : Accusé immédiat\n• **Investigation** : Examen approfondi\n• **Révision** : Panel d'experts\n• **Décision** : Maintien ou annulation\n• **Notification** : Résultat motivé`,
                    inline: true
                }
            )
            .setColor('#9b59b6')
            .setThumbnail('https://i.imgur.com/s74nSIc.png');
    },

    createAccessButtons() {
        return new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('appeal_access_quick')
                    .setLabel('⚡ Accès rapide (/my-data)')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('appeal_access_detailed')
                    .setLabel('📋 Demande détaillée')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('appeal_access_legal')
                    .setLabel('⚖️ Informations légales')
                    .setStyle(ButtonStyle.Secondary)
            );
    },

    createRectificationButtons() {
        return new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('appeal_rectify_form')
                    .setLabel('📝 Formulaire rectification')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('appeal_rectify_urgent')
                    .setLabel('🚨 Rectification urgente')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId('appeal_rectify_help')
                    .setLabel('ℹ️ Aide rectification')
                    .setStyle(ButtonStyle.Secondary)
            );
    },

    createErasureButtons() {
        return new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('appeal_erase_form')
                    .setLabel('🗑️ Demande d\'effacement')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId('appeal_erase_partial')
                    .setLabel('📋 Effacement partiel')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('appeal_erase_conditions')
                    .setLabel('📚 Conditions légales')
                    .setStyle(ButtonStyle.Primary)
            );
    },

    createRestrictionButtons() {
        return new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('appeal_restrict_form')
                    .setLabel('⏸️ Demande limitation')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('appeal_restrict_status')
                    .setLabel('📊 Statut limitation')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('appeal_restrict_info')
                    .setLabel('ℹ️ Informations')
                    .setStyle(ButtonStyle.Secondary)
            );
    },

    createPortabilityButtons() {
        return new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('appeal_export_quick')
                    .setLabel('📥 Export rapide (/export-my-data)')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('appeal_transfer_form')
                    .setLabel('🔄 Transmission directe')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('appeal_formats_info')
                    .setLabel('📊 Formats disponibles')
                    .setStyle(ButtonStyle.Secondary)
            );
    },

    createObjectionButtons() {
        return new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('appeal_object_form')
                    .setLabel('🚫 Formulaire opposition')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId('appeal_object_marketing')
                    .setLabel('📢 Opposition marketing')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('appeal_object_help')
                    .setLabel('ℹ️ Aide opposition')
                    .setStyle(ButtonStyle.Primary)
            );
    },

    createModerationButtons() {
        return new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('appeal_mod_form')
                    .setLabel('📝 Formulaire réclamation')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('appeal_mod_urgent')
                    .setLabel('🚨 Réclamation urgente')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId('appeal_mod_history')
                    .setLabel('📊 Historique sanctions')
                    .setStyle(ButtonStyle.Secondary)
            );
    }
};
