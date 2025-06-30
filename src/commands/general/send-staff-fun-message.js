import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('send-staff-fun-message')
        .setDescription('Envoie le message du document Staff Fun')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        try {
            const channelId = '1368929983942098945'; // Canal Staff Fun
            console.log(`🔍 Recherche du canal avec ID: ${channelId}`);
            const channel = interaction.guild.channels.cache.get(channelId);
            console.log(`📍 Canal trouvé: ${channel ? channel.name : 'INTROUVABLE'} (ID: ${channel ? channel.id : 'N/A'})`);

            if (!channel) {
                return await interaction.reply({
                    content: `❌ Canal introuvable avec l'ID: ${channelId}`,
                    ephemeral: true
                });
            }

            const staffFunEmbed = new EmbedBuilder()
                .setColor('#FF6600')
                .setAuthor({
                    name: '📋 Document Staff Fun - Team 7',
                    iconURL: interaction.guild.iconURL({ dynamic: true })
                })
                .setTitle('🎯 **FORMATION STAFF FUN - DOCUMENT OBLIGATOIRE**')
                .setDescription(`
> **Chère <@&1387714014578085898>, vous trouverez ci-joint un document qui sera à remplir par vous-même et vos équipes.**

## 📝 **Utilisation du document :**

**📌 Le document doit être rempli lors de :**
• **Arrivée d'un joueur** sur le Discord
• **Recrutement** d'un nouveau membre
• **Départ** d'un joueur

**💡 Une case sur le document vous permet de rentrer toute information concernant un joueur :**
• Informations **positives**
• Informations **négatives**
• Commentaires et observations

**🎓 L'ensemble du <@&1387550828646371378> sera formé sur ce document**`)
                .addFields(
                    {
                        name: '🔗 **Lien du document**',
                        value: '[📊 DOC STAFF FUN TEAM 7](https://docs.google.com/spreadsheets/d/1vOPPlGlwin1xrxu_W68hvG8g2myxOwHZwLZZMx8g9Dg/edit?usp=sharing)',
                        inline: false
                    },
                    {
                        name: '⚠️ **Important**',
                        value: '• Document **obligatoire** pour tous\n• Formation **prévue** pour l\'équipe\n• Suivi **régulier** requis',
                        inline: true
                    },
                    {
                        name: '🎯 **Objectifs**',
                        value: '• **Traçabilité** des joueurs\n• **Amélioration** continue\n• **Communication** efficace',
                        inline: true
                    }
                )
                .setImage('https://media.discordapp.net/attachments/1302709447063375932/1388081934210695268/IMG_2582.jpg?ex=6863a40a&is=6862528a&hm=02e0af742d1932199da182d47eee86b27bd8d88df9fdf5a93e23310827485fe1&=&format=webp&width=902&height=958')
                .setThumbnail(interaction.guild.iconURL({ dynamic: true, size: 256 }))
                .setFooter({ 
                    text: '🔥 Team 7 • Staff Fun • Excellence • Professionnalisme 🔥',
                    iconURL: interaction.client.user.displayAvatarURL({ dynamic: true })
                })
                .setTimestamp();

            await channel.send({
                content: '🚨 **ATTENTION <@&1387714014578085898> & <@&1387550828646371378>** 🚨',
                embeds: [staffFunEmbed]
            });

            await interaction.reply({
                content: `✅ Message Staff Fun envoyé avec succès dans ${channel}`,
                ephemeral: true
            });

        } catch (error) {
            console.error('Erreur lors de l\'envoi du message Staff Fun:', error);
            try {
                await interaction.reply({
                    content: '❌ Une erreur est survenue lors de l\'envoi du message.',
                    ephemeral: true
                });
            } catch (replyError) {
                console.error('Impossible de répondre à l\'interaction:', replyError);
            }
        }
    }
};
