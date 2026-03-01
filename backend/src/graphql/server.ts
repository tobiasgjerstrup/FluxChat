import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@as-integrations/express5';
import Database from 'better-sqlite3';
import { typeDefs } from './schema.js';
import { resolvers, initializeDb } from './resolvers.js';
import jwt from 'jsonwebtoken';
import type { Request } from 'express';

export async function createApolloServer(db: Database.Database) {
    initializeDb(db);

    const apolloServer = new ApolloServer({
        typeDefs,
        resolvers,
    });

    await apolloServer.start();

    // Return the middleware directly
    return expressMiddleware(apolloServer, {
        context: async ({ req }: { req: Request }) => {
            const token = req.headers.authorization?.replace('Bearer ', '');

            if (token) {
                try {
                    const user = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as {
                        id: number;
                        username: string;
                    };
                    return { user };
                } catch {
                    return {};
                }
            }

            return {};
        },
    });
}
