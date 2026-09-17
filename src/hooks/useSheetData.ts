import { useState, useEffect, useCallback, useRef } from 'react';
import type { Player, TeamData, WeekSchedule, StandingsEntry, TeamGame } from '@/lib/types';
import type { SeasonConfig } from '@/lib/constants';
import {
  buildInitialWeekDateMap, parseSheetDate, normStr, normTeam,
} from '@/lib/constants';
import {
  parseRosterCSV, parseTeamTab, applyHandicapSheet,
  parseScheduleCSV, parseStandingsCSV,
} from '@/lib/parsers';

export interface SheetState {
  loading: boolean;
  error: string | null;
  roster: Player[];
  allWeeks: WeekSchedule[];
  standings: StandingsEntry[];
  teamAvgMap: Record<string, number>;
  weekDateMap: Record<number, Date>;
}

export function useSheetData(selectedTeamName: string, season: SeasonConfig) {
  const [state, setState] = useState<SheetState>({
    loading: true,
    error: null,
    roster: [],
    allWeeks: [],
    standings: [],
    teamAvgMap: {},
    weekDateMap: buildInitialWeekDateMap(season),
  });

  const teamDataCache = useRef<Record<string, TeamData>>({});

  // Reset cache when season changes
  useEffect(() => {
    teamDataCache.current = {};
  }, [season.id]);

  const loadTeamData = useCallback(async (teamName: string): Promise<TeamData | null> => {
    if (teamDataCache.current[teamName]) return teamDataCache.current[teamName];
    const gid = season.teamGids[teamName];
    if (!gid) return null;
    try {
      const csv = await fetch(season.sheetBase + '&gid=' + gid).then(r => r.text());
      const data = parseTeamTab(csv);
      if (data) teamDataCache.current[teamName] = data;
      return data;
    } catch (e) {
      console.warn('Failed to load team data for', teamName, (e as Error).message);
      return null;
    }
  }, [season]);

  // Initial data load
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        // Build fetch list — core sheets
        const fetches: Promise<string>[] = [
          fetch(season.sheetUrls.schedule).then(r => { if (!r.ok) throw new Error('schedule'); return r.text(); }),
          fetch(season.sheetUrls.standings).then(r => r.ok ? r.text() : '').catch(() => ''),
          // Always fetch leaderboard for player data
          fetch(season.sheetUrls.leaderboard).then(r => r.ok ? r.text() : '').catch(() => ''),
        ];

        // Spring also has a separate handicap tab
        if (season.sheetUrls.handicap) {
          fetches.push(fetch(season.sheetUrls.handicap).then(r => r.ok ? r.text() : '').catch(() => ''));
        }

        const results = await Promise.all(fetches);
        if (cancelled) return;

        const [scheduleCSV, standingsCSV, leaderboardCSV] = results;
        const handicapCSV = season.sheetUrls.handicap ? results[3] || '' : '';

        // Build roster from leaderboard (works for both Spring and Fall)
        let roster: Player[] = [];
        if (leaderboardCSV) {
          roster = parseRosterCSV(leaderboardCSV);
          if (handicapCSV) {
            applyHandicapSheet(handicapCSV, roster);
          }
        }

        const { avgMap, entries: standings } = standingsCSV
          ? parseStandingsCSV(standingsCSV)
          : { avgMap: {}, entries: [] };

        const allWeeks = parseScheduleCSV(scheduleCSV);

        // Build week date map from schedule
        const weekDateMap = buildInitialWeekDateMap(season);
        allWeeks.forEach((week, idx) => {
          if (week.date) {
            const parsed = parseSheetDate(week.date);
            if (parsed) weekDateMap[idx + 1] = parsed;
          }
        });

        // Fetch ALL team tabs to get real handicaps
        const teamEntries = Object.entries(season.teamGids);
        const teamCSVs = await Promise.all(
          teamEntries.map(([, gid]) =>
            fetch(season.sheetBase + '&gid=' + gid).then(r => r.ok ? r.text() : '').catch(() => '')
          )
        );
        if (cancelled) return;

        // Parse each team tab and merge real handicaps into roster
        teamEntries.forEach(([teamName, ], idx) => {
          const csv = teamCSVs[idx];
          if (!csv) return;
          const teamData = parseTeamTab(csv);
          if (!teamData) return;
          teamDataCache.current[teamName] = teamData;

          teamData.players.forEach(tp => {
            const match = roster.find(p => p.name.toLowerCase() === tp.name.toLowerCase());
            if (match) {
              if (tp.handicap > 0) match.handicap = tp.handicap;
              if (tp.avg > 0) match.avg = tp.avg;
            } else if (tp.avg > 0) {
              roster.push({ name: tp.name, team: teamData.teamName, avg: tp.avg, handicap: tp.handicap });
            }
          });
        });

        // Refine week dates from selected team's tab data
        const selectedTeamData = teamDataCache.current[selectedTeamName];
        if (selectedTeamData) {
          selectedTeamData.weeks.forEach(w => {
            if (w.weekNum && w.date) {
              const parts = (w.date || '').split('/');
              if (parts.length >= 2) {
                const m = parseInt(parts[0]) - 1;
                const d = parseInt(parts[1]);
                if (!isNaN(m) && !isNaN(d)) {
                  const year = season.seasonStart.getFullYear();
                  weekDateMap[w.weekNum] = new Date(year, m, d);
                }
              }
            }
          });
        }

        // Add a "Substitute" player (handicap 56) to every team
        const teamsInRoster = new Set(roster.map(p => p.team));
        // Also include teams from the season config that might not have roster entries yet
        season.teamNames.forEach(t => teamsInRoster.add(t));
        teamsInRoster.forEach(team => {
          if (team) {
            roster.push({ name: 'Substitute', team, avg: 120, handicap: 56 });
          }
        });

        if (!cancelled) {
          setState({
            loading: false,
            error: null,
            roster,
            allWeeks,
            standings,
            teamAvgMap: avgMap,
            weekDateMap,
          });
        }
      } catch (err) {
        if (!cancelled) {
          console.warn('Google Sheets unavailable', (err as Error).message);
          setState(prev => ({
            ...prev,
            loading: false,
            error: (err as Error).message,
          }));
        }
      }
    }

    load();
    return () => { cancelled = true; };
  }, [selectedTeamName, season.id]);

  // Helper: look up team avg (case-insensitive)
  const lookupTeamAvg = useCallback((name: string): number => {
    if (state.teamAvgMap[name]) return state.teamAvgMap[name];
    const lower = normTeam(name);
    for (const [k, v] of Object.entries(state.teamAvgMap)) {
      if (normTeam(k) === lower) return v;
    }
    return 0;
  }, [state.teamAvgMap]);

  // Get games for a team in a given week's schedule
  const getTeamGames = useCallback((teamName: string, schedule: WeekSchedule): TeamGame[] => {
    const games: TeamGame[] = [];
    schedule.slots.forEach(slot => {
      slot.lanes.forEach(lane => {
        if (lane.home === teamName || lane.away === teamName) {
          const opponent = lane.home === teamName ? lane.away : lane.home;
          games.push({ time: slot.time, lane: lane.lane, opponent });
        }
      });
    });
    return games;
  }, []);

  return {
    ...state,
    loadTeamData,
    lookupTeamAvg,
    getTeamGames,
    teamDataCache: teamDataCache.current,
  };
}
