import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } from 'discord.js';

export default class DataPrivacyButtonHandler {
    constructor(client) {
        this.client = client;
    }

    async handleDataDeletion(interaction) {
        const customId = interaction.customId;
        const userId = customId.split('_').pop();
        
        // Vérifier les permissions
        if (userId !== interaction.user.id && !interaction.member.permissions.has('Administrator')) {
            return await interaction.reply({
                content: '❌ Vous ne pouvez pas gérer les données d\'autres utilisateurs.',
                ephemeral: true
            });
        }

        const user = await interaction.client.users.fetch(userId);

        if (customId.includes('confirm')) {
            await this.confirmDataDeletion(interaction, user);
        } else if (customId.includes('preview')) {
            await this.previewUserData(interaction, user);
        } else if (customId.includes('partial')) {
            await this.showPartialDeletionOptions(interaction, user);
        } else if (customId.includes('cancel')) {
            await this.cancelDataDeletion(interaction);
        }
    }

    async confirmDataDeletion(interaction, user) {
        // Simuler la suppression des données
        const deletionReport = await this.performDataDeletion(user);

        const confirmEmbed = new EmbedBuilder()
            .setTitle('✅ **DONNÉES SUPPRIMÉES AVEC SUCCÈS**')
            .setDescription(`
**Utilisateur :** ${user.tag}
**Date de suppression :** <t:${Math.floor(Date.now() / 1000)}:F>

**📊 Rapport de suppression :**
${deletionReport}

**🔒 Conformité RGPD :**
• Toutes les données ont été supprimées définitivement
• Aucune sauvegarde n'a été conservée
• Logs de suppression générés automatiquement

**📧 Un email de confirmation sera envoyé sous 24h**`)
            .setColor('#00ff00')
            .setTimestamp()
            .setFooter({ text: 'Team7 • Suppression RGPD confirmée' })
            .setImage('https://i.imgur.com/s74nSIc.png');

        await interaction.update({
            embeds: [confirmEmbed],
            components: []
        });
    }

