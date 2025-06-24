import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('check-role-mentions')
        .setDescription('🔍 Diagnostiquer les problèmes de mention de rôles')
        .addChannelOption(option =>
            option.setName('salon')
                .setDescription('Salon à analyser (optionnel)')
                .setRequired(false))
        .addRoleOption(option =>
            option.setName('role')
                .setDescription('Rôle à analyser (optionnel)')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),
    
    async execute(interaction) {
        try {
            await interaction.deferReply({ ephemeral: true });

            const targetChannel = interaction.options.getChannel('salon') || interaction.channel;
            const targetRole = interaction.options.getRole('role');
            const member = interaction.member;

            const embed = new EmbedBuilder()
                .setColor('#2b2d31')
                .setTitle('🔍 DIAGNOSTIC DES MENTIONS DE RÔLES')
                .setTimestamp();

            let description = '';
            let issues = [];
            let solutions = [];

            // Informations de base
            description += `**📍 SALON ANALYSÉ:** ${targetChannel}\n`;
            description += `**👤 UTILISATEUR:** ${member.displayName}\n`;
            if (targetRole) {
                description += `**🎭 RÔLE CIBLÉ:** ${targetRole}\n`;
            }
            description += `\n`;

            // 1. Vérifier les permissions de l'utilisateur dans le salon
            const userPerms = targetChannel.permissionsFor(member);
            const canMentionEveryone = userPerms.has(PermissionFlagsBits.MentionEveryone);
            
            description += `**🔐 VOS PERMISSIONS DANS CE SALON:**\n`;
            description += `• Mentionner @everyone/@here/rôles: ${canMentionEveryone ? '✅' : '❌'}\n`;
            
            if (!canMentionEveryone) {
                issues.push('Vous n\'avez pas la permission de mentionner les rôles dans ce salon');
                solutions.push('Demandez à un administrateur d\'accorder la permission "Mentionner @everyone, @here et tous les rôles" pour votre rôle dans ce salon');
            }

            // 2. Analyser tous les rôles du serveur
            const roles = interaction.guild.roles.cache
                .filter(role => role.id !== interaction.guild.id) // Exclure @everyone
                .sort((a, b) => b.position - a.position);

            let mentionableRoles = 0;
            let nonMentionableRoles = 0;
            let higherRoles = 0;
            let accessibleRoles = 0;

            description += `\n**🎭 ANALYSE DES RÔLES DU SERVEUR:**\n`;

            for (const [roleId, role] of roles) {
                const isMentionable = role.mentionable;
                const isHigher = role.position >= member.roles.highest.position;
                
                if (isMentionable) {
                    mentionableRoles++;
                    if (!isHigher) {
                        accessibleRoles++;
                    }
                } else {
                    nonMentionableRoles++;
                }
                
                if (isHigher) {
                    higherRoles++;
                }
            }

            description += `• Total des rôles: ${roles.size}\n`;
            description += `• Rôles mentionnables: ${mentionableRoles}\n`;
            description += `• Rôles non-mentionnables: ${nonMentionableRoles}\n`;
            description += `• Rôles plus élevés que le vôtre: ${higherRoles}\n`;
            description += `• Rôles que vous pouvez mentionner: ${accessibleRoles}\n`;

            // 3. Analyse spécifique du rôle ciblé
            if (targetRole) {
                description += `\n**🎯 ANALYSE DU RÔLE SPÉCIFIQUE:**\n`;
                description += `• Nom: ${targetRole.name}\n`;
                description += `• Position: ${targetRole.position}\n`;
                description += `• Votre position: ${member.roles.highest.position}\n`;
                description += `• Mentionnable: ${targetRole.mentionable ? '✅' : '❌'}\n`;
                description += `• Vous pouvez le mentionner: ${targetRole.position < member.roles.highest.position && targetRole.mentionable ? '✅' : '❌'}\n`;

                if (!targetRole.mentionable) {
                    issues.push(`Le rôle ${targetRole.name} n'est pas configuré comme mentionnable`);
                    solutions.push(`Activez "Autoriser tous à @mentionner ce rôle" dans les paramètres du rôle ${targetRole.name}`);
                }

                if (targetRole.position >= member.roles.highest.position) {
                    issues.push(`Le rôle ${targetRole.name} est plus élevé que votre rôle le plus haut`);
                    solutions.push('Seuls les utilisateurs avec des rôles plus élevés peuvent mentionner ce rôle');
                }
            }

            // 4. Vérifier les permissions spécifiques du salon
            description += `\n**⚙️ CONFIGURATION DU SALON:**\n`;
            const everyoneOverwrite = targetChannel.permissionOverwrites.cache.get(interaction.guild.id);
            const memberOverwrites = targetChannel.permissionOverwrites.cache.filter(overwrite => 
                member.roles.cache.has(overwrite.id)
            );

            if (everyoneOverwrite) {
                const everyoneMention = everyoneOverwrite.allow.has(PermissionFlagsBits.MentionEveryone) ? '✅' : 
                                      everyoneOverwrite.deny.has(PermissionFlagsBits.MentionEveryone) ? '❌' : '🔄';
                description += `• Permission @everyone: ${everyoneMention}\n`;
            }

            if (memberOverwrites.size > 0) {
                description += `• Permissions de vos rôles:\n`;
                memberOverwrites.forEach(overwrite => {
                    const role = interaction.guild.roles.cache.get(overwrite.id);
                    const mention = overwrite.allow.has(PermissionFlagsBits.MentionEveryone) ? '✅' : 
                                   overwrite.deny.has(PermissionFlagsBits.MentionEveryone) ? '❌' : '🔄';
                    description += `  • ${role.name}: ${mention}\n`;
                });
            }

            embed.setDescription(description);

            // Ajouter les problèmes et solutions
            if (issues.length > 0) {
                embed.addFields({
                    name: '⚠️ PROBLÈMES DÉTECTÉS',
                    value: issues.map((issue, index) => `${index + 1}. ${issue}`).join('\n'),
                    inline: false
                });
            }

            if (solutions.length > 0) {
                embed.addFields({
                    name: '💡 SOLUTIONS RECOMMANDÉES',
                    value: solutions.map((solution, index) => `${index + 1}. ${solution}`).join('\n'),
                    inline: false
                });
            }

            if (issues.length === 0) {
                embed.setColor('#00ff00');
                embed.addFields({
                    name: '✅ RÉSULTAT',
                    value: 'Aucun problème détecté ! Vous devriez pouvoir mentionner les rôles autorisés dans ce salon.',
                    inline: false
                });
            } else {
                embed.setColor('#ff6b6b');
            }

            // Ajouter un guide rapide
            embed.addFields({
                name: '📚 GUIDE RAPIDE',
                value: '**Pour mentionner un rôle, vous devez :**\n' +
                       '• Avoir la permission "Mentionner @everyone/@here/rôles"\n' +
                       '• Le rôle doit être configuré comme "mentionnable"\n' +
                       '• Votre rôle doit être plus élevé que le rôle à mentionner\n' +
                       '• Le salon ne doit pas interdire cette permission',
                inline: false
            });

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Erreur lors du diagnostic des mentions:', error);
            await interaction.editReply({
                content: '❌ Une erreur est survenue lors du diagnostic.',
                ephemeral: true
            });
        }
    },
};
