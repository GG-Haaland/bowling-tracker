import { useState, useEffect } from 'react';
import type { Player, TeamData } from '@/lib/types';
import { TEAM_GIDS, normStr, normTeam } from '@/lib/constants';

interface HandicapPageProps {
  roster: Player[];
  selectedTeamName: string;
  loadTeamData: (name: string) => Promise<TeamData | null>;
  onBack: () => void;
  teamNames?: string[];
}

interface HcpPlayer {
  name: string;
  avg: number;
  handicap: number;
  wins: number;
  losses: number;
  ties: number;
  winPct: number | null;
}

export default function HandicapPage({ roster, selectedTeamName, loadTeamData, onBack, teamNames }: HandicapPageProps) {
  const [teamName, setTeamName] = useState(selectedTeamName || '');
  const [players, setPlayers] = useState<HcpPlayer[]>([]);
  const [loading, setLoading] = useState(false);

  const teams = (teamNames || Object.keys(TEAM_GIDS)).filter(t => !/ghost\s*team/i.test(t)).sort();

  useEffect(() => {
    if (!teamName) { setPlayers([]); return; }
    setLoading(true);

    loadTeamData(teamName).then(data => {
      // Calculate individual W/L/T from game rows
      const playerWLT: Record<string, { w: number; l: number; t: number }> = {};
      if (data?.weeks) {
        data.weeks.forEach(row => {
          if (!row.wlt) return;
          const isW = row.wlt.toUpperCase() === 'W';
          const isL = row.wlt.toUpperCase() === 'L';
          const isT = row.wlt.toUpperCase() === 'T';
          Object.entries(row.scores).forEach(([name, score]) => {
            if (score == null) return;
            if (!playerWLT[name]) playerWLT[name] = { w: 0, l: 0, t: 0 };
            if (isW) playerWLT[name].w++;
            else if (isL) playerWLT[name].l++;
            else if (isT) playerWLT[name].t++;
          });
        });
      }

      const getWLT = (name: string) => {
        // Try exact match first, then case-insensitive
        const key = Object.keys(playerWLT).find(k => k === name)
          || Object.keys(playerWLT).find(k => normStr(k) === normStr(name));
        return key ? playerWLT[key] : null;
      };

      let result: HcpPlayer[] = [];

      if (data?.players?.length) {
        result = data.players.filter(p => p.avg > 0).map(p => {
          const wlt = getWLT(p.name);
          const total = wlt ? wlt.w + wlt.l + wlt.t : 0;
          return {
            name: p.name,
            avg: Math.round(p.avg),
            handicap: Math.round(p.handicap),
            wins: wlt?.w ?? 0,
            losses: wlt?.l ?? 0,
            ties: wlt?.t ?? 0,
            winPct: total > 0 ? wlt!.w / total : null,
          };
        });
      }

      // Supplement with roster players not in team tab
      const existing = new Set(result.map(p => normStr(p.name)));
      const rosterPlayers = roster
        .filter(p => normTeam(p.team) === normTeam(teamName) && p.avg > 0 && !existing.has(normStr(p.name)))
        .map(p => ({ name: p.name, avg: Math.round(p.avg), handicap: Math.round(p.handicap), wins: 0, losses: 0, ties: 0, winPct: null as number | null }));
      result = [...result, ...rosterPlayers];
      result.sort((a, b) => b.handicap - a.handicap);

      setPlayers(result);
      setLoading(false);
    }).catch(() => {
      setPlayers([]);
      setLoading(false);
    });
  }, [teamName, roster, loadTeamData]);

  return (
    <div className="handicap-page dot-bg">
      <button className="back-btn" onClick={onBack}>&#9664; BACK</button>

      <div className="title">
        <h1>TEAMS / HANDICAP</h1>
        <p>Select a team to view players</p>
      </div>

      <select value={teamName} onChange={e => setTeamName(e.target.value)}>
        <option value="">— SELECT TEAM —</option>
        {teams.map(t => <option key={t} value={t}>{t}</option>)}
      </select>

      {!teamName ? (
        <div style={{ color: 'var(--soft-black)', fontSize: '0.85em', textAlign: 'center', padding: '2em 0', fontFamily: 'var(--font-body)' }}>
          Choose a team above
        </div>
      ) : loading ? (
        <div style={{ color: 'var(--soft-black)', fontSize: '0.85em', textAlign: 'center', padding: '2em 0', fontFamily: 'var(--font-body)' }}>
          Loading...
        </div>
      ) : players.length === 0 ? (
        <div style={{ color: 'var(--soft-black)', fontSize: '0.85em', textAlign: 'center', padding: '2em 0', fontFamily: 'var(--font-body)' }}>
          No player data available for this team
        </div>
      ) : (
        <>
          <div style={{ border: '1px solid var(--soft-black)', borderRadius: '0.4em', overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto auto', background: 'var(--medium-black)' }}>
              <div style={{ padding: '0.5em 0.7em', fontSize: '0.72em', fontWeight: 900, color: 'var(--smoke)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>PLAYER</div>
              <div style={{ padding: '0.5em 0.5em', fontSize: '0.72em', fontWeight: 900, color: 'var(--smoke)', letterSpacing: '0.08em', textTransform: 'uppercase', textAlign: 'center', minWidth: '2.8em' }}>AVG</div>
              <div style={{ padding: '0.5em 0.5em', fontSize: '0.72em', fontWeight: 900, color: 'var(--yellow)', letterSpacing: '0.08em', textTransform: 'uppercase', textAlign: 'center', minWidth: '2.8em' }}>HCP</div>
              <div style={{ padding: '0.5em 0.5em', fontSize: '0.72em', fontWeight: 900, color: 'var(--smoke)', letterSpacing: '0.08em', textTransform: 'uppercase', textAlign: 'center', minWidth: '3.2em' }}>W-L</div>
              <div style={{ padding: '0.5em 0.5em', fontSize: '0.72em', fontWeight: 900, color: 'var(--light-blue)', letterSpacing: '0.08em', textTransform: 'uppercase', textAlign: 'center', minWidth: '2.8em' }}>W%</div>
            </div>

            {/* Rows */}
            {players.map((p, i) => (
              <div key={p.name} style={{
                display: 'grid', gridTemplateColumns: '1fr auto auto auto auto',
                background: i % 2 === 0 ? 'var(--dark-black)' : '#25252f',
                borderBottom: i < players.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none',
              }}>
                <div style={{ padding: '0.45em 0.7em', fontFamily: 'var(--font-body)', fontSize: '0.85em', color: 'var(--white-smoke)', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {p.name}
                </div>
                <div style={{ padding: '0.45em 0.5em', fontSize: '0.85em', color: 'var(--smoke)', fontWeight: 700, textAlign: 'center', minWidth: '2.8em' }}>
                  {p.avg}
                </div>
                <div style={{ padding: '0.45em 0.5em', fontSize: '0.85em', color: 'var(--green)', fontWeight: 900, textAlign: 'center', minWidth: '2.8em' }}>
                  {p.handicap}
                </div>
                <div style={{ padding: '0.45em 0.5em', fontSize: '0.85em', color: 'var(--smoke)', fontWeight: 700, textAlign: 'center', minWidth: '3.2em' }}>
                  {p.wins + p.losses + p.ties > 0 ? p.wins + '-' + p.losses + (p.ties > 0 ? '-' + p.ties : '') : '—'}
                </div>
                <div style={{
                  padding: '0.45em 0.5em', fontSize: '0.85em', fontWeight: 900, textAlign: 'center', minWidth: '2.8em',
                  color: p.winPct != null ? (p.winPct >= 0.5 ? 'var(--green)' : 'var(--red)') : 'var(--soft-black)',
                }}>
                  {p.winPct != null ? (p.winPct * 100).toFixed(0) + '%' : '—'}
                </div>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: '0.6em', fontSize: '0.72em', color: 'var(--soft-black)', fontFamily: 'var(--font-body)' }}>
            Handicap = 70% × (200 − Avg)
          </div>
        </>
      )}
    </div>
  );
}
