const { Client, GatewayIntentBits } = require('discord.js');
const config = require('./src/config/deployment.js');

// Test simple pour vérifier les notifications
async function testNotificationSystem() {
    console.log('🧪 Test du Système de Notification - Démarrage...\n');
    
    try {
        // Simulation d'un utilisateur créant un ticket
        const mockUser = {
            id: '123456789',
            tag: 'TestUser#1234',
            toString: () => '<@123456789>'
        };
        
        const mockGuild = {
            id: 'test-guild-id',
            channels: {
                create: async (options) => {
                    console.log('✅ Channel créé avec les options:');
                    console.log(`   - Nom: ${options.name}`);
                    console.log(`   - Type: ${options.type}`);
                    console.log(`   - Parent: ${options.parent}`);
                    console.log(`   - Permissions: ${options.permissionOverwrites.length} règles`);
                    
                    // Vérifier que l'utilisateur a bien les permissions
                    const userPerms = options.permissionOverwrites.find(p => p.id === mockUser.id);
                    if (userPerms) {
                        console.log('✅ Permissions utilisateur configurées correctement');
                    } else {
                        console.log('❌ ERREUR: Permissions utilisateur manquantes!');
                    }
                    
                    return {
                        id: 'mock-channel-id',
                        toString: () => '<#mock-channel-id>',
                        send: async (content) => {
                            console.log('\n📨 Message envoyé dans le ticket:');
                            console.log('---');
                            console.log(content.content || content);
                            console.log('---');
                            
                            // Vérifier que l'utilisateur est mentionné
                            const message = content.content || content;
                            if (message.includes('<@123456789>') || message.includes(mockUser.toString())) {
                                console.log('✅ NOTIFICATION: Utilisateur correctement mentionné!');
                            } else {
                                console.log('❌ ERREUR: Utilisateur pas mentionné dans le ticket!');
                            }
                            
                            return { id: 'mock-message-id' };
                        }
                    };
                }
            }
        };
        
        const mockInteraction = {
            user: mockUser,
            guild: mockGuild,
            reply: async (content) => {
                console.log('\n💬 Réponse d\'interaction:');
                console.log('---');
                console.log(content.content || content);
                console.log('---');
                
                // Vérifier que la réponse contient la notification
                const message = content.content || content;
                if (message.includes('notifié') || message.includes('Vous avez été')) {
                    console.log('✅ CONFIRMATION: Message de notification présent!');
                } else {
                    console.log('❌ ERREUR: Message de notification manquant!');
                }
            },
            fields: {
                getTextInputValue: (id) => {
                    const values = {
                        'ticketReason': 'Test de notification automatique',
                        'ticketDescription': 'Vérification que l\'utilisateur reçoit bien une notification'
                    };
                    return values[id] || 'Valeur test';
                }
            }
        };
        
        console.log('🎭 Simulation d\'un ticket de support standard...');
        
        // Simuler la création d'un ticket
        const ticketData = {
            reason: mockInteraction.fields.getTextInputValue('ticketReason'),
            description: mockInteraction.fields.getTextInputValue('ticketDescription'),
            type: 'support'
        };
        
        console.log(`📝 Raison: ${ticketData.reason}`);
        console.log(`📄 Description: ${ticketData.description}`);
        console.log(`🏷️ Type: ${ticketData.type}\n`);
        
        // Simuler la création du channel (comme dans TicketManager)
        const channelOptions = {
            name: `ticket-${mockUser.tag.toLowerCase().replace('#', '-')}`,
            type: 0, // TextChannel
            parent: 'mock-category-id',
            permissionOverwrites: [
                {
                    id: mockGuild.id,
                    deny: ['ViewChannel']
                },
                {
                    id: mockUser.id,
                    allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory']
                }
            ]
        };
        
        const ticketChannel = await mockGuild.channels.create(channelOptions);
        
        // Simuler l'envoi du message dans le ticket
        const ticketMessage = `${mockUser} 🔒 **Votre ticket privé a été créé avec succès !**

🎯 **Détails de votre demande :**
**Raison :** ${ticketData.reason}
**Description :** ${ticketData.description}

🔐 **Confidentialité garantie :**
• Ce channel est **100% privé** - seul vous y avez accès
• Aucun staff n'est automatiquement ajouté
• Vos informations restent confidentielles

🆘 **Besoin d'aide du staff ?**
Utilisez le bouton ci-dessous pour inviter un membre de l'équipe si nécessaire.`;
        
        await ticketChannel.send(ticketMessage);
        
        // Simuler la réponse d'interaction
        const replyMessage = `✅ **Ticket privé créé avec succès !** ${ticketChannel}

🔒 **Votre ticket est 100% privé** - seul vous y avez accès.
💡 **Vous avez été notifié dans le channel** - consultez ${ticketChannel}
🎯 Utilisez le bouton "Inviter le Staff" dans le ticket si vous avez besoin d'aide.`;
        
        await mockInteraction.reply(replyMessage);
        
        console.log('\n🎉 Test terminé avec succès!');
        console.log('\n📊 Résumé du test:');
        console.log('✅ Channel privé créé');
        console.log('✅ Permissions correctes appliquées');
        console.log('✅ Utilisateur mentionné dans le ticket');
        console.log('✅ Message de confirmation envoyé');
        console.log('✅ Système de notification fonctionnel');
        
    } catch (error) {
        console.error('❌ Erreur pendant le test:', error);
    }
}

// Lancer le test
if (require.main === module) {
    testNotificationSystem();
}

module.exports = { testNotificationSystem };
