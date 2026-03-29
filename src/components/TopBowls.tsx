import { useState, useEffect } from 'react';
import type { TeamData, TopScore } from '@/lib/types';
import { TEAM_GIDS } from '@/lib/constants';

interface TopBowlsProps {
  weekNum: number;
  weekDateMap: Record<number, Date>;
  loadTeamData: (name: string) => Promise<TeamData | null>;
}

const MEDAL_COLORS = ['var(--yellow)', '#c0c0c0', '#cd7f32', 'var(--smoke)', 'var(--smoke)'];

export default function TopBowls({ weekNum, weekDateMap, loadTeamData }: TopBowlsProps) {
  const [scores, setScores] = useState<TopScore[]>([]);
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const today = new Date();
    const weekDate = weekDateMap[weekNum];
    if (weekDate && weekDate > today) {
      setVisible(false);
      return;
    }

    setVisible(true);
    setLoading(true);

    const teamNames = Object.keys(TEAM_GIDS).filter(t => !/ghost\s*team/i.test(t));

    Promise.all(teamNames.map(t => loadTeamData(t).catch(() => null)))
      .then(teamDatas => {
        const allScores: TopScore[] = [];
        teamDatas.forEach((data, i) => {
          if (!data) return;
          const teamName = data.teamName || teamNames[i];
          const weekRows = data.weeks.filter(w => w.weekNum === weekNum);
          weekRows.forEach(row => {
            Object.entries(row.scores).forEach(([playerName, score]) => {
              if (score !== null && score > 0) {
                allScores.push({ name: playerName, team: teamName, score });
              }
            });
          });
        });

        allScores.sort((a, b) => b.score - a.score);
        setScores(allScores.slice(0, 5));
        setLoading(false);
      });
  }, [weekNum, weekDateMap, loadTeamData]);

  if (!visible) return null;

  return (
    <div className="card">
      <div className="card__container">
        <div className="card-titlebar">
          <span className="card-titlebar__text">TOP BOWLS WEEK {weekNum}</span>
        </div>

        {loading ? (
          <div style={{ color: 'var(--soft-black)', fontSize: '0.82em', padding: '0.3em 0' }}>Loading scores...</div>
        ) : scores.length === 0 ? (
          <div style={{ color: 'var(--soft-black)', fontSize: '0.82em', padding: '0.3em 0' }}>No scores recorded for this week</div>
        ) : (
          scores.map((s, i) => (
            <div key={`${s.name}-${s.score}-${i}`} style={{
              display: 'flex', alignItems: 'center', gap: '0.5em', padding: '0.35em 0',
              borderBottom: i < scores.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
            }}>
              <span style={{ color: MEDAL_COLORS[i], fontWeight: 900, fontSize: '1.1em', minWidth: '1.3em', textAlign: 'center' }}>
                {i + 1}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: 'var(--white-smoke)', fontWeight: 700, fontSize: '0.92em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {s.name}
                </div>
                <div style={{ color: 'var(--soft-black)', fontSize: '0.72em', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {s.team}
                </div>
              </div>
              <span style={{ color: 'var(--yellow)', fontWeight: 700, fontSize: '1.15em', letterSpacing: '0.03em', paddingRight: '0.8em' }}>                {s.score}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
