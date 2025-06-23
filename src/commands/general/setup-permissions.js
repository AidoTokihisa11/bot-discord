import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('setup-permissions')
        .setDescription('⚙️ Configure les permissions du serveur pour le rôle spécifique')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    
    async execute(interaction) {
        try {
            // Déférer immédiatement pour éviter l'expiration
            await interaction.deferReply({ ephemeral: true });

            const guildId = '1368917489160818728';
            const targetChannelId = '1368918056042102895';
            // const roleId = '1386747036245819452'; // Rôle Unity member supprimé
            
            // Vérifier que nous sommes sur le bon serveur
            if (interaction.guild.id !== guildId) {
                return await interaction.editReply({
                    content: '❌ Cette commande ne peut être utilisée que sur le serveur configuré.',
                    ephemeral: true
                });
            }

            const channel = interaction.guild.channels.cache.get(targetChannelId);
            const role = interaction.guild.roles.cache.get(roleId);
            const everyoneRole = interaction.guild.roles.everyone;

            if (!channel) {
                return await interaction.editReply({
                    content: '❌ Canal de règlement introuvable !',
                    ephemeral: true
                });
            }

            if (!role) {
                return await interaction.editReply({
                    content: '❌ Rôle à attribuer introuvable !',
                    ephemeral: true
                });
            }

            let successCount = 0;
            let errorCount = 0;
            const errors = [];

            const embed = new EmbedBuilder()
                .setColor('#2b2d31')
                .setTitle('⚙️ CONFIGURATION DES PERMISSIONS')
                .setDescription('Configuration en cours...')
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });

            // Récupérer tous les salons du serveur
            const allChannels = interaction.guild.channels.cache.filter(ch => 
                ch.type === 0 || ch.type === 2 || ch.type === 4 || ch.type === 15 // Text, Voice, Category, Forum
            );

            console.log(`Configuration de ${allChannels.size} salons pour le rôle ${role.name}`);

            // Configurer chaque salon
            for (const [channelId, currentChannel] of allChannels) {
                try {
                    if (currentChannel.id === targetChannelId) {
                        // Salon de règlement : visible par tous, écriture interdite
                        await currentChannel.permissionOverwrites.edit(everyoneRole, {
                            ViewChannel: true,
                            SendMessages: false,
                            AddReactions: false,
                            ReadMessageHistory: true,
                            UseApplicationCommands: false
                        });
                        successCount++;
                        console.log(`✅ Salon de règlement configuré: ${currentChannel.name}`);
                    } else {
                        // Tous les autres salons : @everyone ne voit pas, rôle spécifique voit tout
                        
                        // Configurer @everyone
                        await currentChannel.permissionOverwrites.edit(everyoneRole, {
                            ViewChannel: false
                        });
                        successCount++;

                        // Configurer le rôle spécifique selon le type de salon
                        if (currentChannel.type === 0) { // Salon texte
                            await currentChannel.permissionOverwrites.edit(role, {
                                ViewChannel: true,
                                SendMessages: true,
                                ReadMessageHistory: true,
                                AddReactions: true,
                                UseApplicationCommands: true,
                                AttachFiles: true,
                                EmbedLinks: true
                            });
                        } else if (currentChannel.type === 2) { // Salon vocal
                            await currentChannel.permissionOverwrites.edit(role, {
                                ViewChannel: true,
                                Connect: true,
                                Speak: true,
                                UseVAD: true,
                                Stream: true
                            });
                        } else if (currentChannel.type === 4) { // Catégorie
                            await currentChannel.permissionOverwrites.edit(role, {
                                ViewChannel: true
                            });
                        } else if (currentChannel.type === 15) { // Forum
                            await currentChannel.permissionOverwrites.edit(role, {
                                ViewChannel: true,
                                SendMessages: true,
                                CreatePublicThreads: true,
                                SendMessagesInThreads: true,
                                ReadMessageHistory: true
                            });
                        }
                        
                        successCount++;
                        console.log(`✅ Salon configuré: ${currentChannel.name} (${currentChannel.type === 0 ? 'Texte' : currentChannel.type === 2 ? 'Vocal' : currentChannel.type === 4 ? 'Catégorie' : 'Forum'})`);
                    }
                } catch (error) {
                    errorCount++;
                    errors.push(`${currentChannel.name}: ${error.message}`);
                    console.error(`❌ Erreur salon ${currentChannel.name}:`, error.message);
                }
            }

            console.log(`Configuration terminée: ${successCount} succès, ${errorCount} erreurs`);

            // Mettre à jour l'embed avec les résultats
            embed.setDescription(`
**📊 RÉSULTATS DE LA CONFIGURATION**

✅ **Permissions configurées avec succès:** ${successCount}
❌ **Erreurs rencontrées:** ${errorCount}

**🔧 Configuration appliquée:**
• **@everyone:** Accès limité au salon de règlement uniquement
• **${role.name}:** Accès complet à tous les salons du serveur
• **Salon de règlement:** Visible par tous, écriture interdite

**📋 Fonctionnement:**
1. Les nouveaux membres ne voient que le salon de règlement
2. Ils doivent cliquer sur ✅ pour accepter le règlement
3. Une fois accepté, ils obtiennent le rôle "${role.name}"
4. Avec ce rôle, ils accèdent à TOUS les salons du serveur
5. S'ils décochent, ils perdent l'accès et ne voient plus que le règlement
`);

            if (errorCount === 0) {
                embed.setColor('#00ff00');
                embed.addFields({
                    name: '🎉 SUCCÈS',
                    value: 'Toutes les permissions ont été configurées correctement !',
                    inline: false
                });
            } else {
                embed.setColor('#ffaa00');
                embed.addFields({
                    name: '⚠️ ATTENTION',
                    value: `Configuration partiellement réussie. ${errorCount} erreur(s) rencontrée(s).`,
                    inline: false
                });

                if (errors.length > 0) {
                    embed.addFields({
                        name: '❌ ERREURS DÉTAILLÉES',
                        value: errors.slice(0, 5).join('\n') + (errors.length > 5 ? `\n... et ${errors.length - 5} autres` : ''),
                        inline: false
                    });
                }
            }

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Erreur lors de la configuration des permissions:', error);
            try {
                if (interaction.deferred || interaction.replied) {
                    await interaction.editReply({
                        content: '❌ Une erreur est survenue lors de la configuration des permissions.',
                        ephemeral: true
                    });
                } else {
                    await interaction.reply({
                        content: '❌ Une erreur est survenue lors de la configuration des permissions.',
                        ephemeral: true
                    });
                }
            } catch (replyError) {
                console.error('Impossible de répondre à l\'interaction:', replyError.message);
            }
        }
    },
};
