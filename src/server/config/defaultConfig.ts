import type { AppConfig, RuntimeState, SiteId, StationConfig } from "../types.js";

const stations: StationConfig[] = [
  {
    id: "radio-bielefeld",
    name: "Radio Bielefeld",
    streamUrl: "https://stream.lokalradio.nrw/444zqq",
    group: "local",
    description: "Local radio for Bielefeld."
  },
  {
    id: "1live",
    name: "1LIVE",
    streamUrl: "https://wdr-1live-live.icecastssl.wdr.de/wdr/1live/live/mp3/128/stream.mp3",
    group: "wdr",
    description: "WDR 1LIVE live stream."
  },
  {
    id: "deutschlandfunk",
    name: "Deutschlandfunk",
    streamUrl: "https://st01.sslstream.dlf.de/dlf/01/128/mp3/stream.mp3",
    group: "news",
    description: "News, politics, and culture."
  },
  {
    id: "deutschlandfunk-kultur",
    name: "Deutschlandfunk Kultur",
    streamUrl: "https://st02.sslstream.dlf.de/dlf/02/128/mp3/stream.mp3",
    group: "news",
    description: "Culture and conversation."
  },
  {
    id: "wdr2",
    name: "WDR 2",
    streamUrl: "https://wdr-wdr2-rheinruhr.icecastssl.wdr.de/wdr/wdr2/rheinruhr/mp3/128/stream.mp3",
    group: "wdr",
    description: "WDR 2 Rhein/Ruhr."
  },
  {
    id: "cosmo",
    name: "COSMO",
    streamUrl: "https://wdr-cosmo-live.icecastssl.wdr.de/wdr/cosmo/live/mp3/128/stream.mp3",
    group: "music",
    description: "Global pop and culture."
  },
  {
    id: "radio-paradise",
    name: "Radio Paradise",
    streamUrl: "https://stream.radioparadise.com/mp3-128",
    group: "tunein",
    description: "Eclectic listener-supported music."
  },
  {
    id: "somafm-groove-salad",
    name: "SomaFM Groove Salad",
    streamUrl: "https://ice2.somafm.com/groovesalad-128-mp3",
    group: "tunein",
    description: "Chilled beats and ambient grooves."
  },
  {
    id: "jazz-radio-berlin",
    name: "JazzRadio Berlin",
    streamUrl: "https://streaming.radio.co/s774887f7b/listen",
    group: "tunein",
    description: "Jazz mix from Berlin."
  }
];

export function createDefaultConfig(siteId: SiteId): AppConfig {
  if (siteId === "vfl") {
    return {
      site: {
        id: "vfl",
        name: "VfL Schildesche",
        defaultSpeakerId: "vfl-schildesche",
        peers: [
          { id: "home", name: "Home", baseUrl: "http://bst-radio-home.local:3090" }
        ]
      },
      startup: { mode: "idle" },
      speakers: [
        {
          id: "vfl-schildesche",
          name: "VfL Schildesche",
          model: "SoundTouch 20",
          bluetoothMac: "",
          room: "VfL Schildesche"
        }
      ],
      stations
    };
  }

  return {
    site: {
      id: "home",
      name: "Home",
      defaultSpeakerId: "kitchen",
      peers: [
        { id: "vfl", name: "VfL Schildesche", baseUrl: "http://bst-radio-vfl.local:3090" }
      ]
    },
    startup: { mode: "idle" },
    speakers: [
      {
        id: "kitchen",
        name: "Kitchen",
        model: "SoundTouch 10",
        bluetoothMac: "",
        room: "Kitchen"
      },
      {
        id: "living-room",
        name: "Living Room",
        model: "SoundTouch 10",
        bluetoothMac: "",
        room: "Living Room"
      }
    ],
    stations
  };
}

export function createDefaultState(config: AppConfig): RuntimeState {
  return {
    selectedSpeakerId: config.site.defaultSpeakerId,
    rememberedVolumes: Object.fromEntries(config.speakers.map((speaker) => [speaker.id, 50])),
    playback: { status: "idle" }
  };
}
