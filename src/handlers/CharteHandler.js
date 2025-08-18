import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder } from 'discord.js';

export default class CharteInteractionHandler {
    static async handleCharteValidation(interaction) {
        // Vérifier si l'utilisateur a déjà accepté la charte
        const hasAlreadyAccepted = await this.checkIfUserAccepted(interaction.user.id, interaction.guild.id);
        
        if (hasAlreadyAccepted) {
            // L'utilisateur a déjà accepté, juste afficher une confirmation
            const alreadyAcceptedEmbed = new EmbedBuilder()
                .setTitle('ℹ️ **CHARTE DÉJÀ VALIDÉE**')
                .setDescription('**Vous avez déjà accepté cette charte**')
                .addFields(
                    {
                        name: '✅ **Statut actuel**',
                        value: `**Utilisateur :** ${interaction.user.tag}\n**Charte :** DOC-BOT-2025-002\n**Statut :** Déjà acceptée\n**Serveur :** ${interaction.guild.name}`,
                        inline: false
                    },
                    {
                        name: '📋 **Actions disponibles**',
                        value: `• **Consulter vos données :** \`/my-data\`\n• **Exporter vos données :** \`/export-my-data\`\n• **Support :** \`/support\`\n• **Suggestions :** \`/suggest\``,
                        inline: false
                    }
                )
                .setColor('#17a2b8')
                .setThumbnail(interaction.user.displayAvatarURL({ size: 256 }))
                .setTimestamp()
                .setFooter({ 
                    text: 'Charte déjà validée • Team7 Bot',
                    iconURL: 'https://i.imgur.com/s74nSIc.png'
                });

            return await interaction.reply({
                embeds: [alreadyAcceptedEmbed],
                ephemeral: true
            });
        }

        await interaction.deferUpdate();

        // Enregistrer la validation dans la base de données
        await this.saveCharteAcceptance(interaction.user.id, interaction.guild.id);

        // Mettre à jour le message original avec le nouveau compteur (le message reste visible)
        await this.updateCharteMessage(interaction);

        // Envoyer une confirmation privée à l'utilisateur
        const confirmationEmbed = new EmbedBuilder()
            .setTitle('✅ **CHARTE VALIDÉE**')
            .setDescription('**Validation enregistrée avec succès**')
            .addFields(
                {
                    name: '👤 **Informations de validation**',
                    value: `**Utilisateur :** ${interaction.user.tag}\n**ID :** \`${interaction.user.id}\`\n**Date :** <t:${Math.floor(Date.now() / 1000)}:F>\n**Serveur :** ${interaction.guild.name}`,
                    inline: false
                },
                {
                    name: '📋 **Document validé**',
                    value: `**Référence :** DOC-BOT-2025-002\n**Charte Officielle d'Utilisation**\n**Éditeur :** [Théo Garcès / AidoTokihisa]\n**Version :** 1.0`,
                    inline: true
                },
                {
                    name: '⚖️ **Engagements**',
                    value: `• Respect de la propriété intellectuelle\n• Conformité aux conditions d'utilisation\n• Respect des droits RGPD\n• Acceptation des clauses légales`,
                    inline: true
                },
                {
                    name: '🔐 **Certificat de validation**',
                    value: `**Référence :** CERT-${Date.now().toString(36).toUpperCase()}\n**Valide jusqu'au :** <t:${Math.floor((Date.now() + 365*24*60*60*1000) / 1000)}:d>\n**Statut :** ✅ Accepté et enregistré\n**Traçabilité :** Audit trail activé`,
                    inline: false
                },
                {
                    name: '📞 **En cas de questions**',
                    value: `**Support :** \`/support\`\n**Réclamations RGPD :** \`/appeal\`\n**Suggestions :** \`/suggest\`\n**Contact :** support@team7.gg`,
                    inline: false
                }
            )
            .setColor('#28a745')
            .setThumbnail(interaction.user.displayAvatarURL({ size: 256 }))
            .setImage('https://i.imgur.com/s74nSIc.png')
            .setTimestamp()
            .setFooter({ 
                text: 'Validation Charte Officielle • Team7 Bot',
                iconURL: 'https://i.imgur.com/s74nSIc.png'
            });

        await interaction.followUp({
            embeds: [confirmationEmbed],
            ephemeral: true
        });

        // Envoyer une notification au channel de logs (si configuré)
        try {
            const logChannel = interaction.guild.channels.cache.find(ch => ch.name === 'logs-charte' || ch.name === 'logs');
            if (logChannel && logChannel.isTextBased()) {
                const acceptanceCount = await this.getCharteAcceptanceCount(interaction.guild.id);
                const logEmbed = new EmbedBuilder()
                    .setTitle('📋 **NOUVELLE VALIDATION DE CHARTE**')
                    .setDescription(`**${interaction.user.tag}** a validé la charte officielle`)
                    .addFields(
                        {
                            name: '📊 **Détails**',
                            value: `**Utilisateur :** <@${interaction.user.id}>\n**Date :** <t:${Math.floor(Date.now() / 1000)}:F>\n**Document :** DOC-BOT-2025-002\n**Certificat :** CERT-${Date.now().toString(36).toUpperCase()}\n**Total acceptations :** ${acceptanceCount} 👥`,
                            inline: false
                        }
                    )
                    .setColor('#17a2b8')
                    .setTimestamp()
                    .setFooter({ text: 'System Log - Charte Validation' });

                await logChannel.send({ embeds: [logEmbed] });
            }
        } catch (error) {
            console.log('Impossible d\'envoyer dans le channel de logs');
        }

        // Envoyer un DM de confirmation à l'utilisateur
        try {
            const dmEmbed = new EmbedBuilder()
                .setTitle('✅ **CONFIRMATION DE VALIDATION**')
                .setDescription('Vous avez validé la charte officielle Team7 Bot')
                .addFields(
                    {
                        name: '📋 **Récapitulatif**',
                        value: `**Document :** Charte Officielle d'Utilisation\n**Référence :** DOC-BOT-2025-002\n**Serveur :** ${interaction.guild.name}\n**Date :** <t:${Math.floor(Date.now() / 1000)}:F>`,
                        inline: false
                    },
                    {
                        name: '🔗 **Ressources utiles**',
                        value: `• **Support :** \`/support\` sur le serveur\n• **Mes données :** \`/my-data\`\n• **Export données :** \`/export-my-data\`\n• **Suggestions :** \`/suggest\``,
                        inline: false
                    }
                )
                .setColor('#28a745')
                .setTimestamp()
                .setFooter({ text: 'Team7 Bot - Confirmation' });

            await interaction.user.send({ embeds: [dmEmbed] });
        } catch (error) {
            console.log('Impossible d\'envoyer le DM de confirmation');
        }
    }

