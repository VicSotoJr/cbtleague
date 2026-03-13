const SEASON_3_MANUAL_OVERALLS = {
  "javon taylor": 98,
  "david crenshaw": 96,
  "dashon smith": 95,
  "jay turner": 93,
  "pasquale villano": 91,
  "anthony ireland": 89,
  "marcell robinson": 89,
  "tamar williams": 87,
  "rob moriarty": 86,
  "alex hopkins": 86,
  "matt perez": 85,
  "gavin greene": 84,
  "will barton": 83,
  "darric myers": 82,
  "rodney cook": 80,
  "ronnie smith": 74,
  "anthony miller": 74,
  "eric cummings": 74,
  "adden goffe": 74,
  "howie miller": 73,
  "lateef bilewu": 73,
  "demetrius gordon": 73,
  "dlier mohammed": 73,
  "tj green": 72,
  "jacob morales": 72,
  "martin dominguez": 71,
  "tj pettway": 71,
  "chris estwan": 71,
  "justin sheffield": 70,
  "luke yoder": 70,
  "jahwan cody": 70,
  "javon wilson": 70,
  "siah tait": 70,
  "kyle federici": 70,
  "naz vereen": 70,
  "jaylen crawford": 69,
  "jamie logan": 69,
  "cam menefee": 69,
  "jermaine foster": 69,
  "brandon holland": 69,
  "killian okech": 68,
  "cody dileonardo": 68,
  "colby winchester": 68,
  "jaylin davis": 68,
  "tyshawn smith": 68,
  "kevin magliochetti": 68,
  "tarice thompson": 68,
  "matt evarts": 67,
  "jamaul wynter": 67,
  "teron griffin": 60,
  "khalid moreland": 60,
  "ryan boehm": 60,
  "mikey fuller": 60,
  "tiyorne coleman": 60,
  "james jackson": 60,
  "aland beliard": 60,
  "perm jackson": 60,
  "nick bottone": 60,
  "tyler marchese": 60,
  "kuron iverson": 60,
  "markis christie": 60,
  "sheriff bilewu": 60,
} as const satisfies Record<string, number>;

const MANUAL_SEASON_OVERALLS = {
  "3": SEASON_3_MANUAL_OVERALLS,
} as const satisfies Record<string, Record<string, number>>;

export function getManualSeasonOverall(seasonId: string, playerName: string): number | null {
  const seasonOveralls = MANUAL_SEASON_OVERALLS[seasonId as keyof typeof MANUAL_SEASON_OVERALLS];
  if (!seasonOveralls) {
    return null;
  }

  return seasonOveralls[playerName.trim().toLowerCase() as keyof typeof seasonOveralls] ?? null;
}

