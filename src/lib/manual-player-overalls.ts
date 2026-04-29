const SEASON_1_MANUAL_OVERALLS = {
  "dayvon russell": 88,
  "rashard rodriguez": 90,
  "tj killings": 89,
} as const satisfies Record<string, number>;

const SEASON_2_MANUAL_OVERALLS = {
  "isiah lewis": 93,
} as const satisfies Record<string, number>;

const SEASON_3_MANUAL_OVERALLS = {
  "adden goffe": 89,
  "aden goffe": 94,
  "aland beliard": 82,
  "alex hopkins": 85,
  "anthony ireland": 94,
  "anthony miller": 86,
  "anthony miller jr.": 86,
  "arkell lamar": 82,
  "brandon holland": 84,
  "cam menefee": 87,
  "chris estwan": 84,
  "cody dileonardo": 79,
  "colby winchester": 79,
  "darric myers": 86,
  "dashon smith": 94,
  "david crenshaw": 89,
  "demetrius gordon": 86,
  "dlier mohammed": 85,
  "eric cummings": 83,
  "eric rankin": 85,
  "gavin greene": 85,
  "greg langston": 87,
  "howie miller": 86,
  "isiah earl": 89,
  "jacob morales": 87,
  "jah miller": 88,
  "jahwan cody": 85,
  "james jackson": 84,
  "jamie logan": 82,
  "javon taylor": 90,
  "javon wilson": 83,
  "jay turner": 89,
  "jaylen crawford": 90,
  "jaylin davis": 79,
  "jermaine foster": 82,
  "jonathan edwards": 90,
  "justin sheffield": 85,
  "kevin crawford": 79,
  "kevin magliochetti": 85,
  "khalid moreland": 87,
  "killian okech": 81,
  "kuran iverson": 89,
  "kyle cookson": 83,
  "kyle federici": 85,
  "lateef bilewu": 86,
  "luke yoder": 82,
  "marcell robinson": 86,
  "markis christie": 83,
  "martin dominguez": 85,
  "matt evarts": 79,
  "matt perez": 86,
  "mikey fuller": 84,
  "naz vereen": 83,
  "pasquale villano": 85,
  "quincy mcknight": 97,
  "rob moriarty": 90,
  "rodney cook": 85,
  "roger hamelet": 80,
  "ronnie smith": 67,
  "ryan boehm": 80,
  "sheriff bilewu": 88,
  "siah tait": 87,
  "tamar williams": 94,
  "tarice thompson": 79,
  "teron griffin": 88,
  "tiyorne coleman": 84,
  "tj green": 86,
  "tj pettway": 83,
  "tyler marchese": 79,
  "tyshawn smith": 80,
  "will barton": 90,
  "zaire lott": 94,
  "zion lott": 95,
} as const satisfies Record<string, number>;

const MANUAL_SEASON_OVERALLS = {
  "1": SEASON_1_MANUAL_OVERALLS,
  "2": SEASON_2_MANUAL_OVERALLS,
  "3": SEASON_3_MANUAL_OVERALLS,
} as const satisfies Record<string, Record<string, number>>;

export function getManualSeasonOveralls(seasonId: string): Record<string, number> {
  const seasonOveralls = MANUAL_SEASON_OVERALLS[seasonId as keyof typeof MANUAL_SEASON_OVERALLS];
  if (!seasonOveralls) {
    return {};
  }

  return { ...seasonOveralls };
}

export function getManualSeasonOverall(seasonId: string, playerName: string): number | null {
  const seasonOveralls = MANUAL_SEASON_OVERALLS[seasonId as keyof typeof MANUAL_SEASON_OVERALLS];
  if (!seasonOveralls) {
    return null;
  }

  return seasonOveralls[playerName.trim().toLowerCase() as keyof typeof seasonOveralls] ?? null;
}
