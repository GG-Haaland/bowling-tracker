// ── Core data types for the bowling league tracker ──

export interface Player {
  name: string;
  team: string;
  avg: number;
  handicap: number;
}

export interface TeamPlayer {
  name: string;
  avg: number;
  handicap: number;
  high: number;
  stdDev: number;
  gamesPlayed: number;
  prevAvg: number;
}

export interface GameRow {
  weekNum: number;
  date: string;
  time: string;
  lane: string;
  opponent: string;
  scores: Record<string, number | null>;
  wlt: string;
}

export interface TeamData {
  teamName: string;
  players: TeamPlayer[];
  weeks: GameRow[];
}

export interface TimeSlot {
  time: string;
  lanes: { lane: string; home: string; away: string }[];
}

export interface WeekSchedule {
  week: string;
  date: string;
  slots: TimeSlot[];
}

export interface ScheduleData {
  week: string;
  date: string;
  slots: TimeSlot[];
}

export interface TeamGame {
  time: string;
  lane: string;
  opponent: string;
}

export interface TopScore {
  name: string;
  team: string;
  score: number;
}

export interface StandingsEntry {
  place: number;
  team: string;
  winPct: number;
  wins: number;
  losses: number;
  ties: number;
  gamesPlayed: number;
  avg: number;
  stdDev: number;
  total: number;
  playoffEligible: string;
}
