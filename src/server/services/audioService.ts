import type { SpeakerConfig } from "../types.js";
import { runCommand } from "./command.js";

export interface AudioSinkStatus {
  sinkId?: string;
  sinkName?: string;
  volume?: number;
}

export class AudioService {
  constructor(private readonly mockMode: boolean) {}

  async selectSpeakerSink(speaker: SpeakerConfig): Promise<AudioSinkStatus> {
    if (this.mockMode) return { sinkId: "mock-sink", sinkName: speaker.name, volume: 50 };

    const sink = await this.findBluetoothSink(speaker);
    if (!sink.sinkId) {
      throw new Error(`PipeWire did not expose a Bluetooth audio sink for ${speaker.name}.`);
    }
    await runCommand("wpctl", ["set-default", sink.sinkId], 10_000);
    return this.getDefaultSinkStatus();
  }

  async setVolume(volume: number): Promise<AudioSinkStatus> {
    const normalized = Math.max(0, Math.min(100, Math.round(volume)));
    if (this.mockMode) return { sinkId: "mock-sink", sinkName: "Mock speaker", volume: normalized };

    await runCommand("wpctl", ["set-volume", "@DEFAULT_AUDIO_SINK@", `${normalized / 100}`], 10_000);
    return this.getDefaultSinkStatus();
  }

  async getDefaultSinkStatus(): Promise<AudioSinkStatus> {
    if (this.mockMode) return { sinkId: "mock-sink", sinkName: "Mock speaker", volume: 50 };

    const { stdout } = await runCommand("wpctl", ["get-volume", "@DEFAULT_AUDIO_SINK@"], 10_000).catch(() => ({
      stdout: ""
    }));
    const volumeMatch = stdout.match(/Volume:\s+([0-9.]+)/i);
    return {
      sinkId: "@DEFAULT_AUDIO_SINK@",
      sinkName: "Default audio sink",
      volume: volumeMatch ? Math.round(Number(volumeMatch[1]) * 100) : undefined
    };
  }

  private async findBluetoothSink(speaker: SpeakerConfig): Promise<AudioSinkStatus> {
    const macToken = speaker.bluetoothMac.replaceAll(":", "_").toUpperCase();
    const { stdout } = await runCommand("wpctl", ["status"], 10_000).catch(() => ({ stdout: "" }));
    const line = stdout
      .split("\n")
      .find((candidate) => candidate.toUpperCase().includes(`BLUEZ_OUTPUT.${macToken}`));
    const idMatch = line?.match(/^\s*[│├└─\s*]*([0-9]+)\./u);
    const sinkId = idMatch?.[1];
    return {
      sinkId,
      sinkName: line?.trim()
    };
  }
}
