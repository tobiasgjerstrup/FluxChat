import { Request } from 'express';

export interface AuthUser {
    id: number;
    // Add other JWT payload fields here if needed
    [key: string]: unknown;
}

export interface AuthRequest extends Request {
    user?: AuthUser;
}
