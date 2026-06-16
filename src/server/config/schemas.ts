import { z } from "zod";

export const sitePeerSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  baseUrl: z.string().url()
});

export const speakerSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  model: z.string().min(1),
  bluetoothMac: z.string(),
  room: z.string().optional()
});

export const stationSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  streamUrl: z.string().url(),
  group: z.string().min(1),
  description: z.string().optional()
});

export const appConfigSchema = z.object({
  site: z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    defaultSpeakerId: z.string().min(1),
    peers: z.array(sitePeerSchema)
  }),
  startup: z.object({
    mode: z.enum(["idle", "resume-last"])
  }),
  speakers: z.array(speakerSchema).min(1),
  stations: z.array(stationSchema).min(1)
});

export const runtimeStateSchema = z.object({
  selectedSpeakerId: z.string().min(1),
  currentStationId: z.string().optional(),
  rememberedVolumes: z.record(z.number().min(0).max(100)),
  playback: z.object({
    status: z.enum(["idle", "playing", "stopped", "error"]),
    startedAt: z.string().optional(),
    error: z.string().optional()
  })
});
