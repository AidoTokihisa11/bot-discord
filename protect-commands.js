// Script pour ajouter automatiquement la vérification d'accès à toutes les commandes
import fs from 'fs';
import path from 'path';

const ACCESS_CHECK_CODE = `        // === VÉRIFICATION D'ACCÈS GLOBALE ===
        const accessRestriction = new AccessRestriction();
        const hasAccess = await accessRestriction.checkAccess(interaction);
        if (!hasAccess) {
            return; // Accès refusé, message déjà envoyé
        }`;

const ACCESS_IMPORT = `import AccessRestriction from '../../utils/AccessRestriction.js';`;

function addAccessRestriction(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Vérifier si la vérification d'accès est déjà présente
        if (content.includes('AccessRestriction') || content.includes('VÉRIFICATION D\'ACCÈS GLOBALE')) {
            console.log(`✅ ${filePath} - Déjà protégé`);
            return;
        }
        
        // Ajouter l'import
        if (!content.includes('import AccessRestriction')) {
            // Trouver la dernière ligne d'import
            const lines = content.split('\n');
            let lastImportIndex = -1;
            
            for (let i = 0; i < lines.length; i++) {
                if (lines[i].startsWith('import ')) {
                    lastImportIndex = i;
                }
            }
            
            if (lastImportIndex !== -1) {
                lines.splice(lastImportIndex + 1, 0, ACCESS_IMPORT);
                content = lines.join('\n');
            }
        }
        
        // Ajouter la vérification d'accès au début de execute()
        const executeMatch = content.match(/(async execute\(interaction\) \{[\s\S]*?)(\n\s*)(try \{|const|let|if|\/\/)/);
        if (executeMatch) {
            const before = executeMatch[1];
            const whitespace = executeMatch[2];
            const after = executeMatch[2] + executeMatch[3];
            
            const newContent = content.replace(
                executeMatch[0],
                before + '\n' + ACCESS_CHECK_CODE + '\n' + after
            );
            
            fs.writeFileSync(filePath, newContent, 'utf8');
            console.log(`🔒 ${filePath} - Protection ajoutée`);
        } else {
            console.log(`⚠️ ${filePath} - Pattern execute() non trouvé`);
        }
        
    } catch (error) {
        console.error(`❌ ${filePath} - Erreur:`, error.message);
    }
}

// Liste des commandes à traiter
const commandFiles = [
    'src/commands/general/help.js',
    'src/commands/general/info.js',
    'src/commands/general/diagnostic.js',
    'src/commands/general/config.js',
    'src/commands/general/cleanup.js',
    'src/commands/general/charte.js',
    'src/commands/general/backup.js',
    'src/commands/general/automod.js',
    'src/commands/general/appeal.js',
    'src/commands/general/logs.js',
    'src/commands/general/export-my-data.js',
    'src/commands/general/delete-my-data.js',
    'src/commands/tickets/ticket.js',
    'src/commands/tickets/setup-tickets.js',
    'src/commands/tickets/ticket-stats.js',
    'src/commands/music/play.js',
    'src/commands/music/stop.js',
    'src/commands/music/pause.js',
    'src/commands/music/skip.js',
    'src/commands/music/loop.js',
    'src/commands/music/clear.js',
    'src/commands/music/nowplaying.js',
    'src/commands/music/disconnect.js',
    'src/commands/music/join.js',
    'src/commands/music/music-help.js'
];

console.log('🚀 Début de la protection globale des commandes...\n');

commandFiles.forEach(file => {
    const fullPath = path.join(process.cwd(), file);
    if (fs.existsSync(fullPath)) {
        addAccessRestriction(fullPath);
    } else {
        console.log(`⚠️ ${file} - Fichier non trouvé`);
    }
});

console.log('\n✅ Protection globale terminée !');
