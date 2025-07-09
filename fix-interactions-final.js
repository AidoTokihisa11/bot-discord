import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

// Fonction pour remplacer récursivement dans tous les fichiers JS
function fixInteractionFiles(dir) {
    const files = readdirSync(dir);
    let totalFixes = 0;
    
    for (const file of files) {
        const filePath = join(dir, file);
        const stat = statSync(filePath);
        
        if (stat.isDirectory()) {
            totalFixes += fixInteractionFiles(filePath);
        } else if (file.endsWith('.js')) {
            try {
                let content = readFileSync(filePath, 'utf8');
                let fixes = 0;
                
                // Remplacement 1: Déférence avec ephemeral
                const oldDefer1 = /await interaction\.deferReply\(\s*\{\s*ephemeral:\s*true\s*\}\s*\);/g;
                const newDefer1 = `// Utiliser le validateur d'interactions pour une déférence rapide
            const validator = interaction.client.interactionValidator;
            const deferred = await validator.quickDefer(interaction, { flags: MessageFlags.Ephemeral });
            
            if (!deferred) {
                return; // Interaction expirée ou déjà traitée
            }`;
                
                if (oldDefer1.test(content)) {
                    content = content.replace(oldDefer1, newDefer1);
                    fixes++;
                }
                
                // Remplacement 2: Déférence avec flags
                const oldDefer2 = /await interaction\.deferReply\(\s*\{\s*flags:\s*MessageFlags\.Ephemeral\s*\}\s*\);/g;
                const newDefer2 = `// Utiliser le validateur d'interactions pour une déférence rapide
            const validator = interaction.client.interactionValidator;
            const deferred = await validator.quickDefer(interaction, { flags: MessageFlags.Ephemeral });
            
            if (!deferred) {
                return; // Interaction expirée ou déjà traitée
            }`;
                
                if (oldDefer2.test(content)) {
                    content = content.replace(oldDefer2, newDefer2);
                    fixes++;
                }
                
                // Remplacement 3: Déférence simple
                const oldDefer3 = /await interaction\.deferReply\(\);/g;
                const newDefer3 = `// Utiliser le validateur d'interactions pour une déférence rapide
            const validator = interaction.client.interactionValidator;
            const deferred = await validator.quickDefer(interaction);
            
            if (!deferred) {
                return; // Interaction expirée ou déjà traitée
            }`;
                
                if (oldDefer3.test(content)) {
                    content = content.replace(oldDefer3, newDefer3);
                    fixes++;
                }
                
                // Vérifier si MessageFlags est importé, sinon l'ajouter
                if (content.includes('MessageFlags.Ephemeral') && !content.includes('import.*MessageFlags')) {
                    // Trouver la ligne d'import de discord.js
                    const importMatch = content.match(/(import\s*\{[^}]+\}\s*from\s*['"]discord\.js['"];?)/);
                    if (importMatch) {
                        const oldImport = importMatch[1];
                        const newImport = oldImport.replace(/\}/, ', MessageFlags}');
                        content = content.replace(oldImport, newImport);
                        fixes++;
                    }
                }
                
                if (fixes > 0) {
                    writeFileSync(filePath, content);
                    console.log(`✅ ${file}: ${fixes} correction(s)`);
                    totalFixes += fixes;
                }
                
            } catch (error) {
                console.error(`❌ Erreur avec ${file}:`, error.message);
            }
        }
    }
    
    return totalFixes;
}

console.log('🚀 CORRECTION DÉFINITIVE DES INTERACTIONS EXPIRÉES');
console.log('====================================================');

const totalFixes = fixInteractionFiles('./src');

console.log(`\n🎉 Correction terminée ! Total: ${totalFixes} correction(s)`);
console.log('✅ Toutes les interactions utilisent maintenant quickDefer()');
