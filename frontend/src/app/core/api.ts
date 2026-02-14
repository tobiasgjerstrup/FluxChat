import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
let JWT = '';
const ip = 'https://tboss.dev/api/v1'; // http://127.0.0.1:3001
const ws = 'wss://tboss.dev/api/v1'; // ws://127.0.0.1:3001
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

    login(username: string, password: string): Observable<{ token: string }> {
        return this.http.post<{ token: string }>(`${ip}/api/auth/login`, { username, password }).pipe(
            tap((response) => {
                JWT = response.token;
            }),
        );
    }

    getMessages(): Observable<Message[]> {
        const headers = new HttpHeaders({
            Authorization: `Bearer ${JWT}`,
        });
        return this.http.get<Message[]>(`${ip}/api/messages`, { headers });
    }

    postMessage(text: string): Observable<Message> {
        const headers = new HttpHeaders({
            Authorization: `Bearer ${JWT}`,
        });
        return this.http.post<Message>(`${ip}/api/messages`, { text }, { headers });
    }

    connectWebSocket(): WebSocket {
        return new WebSocket(`${ws}/`);
    }
}
