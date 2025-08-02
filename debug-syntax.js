import fs from 'fs';

const fileContent = fs.readFileSync('./src/managers/TicketManager.js', 'utf8');
const lines = fileContent.split('\n');

let inFunction = false;
let braceCount = 0;
let inClass = false;

for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const lineNum = i + 1;
    
    // Détecter début de classe
    if (line.includes('class TicketManager')) {
        inClass = true;
        braceCount = 0;
    }
    
    // Compter les accolades
    braceCount += (line.match(/\{/g) || []).length;
    braceCount -= (line.match(/\}/g) || []).length;
    
    // Détecter début de fonction/méthode
    if (line.includes('async ') || line.match(/^\s*[a-zA-Z_][a-zA-Z0-9_]*\s*\(/)) {
        if (braceCount > 0) {
            inFunction = true;
        }
    }
    
    // Détecter return en dehors de fonction
    if (line.includes('return') && !inFunction && inClass) {
        console.log(`❌ RETURN SUSPECT à la ligne ${lineNum}: ${line}`);
        console.log(`   braceCount: ${braceCount}, inFunction: ${inFunction}, inClass: ${inClass}`);
    }
    
    // Réinitialiser inFunction si on sort du bloc
    if (braceCount <= 1 && inClass) {
        inFunction = false;
    }
}
