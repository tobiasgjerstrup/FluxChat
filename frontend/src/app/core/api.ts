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
}
