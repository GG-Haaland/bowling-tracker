import { useState, useEffect } from 'react';
import type { TeamData, GameRow } from '@/lib/types';
import { normStr } from '@/lib/constants';

interface WeekScorecardProps {
  teamData: TeamData | null;
  weekNum: number;
  teamAvgMap: Record<string, number>;
  loadTeamData: (name: string) => Promise<TeamData | null>;
  lookupTeamAvg: (name: string) => number;
}

export default function WeekScorecard({
  teamData,
  weekNum,
  teamAvgMap,
  loadTeamData,
  lookupTeamAvg,
}: WeekScorecardProps) {
  const [oppDatas, setOppDatas] = useState<(TeamData | null)[]>([]);

  const teamWeeks = teamData?.weeks ?? [];
  const rows = teamWeeks.filter(w => w.weekNum === weekNum);
  const isPast = rows.some(r => Object.values(r.scores).some(v => v !== null));

  useEffect(() => {
    if (!isPast || rows.length === 0) return;
    Promise.all(
      rows.map(r =>
        r.opponent ? loadTeamData(r.opponent).catch(() => null) : Promise.resolve(null)
      )
    ).then(setOppDatas);
  }, [isPast, rows.length, weekNum, teamData?.teamName]);

  const title = rows.length === 0
    ? 'WEEK SCORECARD'
    : isPast
      ? 'WEEK RESULTS'
      : 'UPCOMING MATCHUP';

  return (
    <div className="card">
      <div className="card__container">
        <div className="card-titlebar">
          <span className="card-titlebar__text">{title}</span>
        </div>

        {rows.length === 0 ? (
          <div style={{
            color: 'var(--soft-black)', fontSize: '0.82em', padding: '0.5em 0',
            fontFamily: 'var(--font-body)', fontWeight: 400
          }}>
            No data for this week yet
          </div>
        ) : isPast ? (
          <PastWeekView rows={rows} teamData={teamData} oppDatas={oppDatas} />
        ) : (
          <FutureWeekView rows={rows} teamData={teamData} lookupTeamAvg={lookupTeamAvg} />
        )}
      </div>
    </div>
  );
}

function buildDiffShadow(outlineColor: string, glowRgb: string): string {
  const outline = [
    '-1px -1px 0 ' + outlineColor,
    '1px -1px 0 ' + outlineColor,
    '-1px 1px 0 ' + outlineColor,
    '1px 1px 0 ' + outlineColor,
  ].join(', ');
  const glow = [
    '0 0 10px rgba(' + glowRgb + ',1)',
    '0 0 20px rgba(' + glowRgb + ',0.8)',
    '0 0 40px rgba(' + glowRgb + ',0.5)',
    '0 0 60px rgba(' + glowRgb + ',0.3)',
  ].join(', ');
  return outline + ', ' + glow;
}

