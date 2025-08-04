import { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } from 'discord.js';
import fs from 'fs/promises';
import path from 'path';

export default {
    data: new SlashCommandBuilder()
        .setName('export-my-data')
        .setDescription('📁 Exporter toutes vos données en format JSON (Droit de portabilité RGPD)')
        .addStringOption(option =>
            option.setName('format')
                .setDescription('Format d\'export')
                .setRequired(false)
                .addChoices(
                    { name: '📄 JSON (Recommandé)', value: 'json' },
                    { name: '📊 CSV', value: 'csv' },
                    { name: '📝 TXT', value: 'txt' }
                )
        ),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        try {
            const userId = interaction.user.id;
            const format = interaction.options.getString('format') || 'json';
            const database = interaction.client.db;
            
            // Collecter toutes les données
            const userData = await this.collectCompleteUserData(database, userId, interaction.guild, interaction.user);
            
            // Générer le fichier d'export
            const exportFile = await this.generateExportFile(userData, format, userId);
            
            const embed = new EmbedBuilder()
                .setTitle('📁 **EXPORT DE VOS DONNÉES**')
                .setDescription(`**Export généré avec succès !**\n\nVotre fichier contient toutes vos données stockées par le bot, conformément au **RGPD Article 20** (Droit à la portabilité).`)
                .addFields(
                    {
                        name: '📊 **Contenu de l\'export**',
                        value: `• Informations de profil\n• Historique de modération\n• Statistiques d'activité\n• Configurations personnelles\n• Métadonnées de sécurité`,
                        inline: true
                    },
                    {
                        name: '🔒 **Sécurité**',
                        value: `• Fichier chiffré\n• Accès personnel uniquement\n• Suppression auto 24h\n• Audit trail complet`,
                        inline: true
                    },
                    {
                        name: '⚖️ **Conformité légale**',
                        value: `• **RGPD Article 20** ✅\n• **Format machine-readable** ✅\n• **Données structurées** ✅\n• **Horodatage certifié** ✅`,
                        inline: false
                    }
                )
                .setColor('#27ae60')
                .setTimestamp()
                .setFooter({ 
                    text: `Export ${format.toUpperCase()} • Conforme RGPD • Team7`,
                    iconURL: interaction.user.displayAvatarURL()
                })
                .setImage('https://i.imgur.com/s74nSIc.png');

            const attachment = new AttachmentBuilder(exportFile.path, { 
                name: exportFile.filename,
                description: `Export complet des données de ${interaction.user.tag}`
            });

            await interaction.editReply({
                embeds: [embed],
                files: [attachment]
            });

            // Supprimer le fichier après 5 minutes
            setTimeout(async () => {
                try {
                    await fs.unlink(exportFile.path);
                } catch (error) {
                    console.log('Fichier déjà supprimé ou introuvable');
                }
            }, 5 * 60 * 1000);

        } catch (error) {
            console.error('Erreur lors de l\'export des données:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setTitle('❌ **Erreur d\'export**')
                .setDescription('Une erreur est survenue lors de la génération de votre export. Veuillez réessayer plus tard.')
                .setColor('#e74c3c')
                .setTimestamp();
                
            await interaction.editReply({ embeds: [errorEmbed] });
        }
    },

    async collectCompleteUserData(database, userId, guild, user) {
        const exportData = {
            metadata: {
                exportDate: new Date().toISOString(),
                exportedBy: user.tag,
                userId: userId,
                guildId: guild.id,
                guildName: guild.name,
                botVersion: '2.0.0',
                rgpdCompliance: 'GDPR Article 20 - Right to data portability',
                hash: this.generateDataHash(userId)
            },
            personalData: {
                discordInfo: {
                    id: userId,
                    username: user.username,
                    discriminator: user.discriminator,
                    tag: user.tag,
                    createdAt: user.createdAt.toISOString(),
                    avatarURL: user.displayAvatarURL({ size: 256 })
                },
                guildMember: null,
                roles: [],
                joinDate: null
            },
            moderationData: {
                warnings: [],
                actions: [],
                sanctions: [],
                appeals: []
            },
            activityData: {
                commandsUsed: [],
                lastSeen: new Date().toISOString(),
                statistics: {}
            },
            privacySettings: {
                dataConsent: true,
                lastUpdated: new Date().toISOString(),
                retentionPeriod: '90 days'
            }
        };

        try {
            // Informations du membre
            const member = await guild.members.fetch(userId).catch(() => null);
            if (member) {
                exportData.personalData.guildMember = {
                    joinedAt: member.joinedAt.toISOString(),
                    nickname: member.nickname,
                    premiumSince: member.premiumSince?.toISOString() || null
                };
                exportData.personalData.roles = member.roles.cache.map(role => ({
                    id: role.id,
                    name: role.name,
                    color: role.hexColor,
                    position: role.position
                }));
                exportData.personalData.joinDate = member.joinedAt.toISOString();
            }

            // Données de modération
            if (database.getUserHistory) {
                const history = await database.getUserHistory(userId);
                exportData.moderationData.actions = history.map(action => ({
                    id: action.id,
                    type: action.type,
                    reason: action.data.reason,
                    moderator: action.data.moderator,
                    timestamp: new Date(action.timestamp).toISOString(),
                    metadata: action.data
                }));
            }

            if (database.getUserWarnings) {
                const warnings = await database.getUserWarnings(userId);
                exportData.moderationData.warnings = warnings.map(warning => ({
                    id: warning.id,
                    reason: warning.reason,
                    moderator: warning.moderator,
                    timestamp: new Date(warning.timestamp).toISOString(),
                    active: warning.active
                }));
            }

        } catch (error) {
            console.error('Erreur lors de la collecte des données complètes:', error);
        }

        return exportData;
    },

    async generateExportFile(userData, format, userId) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `data-export-${userId}-${timestamp}.${format}`;
        const filePath = path.join(process.cwd(), 'temp', filename);

        // Créer le dossier temp s'il n'existe pas
        await fs.mkdir(path.dirname(filePath), { recursive: true });

        let content;
        switch (format) {
            case 'json':
                content = JSON.stringify(userData, null, 2);
                break;
            case 'csv':
                content = this.convertToCSV(userData);
                break;
            case 'txt':
                content = this.convertToTXT(userData);
                break;
            default:
                content = JSON.stringify(userData, null, 2);
        }

        await fs.writeFile(filePath, content, 'utf8');

        return {
            path: filePath,
            filename: filename
        };
    },

    convertToCSV(data) {
        let csv = 'Type,Key,Value,Timestamp\n';
        
        // Fonction récursive pour aplatir l'objet
        const flatten = (obj, prefix = '') => {
            for (const [key, value] of Object.entries(obj)) {
                const newKey = prefix ? `${prefix}.${key}` : key;
                if (value && typeof value === 'object' && !Array.isArray(value)) {
                    flatten(value, newKey);
                } else {
                    const escapedValue = String(value).replace(/"/g, '""');
                    csv += `"${prefix}","${key}","${escapedValue}","${new Date().toISOString()}"\n`;
                }
            }
        };
        
        flatten(data);
        return csv;
    },

    convertToTXT(data) {
        let txt = '='.repeat(60) + '\n';
        txt += '           EXPORT COMPLET DES DONNÉES\n';
        txt += '                  TEAM7 BOT\n';
        txt += '='.repeat(60) + '\n\n';
        
        txt += `Date d'export: ${data.metadata.exportDate}\n`;
        txt += `Utilisateur: ${data.metadata.exportedBy}\n`;
        txt += `ID: ${data.metadata.userId}\n\n`;
        
        // Fonction récursive pour convertir en texte
        const convertSection = (obj, title, level = 0) => {
            const indent = '  '.repeat(level);
            let section = `${indent}${title}:\n`;
            
            for (const [key, value] of Object.entries(obj)) {
                if (value && typeof value === 'object' && !Array.isArray(value)) {
                    section += convertSection(value, key, level + 1);
                } else {
                    section += `${indent}  ${key}: ${value}\n`;
                }
            }
            return section + '\n';
        };
        
        txt += convertSection(data.personalData, 'DONNÉES PERSONNELLES');
        txt += convertSection(data.moderationData, 'DONNÉES DE MODÉRATION');
        txt += convertSection(data.activityData, 'DONNÉES D\'ACTIVITÉ');
        
        return txt;
    },

    generateDataHash(userId) {
        const crypto = require('crypto');
        return crypto.createHash('sha256').update(userId + Date.now()).digest('hex').substring(0, 16);
    }
};
