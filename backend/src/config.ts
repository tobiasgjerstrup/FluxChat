import path from 'path';
import dotenv from 'dotenv';
import fs from 'fs';
import type { StringValue } from 'ms';

if (process.env.NODE_ENV === 'test') {
    dotenv.config({ path: '.env.test' });
} else {
    dotenv.config();
}

interface Config {
    jwtSecret: string;
    jwtExpiration: StringValue;
    jwtRefreshSecret: string;
    jwtRefreshExpiration: StringValue;
    port: number;
    ip: string;
    dbPath: string;
    frontendUrl: string;
}

const rawConfig = {
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiration: process.env.JWT_EXPIRATION,
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
    jwtRefreshExpiration: process.env.JWT_REFRESH_EXPIRATION,
    port: process.env.PORT,
    ip: process.env.IP,
    dbPath: process.env.DB_PATH,
    frontendUrl: process.env.FRONTEND_URL,
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

if (typeof rawConfig.jwtExpiration !== 'string' || !rawConfig.jwtExpiration) {
    console.error('invalid config!', rawConfig);
    throw new Error('JWT_EXPIRATION must be a non-empty string');
}

if (!isStringValue(rawConfig.jwtExpiration)) {
    console.error('invalid config!', rawConfig);
    throw new Error('JWT_EXPIRATION must be a valid duration string');
}
// Type assertion is safe here because we just validated it
const jwtExpiration = rawConfig.jwtExpiration as StringValue;

if (!isStringValue(rawConfig.jwtRefreshExpiration)) {
    console.error('invalid config!', rawConfig);
    throw new Error('JWT_REFRESH_EXPIRATION must be a valid duration string');
}
// Type assertion is safe here because we just validated it
const jwtRefreshExpiration = rawConfig.jwtRefreshExpiration as StringValue;

if (typeof rawConfig.frontendUrl !== 'string' || !rawConfig.frontendUrl) {
    console.error('invalid config!', rawConfig);
    throw new Error('FRONTEND_URL must be a non-empty string');
}

const config: Config = {
    jwtSecret: rawConfig.jwtSecret,
    jwtExpiration: jwtExpiration,
    jwtRefreshSecret: rawConfig.jwtRefreshSecret,
    jwtRefreshExpiration: jwtRefreshExpiration,
    port: portNumber,
    ip: rawConfig.ip,
    dbPath: rawConfig.dbPath,
    frontendUrl: rawConfig.frontendUrl,
};

function isValidIP(ip: string): boolean {
    const ipv4 = /^(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)){3}$/;
    const ipv6 = /^([\da-fA-F]{1,4}:){7}[\da-fA-F]{1,4}$/;
    return ipv4.test(ip) || ipv6.test(ip);
}

function isStringValue(value: any): boolean {
    const msRegex = /^\d+(\.\d+)?\s*(ms|s|m|h|d|w|y)?$/i;
    return typeof value === 'string' && msRegex.test(value);
}

export default config;
