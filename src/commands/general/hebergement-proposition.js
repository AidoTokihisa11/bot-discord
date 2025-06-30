import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('hebergement-proposition')
        .setDescription('📋 Affiche la proposition d\'hébergement pour le bot Discord'),
    
    cooldown: 10,
    category: 'general',
    
    async execute(interaction, client) {
        // Premier embed - Introduction et contexte
        const embed1 = new EmbedBuilder()
            .setColor('#ff6b35')
            .setTitle('📋 Proposition d\'hébergement - Bot Discord')
            .setDescription('Je vous contacte aujourd\'hui concernant l\'hébergement et le maintien en condition opérationnelle du bot Discord que je développe actuellement pour la structure. Jusqu\'à présent, j\'ai personnellement financé l\'infrastructure via l\'offre Hobby de Railway à 5 $/mois, mais nous atteignons désormais ses limites techniques et opérationnelles.')
            .addFields(
                {
                    name: '📌 1. Contexte actuel : limites atteintes sur Railway',
                    value: '• **Stockage utilisé :** 50 Go sur les 70 Go inclus → seuil critique\n• **Support technique inexistant** (communautaire uniquement)\n• **Pas de sécurité entreprise**, pas d\'environnements isolés\n• **Coût réel évolutif** (RAM, CPU, stockage, bande passante)',
                    inline: false
                }
            )
            .setThumbnail('https://cdn.discordapp.com/attachments/1234567890/server-icon.png')
            .setTimestamp()
            .setFooter({ 
                text: `Proposition technique`, 
                iconURL: client.user.displayAvatarURL({ dynamic: true }) 
            });

        // Deuxième embed - Recommandation Render
        const embed2 = new EmbedBuilder()
            .setColor('#00d4ff')
            .setTitle('✅ 2. Recommandation : migration vers Render – plan Organization à 29 $/mois')
            .setDescription('Je recommande fortement de basculer vers la plateforme Render.com avec le plan Organization à 29 $/mois/utilisateur pour les raisons suivantes :')
            .addFields(
                {
                    name: '🎯 Fonctionnalités critiques incluses :',
                    value: '• **1 To de bande passante incluse**\n• **Autoscaling horizontal** sans surcoût\n• **Collaboration illimitée**\n• **Déploiements illimités** + environnement de test\n• **Environnements isolés**\n• **Support professionnel** (chat + email)\n• **Certifications SOC 2 & ISO 27001**\n• **Audit logs** complets\n• **Datastores managés** (PostgreSQL, Redis)',
                    inline: false
                }
            );

        // Troisième embed - Justification du plan Organization
        const embed3 = new EmbedBuilder()
            .setColor('#28a745')
            .setTitle('🔒 3. Pourquoi le plan Organization est indispensable dans notre cas')
            .setDescription('Le bot Discord n\'est plus un simple outil hobby : il s\'agit aujourd\'hui d\'une infrastructure active, connectée à des utilisateurs réels, qui nécessite :')
            .addFields(
                {
                    name: 'Exigences critiques',
                    value: '• **Fiabilité 24/7**\n• **Visibilité sur la performance**\n• **Sécurité conforme aux attentes modernes** (audit, ISO/SOC2)\n• **Stabilité financière des coûts :** Render propose une tarification claire, transparente, sans surprise\n• **Possibilité de travailler à plusieurs** sans changer de plateforme',
                    inline: false
                },
                {
                    name: '🔄 Évolution à venir :',
                    value: '• Un système de **scaling automatique** pour absorber les pics de charge\n• **Nouvelles features prévues :** logs enrichis, intelligence contextuelle, panel d\'administration, etc.\n• Besoin d\'un **environnement de staging/test** en plus de la production',
                    inline: false
                }
            );

        // Quatrième embed - Tableau comparatif
        const embed4 = new EmbedBuilder()
            .setColor('#ffc107')
            .setTitle('💰 4. Pourquoi ce plan à 29 $/mois est un investissement rentable')
            .setDescription('En comparaison avec Railway, Render offre :')
            .addFields(
                {
                    name: '💸 Tarification',
                    value: '**Railway Pro (20$):** À l\'usage (RAM, CPU, bande passante)\n**Render Org (29$/m):** Fixe, prévisible, sans surprise',
                    inline: true
                },
                {
                    name: '🌐 Bande passante',
                    value: '**Railway Pro:** Aucune incluse, 0,05 $/Go\n**Render Org:** 1 To inclus',
                    inline: true
                },
                {
                    name: '🚀 Déploiements preview',
                    value: '**Railway Pro:** Non inclus\n**Render Org:** Inclus (Git branch staging)',
                    inline: true
                },
                {
                    name: '👥 Collaborateurs',
                    value: '**Railway Pro:** Payant par workspace\n**Render Org:** Illimités',
                    inline: true
                },
                {
                    name: '🔒 Sécurité & audit',
                    value: '**Railway Pro:** Aucune garantie\n**Render Org:** SOC 2, ISO 27001, audit logs',
                    inline: true
                },
                {
                    name: '🆘 Support',
                    value: '**Railway Pro:** Communautaire ou lent\n**Render Org:** Chat + Email pro inclus',
                    inline: true
                }
            );

        // Cinquième embed - Conclusion
        const embed5 = new EmbedBuilder()
            .setColor('#6f42c1')
            .setTitle('🧠 Conclusion')
            .setDescription('L\'objectif n\'est pas simplement de "faire tourner un bot", mais de construire une base logicielle stable, collaborative et évolutive. Le plan Organization de Render à 29 $/mois nous offre dès aujourd\'hui :')
            .addFields(
                {
                    name: 'Avantages immédiats',
                    value: '• **La stabilité nécessaire à la croissance**\n• **La sécurité exigée pour un usage sérieux**\n• **Des outils professionnels indispensables pour un développeur responsable**',
                    inline: false
                },
                {
                    name: 'Recommandation officielle',
                    value: 'Je recommande officiellement que nous passions sur ce plan **dès cette semaine**, afin d\'assurer la pérennité du projet.\n\nJe reste à votre disposition pour un tableau comparatif détaillé ou une démonstration technique.\n\n**Bien cordialement,**',
                    inline: false
                }
            )
            .setTimestamp()
            .setFooter({ 
                text: `Proposition technique détaillée`, 
                iconURL: client.user.displayAvatarURL({ dynamic: true }) 
            });

        // Envoyer tous les embeds
        await interaction.reply({ 
            embeds: [embed1, embed2, embed3, embed4, embed5]
        });
    },
};