    static async updateCharteMessage(interaction) {
        try {
            // Vérifier si le message original existe encore
            if (!interaction.message || !interaction.message.id) {
                console.log('Message original de charte introuvable - impossible de mettre à jour');
                return;
            }

            // Récupérer le nombre d'acceptations
            const acceptanceCount = await this.getCharteAcceptanceCount(interaction.guild.id);
            
            // Créer l'embed mis à jour avec le compteur
            const updatedEmbed = new EmbedBuilder()
                .setTitle('📋 **CHARTE OFFICIELLE D\'UTILISATION DU BOT DISCORD**')
                .setDescription('**Référence :** DOC-BOT-2025-002\n**Éditeur :** [Théo Garcès / AidoTokihisa], Développeur Discord\n**Statut :** Partenaire Certifié\n\n**Conformité :**\n• **Conditions des Développeurs Discord :** https://discord.com/developers/docs/legal\n• **Politique de Confidentialité Discord :** https://discord.com/privacy\n• **RGPD UE 2016/679 :** https://eur-lex.europa.eu/eli/reg/2016/679')
                .addFields(
                    {
                        name: '👨‍💻 **1. DROITS ET PROTECTIONS DU DÉVELOPPEUR**',
                        value: `**1.1 Propriété Exclusive**\nLe code source, l'infrastructure et les algorithmes sont ma propriété intellectuelle exclusive.\n\nToute tentative de :\n• Reverse engineering (Article 2 des Conditions Développeurs)\n• Réutilisation non autorisée\n• Commercialisation sans accord écrit\n**est strictement interdite et passible de poursuites**\n\n**1.2 Protection Juridique**\nEn cas de :\n• **Fuite de code** → Application du Digital Millennium Copyright Act (DMCA)\n• **Utilisation abusive** → Signalement à Discord Trust & Safety : https://discord.com/safety`,
                        inline: false
                    },
                    {
                        name: '👥 **2. DROITS ET LIMITATIONS DU STAFF**',
                        value: `**2.1 Autorisations**\nLe staff a le droit de :\n✅ Utiliser les commandes de modération standard (!ban, !mute)\n✅ Consulter les logs de modération (30 jours max)\n✅ Proposer des améliorations via le système de tickets\n\n**2.2 Interdictions Absolues**\nLe staff NE PEUT PAS :\n❌ Accéder au code source ou à l'infrastructure\n❌ Modifier les paramètres techniques du bot\n❌ Contourner les restrictions de sécurité\n❌ Utiliser le bot à des fins personnelles ou malveillantes\n\n**2.3 Responsabilités du Staff**\n• Maintenir la confidentialité des accès\n• Signaler immédiatement tout comportement suspect\n• Respecter les limites d'utilisation définies`,
                        inline: false
                    },
                    {
                        name: '🔒 **3. PROTECTION DES DONNÉES**',
                        value: `**3.1 Données Collectées**\n\`\`\`\nType        Conservation  Finalité     Conformité\nUserIDs     90 jours      Modération   RGPD Art.5\nMessages    30 jours      Sécurité     Directive ePrivacy\nLogs        60 jours      Audit        Loi Informatique et Libertés\n\`\`\`\n\n**3.2 Sécurité Renforcée**\n• Chiffrement AES-256 des données sensibles\n• Double authentification pour les accès admin\n• Audit trimestriel par un tiers indépendant`,
                        inline: false
                    },
                    {
                        name: '🔧 **3.3 COMMANDES RGPD DISPONIBLES**',
                        value: `**─────────────────────────────────────────**\n\n📁 **EXPORT DE DONNÉES** \`/export-my-data\`\n┣━ 📊 **Formats :** JSON, CSV, TXT\n┣━ 🔒 **Sécurité :** Chiffrement AES-256\n┣━ ⏱️ **Auto-suppression :** 5 minutes\n┗━ ⚖️ **Conformité :** RGPD Article 20\n\n👤 **CONSULTATION DE DONNÉES** \`/my-data\`\n┣━ 📋 **Aperçu :** Profil & Modération\n┣━ 📈 **Statistiques :** Utilisation complète\n┣━ 🕐 **Temps réel :** Données actualisées\n┗━ ⚖️ **Conformité :** RGPD Article 15\n\n🗑️ **SUPPRESSION DE DONNÉES** \`/delete-my-data\`\n┣━ 💥 **Effacement :** Complet & Définitif\n┣━ 🔐 **Sécurité :** Double confirmation\n┣━ 📄 **Rapport :** Certificat de suppression\n┗━ ⚖️ **Conformité :** RGPD Article 17\n\n**─────────────────────────────────────────**`,
                        inline: false
                    },
                    {
                        name: '⚖️ **4. GESTION DES CONFLITS**',
                        value: `**4.1 Procédure de Médiation**\n• **Phase amiable :** Discussion en ticket privé\n• **Arbitrage :** Intervention d'un expert neutre\n• **Sanctions :**\n  - Suspension temporaire des fonctionnalités\n  - Bannissement définitif si nécessaire\n\n**4.2 Protection contre les Abus**\nToute tentative de :\n• **Piratage** → Signalement à https://discord.com/security\n• **Harcèlement** → Plainte via https://www.internet-signalement.gouv.fr`,
                        inline: false
                    },
                    {
                        name: '📄 **5. CLAUSES SPÉCIFIQUES**',
                        value: `**5.1 Modification/Suppression**\nJe peux à tout moment :\n• Mettre à jour le bot\n• Modifier ses fonctionnalités\n• Interrompre le service (avec préavis de 15 jours)\n\n**5.2 Transfert de Propriété**\nConditions strictes :\n• Accord écrit obligatoire\n• Période de transition de 30 jours\n• Formation du nouveau propriétaire`,
                        inline: false
                    },
                    {
                        name: '✍️ **SIGNATURES**',
                        value: `**Signé par :**\n**Theo / AidoTokihisa**, Développeur et Propriétaire\n**Le :** 05/08/2025\n\n**Pour acceptation :**\n**Membre du Conseil d'Administration Team7**\n**Le :** 05/08/2025`,
                        inline: false
                    },
                    {
                        name: '⚠️ **AVERTISSEMENT LÉGAL**',
                        value: `Toute violation de cette charte peut entraîner des **poursuites judiciaires** conformément aux lois françaises et européennes en vigueur.\n\n**Document protégé - Reproduction interdite sans autorisation**`,
                        inline: false
                    },
                    {
                        name: '📊 **STATISTIQUES D\'ACCEPTATION**',
                        value: `${this.generateAcceptanceEmojis(acceptanceCount)} **${acceptanceCount} personnes** ont accepté cette charte\n\n*Dernière mise à jour : <t:${Math.floor(Date.now() / 1000)}:R>*`,
                        inline: false
                    }
                )
                .setColor('#e74c3c')
                .setThumbnail(interaction.guild.iconURL({ size: 256 }))
                .setImage('https://i.imgur.com/s74nSIc.png')
                .setTimestamp()
                .setFooter({ 
                    text: `Charte Officielle Team7 Bot • DOC-BOT-2025-002 • ${acceptanceCount} acceptations`,
                    iconURL: 'https://i.imgur.com/s74nSIc.png'
                });

            // Le bouton reste toujours disponible pour les nouveaux utilisateurs
            const actionRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('charte_validate')
                        .setLabel('✅ J\'ai lu et j\'accepte cette charte')
                        .setStyle(ButtonStyle.Success)
                );

            try {
                // Essayer de mettre à jour le message original
                await interaction.message.edit({
                    embeds: [updatedEmbed],
                    components: [actionRow]
                });
                console.log(`✅ Message de charte mis à jour avec ${acceptanceCount} acceptations (bouton toujours actif)`);
            } catch (editError) {
                if (editError.code === 10008) {
                    // Message introuvable - envoyer un nouveau message dans le même channel
                    console.log('Message original supprimé - envoi d\'un nouveau message de charte');
                    
                    await interaction.channel.send({
                        embeds: [updatedEmbed],
                        components: [actionRow]
                    });
                    
                    console.log('✅ Nouveau message de charte envoyé avec succès');
                } else {
                    throw editError; // Re-lancer l'erreur si ce n'est pas le code 10008
                }
            }

        } catch (error) {
            console.error('Erreur lors de la mise à jour du message de charte:', error);
            
            // En cas d'échec total, au moins logger l'acceptation
            console.log(`📋 Nouvelle acceptation de charte enregistrée pour ${interaction.user.tag}`);
        }
    }

    static generateAcceptanceEmojis(count) {
        if (count === 0) return '📋';
        if (count <= 5) return '👤'.repeat(count);
        if (count <= 10) return '👥'.repeat(Math.floor(count / 2)) + (count % 2 ? '👤' : '');
        if (count <= 25) return '👪'.repeat(Math.floor(count / 5)) + '👥'.repeat(Math.floor((count % 5) / 2)) + (count % 2 ? '👤' : '');
        if (count <= 50) return '🏢'.repeat(Math.floor(count / 10)) + '👪'.repeat(Math.floor((count % 10) / 5));
        return '🏙️'.repeat(Math.floor(count / 50)) + '🏢'.repeat(Math.floor((count % 50) / 10));
    }

    static async saveCharteAcceptance(userId, guildId) {
        try {
            // Simuler l'enregistrement en base de données
            // Dans une vraie implémentation, vous stockeriez ceci dans votre base de données
            const acceptanceData = {
                userId: userId,
                guildId: guildId,
                timestamp: Date.now(),
                version: 'DOC-BOT-2025-002'
            };

            // Charger les acceptations existantes
            let acceptances = [];
            try {
                const fs = await import('fs/promises');
                const data = await fs.readFile('data/charte_acceptances.json', 'utf8');
                acceptances = JSON.parse(data);
            } catch (error) {
                // Fichier n'existe pas encore, on commence avec un tableau vide
            }

            // Vérifier si l'utilisateur a déjà accepté
            const existingIndex = acceptances.findIndex(a => a.userId === userId && a.guildId === guildId);
            if (existingIndex !== -1) {
                // Mettre à jour l'acceptation existante
                acceptances[existingIndex] = acceptanceData;
            } else {
                // Ajouter nouvelle acceptation
                acceptances.push(acceptanceData);
            }

            // Sauvegarder
            const fs = await import('fs/promises');
            await fs.mkdir('data', { recursive: true });
            await fs.writeFile('data/charte_acceptances.json', JSON.stringify(acceptances, null, 2));

        } catch (error) {
            console.error('Erreur lors de la sauvegarde de l\'acceptation:', error);
        }
    }

    static async getCharteAcceptanceCount(guildId) {
        try {
            const fs = await import('fs/promises');
            const data = await fs.readFile('data/charte_acceptances.json', 'utf8');
            const acceptances = JSON.parse(data);
            return acceptances.filter(a => a.guildId === guildId).length;
        } catch (error) {
            return 0; // Aucune acceptation trouvée
        }
    }

    static async checkIfUserAccepted(userId, guildId) {
        try {
            const fs = await import('fs/promises');
            const data = await fs.readFile('data/charte_acceptances.json', 'utf8');
            const acceptances = JSON.parse(data);
            return acceptances.some(a => a.userId === userId && a.guildId === guildId);
        } catch (error) {
            return false; // Fichier n'existe pas ou erreur
        }
    }

    static async handleDataDeletionConfirm(interaction, userId) {
        const deleteCommand = interaction.client.commands?.get('delete-my-data');
        if (deleteCommand && deleteCommand.confirmDeletion) {
            await deleteCommand.confirmDeletion(interaction, userId);
        } else {
            await interaction.reply({
                content: '❌ Erreur: Commande de suppression non trouvée.',
                ephemeral: true
            });
        }
    }

    static async handleDataPreview(interaction, userId) {
        await interaction.deferUpdate();

        // Simuler la récupération des données
        const userData = await this.getUserDataPreview(userId, interaction.guild.id);

        const embed = new EmbedBuilder()
            .setTitle('👁️ **APERÇU DES DONNÉES**')
            .setDescription(`**Données stockées pour <@${userId}>**`)
            .addFields(
                {
                    name: '📊 **Résumé des données**',
                    value: `**Messages archivés :** ${userData.messages}\n**Logs modération :** ${userData.moderationLogs}\n**Données utilisateur :** ${userData.userSettings}\n**Statistiques :** ${userData.stats}`,
                    inline: true
                },
                {
                    name: '📅 **Période de conservation**',
                    value: `**Plus ancien :** <t:${userData.oldestData}:d>\n**Plus récent :** <t:${userData.newestData}:d>\n**Prochaine purge :** <t:${userData.nextPurge}:d>`,
                    inline: true
                },
                {
                    name: '🗂️ **Types de données détaillés**',
                    value: `**🔸 Modération :**\n• Avertissements: ${userData.details.warnings}\n• Sanctions: ${userData.details.sanctions}\n• Notes: ${userData.details.notes}\n\n**🔸 Activité :**\n• Messages supprimés: ${userData.details.deletedMessages}\n• Statistiques d'usage: ${userData.details.usageStats}\n\n**🔸 Configuration :**\n• Préférences: ${userData.details.preferences}\n• Notifications: ${userData.details.notifications}`,
                    inline: false
                },
                {
                    name: '⚠️ **Important**',
                    value: `Ces données seront **définitivement supprimées** si vous confirmez la suppression. Cette action est **irréversible**.`,
                    inline: false
                }
            )
            .setColor('#ffc107')
            .setThumbnail('https://i.imgur.com/s74nSIc.png')
            .setTimestamp()
            .setFooter({ 
                text: 'Aperçu des données • RGPD Article 15',
                iconURL: 'https://i.imgur.com/s74nSIc.png'
            });

        const actionRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`delete_data_confirm_${userId}`)
                    .setLabel('🗑️ Confirmer suppression')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId('delete_data_cancel')
                    .setLabel('❌ Annuler')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId(`export_before_delete_${userId}`)
                    .setLabel('📥 Exporter avant suppression')
                    .setStyle(ButtonStyle.Primary)
            );

        await interaction.editReply({
            embeds: [embed],
            components: [actionRow]
        });
    }

    static async getUserDataPreview(userId, guildId) {
        // Simulation des données utilisateur
        const now = Date.now();
        return {
            messages: 147,
            moderationLogs: 12,
            userSettings: 1,
            stats: 8,
            oldestData: Math.floor((now - 90*24*60*60*1000) / 1000),
            newestData: Math.floor(now / 1000),
            nextPurge: Math.floor((now + 30*24*60*60*1000) / 1000),
            details: {
                warnings: 3,
                sanctions: 1,
                notes: 2,
                deletedMessages: 23,
                usageStats: 15,
                preferences: 5,
                notifications: 3
            }
        };
    }
}
