const SEASON_3_MANUAL_OVERALLS = {
  "adden goffe": 86,
  "aland beliard": 75,
  "alex hopkins": 84,
  "anthony ireland": 94,
  "anthony miller": 84,
  "anthony miller jr.": 84,
  "arkell lamar": 82,
  "brandon holland": 82,
  "cam menefee": 87,
  "chris estwan": 83,
  "cody dileonardo": 79,
  "colby winchester": 78,
  "darric myers": 86,
  "dashon smith": 90,
  "david crenshaw": 90,
  "demetrius gordon": 80,
  "dlier mohammed": 85,
  "eric cummings": 82,
  "gavin greene": 85,
  "howie miller": 84,
  "jacob morales": 83,
  "jahwan cody": 84,
  "jamaul wynter": 75,
  "james jackson": 81,
  "jamie logan": 79,
  "javon taylor": 89,
  "javon wilson": 82,
  "jay turner": 90,
  "jaylen crawford": 83,
  "jaylin davis": 78,
  "jermaine foster": 82,
  "justin sheffield": 82,
  "kevin magliochetti": 80,
  "khalid moreland": 83,
  "killian okech": 81,
  "kuron iverson": 89,
  "kyle cookson": 83,
  "kyle federici": 83,
  "lateef bilewu": 84,
  "luke yoder": 83,
  "marcell robinson": 84,
  "markis christie": 78,
  "martin dominguez": 82,
  "matt evarts": 79,
  "matt perez": 83,
  "mikey fuller": 84,
  "naz vereen": 83,
  "nick bottone": 79,
  "pasquale villano": 87,
  "perm jackson": 75,
  "rob moriarty": 85,
  "rodney cook": 81,
  "roger hamelet": 79,
  "ronnie smith": 87,
  "ryan boehm": 79,
  "sheriff bilewu": 86,
  "siah tait": 84,
  "tamar williams": 92,
  "tarice thompson": 81,
  "teron griffin": 87,
  "tiyorne coleman": 80,
  "tj green": 83,
  "tj pettway": 81,
  "tyler marchese": 79,
  "tyshawn smith": 80,
  "will barton": 92,
  "zaire lott": 94,
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
