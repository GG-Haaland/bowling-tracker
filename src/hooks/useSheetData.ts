import { useState, useEffect, useCallback, useRef } from 'react';
import type { Player, TeamData, WeekSchedule, StandingsEntry, TeamGame } from '@/lib/types';
import {
  SHEET_BASE, SHEET_URLS, TEAM_GIDS, TOTAL_WEEKS,
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

export function useSheetData(selectedTeamName: string) {
  const [state, setState] = useState<SheetState>({
    loading: true,
    error: null,
    roster: [],
    allWeeks: [],
    standings: [],
    teamAvgMap: {},
    weekDateMap: buildInitialWeekDateMap(),
  });

  const teamDataCache = useRef<Record<string, TeamData>>({});

  const loadTeamData = useCallback(async (teamName: string): Promise<TeamData | null> => {
    if (teamDataCache.current[teamName]) return teamDataCache.current[teamName];
    const gid = TEAM_GIDS[teamName];
    if (!gid) return null;
    try {
      const csv = await fetch(SHEET_BASE + '&gid=' + gid).then(r => r.text());
      const data = parseTeamTab(csv);
      if (data) teamDataCache.current[teamName] = data;
      return data;
    } catch (e) {
      console.warn('Failed to load team data for', teamName, (e as Error).message);
      return null;
    }
  }, []);

  // Initial data load
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const defaultTeamGid = TEAM_GIDS[selectedTeamName] || TEAM_GIDS['Gutter & Sons'];

        const [rosterCSV, handicapCSV, scheduleCSV, standingsCSV, defaultTeamCSV] = await Promise.all([
          fetch(SHEET_URLS.roster).then(r   => { if (!r.ok) throw new Error('roster');   return r.text(); }),
          fetch(SHEET_URLS.handicap).then(r => { if (!r.ok) throw new Error('handicap'); return r.text(); }),
          fetch(SHEET_URLS.schedule).then(r => { if (!r.ok) throw new Error('schedule'); return r.text(); }),
          fetch(SHEET_URLS.standings).then(r => r.ok ? r.text() : '').catch(() => ''),
          fetch(SHEET_BASE + '&gid=' + defaultTeamGid).then(r => r.ok ? r.text() : '').catch(() => ''),
        ]);

        if (cancelled) return;

        const roster = parseRosterCSV(rosterCSV);
        applyHandicapSheet(handicapCSV, roster);

        const { avgMap, entries: standings } = standingsCSV
          ? parseStandingsCSV(standingsCSV)
          : { avgMap: {}, entries: [] };

        const allWeeks = parseScheduleCSV(scheduleCSV);

        // Build week date map from schedule
        const weekDateMap = buildInitialWeekDateMap();
        allWeeks.forEach((week, idx) => {
          if (week.date) {
            const parsed = parseSheetDate(week.date);
            if (parsed) weekDateMap[idx + 1] = parsed;
          }
        });

        // Parse default team data
        if (defaultTeamCSV) {
          const teamData = parseTeamTab(defaultTeamCSV);
          if (teamData) {
            teamDataCache.current[selectedTeamName] = teamData;
            // Apply team tab data to roster
            teamData.players.forEach(tp => {
              const match = roster.find(p => p.name.toLowerCase() === tp.name.toLowerCase());
              if (match) {
                if (tp.handicap > 0) match.handicap = tp.handicap;
                if (tp.avg > 0) match.avg = tp.avg;
              } else if (tp.avg > 0) {
                roster.push({ name: tp.name, team: teamData.teamName, avg: tp.avg, handicap: tp.handicap });
              }
            });
            // Refine dates from team tab
            teamData.weeks.forEach(w => {
              if (w.weekNum && w.date) {
                const parts = (w.date || '').split('/');
                if (parts.length >= 2) {
                  const m = parseInt(parts[0]) - 1;
                  const d = parseInt(parts[1]);
                  if (!isNaN(m) && !isNaN(d)) {
                    weekDateMap[w.weekNum] = new Date(new Date().getFullYear(), m, d);
                  }
                }
              }
            });
          }
        }

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
  }, [selectedTeamName]);

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
