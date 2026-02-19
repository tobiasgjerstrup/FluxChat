import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { signal } from '@angular/core';
import { environment } from '../../environments/environment';

export interface JWTPayload {
    id: number;
    username: string;
    type: 'access' | string;
    iat: number;
    exp: number;
    [key: string]: unknown;
}

export interface Message {
    id: number;
    text: string;
    userId: string;
    createdAt: string;
}

export interface Server {
    id: number;
    name: string;
    owner_id: string;
    icon_url: null | string;
    created_at: string;
}

@Injectable({
    providedIn: 'root',
})
export class Api {
    constructor(private http: HttpClient) {}

    public JWT_REFRESH = signal('');
    public JWT = signal('');

    public async login(username: string, password: string): Promise<{ token: string }> {
        const response = await firstValueFrom(
            this.http.post<{ token: string; refreshToken: string }>(`${environment.ip}/api/auth/login`, {
                username,
                password,
            }),
        );
        this.JWT.set(response.token);
        localStorage.setItem('jwt', response.token);
        console.log('Received refresh token:', response.refreshToken);
        this.JWT_REFRESH.set(response.refreshToken);
        console.log('Set JWT_REFRESH signal:', this.JWT_REFRESH());
        localStorage.setItem('jwt_refresh', response.refreshToken);
        return response;
    }

    public async getMessages(): Promise<Message[]> {
        await this.refreshTokenIfExpired();
        const headers = new HttpHeaders({
            Authorization: `Bearer ${this.JWT()}`,
        });
        return firstValueFrom(this.http.get<Message[]>(`${environment.ip}/api/messages`, { headers }));
    }

    public async postMessage(content: string): Promise<Message> {
        await this.refreshTokenIfExpired();
        const headers = new HttpHeaders({
            Authorization: `Bearer ${this.JWT()}`,
        });
        return firstValueFrom(this.http.post<Message>(`${environment.ip}/api/messages`, { content }, { headers }));
    }

    public connectWebSocket(): WebSocket {
        return new WebSocket(`${environment.ws}/`);
    }

    public async register(username: string, email: string, password: string): Promise<any> {
        await this.refreshTokenIfExpired();
        return firstValueFrom(
            this.http.post<any>(`${environment.ip}/api/auth/register`, { username, email, password }),
        );
    }

    public async getServers(): Promise<Server[]> {
        await this.refreshTokenIfExpired();
        const headers = new HttpHeaders({
            Authorization: `Bearer ${this.JWT()}`,
        });
        return firstValueFrom(this.http.get<Server[]>(`${environment.ip}/api/servers`, { headers }));
    }

    public async createServer(name: string, icon_url: string): Promise<Server> {
        await this.refreshTokenIfExpired();
        const headers = new HttpHeaders({
            Authorization: `Bearer ${this.JWT()}`,
        });
        return firstValueFrom(this.http.post<Server>(`${environment.ip}/api/servers`, { name, icon_url }, { headers }));
    }

    private async refreshTokenIfExpired(): Promise<void> {
        const payload = this.getJWTPayload();
        if (!payload || !payload.exp) return;
        const now = Math.floor(Date.now() / 1000);
        if (payload.exp > now) return;
        console.log('Access token expired, refreshing...');
        const headers = new HttpHeaders({
            Authorization: `Bearer ${this.JWT()}`,
            'refresh-token': `${this.JWT_REFRESH()}`,
        });
        console.log(headers);
        console.log(this.JWT(), this.JWT_REFRESH());

        // if token is expired, refresh it
        try {
            const res = await firstValueFrom(
                this.http.post<{ token: string }>(`${environment.ip}/api/auth/refresh`, {}, { headers }),
            );
            this.JWT.set(res.token);
            localStorage.setItem('jwt', res.token);
        } catch (error) {
            // if refresh fails, clear tokens
            this.JWT.set('');
            localStorage.removeItem('jwt');
            this.JWT_REFRESH.set('');
            localStorage.removeItem('jwt_refresh');
        }
    }

    /**
     * Safely decodes and parses the payload of a JWT token.
     * @returns The payload object or null if invalid
     */
    private getJWTPayload(): JWTPayload | null {
        const token = this.JWT();
        if (!token) return null;
        try {
            const parts = token.split('.');
            if (parts.length !== 3) return null;
            // Validate payload
            const payloadBase64 = parts[1];
            const payloadPadded = payloadBase64.padEnd(
                payloadBase64.length + ((4 - (payloadBase64.length % 4)) % 4),
                '=',
            );
            const payloadJson = atob(payloadPadded);
            const payload = JSON.parse(payloadJson);
            if (
                typeof payload?.id !== 'number' ||
                typeof payload?.username !== 'string' ||
                payload?.type !== 'access' ||
                typeof payload?.iat !== 'number' ||
                typeof payload?.exp !== 'number'
            ) {
                return null;
            }
            return payload as JWTPayload;
        } catch {
            return null;
        }
    }
}
