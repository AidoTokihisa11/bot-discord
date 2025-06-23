import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('analyze-server')
        .setDescription('🔍 Analyser les permissions du rôle spécifique sur le serveur')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    
    async execute(interaction) {
        try {
            await interaction.deferReply({ ephemeral: true });

            const guildId = '1368917489160818728';
            const roleId = '1386747036245819452';
            const targetChannelId = '1368918056042102895';
            
            // Vérifier que nous sommes sur le bon serveur
            if (interaction.guild.id !== guildId) {
                return await interaction.editReply({
                    content: '❌ Cette commande ne peut être utilisée que sur le serveur configuré.',
                    ephemeral: true
                });
            }

            const role = interaction.guild.roles.cache.get(roleId);
            const everyoneRole = interaction.guild.roles.everyone;
            const targetChannel = interaction.guild.channels.cache.get(targetChannelId);

            if (!role) {
                return await interaction.editReply({
                    content: '❌ Rôle spécifique introuvable !',
                    ephemeral: true
                });
            }

            // Analyser tous les salons
            const allChannels = interaction.guild.channels.cache.filter(ch => 
                ch.type === 0 || ch.type === 2 || ch.type === 4 || ch.type === 15
            );
            const textChannels = allChannels.filter(ch => ch.type === 0);
            const voiceChannels = allChannels.filter(ch => ch.type === 2);
            const categories = allChannels.filter(ch => ch.type === 4);
            const forumChannels = allChannels.filter(ch => ch.type === 15);

            let analysis = `**🔍 ANALYSE DU RÔLE ${role.name}**\n\n`;
            analysis += `**📊 STATISTIQUES DU SERVEUR:**\n`;
            analysis += `• Serveur: ${interaction.guild.name}\n`;
            analysis += `• Salons texte: ${textChannels.size}\n`;
            analysis += `• Salons vocaux: ${voiceChannels.size}\n`;
            analysis += `• Catégories: ${categories.size}\n`;
            analysis += `• Forums: ${forumChannels.size}\n`;
            analysis += `• Total: ${allChannels.size} salons\n\n`;

            analysis += `**🎯 RÔLE ANALYSÉ:**\n`;
            analysis += `• Nom: ${role.name}\n`;
            analysis += `• ID: ${role.id}\n`;
            analysis += `• Position: ${role.position}\n`;
            analysis += `• Membres avec ce rôle: ${role.members.size}\n\n`;

            // Analyser les permissions du salon de règlement
            analysis += `**📋 SALON DE RÈGLEMENT:**\n`;
            if (targetChannel) {
                analysis += `• Nom: ${targetChannel.name}\n`;
                analysis += `• ID: ${targetChannel.id}\n`;
                
                const everyonePerms = targetChannel.permissionOverwrites.cache.get(everyoneRole.id);
                const rolePerms = targetChannel.permissionOverwrites.cache.get(role.id);
                
                analysis += `• Permissions @everyone: `;
                if (everyonePerms) {
                    const canView = everyonePerms.allow.has(PermissionFlagsBits.ViewChannel);
                    const canSend = !everyonePerms.deny.has(PermissionFlagsBits.SendMessages);
                    analysis += canView ? '✅ Peut voir' : '❌ Ne peut pas voir';
                    analysis += canSend ? ', ✅ Peut écrire' : ', ❌ Ne peut pas écrire';
                } else {
                    analysis += '🔄 Hérité';
                }
                analysis += `\n`;
                
                analysis += `• Permissions ${role.name}: `;
                if (rolePerms) {
                    const canView = rolePerms.allow.has(PermissionFlagsBits.ViewChannel);
                    const canSend = rolePerms.allow.has(PermissionFlagsBits.SendMessages);
                    analysis += canView ? '✅ Peut voir' : '❌ Ne peut pas voir';
                    analysis += canSend ? ', ✅ Peut écrire' : ', ❌ Ne peut pas écrire';
                } else {
                    analysis += '🔄 Hérité';
                }
                analysis += `\n\n`;
            }

            // Analyser les permissions sur tous les autres salons
            let correctChannels = 0;
            let incorrectChannels = 0;
            let problematicChannels = [];

            analysis += `**🔍 ANALYSE DES PERMISSIONS:**\n`;

            for (const [channelId, channel] of allChannels) {
                if (channel.id === targetChannelId) continue; // Ignorer le salon de règlement

                const everyonePerms = channel.permissionOverwrites.cache.get(everyoneRole.id);
                const rolePerms = channel.permissionOverwrites.cache.get(role.id);

                // Vérifier @everyone
                const everyoneCanView = everyonePerms ? 
                    everyonePerms.allow.has(PermissionFlagsBits.ViewChannel) : 
                    true; // Par défaut, @everyone peut voir

                // Vérifier le rôle spécifique
                const roleCanView = rolePerms ? 
                    rolePerms.allow.has(PermissionFlagsBits.ViewChannel) : 
                    true; // Par défaut, le rôle peut voir

                // Configuration correcte : @everyone ne voit pas, rôle spécifique voit
                const isCorrect = !everyoneCanView && roleCanView;

                if (isCorrect) {
                    correctChannels++;
                } else {
                    incorrectChannels++;
                    problematicChannels.push({
                        name: channel.name,
                        type: channel.type === 0 ? 'Texte' : channel.type === 2 ? 'Vocal' : channel.type === 4 ? 'Catégorie' : 'Forum',
                        everyoneCanView,
                        roleCanView
                    });
                }
            }

            analysis += `• ✅ Salons correctement configurés: ${correctChannels}\n`;
            analysis += `• ❌ Salons mal configurés: ${incorrectChannels}\n\n`;

            if (incorrectChannels > 0) {
                analysis += `**⚠️ SALONS PROBLÉMATIQUES:**\n`;
                for (const channel of problematicChannels.slice(0, 10)) {
                    analysis += `• ${channel.name} (${channel.type}): `;
                    analysis += `@everyone ${channel.everyoneCanView ? '✅' : '❌'}, `;
                    analysis += `${role.name} ${channel.roleCanView ? '✅' : '❌'}\n`;
                }
                if (problematicChannels.length > 10) {
                    analysis += `... et ${problematicChannels.length - 10} autres\n`;
                }
                analysis += `\n`;
            }

            // Recommandations
            analysis += `**💡 RECOMMANDATIONS:**\n`;
            if (incorrectChannels === 0) {
                analysis += `✅ Parfait ! Toutes les permissions sont correctement configurées.\n`;
                analysis += `Le système de règlement fonctionne comme prévu :\n`;
                analysis += `• @everyone ne voit que le salon de règlement\n`;
                analysis += `• Le rôle ${role.name} donne accès à tout le serveur\n`;
            } else {
                analysis += `⚠️ ${incorrectChannels} salon(s) nécessitent une correction.\n`;
                analysis += `Utilisez la commande /setup-permissions pour corriger automatiquement.\n`;
            }

            // Créer l'embed
            const embed = new EmbedBuilder()
                .setColor(incorrectChannels === 0 ? '#00ff00' : '#ffaa00')
                .setTitle('🔍 ANALYSE DU SERVEUR')
                .setDescription(analysis)
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Erreur lors de l\'analyse du serveur:', error);
            await interaction.editReply({
                content: '❌ Une erreur est survenue lors de l\'analyse du serveur.',
                ephemeral: true
            });
        }
    },
};
