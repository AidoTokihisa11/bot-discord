import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('reglement')
        .setDescription('📋 Envoie le règlement du serveur avec système de validation')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    
    async execute(interaction) {
        try {
            // Déférer immédiatement pour éviter l'expiration
            await interaction.deferReply({ ephemeral: true });

            const targetChannelId = '1368918056042102895';
            
            const channel = interaction.guild.channels.cache.get(targetChannelId);

            if (!channel) {
                return await interaction.editReply({
                    content: '❌ Canal de règlement introuvable !',
                    ephemeral: true
                });
            }

            // Créer l'embed professionnel du règlement
            const reglementEmbed = new EmbedBuilder()
                .setColor('#2b2d31') // Gris Discord professionnel
                .setTitle('📋 RÈGLEMENT DU SERVEUR')
                .setDescription(`**Bienvenue sur ${interaction.guild.name}**\n\nPour accéder au serveur, vous devez lire et accepter ce règlement en cliquant sur ✅ ci-dessous.`)
                .addFields(
                    {
                        name: '🔒 **1. RESPECT ET COURTOISIE**',
                        value: '• Respectez tous les membres du serveur\n• Aucun harcèlement, insulte ou discrimination\n• Maintenez un comportement poli et bienveillant',
                        inline: false
                    },
                    {
                        name: '💬 **2. COMMUNICATION**',
                        value: '• Utilisez les salons appropriés pour vos messages\n• Évitez le spam et les messages répétitifs\n• Pas de contenu NSFW ou inapproprié',
                        inline: false
                    },
                    {
                        name: '🚫 **3. INTERDICTIONS**',
                        value: '• Aucune publicité sans autorisation préalable\n• Pas de liens suspects ou malveillants\n• Interdiction de contourner les sanctions',
                        inline: false
                    },
                    {
                        name: '🎯 **4. UTILISATION DES SALONS**',
                        value: '• Respectez le sujet de chaque salon\n• Utilisez les threads pour les discussions longues\n• Gardez les salons organisés et propres',
                        inline: false
                    },
                    {
                        name: '👮 **5. MODÉRATION**',
                        value: '• Respectez les décisions de l\'équipe de modération\n• Signalez tout comportement inapproprié\n• Les sanctions vont de l\'avertissement au bannissement',
                        inline: false
                    },
                    {
                        name: '⚠️ **6. DISPOSITIONS GÉNÉRALES**',
                        value: '• Ce règlement peut être modifié à tout moment\n• L\'ignorance du règlement n\'excuse pas sa violation\n• En restant sur ce serveur, vous acceptez ces conditions',
                        inline: false
                    },
                    {
                        name: '✅ **ACCEPTATION**',
                        value: '**Cliquez sur ✅ pour accepter le règlement et accéder au serveur.**\n\n*Cette action est révocable - vous pouvez retirer votre acceptation à tout moment.*',
                        inline: false
                    }
                )
                .setFooter({ 
                    text: `${interaction.guild.name} • Règlement officiel`,
                    iconURL: interaction.guild.iconURL({ dynamic: true })
                })
                .setTimestamp();

            // Envoyer l'embed dans le canal
            const message = await channel.send({
                embeds: [reglementEmbed]
            });

            // Ajouter la réaction
            await message.react('✅');

            // Confirmer l'envoi
            await interaction.editReply({
                content: `✅ Règlement envoyé avec succès dans ${channel} !\n🔗 [Voir le message](${message.url})`,
                ephemeral: true
            });

        } catch (error) {
            console.error('Erreur lors de l\'envoi du règlement:', error);
            try {
                if (interaction.deferred || interaction.replied) {
                    await interaction.editReply({
                        content: '❌ Une erreur est survenue lors de l\'envoi du règlement.',
                        ephemeral: true
                    });
                } else {
                    await interaction.reply({
                        content: '❌ Une erreur est survenue lors de l\'envoi du règlement.',
                        ephemeral: true
                    });
                }
            } catch (replyError) {
                console.error('Impossible de répondre à l\'interaction:', replyError.message);
            }
        }
    },
};
