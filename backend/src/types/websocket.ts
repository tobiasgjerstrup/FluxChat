import type { WebSocket } from 'ws';

export interface WebSocketData extends WebSocket {
    userId?: number;
}