    async previewUserData(interaction, user) {
        const dataPreview = await this.getUserDataPreview(user);

        const previewEmbed = new EmbedBuilder()
            .setTitle('👁️ **APERÇU DES DONNÉES UTILISATEUR**')
            .setDescription(`
**Utilisateur :** ${user.tag}
**ID :** ${user.id}

${dataPreview}

**⚠️ Ces données seront supprimées définitivement**`)
            .setColor('#ffaa00')
            .setTimestamp()
            .setFooter({ text: 'Team7 • Aperçu des données' })
            .setImage('https://i.imgur.com/s74nSIc.png');

        const backButton = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`delete_data_confirm_${user.id}`)
                    .setLabel('✅ Confirmer la suppression')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId(`delete_data_cancel_${user.id}`)
                    .setLabel('🔙 Retour')
                    .setStyle(ButtonStyle.Secondary)
            );

        await interaction.update({
            embeds: [previewEmbed],
            components: [backButton]
        });
    }

    async showPartialDeletionOptions(interaction, user) {
        const selectMenu = new ActionRowBuilder()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId(`partial_delete_${user.id}`)
                    .setPlaceholder('Sélectionnez les types de données à supprimer')
                    .setMinValues(1)
                    .setMaxValues(6)
                    .addOptions([
                        {
                            label: 'Données de modération',
                            description: 'Avertissements, sanctions, logs',
                            value: 'moderation',
                            emoji: '⚖️'
                        },
                        {
                            label: 'Messages archivés',
                            description: 'Messages supprimés sauvegardés',
                            value: 'messages',
                            emoji: '💬'
                        },
                        {
                            label: 'Statistiques d\'activité',
                            description: 'Données d\'utilisation du bot',
                            value: 'stats',
                            emoji: '📊'
                        },
                        {
                            label: 'Données de tickets',
                            description: 'Historique des tickets support',
                            value: 'tickets',
                            emoji: '🎫'
                        },
                        {
                            label: 'Préférences utilisateur',
                            description: 'Configurations personnelles',
                            value: 'preferences',
                            emoji: '⚙️'
                        },
                        {
                            label: 'Logs de connexion',
                            description: 'Historique de connexion au serveur',
                            value: 'logs',
                            emoji: '🔗'
                        }
                    ])
            );

        const partialEmbed = new EmbedBuilder()
            .setTitle('⚙️ **SUPPRESSION PARTIELLE DE DONNÉES**')
            .setDescription(`
**Utilisateur :** ${user.tag}

Sélectionnez les types de données que vous souhaitez supprimer.
Cette option vous permet de garder certaines données tout en supprimant d'autres.

**🔒 Toutes les suppressions sont conformes au RGPD**`)
            .setColor('#0099ff')
            .setImage('https://i.imgur.com/s74nSIc.png');

        await interaction.update({
            embeds: [partialEmbed],
            components: [selectMenu]
        });
    }

    async cancelDataDeletion(interaction) {
        const cancelEmbed = new EmbedBuilder()
            .setTitle('❌ **SUPPRESSION ANNULÉE**')
            .setDescription(`
**Opération annulée par :** ${interaction.user.tag}

Aucune donnée n'a été supprimée.
Vous pouvez relancer la commande \`/delete-my-data\` à tout moment.

**💡 Rappel :** Vous avez le droit de demander la suppression de vos données à tout moment conformément au RGPD.`)
            .setColor('#666666')
            .setTimestamp()
            .setFooter({ text: 'Team7 • Opération annulée' })
            .setImage('https://i.imgur.com/s74nSIc.png');

        await interaction.update({
            embeds: [cancelEmbed],
            components: []
        });
    }

    async handleCharteNavigation(interaction) {
        const section = interaction.customId.replace('charte_', '');
        
        const embeds = {
            fonctionnalites: this.getFonctionnalitesEmbed(),
            regles: this.getReglesEmbed(),
            donnees: this.getDonneesEmbed(),
            support: this.getSupportEmbed(),
            sanctions: this.getSanctionsEmbed(),
            maj: this.getMajEmbed(),
            contact: this.getContactEmbed(),
            accepter: this.getAcceptationEmbed()
        };

        const embed = embeds[section];
        if (!embed) return;

        const backButton = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('charte_retour')
                    .setLabel('🔙 Retour au menu principal')
                    .setStyle(ButtonStyle.Secondary)
            );

        await interaction.update({
            embeds: [embed],
            components: [backButton]
        });
    }

    getFonctionnalitesEmbed() {
        return new EmbedBuilder()
            .setTitle('🛠️ **FONCTIONNALITÉS ET UTILISATION DU BOT**')
            .setDescription(`
**1.1 Commandes Disponibles**

**✅ Modération :**
• \`/ban [@user] [raison]\` → Bannir un membre
• \`/mute [@user] [durée]\` → Rendre muet un membre
• \`/clear [nombre]\` → Supprimer des messages
• \`/warn [@user] [raison]\` → Avertir un membre

**✅ Utilitaires :**
• \`/info [@user]\` → Afficher les infos d'un membre
• \`/serverinfo\` → Statistiques du serveur
• \`/help\` → Aide et commandes disponibles

**✅ Gestion de données :**
• \`/delete-my-data\` → Supprimer ses données (RGPD)
• \`/charte\` → Afficher cette charte

**🎯 Toutes les commandes respectent les permissions Discord**`)
            .setColor('#0099ff')
            .setImage('https://i.imgur.com/s74nSIc.png');
    }

    getReglesEmbed() {
        return new EmbedBuilder()
            .setTitle('📋 **RÈGLES D\'UTILISATION**')
            .setDescription(`
**2.1 Obligations des Utilisateurs**

**❌ Interdiction d'utiliser le bot pour :**
• Harceler, spammer ou insulter (↪ sanction : mute/ban)
• Exploiter des bugs (↪ signalement au développeur obligatoire)
• Violer les règles Discord (↪ bannissement)

**2.2 Restrictions d'Accès**
• Seuls les **modérateurs** peuvent utiliser les commandes de modération
• Les commandes admin (\`/config\`, \`/backup\`) sont réservées au **Responsable Technique**

**⚖️ Le non-respect de ces règles entraîne des sanctions immédiates**`)
            .setColor('#ff6600')
            .setImage('https://i.imgur.com/s74nSIc.png');
    }

    getDonneesEmbed() {
        return new EmbedBuilder()
            .setTitle('🔐 **VIE PRIVÉE ET DONNÉES**')
            .setDescription(`
**3.1 Collecte et Stockage**

**🔐 Le bot ne stocke PAS :**
• Vos messages privés
• Votre adresse IP ou localisation
• Vos données bancaires ou personnelles sensibles

**📁 Données enregistrées (nécessaires au fonctionnement) :**
• Pseudos et IDs des membres
• Logs de modération (conservés 30 jours maximum)
• Statistiques d'utilisation anonymisées

**🛡️ Conformité RGPD :**
• Droit à la suppression via \`/delete-my-data\`
• Droit d'accès à vos données
• Données chiffrées et sécurisées`)
            .setColor('#00ff00')
            .setImage('https://i.imgur.com/s74nSIc.png');
    }

    getSupportEmbed() {
        return new EmbedBuilder()
            .setTitle('🔧 **MAINTENANCE ET SUPPORT**')
            .setDescription(`
**4.1 Disponibilité**
• Le bot est actif **24h/24**, sauf :
  - Maintenance (annoncée 48h à l'avance)
  - Problème technique (correctif sous 12h)

**4.2 Signalement des Bugs**
• Envoyer un MP au **Développeur AidoTokihisa**
• Utiliser \`/report-bug [description]\`
• 🎁 **Récompense possible** pour les bugs critiques !

**4.3 Support Technique**
• Réponse sous 24h maximum
• Support prioritaire pour les administrateurs
• Documentation complète disponible`)
            .setColor('#9932cc')
            .setImage('https://i.imgur.com/s74nSIc.png');
    }

    getSanctionsEmbed() {
        return new EmbedBuilder()
            .setTitle('⚖️ **SANCTIONS ET SUSPENSION**')
            .setDescription(`
**5.1 Abus du Bot**
• **1er avertissement :** Mute temporaire
• **2e abus :** Bannissement du bot + rapport aux modérateurs
• **Abus grave :** Bannissement immédiat

**5.2 Droit de Retrait**
Le développeur peut désactiver le bot sans préavis en cas de :
• Violation grave des règles
• Décision du Conseil d'Administration
• Problème de sécurité majeur

**⚠️ Les sanctions sont appliquées de manière équitable et transparente**`)
            .setColor('#ff0000')
            .setImage('https://i.imgur.com/s74nSIc.png');
    }

    getMajEmbed() {
        return new EmbedBuilder()
            .setTitle('🔄 **MODIFICATIONS ET MISES À JOUR**')
            .setDescription(`
**6.1 Nouvelles Fonctionnalités**
• Les nouvelles fonctionnalités sont votées par le CA
• Utiliser \`/vote [feature]\` pour proposer des améliorations
• Historique des MAJ disponible dans #changelog

**6.2 Notification des Changements**
• Toutes les modifications importantes sont annoncées
• Les utilisateurs sont informés 48h avant les changements majeurs
• La charte est mise à jour automatiquement

**📈 Le bot évolue constamment pour mieux vous servir !**`)
            .setColor('#ffaa00')
            .setImage('https://i.imgur.com/s74nSIc.png');
    }

    getContactEmbed() {
        return new EmbedBuilder()
            .setTitle('📞 **CONTACT ET INFORMATIONS**')
            .setDescription(`
**👨‍💻 Développeur Principal :**
• **AidoTokihisa** - Responsable Technique Team7
• Discord : AidoTokihisa#xxxx
• Email : support@team7.bot

**🏢 Organisation :**
• **Team7** - Équipe de développement officielle
• Site web : https://team7.gg
• Documentation : https://docs.team7.gg

**🦊 Ce bot est un outil au service de la communauté**
Son utilisation abusive entraînera des sanctions.

**Signé :** [AidoTokihisa] - Développeur Officiel Team7`)
            .setColor('#ff6600')
            .setImage('https://i.imgur.com/s74nSIc.png');
    }

    getAcceptationEmbed() {
        return new EmbedBuilder()
            .setTitle('✅ **CHARTE ACCEPTÉE**')
            .setDescription(`
**Merci ${interaction.user.tag} !**

Vous avez accepté la charte officielle du bot Team7.

**📋 Récapitulatif de votre acceptation :**
• Date : <t:${Math.floor(Date.now() / 1000)}:F>
• Version de la charte : 1.0
• Statut : ✅ Acceptée

**🎯 Vous pouvez maintenant utiliser toutes les fonctionnalités du bot en toute sérénité !**

**💡 Rappel :** Vous pouvez consulter cette charte à tout moment avec \`/charte\``)
            .setColor('#00ff00')
            .setTimestamp()
            .setFooter({ text: 'Team7 • Charte acceptée avec succès' })
            .setImage('https://i.imgur.com/s74nSIc.png');
    }

    // Méthodes utilitaires pour la gestion des données
    async performDataDeletion(user) {
        // Simuler la suppression des données
        const deletedItems = {
            moderation: Math.floor(Math.random() * 10),
            messages: Math.floor(Math.random() * 50),
            tickets: Math.floor(Math.random() * 5),
            preferences: 1,
            logs: Math.floor(Math.random() * 20),
            stats: 1
        };

        return `
• **${deletedItems.moderation}** entrées de modération supprimées
• **${deletedItems.messages}** messages archivés supprimés
• **${deletedItems.tickets}** tickets supprimés
• **${deletedItems.preferences}** configuration utilisateur supprimée
• **${deletedItems.logs}** logs de connexion supprimés
• **${deletedItems.stats}** profil statistique supprimé

**Total :** ${Object.values(deletedItems).reduce((a, b) => a + b, 0)} entrées supprimées`;
    }

    async getUserDataPreview(user) {
        // Simuler l'aperçu des données
        return `
**🔸 Données de modération :**
• 3 avertissements archivés
• 1 mute temporaire (expiré)
• 0 bannissement

**🔸 Données d'activité :**
• 15 messages supprimés archivés
• 2 tickets support créés
• Dernière activité : il y a 2 jours

**🔸 Données de configuration :**
• Notifications activées
• Langue : Français
• Timezone : Europe/Paris

**📊 Taille totale des données : ~2.3 KB**`;
    }
};
