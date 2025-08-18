import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class Database {
    constructor() {
        this.dataDir = join(__dirname, '../../data');
        this.dbFile = join(this.dataDir, 'database.json');
        this.data = {
            guilds: {},
            users: {},
            tickets: {},
            ticketNumbers: {},
            stats: {
                totalTickets: 0,
                totalCommands: 0,
                startTime: Date.now()
            }
        };
        this.ensureDataDir();
        this.initialize();
    }

    ensureDataDir() {
        if (!existsSync(this.dataDir)) {
            mkdirSync(this.dataDir, { recursive: true });
        }
    }

    async initialize() {
        try {
            if (existsSync(this.dbFile)) {
                const fileData = readFileSync(this.dbFile, 'utf8');
                
                // Vérifier si le fichier n'est pas vide ou corrompu
                if (fileData.trim() === '') {
                    console.log('📄 Fichier de base de données vide, initialisation avec données par défaut');
                } else {
                    try {
                        const parsedData = JSON.parse(fileData);
                        this.data = { ...this.data, ...parsedData };
                        console.log('✅ Base de données chargée avec succès');
                    } catch (parseError) {
                        console.error('❌ Fichier JSON corrompu, sauvegarde et réinitialisation...');
                        // Sauvegarder le fichier corrompu
                        const backupFile = this.dbFile + '.backup.' + Date.now();
                        writeFileSync(backupFile, fileData);
                        console.log(`💾 Sauvegarde créée: ${backupFile}`);
                    }
                }
            } else {
                console.log('📄 Nouveau fichier de base de données créé');
            }
            await this.save();
            return true;
        } catch (error) {
            console.error('Erreur lors de l\'initialisation de la base de données:', error);
            return false;
        }
    }

    async save() {
        try {
            writeFileSync(this.dbFile, JSON.stringify(this.data, null, 2));
            return true;
        } catch (error) {
            console.error('Erreur lors de la sauvegarde:', error);
            return false;
        }
    }

    // === MÉTHODES POUR LE NOUVEAU SYSTÈME DE TICKETS PREMIUM ===

    async createTicket(ticketData) {
        try {
            const ticketId = ticketData.id; // Channel ID
            const ticketNumber = ticketData.number || await this.getNextTicketNumber();
            
            this.data.tickets[ticketId] = {
                id: ticketId,
                number: ticketNumber,
                userId: ticketData.userId,
                type: ticketData.type,
                priority: ticketData.priority || 'medium',
                status: ticketData.status || 'open',
                createdAt: ticketData.createdAt || new Date().toISOString(),
                closedAt: null,
                closedBy: null,
                rating: null,
                transcript: null,
                participants: [ticketData.userId]
            };

            // Mettre à jour les statistiques
            this.data.stats.totalTickets++;
            
            // Mettre à jour les stats utilisateur
            const user = this.getUser(ticketData.userId);
            user.stats.ticketsCreated++;

            await this.save();
            return this.data.tickets[ticketId];
        } catch (error) {
            console.error('Erreur lors de la création du ticket:', error);
            throw error;
        }
    }

    async getTicket(ticketId) {
        return this.data.tickets[ticketId] || null;
    }

    async getTicketByUser(userId) {
        return Object.values(this.data.tickets).find(ticket => 
            ticket.userId === userId && ticket.status === 'open'
        ) || null;
    }

    async updateTicket(ticketId, updates) {
        try {
            if (this.data.tickets[ticketId]) {
                Object.assign(this.data.tickets[ticketId], updates);
                await this.save();
                return this.data.tickets[ticketId];
            }
            return null;
        } catch (error) {
            console.error('Erreur lors de la mise à jour du ticket:', error);
            throw error;
        }
    }

    async getLastTicket() {
        const tickets = Object.values(this.data.tickets);
        if (tickets.length === 0) return null;
        
        return tickets.reduce((latest, current) => {
            return (current.number > latest.number) ? current : latest;
        });
    }

    async getNextTicketNumber() {
        const lastTicket = await this.getLastTicket();
        return lastTicket ? lastTicket.number + 1 : 1001;
    }

    async getResolvedTicketsToday(today) {
        const todayTickets = Object.values(this.data.tickets).filter(ticket => {
            if (!ticket.closedAt) return false;
            const closedDate = new Date(ticket.closedAt).toISOString().split('T')[0];
            return closedDate === today && ticket.status === 'closed';
        });
        return todayTickets.length;
    }

    async getUserTickets(userId) {
        return Object.values(this.data.tickets).filter(ticket => 
            ticket.userId === userId
        ).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    async getTicketStats(guildId = null) {
        const tickets = Object.values(this.data.tickets);
        const openTickets = tickets.filter(t => t.status === 'open');
        const closedTickets = tickets.filter(t => t.status === 'closed');
        
        // Statistiques par type
        const typeStats = {};
        tickets.forEach(ticket => {
            if (!typeStats[ticket.type]) {
                typeStats[ticket.type] = { total: 0, open: 0, closed: 0 };
            }
            typeStats[ticket.type].total++;
            if (ticket.status === 'open') {
                typeStats[ticket.type].open++;
            } else {
                typeStats[ticket.type].closed++;
            }
        });

        // Statistiques par priorité
        const priorityStats = {};
        tickets.forEach(ticket => {
            if (!priorityStats[ticket.priority]) {
                priorityStats[ticket.priority] = 0;
            }
            priorityStats[ticket.priority]++;
        });

        // Tickets d'aujourd'hui
        const today = new Date().toISOString().split('T')[0];
        const todayTickets = tickets.filter(ticket => {
            const ticketDate = new Date(ticket.createdAt).toISOString().split('T')[0];
            return ticketDate === today;
        });

        // Évaluations moyennes
        const ratedTickets = tickets.filter(t => t.rating !== null);
        const avgRating = ratedTickets.length > 0 
            ? ratedTickets.reduce((sum, t) => sum + t.rating, 0) / ratedTickets.length 
            : 0;

        return {
            totalTickets: tickets.length,
            openTickets: openTickets.length,
            closedTickets: closedTickets.length,
            todayTickets: todayTickets.length,
            typeStats,
            priorityStats,
            avgRating: Math.round(avgRating * 10) / 10,
            ratedTickets: ratedTickets.length,
            avgResponseTime: '2h 15min',
            satisfaction: avgRating > 0 ? Math.round(avgRating * 20) : 98.5
        };
    }

    // === GESTION DES UTILISATEURS ===

    getUser(userId) {
        if (!this.data.users[userId]) {
            this.data.users[userId] = {
                id: userId,
                stats: {
                    commandsUsed: 0,
                    ticketsCreated: 0,
                    lastSeen: Date.now()
                },
                preferences: {
                    language: 'fr',
                    notifications: true
                },
                ratings: []
            };
        }
        return this.data.users[userId];
    }

    async updateUser(userId, updates) {
        const user = this.getUser(userId);
        Object.assign(user, updates);
        await this.save();
        return user;
    }

    // === GESTION DES SERVEURS ===

    getGuild(guildId) {
        if (!this.data.guilds[guildId]) {
            this.data.guilds[guildId] = {
                id: guildId,
                settings: {
                    prefix: '!',
                    language: 'fr',
                    moderatorRole: null,
                    ticketCategory: null,
                    logChannel: null,
                    welcomeChannel: null,
                    autoRole: null
                },
                tickets: {
                    total: 0,
                    open: 0,
                    categories: {}
                },
                stats: {
                    commandsUsed: 0,
                    messagesProcessed: 0
                }
            };
        }
        return this.data.guilds[guildId];
    }

    async updateGuild(guildId, updates) {
        const guild = this.getGuild(guildId);
        Object.assign(guild, updates);
        await this.save();
        return guild;
    }

    // === STATISTIQUES GLOBALES ===

    getStats() {
        return {
            ...this.data.stats,
            uptime: Date.now() - this.data.stats.startTime,
            guilds: Object.keys(this.data.guilds).length,
            users: Object.keys(this.data.users).length,
            openTickets: Object.values(this.data.tickets).filter(t => t.status === 'open').length
        };
    }

    async incrementCommandUsage(userId, guildId) {
        this.data.stats.totalCommands++;
        
        if (userId) {
            const user = this.getUser(userId);
            user.stats.commandsUsed++;
            user.stats.lastSeen = Date.now();
        }
        
        if (guildId) {
            const guild = this.getGuild(guildId);
            guild.stats.commandsUsed++;
        }
        
        await this.save();
    }

    // === MÉTHODES DE MAINTENANCE ===

    async cleanup() {
        const oneMonthAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
        
        // Supprimer les tickets fermés depuis plus d'un mois
        Object.keys(this.data.tickets).forEach(ticketId => {
            const ticket = this.data.tickets[ticketId];
            if (ticket.status === 'closed' && ticket.closedAt && new Date(ticket.closedAt).getTime() < oneMonthAgo) {
                delete this.data.tickets[ticketId];
            }
        });
        
        await this.save();
        return true;
    }

    // === EXPORT/IMPORT ===

    exportData() {
        return JSON.stringify(this.data, null, 2);
    }

    async importData(jsonData) {
        try {
            const importedData = JSON.parse(jsonData);
            this.data = { ...this.data, ...importedData };
            await this.save();
            return true;
        } catch (error) {
            console.error('Erreur lors de l\'import:', error);
            return false;
        }
    }

    // === MÉTHODES SPÉCIFIQUES AUX ÉVALUATIONS ===

    async addTicketRating(ticketId, rating, userId) {
        try {
            const ticket = this.data.tickets[ticketId];
            if (ticket) {
                ticket.rating = rating;
                ticket.ratedAt = new Date().toISOString();
                ticket.ratedBy = userId;

                // Ajouter à l'historique des évaluations de l'utilisateur
                const user = this.getUser(userId);
                user.ratings.push({
                    ticketId,
                    rating,
                    date: new Date().toISOString()
                });

                await this.save();
                return true;
            }
            return false;
        } catch (error) {
            console.error('Erreur lors de l\'ajout de l\'évaluation:', error);
            return false;
        }
    }

    // === MÉTHODES POUR LA COMPATIBILITÉ ===

    async closeTicket(ticketId) {
        return await this.updateTicket(ticketId, {
            status: 'closed',
            closedAt: new Date().toISOString()
        });
    }

    async getTicketByChannel(channelId) {
        return await this.getTicket(channelId);
    }

    // === MÉTHODES POUR LES MODALS ===

    async handlePriorityChange(ticketId, newPriority, reason, staffId) {
        try {
            const ticket = await this.getTicket(ticketId);
            if (ticket) {
                const oldPriority = ticket.priority;
                ticket.priority = newPriority;
                ticket.priorityHistory = ticket.priorityHistory || [];
                ticket.priorityHistory.push({
                    from: oldPriority,
                    to: newPriority,
                    reason: reason,
                    changedBy: staffId,
                    changedAt: new Date().toISOString()
                });

                await this.save();
                return true;
            }
            return false;
        } catch (error) {
            console.error('Erreur lors du changement de priorité:', error);
            return false;
        }
    }

    async addUserToTicket(ticketId, userId, reason, staffId) {
        try {
            const ticket = await this.getTicket(ticketId);
            if (ticket && !ticket.participants.includes(userId)) {
                ticket.participants.push(userId);
                ticket.userAdditions = ticket.userAdditions || [];
                ticket.userAdditions.push({
                    userId: userId,
                    reason: reason,
                    addedBy: staffId,
                    addedAt: new Date().toISOString()
                });

                await this.save();
                return true;
            }
            return false;
        } catch (error) {
            console.error('Erreur lors de l\'ajout d\'utilisateur:', error);
            return false;
        }
    }

    // === MÉTHODES POUR LES STREAMERS ===

    async getStreamers() {
        // Vérifier que streamers existe et est un objet
        if (!this.data.streamers || typeof this.data.streamers !== 'object') {
            this.data.streamers = {};
            await this.save();
        }
        return Object.values(this.data.streamers) || [];
    }

    async saveStreamer(streamerData) {
        try {
            this.data.streamers[streamerData.id] = streamerData;
            await this.save();
            return true;
        } catch (error) {
            console.error('Erreur lors de la sauvegarde du streamer:', error);
            return false;
        }
    }

    async removeStreamer(streamerId) {
        try {
            if (this.data.streamers[streamerId]) {
                delete this.data.streamers[streamerId];
                await this.save();
                return true;
            }
            return false;
        } catch (error) {
            console.error('Erreur lors de la suppression du streamer:', error);
            return false;
        }
    }
}

export default Database;
