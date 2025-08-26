import fs from 'fs/promises';
import path from 'path';

const commands = [
    'src/commands/general/appeal.js',
    'src/commands/general/backup.js',
    'src/commands/general/charte.js',
    'src/commands/general/automod.js',
    'src/commands/general/verify-bot.js',
    'src/commands/general/test-interactions.js',
    'src/commands/general/support.js',
    'src/commands/general/suggest.js',
    'src/commands/general/stream-system.js',
    'src/commands/general/stats.js',
    'src/commands/general/send-women-message.js',
    'src/commands/general/reglement.js',
    'src/commands/general/my-data.js',
    'src/commands/general/moderation.js',
    'src/commands/general/logs.js',
    'src/commands/general/info.js',
    'src/commands/general/export-my-data.js',
    'src/commands/general/diagnostic.js',
    'src/commands/general/delete-my-data.js',
    'src/commands/general/config.js',
    'src/commands/general/cleanup.js'
];

async function addAccessRestriction() {
    console.log('🚀 Ajout de AccessRestriction à toutes les commandes...');
    
    for (const commandPath of commands) {
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
    
    console.log('🎉 Protection terminée !');
}

addAccessRestriction();
