import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

// Fonction pour nettoyer les imports
function cleanImports(dir) {
    const files = readdirSync(dir);
    let totalFixes = 0;
    
    for (const file of files) {
        const filePath = join(dir, file);
        const stat = statSync(filePath);
        
        if (stat.isDirectory()) {
            totalFixes += cleanImports(filePath);
        } else if (file.endsWith('.js')) {
            try {
                let content = readFileSync(filePath, 'utf8');
                const originalContent = content;
                
                // Corriger les imports de discord.js avec duplicatas
                const importRegex = /import\s*\{\s*([^}]+)\s*\}\s*from\s*['"]discord\.js['"];?/g;
                
                content = content.replace(importRegex, (match, imports) => {
                    // Séparer les imports et les nettoyer
                    const cleanImports = imports
                        .split(',')
                        .map(imp => imp.trim())
                        .filter(imp => imp.length > 0)
                        .filter((imp, index, arr) => arr.indexOf(imp) === index); // Supprimer les doublons
                    
                    return `import { ${cleanImports.join(', ')} } from 'discord.js';`;
                });
                
                if (content !== originalContent) {
                    writeFileSync(filePath, content);
                    console.log(`✅ ${file}: Imports nettoyés`);
                    totalFixes++;
                }
                
            } catch (error) {
                console.error(`❌ Erreur avec ${file}:`, error.message);
            }
        }
    }
    
    return totalFixes;
}

console.log('🧹 NETTOYAGE DES IMPORTS DISCORD.JS');
console.log('===================================');

const totalFixes = cleanImports('./src');

console.log(`\n🎉 Nettoyage terminé ! ${totalFixes} fichier(s) corrigé(s)`);
