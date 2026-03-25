const SEASON_3_MANUAL_OVERALLS = {
  "adden goffe": 89,
  "aden goffe": 89,
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
  "david crenshaw": 89,
  "demetrius gordon": 80,
  "dlier mohammed": 86,
  "eric cummings": 82,
  "gavin greene": 85,
  "howie miller": 84,
  "jacob morales": 83,
  "jahwan cody": 84,
  "jamaul wynter": 75,
  "james jackson": 81,
  "jamie logan": 82,
  "javon taylor": 89,
  "javon wilson": 82,
  "jay turner": 90,
  "jaylen crawford": 89,
  "jaylin davis": 78,
  "jermaine foster": 82,
  "jonathan edwards": 90,
  "justin sheffield": 82,
  "kevin magliochetti": 83,
  "khalid moreland": 83,
  "killian okech": 81,
  "kuran iverson": 89,
  "kyle cookson": 83,
  "kyle federici": 85,
  "lateef bilewu": 86,
  "luke yoder": 83,
  "marcell robinson": 86,
  "markis christie": 78,
  "martin dominguez": 82,
  "matt evarts": 80,
  "matt perez": 83,
  "mikey fuller": 84,
  "naz vereen": 83,
  "nick bottone": 79,
  "pasquale villano": 86,
  "perm jackson": 75,
  "quincy mcknight": 93,
  "rob moriarty": 88,
  "rodney cook": 81,
  "roger hamelet": 80,
  "ronnie smith": 87,
  "ryan boehm": 80,
  "sheriff bilewu": 87,
  "siah tait": 86,
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