function PastWeekView({ rows, teamData, oppDatas }: {
  rows: GameRow[];
  teamData: TeamData | null;
  oppDatas: (TeamData | null)[];
}) {
  const myTeamName = teamData?.teamName ?? '';

  return (
    <>
      {rows.map((r, idx) => {
        const wltColor = r.wlt === 'W' ? 'var(--green)' : r.wlt === 'L' ? 'var(--red)' : 'var(--yellow)';
        const wltLabel = r.wlt === 'W' ? 'WIN' : r.wlt === 'L' ? 'LOSS' : r.wlt === 'T' ? 'TIE' : '';
        const gameLabel = rows.length > 1 ? ('GAME ' + (idx + 1) + ' \u2014 ') : '';

        const myScores = Object.entries(r.scores).filter(([, v]) => v !== null) as [string, number][];

        const oppData = oppDatas[idx];
        let oppScores: [string, number][] = [];
        if (oppData) {
          const oppWeeks = (oppData.weeks || []).filter(w => w.weekNum === r.weekNum);
          const oppRow = oppWeeks.find(w => normStr(w.opponent) === normStr(myTeamName))
            || oppWeeks[idx]
            || oppWeeks[0];
          if (oppRow) {
            oppScores = Object.entries(oppRow.scores).filter(([, v]) => v !== null) as [string, number][];
          }
        }

        const myRawTotal = myScores.reduce((sum, [, v]) => sum + v, 0);
        const oppRawTotal = oppScores.reduce((sum, [, v]) => sum + v, 0);

        // Handicap differential from sheet data (adjTotal - scratchTotal is team's handicap)
        const myTeamHcp = (r.adjTotal != null && r.scratchTotal != null) ? r.adjTotal - r.scratchTotal : null;
        const oppTeamHcp = (r.adjOpp != null && r.scratchOpp != null) ? r.adjOpp - r.scratchOpp : null;
        // Positive = selected team has advantage, negative = opponent has advantage
        const hcpEdge = (myTeamHcp != null && oppTeamHcp != null) ? myTeamHcp - oppTeamHcp : null;

        // Point differential from adjusted (with handicap) totals
        const showDiff = r.adjTotal != null && r.adjOpp != null;
        const adjDiff = showDiff ? Math.abs(r.adjTotal! - r.adjOpp!) : 0;
        const isWin = r.wlt === 'W';
        const isTie = r.wlt === 'T' || (showDiff && adjDiff === 0);
        const diffColor = isTie ? 'var(--yellow)' : isWin ? '#00e676' : '#ff4444';
        const diffOutline = isTie ? '#8a6e00' : isWin ? '#005a1f' : '#6b0000';
        const diffGlowRgb = isTie ? '255,204,0' : isWin ? '0,230,118' : '255,68,68';
        const diffLabel = isTie ? 'TIE' : isWin ? ('+' + adjDiff) : ('-' + adjDiff);

        return (
          <div key={idx} style={{
            marginBottom: '0.65em', paddingBottom: '0.55em',
            borderBottom: '1px solid rgba(255,255,255,0.05)'
          }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              marginBottom: '0.3em'
            }}>
              <span style={{
                color: 'var(--light-blue)', fontSize: '1.1em',
                letterSpacing: '0.1em', textTransform: 'uppercase'
              }}>
                {gameLabel}{r.lane || ''}{'\u2002'}{r.time || ''}
              </span>
              {wltLabel && (
                <span style={{
                  color: wltColor, fontSize: '0.82em', fontWeight: 900,
                  letterSpacing: '0.12em', background: 'rgba(255,255,255,0.06)',
                  padding: '0.15em 0.5em', borderRadius: '0.25em'
                }}>
                  {wltLabel}
                </span>
              )}
            </div>

            <div style={{
              fontSize: '0.78em', color: 'var(--smoke)', marginBottom: '0.35em',
              letterSpacing: '0.05em'
            }}>
              vs{'\u2002'}<span style={{ color: 'var(--white-smoke)', fontWeight: 700 }}>{r.opponent}</span>
            </div>

            {myScores.length > 0 && (
              <>
                <div style={{
                  fontSize: '0.7em', color: 'var(--soft-black)',
                  letterSpacing: '0.08em', textTransform: 'uppercase',
                  marginBottom: '0.18em', display: 'flex', alignItems: 'center', gap: '0.5em'
                }}>
                  <span>YOUR TEAM</span>
                  {hcpEdge != null && hcpEdge > 0 && (
                    <span style={{ color: 'var(--yellow)', fontWeight: 900 }}>
                      +{hcpEdge}
                    </span>
                  )}
                  {hcpEdge != null && hcpEdge < 0 && (
                    <span style={{ color: 'var(--yellow)', fontWeight: 900 }}>
                      {hcpEdge}
                    </span>
                  )}
                </div>
                <ScoreChips scores={myScores} color="var(--yellow)" />
              </>
            )}

            {oppScores.length > 0 && (
              <>
                <div style={{
                  fontSize: '0.7em', color: 'var(--soft-black)',
                  letterSpacing: '0.08em', textTransform: 'uppercase',
                  marginBottom: '0.18em', marginTop: '0.45em'
                }}>
                  {r.opponent.toUpperCase()}
                </div>
                <ScoreChips scores={oppScores} color="#ff7a5a" />
              </>
            )}

            {(myScores.length > 0 || oppScores.length > 0) && (
              <div style={{
                marginTop: '0.6em', padding: '0.5em 0.6em', borderRadius: '0.35em',
                background: 'rgba(0,0,0,0.25)', border: '1px solid var(--soft-black)',
              }}>
                <div style={{
                  fontSize: '0.68em', color: 'var(--smoke)', letterSpacing: '0.1em',
                  textTransform: 'uppercase', marginBottom: '0.4em', textAlign: 'center',
                }}>
                  TOTAL RAW PINS
                </div>

                {myScores.length > 0 && (
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    marginBottom: oppScores.length > 0 ? '0.3em' : 0,
                  }}>
                    <span style={{
                      fontSize: '0.75em', fontWeight: 700, color: 'var(--yellow)',
                      letterSpacing: '0.05em',
                    }}>
                      YOUR TEAM
                    </span>
                    <span style={{ fontSize: '0.85em', fontWeight: 900, color: 'var(--yellow)' }}>
                      {myRawTotal}
                    </span>
                  </div>
                )}

                {oppScores.length > 0 && (
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}>
                    <span style={{
                      fontSize: '0.75em', fontWeight: 700, color: '#ff7a5a',
                      letterSpacing: '0.05em',
                    }}>
                      {r.opponent.toUpperCase()}
                    </span>
                    <span style={{ fontSize: '0.85em', fontWeight: 900, color: '#ff7a5a' }}>
                      {oppRawTotal}
                    </span>
                  </div>
                )}

                {showDiff && (
                  <div style={{
                    textAlign: 'center', marginTop: '0.5em',
                    paddingTop: '0.45em', borderTop: '1px solid var(--soft-black)',
                  }}>
                    <span style={{
                      fontSize: '1.3em', fontWeight: 900,
                      color: diffColor,
                      textShadow: buildDiffShadow(diffOutline, diffGlowRgb),
                    }}>
                      {diffLabel}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}

function FutureWeekView({ rows, teamData, lookupTeamAvg }: {
  rows: GameRow[];
  teamData: TeamData | null;
  lookupTeamAvg: (name: string) => number;
}) {
  const myName = teamData?.teamName ?? '';

  return (
    <>
      {rows.map((r, idx) => {
        const myAvg = lookupTeamAvg(myName);
        const oppAvg = lookupTeamAvg(r.opponent);
        const gameLabel = rows.length > 1 ? ('GAME ' + (idx + 1) + ' \u2014 ') : '';

        return (
          <div key={idx} style={{
            marginBottom: '0.65em', paddingBottom: '0.55em',
            borderBottom: '1px solid rgba(255,255,255,0.05)'
          }}>
            <div style={{
              fontSize: '0.78em', color: 'var(--light-blue)',
              letterSpacing: '0.1em', textTransform: 'uppercase',
              marginBottom: '0.28em'
            }}>
              {gameLabel}{r.lane || ''}{'\u2002'}{r.time || ''}
            </div>
            <div style={{ fontSize: '0.88em', color: 'var(--smoke)', marginBottom: '0.45em' }}>
              vs <span style={{ color: 'var(--white-smoke)', fontWeight: 700 }}>{r.opponent}</span>
            </div>

            {(myAvg > 0 || oppAvg > 0) && (
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr auto 1fr',
                gap: '0.4em', alignItems: 'center', textAlign: 'center',
                fontSize: '0.8em'
              }}>
                <div>
                  <div style={{
                    color: 'var(--smoke)', fontSize: '0.78em',
                    textTransform: 'uppercase', letterSpacing: '0.1em',
                    marginBottom: '0.15em'
                  }}>OUR AVG</div>
                  <div style={{ color: 'var(--green)', fontWeight: 900 }}>{myAvg}</div>
                </div>
                <div style={{ color: 'var(--soft-black)' }}>vs</div>
                <div>
                  <div style={{
                    color: 'var(--smoke)', fontSize: '0.78em',
                    textTransform: 'uppercase', letterSpacing: '0.1em',
                    marginBottom: '0.15em'
                  }}>OPP AVG</div>
                  <div style={{ color: 'var(--red)', fontWeight: 900 }}>{oppAvg}</div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}

function ScoreChips({ scores, color }: { scores: [string, number][]; color: string }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3em' }}>
      {scores.map(([name, score]) => (
        <div key={name} style={{
          background: 'var(--dark-black)', borderRadius: '0.3em',
          padding: '0.22em 0.5em', display: 'flex', gap: '0.45em',
          alignItems: 'center'
        }}>
          <span style={{
            color: 'var(--smoke)', fontSize: '0.75em', textTransform: 'uppercase'
          }}>
            {/^sub\s*\d/i.test(name) ? 'SUB' : name}
          </span>
          <span style={{ color, fontWeight: 900, fontSize: '0.95em' }}>{score}</span>
        </div>
      ))}
    </div>
  );
}
