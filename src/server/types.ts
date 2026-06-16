export type SiteId = "home" | "vfl" | string;

export type StartupMode = "idle" | "resume-last";

export interface SitePeer {
  id: SiteId;
  name: string;
  baseUrl: string;
}

export interface SiteConfig {
  id: SiteId;
  name: string;
  defaultSpeakerId: string;
  peers: SitePeer[];
}

export interface SpeakerConfig {
  id: string;
  name: string;
  model: "SoundTouch 10" | "SoundTouch 20" | string;
  bluetoothMac: string;
  room?: string;
}

export interface StationConfig {
  id: string;
  name: string;
  streamUrl: string;
  group: "local" | "wdr" | "news" | "music" | "tunein" | string;
  description?: string;
}

export interface StartupConfig {
  mode: StartupMode;
}

export interface AppConfig {
  site: SiteConfig;
  startup: StartupConfig;
  speakers: SpeakerConfig[];
  stations: StationConfig[];
}

export type PlaybackStatus = "idle" | "playing" | "stopped" | "error";

export interface RuntimeState {
  selectedSpeakerId: string;
  currentStationId?: string;
  rememberedVolumes: Record<string, number>;
  playback: {
    status: PlaybackStatus;
    startedAt?: string;
    error?: string;
  };
}

export interface AppStatus {
  config: AppConfig;
  state: RuntimeState;
  mockMode: boolean;
}
