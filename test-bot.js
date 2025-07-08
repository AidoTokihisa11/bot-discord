#!/usr/bin/env node

import chalk from 'chalk';
import { spawn } from 'child_process';

console.log(chalk.blue('🧪 TEST ÉTAPE PAR ÉTAPE - Bot Discord\n'));

async function runCommand(command, args = [], description) {
    return new Promise((resolve) => {
        console.log(chalk.cyan(`🔄 ${description}...`));
        
        const process = spawn(command, args, { stdio: 'pipe' });
        let output = '';
        let errorOutput = '';
        
        process.stdout.on('data', (data) => {
            output += data.toString();
        });
        
        process.stderr.on('data', (data) => {
            errorOutput += data.toString();
        });
        
        process.on('close', (code) => {
            if (code === 0) {
                console.log(chalk.green(`✅ ${description} - SUCCÈS`));
                if (output.trim()) {
                    console.log(chalk.gray(`   ${output.trim().split('\n')[0]}`));
                }
            } else {
                console.log(chalk.red(`❌ ${description} - ÉCHEC (code ${code})`));
                if (errorOutput.trim()) {
                    console.log(chalk.red(`   Erreur: ${errorOutput.trim().split('\n')[0]}`));
                }
            }
            resolve(code === 0);
        });
        
        // Timeout après 30 secondes
        setTimeout(() => {
            process.kill();
            console.log(chalk.yellow(`⏰ ${description} - TIMEOUT`));
            resolve(false);
        }, 30000);
    });
}

async function runTests() {
    const tests = [
        {
            command: 'node',
            args: ['diagnostic-errors.js'],
            description: 'Diagnostic des erreurs'
        },
        {
            command: 'node',
            args: ['-e', 'import("./src/utils/Logger.js").then(() => console.log("OK"))'],
            description: 'Test Logger'
        },
        {
            command: 'node',
            args: ['-e', 'import("./src/utils/Database.js").then(() => console.log("OK"))'],
            description: 'Test Database'
        },
        {
            command: 'node',
            args: ['-e', 'import("./src/utils/CacheManager.js").then(() => console.log("OK"))'],
            description: 'Test CacheManager'
        },
        {
            command: 'node',
            args: ['-e', 'import("./src/handlers/ButtonHandler.js").then(() => console.log("OK"))'],
            description: 'Test ButtonHandler'
        },
        {
            command: 'node',
            args: ['-e', 'import("./src/handlers/ModalHandler.js").then(() => console.log("OK"))'],
            description: 'Test ModalHandler'
        },
        {
            command: 'node',
            args: ['-e', 'import("./src/managers/TicketManager.js").then(() => console.log("OK"))'],
            description: 'Test TicketManager'
        }
    ];
    
    let passed = 0;
    let failed = 0;
    
    for (const test of tests) {
        const success = await runCommand(test.command, test.args, test.description);
        if (success) {
            passed++;
        } else {
            failed++;
        }
        console.log(''); // Ligne vide
    }
    
    console.log(chalk.blue('📊 RÉSULTATS DES TESTS'));
    console.log(chalk.green(`✅ Tests réussis: ${passed}`));
    console.log(chalk.red(`❌ Tests échoués: ${failed}`));
    
    if (failed === 0) {
        console.log(chalk.green('\n🎉 TOUS LES TESTS SONT PASSÉS !'));
        console.log(chalk.green('Votre bot est prêt à démarrer.'));
        
        console.log(chalk.blue('\n🚀 Commandes de démarrage:'));
        console.log(chalk.white('npm run deploy                 # Déployer les commandes'));
        console.log(chalk.white('npm start                      # Démarrer le bot'));
    } else {
        console.log(chalk.red('\n❌ CERTAINS TESTS ONT ÉCHOUÉ'));
        console.log(chalk.yellow('Vérifiez les erreurs ci-dessus et corrigez-les avant de démarrer le bot.'));
    }
}

runTests().catch(console.error);
