import type { SpeakerConfig } from "../types.js";
import { runCommand } from "./command.js";

export interface BluetoothStatus {
  connected: boolean;
  paired: boolean;
  trusted: boolean;
}

export class BluetoothService {
  constructor(private readonly mockMode: boolean) {}

  async connect(speaker: SpeakerConfig): Promise<BluetoothStatus> {
    if (this.mockMode) return { connected: true, paired: true, trusted: true };
    this.ensureMac(speaker);

    await runCommand("bluetoothctl", ["trust", speaker.bluetoothMac], 10_000).catch(() => undefined);
    await runCommand("bluetoothctl", ["connect", speaker.bluetoothMac], 30_000);
    return this.getStatus(speaker);
  }

  async disconnect(speaker: SpeakerConfig): Promise<void> {
    if (this.mockMode) return;
    this.ensureMac(speaker);
    await runCommand("bluetoothctl", ["disconnect", speaker.bluetoothMac], 10_000).catch(() => undefined);
  }

  async getStatus(speaker: SpeakerConfig): Promise<BluetoothStatus> {
    if (!speaker.bluetoothMac) return { connected: false, paired: false, trusted: false };
    if (this.mockMode) return { connected: true, paired: true, trusted: true };

    const { stdout } = await runCommand("bluetoothctl", ["info", speaker.bluetoothMac], 10_000).catch(() => ({
      stdout: ""
    }));
    return {
      connected: /Connected:\s+yes/i.test(stdout),
      paired: /Paired:\s+yes/i.test(stdout),
      trusted: /Trusted:\s+yes/i.test(stdout)
    };
  }

  private ensureMac(speaker: SpeakerConfig): void {
    if (!speaker.bluetoothMac) {
      throw new Error(`Bluetooth MAC is missing for ${speaker.name}. Add it in data/config.json first.`);
    }
  }
}
