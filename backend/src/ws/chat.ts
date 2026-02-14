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

    ws.on("message", (data) => {
      let message;
      try {
        message = JSON.parse(data.toString());
      } catch (e) {
        console.error("Invalid JSON from client", e);
        return;
      }

      // Log all signaling messages
      if (["webrtc-offer", "webrtc-answer", "webrtc-ice-candidate"].includes(message.type)) {
        const targetId = message.targetId;
        const fromUser = (ws as any).userId;
        console.log(`[SIGNALING] type=${message.type} from=${fromUser} to=${targetId} payload=`, message);
        if (!targetId) {
          console.warn(`[SIGNALING] No targetId for message type=${message.type} from=${fromUser}`);
          return;
        }
        // Find the target client by a custom property (e.g., userId)
        let found = false;
        wss?.clients.forEach((client: any) => {
          if (client !== ws && client.userId === targetId && client.readyState === WebSocket.OPEN) {
            found = true;
            client.send(JSON.stringify(message));
            console.log(`[SIGNALING] Relayed type=${message.type} from=${fromUser} to=${targetId}`);
          }
        });
        if (!found) {
          console.warn(`[SIGNALING] No client found for targetId=${targetId} (from=${fromUser}, type=${message.type})`);
        }
      }

      // Optionally: handle user registration to associate ws with userId
      if (message.type === "register" && message.userId) {
        (ws as any).userId = message.userId;
        console.log(`[REGISTER] userId=${message.userId} associated with ws`);
      }
    });
  });
}
