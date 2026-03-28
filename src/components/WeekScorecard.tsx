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
  teamData, weekNum, teamAvgMap, loadTeamData, lookupTeamAvg,
}: WeekScorecardProps) {
  const [oppDatas, setOppDatas] = useState<(TeamData | null)[]>([]);

  const teamWeeks = teamData?.weeks ?? [];
  const rows = teamWeeks.filter(w => w.weekNum === weekNum);
  const isPast = rows.some(r => Object.values(r.scores).some(v => v !== null));

  // Load opponent data for past weeks
  useEffect(() => {
    if (!isPast || rows.length === 0) return;
    Promise.all(
      rows.map(r => r.opponent ? loadTeamData(r.opponent).catch(() => null) : Promise.resolve(null))
    ).then(setOppDatas);
  }, [isPast, rows.length, weekNum, teamData?.teamName]);

  const title = rows.length === 0 ? 'WEEK SCORECARD' : isPast ? 'WEEK RESULTS' : 'UPCOMING MATCHUP';

  return (
    <div className="card">
      <div className="card__container">
        <div className="card-titlebar">
          <span className="card-titlebar__text">{title}</span>
        </div>

        {rows.length === 0 ? (
          <div style={{ color: 'var(--soft-black)', fontSize: '0.82em', padding: '0.5em 0', fontFamily: 'var(--font-body)', fontWeight: 400 }}>
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
        const gameLabel = rows.length > 1 ? `GAME ${idx + 1} — ` : '';

        const myScores = Object.entries(r.scores).filter(([, v]) => v !== null);

        // Find opponent scores
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

        return (
          <div key={idx} style={{ marginBottom: '0.65em', paddingBottom: '0.55em', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3em' }}>
              <span style={{ color: 'var(--light-blue)', fontSize: '0.78em', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                {gameLabel}{r.lane || ''}&ensp;{r.time || ''}
              </span>
              {wltLabel && (
                <span style={{ color: wltColor, fontSize: '0.82em', fontWeight: 900, letterSpacing: '0.12em', background: 'rgba(255,255,255,0.06)', padding: '0.15em 0.5em', borderRadius: '0.25em' }}>
                  {wltLabel}
                </span>
              )}
            </div>
            <div style={{ fontSize: '0.78em', color: 'var(--smoke)', marginBottom: '0.35em', letterSpacing: '0.05em' }}>
              vs&ensp;<span style={{ color: 'var(--white-smoke)', fontWeight: 700 }}>{r.opponent}</span>
            </div>

            {myScores.length > 0 && (
              <>
                <div style={{ fontSize: '0.7em', color: 'var(--soft-black)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.18em' }}>YOUR TEAM</div>
                <ScoreChips scores={myScores as [string, number][]} color="var(--yellow)" />
              </>
            )}

            {oppScores.length > 0 && (
              <>
                <div style={{ fontSize: '0.7em', color: 'var(--soft-black)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.18em', marginTop: '0.45em' }}>
                  {r.opponent.toUpperCase()}
                </div>
                <ScoreChips scores={oppScores} color="#ff7a5a" />
              </>
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
        const gameLabel = rows.length > 1 ? `GAME ${idx + 1} — ` : '';

        return (
          <div key={idx} style={{ marginBottom: '0.65em', paddingBottom: '0.55em', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ fontSize: '0.78em', color: 'var(--light-blue)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.28em' }}>
              {gameLabel}{r.lane || ''}&ensp;{r.time || ''}
            </div>
            <div style={{ fontSize: '0.88em', color: 'var(--smoke)', marginBottom: '0.45em' }}>
              vs <span style={{ color: 'var(--white-smoke)', fontWeight: 700 }}>{r.opponent}</span>
            </div>
            {(myAvg > 0 || oppAvg > 0) && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '0.4em', alignItems: 'center', textAlign: 'center', fontSize: '0.8em' }}>
                <div>
                  <div style={{ color: 'var(--smoke)', fontSize: '0.78em', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.15em' }}>OUR AVG</div>
                  <div style={{ color: 'var(--green)', fontWeight: 900 }}>{myAvg}</div>
                </div>
                <div style={{ color: 'var(--soft-black)' }}>vs</div>
                <div>
                  <div style={{ color: 'var(--smoke)', fontSize: '0.78em', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.15em' }}>OPP AVG</div>
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
        <div key={name} style={{ background: 'var(--dark-black)', borderRadius: '0.3em', padding: '0.22em 0.5em', display: 'flex', gap: '0.45em', alignItems: 'center' }}>
          <span style={{ color: 'var(--smoke)', fontSize: '0.75em', textTransform: 'uppercase' }}>{name}</span>
          <span style={{ color, fontWeight: 900, fontSize: '0.95em' }}>{score}</span>
        </div>
      ))}
    </div>
  );
}
