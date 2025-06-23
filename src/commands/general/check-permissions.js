import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('check-permissions')
        .setDescription('🔍 Vérifier les permissions du bot pour le système de règlement')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    
    async execute(interaction) {
        try {
            await interaction.deferReply({ ephemeral: true });

            const targetChannelId = '1368918056042102895';
            const roleId = '1386747036245819452';
            
            const channel = interaction.guild.channels.cache.get(targetChannelId);
            const role = interaction.guild.roles.cache.get(roleId);
            const botMember = interaction.guild.members.me;

            const embed = new EmbedBuilder()
                .setColor('#2b2d31')
                .setTitle('🔍 DIAGNOSTIC DES PERMISSIONS')
                .setTimestamp();

            let description = '';
            let allGood = true;

            // Vérifier le canal
            if (channel) {
                description += `✅ **Canal trouvé:** ${channel}\n`;
            } else {
                description += `❌ **Canal introuvable:** \`${targetChannelId}\`\n`;
                allGood = false;
            }

            // Vérifier le rôle
            if (role) {
                description += `✅ **Rôle trouvé:** ${role} (Position: ${role.position})\n`;
            } else {
                description += `❌ **Rôle introuvable:** \`${roleId}\`\n`;
                allGood = false;
            }

            // Vérifier les permissions du bot
            const hasManageRoles = botMember.permissions.has(PermissionFlagsBits.ManageRoles);
            if (hasManageRoles) {
                description += `✅ **Permission "Gérer les rôles":** Accordée\n`;
            } else {
                description += `❌ **Permission "Gérer les rôles":** Manquante\n`;
                allGood = false;
            }

            // Vérifier la hiérarchie des rôles
            if (role && botMember.roles.highest.position > role.position) {
                description += `✅ **Hiérarchie des rôles:** Correcte\n`;
                description += `   • Rôle du bot: ${botMember.roles.highest} (Position: ${botMember.roles.highest.position})\n`;
                description += `   • Rôle à attribuer: ${role} (Position: ${role.position})\n`;
            } else if (role) {
                description += `❌ **Hiérarchie des rôles:** Incorrecte\n`;
                description += `   • Rôle du bot: ${botMember.roles.highest} (Position: ${botMember.roles.highest.position})\n`;
                description += `   • Rôle à attribuer: ${role} (Position: ${role.position})\n`;
                description += `   • **Solution:** Déplacez le rôle du bot au-dessus du rôle à attribuer\n`;
                allGood = false;
            }

            // Vérifier les permissions dans le canal
            if (channel) {
                const canReadMessages = channel.permissionsFor(botMember).has(PermissionFlagsBits.ViewChannel);
                const canAddReactions = channel.permissionsFor(botMember).has(PermissionFlagsBits.AddReactions);
                const canReadHistory = channel.permissionsFor(botMember).has(PermissionFlagsBits.ReadMessageHistory);

                if (canReadMessages && canAddReactions && canReadHistory) {
                    description += `✅ **Permissions dans le canal:** Toutes accordées\n`;
                } else {
                    description += `❌ **Permissions dans le canal:** Manquantes\n`;
                    if (!canReadMessages) description += `   • Voir le canal: ❌\n`;
                    if (!canAddReactions) description += `   • Ajouter des réactions: ❌\n`;
                    if (!canReadHistory) description += `   • Lire l'historique: ❌\n`;
                    allGood = false;
                }
            }

            embed.setDescription(description);

            if (allGood) {
                embed.setColor('#00ff00');
                embed.addFields({
                    name: '🎉 RÉSULTAT',
                    value: '**Toutes les vérifications sont passées !**\nLe système de règlement devrait fonctionner correctement.',
                    inline: false
                });
            } else {
                embed.setColor('#ff0000');
                embed.addFields({
                    name: '⚠️ RÉSULTAT',
                    value: '**Des problèmes ont été détectés !**\nVeuillez corriger les erreurs mentionnées ci-dessus.',
                    inline: false
                });
            }

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Erreur lors de la vérification des permissions:', error);
            await interaction.editReply({
                content: '❌ Une erreur est survenue lors de la vérification des permissions.',
                ephemeral: true
            });
        }
    },
};
