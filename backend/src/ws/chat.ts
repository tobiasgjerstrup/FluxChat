import { Server as HttpServer } from "http";
import { WebSocketServer } from "ws";
import jwt from "jsonwebtoken";
import { saveMessage } from "../services/db.js";

interface ChatMessage {
  text: string;
  userId?: string;
}

export function setupWebSocket(server: HttpServer) {
  const wss = new WebSocketServer({ server });

  wss.on("connection", (ws, req) => {
    // Optionally authenticate via JWT in query string
    const url = new URL(req.url || "", `http://${req.headers.host}`);
    const token = url.searchParams.get("token");
    let userId: string | undefined = undefined;
    if (token) {
      try {
        const secret = process.env.JWT_SECRET || "changeme";
        const decoded: any = jwt.verify(token, secret);
        userId = decoded.id;
      } catch {}
    }

    ws.on("message", async (data) => {
      try {
        const msg: ChatMessage = JSON.parse(data.toString());
        if (!msg.text) return;
        const saved = await saveMessage({ text: msg.text, userId });
        // Broadcast to all clients
        wss.clients.forEach((client) => {
          if (client.readyState === ws.OPEN) {
            client.send(JSON.stringify({ ...saved, userId }));
          }
        });
      } catch {}
    });
  });
}
