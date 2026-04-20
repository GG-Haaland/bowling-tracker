import { useState, useEffect } from 'react';
import type { PlayoffTeam, PlayoffPlayer } from '@/lib/types';
import { PLAYOFF_SHEET_URLS, SHEET_URLS } from '@/lib/constants';
import { parsePlayoffCSV, parseRosterCSV, applyHandicapSheet } from '@/lib/parsers';

export interface PlayoffDataState {
  loading: boolean;
  error: string | null;
  teams: PlayoffTeam[];
}

/**
 * Fetches playoff handicap data from the playoff sheet and
 * merges averages from the main roster sheet.
 */
export function usePlayoffData() {
  const [state, setState] = useState<PlayoffDataState>({
    loading: true,
    error: null,
    teams: [],
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [playoffCSV, rosterCSV, handicapCSV] = await Promise.all([
          fetch(PLAYOFF_SHEET_URLS.standings).then(r => {
            if (!r.ok) throw new Error('playoff sheet');
            return r.text();
          }),
          fetch(SHEET_URLS.roster).then(r => {
            if (!r.ok) throw new Error('roster');
            return r.text();
          }),
          fetch(SHEET_URLS.handicap).then(r => {
            if (!r.ok) throw new Error('handicap');
            return r.text();
          }),
        ]);

        if (cancelled) return;

        // Parse main roster for averages
        const roster = parseRosterCSV(rosterCSV);
        applyHandicapSheet(handicapCSV, roster);

        // Build a lookup: lowercase name → avg
        const avgLookup: Record<string, number> = {};
        roster.forEach(p => {
          avgLookup[p.name.toLowerCase().trim()] = p.avg;
        });

        // Parse playoff data
        const rawTeams = parsePlayoffCSV(playoffCSV);

        // Merge averages into playoff players
        const teams: PlayoffTeam[] = rawTeams.map(rt => ({
          name: rt.name,
          seed: rt.seed,
          players: rt.players.map(rp => {
            const avg = avgLookup[rp.name.toLowerCase().trim()] || 0;
            return {
              name: rp.name,
              team: rt.name,
              handicap: rp.handicap,
              avg,
            } as PlayoffPlayer;
          }),
        }));

        if (!cancelled) {
          setState({ loading: false, error: null, teams });
        }
      } catch (err) {
        if (!cancelled) {
          console.warn('Playoff data load failed', (err as Error).message);
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
  }, []);

  return state;
}
