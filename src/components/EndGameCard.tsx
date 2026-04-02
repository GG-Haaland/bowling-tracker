import { useState, useCallback } from 'react';
import type { Player } from '@/lib/types';

interface EndGameCardProps {
  selectedPlayersA: string[];
  selectedPlayersB: string[];
  teamAName: string;
  teamBName: string;
  roster: Player[];
}

export default function EndGameCard({
  selectedPlayersA,
  selectedPlayersB,
  teamAName,
  teamBName,
  roster,
}: EndGameCardProps) {
  const [scores, setScores] = useState<Record<string, number | null>>({});

  const setScore = useCallback((name: string, val: string) => {
    const parsed = val === '' || isNaN(Number(val)) ? null : Math.max(0, Math.min(300, Math.round(Number(val))));
    setScores(prev => ({ ...prev, [name]: parsed }));
  }, []);

  const getPlayers = (names: string[]) =>
    names.map(n => roster.find(p => p.name === n)).filter(Boolean) as Player[];

  const playersA = getPlayers(selectedPlayersA);
  const playersB = getPlayers(selectedPlayersB);

  if (playersA.length === 0 && playersB.length === 0) {
    return (
      <div className="card">
        <div className="card__container">
          <div className="card-titlebar">
            <span className="card-titlebar__text">END GAME</span>
          </div>
          <div style={{
            textAlign: 'center', color: 'var(--soft-black)', fontSize: '0.8em',
            padding: '1.5em 0', fontFamily: 'var(--font-body)', fontWeight: 400,
          }}>
            Select players from the team rosters to score
          </div>
        </div>
      </div>
    );
  }

  const teamScore = (players: Player[]) => {
    let rawTotal = 0;
    let hcpTotal = 0;
    let allFilled = true;
    for (const p of players) {
      const s = scores[p.name];
      if (s === null || s === undefined) { allFilled = false; continue; }
      rawTotal += s;
      hcpTotal += s + p.handicap;
    }
    return { rawTotal, hcpTotal, allFilled: allFilled && players.length > 0 };
  };

  const teamAScore = teamScore(playersA);
  const teamBScore = teamScore(playersB);
  const bothComplete = teamAScore.allFilled && teamBScore.allFilled && playersA.length > 0 && playersB.length > 0;

  return (
    <div className="card">
      <div className="card__container">
        <div className="card-titlebar">
          <span className="card-titlebar__text">END GAME</span>
        </div>

        <div style={{ padding: '0.2em 0' }}>
          {playersA.length > 0 && (
            <TeamScoreBlock
              players={playersA}
              teamName={teamAName}
              accentColor="var(--red)"
              label="TEAM A"
              scores={scores}
              onSetScore={setScore}
              teamTotal={teamAScore}
            />
          )}

          {playersB.length > 0 && (
            <TeamScoreBlock
              players={playersB}
              teamName={teamBName}
              accentColor="var(--light-blue)"
              label="TEAM B"
              scores={scores}
              onSetScore={setScore}
              teamTotal={teamBScore}
            />
          )}

          {bothComplete && (
            <WinnerDisplay
              teamAScore={teamAScore.hcpTotal}
              teamBScore={teamBScore.hcpTotal}
              teamAName={teamAName}
              teamBName={teamBName}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function TeamScoreBlock({ players, teamName, accentColor, label, scores, onSetScore, teamTotal }: {
  players: Player[];
  teamName: string;
  accentColor: string;
  label: string;
  scores: Record<string, number | null>;
  onSetScore: (name: string, val: string) => void;
  teamTotal: { rawTotal: number; hcpTotal: number; allFilled: boolean };
}) {
  return (
    <div style={{ marginBottom: '0.9em' }}>
      <div style={{
        fontSize: '0.78em', fontWeight: 900, letterSpacing: '0.1em',
        color: accentColor, marginBottom: '0.5em', padding: '0 0.2em',
      }}>
        {teamName ? teamName.toUpperCase() : label}
      </div>

      {players.map(p => {
        const s = scores[p.name];
        const withHcp = s !== null && s !== undefined ? s + p.handicap : null;

        return (
          <div key={p.name} style={{
            display: 'flex', alignItems: 'center', gap: '0.5em',
            padding: '0.45em 0.6em', borderRadius: '0.3em',
            background: 'var(--dark-black)', marginBottom: '0.25em',
          }}>
            <span style={{
              fontSize: '0.85em', color: 'var(--white-smoke)',
              fontWeight: 700, flex: 1, minWidth: 0,
            }}>
              {p.name}
            </span>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3em' }}>
              <span style={{ fontSize: '0.7em', color: 'var(--smoke)', letterSpacing: '0.05em' }}>SCORE</span>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                max={300}
                value={s !== null && s !== undefined ? s : ''}
                onChange={e => onSetScore(p.name, e.target.value)}
                style={{
                  width: '3.5em',
                  background: 'var(--soft-black)',
                  border: '1px solid var(--medium-black)',
                  color: 'var(--yellow)',
                  padding: '0.35em 0.3em',
                  borderRadius: '0.2em',
                  fontWeight: 700,
                  fontSize: '0.9em',
                  textAlign: 'center',
                  outline: 'none',
                  fontFamily: 'inherit',
                }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.2em', minWidth: '4.5em', justifyContent: 'flex-end' }}>
              <span style={{ fontSize: '0.7em', color: 'var(--smoke)' }}>+{p.handicap}</span>
              <span style={{ fontSize: '0.7em', color: 'var(--smoke)', margin: '0 0.15em' }}>=</span>
              <span style={{
                fontSize: '0.95em', fontWeight: 900,
                color: withHcp !== null ? 'var(--yellow)' : 'var(--soft-black)',
              }}>
                {withHcp !== null ? withHcp : '—'}
              </span>
            </div>
          </div>
        );
      })}

      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '0.45em 0.6em', borderRadius: '0.3em',
        background: 'rgba(0,0,0,0.3)', borderTop: '1px solid var(--soft-black)',
        marginTop: '0.3em',
      }}>
        <span style={{ fontSize: '0.75em', letterSpacing: '0.08em', color: 'var(--smoke)' }}>TOTAL</span>
        <div style={{ display: 'flex', gap: '1em', alignItems: 'center' }}>
          <span style={{ fontSize: '0.78em', color: 'var(--smoke)' }}>
            RAW&nbsp;<strong style={{ color: 'var(--white-smoke)' }}>{teamTotal.rawTotal}</strong>
          </span>
          <span style={{ fontSize: '0.95em', fontWeight: 900, color: accentColor }}>
            {teamTotal.allFilled ? teamTotal.hcpTotal : '—'}
          </span>
        </div>
      </div>
    </div>
  );
}

function WinnerDisplay({ teamAScore, teamBScore, teamAName, teamBName }: {
  teamAScore: number;
  teamBScore: number;
  teamAName: string;
  teamBName: string;
}) {
  const diff = Math.abs(teamAScore - teamBScore);
  const isTie = diff === 0;
  const winner = teamAScore > teamBScore ? (teamAName || 'TEAM A') : (teamBName || 'TEAM B');
  const winnerColor = teamAScore > teamBScore ? 'var(--red)' : 'var(--light-blue)';

  return (
    <div style={{
      textAlign: 'center', padding: '0.7em', borderRadius: '0.4em',
      background: 'rgba(0,0,0,0.25)', border: '1px solid var(--soft-black)',
    }}>
      <div style={{
        fontSize: '0.7em', letterSpacing: '0.1em', color: 'var(--smoke)',
        marginBottom: '0.3em',
      }}>
        WINNER
      </div>
      {isTie ? (
        <div style={{ fontSize: '1.1em', fontWeight: 900, color: 'var(--yellow)' }}>
          TIE GAME!
        </div>
      ) : (
        <div style={{ fontSize: '1.1em', fontWeight: 900, color: winnerColor }}>
          {winner.toUpperCase()} +{diff}
        </div>
      )}
      <div style={{
        display: 'flex', justifyContent: 'center', gap: '2em',
        marginTop: '0.4em', fontSize: '0.8em',
      }}>
        <span style={{ color: 'var(--red)', fontWeight: 700 }}>
          {(teamAName || 'TEAM A').toUpperCase()}: {teamAScore}
        </span>
        <span style={{ color: 'var(--light-blue)', fontWeight: 700 }}>
          {(teamBName || 'TEAM B').toUpperCase()}: {teamBScore}
        </span>
      </div>
    </div>
  );
}
