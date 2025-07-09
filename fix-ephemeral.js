import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

// Fonction pour remplacer récursivement dans tous les fichiers JS
function replaceInFiles(dir, searchStr, replaceStr) {
    const files = readdirSync(dir);
    let replacements = 0;
    
    for (const file of files) {
        const filePath = join(dir, file);
        const stat = statSync(filePath);
        
        if (stat.isDirectory()) {
            replacements += replaceInFiles(filePath, searchStr, replaceStr);
        } else if (file.endsWith('.js')) {
            try {
                let content = readFileSync(filePath, 'utf8');
                const originalContent = content;
                
                // Remplacer toutes les occurrences
                content = content.replace(new RegExp(searchStr, 'g'), replaceStr);
                
                if (content !== originalContent) {
                    writeFileSync(filePath, content);
                    const count = (originalContent.match(new RegExp(searchStr, 'g')) || []).length;
                    console.log(`✅ ${file}: ${count} remplacement(s)`);
                    replacements += count;
                }
            } catch (error) {
                console.error(`❌ Erreur avec ${file}:`, error.message);
            }
        }
    }
    
    return replacements;
}

console.log('🔄 Correction automatique de tous les fichiers...');

// Remplacements à effectuer
const replacements = [
    {
        search: 'ephemeral: true',
        replace: 'flags: MessageFlags.Ephemeral'
    },
    {
        search: 'await interaction\\.deferReply\\(\\{ ephemeral: true \\}\\)',
        replace: 'const validator = interaction.client.interactionValidator; const deferred = await validator.quickDefer(interaction, { flags: MessageFlags.Ephemeral }); if (!deferred) return;'
    }
];

let totalReplacements = 0;

for (const { search, replace } of replacements) {
    console.log(`\n🔍 Recherche: ${search}`);
    console.log(`🔄 Remplacement: ${replace}`);
    
    const count = replaceInFiles('./src', search, replace);
    totalReplacements += count;
    
    console.log(`✅ ${count} remplacement(s) effectué(s)\n`);
}

console.log(`🎉 Correction terminée ! Total: ${totalReplacements} remplacement(s)`);
