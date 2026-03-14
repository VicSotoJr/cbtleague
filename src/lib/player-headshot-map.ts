import generatedPlayerProfileCrops from "@/data/player-profile-crops.generated.json";

export const PLAYER_HEADSHOT_ALIASES: Readonly<Record<string, string>> = {
  mekhimcniel: "mehkimcniel",
  nazvereen: "nazvareen",
  pasqualevillano: "pasqualevilliano",
  julianallen: "idk",
};

export interface PlayerProfileBackdropOverride {
  objectPosition: string;
  scale: number;
  brightness?: number;
  saturation?: number;
}

export function normalizePlayerHeadshotKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/['’`]/g, "")
    .replace(/[^a-z0-9._-]/g, "");
}

const DEFAULT_PLAYER_PROFILE_BACKDROP: Readonly<PlayerProfileBackdropOverride> = {
  objectPosition: "50% 8%",
  scale: 1.16,
  brightness: 0.9,
  saturation: 0.92,
};

const GENERATED_PLAYER_PROFILE_BACKDROP_OVERRIDES =
  generatedPlayerProfileCrops as Readonly<Record<string, PlayerProfileBackdropOverride>>;

const SEASON_THREE_PROFILE_BACKDROP_OVERRIDES: Readonly<Record<string, Partial<PlayerProfileBackdropOverride>>> = {
  cammenefee: { objectPosition: "50% 35%", scale: 1.4 },
  dashonsmith: { scale: 1.45 },
  jahwancody: { objectPosition: "50% 24%", scale: 1.4 },
  pasqualevillano: { objectPosition: "50% 24%", scale: 1.4 },
  siahtait: { objectPosition: "50% 30%", scale: 1.45 },
  tjgreen: { objectPosition: "50% 30%", scale: 1.45 },
};

export const PLAYER_PROFILE_BACKDROP_OVERRIDES: Readonly<Record<string, PlayerProfileBackdropOverride>> = {
  anthonyireland: { objectPosition: "center 9%", scale: 1.2 },
  alexhopkins: { objectPosition: "center 9%", scale: 1.18 },
  cammenefee: { objectPosition: "center 8%", scale: 1.14 },
  dashonsmith: { objectPosition: "center 9%", scale: 1.18 },
  demetriusgordon: { objectPosition: "center 8%", scale: 1.16 },
  dliermohammed: { objectPosition: "center 9%", scale: 1.16 },
  javontaylor: { objectPosition: "center 6%", scale: 1.04 },
  jayturner: { objectPosition: "center 9%", scale: 1.18 },
  robmoriarty: { objectPosition: "46% 9%", scale: 1.16 },
  tamarwilliams: { objectPosition: "center 9%", scale: 1.18 },
  willbarton: { objectPosition: "48% 8%", scale: 1.2 },
};

export function getPlayerProfileBackdropOverride(playerName: string): PlayerProfileBackdropOverride | null {
  const normalizedKey = normalizePlayerHeadshotKey(playerName);

  if (!normalizedKey) {
    return null;
  }

  const baseBackdrop =
    PLAYER_PROFILE_BACKDROP_OVERRIDES[normalizedKey] ??
    GENERATED_PLAYER_PROFILE_BACKDROP_OVERRIDES[normalizedKey] ??
    DEFAULT_PLAYER_PROFILE_BACKDROP;

  return {
    objectPosition: baseBackdrop.objectPosition,
    scale: baseBackdrop.scale,
    brightness: baseBackdrop.brightness,
    saturation: baseBackdrop.saturation,
  };
}

export function getSeasonAwarePlayerProfileBackdropOverride(
  playerName: string,
  seasonId?: string | null
): PlayerProfileBackdropOverride | null {
  const normalizedKey = normalizePlayerHeadshotKey(playerName);

  if (!normalizedKey) {
    return null;
  }

  if (seasonId === "3") {
    const seasonThreeBase =
      GENERATED_PLAYER_PROFILE_BACKDROP_OVERRIDES[normalizedKey] ??
      DEFAULT_PLAYER_PROFILE_BACKDROP;
    const seasonThreeOverride = SEASON_THREE_PROFILE_BACKDROP_OVERRIDES[normalizedKey];

    return {
      objectPosition: seasonThreeOverride?.objectPosition ?? seasonThreeBase.objectPosition,
      scale: seasonThreeOverride?.scale ?? seasonThreeBase.scale,
      brightness: seasonThreeBase.brightness ?? DEFAULT_PLAYER_PROFILE_BACKDROP.brightness,
      saturation: seasonThreeBase.saturation ?? DEFAULT_PLAYER_PROFILE_BACKDROP.saturation,
    };
  }

  return getPlayerProfileBackdropOverride(playerName);
}

export const MISSING_PLAYER_HEADSHOT_KEYS: ReadonlySet<string> = new Set<string>([
  "edmundscott",
  "terongriffin",
  "terrongriffin",
  "khalidmoreland",
  "ryanboehm",
  "mikeyfuller",
  "tiyornecoleman",
  "jamesjackson",
  "alexbeliard",
  "alandbeliard",
  "jaylencrawford",
  "kylefederici",
  "jermainefoster",
  "javonwilson",
  "permjackson",
  "anthonymiller",
  "dashonsmith",
  "darricmyers",
  "derricmyers",
  "nickbottone",
  "tylermarchese",
  "malikcameron",
  "colbywinchester",
  "howiemiller",
  "jaylindavis",
  "lukeyoder",
  "ericcummings",
  "markischristie",
  "henrysmith",
  "jahwancody",
  "brandonholland",
  "siahtait",
  "addengoffe",
  "sheriffbilewu",
  "willbarton",
  "anthonyireland",
  "lateefbilewu",
  "kuroniverson",
  "tyshawnsmith",
]);
