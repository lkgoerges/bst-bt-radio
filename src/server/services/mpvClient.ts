import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { rm } from "node:fs/promises";
import net from "node:net";

export class MpvClient {
  private process?: ChildProcessWithoutNullStreams;

  constructor(
    private readonly socketPath: string,
    private readonly mockMode: boolean,
    private readonly cacheSeconds = 20
  ) {}

  async start(): Promise<void> {
    if (this.mockMode || this.process) return;

    await rm(this.socketPath, { force: true }).catch(() => undefined);
    this.process = spawn("mpv", [
      "--idle=yes",
      "--no-video",
      "--audio-display=no",
      "--terminal=no",
      "--cache=yes",
      `--demuxer-readahead-secs=${this.cacheSeconds}`,
      `--input-ipc-server=${this.socketPath}`
    ]);
    this.process.once("exit", () => {
      this.process = undefined;
    });
    await this.waitForSocket();
  }

  async load(url: string): Promise<void> {
    if (this.mockMode) return;
    await this.start();
    await this.command(["loadfile", url, "replace"]);
  }

  async stop(): Promise<void> {
    if (this.mockMode) return;
    await this.command(["stop"]);
  }

  async shutdown(): Promise<void> {
    if (this.mockMode) return;
    await this.command(["quit"]).catch(() => undefined);
    this.process?.kill();
  }

  private command(command: unknown[]): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const socket = net.createConnection(this.socketPath);
      let buffer = "";

      socket.setEncoding("utf8");
      socket.once("error", reject);
      socket.on("data", (chunk) => {
        buffer += chunk;
        const newlineIndex = buffer.indexOf("\n");
        if (newlineIndex === -1) return;
        socket.end();
        const line = buffer.slice(0, newlineIndex);
        try {
          resolve(JSON.parse(line));
        } catch {
          resolve(line);
        }
      });
      socket.once("connect", () => {
        socket.write(`${JSON.stringify({ command })}\n`);
      });
    });
  }

  private async waitForSocket(): Promise<void> {
    const started = Date.now();
    while (Date.now() - started < 5_000) {
      try {
        await this.command(["get_property", "idle-active"]);
        return;
      } catch {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }
    throw new Error("mpv IPC socket did not become ready");
  }
}
