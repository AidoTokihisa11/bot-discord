import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

// Fonction pour corriger les imports dupliqués
function fixDuplicateImports(dir) {
    const files = readdirSync(dir);
    let totalFixes = 0;
    
    for (const file of files) {
        const filePath = join(dir, file);
        const stat = statSync(filePath);
        
        if (stat.isDirectory()) {
            totalFixes += fixDuplicateImports(filePath);
        } else if (file.endsWith('.js')) {
            try {
                let content = readFileSync(filePath, 'utf8');
                let fixes = 0;
                
                // Vérifier s'il y a des imports dupliqués de MessageFlags
                const lines = content.split('\n');
                const importLines = [];
                let hasMessageFlags = false;
                
                for (let i = 0; i < lines.length; i++) {
                    const line = lines[i];
                    
                    // Si c'est une ligne d'import de discord.js
                    if (line.includes('import') && line.includes('from') && line.includes('discord.js')) {
                        if (line.includes('MessageFlags')) {
                            if (hasMessageFlags) {
                                // Ligne d'import dupliquée, supprimer
                                lines[i] = '';
                                fixes++;
                            } else {
                                hasMessageFlags = true;
                            }
                        }
                    }
                }
                
                // Reconstruire le contenu
                if (fixes > 0) {
                    content = lines.join('\n');
                    
                    // Nettoyer les lignes vides multiples
                    content = content.replace(/\n\n\n+/g, '\n\n');
                    
                    writeFileSync(filePath, content);
                    console.log(`✅ ${file}: ${fixes} import(s) dupliqué(s) supprimé(s)`);
                    totalFixes += fixes;
                }
                
            } catch (error) {
                console.error(`❌ Erreur avec ${file}:`, error.message);
            }
        }
    }
    
    return totalFixes;
}

console.log('🔧 CORRECTION DES IMPORTS DUPLIQUÉS');
console.log('=====================================');

const totalFixes = fixDuplicateImports('./src');

console.log(`\n🎉 Correction terminée ! ${totalFixes} import(s) dupliqué(s) supprimé(s)`);
