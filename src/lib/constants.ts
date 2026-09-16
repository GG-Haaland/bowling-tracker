// ── Season Configuration ─────────────────────────────────────────────────────
export interface SeasonConfig {
  id: string;
  label: string;
  sheetBase: string;
  sheetUrls: {
    standings: string;
    schedule: string;
    leaderboard: string;
    roster?: string;      // Spring only
    handicap?: string;    // Spring only
  };
  teamGids: Record<string, number>;
  teamNames: string[];
  seasonStart: Date;
  totalWeeks: number;
  gamesPerWeek: number;
  playersPerGame: number;
  isArchive: boolean;
}

// ── Spring 2026 ──────────────────────────────────────────────────────────────
const SPRING_SHEET_BASE =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vSYPt3d_kWokuuI0tCFpB1GNChdyfOa2iWdw7wfjCdCRR56swjh93UL09_ZG5moi1z3ot79SiDbULwQ/pub?single=true&output=csv';

// Playoff sheet (separate spreadsheet)
export const PLAYOFF_SHEET_BASE =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vT4_diZ3o0w_DVyOKXnmMqDQqjkKmhEhgy5-reh8Gg-XvvJcdw1cbmKvPkBWxoqeMW-e_cl6sYHTsr8/pub?single=true&output=csv';

export const PLAYOFF_SHEET_URLS = {
  standings: PLAYOFF_SHEET_BASE + '&gid=0',
} as const;

const SPRING_TEAM_GIDS: Record<string, number> = {
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

export const SPRING_2026: SeasonConfig = {
  id: 'spring-2026',
  label: 'Spring 2026',
  sheetBase: SPRING_SHEET_BASE,
  sheetUrls: {
    standings: SPRING_SHEET_BASE + '&gid=0',
    schedule:  SPRING_SHEET_BASE + '&gid=62',
    leaderboard: SPRING_SHEET_BASE + '&gid=61',
    roster:    SPRING_SHEET_BASE + '&gid=61',
    handicap:  SPRING_SHEET_BASE + '&gid=639840852',
  },
  teamGids: SPRING_TEAM_GIDS,
  teamNames: [
    'Gutter & Sons',
    ...Object.keys(SPRING_TEAM_GIDS).filter(t => t !== 'Gutter & Sons').sort(),
  ],
  seasonStart: new Date(2026, 0, 21), // Jan 21 2026
  totalWeeks: 12,
  gamesPerWeek: 2,
  playersPerGame: 3,
  isArchive: true,
};

// ── Fall 2026 ────────────────────────────────────────────────────────────────
const FALL_SHEET_BASE =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vTiZV5kdrkRUpSOhzNVecWpo1vKhmMmd6OhHWYDFRwkBMJD456vC0Plepi4b4-PU71W_PJa236-WO1j/pub?single=true&output=csv';

const FALL_TEAM_GIDS: Record<string, number> = {
  'Gutter & Sons':                     65,
  "Dolla Dolla Bowl Y'all":            49,
  'Easy Pickup':                       76,
  'Glory Bowls':                       74,
  'Lickity Splitz':                    72,
  "Michael BOWLton's Greatest Splits": 77,
  'Pin Toe Beans':                     70,
  'Pins & Balls':                      71,
  'Shaferinos':                        64,
  'Slice & Dice':                      73,
  'Stranger Pins':                     75,
  'The Dude':                          78,
};

export const FALL_2026: SeasonConfig = {
  id: 'fall-2026',
  label: 'Fall 2026',
  sheetBase: FALL_SHEET_BASE,
  sheetUrls: {
    standings:   FALL_SHEET_BASE + '&gid=0',
    schedule:    FALL_SHEET_BASE + '&gid=62',
    leaderboard: FALL_SHEET_BASE + '&gid=61',
  },
  teamGids: FALL_TEAM_GIDS,
  teamNames: [
    'Gutter & Sons',
    ...Object.keys(FALL_TEAM_GIDS).filter(t => t !== 'Gutter & Sons').sort(),
  ],
  seasonStart: new Date(2026, 7, 19), // Aug 19 2026
  totalWeeks: 10,
  gamesPerWeek: 3,
  playersPerGame: 2,
  isArchive: false,
};

// ── All seasons (newest first) ───────────────────────────────────────────────
export const SEASONS: SeasonConfig[] = [FALL_2026, SPRING_2026];
export const DEFAULT_SEASON = FALL_2026;

// ── Legacy exports (for backward compat during migration) ────────────────────
export const SHEET_BASE = DEFAULT_SEASON.sheetBase;
export const SHEET_URLS = DEFAULT_SEASON.sheetUrls;
export const TEAM_GIDS  = DEFAULT_SEASON.teamGids;
export const TEAM_NAMES = DEFAULT_SEASON.teamNames;
export const SEASON_START = DEFAULT_SEASON.seasonStart;
export const TOTAL_WEEKS  = DEFAULT_SEASON.totalWeeks;
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
 */
export function isCurrentBowlingWeek(selectedDate: Date): boolean {
  const today = new Date();
  const day = today.getDay();
  if (day < 1 || day > 3) return false;
  const thisWed = getMostRecentWednesday();
  return (
    selectedDate.getFullYear() === thisWed.getFullYear() &&
    selectedDate.getMonth() === thisWed.getMonth() &&
    selectedDate.getDate() === thisWed.getDate()
  );
}

/** Pre-seed weekDateMap for a season */
export function buildInitialWeekDateMap(season?: SeasonConfig): Record<number, Date> {
  const cfg = season || DEFAULT_SEASON;
  const map: Record<number, Date> = {};
  for (let w = 1; w <= cfg.totalWeeks; w++) {
    const d = new Date(cfg.seasonStart);
    d.setDate(cfg.seasonStart.getDate() + (w - 1) * 7);
    map[w] = d;
  }
  return map;
}
