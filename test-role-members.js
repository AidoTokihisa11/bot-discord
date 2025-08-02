import { Client, GatewayIntentBits } from 'discord.js';
import config from './src/config/deployment.js';

// Test pour vérifier la récupération des membres du rôle spécial
async function testRoleMembers() {
    console.log('🔍 Test de récupération des membres du rôle spécial - Démarrage...\n');
    
    const client = new Client({
        intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMembers,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.MessageContent,
            GatewayIntentBits.GuildPresences
        ]
    });

    try {
        await client.login(config.token);
        console.log('✅ Bot connecté avec succès\n');

        // Attendre que le bot soit prêt
        await new Promise(resolve => {
            client.once('ready', resolve);
        });

        const guild = client.guilds.cache.first();
        if (!guild) {
            console.lo

1('❌ Aucun serveur trouvé');
            return;
        }

        console.log(`🏰 Serveur: ${guild.name} (${guild.id})\n`);

        // Récupérer tous les membres du serveur
        await guild.members.fetch();
        console.log(`👥 ${guild.members.cache.size} membres récupérés\n`);

        // ID du rôle spécial à tester
        const specialRoleId = '1388265895264129157';
        const staffRoleId = '1386784012269387946';
        const restrictedRoleId = '1386990308679483393';

        // Tester le rôle spécial
        console.log(`🔍 Recherche du rôle spécial: ${specialRoleId}`);
        const specialRole = guild.roles.cache.get(specialRoleId);
        
        if (specialRole) {
            console.log(`✅ Rôle spécial trouvé: ${specialRole.name}`);
            console.log(`👥 Membres avec ce rôle: ${specialRole.members.size}\n`);
            
            console.log('📋 Liste des membres du rôle spécial:');
            specialRole.members.forEach((member, index) => {
                const status = member.presence?.status || 'offline';
                const statusEmoji = status === 'online' ? '🟢' : 
                                  status === 'idle' ? '🟡' : 
                                  status === 'dnd' ? '🔴' : '⚫';
                
                console.log(`  ${index + 1}. ${statusEmoji} ${member.displayName} (@${member.user.username})`);
                console.log(`     ID: ${member.id}`);
                console.log(`     Bot: ${member.user.bot ? 'Oui' : 'Non'}`);
                console.log(`     Roles: ${member.roles.cache.map(r => r.name).join(', ')}\n`);
            });
        } else {
            console.log(`❌ Rôle spécial ${specialRoleId} introuvable\n`);
        }

        // Tester le rôle staff
        console.log(`🔍 Recherche du rôle staff: ${staffRoleId}`);
        const staffRole = guild.roles.cache.get(staffRoleId);
        
        if (staffRole) {
            console.log(`✅ Rôle staff trouvé: ${staffRole.name}`);
            console.log(`👥 Membres avec ce rôle: ${staffRole.members.size}\n`);
            
            // Filtrer les membres disponibles (excluant les restreints)
            const availableStaff = staffRole.members.filter(member => 
                !member.roles.cache.has(restrictedRoleId) && !member.user.bot
            );
            
            console.log(`✅ Staff disponible (après filtrage): ${availableStaff.size}`);
            
            // Simuler la logique du TicketManager
            const specialRoleMembers = specialRole ? specialRole.members.filter(member => 
                !member.user.bot
            ) : new Map();
            
            console.log(`✅ Membres spéciaux disponibles: ${specialRoleMembers.size}`);
            
            // Compter les membres uniques
            const allUniqueMembers = new Set([...availableStaff.keys(), ...specialRoleMembers.keys()]);
            console.log(`✅ Total membres uniques: ${allUniqueMembers.size}\n`);
            
            // Simuler la création des options du menu
            const staffOptions = [];
            let optionCount = 0;
            
            console.log('📋 Simulation de la création du menu déroulant:\n');
            
            // Ajouter les membres spéciaux en premier
            for (const [id, member] of specialRoleMembers) {
                if (optionCount >= 22) break;
                
                const displayName = member.displayName || member.user.username;
                const label = `⭐ ${displayName}`;
                
                staffOptions.push({
                    label: label,
                    value: member.id,
                    type: 'special'
                });
                
                console.log(`  ✅ Ajouté (Spécial): ${label}`);
                optionCount++;
            }
            
            // Ajouter les membres staff restants
            for (const [id, member] of availableStaff) {
                if (optionCount >= 22) break;
                if (specialRoleMembers.has(id)) {
                    console.log(`  ⏭️ Skip (déjà ajouté): ${member.displayName}`);
                    continue;
                }
                
                const displayName = member.displayName || member.user.username;
                const label = `👤 ${displayName}`;
                
                staffOptions.push({
                    label: label,
                    value: member.id,
                    type: 'staff'
                });
                
                console.log(`  ✅ Ajouté (Staff): ${label}`);
                optionCount++;
            }
            
            console.log(`\n📊 Résumé du menu:`);
            console.log(`  • Total options: ${staffOptions.length}`);
            console.log(`  • Membres spéciaux: ${staffOptions.filter(o => o.type === 'special').length}`);
            console.log(`  • Membres staff: ${staffOptions.filter(o => o.type === 'staff').length}`);
            
        } else {
            console.log(`❌ Rôle staff ${staffRoleId} introuvable`);
        }

        console.log('\n🎉 Test terminé avec succès!');
        
    } catch (error) {
        console.error('❌ Erreur pendant le test:', error);
    } finally {
        await client.destroy();
    }
}

// Lancer le test
testRoleMembers();
