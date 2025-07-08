import Logger from '../utils/Logger.js';
import { EmbedBuilder, MessageFlags } from 'discord.js';

const logger = new Logger();

export async function handleIAButtons(interaction) {
    const { customId } = interaction;

    try {
        if (customId.startsWith('ia_deploy_')) {
            await handleIADeploy(interaction);
        }
        else if (customId.startsWith('ia_customize_')) {
            await handleIACustomize(interaction);
        }
        else if (customId.startsWith('ia_alternatives_')) {
            await handleIAAlternatives(interaction);
        }
        else if (customId.startsWith('ia_export_json_')) {
            await handleIAExportJSON(interaction);
        }
        else if (customId.startsWith('ia_save_template_')) {
            await handleIASaveTemplate(interaction);
        }
        else if (customId.startsWith('ia_analytics_')) {
            await handleIAAnalytics(interaction);
        }

    } catch (error) {
        logger.error('Erreur lors de la gestion des boutons IA:', error);
        
        try {
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                    content: '❌ Une erreur est survenue lors du traitement IA.',
                    flags: MessageFlags.Ephemeral
                });
            }
        } catch (replyError) {
            logger.error('Impossible de répondre à l\'erreur IA:', replyError);
        }
    }
}

async function handleIADeploy(interaction) {
    try {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const userId = interaction.customId.split('_')[2];
        if (userId !== interaction.user.id) {
            return await interaction.editReply({
                content: '❌ Vous ne pouvez pas utiliser cette interaction.'
            });
        }

        const iaData = interaction.client.embedIA?.get(interaction.user.id);
        if (!iaData) {
            return await interaction.editReply({
                content: '❌ Données IA expirées. Veuillez relancer la génération.'
            });
        }

        const targetChannel = interaction.guild.channels.cache.get(iaData.channelId) || interaction.channel;
        const sentMessage = await targetChannel.send({ embeds: [iaData.generatedEmbed] });

        logger.success(`Embed IA déployé par ${interaction.user.tag} dans #${targetChannel.name}`);

        await interaction.editReply({
            content: `🚀 **Embed déployé avec succès !**\n\n📍 **Canal :** ${targetChannel}\n🆔 **Message ID :** \`${sentMessage.id}\`\n🧠 **Généré par IA** avec un score de qualité de **${iaData.analysis.qualityScore}/100**\n\n[🔗 Aller au message](${sentMessage.url})`
        });

    } catch (error) {
        logger.error('Erreur lors du déploiement IA:', error);
        await interaction.editReply({
            content: '❌ Erreur lors du déploiement de l\'embed.'
        });
    }
}

async function handleIACustomize(interaction) {
    try {
        const userId = interaction.customId.split('_')[2];
        if (userId !== interaction.user.id) {
            return await interaction.reply({
                content: '❌ Vous ne pouvez pas utiliser cette interaction.',
                flags: MessageFlags.Ephemeral
            });
        }

        const iaData = interaction.client.embedIA?.get(interaction.user.id);
        if (!iaData) {
            return await interaction.reply({
                content: '❌ Données IA expirées. Veuillez relancer la génération.',
                flags: MessageFlags.Ephemeral
            });
        }

        const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = await import('discord.js');
        
        const customizeModal = new ModalBuilder()
            .setCustomId('ia_customize_modal')
            .setTitle('⚙️ Personnaliser l\'Embed IA');

        const titleInput = new TextInputBuilder()
            .setCustomId('ia_custom_title')
            .setLabel('📋 Titre')
            .setStyle(TextInputStyle.Short)
            .setValue(iaData.generatedContent.title)
            .setRequired(true)
            .setMaxLength(256);

        const descriptionInput = new TextInputBuilder()
            .setCustomId('ia_custom_description')
            .setLabel('📄 Description')
            .setStyle(TextInputStyle.Paragraph)
            .setValue(iaData.generatedContent.description)
            .setRequired(true)
            .setMaxLength(4096);

        const colorInput = new TextInputBuilder()
            .setCustomId('ia_custom_color')
            .setLabel('🎨 Couleur (hex)')
            .setStyle(TextInputStyle.Short)
            .setValue(iaData.generatedContent.color)
            .setRequired(false);

        customizeModal.addComponents(
            new ActionRowBuilder().addComponents(titleInput),
            new ActionRowBuilder().addComponents(descriptionInput),
            new ActionRowBuilder().addComponents(colorInput)
        );

        await interaction.showModal(customizeModal);

    } catch (error) {
        await interaction.reply({
            content: '❌ Erreur lors de la personnalisation.',
            flags: MessageFlags.Ephemeral
        });
    }
}

