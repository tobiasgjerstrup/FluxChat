import dotenv from 'dotenv';
dotenv.config({ path: '.env.test' });

import fs from 'fs';
import config from '../src/config';
import { sqliteDBSetup } from '../src/db/sqlite.js';

// Ensure test DB is used during tests
if (!config.dbPath.includes('.test')) {
    throw new Error('Test DB_PATH must include .test for safety! Current: ' + config.dbPath);
}

export default async function () {
    if (config.dbPath && fs.existsSync(config.dbPath)) {
        console.log('Removing existing test database at', config.dbPath);
        fs.unlinkSync(config.dbPath);
    }
    // Run DB setup after deletion
    await sqliteDBSetup();
}
