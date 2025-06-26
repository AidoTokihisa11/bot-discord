-- Table pour stocker les configurations des rôles gaming
CREATE TABLE IF NOT EXISTS gaming_roles_config (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id TEXT NOT NULL,
    game_key TEXT NOT NULL,
    role_id TEXT NOT NULL,
    message_id TEXT,
    channel_id TEXT,
    enabled BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(guild_id, game_key)
);

-- Table pour stocker les statistiques des rôles gaming
CREATE TABLE IF NOT EXISTS gaming_roles_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    game_key TEXT NOT NULL,
    action TEXT NOT NULL, -- 'add' ou 'remove'
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX(guild_id, game_key),
    INDEX(user_id),
    INDEX(timestamp)
);

-- Table pour stocker les messages de rôles gaming
CREATE TABLE IF NOT EXISTS gaming_roles_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id TEXT NOT NULL,
    channel_id TEXT NOT NULL,
    message_id TEXT NOT NULL UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_gaming_config_guild ON gaming_roles_config(guild_id);
CREATE INDEX IF NOT EXISTS idx_gaming_stats_guild_game ON gaming_roles_stats(guild_id, game_key);
CREATE INDEX IF NOT EXISTS idx_gaming_stats_user ON gaming_roles_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_gaming_stats_timestamp ON gaming_roles_stats(timestamp);
CREATE INDEX IF NOT EXISTS idx_gaming_messages_guild ON gaming_roles_messages(guild_id);
