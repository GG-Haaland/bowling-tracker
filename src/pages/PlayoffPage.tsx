import { useState, useCallback, useMemo } from 'react';
import type { PlayoffTeam, PlayoffPlayer } from '@/lib/types';
import { usePlayoffData } from '@/hooks/usePlayoffData';

interface PlayoffPageProps {
  onBack: () => void;
}

export default function PlayoffPage({ onBack }: PlayoffPageProps) {
  const { loading, error, teams } = usePlayoffData();

  // Team selection
  const [teamAIdx, setTeamAIdx] = useState<number | null>(null);
  const [teamBIdx, setTeamBIdx] = useState<number | null>(null);

  // Game 1 selections (3 per team)
  const [game1A, setGame1A] = useState<string[]>([]);
  const [game1B, setGame1B] = useState<string[]>([]);

  // Game 2 selections (3 per team from remaining)
  const [game2A, setGame2A] = useState<string[]>([]);
  const [game2B, setGame2B] = useState<string[]>([]);

  // Editable scores: key = "g1-playerName" or "g2-playerName"
  const [scores, setScores] = useState<Record<string, number | null>>({});

  const teamA = teamAIdx !== null ? teams[teamAIdx] : null;
  const teamB = teamBIdx !== null ? teams[teamBIdx] : null;

  // Players available for Game 2 = all players minus Game 1 picks
  const remainingA = useMemo(() =>
    teamA ? teamA.players.filter(p => !game1A.includes(p.name)) : [],
    [teamA, game1A]
  );
  const remainingB = useMemo(() =>
    teamB ? teamB.players.filter(p => !game1B.includes(p.name)) : [],
    [teamB, game1B]
  );

  const handleTeamAChange = useCallback((idx: number) => {
    setTeamAIdx(idx);
    setGame1A([]);
    setGame2A([]);
    setScores({});
  }, []);

  const handleTeamBChange = useCallback((idx: number) => {
    setTeamBIdx(idx);
    setGame1B([]);
    setGame2B([]);
    setScores({});
  }, []);

  const togglePlayer = useCallback((
    list: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>,
    name: string,
  ) => {
    setList(prev => {
      if (prev.includes(name)) return prev.filter(n => n !== name);
      if (prev.length >= 3) return prev;
      return [...prev, name];
    });
  }, []);

  const setScore = useCallback((key: string, val: string) => {
    const parsed = val === '' || isNaN(Number(val)) ? null : Math.max(0, Math.min(300, Math.round(Number(val))));
    setScores(prev => ({ ...prev, [key]: parsed }));
  }, []);

  const getPlayersFromTeam = (team: PlayoffTeam | null, names: string[]): PlayoffPlayer[] => {
    if (!team) return [];
    return names.map(n => team.players.find(p => p.name === n)).filter(Boolean) as PlayoffPlayer[];
  };

  // Compute game totals
  const gameTotal = (players: PlayoffPlayer[], prefix: string) => {
    let raw = 0;
    let withHcp = 0;
    let allFilled = true;
    for (const p of players) {
      const s = scores[`${prefix}-${p.name}`];
      if (s === null || s === undefined) { allFilled = false; continue; }
      raw += s;
      withHcp += s + p.handicap;
    }
    return { raw, withHcp, allFilled: allFilled && players.length > 0 };
  };

  const g1PlayersA = getPlayersFromTeam(teamA, game1A);
  const g1PlayersB = getPlayersFromTeam(teamB, game1B);
  const g2PlayersA = getPlayersFromTeam(teamA, game2A);
  const g2PlayersB = getPlayersFromTeam(teamB, game2B);

  const g1TotalA = gameTotal(g1PlayersA, 'g1');
  const g1TotalB = gameTotal(g1PlayersB, 'g1');
  const g2TotalA = gameTotal(g2PlayersA, 'g2');
  const g2TotalB = gameTotal(g2PlayersB, 'g2');

  const grandTotalA = g1TotalA.withHcp + g2TotalA.withHcp;
  const grandTotalB = g1TotalB.withHcp + g2TotalB.withHcp;
  const bothGamesComplete = g1TotalA.allFilled && g1TotalB.allFilled && g2TotalA.allFilled && g2TotalB.allFilled;

  if (loading) {
    return (
      <div className="dashboard dot-bg" style={{ opacity: 1 }}>
        <div className="dashboard-stack">
          <BackButton onBack={onBack} />
          <div className="card" style={{ textAlign: 'center', padding: '2em', color: 'var(--smoke)' }}>
            Loading playoff data...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard dot-bg" style={{ opacity: 1 }}>
        <div className="dashboard-stack">
          <BackButton onBack={onBack} />
          <div className="card" style={{ textAlign: 'center', padding: '2em', color: 'var(--red)' }}>
            Error loading playoff data: {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard dot-bg" style={{ opacity: 1 }}>
      <div className="dashboard-stack">
        {/* Back button */}
        <BackButton onBack={onBack} />

        {/* Title */}
        <div className="card" style={{ textAlign: 'center', padding: '1em' }}>
          <div style={{
            fontSize: '1.1em', fontWeight: 900, letterSpacing: '0.15em',
            color: 'var(--yellow)',
            textShadow: '-1px -1px 0 #8a6e00, 1px -1px 0 #8a6e00, -1px 1px 0 #8a6e00, 1px 1px 0 #8a6e00',
          }}>
            PLAYOFFS
          </div>
          <div style={{ fontSize: '0.72em', color: 'var(--smoke)', marginTop: '0.3em', letterSpacing: '0.08em' }}>
            SELECT TWO TEAMS TO SIMULATE A MATCH
          </div>
        </div>

        {/* Team Pickers */}
        <div style={{ display: 'flex', gap: '0.5em' }}>
          <TeamPicker
            label="YOUR TEAM"
            accentColor="var(--red)"
            teams={teams}
            selectedIdx={teamAIdx}
            disabledIdx={teamBIdx}
            onChange={handleTeamAChange}
          />
          <div style={{
            display: 'flex', alignItems: 'center', fontSize: '0.9em',
            fontWeight: 900, color: 'var(--smoke)', padding: '0 0.2em',
          }}>
            VS
          </div>
          <TeamPicker
            label="OPPONENT"
            accentColor="var(--light-blue)"
            teams={teams}
            selectedIdx={teamBIdx}
            disabledIdx={teamAIdx}
            onChange={handleTeamBChange}
          />
        </div>

        {teamA && teamB ? (
          <>
            {/* ── GAME 1 ── */}
            <div className="card">
              <div className="card__container">
                <div className="card-titlebar">
                  <span className="card-titlebar__text">GAME 1 — PICK 3 PER TEAM</span>
                </div>

                <PlayerSelector
                  players={teamA.players}
                  selected={game1A}
                  onToggle={(n) => togglePlayer(game1A, setGame1A, n)}
                  accentColor="var(--red)"
                  teamName={teamA.name}
                />
                <PlayerSelector
                  players={teamB.players}
                  selected={game1B}
                  onToggle={(n) => togglePlayer(game1B, setGame1B, n)}
                  accentColor="var(--light-blue)"
                  teamName={teamB.name}
                />

                {/* Game 1 Score Inputs */}
                {game1A.length === 3 && game1B.length === 3 && (
                  <>
                    <ScoreInputBlock
                      players={g1PlayersA}
                      prefix="g1"
                      scores={scores}
                      onSetScore={setScore}
                      accentColor="var(--red)"
                      teamName={teamA.name}
                      total={g1TotalA}
                    />
                    <ScoreInputBlock
                      players={g1PlayersB}
                      prefix="g1"
                      scores={scores}
                      onSetScore={setScore}
                      accentColor="var(--light-blue)"
                      teamName={teamB.name}
                      total={g1TotalB}
                    />
                    {g1TotalA.allFilled && g1TotalB.allFilled && (
                      <GameResult
                        totalA={g1TotalA.withHcp}
                        totalB={g1TotalB.withHcp}
                        teamAName={teamA.name}
                        teamBName={teamB.name}
                        label="GAME 1 RESULT"
                      />
                    )}
                  </>
                )}
              </div>
            </div>

            {/* ── GAME 2 ── */}
            <div className="card">
              <div className="card__container">
                <div className="card-titlebar">
                  <span className="card-titlebar__text">GAME 2 — PICK 3 FROM REMAINING</span>
                </div>

                {game1A.length < 3 || game1B.length < 3 ? (
                  <div style={{
                    textAlign: 'center', padding: '1.5em', color: 'var(--soft-black)',
                    fontSize: '0.82em', fontFamily: 'var(--font-body)',
                  }}>
                    Complete Game 1 player selection first
                  </div>
                ) : (
                  <>
                    <PlayerSelector
                      players={remainingA}
                      selected={game2A}
                      onToggle={(n) => togglePlayer(game2A, setGame2A, n)}
                      accentColor="var(--red)"
                      teamName={teamA.name}
                    />
                    <PlayerSelector
                      players={remainingB}
                      selected={game2B}
                      onToggle={(n) => togglePlayer(game2B, setGame2B, n)}
                      accentColor="var(--light-blue)"
                      teamName={teamB.name}
                    />

                    {game2A.length === 3 && game2B.length === 3 && (
                      <>
                        <ScoreInputBlock
                          players={g2PlayersA}
                          prefix="g2"
                          scores={scores}
                          onSetScore={setScore}
                          accentColor="var(--red)"
                          teamName={teamA.name}
                          total={g2TotalA}
                        />
                        <ScoreInputBlock
                          players={g2PlayersB}
                          prefix="g2"
                          scores={scores}
                          onSetScore={setScore}
                          accentColor="var(--light-blue)"
                          teamName={teamB.name}
                          total={g2TotalB}
                        />
                        {g2TotalA.allFilled && g2TotalB.allFilled && (
                          <GameResult
                            totalA={g2TotalA.withHcp}
                            totalB={g2TotalB.withHcp}
                            teamAName={teamA.name}
                            teamBName={teamB.name}
                            label="GAME 2 RESULT"
                          />
                        )}
                      </>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* ── GRAND TOTAL ── */}
            {bothGamesComplete && (
              <div className="card">
                <div className="card__container">
                  <div className="card-titlebar">
                    <span className="card-titlebar__text">GRAND TOTAL</span>
                  </div>
                  <div style={{ padding: '0.6em 0' }}>
                    <div style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '0.5em 0.8em', borderRadius: '0.3em',
                      background: 'var(--dark-black)', marginBottom: '0.35em',
                    }}>
                      <span style={{ fontSize: '0.82em', fontWeight: 900, color: 'var(--red)', letterSpacing: '0.06em' }}>
                        {teamA.name.toUpperCase()}
                      </span>
                      <div style={{ display: 'flex', gap: '0.8em', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.72em', color: 'var(--smoke)' }}>
                          G1: <strong style={{ color: 'var(--white-smoke)' }}>{g1TotalA.withHcp}</strong>
                        </span>
                        <span style={{ fontSize: '0.72em', color: 'var(--smoke)' }}>
                          G2: <strong style={{ color: 'var(--white-smoke)' }}>{g2TotalA.withHcp}</strong>
                        </span>
                        <span style={{ fontSize: '1.05em', fontWeight: 900, color: 'var(--red)' }}>
                          {grandTotalA}
                        </span>
                      </div>
                    </div>

                    <div style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '0.5em 0.8em', borderRadius: '0.3em',
                      background: 'var(--dark-black)', marginBottom: '0.5em',
                    }}>
                      <span style={{ fontSize: '0.82em', fontWeight: 900, color: 'var(--light-blue)', letterSpacing: '0.06em' }}>
                        {teamB.name.toUpperCase()}
                      </span>
                      <div style={{ display: 'flex', gap: '0.8em', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.72em', color: 'var(--smoke)' }}>
                          G1: <strong style={{ color: 'var(--white-smoke)' }}>{g1TotalB.withHcp}</strong>
                        </span>
                        <span style={{ fontSize: '0.72em', color: 'var(--smoke)' }}>
                          G2: <strong style={{ color: 'var(--white-smoke)' }}>{g2TotalB.withHcp}</strong>
                        </span>
                        <span style={{ fontSize: '1.05em', fontWeight: 900, color: 'var(--light-blue)' }}>
                          {grandTotalB}
                        </span>
                      </div>
                    </div>

                    {/* Winner */}
                    <div style={{
                      textAlign: 'center', padding: '0.7em', borderRadius: '0.4em',
                      background: 'rgba(0,0,0,0.25)', border: '1px solid var(--soft-black)',
                    }}>
                      <div style={{
                        fontSize: '0.7em', letterSpacing: '0.1em', color: 'var(--smoke)',
                        marginBottom: '0.3em',
                      }}>
                        MATCH WINNER
                      </div>
                      {grandTotalA === grandTotalB ? (
                        <div style={{ fontSize: '1.1em', fontWeight: 900, color: 'var(--yellow)' }}>
                          TIE!
                        </div>
                      ) : (
                        <div style={{
                          fontSize: '1.1em', fontWeight: 900,
                          color: grandTotalA > grandTotalB ? 'var(--red)' : 'var(--light-blue)',
                        }}>
                          {(grandTotalA > grandTotalB ? teamA.name : teamB.name).toUpperCase()} +{Math.abs(grandTotalA - grandTotalB)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="card" style={{
            textAlign: 'center', padding: '1.5em', color: 'var(--soft-black)',
            fontSize: '0.82em', fontFamily: 'var(--font-body)',
          }}>
            Select both teams above to start
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Sub-components ─────────────────────────────────────────────────────── */

function BackButton({ onBack }: { onBack: () => void }) {
  return (
    <button
      className="contact-btn"
      onClick={onBack}
      style={{ padding: '0.5em', fontSize: '0.82em', letterSpacing: '0.1em', marginBottom: '0.2em' }}
    >
      &#9664; BACK
    </button>
  );
}

function TeamPicker({ label, accentColor, teams, selectedIdx, disabledIdx, onChange }: {
  label: string;
  accentColor: string;
  teams: PlayoffTeam[];
  selectedIdx: number | null;
  disabledIdx: number | null;
  onChange: (idx: number) => void;
}) {
  return (
    <div className="card" style={{ flex: 1 }}>
      <div style={{ padding: '0.7em' }}>
        <div style={{
          fontSize: '0.68em', letterSpacing: '0.14em', color: accentColor,
          fontWeight: 700, marginBottom: '0.4em',
        }}>
          {label}
        </div>
        <select
          value={selectedIdx ?? ''}
          onChange={e => onChange(Number(e.target.value))}
          style={{
            width: '100%',
            background: 'var(--dark-black)',
            border: '1px solid var(--soft-black)',
            color: 'var(--white-smoke)',
            padding: '0.5em',
            borderRadius: '0.3em',
            fontWeight: 700,
            fontSize: '0.82em',
            fontFamily: 'inherit',
            outline: 'none',
          }}
        >
          <option value="" disabled>Pick a team</option>
          {teams.map((t, i) => (
            <option key={t.name} value={i} disabled={i === disabledIdx}>
              #{t.seed} {t.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

function PlayerSelector({ players, selected, onToggle, accentColor, teamName }: {
  players: PlayoffPlayer[];
  selected: string[];
  onToggle: (name: string) => void;
  accentColor: string;
  teamName: string;
}) {
  return (
    <div style={{ marginBottom: '0.7em' }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '0 0.2em', marginBottom: '0.4em',
      }}>
        <span style={{
          fontSize: '0.75em', fontWeight: 900, letterSpacing: '0.1em', color: accentColor,
        }}>
          {teamName.toUpperCase()}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4em' }}>
          <span style={{ fontSize: '0.68em', color: accentColor, letterSpacing: '0.06em' }}>
            {selected.length} / 3
          </span>
          <div style={{ display: 'flex', gap: '0.2em' }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{
                width: '0.5em', height: '0.5em', borderRadius: '50%',
                background: i < selected.length ? accentColor : 'var(--soft-black)',
                transition: 'background 0.15s',
              }} />
            ))}
          </div>
        </div>
      </div>

      {players.map(p => {
        const isSelected = selected.includes(p.name);
        const isFull = selected.length >= 3 && !isSelected;
        return (
          <div
            key={p.name}
            onClick={() => !isFull && onToggle(p.name)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '0.45em 0.6em', borderRadius: '0.3em',
              background: isSelected ? 'rgba(255,255,255,0.06)' : 'var(--dark-black)',
              marginBottom: '0.2em',
              cursor: isFull ? 'default' : 'pointer',
              opacity: isFull ? 0.4 : 1,
              border: isSelected ? `1px solid ${accentColor}` : '1px solid transparent',
              transition: 'all 0.15s',
            }}
          >
            <span style={{
              fontSize: '0.85em', color: 'var(--white-smoke)', fontWeight: 700, flex: 1,
            }}>
              {p.name}
            </span>
            <span style={{ fontSize: '0.72em', color: 'var(--smoke)', marginRight: '0.8em' }}>
              AVG&nbsp;<strong style={{ color: 'var(--white-smoke)' }}>{p.avg > 0 ? Math.round(p.avg) : '—'}</strong>
            </span>
            <span style={{ fontSize: '0.72em', color: 'var(--yellow)', fontWeight: 900 }}>
              +{p.handicap}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function ScoreInputBlock({ players, prefix, scores, onSetScore, accentColor, teamName, total }: {
  players: PlayoffPlayer[];
  prefix: string;
  scores: Record<string, number | null>;
  onSetScore: (key: string, val: string) => void;
  accentColor: string;
  teamName: string;
  total: { raw: number; withHcp: number; allFilled: boolean };
}) {
  return (
    <div style={{ marginBottom: '0.7em' }}>
      <div style={{
        fontSize: '0.75em', fontWeight: 900, letterSpacing: '0.1em',
        color: accentColor, marginBottom: '0.4em', padding: '0 0.2em',
      }}>
        {teamName.toUpperCase()} SCORES
      </div>

      {players.map(p => {
        const key = `${prefix}-${p.name}`;
        const s = scores[key];
        const withHcp = s !== null && s !== undefined ? s + p.handicap : null;

        return (
          <div key={p.name} style={{
            display: 'flex', alignItems: 'center', gap: '0.5em',
            padding: '0.45em 0.6em', borderRadius: '0.3em',
            background: 'var(--dark-black)', marginBottom: '0.25em',
          }}>
            <span style={{
              fontSize: '0.85em', color: 'var(--white-smoke)', fontWeight: 700,
              flex: 1, minWidth: 0,
            }}>
              {p.name}
            </span>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3em' }}>
              <span style={{ fontSize: '0.68em', color: 'var(--smoke)', letterSpacing: '0.05em' }}>SCORE</span>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                max={300}
                value={s !== null && s !== undefined ? s : ''}
                onChange={e => onSetScore(key, e.target.value)}
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

            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.2em',
              minWidth: '4.5em', justifyContent: 'flex-end',
            }}>
              <span style={{ fontSize: '0.68em', color: 'var(--smoke)' }}>+{p.handicap}</span>
              <span style={{ fontSize: '0.68em', color: 'var(--smoke)', margin: '0 0.1em' }}>=</span>
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

      {/* Team total row */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '0.45em 0.6em', borderRadius: '0.3em',
        background: 'rgba(0,0,0,0.3)', borderTop: '1px solid var(--soft-black)',
        marginTop: '0.3em',
      }}>
        <span style={{ fontSize: '0.75em', letterSpacing: '0.08em', color: 'var(--smoke)' }}>TOTAL</span>
        <div style={{ display: 'flex', gap: '1em', alignItems: 'center' }}>
          <span style={{ fontSize: '0.78em', color: 'var(--smoke)' }}>
            RAW&nbsp;<strong style={{ color: 'var(--white-smoke)' }}>{total.raw}</strong>
          </span>
          <span style={{ fontSize: '0.95em', fontWeight: 900, color: accentColor }}>
            {total.allFilled ? total.withHcp : '—'}
          </span>
        </div>
      </div>
    </div>
  );
}

function GameResult({ totalA, totalB, teamAName, teamBName, label }: {
  totalA: number;
  totalB: number;
  teamAName: string;
  teamBName: string;
  label: string;
}) {
  const diff = Math.abs(totalA - totalB);
  const isTie = diff === 0;
  const winner = totalA > totalB ? teamAName : teamBName;
  const winnerColor = totalA > totalB ? 'var(--red)' : 'var(--light-blue)';

  return (
    <div style={{
      textAlign: 'center', padding: '0.6em', borderRadius: '0.4em',
      background: 'rgba(0,0,0,0.25)', border: '1px solid var(--soft-black)',
      marginBottom: '0.5em',
    }}>
      <div style={{ fontSize: '0.68em', letterSpacing: '0.1em', color: 'var(--smoke)', marginBottom: '0.25em' }}>
        {label}
      </div>
      {isTie ? (
        <div style={{ fontSize: '1em', fontWeight: 900, color: 'var(--yellow)' }}>TIE!</div>
      ) : (
        <div style={{ fontSize: '1em', fontWeight: 900, color: winnerColor }}>
          {winner.toUpperCase()} +{diff}
        </div>
      )}
      <div style={{
        display: 'flex', justifyContent: 'center', gap: '1.5em',
        marginTop: '0.3em', fontSize: '0.78em',
      }}>
        <span style={{ color: 'var(--red)', fontWeight: 700 }}>{teamAName.toUpperCase()}: {totalA}</span>
        <span style={{ color: 'var(--light-blue)', fontWeight: 700 }}>{teamBName.toUpperCase()}: {totalB}</span>
      </div>
    </div>
  );
}
