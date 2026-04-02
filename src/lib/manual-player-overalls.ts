const SEASON_3_MANUAL_OVERALLS = {
  "adden goffe": 89,
  "aden goffe": 92,
  "aland beliard": 79,
  "alex hopkins": 85,
  "anthony ireland": 94,
  "anthony miller": 84,
  "anthony miller jr.": 84,
  "arkell lamar": 82,
  "brandon holland": 82,
  "cam menefee": 88,
  "chris estwan": 81,
  "cody dileonardo": 79,
  "colby winchester": 78,
  "darric myers": 86,
  "dashon smith": 91,
  "david crenshaw": 89,
  "demetrius gordon": 81,
  "dlier mohammed": 86,
  "eric cummings": 82,
  "gavin greene": 85,
  "howie miller": 84,
  "isiah earl": 85,
  "jacob morales": 84,
  "jahwan cody": 84,
  "james jackson": 83,
  "jamie logan": 82,
  "javon taylor": 88,
  "javon wilson": 82,
  "jay turner": 89,
  "jaylen crawford": 89,
  "jaylin davis": 78,
  "jermaine foster": 82,
  "jonathan edwards": 88,
  "justin sheffield": 82,
  "kevin crawford": 79,
  "kevin magliochetti": 84,
  "khalid moreland": 85,
  "killian okech": 81,
  "kuran iverson": 89,
  "kyle cookson": 83,
  "kyle federici": 85,
  "lateef bilewu": 85,
  "luke yoder": 81,
  "marcell robinson": 86,
  "markis christie": 80,
  "martin dominguez": 81,
  "matt evarts": 79,
  "matt perez": 86,
  "mikey fuller": 84,
  "naz vereen": 83,
  "pasquale villano": 85,
  "quincy mcknight": 93,
  "rob moriarty": 88,
  "rodney cook": 83,
  "roger hamelet": 80,
  "ronnie smith": 67,
  "ryan boehm": 80,
  "sheriff bilewu": 85,
  "siah tait": 86,
  "tamar williams": 92,
  "tarice thompson": 81,
  "teron griffin": 88,
  "tiyorne coleman": 80,
  "tj green": 82,
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