async function handleIAAlternatives(interaction) {
    try {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const userId = interaction.customId.split('_')[2];
        if (userId !== interaction.user.id) {
            return await interaction.editReply({
                content: '❌ Vous ne pouvez pas utiliser cette interaction.'
            });
        }

        const iaData = interaction.client.embedIA?.get(interaction.user.id);
        if (!iaData) {
            return await interaction.editReply({
                content: '❌ Données IA expirées. Veuillez relancer la génération.'
            });
        }

        const alternatives = generateIAAlternatives(iaData.analysis, iaData.originalDescription);

        const alternativesEmbed = new EmbedBuilder()
            .setTitle('🔄 ALTERNATIVES IA GÉNÉRÉES')
            .setDescription('Voici 3 alternatives générées par l\'IA pour votre embed :')
            .setColor('#ff6b9d')
            .setFooter({ text: 'Alternatives IA', iconURL: interaction.client.user.displayAvatarURL() })
            .setTimestamp();

        alternatives.forEach((alt, index) => {
            alternativesEmbed.addFields({
                name: `${index + 1}️⃣ ${alt.title}`,
                value: `${alt.description.substring(0, 200)}${alt.description.length > 200 ? '...' : ''}\n**Style :** ${alt.style}`,
                inline: false
            });
        });

        await interaction.editReply({
            embeds: [alternativesEmbed]
        });

    } catch (error) {
        logger.error('Erreur lors de la génération d\'alternatives:', error);
        await interaction.editReply({
            content: '❌ Erreur lors de la génération d\'alternatives.'
        });
    }
}

async function handleIAExportJSON(interaction) {
    try {
        const userId = interaction.customId.split('_')[3];
        if (userId !== interaction.user.id) {
            return await interaction.reply({
                content: '❌ Vous ne pouvez pas utiliser cette interaction.',
                flags: MessageFlags.Ephemeral
            });
        }

        const iaData = interaction.client.embedIA?.get(interaction.user.id);
        if (!iaData) {
            return await interaction.reply({
                content: '❌ Données IA expirées. Veuillez relancer la génération.',
                flags: MessageFlags.Ephemeral
            });
        }

        const embedJson = JSON.stringify(iaData.generatedEmbed.toJSON(), null, 2);
        
        await interaction.reply({
            content: `📤 **Export JSON de votre Embed IA :**\n\n\`\`\`json\n${embedJson.substring(0, 1800)}\n\`\`\`${embedJson.length > 1800 ? '\n*JSON tronqué pour l\'affichage*' : ''}\n\n💡 **Copiez ce code pour le réutiliser avec** \`/embed json import\``,
            flags: MessageFlags.Ephemeral
        });

    } catch (error) {
        await interaction.reply({
            content: '❌ Erreur lors de l\'export JSON.',
            flags: MessageFlags.Ephemeral
        });
    }
}

