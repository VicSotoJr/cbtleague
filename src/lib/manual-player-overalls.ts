const SEASON_3_MANUAL_OVERALLS = {
  "adden goffe": 81,
  "aland beliard": 75,
  "alex hopkins": 84,
  "anthony ireland": 94,
  "anthony miller": 84,
  "brandon holland": 82,
  "cam menefee": 87,
  "chris estwan": 83,
  "cody dileonardo": 79,
  "colby winchester": 79,
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
  "javon taylor": 90,
  "javon wilson": 82,
  "jay turner": 90,
  "jaylen crawford": 83,
  "jaylin davis": 78,
  "jermaine foster": 82,
  "justin sheffield": 82,
  "kevin magliochetti": 81,
  "khalid moreland": 83,
  "killian okech": 81,
  "kuron iverson": 75,
  "kyle cookson": 83,
  "kyle federici": 83,
  "lateef bilewu": 83,
  "luke yoder": 83,
  "marcell robinson": 84,
  "markis christie": 78,
  "martin dominguez": 82,
  "matt evarts": 80,
  "matt perez": 83,
  "mikey fuller": 84,
  "naz vereen": 83,
  "nick bottone": 79,
  "pasquale villano": 83,
  "perm jackson": 75,
  "rob moriarty": 85,
  "rodney cook": 81,
  "ronnie smith": 84,
  "ryan boehm": 79,
  "sheriff bilewu": 75,
  "siah tait": 84,
  "tamar williams": 89,
  "tarice thompson": 81,
  "teron griffin": 87,
  "tiyorne coleman": 80,
  "tj green": 83,
  "tj pettway": 81,
  "tyler marchese": 75,
  "tyshawn smith": 80,
  "will barton": 90,
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
