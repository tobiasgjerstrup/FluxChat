import path from 'path';

interface RawConfig {
    jwtSecret: string | undefined;
    port: number | string | undefined;
    dbPath: string | undefined;
}

interface Config {
    jwtSecret: string;
    port: number;
    dbPath: string;
}

const config: RawConfig = {
    jwtSecret: process.env.JWT_SECRET,
    port: process.env.PORT,
    dbPath: process.env.DB_PATH,
};

if (!config.jwtSecret || typeof config.jwtSecret !== 'string') {
    throw new Error('JWT_SECRET must be a non-empty string');
}

const portNumber = Number(config.port);
if (isNaN(portNumber) || portNumber <= 0) {
    throw new Error('PORT must be a valid number greater than 0');
}
config.port = portNumber;

if (typeof config.dbPath !== 'string' || !config.dbPath || !path.isAbsolute(config.dbPath)) {
    throw new Error('DB_PATH must be a valid absolute path');
}

export default config as Config;
