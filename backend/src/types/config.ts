import type { StringValue } from 'ms';

export interface Config {
    jwtSecret: string;
    jwtExpiration: StringValue;
    jwtRefreshSecret: string;
    jwtRefreshExpiration: StringValue;
    port: number;
    ip: string;
    dbPath: string;
    frontendUrl: string;
}
