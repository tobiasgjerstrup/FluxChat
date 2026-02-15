import path from 'path';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();

interface RawConfig {
    jwtSecret: string | undefined;
    port: number | string | undefined;
    ip: string | undefined;
    dbPath: string | undefined;
}

interface Config {
    jwtSecret: string;
    port: number;
    ip: string;
    dbPath: string;
}

const config: RawConfig = {
    jwtSecret: process.env.JWT_SECRET,
    port: process.env.PORT,
    ip: process.env.IP,
    dbPath: process.env.DB_PATH,
};

if (!config.jwtSecret || typeof config.jwtSecret !== 'string') {
    console.error('invalid config!', config);
    throw new Error('JWT_SECRET must be a non-empty string');
}

const portNumber = Number(config.port);
if (isNaN(portNumber) || portNumber <= 0) {
    console.error('invalid config!', config);
    throw new Error('PORT must be a valid number greater than 0');
}
config.port = portNumber;

const dbDir = config.dbPath && typeof config.dbPath === 'string' ? path.dirname(config.dbPath) : '';
if (typeof config.dbPath !== 'string' || !config.dbPath || !fs.existsSync(dbDir)) {
    console.error('invalid config!', config);
    throw new Error('DB_PATH directory must exist');
}

function isValidIP(ip: string): boolean {
    const ipv4 = /^(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)){3}$/;
    const ipv6 = /^([\da-fA-F]{1,4}:){7}[\da-fA-F]{1,4}$/;
    return ipv4.test(ip) || ipv6.test(ip);
}

if (typeof config.ip !== 'string' || !config.ip || !isValidIP(config.ip)) {
    console.error('invalid config!', config);
    throw new Error('IP must be a valid IPv4 or IPv6 address');
}

export default config as Config;
