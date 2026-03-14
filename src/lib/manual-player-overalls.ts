const SEASON_3_MANUAL_OVERALLS = {
  "javon taylor": 90,
  "david crenshaw": 90,
  "dashon smith": 89,
  "jay turner": 89,
  "pasquale villano": 83,
  "anthony ireland": 92,
  "marcell robinson": 82,
  "tamar williams": 89,
  "rob moriarty": 85,
  "alex hopkins": 83,
  "matt perez": 83,
  "gavin greene": 85,
  "will barton": 90,
  "darric myers": 83,
  "rodney cook": 82,
  "ronnie smith": 84,
  "anthony miller": 83,
  "eric cummings": 82,
  "adden goffe": 81,
  "howie miller": 84,
  "lateef bilewu": 83,
  "demetrius gordon": 75,
  "dlier mohammed": 85,
  "tj green": 83,
  "jacob morales": 83,
  "martin dominguez": 82,
  "tj pettway": 81,
  "chris estwan": 83,
  "justin sheffield": 82,
  "luke yoder": 83,
  "jahwan cody": 84,
  "javon wilson": 82,
  "siah tait": 84,
  "kyle federici": 83,
  "naz vereen": 83,
  "jaylen crawford": 83,
  "jamie logan": 79,
  "cam menefee": 87,
  "jermaine foster": 82,
  "brandon holland": 82,
  "killian okech": 81,
  "cody dileonardo": 79,
  "colby winchester": 79,
  "jaylin davis": 78,
  "tyshawn smith": 80,
  "kevin magliochetti": 81,
  "tarice thompson": 81,
  "matt evarts": 80,
  "jamaul wynter": 75,
  "teron griffin": 75,
  "khalid moreland": 75,
  "ryan boehm": 75,
  "mikey fuller": 75,
  "tiyorne coleman": 75,
  "james jackson": 75,
  "aland beliard": 75,
  "perm jackson": 75,
  "nick bottone": 79,
  "tyler marchese": 75,
  "kuron iverson": 75,
  "markis christie": 75,
  "sheriff bilewu": 75,
  "kyle cookson": 83,
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
