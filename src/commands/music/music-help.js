import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('music-help')
        .setDescription('Afficher l\'aide pour les commandes de musique'),

    async execute(interaction) {
        try {
            const embed = new EmbedBuilder()
                .setTitle('🎵 Système de Musique - Guide Complet')
                .setDescription('Voici toutes les commandes disponibles pour le système de musique :')
                .addFields(
                    {
                        name: '🎯 **Commandes Basiques**',
                        value: 
                            '• `/play <musique>` - Jouer une musique depuis YouTube\n' +
                            '• `/join` - Rejoindre votre canal vocal\n' +
                            '• `/disconnect` - Quitter le canal vocal\n' +
                            '• `/nowplaying` - Afficher la musique actuelle',
                        inline: false
                    },
                    {
                        name: '⏯️ **Contrôles de Lecture**',
                        value: 
                            '• `/pause` - Mettre en pause la musique\n' +
                            '• `/resume` - Reprendre la lecture\n' +
                            '• `/skip` - Passer à la musique suivante\n' +
                            '• `/stop` - Arrêter et vider la queue',
                        inline: false
                    },
                    {
                        name: '📋 **Gestion de la Queue**',
                        value: 
                            '• `/queue [page]` - Afficher la liste des musiques\n' +
                            '• `/remove <position>` - Supprimer une musique\n' +
                            '• `/clear` - Vider la queue (garde la musique actuelle)\n' +
                            '• `/shuffle` - Mélanger la queue',
                        inline: false
                    },
                    {
                        name: '🔁 **Modes de Répétition**',
                        value: 
                            '• `/loop song` - Répéter la musique actuelle\n' +
                            '• `/loop queue` - Répéter toute la queue\n' +
                            '• `/loop off` - Désactiver la répétition',
                        inline: false
                    },
                    {
                        name: '💡 **Conseils d\'Utilisation**',
                        value: 
                            '• Vous pouvez rechercher par nom ou coller une URL YouTube\n' +
                            '• Le bot doit être dans le même canal vocal que vous\n' +
                            '• Utilisez les boutons pour naviguer dans la queue\n' +
                            '• Les musiques sont automatiquement mises en queue',
                        inline: false
                    },
                    {
                        name: '🎮 **Exemples**',
                        value: 
                            '• `/play Never Gonna Give You Up`\n' +
                            '• `/play https://youtube.com/watch?v=...`\n' +
                            '• `/queue 2` (page 2 de la queue)\n' +
                            '• `/remove 3` (supprimer la 3ème musique)',
                        inline: false
                    }
                )
                .setColor('#9932CC')
                .setThumbnail(interaction.client.user.displayAvatarURL())
                .setFooter({ 
                    text: 'Système de musique Team7 Bot', 
                    iconURL: interaction.guild?.iconURL() || undefined 
                })
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Erreur dans la commande music-help:', error);
            
            const embed = new EmbedBuilder()
                .setTitle('❌ Erreur')
                .setDescription('Une erreur est survenue lors de l\'affichage de l\'aide.')
                .setColor('#FF0000');
            
            await interaction.reply({ embeds: [embed] });
        }
    }
};
