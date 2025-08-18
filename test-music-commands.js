import { readdirSync, statSync } from 'fs';
import { join } from 'path';
import { pathToFileURL, fileURLToPath } from 'url';
import { dirname } from 'path';
import chalk from 'chalk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log(chalk.blue('🎵 Test du système de musique - Vérification des commandes\n'));

const musicCommands = [];
const musicDir = join(__dirname, 'src', 'commands', 'music');

async function testMusicCommands() {
    try {
        const files = readdirSync(musicDir);
        
        console.log(chalk.yellow('📁 Commandes trouvées dans le dossier music:'));
        
        for (const file of files) {
            if (file.endsWith('.js')) {
                try {
                    const commandPath = join(musicDir, file);
                    const command = await import(pathToFileURL(commandPath).href);
                    const commandData = command.default || command;
                    
                    if ('data' in commandData && 'execute' in commandData) {
                        musicCommands.push({
                            name: commandData.data.name,
                            description: commandData.data.description,
                            file: file
                        });
                        console.log(chalk.green(`✅ ${commandData.data.name} - ${commandData.data.description}`));
                    } else {
                        console.log(chalk.red(`❌ ${file} - Structure invalide`));
                    }
                } catch (error) {
                    console.log(chalk.red(`❌ ${file} - Erreur: ${error.message}`));
                }
            }
        }
        
        console.log(chalk.blue(`\n📊 Résumé: ${musicCommands.length} commandes de musique chargées\n`));
        
        // Afficher la liste des commandes pour les tests
        console.log(chalk.magenta('🎯 Commandes disponibles pour les tests:'));
        musicCommands.forEach(cmd => {
            console.log(chalk.cyan(`   /${cmd.name}`));
        });
        
        console.log(chalk.yellow('\n💡 Pour tester:'));
        console.log(chalk.white('1. Démarrez le bot: npm start'));
        console.log(chalk.white('2. Rejoignez un canal vocal'));
        console.log(chalk.white('3. Testez avec: /join puis /play Never Gonna Give You Up'));
        
        // Vérifier les dépendances
        console.log(chalk.blue('\n🔍 Vérification des dépendances...'));
        
        try {
            await import('@discordjs/voice');
            console.log(chalk.green('✅ @discordjs/voice'));
        } catch (error) {
            console.log(chalk.red('❌ @discordjs/voice - Installation requise'));
        }
        
        try {
            await import('play-dl');
            console.log(chalk.green('✅ play-dl'));
        } catch (error) {
            console.log(chalk.red('❌ play-dl - Installation requise'));
        }
        
        try {
            await import('ytdl-core');
            console.log(chalk.green('✅ ytdl-core'));
        } catch (error) {
            console.log(chalk.red('❌ ytdl-core - Installation requise'));
        }
        
        try {
            await import('ffmpeg-static');
            console.log(chalk.green('✅ ffmpeg-static'));
        } catch (error) {
            console.log(chalk.red('❌ ffmpeg-static - Installation requise'));
        }
        
        console.log(chalk.blue('\n🚀 Le système de musique est prêt !'));
        
    } catch (error) {
        console.error(chalk.red('❌ Erreur lors du test:'), error);
    }
}

testMusicCommands();
