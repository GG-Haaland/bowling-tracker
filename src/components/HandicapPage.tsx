import { useState, useEffect } from 'react';
import type { Player, TeamData } from '@/lib/types';
import { TEAM_GIDS, normStr, normTeam } from '@/lib/constants';

interface HandicapPageProps {
  roster: Player[];
  selectedTeamName: string;
  loadTeamData: (name: string) => Promise<TeamData | null>;
  onBack: () => void;
}

interface HcpPlayer {
  name: string;
  avg: number;
  handicap: number;
}

export default function HandicapPage({ roster, selectedTeamName, loadTeamData, onBack }: HandicapPageProps) {
  const [teamName, setTeamName] = useState(selectedTeamName || '');
  const [players, setPlayers] = useState<HcpPlayer[]>([]);
  const [loading, setLoading] = useState(false);

  const teams = Object.keys(TEAM_GIDS).filter(t => !/ghost\s*team/i.test(t)).sort();

  useEffect(() => {
    if (!teamName) { setPlayers([]); return; }
    setLoading(true);

    loadTeamData(teamName).then(data => {
      let result: HcpPlayer[] = [];

      if (data?.players?.length) {
        result = data.players.filter(p => p.avg > 0).map(p => ({
          name: p.name,
          avg: Math.round(p.avg),
          handicap: Math.round(p.handicap),
        }));
      }

      // Supplement with roster players not in team tab
      const existing = new Set(result.map(p => normStr(p.name)));
      const rosterPlayers = roster
        .filter(p => normTeam(p.team) === normTeam(teamName) && p.avg > 0 && !existing.has(normStr(p.name)))
        .map(p => ({ name: p.name, avg: Math.round(p.avg), handicap: Math.round(p.handicap) }));
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
        <h1>HANDICAP SHEET</h1>
        <p>Select a team to view player handicaps</p>
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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', background: 'var(--medium-black)' }}>
              <div style={{ padding: '0.5em 0.7em', fontSize: '0.78em', fontWeight: 900, color: 'var(--smoke)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>PLAYER</div>
              <div style={{ padding: '0.5em 0.7em', fontSize: '0.78em', fontWeight: 900, color: 'var(--smoke)', letterSpacing: '0.1em', textTransform: 'uppercase', textAlign: 'center', minWidth: '3.5em' }}>AVG</div>
              <div style={{ padding: '0.5em 0.7em', fontSize: '0.78em', fontWeight: 900, color: 'var(--yellow)', letterSpacing: '0.1em', textTransform: 'uppercase', textAlign: 'center', minWidth: '3.5em' }}>HCP</div>
            </div>

            {/* Rows */}
            {players.map((p, i) => (
              <div key={p.name} style={{
                display: 'grid', gridTemplateColumns: '1fr auto auto',
                background: i % 2 === 0 ? 'var(--dark-black)' : 'rgba(37,37,47,0.5)',
                borderBottom: i < players.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none',
              }}>
                <div style={{ padding: '0.45em 0.7em', fontFamily: 'var(--font-body)', fontSize: '0.88em', color: 'var(--white-smoke)', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {p.name}
                </div>
                <div style={{ padding: '0.45em 0.7em', fontSize: '0.9em', color: 'var(--smoke)', fontWeight: 700, textAlign: 'center', minWidth: '3.5em' }}>
                  {p.avg}
                </div>
                <div style={{ padding: '0.45em 0.7em', fontSize: '0.9em', color: 'var(--green)', fontWeight: 900, textAlign: 'center', minWidth: '3.5em' }}>
                  {p.handicap}
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
