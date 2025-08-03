import { spawn } from 'child_process';
import chalk from 'chalk';

console.log(chalk.cyan('🧪 Test de démarrage du bot avec le système de modération...\n'));

// Lancer le bot en mode test
const botProcess = spawn('node', ['src/index.js'], {
    cwd: process.cwd(),
    stdio: 'pipe',
    env: { ...process.env, NODE_ENV: 'test' }
});

let output = '';
let hasError = false;
let moderationLoaded = false;

// Capturer la sortie
botProcess.stdout.on('data', (data) => {
    const text = data.toString();
    output += text;
    console.log(text);
    
    // Vérifier si le système de modération est chargé
    if (text.includes('Système de modération initialisé')) {
        moderationLoaded = true;
        console.log(chalk.green('✅ Système de modération détecté comme initialisé'));
    }
    
    // Arrêter le test après quelques secondes si tout va bien
    if (text.includes('Bot connecté') && moderationLoaded) {
        setTimeout(() => {
            console.log(chalk.green('\n✅ Test réussi ! Le bot et le système de modération se lancent correctement.'));
            botProcess.kill();
            process.exit(0);
        }, 3000);
    }
});

// Capturer les erreurs
botProcess.stderr.on('data', (data) => {
    const text = data.toString();
    output += text;
    hasError = true;
    console.error(chalk.red(text));
});

// Gérer la fermeture
botProcess.on('close', (code) => {
    if (code !== 0 && !hasError) {
        console.log(chalk.yellow(`\n⚠️ Le bot s'est arrêté avec le code ${code}`));
    }
    
    if (hasError) {
        console.log(chalk.red('\n❌ Erreurs détectées durant le test'));
        console.log(chalk.gray('Output complet:'));
        console.log(output);
        process.exit(1);
    } else if (!moderationLoaded) {
        console.log(chalk.yellow('\n⚠️ Le système de modération n\'a pas été détecté comme initialisé'));
        process.exit(1);
    }
});

// Timeout de sécurité
setTimeout(() => {
    console.log(chalk.yellow('\n⏰ Timeout du test atteint'));
    botProcess.kill();
    
    if (moderationLoaded) {
        console.log(chalk.green('✅ Système de modération initialisé avec succès'));
        process.exit(0);
    } else {
        console.log(chalk.red('❌ Le système de modération n\'a pas été initialisé dans les temps'));
        process.exit(1);
    }
}, 15000);
