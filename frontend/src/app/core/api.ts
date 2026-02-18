import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { signal } from '@angular/core';
import { environment } from '../../environments/environment';

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

    public JWT = signal('');

    public login(username: string, password: string): Observable<{ token: string }> {
        return this.http.post<{ token: string }>(`${environment.ip}/api/auth/login`, { username, password }).pipe(
            tap((response) => {
                this.JWT.set(response.token);
                localStorage.setItem('jwt', response.token);
            }),
        );
    }

    public getMessages(): Observable<Message[]> {
        const headers = new HttpHeaders({
            Authorization: `Bearer ${this.JWT()}`,
        });
        return this.http.get<Message[]>(`${environment.ip}/api/messages`, { headers });
    }

    public postMessage(content: string): Observable<Message> {
        const headers = new HttpHeaders({
            Authorization: `Bearer ${this.JWT()}`,
        });
        return this.http.post<Message>(`${environment.ip}/api/messages`, { content }, { headers });
    }

    public connectWebSocket(): WebSocket {
        return new WebSocket(`${environment.ws}/`);
    }

    public register(username: string, email: string, password: string): Observable<any> {
        return this.http.post<any>(`${environment.ip}/api/auth/register`, { username, email, password });
    }

    public getServers(): Observable<Server[]> {
        const headers = new HttpHeaders({
            Authorization: `Bearer ${this.JWT()}`,
        });
        return this.http.get<Server[]>(`${environment.ip}/api/servers`, { headers });
    }

    public createServer(name: string, icon_url: string): Observable<Server> {
        const headers = new HttpHeaders({
            Authorization: `Bearer ${this.JWT()}`,
        });
        return this.http.post<Server>(`${environment.ip}/api/servers`, { name, icon_url }, { headers });
    }
}
