import express, { type NextFunction, type Request, type Response } from "express";
import path from "node:path";
import { z } from "zod";
import type { RadioController } from "./services/radioController.js";

const volumeSchema = z.object({ volume: z.number().min(0).max(100) });
const startupSchema = z.object({ mode: z.enum(["idle", "resume-last"]) });

export function createApp(controller: RadioController): express.Express {
  const app = express();
  const staticDir = path.join(process.cwd(), "src/public");

  app.use(express.json());
  app.use((_, response, next) => {
    response.setHeader("Access-Control-Allow-Origin", "*");
    response.setHeader("Access-Control-Allow-Headers", "Content-Type");
    response.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,OPTIONS");
    next();
  });
  app.options("*", (_, response) => response.sendStatus(204));

  app.get("/api/health", (_, response) => {
    response.json({ ok: true, site: controller.getStatus().config.site });
  });

  app.get("/api/status", (_, response) => {
    response.json(controller.getStatus());
  });

  app.post("/api/stations/:stationId/play", asyncHandler(async (request, response) => {
    await controller.playStation(request.params.stationId);
    response.json(controller.getStatus());
  }));

  app.post("/api/player/stop", asyncHandler(async (_, response) => {
    await controller.stop();
    response.json(controller.getStatus());
  }));

  app.post("/api/speakers/:speakerId/select", asyncHandler(async (request, response) => {
    await controller.selectSpeaker(request.params.speakerId);
    response.json(controller.getStatus());
  }));

  app.post("/api/volume", asyncHandler(async (request, response) => {
    const { volume } = volumeSchema.parse(request.body);
    await controller.setVolume(volume);
    response.json(controller.getStatus());
  }));

  app.patch("/api/settings/startup", asyncHandler(async (request, response) => {
    const { mode } = startupSchema.parse(request.body);
    await controller.setStartupMode(mode);
    response.json(controller.getStatus());
  }));

  app.post("/api/system/shutdown", asyncHandler(async (_, response) => {
    await controller.shutdownHost();
    response.json({ ok: true, message: "Shutdown requested" });
  }));

  app.use(express.static(staticDir));
  app.get("*", (_, response) => {
    response.sendFile(path.join(staticDir, "index.html"));
  });

  app.use((error: unknown, _: Request, response: Response, __: NextFunction) => {
    const message = error instanceof Error ? error.message : "Unknown server error";
    response.status(400).json({ error: message });
  });

  return app;
}

function asyncHandler(handler: (request: Request, response: Response) => Promise<void>) {
  return (request: Request, response: Response, next: NextFunction) => {
    handler(request, response).catch(next);
  };
}
