import { useState, useEffect, useMemo } from 'react';
import { SHEET_URLS } from '@/lib/constants';

interface LeaderboardPlayer {
  rank: number;
  name: string;
  team: string;
  avg: number;
  high: number;
  stdDev: number;
  total: number;
  gamesPlayed: number;
}

type SortKey = 'rank' | 'name' | 'avg' | 'high' | 'gamesPlayed' | 'total' | 'stdDev';
type SortDir = 'asc' | 'desc';

interface LeaderboardPageProps {
  onBack: () => void;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

function parseLeaderboardCSV(csv: string): LeaderboardPlayer[] {
  const lines = csv.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim().split('\n');
  if (lines.length < 2) return [];

  let headerIdx = -1;
  for (let i = 0; i < Math.min(lines.length, 10); i++) {
    const lower = lines[i].toLowerCase();
    if ((lower.includes('player') || lower.includes('name')) && lower.includes('team') && lower.includes('avg')) {
      headerIdx = i;
      break;
    }
  }
  if (headerIdx === -1) return [];

  const header = lines[headerIdx].split(',').map(h => h.trim().toLowerCase().replace(/[^a-z#]/g, ''));
  const rankIdx = header.findIndex(h => h === 'rank' || h.includes('rank'));
  const nameIdx = header.findIndex(h => h === 'player' || h === 'name' || h.includes('player') || h.includes('name'));
  const teamIdx = header.findIndex(h => h.includes('team'));
  const avgIdx = header.findIndex(h => h.startsWith('avg') || h === 'average');
  const highIdx = header.findIndex(h => h === 'high' || h.includes('high'));
  const stdIdx = header.findIndex(h => h.includes('std') || h.includes('stdd'));
  const totalIdx = header.findIndex(h => h === 'total' || h.includes('total'));
  const playedIdx = header.findIndex(h => h.includes('played') || h === '#played' || h.includes('#'));

  if (nameIdx === -1 || avgIdx === -1) return [];

  return lines.slice(headerIdx + 1)
    .filter(l => l.trim())
    .map((line, i) => {
      const parts = parseCSVLine(line);
      const name = (parts[nameIdx] || '').trim();
      const team = teamIdx >= 0 ? (parts[teamIdx] || '').trim() : '';
      const avg = parseFloat(parts[avgIdx]) || 0;
      const high = highIdx >= 0 ? (parseInt(parts[highIdx]) || 0) : 0;
      const stdDev = stdIdx >= 0 ? (parseFloat(parts[stdIdx]) || 0) : 0;
      const total = totalIdx >= 0 ? (parseInt(parts[totalIdx]) || 0) : 0;
      const gamesPlayed = playedIdx >= 0 ? (parseInt(parts[playedIdx]) || 0) : 0;
      const rank = rankIdx >= 0 ? (parseInt(parts[rankIdx]) || (i + 1)) : (i + 1);
      return { rank, name, team, avg, high, stdDev, total, gamesPlayed };
    })
    .filter(p => p.name && p.avg > 0 && !/ghost\s*team/i.test(p.name));
}

// Sort arrow indicator
function SortArrow({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <span style={{ opacity: 0.3, marginLeft: '0.2em' }}>▼</span>;
  return <span style={{ marginLeft: '0.2em', color: 'var(--yellow)' }}>{dir === 'desc' ? '▼' : '▲'}</span>;
}

const thStyle: React.CSSProperties = {
  padding: '0.5em 0.3em',
  fontWeight: 700,
  userSelect: 'none',
  whiteSpace: 'nowrap',
};

export default function LeaderboardPage({ onBack }: LeaderboardPageProps) {
  const [players, setPlayers] = useState<LeaderboardPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState('All Teams');
  const [sortKey, setSortKey] = useState<SortKey>('rank');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  useEffect(() => {
    fetch(SHEET_URLS.roster)
      .then(r => r.text())
      .then(csv => {
        const parsed = parseLeaderboardCSV(csv);
        setPlayers(parsed);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const teamNames = useMemo(() => {
    const teams = [...new Set(players.map(p => p.team).filter(Boolean))];
    return teams.filter(t => !/ghost\s*team/i.test(t)).sort();
  }, [players]);

  // Handle column header tap — toggle direction or switch column
  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(prev => prev === 'desc' ? 'asc' : 'desc');
    } else {
      setSortKey(key);
      // Default: high-to-low for stats, A-Z for name, low-to-high for rank
      setSortDir(key === 'name' || key === 'rank' ? 'asc' : 'desc');
    }
  };

  // Filter by team, then sort
  const sorted = useMemo(() => {
    let list = selectedTeam === 'All Teams' ? [...players] : players.filter(p => p.team === selectedTeam);

    list.sort((a, b) => {
      let cmp: number;
      if (sortKey === 'name') {
        cmp = a.name.localeCompare(b.name);
      } else {
        cmp = (a[sortKey] as number) - (b[sortKey] as number);
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return list;
  }, [players, selectedTeam, sortKey, sortDir]);

  return (
    <div className="dashboard dot-bg" style={{ opacity: 1 }}>
      <div className="dashboard-stack">

        {/* Nav bar */}
        <div style={{ display: 'flex', gap: '0.5em', marginBottom: '0.3em' }}>
          <button
            className="contact-btn"
            onClick={onBack}
            style={{ padding: '0.5em 1em', fontSize: '0.82em', display: 'flex', alignItems: 'center', gap: '0.4em' }}
          >
            <svg width="10" height="14" viewBox="0 0 10 14" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><polyline points="8,1 2,7 8,13" /></svg>
            BACK
          </button>
        </div>

        {/* Leaderboard Card */}
        <div className="card">
          <div className="card__container">
            <div className="card-titlebar">
              <span className="card-titlebar__text">LEADERBOARD</span>
            </div>

            {/* Team filter dropdown */}
            <div style={{ marginBottom: '0.8em' }}>
              <select
                value={selectedTeam}
                onChange={e => setSelectedTeam(e.target.value)}
                style={{
                  width: '100%',
                  background: 'var(--dark-black)',
                  color: 'var(--white-smoke)',
                  border: '1px solid var(--soft-black)',
                  borderRadius: '0.4em',
                  padding: '0.6em 0.8em',
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: '1em',
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                }}
              >
                <option value="All Teams">ALL TEAMS</option>
                {teamNames.map(t => (
                  <option key={t} value={t}>{t.toUpperCase()}</option>
                ))}
              </select>
            </div>

            {loading ? (
              <div style={{ color: 'var(--soft-black)', fontSize: '0.85em', padding: '1em 0', textAlign: 'center' }}>
                Loading leaderboard...
              </div>
            ) : sorted.length === 0 ? (
              <div style={{ color: 'var(--soft-black)', fontSize: '0.85em', padding: '1em 0', textAlign: 'center' }}>
                No players found
              </div>
            ) : (
              <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                <table style={{ minWidth: '32em', borderCollapse: 'separate', borderSpacing: 0, tableLayout: 'auto' }}>
                  <colgroup>
                    <col style={{ width: '2em' }} />
                    <col style={{ width: '6.5em' }} />
                    <col style={{ width: '3.5em' }} />
                    <col style={{ width: '3.2em' }} />
                    <col style={{ width: '2.6em' }} />
                    <col style={{ width: '3.5em' }} />
                    <col style={{ width: '2.8em' }} />
                  </colgroup>
                  <thead>
                    <tr style={{
                      fontSize: '0.7em',
                      fontWeight: 700,
                      letterSpacing: '0.08em',
                      color: 'var(--light-blue)',
                      textTransform: 'uppercase' as const,
                      borderBottom: '2px solid rgba(255,255,255,0.1)',
                    }}>
                      {/* Rank header — frozen */}
                      <th onClick={() => handleSort('rank')} style={{
                        ...thStyle, textAlign: 'left', cursor: 'pointer',
                        position: 'sticky', left: 0, zIndex: 2, background: '#25252f',
                      }}>
                        #<SortArrow active={sortKey === 'rank'} dir={sortDir} />
                      </th>
                      {/* Player header — frozen */}
                      <th onClick={() => handleSort('name')} style={{
                        ...thStyle, textAlign: 'left', cursor: 'pointer',
                        position: 'sticky', left: '2em', zIndex: 2, background: '#25252f',
                      }}>
                        PLAYER<SortArrow active={sortKey === 'name'} dir={sortDir} />
                      </th>
                      <th onClick={() => handleSort('avg')} style={{ ...thStyle, textAlign: 'right', cursor: 'pointer' }}>
                        AVG<SortArrow active={sortKey === 'avg'} dir={sortDir} />
                      </th>
                      <th onClick={() => handleSort('high')} style={{ ...thStyle, textAlign: 'right', cursor: 'pointer' }}>
                        HIGH<SortArrow active={sortKey === 'high'} dir={sortDir} />
                      </th>
                      <th onClick={() => handleSort('gamesPlayed')} style={{ ...thStyle, textAlign: 'right', cursor: 'pointer' }}>
                        GP<SortArrow active={sortKey === 'gamesPlayed'} dir={sortDir} />
                      </th>
                      <th onClick={() => handleSort('total')} style={{ ...thStyle, textAlign: 'right', cursor: 'pointer' }}>
                        TOTAL<SortArrow active={sortKey === 'total'} dir={sortDir} />
                      </th>
                      <th onClick={() => handleSort('stdDev')} style={{ ...thStyle, textAlign: 'right', cursor: 'pointer' }}>
                        STD<SortArrow active={sortKey === 'stdDev'} dir={sortDir} />
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sorted.map((p, i) => {
                      const medalColors = ['var(--yellow)', '#c0c0c0', '#cd7f32'];
                      const isTopThree = i < 3 && sortKey === 'rank' && sortDir === 'asc' && selectedTeam === 'All Teams';
                      const rankColor = isTopThree ? medalColors[i] : 'var(--smoke)';

                      return (
                        <tr
                          key={`${p.name}-${p.team}-${i}`}
                          style={{
                            borderBottom: i < sorted.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                          }}
                        >
                          {/* Rank — frozen */}
                          <td style={{
                            padding: '0.55em 0.3em', verticalAlign: 'middle',
                            color: rankColor, fontWeight: 900, fontSize: '1em',
                            position: 'sticky', left: 0, zIndex: 1, background: '#25252f',
                          }}>
                            {i + 1}
                          </td>
                          {/* Player — frozen */}
                          <td style={{
                            padding: '0.55em 0.3em', verticalAlign: 'middle',
                            position: 'sticky', left: '2em', zIndex: 1, background: '#25252f',
                          }}>
                            <div style={{
                              color: 'var(--white-smoke)',
                              fontWeight: 700,
                              fontSize: '0.95em',
                              lineHeight: 1.2,
                            }}>
                              {p.name}
                            </div>
                            <div style={{
                              color: 'var(--smoke)',
                              fontSize: '0.7em',
                              textTransform: 'uppercase',
                              letterSpacing: '0.06em',
                              lineHeight: 1.2,
                            }}>
                              {p.team}
                            </div>
                          </td>
                          <td style={{ padding: '0.55em 0.3em', textAlign: 'right', verticalAlign: 'middle', color: sortKey === 'avg' ? 'var(--yellow)' : 'var(--white-smoke)', fontWeight: 900, fontSize: '1em' }}>
                            {p.avg.toFixed(1)}
                          </td>
                          <td style={{ padding: '0.55em 0.3em', textAlign: 'right', verticalAlign: 'middle', color: sortKey === 'high' ? 'var(--yellow)' : 'var(--white-smoke)', fontWeight: 700, fontSize: '0.9em' }}>
                            {p.high || '—'}
                          </td>
                          <td style={{ padding: '0.55em 0.3em', textAlign: 'right', verticalAlign: 'middle', color: sortKey === 'gamesPlayed' ? 'var(--yellow)' : 'var(--smoke)', fontWeight: 700, fontSize: '0.9em' }}>
                            {p.gamesPlayed || '—'}
                          </td>
                          <td style={{ padding: '0.55em 0.3em', textAlign: 'right', verticalAlign: 'middle', color: sortKey === 'total' ? 'var(--yellow)' : 'var(--smoke)', fontWeight: 700, fontSize: '0.9em' }}>
                            {p.total || '—'}
                          </td>
                          <td style={{ padding: '0.55em 0.3em', textAlign: 'right', verticalAlign: 'middle', color: sortKey === 'stdDev' ? 'var(--yellow)' : 'var(--smoke)', fontWeight: 600, fontSize: '0.85em' }}>
                            {p.stdDev ? p.stdDev.toFixed(0) : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Summary stats */}
        {!loading && sorted.length > 0 && (
          <div className="card">
            <div className="card__container">
              <div className="card-titlebar">
                <span className="card-titlebar__text">
                  {selectedTeam === 'All Teams' ? 'LEAGUE STATS' : selectedTeam.toUpperCase() + ' STATS'}
                </span>
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: '0.8em',
                padding: '0.5em 0',
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: 'var(--smoke)', fontSize: '0.7em', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.3em' }}>PLAYERS</div>
                  <div style={{ color: 'var(--yellow)', fontSize: '1.4em', fontWeight: 900 }}>{sorted.length}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: 'var(--smoke)', fontSize: '0.7em', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.3em' }}>AVG</div>
                  <div style={{ color: 'var(--yellow)', fontSize: '1.4em', fontWeight: 900 }}>
                    {(sorted.reduce((s, p) => s + p.avg, 0) / sorted.length).toFixed(1)}
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: 'var(--smoke)', fontSize: '0.7em', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.3em' }}>HIGH</div>
                  <div style={{ color: 'var(--yellow)', fontSize: '1.4em', fontWeight: 900 }}>
                    {Math.max(...sorted.map(p => p.high || 0))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
