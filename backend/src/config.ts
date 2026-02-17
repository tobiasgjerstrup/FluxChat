import path from 'path';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();

interface RawConfig {
    jwtSecret: string | undefined;
    jwtRefreshSecret: string | undefined;
    port: number | string | undefined;
    ip: string | undefined;
    dbPath: string | undefined;
}

interface Config {
    jwtSecret: string;
    jwtRefreshSecret: string;
    port: number;
    ip: string;
    dbPath: string;
}

const rawConfig: RawConfig = {
    jwtSecret: process.env.JWT_SECRET || '',
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || '',
    port: process.env.PORT || '3000',
    ip: process.env.IP || '127.0.0.1',
    dbPath: process.env.DB_PATH || '',
};

if (!rawConfig.jwtSecret) {
    console.error('invalid config!', rawConfig);
    throw new Error('JWT_SECRET must be a non-empty string');
}
if (!rawConfig.jwtRefreshSecret) {
    console.error('invalid config!', rawConfig);
    throw new Error('JWT_REFRESH_SECRET must be a non-empty string');
}

const portNumber = Number(rawConfig.port);
if (isNaN(portNumber) || portNumber <= 0) {
    console.error('invalid config!', rawConfig);
    throw new Error('PORT must be a valid number greater than 0');
}

const dbDir = rawConfig.dbPath && typeof rawConfig.dbPath === 'string' ? path.dirname(rawConfig.dbPath) : '';
if (typeof rawConfig.dbPath !== 'string' || !rawConfig.dbPath || !fs.existsSync(dbDir)) {
    console.error('invalid config!', rawConfig);
    throw new Error('DB_PATH directory must exist');
}

if (typeof rawConfig.ip !== 'string' || !rawConfig.ip || !isValidIP(rawConfig.ip)) {
    console.error('invalid config!', rawConfig);
    throw new Error('IP must be a valid IPv4 or IPv6 address');
}

const config = {
    jwtSecret: rawConfig.jwtSecret,
    jwtRefreshSecret: rawConfig.jwtRefreshSecret,
    port: portNumber,
    ip: rawConfig.ip,
    dbPath: rawConfig.dbPath,
};

function isValidIP(ip: string): boolean {
    const ipv4 = /^(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)){3}$/;
    const ipv6 = /^([\da-fA-F]{1,4}:){7}[\da-fA-F]{1,4}$/;
    return ipv4.test(ip) || ipv6.test(ip);
}

export default config;
