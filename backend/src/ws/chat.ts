import { Server as HttpServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import type { WebSocketMessage } from '@flux/shared';
import type { WebSocketData } from '../types/websocket.js';

function isValidMessage(data: unknown): data is WebSocketMessage {
    return (
        typeof data === 'object' &&
        data !== null &&
        'type' in data &&
        typeof (data as Record<string, unknown>).type === 'string'
    );
}

let wss: WebSocketServer | null = null;

export function broadcastMessage(message: unknown) {
    if (!wss) return;
    const data = JSON.stringify(message);
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(data);
        }
    });
}

export function setupWebSocket(server: HttpServer) {
    wss = new WebSocketServer({ server });
    wss.on('connection', (ws /* req */) => {
        console.log('New WebSocket connection');
        // Optionally authenticate via JWT in query string
        // You can add authentication here if needed

        ws.on('message', (data) => {
            try {
                let dataStr: string;
                if (Buffer.isBuffer(data)) {
                    dataStr = data.toString('utf-8');
                } else if (data instanceof ArrayBuffer) {
                    dataStr = Buffer.from(data).toString('utf-8');
                } else if (Array.isArray(data)) {
                    dataStr = Buffer.concat(data).toString('utf-8');
                } else {
                    // Unreachable, but TypeScript needs exhaustiveness check
                    throw new Error('Unexpected data type');
                }
                const parsed: unknown = JSON.parse(dataStr);
                if (!isValidMessage(parsed)) {
                    console.error('Invalid message format from client', parsed);
                    return;
                }
                // Type assertion needed for CI environment
                const message = parsed as WebSocketMessage;

                // Log all signaling messages
                if (['webrtc-offer', 'webrtc-answer', 'webrtc-ice-candidate'].includes(message.type)) {
                    const targetId = message.targetId as number | string | undefined;
                    const fromUser = (ws as WebSocketData).userId as number | undefined;
                    const messageType = message.type as string;
                    const fromUserStr = fromUser !== undefined ? String(fromUser) : 'unknown';
                    const targetIdStr = targetId !== undefined ? String(targetId) : 'unknown';
                    console.log(
                        `[SIGNALING] type=${messageType} from=${fromUserStr} to=${targetIdStr} payload=`,
                        JSON.stringify(message),
                    );
                    if (!targetId) {
                        console.warn(`[SIGNALING] No targetId for message type=${messageType} from=${fromUserStr}`);
                        return;
                    }
                    // Find the target client by a custom property (e.g., userId)
                    let targetClient: WebSocketData | undefined;
                    if (wss) {
                        targetClient = Array.from(wss.clients).find(
                            (client: WebSocketData) =>
                                client !== ws && client.userId === targetId && client.readyState === WebSocket.OPEN,
                        );
                    }

                    if (targetClient) {
                        targetClient.send(JSON.stringify(message));
                        console.log(`[SIGNALING] Relayed type=${messageType} from=${fromUserStr} to=${targetIdStr}`);
                    } else {
                        console.warn(
                            `[SIGNALING] No client found for targetId=${targetIdStr} (from=${fromUserStr}, type=${messageType})`,
                        );
                    }
                }

                // Optionally: handle user registration to associate ws with userId
                const messageUserId = message.userId as number | string | null | undefined;
                if (message.type === 'register' && typeof messageUserId === 'number') {
                    (ws as WebSocketData).userId = messageUserId as number;
                    console.log(`[REGISTER] userId=${String(messageUserId)} associated with ws`);
                }
            } catch (err) {
                console.error('Invalid JSON from client', err);
                return;
            }
        });
    });
}
