import type http from "node:http";
import { WebSocketServer } from "ws";

export class StatusHub {
  private readonly wss: WebSocketServer;
  private getPayload?: () => unknown;

  constructor(server: http.Server) {
    this.wss = new WebSocketServer({ server, path: "/api/events" });
    this.wss.on("connection", (socket) => {
      if (this.getPayload) {
        socket.send(JSON.stringify({ type: "status", payload: this.getPayload() }));
      }
    });
  }

  setPayloadGetter(getPayload: () => unknown): void {
    this.getPayload = getPayload;
  }

  broadcast(): void {
    if (!this.getPayload) return;
    const message = JSON.stringify({ type: "status", payload: this.getPayload() });
    for (const client of this.wss.clients) {
      if (client.readyState === client.OPEN) client.send(message);
    }
  }
}
