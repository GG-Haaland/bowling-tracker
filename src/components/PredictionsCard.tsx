import type { Player } from '@/lib/types';

interface PredictionsCardProps {
  selectedPlayersA: string[];
  selectedPlayersB: string[];
  teamAName: string;
  teamBName: string;
  roster: Player[];
}

export default function PredictionsCard({
  selectedPlayersA,
  selectedPlayersB,
  teamAName,
  teamBName,
  roster,
}: PredictionsCardProps) {
  const getPlayers = (names: string[]) =>
    names.map(n => roster.find(p => p.name === n)).filter(Boolean) as Player[];

  const playersA = getPlayers(selectedPlayersA);
  const playersB = getPlayers(selectedPlayersB);

  if (playersA.length === 0 && playersB.length === 0) {
    return (
      <div className="card">
        <div className="card__container">
          <div className="card-titlebar">
            <span className="card-titlebar__text">PREDICTIONS</span>
          </div>
          <div style={{
            textAlign: 'center', color: 'var(--soft-black)', fontSize: '0.8em',
            padding: '1.5em 0', fontFamily: 'var(--font-body)', fontWeight: 400
          }}>
            Select players from the team rosters to see predictions
          </div>
        </div>
      </div>
    );
  }

  const projA = playersA.reduce((s, p) => s + p.avg + p.handicap, 0);
  const projB = playersB.reduce((s, p) => s + p.avg + p.handicap, 0);
  const bothSelected = playersA.length > 0 && playersB.length > 0;
  const diff = Math.round(Math.abs(projA - projB));
  const favored = projA > projB ? (teamAName || 'TEAM A') : (teamBName || 'TEAM B');
  const favoredColor = projA > projB ? 'var(--red)' : 'var(--light-blue)';
  const underdog = projA > projB ? (teamBName || 'TEAM B') : (teamAName || 'TEAM A');

  // Calculate what the underdog needs to average per bowler to win
  const underdogPlayers = projA > projB ? playersB : playersA;
  const favoredProj = Math.max(projA, projB);
  const underdogHcp = underdogPlayers.reduce((s, p) => s + p.handicap, 0);
  const neededTotal = favoredProj - underdogHcp + 1; // need to beat, not tie
  const neededPerBowler = underdogPlayers.length > 0 ? Math.ceil(neededTotal / underdogPlayers.length) : 0;

  return (
    <div className="card">
      <div className="card__container">
        <div className="card-titlebar">
          <span className="card-titlebar__text">PREDICTIONS</span>
        </div>

        <div style={{ padding: '0.2em 0' }}>
          {/* Team A projected */}
          {playersA.length > 0 && (
            <TeamProjection
              players={playersA}
              teamName={teamAName}
              accentColor="var(--red)"
              label="TEAM A"
            />
          )}

          {/* Team B projected */}
          {playersB.length > 0 && (
            <TeamProjection
              players={playersB}
              teamName={teamBName}
              accentColor="var(--light-blue)"
              label="TEAM B"
            />
          )}

          {/* Prediction summary */}
          {bothSelected && (
            <div style={{
              textAlign: 'center', padding: '0.7em', borderRadius: '0.4em',
              background: 'rgba(0,0,0,0.25)', border: '1px solid var(--soft-black)',
            }}>
              <div style={{ fontSize: '0.68em', letterSpacing: '0.1em', color: 'var(--smoke)', marginBottom: '0.35em' }}>
                FAVORED TO WIN
              </div>
              <div style={{ fontSize: '1.05em', fontWeight: 900, color: favoredColor, marginBottom: '0.3em' }}>
                {favored.toUpperCase()} by {diff} pins
              </div>
              {diff > 0 && neededPerBowler > 0 && (
                <div style={{ fontSize: '0.7em', color: 'var(--smoke)', fontStyle: 'italic' }}>
                  {underdog} needs to average {neededPerBowler} per bowler to win
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TeamProjection({ players, teamName, accentColor, label }: {
  players: Player[]; teamName: string; accentColor: string; label: string;
}) {
  const totalAvg = players.reduce((s, p) => s + p.avg, 0);
  const totalHcp = players.reduce((s, p) => s + p.handicap, 0);
  const totalProj = totalAvg + totalHcp;

  return (
    <div style={{ marginBottom: '0.7em' }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '0.5em 0.6em', borderRadius: '0.3em',
        background: 'rgba(0,0,0,0.3)', border: '1px solid var(--soft-black)',
      }}>
        <span style={{ fontSize: '0.78em', fontWeight: 900, letterSpacing: '0.08em', color: accentColor }}>
          {teamName ? teamName.toUpperCase() : label}
        </span>
        <div style={{ display: 'flex', gap: '0.8em', alignItems: 'center' }}>
          <span style={{ fontSize: '0.72em', color: 'var(--smoke)' }}>
            RAW <strong style={{ color: 'var(--white-smoke)' }}>{Math.round(totalAvg)}</strong>
          </span>
          <span style={{ fontSize: '0.72em', color: 'var(--yellow)' }}>
            HCP <strong>+{totalHcp}</strong>
          </span>
          <span style={{ fontSize: '0.95em', fontWeight: 900, color: accentColor }}>
            {Math.round(totalProj)}
          </span>
        </div>
      </div>
    </div>
  );
}
