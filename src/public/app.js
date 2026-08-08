const state = {
  status: null,
  volumeTimer: null,
  labels: {}
};

const els = {
  siteLabel: document.querySelector("#siteLabel"),
  nowPlaying: document.querySelector("#nowPlaying"),
  stopButton: document.querySelector("#stopButton"),
  volumeSlider: document.querySelector("#volumeSlider"),
  volumeValue: document.querySelector("#volumeValue"),
  startupIdle: document.querySelector("#startupIdle"),
  startupResume: document.querySelector("#startupResume"),
  speakers: document.querySelector("#speakers"),
  speakerStatus: document.querySelector("#speakerStatus"),
  stations: document.querySelector("#stations"),
  playbackStatus: document.querySelector("#playbackStatus"),
  locationsSection: document.querySelector("#locationsSection"),
  locations: document.querySelector("#locations"),
  shutdownButton: document.querySelector("#shutdownButton")
};

const fallbackLabels = {
  app: { idle: "Bereit", mock: "Testmodus" },
  maintenance: {
    shutdown: "Pi herunterfahren",
    shutdownConfirm: "Diesen Raspberry Pi jetzt herunterfahren?",
    shuttingDown: "Fährt herunter..."
  },
  status: {
    idle: "Bereit",
    playing: "Läuft",
    stopped: "Gestoppt",
    error: "Fehler",
    noSpeaker: "Kein Lautsprecher",
    shutdownRequested: "Herunterfahren angefordert"
  },
  groups: {}
};

async function loadLabels(locale = "de") {
  const response = await fetch(`/i18n/${locale}.json`).catch(() => undefined);
  const labels = response?.ok ? await response.json() : {};
  state.labels = mergeLabels(fallbackLabels, labels);
  applyStaticLabels();
}

function mergeLabels(base, override) {
  return Object.fromEntries(
    Object.entries({ ...base, ...override }).map(([key, value]) => {
      const baseValue = base[key];
      const overrideValue = override[key];
      if (isRecord(baseValue) && isRecord(overrideValue)) {
        return [key, mergeLabels(baseValue, overrideValue)];
      }
      return [key, value];
    })
  );
}

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function t(path, fallback = path) {
  return path.split(".").reduce((value, part) => value?.[part], state.labels) ?? fallback;
}

function applyStaticLabels() {
  document.querySelectorAll("[data-i18n]").forEach((element) => {
    element.textContent = t(element.dataset.i18n, element.textContent);
  });
  els.stopButton.title = t("controls.stop", "Stopp");
  els.stopButton.setAttribute("aria-label", t("controls.stop", "Stopp"));
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || response.statusText);
  }
  return response.json();
}

function setStatus(nextStatus) {
  state.status = nextStatus;
  render();
}

function getSelectedSpeaker() {
  const { config, state: runtime } = state.status;
  return config.speakers.find((speaker) => speaker.id === runtime.selectedSpeakerId);
}

function getCurrentStation() {
  const { config, state: runtime } = state.status;
  return config.stations.find((station) => station.id === runtime.currentStationId);
}

function render() {
  if (!state.status) return;

  const { config, state: runtime, mockMode } = state.status;
  const station = getCurrentStation();
  const speaker = getSelectedSpeaker();
  const isPlaying = runtime.playback.status === "playing";
  const selectedVolume = runtime.rememberedVolumes[runtime.selectedSpeakerId] ?? 50;

  els.siteLabel.textContent = `${config.site.name}${mockMode ? ` / ${t("app.mock", "Testmodus")}` : ""}`;
  els.nowPlaying.textContent = isPlaying && station ? station.name : t("app.idle", "Bereit");
  els.playbackStatus.textContent = t(`status.${runtime.playback.status}`, runtime.playback.status);
  els.playbackStatus.className = runtime.playback.status === "error" ? "status-error" : "";
  els.speakerStatus.textContent = speaker ? speaker.name : t("status.noSpeaker", "Kein Lautsprecher");
  els.volumeSlider.value = String(selectedVolume);
  els.volumeValue.value = String(selectedVolume);

  els.startupIdle.classList.toggle("active", config.startup.mode === "idle");
  els.startupResume.classList.toggle("active", config.startup.mode === "resume-last");

  renderSpeakers(config.speakers, runtime.selectedSpeakerId);
  renderStations(config.stations, runtime.currentStationId, isPlaying);
  renderLocations(config.site.peers);
}

