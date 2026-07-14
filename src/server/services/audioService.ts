import type { SpeakerConfig } from "../types.js";
import { runCommand } from "./command.js";

export interface AudioSinkStatus {
  sinkId?: string;
  sinkName?: string;
  volume?: number;
}

export class AudioService {
  constructor(
    private readonly mockMode: boolean,
    private readonly configuredSink?: string
  ) {}

  async selectOutput(speaker: SpeakerConfig): Promise<AudioSinkStatus> {
    if (this.mockMode) return { sinkId: "mock-sink", sinkName: speaker.name, volume: 50 };

    const sink = speaker.audioSink ?? this.configuredSink;
    if (sink) {
      await runCommand("wpctl", ["set-default", sink], 10_000);
    }
    return this.getDefaultSinkStatus();
  }

  async setVolume(volume: number): Promise<AudioSinkStatus> {
    const normalized = Math.max(0, Math.min(100, Math.round(volume)));
    if (this.mockMode) return { sinkId: "mock-sink", sinkName: "Mock speaker", volume: normalized };

    await runCommand("wpctl", ["set-volume", "@DEFAULT_AUDIO_SINK@", `${normalized / 100}`], 10_000).catch(() =>
      runCommand("amixer", ["set", "Master", `${normalized}%`], 10_000).catch(() =>
        runCommand("amixer", ["set", "Headphone", `${normalized}%`], 10_000)
      )
    );
    return this.getDefaultSinkStatus();
  }

  async getDefaultSinkStatus(): Promise<AudioSinkStatus> {
    if (this.mockMode) return { sinkId: "mock-sink", sinkName: "Mock speaker", volume: 50 };

    const { stdout } = await runCommand("wpctl", ["get-volume", "@DEFAULT_AUDIO_SINK@"], 10_000).catch(() => ({
      stdout: ""
    }));
    const volumeMatch = stdout.match(/Volume:\s+([0-9.]+)/i);
    if (!volumeMatch) {
      const alsaStatus = await this.getAlsaVolumeStatus();
      if (alsaStatus.volume !== undefined) return alsaStatus;
    }
    return {
      sinkId: "@DEFAULT_AUDIO_SINK@",
      sinkName: "Default audio sink",
      volume: volumeMatch ? Math.round(Number(volumeMatch[1]) * 100) : undefined
    };
  }

  private async getAlsaVolumeStatus(): Promise<AudioSinkStatus> {
    const { stdout } = await runCommand("amixer", ["get", "Master"], 10_000)
      .catch(() => runCommand("amixer", ["get", "Headphone"], 10_000))
      .catch(() => ({ stdout: "" }));
    const volumeMatch = stdout.match(/\[([0-9]{1,3})%\]/);
    return {
      sinkId: "alsa-default",
      sinkName: "ALSA default output",
      volume: volumeMatch ? Number(volumeMatch[1]) : undefined
    };
  }

}
