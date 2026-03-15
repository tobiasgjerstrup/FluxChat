export interface WebSocketMessage {
    type: string;
    userId?: number | string | null;
    targetId?: number | string;
    [key: string]: unknown;
}
