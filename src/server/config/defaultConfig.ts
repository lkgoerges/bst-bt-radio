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
    id: "1live-diggi",
    name: "1LIVE DIGGI",
    streamUrl: "https://wdr-1live-diggi.icecastssl.wdr.de/wdr/1live/diggi/mp3/128/stream.mp3",
    group: "wdr",
    description: "Digitaler 1LIVE Musikstream."
  },
  {
    id: "radio-21",
    name: "Radio 21",
    streamUrl: "https://radio21.streamabc.net/radio21-hannover-mp3-192-3735655",
    group: "rock",
    description: "Rock und Pop aus Niedersachsen."
  },
  {
    id: "radio-bob",
    name: "Radio BOB!",
    streamUrl: "http://streams.radiobob.de/bob-live/mp3-192/mediaplayer",
    group: "rock",
    description: "Rockmusik und Klassiker."
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
  if (siteId === "kitchen") {
    return {
      site: {
        id: "kitchen",
        name: "Küche",
        defaultSpeakerId: "kitchen",
        peers: [
          { id: "living-room", name: "Living Room", baseUrl: "http://bst-radio-living.local:3090" },
          { id: "vfl", name: "VfL Schildesche", baseUrl: "http://bst-radio-vfl.local:3090" }
        ]
      },
      startup: { mode: "idle" },
      speakers: [
        {
          id: "kitchen",
          name: "Küche",
          model: "SoundTouch 10",
          output: "local-analog",
          room: "Küche"
        }
      ],
      stations
    };
  }

  if (siteId === "living-room") {
    return {
      site: {
        id: "living-room",
        name: "Living Room",
        defaultSpeakerId: "living-room",
        peers: [
          { id: "kitchen", name: "Küche", baseUrl: "http://bst-radio-kitchen.local:3090" },
          { id: "vfl", name: "VfL Schildesche", baseUrl: "http://bst-radio-vfl.local:3090" }
        ]
      },
      startup: { mode: "idle" },
      speakers: [
        {
          id: "living-room",
          name: "Living Room",
          model: "SoundTouch 10",
          output: "local-analog",
          room: "Living Room"
        }
      ],
      stations
    };
  }

  if (siteId === "vfl") {
    return {
      site: {
        id: "vfl",
        name: "VfL Schildesche",
        defaultSpeakerId: "vfl-schildesche",
        peers: [
          { id: "kitchen", name: "Küche", baseUrl: "http://bst-radio-kitchen.local:3090" },
          { id: "living-room", name: "Living Room", baseUrl: "http://bst-radio-living.local:3090" }
        ]
      },
      startup: { mode: "idle" },
      speakers: [
        {
          id: "vfl-schildesche",
          name: "VfL Schildesche",
          model: "SoundTouch 20",
          output: "local-analog",
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
        name: "Küche",
        model: "SoundTouch 10",
        output: "local-analog",
        room: "Küche"
      },
      {
        id: "living-room",
        name: "Living Room",
        model: "SoundTouch 10",
        output: "local-analog",
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
