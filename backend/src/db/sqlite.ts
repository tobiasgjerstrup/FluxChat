import Database from 'better-sqlite3';
import config from '../config.js';

let db: Database.Database | null = null;

export async function sqliteDBSetup() {
    if (!db) {
        db = new Database(config.dbPath);
        db.pragma('journal_mode = WAL');
    }

    db.prepare(
        `CREATE TABLE IF NOT EXISTS Users (
            id INTEGER PRIMARY KEY,
            username TEXT NOT NULL UNIQUE,
            email TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            avatar_url TEXT,
            created_at DATETIME NOT NULL,
            last_online_at DATETIME
        );`,
    ).run();

    db.prepare(
        `CREATE TABLE IF NOT EXISTS Servers (
            id INTEGER PRIMARY KEY,
            owner_id INTEGER NOT NULL,
            name TEXT NOT NULL UNIQUE,
            icon_url TEXT,
            created_at DATETIME NOT NULL,
            FOREIGN KEY (owner_id) REFERENCES Users(id)
        );`,
    ).run();

    db.prepare(
        `CREATE TABLE IF NOT EXISTS ServerMembers (
            id INTEGER PRIMARY KEY,
            server_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            nickname TEXT,
            joined_at DATETIME NOT NULL,
            FOREIGN KEY (server_id) REFERENCES Servers(id),
            FOREIGN KEY (user_id) REFERENCES Users(id)
        );`,
    ).run();

    db.prepare(
        `CREATE TABLE IF NOT EXISTS Roles (
            id INTEGER PRIMARY KEY,
            server_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            color TEXT,
            position INTEGER,
            permissions TEXT,
            FOREIGN KEY (server_id) REFERENCES Servers(id)
        );`,
    ).run();

    db.prepare(
        `CREATE TABLE IF NOT EXISTS MemberRoles (
            id INTEGER PRIMARY KEY,
            member_id INTEGER NOT NULL,
            role_id INTEGER NOT NULL,
            FOREIGN KEY (member_id) REFERENCES ServerMembers(id),
            FOREIGN KEY (role_id) REFERENCES Roles(id)
        );`,
    ).run();

    db.prepare(
        `CREATE TABLE IF NOT EXISTS Channels (
            id INTEGER PRIMARY KEY,
            server_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            type TEXT NOT NULL,
            parent_id INTEGER,
            position INTEGER,
            topic TEXT,
            created_at DATETIME NOT NULL,
            FOREIGN KEY (server_id) REFERENCES Servers(id),
            FOREIGN KEY (parent_id) REFERENCES Channels(id)
        );`,
    ).run();

    db.prepare(
        `CREATE TABLE IF NOT EXISTS ChannelPermissions (
            id INTEGER PRIMARY KEY,
            channel_id INTEGER NOT NULL,
            role_id INTEGER,
            user_id INTEGER,
            allow TEXT,
            deny TEXT,
            FOREIGN KEY (channel_id) REFERENCES Channels(id),
            FOREIGN KEY (role_id) REFERENCES Roles(id),
            FOREIGN KEY (user_id) REFERENCES Users(id)
        );`,
    ).run();

    db.prepare(
        `CREATE TABLE IF NOT EXISTS Messages (
            id INTEGER PRIMARY KEY,
            channel_id INTEGER NOT NULL,
            author_id INTEGER NOT NULL,
            content TEXT NOT NULL,
            created_at DATETIME NOT NULL,
            edited_at DATETIME,
            reply_to_id INTEGER,
            FOREIGN KEY (channel_id) REFERENCES Channels(id),
            FOREIGN KEY (author_id) REFERENCES Users(id),
            FOREIGN KEY (reply_to_id) REFERENCES Messages(id)
        );`,
    ).run();

    db.prepare(
        `CREATE TABLE IF NOT EXISTS MessageAttachments (
            id INTEGER PRIMARY KEY,
            message_id INTEGER NOT NULL,
            url TEXT NOT NULL,
            filename TEXT,
            size_bytes INTEGER,
            FOREIGN KEY (message_id) REFERENCES Messages(id)
        );`,
    ).run();

    db.prepare(
        `CREATE TABLE IF NOT EXISTS MessageReactions (
            id INTEGER PRIMARY KEY,
            message_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            emoji TEXT NOT NULL,
            FOREIGN KEY (message_id) REFERENCES Messages(id),
            FOREIGN KEY (user_id) REFERENCES Users(id)
        );`,
    ).run();

    db.prepare(
        `CREATE TABLE IF NOT EXISTS DMChannels (
            id INTEGER PRIMARY KEY,
            is_group BOOLEAN NOT NULL,
            created_at DATETIME NOT NULL
        );`,
    ).run();

    db.prepare(
        `CREATE TABLE IF NOT EXISTS DMParticipants (
            id INTEGER PRIMARY KEY,
            dm_channel_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            FOREIGN KEY (dm_channel_id) REFERENCES DMChannels(id),
            FOREIGN KEY (user_id) REFERENCES Users(id)
        );`,
    ).run();

    db.prepare(
        `CREATE TABLE IF NOT EXISTS DMMessages (
            id INTEGER PRIMARY KEY,
            dm_channel_id INTEGER NOT NULL,
            author_id INTEGER NOT NULL,
            content TEXT NOT NULL,
            created_at DATETIME NOT NULL,
            edited_at DATETIME,
            FOREIGN KEY (dm_channel_id) REFERENCES DMChannels(id),
            FOREIGN KEY (author_id) REFERENCES Users(id)
        );`,
    ).run();
    /* db.prepare(`DELETE FROM DMMessages`).run();
    db.prepare(`DELETE FROM DMParticipants`).run();
    db.prepare(`DELETE FROM DMChannels`).run(); */

    db.prepare(
        `CREATE TABLE IF NOT EXISTS UserStatus (
            user_id INTEGER PRIMARY KEY,
            status TEXT NOT NULL,
            custom_status TEXT,
            updated_at DATETIME NOT NULL,
            FOREIGN KEY (user_id) REFERENCES Users(id)
        );`,
    ).run();

    db.prepare(
        `CREATE TABLE IF NOT EXISTS Notifications (
            id INTEGER PRIMARY KEY,
            user_id INTEGER NOT NULL,
            type TEXT NOT NULL,
            data TEXT,
            created_at DATETIME NOT NULL,
            read_at DATETIME,
            FOREIGN KEY (user_id) REFERENCES Users(id)
        );`,
    ).run();

    db.prepare(
        `CREATE TABLE IF NOT EXISTS ServerBans (
            id INTEGER PRIMARY KEY,
            server_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            banned_by_id INTEGER NOT NULL,
            reason TEXT,
            created_at DATETIME NOT NULL,
            expires_at DATETIME,
            unbanned_by_id INTEGER,
            unbanned_at DATETIME,
            FOREIGN KEY (server_id) REFERENCES Servers(id),
            FOREIGN KEY (user_id) REFERENCES Users(id),
            FOREIGN KEY (banned_by_id) REFERENCES Users(id),
            FOREIGN KEY (unbanned_by_id) REFERENCES Users(id)
        );`,
    ).run();

    db.prepare(
        `CREATE TABLE IF NOT EXISTS AuditLogs (
            id INTEGER PRIMARY KEY,
            server_id INTEGER NOT NULL,
            actor_id INTEGER NOT NULL,
            action_type TEXT NOT NULL,
            target_user_id INTEGER,
            target_role_id INTEGER,
            target_channel_id INTEGER,
            target_message_id INTEGER,
            metadata TEXT,
            created_at DATETIME NOT NULL,
            FOREIGN KEY (server_id) REFERENCES Servers(id),
            FOREIGN KEY (actor_id) REFERENCES Users(id),
            FOREIGN KEY (target_user_id) REFERENCES Users(id),
            FOREIGN KEY (target_role_id) REFERENCES Roles(id),
            FOREIGN KEY (target_channel_id) REFERENCES Channels(id),
            FOREIGN KEY (target_message_id) REFERENCES Messages(id)
        );`,
    ).run();

    db.prepare(
        `CREATE TABLE IF NOT EXISTS ServerInvites (
                id INTEGER PRIMARY KEY,
                code TEXT NOT NULL UNIQUE,
                server_id INTEGER NOT NULL,
                channel_id INTEGER,
                creator_id INTEGER NOT NULL,
                max_uses INTEGER,
                uses INTEGER NOT NULL DEFAULT 0,
                expires_at DATETIME,
                temporary BOOLEAN NOT NULL DEFAULT 0,
                revoked BOOLEAN NOT NULL DEFAULT 0,
                created_at DATETIME NOT NULL,
                FOREIGN KEY (server_id) REFERENCES Servers(id),
                FOREIGN KEY (channel_id) REFERENCES Channels(id),
                FOREIGN KEY (creator_id) REFERENCES Users(id)
            );`,
    ).run();

    db.prepare(
        `CREATE TABLE IF NOT EXISTS RefreshTokens (
            id INTEGER PRIMARY KEY,
            user_id INTEGER NOT NULL,
            token TEXT NOT NULL,
            created_at DATETIME NOT NULL,
            expires_at DATETIME NOT NULL,
            FOREIGN KEY (user_id) REFERENCES Users(id)
        );`,
    ).run();

    db.prepare(`DELETE FROM RefreshTokens WHERE expires_at < datetime('now')`).run();

    return db;
}
