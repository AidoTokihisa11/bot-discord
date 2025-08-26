import fs from 'fs/promises';
import path from 'path';

// Script ultra-performant pour restriction globale TOTALE
const RESTRICTION_CHECK = `
        // === RESTRICTION GLOBALE AIDOTOKIHISA ===
        if (interaction.user.id !== '421245210220298240') {
            if (!interaction.client.accessRestriction) {
                const { default: AccessRestriction } = await import('../../utils/AccessRestriction.js');
                interaction.client.accessRestriction = new AccessRestriction();
            }
            const hasAccess = await interaction.client.accessRestriction.checkAccess(interaction);
            if (!hasAccess) return;
        }`;

async function deployGlobalRestrictions() {
    console.log('🚀 DÉPLOIEMENT RESTRICTION TOTALE EN COURS...');
    console.log('═══════════════════════════════════════════════════');
    
    const targets = [
        'src/commands/**/*.js',
        'src/handlers/*.js', 
        'src/managers/*.js'
    ];
    
    let totalProtected = 0;
    
    // Protéger tous les fichiers de commandes
    const commandDirs = ['src/commands/general', 'src/commands/music', 'src/commands/tickets'];
    
    for (const dir of commandDirs) {
        const files = await fs.readdir(dir);
        
        for (const file of files) {
            if (file.endsWith('.js')) {
                const filePath = path.join(dir, file);
                await protectSingleFile(filePath);
                totalProtected++;
                console.log(`🔒 ${filePath} - RESTRICTION APPLIQUÉE`);
            }
        }
    }
    
    // Protéger tous les handlers
    const handlerFiles = await fs.readdir('src/handlers');
    for (const file of handlerFiles) {
        if (file.endsWith('.js')) {
            const filePath = path.join('src/handlers', file);
            await protectSingleFile(filePath);
            totalProtected++;
            console.log(`🔒 ${filePath} - RESTRICTION APPLIQUÉE`);
        }
    }
    
    // Protéger tous les managers
    const managerFiles = await fs.readdir('src/managers');
    for (const file of managerFiles) {
        if (file.endsWith('.js')) {
            const filePath = path.join('src/managers', file);
            await protectSingleFile(filePath);
            totalProtected++;
            console.log(`🔒 ${filePath} - RESTRICTION APPLIQUÉE`);
        }
    }
    
    console.log('═══════════════════════════════════════════════════');
    console.log(`✅ ${totalProtected} FICHIERS PROTÉGÉS`);
    console.log('🎯 RESTRICTION GLOBALE DÉPLOYÉE AVEC SUCCÈS !');
    console.log('🔐 SEUL AIDOTOKIHISA (421245210220298240) A ACCÈS');
}

async function protectSingleFile(filePath) {
    try {
        let content = await fs.readFile(filePath, 'utf8');
        
        // Si déjà protégé, ignorer
        if (content.includes('RESTRICTION GLOBALE AIDOTOKIHISA')) {
            return;
        }
        
        // Trouver les fonctions execute/handle et ajouter la restriction
        const patterns = [
            /(async execute\(interaction[^)]*\)\s*\{)/g,
            /(async handle\w*\(interaction[^)]*\)\s*\{)/g
        ];
        
        for (const pattern of patterns) {
            content = content.replace(pattern, (match) => {
                return match + RESTRICTION_CHECK;
            });
        }
        
        await fs.writeFile(filePath, content);
        
    } catch (error) {
        console.error(`❌ Erreur ${filePath}:`, error.message);
    }
}

// Lancement immédiat
deployGlobalRestrictions();
