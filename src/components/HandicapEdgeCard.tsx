import type { Player } from '@/lib/types';

interface HandicapEdgeCardProps {
  selectedPlayersA: string[];
  selectedPlayersB: string[];
  teamAName: string;
  teamBName: string;
  roster: Player[];
}

export default function HandicapEdgeCard({
  selectedPlayersA,
  selectedPlayersB,
  teamAName,
  teamBName,
  roster,
}: HandicapEdgeCardProps) {
  const playersA = selectedPlayersA
    .map(n => roster.find(p => p.name === n))
    .filter(Boolean) as Player[];
  const playersB = selectedPlayersB
    .map(n => roster.find(p => p.name === n))
    .filter(Boolean) as Player[];

  const hcpA = playersA.reduce((s, p) => s + (p.handicap || 0), 0);
  const hcpB = playersB.reduce((s, p) => s + (p.handicap || 0), 0);

  const hasPlayers = playersA.length > 0 || playersB.length > 0;
  const diff = Math.abs(hcpA - hcpB);
  const favored = hcpA >= hcpB ? (teamAName || 'TEAM A') : (teamBName || 'TEAM B');
  const isTeamA = hcpA >= hcpB;
  const favoredColor = isTeamA ? 'var(--red)' : 'var(--light-blue)';
  const glowRgb = isTeamA ? '231,42,110' : '83,108,187';

  return (
    <div className="card">
      <div className="card__container">
        <div className="card-titlebar">
          <span className="card-titlebar__text">HANDICAP EDGE</span>
        </div>
        <div className="hcp-edge-wrap">
          <div className="hcp-edge-label-sm">TEAM WITH EDGE</div>
          <div
            className="hcp-edge-team-name"
            style={
              hasPlayers
                ? {
                    color: favoredColor,
                    textShadow: `0 0 18px rgba(${glowRgb},0.7), 0 0 40px rgba(${glowRgb},0.3)`,
                  }
                : undefined
            }
          >
            {hasPlayers ? favored.toUpperCase() : '—'}
          </div>
          <div className="hcp-edge-divider" />
          <div className="hcp-edge-label-sm">PINS</div>
          <div
            id="hcp-diff-number"
            style={
              hasPlayers
                ? {
                    color: favoredColor,
                    textShadow: `0 0 10px rgba(${glowRgb},0.9), 0 0 30px rgba(${glowRgb},0.6), 0 0 70px rgba(${glowRgb},0.3)`,
                  }
                : undefined
            }
          >
            {hasPlayers ? (diff > 0 ? `+${diff}` : '0') : '—'}
          </div>
          <div className="hcp-edge-pins-label">
            {hasPlayers ? (diff === 0 ? 'EVEN MATCH' : 'PIN ADVANTAGE') : ''}
          </div>
        </div>

        {/* Per-player breakdown */}
        {hasPlayers && (
          <div style={{ fontSize: '0.8em', padding: '0 0.2em 0.6em', maxHeight: '150px', overflowY: 'auto' }}>
            {[
              ...playersA.map(p => ({ ...p, side: 'a' as const })),
              ...playersB.map(p => ({ ...p, side: 'b' as const })),
            ].map(p => (
              <div
                key={p.name}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.35em 0.5em',
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                }}
              >
                <span style={{ fontSize: '0.8em', color: p.side === 'a' ? 'var(--red)' : 'var(--light-blue)' }}>
                  {p.name}
                </span>
                <span style={{ fontSize: '0.8em', color: 'var(--yellow)', fontWeight: 900 }}>
                  +{p.handicap || 0}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
