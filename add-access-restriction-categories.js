import fs from 'fs/promises';
import path from 'path';

const musicCommands = [
    'src/commands/music/stop.js',
    'src/commands/music/skip.js',
    'src/commands/music/shuffle.js',
    'src/commands/music/resume.js',
    'src/commands/music/remove.js',
    'src/commands/music/queue.js',
    'src/commands/music/play.js',
    'src/commands/music/pause.js',
    'src/commands/music/nowplaying.js',
    'src/commands/music/music-help.js',
    'src/commands/music/loop.js',
    'src/commands/music/join.js',
    'src/commands/music/disconnect.js',
    'src/commands/music/clear.js'
];

const ticketCommands = [
    'src/commands/tickets/ticket.js',
    'src/commands/tickets/ticket-stats.js',
    'src/commands/tickets/setup-tickets.js'
];

async function addAccessRestrictionToCategories() {
    console.log('🚀 Ajout de AccessRestriction aux commandes musique et tickets...');
    
    const allCommands = [...musicCommands, ...ticketCommands];
    
    for (const commandPath of allCommands) {
        try {
            const fullPath = path.resolve(commandPath);
            let content = await fs.readFile(fullPath, 'utf8');
            
            // Vérifier si AccessRestriction est déjà importé
            if (content.includes('AccessRestriction')) {
                console.log(`⏭️  ${commandPath} - Déjà protégé`);
                continue;
            }
            
            // Ajouter l'import
            const importMatch = content.match(/^(import.*from ['"]\S+['"];?\s*)+/m);
            if (importMatch) {
                const importSection = importMatch[0];
                const newImportSection = importSection + "import AccessRestriction from '../../utils/AccessRestriction.js';\n";
                content = content.replace(importSection, newImportSection);
            }
            
            // Ajouter la vérification d'accès
            const executeMatch = content.match(/async execute\(interaction[^)]*\) \{/);
            if (executeMatch) {
                const executeStart = executeMatch[0];
                const accessCheck = `${executeStart}
        // === VÉRIFICATION D'ACCÈS GLOBALE ===
        const accessRestriction = new AccessRestriction();
        const hasAccess = await accessRestriction.checkAccess(interaction);
        if (!hasAccess) {
            return; // Accès refusé, message déjà envoyé
        }

`;
                content = content.replace(executeStart, accessCheck);
            }
            
            await fs.writeFile(fullPath, content);
            console.log(`✅ ${commandPath} - Protection ajoutée`);
            
        } catch (error) {
            console.error(`❌ Erreur sur ${commandPath}:`, error.message);
        }
    }
    
    console.log('🎉 Protection terminée pour musique et tickets !');
}

addAccessRestrictionToCategories();
