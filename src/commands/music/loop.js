import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import MusicManager from '../../managers/MusicManager.js';

import AccessRestriction from '../../utils/AccessRestriction.js';
export default {
    data: new SlashCommandBuilder()
        .setName('loop')
        .setDescription('Activer/désactiver la répétition de la musique actuelle ou de la queue')
        .addStringOption(option =>
            option.setName('mode')
                .setDescription('Mode de répétition')
                .setRequired(false)
                .addChoices(
                    { name: 'Musique actuelle', value: 'song' },
                    { name: 'Queue complète', value: 'queue' },
                    { name: 'Désactiver', value: 'off' }
                )),

    async execute(interaction) {
        // === VÉRIFICATION D'ACCÈS GLOBALE ===
        const accessRestriction = new AccessRestriction();
        const hasAccess = await accessRestriction.checkAccess(interaction);
        if (!hasAccess) {
            return; // Accès refusé, message déjà envoyé
        }


        try {
            const member = interaction.member;
            const voiceChannel = member.voice.channel;
            const queue = MusicManager.getQueue(interaction.guildId);
            const mode = interaction.options.getString('mode') || 'song';

            // Vérifier si l'utilisateur est dans un canal vocal
            if (!voiceChannel) {
                const embed = new EmbedBuilder()
                    .setTitle('❌ Erreur')
                    .setDescription('Vous devez être dans un canal vocal pour utiliser cette commande !')
                    .setColor('#FF0000');
                
                return await interaction.reply({ embeds: [embed] });
            }

            // Vérifier si le bot est connecté
            if (!MusicManager.isConnected(interaction.guildId)) {
                const embed = new EmbedBuilder()
                    .setTitle('❌ Non connecté')
                    .setDescription('Le bot n\'est pas connecté à un canal vocal !')
                    .setColor('#FF0000');
                
                return await interaction.reply({ embeds: [embed] });
            }

            // Vérifier si l'utilisateur est dans le même canal vocal que le bot
            if (voiceChannel.id !== queue.voiceChannel?.id) {
                const embed = new EmbedBuilder()
                    .setTitle('❌ Canal vocal différent')
                    .setDescription('Vous devez être dans le même canal vocal que le bot !')
                    .setColor('#FF0000');
                
                return await interaction.reply({ embeds: [embed] });
            }

            // Vérifier s'il y a une musique
            if (queue.songs.length === 0) {
                const embed = new EmbedBuilder()
                    .setTitle('❌ Aucune musique')
                    .setDescription('Aucune musique dans la queue pour activer la répétition !')
                    .setColor('#FF0000');
                
                return await interaction.reply({ embeds: [embed] });
            }

            let title, description, color;

            switch (mode) {
                case 'song':
                    const loopEnabled = MusicManager.toggleLoop(interaction.guildId);
                    title = loopEnabled ? '🔂 Répétition activée' : '🔂 Répétition désactivée';
                    description = loopEnabled 
                        ? 'La musique actuelle sera répétée en boucle'
                        : 'La répétition de la musique actuelle est désactivée';
                    color = loopEnabled ? '#00FF00' : '#FF6600';
                    break;

                case 'queue':
                    const loopQueueEnabled = MusicManager.toggleLoopQueue(interaction.guildId);
                    title = loopQueueEnabled ? '🔁 Répétition queue activée' : '🔁 Répétition queue désactivée';
                    description = loopQueueEnabled 
                        ? 'Toute la queue sera répétée en boucle'
                        : 'La répétition de la queue est désactivée';
                    color = loopQueueEnabled ? '#00FF00' : '#FF6600';
                    break;

                case 'off':
                    queue.loop = false;
                    queue.loopQueue = false;
                    title = '⏹️ Répétition désactivée';
                    description = 'Tous les modes de répétition ont été désactivés';
                    color = '#FF6600';
                    break;
            }

            const embed = new EmbedBuilder()
                .setTitle(title)
                .setDescription(description)
                .addFields(
                    { name: '👤 Modifié par', value: member.user.toString(), inline: true }
                )
                .setColor(color)
                .setTimestamp();

            // Afficher l'état actuel
            const currentStatus = [];
            if (queue.loop) currentStatus.push('🔂 Musique');
            if (queue.loopQueue) currentStatus.push('🔁 Queue');
            
            if (currentStatus.length > 0) {
                embed.addFields(
                    { name: '🎛️ Modes actifs', value: currentStatus.join(', '), inline: true }
                );
            }

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Erreur dans la commande loop:', error);
            
            const embed = new EmbedBuilder()
                .setTitle('❌ Erreur')
                .setDescription('Une erreur est survenue lors de la modification du mode de répétition.')
                .setColor('#FF0000');
            
            await interaction.reply({ embeds: [embed] });
        }
    }
};