async function handleIASaveTemplate(interaction) {
    try {
        const userId = interaction.customId.split('_')[3];
        if (userId !== interaction.user.id) {
            return await interaction.reply({
                content: '❌ Vous ne pouvez pas utiliser cette interaction.',
                flags: MessageFlags.Ephemeral
            });
        }

        const iaData = interaction.client.embedIA?.get(interaction.user.id);
        if (!iaData) {
            return await interaction.reply({
                content: '❌ Données IA expirées. Veuillez relancer la génération.',
                flags: MessageFlags.Ephemeral
            });
        }

        if (!interaction.client.embedFavorites) {
            interaction.client.embedFavorites = new Map();
        }

        const userFavorites = interaction.client.embedFavorites.get(interaction.user.id) || [];
        
        const newFavorite = {
            name: `IA - ${iaData.analysis.context}`,
            type: 'IA Generated',
            createdAt: new Date().toLocaleDateString('fr-FR'),
            data: iaData.generatedEmbed.toJSON(),
            analysis: iaData.analysis
        };

        userFavorites.push(newFavorite);
        interaction.client.embedFavorites.set(interaction.user.id, userFavorites);

        await interaction.reply({
            content: `💾 **Template sauvegardé !**\n\n📝 **Nom :** ${newFavorite.name}\n📅 **Date :** ${newFavorite.createdAt}\n🧠 **Score IA :** ${iaData.analysis.qualityScore}/100\n\n✨ Utilisez \`/embed favoris list\` pour voir tous vos favoris.`,
            flags: MessageFlags.Ephemeral
        });

    } catch (error) {
        await interaction.reply({
            content: '❌ Erreur lors de la sauvegarde.',
            flags: MessageFlags.Ephemeral
        });
    }
}

async function handleIAAnalytics(interaction) {
    try {
        const userId = interaction.customId.split('_')[2];
        if (userId !== interaction.user.id) {
            return await interaction.reply({
                content: '❌ Vous ne pouvez pas utiliser cette interaction.',
                flags: MessageFlags.Ephemeral
            });
        }

        const iaData = interaction.client.embedIA?.get(interaction.user.id);
        if (!iaData) {
            return await interaction.reply({
                content: '❌ Données IA expirées. Veuillez relancer la génération.',
                flags: MessageFlags.Ephemeral
            });
        }

        const analyticsEmbed = new EmbedBuilder()
            .setTitle('📊 ANALYTICS IA DÉTAILLÉES')
            .setDescription('Analyse complète de votre embed généré par l\'IA')
            .setColor('#00d2d3')
            .addFields(
                { name: '🎯 Contexte détecté', value: iaData.analysis.context, inline: true },
                { name: '🎨 Style appliqué', value: iaData.analysis.styleDescription, inline: true },
                { name: '📊 Score de qualité', value: `${iaData.analysis.qualityScore}/100`, inline: true },
                { name: '🔤 Longueur description', value: `${iaData.originalDescription.length} caractères`, inline: true },
                { name: '📝 Ton utilisé', value: iaData.tone, inline: true },
                { name: '⏱️ Généré le', value: new Date(iaData.timestamp).toLocaleString('fr-FR'), inline: true },
                { name: '🔥 Points forts', value: iaData.analysis.strengths.map(s => `• ${s}`).join('\n'), inline: false },
                { name: '🎨 Couleur choisie', value: iaData.analysis.color, inline: true },
                { name: '📋 Champs générés', value: `${iaData.generatedContent.fields?.length || 0} champs`, inline: true }
            )
            .setFooter({ text: 'Analytics IA Avancées', iconURL: interaction.client.user.displayAvatarURL() })
            .setTimestamp();

        await interaction.reply({
            embeds: [analyticsEmbed],
            flags: MessageFlags.Ephemeral
        });

    } catch (error) {
        await interaction.reply({
            content: '❌ Erreur lors de la génération des analytics.',
            flags: MessageFlags.Ephemeral
        });
    }
}

function generateIAAlternatives(analysis, originalDescription) {
    const alternatives = [];
    
    alternatives.push({
        title: '🎨 STYLE ALTERNATIF',
        description: `**Approche Créative**\n\n${originalDescription}\n\n*Cette version met l'accent sur l'aspect visuel et créatif de votre message.*`,
        style: 'Créatif & Visuel'
    });

    alternatives.push({
        title: '📋 VERSION PROFESSIONNELLE',
        description: `**Communication Officielle**\n\nNous souhaitons porter à votre attention les informations suivantes :\n\n${originalDescription}\n\n*Cette communication s'inscrit dans le cadre de nos échanges officiels.*`,
        style: 'Formel & Professionnel'
    });

    alternatives.push({
        title: '😊 VERSION CONVIVIALE',
        description: `**Hey la communauté ! 👋**\n\n${originalDescription}\n\nOn espère que ça vous plaira ! N'hésitez pas si vous avez des questions ! 😄`,
        style: 'Décontracté & Amical'
    });

    return alternatives;
}
