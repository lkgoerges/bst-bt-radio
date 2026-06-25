import type { SpeakerConfig } from "../types.js";
import { runCommand, runCommandWithInput } from "./command.js";

export interface BluetoothStatus {
  connected: boolean;
  paired: boolean;
  trusted: boolean;
}

export class BluetoothService {
  constructor(
    private readonly mockMode: boolean,
    private readonly controllerAddress?: string
  ) {}

  async connect(speaker: SpeakerConfig): Promise<BluetoothStatus> {
    if (this.mockMode) return { connected: true, paired: true, trusted: true };
    this.ensureMac(speaker);

    await this.runBluetoothctl([`trust ${speaker.bluetoothMac}`, `connect ${speaker.bluetoothMac}`], 30_000);
    const status = await this.getStatus(speaker);
    if (!status.connected) {
      throw new Error(`Bluetooth connection failed for ${speaker.name} on configured controller.`);
    }
    return status;
  }

  async disconnect(speaker: SpeakerConfig): Promise<void> {
    if (this.mockMode) return;
    this.ensureMac(speaker);
    await this.runBluetoothctl([`disconnect ${speaker.bluetoothMac}`], 10_000).catch(() => undefined);
  }

  async getStatus(speaker: SpeakerConfig): Promise<BluetoothStatus> {
    if (!speaker.bluetoothMac) return { connected: false, paired: false, trusted: false };
    if (this.mockMode) return { connected: true, paired: true, trusted: true };

    const { stdout } = await this.runBluetoothctl([`info ${speaker.bluetoothMac}`], 10_000).catch(() => ({
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

  private async runBluetoothctl(commands: string[], timeoutMs: number) {
    if (!this.controllerAddress) {
      let result = { stdout: "", stderr: "" };
      for (const commandLine of commands) {
        const [command, ...args] = commandLine.split(" ");
        result = await runCommand("bluetoothctl", [command, ...args], timeoutMs);
      }
      return result;
    }

    return runCommandWithInput(
      "bluetoothctl",
      [],
      [`select ${this.controllerAddress}`, ...commands, ""].join("\n"),
      timeoutMs
    );
  }
}
