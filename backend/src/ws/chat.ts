import { Server as HttpServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import jwt from "jsonwebtoken";


let wss: WebSocketServer | null = null;

export function broadcastMessage(message: any) {
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
  wss.on("connection", (ws, req) => {
    console.log("New WebSocket connection");
    // Optionally authenticate via JWT in query string
    // You can add authentication here if needed
  });
}
