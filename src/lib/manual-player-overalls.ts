const SEASON_3_MANUAL_OVERALLS = {
  "adden goffe": 89,
  "aden goffe": 92,
  "aland beliard": 82,
  "alex hopkins": 85,
  "anthony ireland": 94,
  "anthony miller": 86,
  "anthony miller jr.": 86,
  "arkell lamar": 82,
  "brandon holland": 81,
  "cam menefee": 87,
  "chris estwan": 81,
  "cody dileonardo": 79,
  "colby winchester": 78,
  "darric myers": 86,
  "dashon smith": 91,
  "david crenshaw": 89,
  "demetrius gordon": 83,
  "dlier mohammed": 85,
  "eric cummings": 84,
  "gavin greene": 85,
  "howie miller": 86,
  "isiah earl": 89,
  "jacob morales": 87,
  "jah miller": 88,
  "jahwan cody": 83,
  "james jackson": 83,
  "jamie logan": 82,
  "javon taylor": 90,
  "javon wilson": 83,
  "jay turner": 89,
  "jaylen crawford": 89,
  "jaylin davis": 79,
  "jermaine foster": 82,
  "jonathan edwards": 90,
  "justin sheffield": 82,
  "kevin crawford": 79,
  "kevin magliochetti": 84,
  "khalid moreland": 87,
  "killian okech": 81,
  "kuran iverson": 89,
  "kyle cookson": 83,
  "kyle federici": 85,
  "lateef bilewu": 85,
  "luke yoder": 81,
  "marcell robinson": 86,
  "markis christie": 80,
  "martin dominguez": 83,
  "matt evarts": 79,
  "matt perez": 87,
  "mikey fuller": 84,
  "naz vereen": 83,
  "pasquale villano": 85,
  "quincy mcknight": 97,
  "rob moriarty": 88,
  "rodney cook": 85,
  "roger hamelet": 80,
  "ronnie smith": 67,
  "ryan boehm": 80,
  "sheriff bilewu": 85,
  "siah tait": 87,
  "tamar williams": 94,
  "tarice thompson": 79,
  "teron griffin": 88,
  "tiyorne coleman": 82,
  "tj green": 84,
  "tj pettway": 81,
  "tyler marchese": 79,
  "tyshawn smith": 80,
  "will barton": 90,
  "zaire lott": 94,
  "zion lott": 94,
} as const satisfies Record<string, number>;

const MANUAL_SEASON_OVERALLS = {
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
