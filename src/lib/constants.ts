// ── Google Sheets Configuration ──────────────────────────────────────────────
export const SHEET_BASE =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vSYPt3d_kWokuuI0tCFpB1GNChdyfOa2iWdw7wfjCdCRR56swjh93UL09_ZG5moi1z3ot79SiDbULwQ/pub?single=true&output=csv';

export const SHEET_URLS = {
  roster:    SHEET_BASE + '&gid=61',
  handicap:  SHEET_BASE + '&gid=639840852',
  schedule:  SHEET_BASE + '&gid=62',
  standings: SHEET_BASE + '&gid=0',
} as const;

// Playoff sheet (separate spreadsheet)
export const PLAYOFF_SHEET_BASE =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vT4_diZ3o0w_DVyOKXnmMqDQqjkKmhEhgy5-reh8Gg-XvvJcdw1cbmKvPkBWxoqeMW-e_cl6sYHTsr8/pub?single=true&output=csv';

export const PLAYOFF_SHEET_URLS = {
  standings: PLAYOFF_SHEET_BASE + '&gid=0',
} as const;

// ── Team GIDs (Google Sheet tab IDs) ──────────────────────────────────────────
export const TEAM_GIDS: Record<string, number> = {
  'Gutter & Sons':                     78,
  'Captain Ryan and his TBDs':         66,
  "Dolla Dolla Bowl Y'all":            49,
  'Easy Pickup 2':                     76,
  'Ghost Team':                        68,
  'Glory Bowls':                       70,
  'LIC My Balls':                      75,
  'Lickety Splitz':                    69,
  "Michael BOWLton's Greatest Splits": 74,
  'Midwest Vacuum':                    73,
  'Ozzie Guillen':                     71,
  'Pin Chitters':                      64,
  'Singles Team':                      67,
  'Slice & Dice':                      72,
  'Stranger Pins':                     65,
  'The Dude':                          77,
};

// Gutter & Sons first, rest alphabetical
export const TEAM_NAMES: string[] = [
  'Gutter & Sons',
  ...Object.keys(TEAM_GIDS).filter(t => t !== 'Gutter & Sons').sort(),
];

// ── Season dates ──────────────────────────────────────────────────────────────
export const SEASON_START = new Date(2026, 0, 21); // Jan 21 2026 = Week 1
export const TOTAL_WEEKS  = 12;
export const MAX_BOWLERS  = 6;

// ── Helpers ───────────────────────────────────────────────────────────────────
export function normStr(s: string): string {
  return (s || '').toLowerCase().trim();
}

export function normTeam(t: string): string {
  return normStr(t);
}

// ── Date helpers ──────────────────────────────────────────────────────────────
const MONTH_MAP: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

const MONTH_NAMES = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];

/** Parses "21-Jan", "4-Feb" → Date */
export function parseSheetDate(dateStr: string): Date | null {
  const parts = (dateStr || '').split('-');
  if (parts.length < 2) return null;
  const day = parseInt(parts[0]);
  const monthIdx = MONTH_MAP[parts[1].toLowerCase()];
  if (isNaN(day) || monthIdx === undefined) return null;
  return new Date(new Date().getFullYear(), monthIdx, day);
}

export function formatBowlingDate(date: Date): string {
  return `${MONTH_NAMES[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

/**
 * Returns this week's Wednesday.
 * Before Wed (Sun/Mon/Tue) → upcoming Wednesday.
 * On Wed → today.
 * After Wed (Thu/Fri/Sat) → most recent Wednesday.
 */
export function getMostRecentWednesday(): Date {
  const today = new Date();
  const day = today.getDay(); // 0=Sun … 6=Sat
  const offset = 3 - day;     // +forward for Sun/Mon/Tue, 0 for Wed, -back for Thu/Fri/Sat
  const wed = new Date(today);
  wed.setDate(today.getDate() + offset);
  wed.setHours(0, 0, 0, 0);
  return wed;
}

/**
 * Returns true when the user is viewing the current bowling week
 * AND today is Mon/Tue/Wed (bowling night is upcoming or today).
 * Used to display "THIS WEEK" instead of "WEEK X".
 */
export function isCurrentBowlingWeek(selectedDate: Date): boolean {
  const today = new Date();
  const day = today.getDay(); // 0=Sun … 6=Sat
  // Only show "THIS WEEK" on Mon(1), Tue(2), Wed(3)
  if (day < 1 || day > 3) return false;
  const thisWed = getMostRecentWednesday();
  return (
    selectedDate.getFullYear() === thisWed.getFullYear() &&
    selectedDate.getMonth() === thisWed.getMonth() &&
    selectedDate.getDate() === thisWed.getDate()
  );
}

/** Pre-seed weekDateMap with 12 weeks starting from SEASON_START */
export function buildInitialWeekDateMap(): Record<number, Date> {
  const map: Record<number, Date> = {};
  for (let w = 1; w <= TOTAL_WEEKS; w++) {
    const d = new Date(SEASON_START);
    d.setDate(SEASON_START.getDate() + (w - 1) * 7);
    map[w] = d;
  }
  return map;
}
