import chalk from 'chalk';
import moment from 'moment';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class Logger {
    constructor() {
        this.logDir = join(__dirname, '../../logs');
        this.ensureLogDir();
        
        // Configuration moment en français
        moment.locale('fr');
    }

    ensureLogDir() {
        if (!existsSync(this.logDir)) {
            mkdirSync(this.logDir, { recursive: true });
        }
    }

    getTimestamp() {
        return moment().format('DD/MM/YYYY HH:mm:ss');
    }

    getLogFileName() {
        return `bot-${moment().format('YYYY-MM-DD')}.log`;
    }

    formatMessage(level, message, data = null) {
        const timestamp = this.getTimestamp();
        let logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
        
        if (data) {
            if (data instanceof Error) {
                logMessage += `\n${data.stack}`;
            } else if (typeof data === 'object') {
                logMessage += `\n${JSON.stringify(data, null, 2)}`;
            } else {
                logMessage += ` ${data}`;
            }
        }
        
        return logMessage;
    }

    writeToFile(message) {
        try {
            const logFile = join(this.logDir, this.getLogFileName());
            writeFileSync(logFile, message + '\n', { flag: 'a' });
        } catch (error) {
            console.error('Erreur lors de l\'écriture du log:', error);
        }
    }

    info(message, data = null) {
        const formatted = this.formatMessage('INFO', message, data);
        console.log(chalk.blue('ℹ️ ') + chalk.white(message));
        this.writeToFile(formatted);
    }

    success(message, data = null) {
        const formatted = this.formatMessage('SUCCESS', message, data);
        console.log(chalk.green('✅ ') + chalk.white(message));
        this.writeToFile(formatted);
    }

    warn(message, data = null) {
        const formatted = this.formatMessage('WARN', message, data);
        console.log(chalk.yellow('⚠️ ') + chalk.yellow(message));
        this.writeToFile(formatted);
    }

    error(message, data = null) {
        const formatted = this.formatMessage('ERROR', message, data);
        console.log(chalk.red('❌ ') + chalk.red(message));
        if (data) {
            console.error(data);
        }
        this.writeToFile(formatted);
    }

    debug(message, data = null) {
        if (process.env.NODE_ENV === 'development') {
            const formatted = this.formatMessage('DEBUG', message, data);
            console.log(chalk.magenta('🐛 ') + chalk.gray(message));
            this.writeToFile(formatted);
        }
    }

    command(user, command, guild = null) {
        const guildInfo = guild ? ` dans ${guild.name}` : ' en MP';
        const message = `${user.tag} utilise /${command}${guildInfo}`;
        const formatted = this.formatMessage('COMMAND', message);
        console.log(chalk.cyan('🎯 ') + chalk.white(message));
        this.writeToFile(formatted);
    }

    ticket(action, user, ticketId, category = null) {
        const categoryInfo = category ? ` (${category})` : '';
        const message = `${action} ticket ${ticketId}${categoryInfo} par ${user.tag}`;
        const formatted = this.formatMessage('TICKET', message);
        console.log(chalk.magenta('🎫 ') + chalk.white(message));
        this.writeToFile(formatted);
    }

    startup() {
        const banner = `
╔══════════════════════════════════════════════════════════════╗
║                    🤖 BOT DISCORD AVANCÉ                     ║
║                        Version 2.0.0                        ║
║                      Créé par theog                         ║
╚══════════════════════════════════════════════════════════════╝
        `;
        console.log(chalk.cyan(banner));
        this.info('Démarrage du bot Discord avancé v2.0.0');
    }

    ready(client) {
        const stats = `
╔══════════════════════════════════════════════════════════════╗
║                      ✅ BOT CONNECTÉ                         ║
║                                                              ║
║  👤 Utilisateur: ${client.user.tag.padEnd(43)} ║
║  🏠 Serveurs: ${client.guilds.cache.size.toString().padEnd(46)} ║
║  👥 Utilisateurs: ${client.users.cache.size.toString().padEnd(42)} ║
║  📁 Commandes: ${client.commands.size.toString().padEnd(41)} ║
║  ⚡ Événements: ${client.events.size.toString().padEnd(40)} ║
║                                                              ║
║  🕐 Démarré le: ${moment().format('DD/MM/YYYY à HH:mm:ss').padEnd(40)} ║
╚══════════════════════════════════════════════════════════════╝
        `;
        console.log(chalk.green(stats));
        this.success(`Bot connecté avec succès en tant que ${client.user.tag}`);
    }
}

export default Logger;