function renderSpeakers(speakers, selectedSpeakerId) {
  els.speakers.replaceChildren(
    ...speakers.map((speaker) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `speaker-button${speaker.id === selectedSpeakerId ? " active" : ""}`;
      button.innerHTML = `
        <span class="primary-text">${escapeHtml(speaker.name)}</span>
        <span class="secondary-text">${escapeHtml(speaker.model)}</span>
      `;
      button.addEventListener("click", () => runAction(() => api(`/api/speakers/${speaker.id}/select`, { method: "POST" })));
      return button;
    })
  );
}

function renderStations(stations, currentStationId, isPlaying) {
  const groups = stations.reduce((accumulator, station) => {
    const group = accumulator.get(station.group) || [];
    group.push(station);
    accumulator.set(station.group, group);
    return accumulator;
  }, new Map());
  const groupNodes = [...groups.entries()].map(([group, items]) => {
    const section = document.createElement("section");
    section.className = "station-group";
    const heading = document.createElement("h3");
    heading.textContent = t(`groups.${group}`, group);
    const list = document.createElement("div");
    list.className = "station-list";
    list.replaceChildren(
      ...items.map((station) => {
        const active = isPlaying && station.id === currentStationId;
        const button = document.createElement("button");
        button.type = "button";
        button.className = `station-button${active ? " active" : ""}`;
        button.innerHTML = `
          <span class="play-mark" aria-hidden="true">${active ? "■" : "▶"}</span>
          <span class="station-copy">
            <span class="primary-text">${escapeHtml(station.name)}</span>
            <span class="secondary-text">${escapeHtml(station.description || station.group)}</span>
          </span>
        `;
        button.addEventListener("click", () => runAction(() => api(`/api/stations/${station.id}/play`, { method: "POST" })));
        return button;
      })
    );
    section.append(heading, list);
    return section;
  });
  els.stations.replaceChildren(...groupNodes);
}

function renderLocations(peers) {
  els.locationsSection.hidden = peers.length === 0;
  els.locations.replaceChildren(
    ...peers.map((peer) => {
      const link = document.createElement("a");
      link.className = "location-link";
      link.href = peer.baseUrl;
      link.innerHTML = `
        <span class="primary-text">${escapeHtml(peer.name)}</span>
        <span class="secondary-text">${escapeHtml(peer.baseUrl)}</span>
      `;
      return link;
    })
  );
}

async function runAction(action) {
  try {
    setStatus(await action());
  } catch (error) {
    els.playbackStatus.textContent = error.message;
    els.playbackStatus.className = "status-error";
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

els.stopButton.addEventListener("click", () => runAction(() => api("/api/player/stop", { method: "POST" })));

els.volumeSlider.addEventListener("input", () => {
  const volume = Number(els.volumeSlider.value);
  els.volumeValue.value = String(volume);
  window.clearTimeout(state.volumeTimer);
  state.volumeTimer = window.setTimeout(() => {
    runAction(() =>
      api("/api/volume", {
        method: "POST",
        body: JSON.stringify({ volume })
      })
    );
  }, 160);
});

els.startupIdle.addEventListener("click", () =>
  runAction(() =>
    api("/api/settings/startup", {
      method: "PATCH",
      body: JSON.stringify({ mode: "idle" })
    })
  )
);

els.startupResume.addEventListener("click", () =>
  runAction(() =>
    api("/api/settings/startup", {
      method: "PATCH",
      body: JSON.stringify({ mode: "resume-last" })
    })
  )
);

els.shutdownButton.addEventListener("click", async () => {
  const confirmed = window.confirm(t("maintenance.shutdownConfirm", "Diesen Raspberry Pi jetzt herunterfahren?"));
  if (!confirmed) return;
  els.shutdownButton.disabled = true;
  els.shutdownButton.textContent = t("maintenance.shuttingDown", "Fährt herunter...");
  try {
    await api("/api/system/shutdown", { method: "POST" });
    els.playbackStatus.textContent = t("status.shutdownRequested", "Herunterfahren angefordert");
  } catch (error) {
    els.shutdownButton.disabled = false;
    els.shutdownButton.textContent = t("maintenance.shutdown", "Pi herunterfahren");
    els.playbackStatus.textContent = error.message;
    els.playbackStatus.className = "status-error";
  }
});

function connectEvents() {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const socket = new WebSocket(`${protocol}//${window.location.host}/api/events`);
  socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (message.type === "status") setStatus(message.payload);
  });
  socket.addEventListener("close", () => window.setTimeout(connectEvents, 2000));
}

await loadLabels("de");
await runAction(() => api("/api/status"));
connectEvents();
