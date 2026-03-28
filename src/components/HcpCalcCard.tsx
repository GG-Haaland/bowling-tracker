import type { Player } from '@/lib/types';

interface HcpCalcCardProps {
  selectedPlayersA: string[];
  selectedPlayersB: string[];
  teamAName: string;
  teamBName: string;
  roster: Player[];
}

export default function HcpCalcCard({ selectedPlayersA, selectedPlayersB, teamAName, teamBName, roster }: HcpCalcCardProps) {
  if (selectedPlayersA.length === 0 && selectedPlayersB.length === 0) {
    return (
      <div className="card">
        <div className="card__container">
          <div className="card-titlebar">
            <span className="card-titlebar__text">HCP CALCULATOR</span>
          </div>
          <div style={{ textAlign: 'center', color: 'var(--soft-black)', fontSize: '0.8em', padding: '1.5em 0', fontFamily: 'var(--font-body)', fontWeight: 400 }}>
            Select players from the team rosters to calculate
          </div>
        </div>
      </div>
    );
  }

  const getPlayers = (names: string[]) => names.map(n => roster.find(p => p.name === n)).filter(Boolean) as Player[];
  const playersA = getPlayers(selectedPlayersA);
  const playersB = getPlayers(selectedPlayersB);

  const projA = playersA.reduce((s, p) => s + p.avg + p.handicap, 0);
  const projB = playersB.reduce((s, p) => s + p.avg + p.handicap, 0);

  return (
    <div className="card">
      <div className="card__container">
        <div className="card-titlebar">
          <span className="card-titlebar__text">HCP CALCULATOR</span>
        </div>

        <div style={{ padding: '0.2em 0' }}>
          <TeamBlock players={playersA} teamName={teamAName} accentColor="var(--red)" label="TEAM A" />
          <TeamBlock players={playersB} teamName={teamBName} accentColor="var(--light-blue)" label="TEAM B" />

          {playersA.length > 0 && playersB.length > 0 && (
            <EdgeDisplay projA={projA} projB={projB} teamAName={teamAName} teamBName={teamBName} />
          )}
        </div>
      </div>
    </div>
  );
}

function TeamBlock({ players, teamName, accentColor, label }: { players: Player[]; teamName: string; accentColor: string; label: string }) {
  if (players.length === 0) return null;

  const totalAvg = players.reduce((s, p) => s + p.avg, 0);
  const totalHcp = players.reduce((s, p) => s + p.handicap, 0);
  const totalProj = totalAvg + totalHcp;

  return (
    <div style={{ marginBottom: '0.9em' }}>
      <div style={{ fontSize: '0.78em', fontWeight: 900, letterSpacing: '0.1em', color: accentColor, marginBottom: '0.5em', padding: '0 0.2em' }}>
        {teamName ? teamName.toUpperCase() : label}
      </div>

      {players.map(p => (
        <div key={p.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.4em 0.6em', borderRadius: '0.3em', background: 'var(--dark-black)', marginBottom: '0.25em' }}>
          <span style={{ fontSize: '0.85em', color: 'var(--white-smoke)', fontWeight: 700, flex: 1 }}>{p.name}</span>
          <span style={{ fontSize: '0.78em', color: 'var(--smoke)', marginRight: '1em' }}>
            AVG&nbsp;<strong style={{ color: 'var(--white-smoke)' }}>{Math.round(p.avg)}</strong>
          </span>
          <span style={{ fontSize: '0.78em', color: 'var(--yellow)', fontWeight: 900 }}>+{p.handicap}</span>
        </div>
      ))}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.45em 0.6em', borderRadius: '0.3em', background: 'rgba(0,0,0,0.3)', borderTop: '1px solid var(--soft-black)', marginTop: '0.3em' }}>
        <span style={{ fontSize: '0.75em', letterSpacing: '0.08em', color: 'var(--smoke)' }}>TOTAL</span>
        <div style={{ display: 'flex', gap: '1.2em', alignItems: 'center' }}>
          <span style={{ fontSize: '0.78em', color: 'var(--smoke)' }}>RAW&nbsp;<strong style={{ color: 'var(--white-smoke)' }}>{Math.round(totalAvg)}</strong></span>
          <span style={{ fontSize: '0.78em', color: 'var(--yellow)' }}>HCP&nbsp;<strong>+{totalHcp}</strong></span>
          <span style={{ fontSize: '0.9em', fontWeight: 900, color: accentColor }}>{Math.round(totalProj)}</span>
        </div>
      </div>
    </div>
  );
}

function EdgeDisplay({ projA, projB, teamAName, teamBName }: { projA: number; projB: number; teamAName: string; teamBName: string }) {
  const diff = Math.abs(projA - projB);
  const leader = projA > projB ? (teamAName || 'TEAM A') : (teamBName || 'TEAM B');
  const leaderColor = projA > projB ? 'var(--red)' : 'var(--light-blue)';

  return (
    <div style={{ textAlign: 'center', padding: '0.6em', borderRadius: '0.4em', background: 'rgba(0,0,0,0.25)', border: '1px solid var(--soft-black)' }}>
      <div style={{ fontSize: '0.7em', letterSpacing: '0.1em', color: 'var(--smoke)', marginBottom: '0.3em' }}>PROJECTED EDGE</div>
      <div style={{ fontSize: '1.1em', fontWeight: 900, color: leaderColor }}>{leader.toUpperCase()} +{diff}</div>
    </div>
  );
}
