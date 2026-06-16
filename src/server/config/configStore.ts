import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { AppConfig, RuntimeState, SiteId, StartupMode } from "../types.js";
import { createDefaultConfig, createDefaultState } from "./defaultConfig.js";
import { appConfigSchema, runtimeStateSchema } from "./schemas.js";

export class ConfigStore {
  private config?: AppConfig;
  private state?: RuntimeState;

  constructor(
    private readonly configPath: string,
    private readonly statePath: string,
    private readonly siteId: SiteId
  ) {}

  async load(): Promise<void> {
    this.config = await this.loadConfig();
    this.state = await this.loadState(this.config);
  }

  getConfig(): AppConfig {
    if (!this.config) throw new Error("Config has not been loaded");
    return this.config;
  }

  getState(): RuntimeState {
    if (!this.state) throw new Error("State has not been loaded");
    return this.state;
  }

  async updateConfig(updater: (config: AppConfig) => AppConfig): Promise<AppConfig> {
    const next = appConfigSchema.parse(updater(this.getConfig()));
    this.config = next;
    await this.writeJson(this.configPath, next);
    return next;
  }

  async updateState(updater: (state: RuntimeState) => RuntimeState): Promise<RuntimeState> {
    const next = runtimeStateSchema.parse(updater(this.getState()));
    this.state = next;
    await this.writeJson(this.statePath, next);
    return next;
  }

  async setStartupMode(mode: StartupMode): Promise<AppConfig> {
    return this.updateConfig((config) => ({ ...config, startup: { mode } }));
  }

  async setSelectedSpeaker(speakerId: string): Promise<RuntimeState> {
    return this.updateState((state) => ({ ...state, selectedSpeakerId: speakerId }));
  }

  async rememberVolume(speakerId: string, volume: number): Promise<RuntimeState> {
    return this.updateState((state) => ({
      ...state,
      rememberedVolumes: { ...state.rememberedVolumes, [speakerId]: volume }
    }));
  }

  private async loadConfig(): Promise<AppConfig> {
    const fallback = createDefaultConfig(this.siteId);
    const config = await this.readJson(this.configPath, fallback);
    const parsed = appConfigSchema.parse(config);
    await this.writeJson(this.configPath, parsed);
    return parsed;
  }

  private async loadState(config: AppConfig): Promise<RuntimeState> {
    const fallback = createDefaultState(config);
    const state = await this.readJson(this.statePath, fallback);
    const withMissingVolumes = {
      ...state,
      rememberedVolumes: {
        ...fallback.rememberedVolumes,
        ...state.rememberedVolumes
      }
    };
    const parsed = runtimeStateSchema.parse(withMissingVolumes);
    await this.writeJson(this.statePath, parsed);
    return parsed;
  }

  private async readJson<T>(filePath: string, fallback: T): Promise<T> {
    try {
      return JSON.parse(await readFile(filePath, "utf8")) as T;
    } catch (error) {
      const code = typeof error === "object" && error !== null && "code" in error ? error.code : undefined;
      if (code !== "ENOENT") throw error;
      return fallback;
    }
  }

  private async writeJson(filePath: string, value: unknown): Promise<void> {
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  }
}
