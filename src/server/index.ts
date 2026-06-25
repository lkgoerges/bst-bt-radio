import http from "node:http";
import path from "node:path";
import { createApp } from "./app.js";
import { ConfigStore } from "./config/configStore.js";
import { AudioService } from "./services/audioService.js";
import { BluetoothService } from "./services/bluetoothService.js";
import { MpvClient } from "./services/mpvClient.js";
import { RadioController } from "./services/radioController.js";
import { StatusHub } from "./statusHub.js";

const port = Number(process.env.BT_RADIO_PORT ?? 3090);
const host = process.env.BT_RADIO_HOST ?? "0.0.0.0";
const site = process.env.BT_RADIO_SITE ?? "home";
const mockMode = process.env.BT_RADIO_MOCK === "1" || process.platform !== "linux";
const configPath = path.resolve(process.env.BT_RADIO_CONFIG ?? "./data/config.json");
const statePath = path.resolve(process.env.BT_RADIO_STATE ?? "./data/state.json");
const mpvSocketPath = process.env.BT_RADIO_MPV_SOCKET ?? "/tmp/bst-bt-radio-mpv.sock";
const bluetoothController = process.env.BT_RADIO_BLUETOOTH_CONTROLLER;

const store = new ConfigStore(configPath, statePath, site);
await store.load();

let broadcastStatus: () => void = () => undefined;
const controller = new RadioController(
  store,
  new BluetoothService(mockMode, bluetoothController),
  new AudioService(mockMode),
  new MpvClient(mpvSocketPath, mockMode),
  mockMode,
  () => broadcastStatus()
);
const app = createApp(controller);
const server = http.createServer(app);
const hub = new StatusHub(server);
broadcastStatus = () => hub.broadcast();
hub.setPayloadGetter(() => controller.getStatus());

server.listen(port, host, async () => {
  console.log(`BST BT Radio listening on http://${host}:${port} (${site}, mock=${mockMode})`);
  await controller.initializeStartup().catch((error) => {
    console.error("Startup initialization failed:", error);
  });
});

const shutdown = async () => {
  server.close();
  await controller.shutdown().catch(() => undefined);
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
