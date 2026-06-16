import type { AppStatus, RuntimeState, SpeakerConfig, StationConfig, StartupMode } from "../types.js";
import { AudioService } from "./audioService.js";
import { BluetoothService } from "./bluetoothService.js";
import { ConfigStore } from "../config/configStore.js";
import { MpvClient } from "./mpvClient.js";

export class RadioController {
  constructor(
    private readonly store: ConfigStore,
    private readonly bluetooth: BluetoothService,
    private readonly audio: AudioService,
    private readonly mpv: MpvClient,
    private readonly mockMode: boolean,
    private readonly onStatusChange: () => void
  ) {}

  getStatus(): AppStatus {
    return {
      config: this.store.getConfig(),
      state: this.store.getState(),
      mockMode: this.mockMode
    };
  }

  async initializeStartup(): Promise<void> {
    const config = this.store.getConfig();
    const state = this.store.getState();
    const selectedSpeaker = this.getSpeaker(state.selectedSpeakerId) ?? this.getSpeaker(config.site.defaultSpeakerId);
    if (selectedSpeaker) await this.selectSpeaker(selectedSpeaker.id, { resume: false });

    if (config.startup.mode === "resume-last" && state.currentStationId) {
      await this.playStation(state.currentStationId);
    }
  }

  async playStation(stationId: string): Promise<RuntimeState> {
    const station = this.getStation(stationId);
    const speaker = this.getSelectedSpeaker();
    await this.prepareSpeaker(speaker);
    await this.mpv.load(station.streamUrl);
    const state = await this.store.updateState((current) => ({
      ...current,
      currentStationId: station.id,
      playback: { status: "playing", startedAt: new Date().toISOString() }
    }));
    this.onStatusChange();
    return state;
  }

  async stop(): Promise<RuntimeState> {
    await this.mpv.stop();
    const state = await this.store.updateState((current) => ({
      ...current,
      playback: { status: "stopped" }
    }));
    this.onStatusChange();
    return state;
  }

  async selectSpeaker(speakerId: string, options: { resume: boolean } = { resume: true }): Promise<RuntimeState> {
    const previous = this.getSelectedSpeaker();
    const next = this.getSpeakerOrThrow(speakerId);
    const currentState = this.store.getState();
    const currentStationId = currentState.currentStationId;
    const shouldResume = options.resume && previous.id !== next.id && currentState.playback.status === "playing";

    if (previous.id !== next.id) {
      await this.mpv.stop().catch(() => undefined);
      await this.bluetooth.disconnect(previous).catch(() => undefined);
    }

    await this.prepareSpeaker(next);
    const rememberedVolume = this.store.getState().rememberedVolumes[next.id] ?? 50;
    await this.audio.setVolume(rememberedVolume);
    const state = await this.store.setSelectedSpeaker(next.id);

    if (shouldResume && currentStationId) {
      await this.playStation(currentStationId);
    }

    this.onStatusChange();
    return state;
  }

  async setVolume(volume: number): Promise<RuntimeState> {
    const speaker = this.getSelectedSpeaker();
    await this.audio.setVolume(volume);
    const state = await this.store.rememberVolume(speaker.id, Math.max(0, Math.min(100, Math.round(volume))));
    this.onStatusChange();
    return state;
  }

  async setStartupMode(mode: StartupMode): Promise<void> {
    await this.store.setStartupMode(mode);
    this.onStatusChange();
  }

  async shutdown(): Promise<void> {
    await this.mpv.shutdown();
  }

  private async prepareSpeaker(speaker: SpeakerConfig): Promise<void> {
    await this.bluetooth.connect(speaker);
    await this.audio.selectSpeakerSink(speaker);
  }

  private getSelectedSpeaker(): SpeakerConfig {
    return this.getSpeakerOrThrow(this.store.getState().selectedSpeakerId);
  }

  private getSpeaker(speakerId: string): SpeakerConfig | undefined {
    return this.store.getConfig().speakers.find((speaker) => speaker.id === speakerId);
  }

  private getSpeakerOrThrow(speakerId: string): SpeakerConfig {
    const speaker = this.getSpeaker(speakerId);
    if (!speaker) throw new Error(`Unknown speaker: ${speakerId}`);
    return speaker;
  }

  private getStation(stationId: string): StationConfig {
    const station = this.store.getConfig().stations.find((candidate) => candidate.id === stationId);
    if (!station) throw new Error(`Unknown station: ${stationId}`);
    return station;
  }
}
