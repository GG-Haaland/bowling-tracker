import { useState, useEffect, useMemo } from 'react';
import { SHEET_URLS } from '@/lib/constants';

/** A single team row from the Standings tab */
interface StandingsTeam {
  place: number;
  team: string;
  wins: number;
  losses: number;
  ties: number;
  pct: number;         // win percentage (0–1)
  gamesPlayed: number; // "# Played"
  avgGame: number;     // team avg game (the "Avg." column with period)
  stdDev: number;      // "Std. D"
  total: number;       // total pins
  playoffEligible: string;
}

type SortKey = keyof Omit<StandingsTeam, 'team' | 'playoffEligible'> | 'team';
type SortDir = 'asc' | 'desc';

interface StandingsPageProps {
  onBack: () => void;
  selectedTeamName: string;
}

/* ── CSV helpers ─────────────────────────────────────────────── */

/**
 * Full multiline-aware CSV parser.
 * Splits on commas respecting quoted fields that may contain newlines.
 */
function parseCSVRows(csv: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuotes = false;

  for (let i = 0; i < csv.length; i++) {
    const ch = csv[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < csv.length && csv[i + 1] === '"') {
          cell += '"';
          i++; // skip escaped quote
        } else {
          inQuotes = false;
        }
      } else {
        cell += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        row.push(cell.trim());
        cell = '';
      } else if (ch === '\n' || ch === '\r') {
        if (ch === '\r' && i + 1 < csv.length && csv[i + 1] === '\n') i++;
        row.push(cell.trim());
        if (row.some(c => c !== '')) rows.push(row);
        row = [];
        cell = '';
      } else {
        cell += ch;
      }
    }
  }
  // Flush last row
  row.push(cell.trim());
  if (row.some(c => c !== '')) rows.push(row);

  return rows;
}

/** Column descriptor used by the flexible header mapper */
interface ColDef {
  key: SortKey;
  label: string;
  match: (h: string) => boolean;
  parse: (v: string) => number;
  format: (v: number) => string;
  width: string;
  align: 'left' | 'right';
  defaultDir: SortDir;
}

const NUM = (v: string) => parseFloat(v.replace(/[^0-9.\-]/g, '')) || 0;
const INT = (v: string) => parseInt(v.replace(/[^0-9\-]/g, '')) || 0;

const COLUMN_DEFS: ColDef[] = [
  {
    key: 'place', label: '#', width: '2em', align: 'left', defaultDir: 'asc',
    match: h => /^(place|rank|pos|#)$/.test(h),
    parse: INT, format: v => String(v),
  },
  {
    key: 'wins', label: 'W', width: '2.4em', align: 'right', defaultDir: 'desc',
    match: h => /^(wins?|w)$/.test(h),
    parse: INT, format: v => String(v),
  },
  {
    key: 'losses', label: 'L', width: '2.4em', align: 'right', defaultDir: 'asc',
    match: h => /^(loss(es)?|l)$/.test(h),
    parse: INT, format: v => String(v),
  },
  {
    key: 'ties', label: 'T', width: '2em', align: 'right', defaultDir: 'desc',
    match: h => /^(ties?|t)$/.test(h),
    parse: INT, format: v => String(v),
  },
  {
    key: 'pct', label: 'PCT', width: '3.2em', align: 'right', defaultDir: 'desc',
    // "Avg" (no period) in the sheet is actually win percentage
    match: h => /^(avg|pct|win\s*%|percentage|%)$/.test(h),
    parse: NUM, format: v => {
      if (v >= 1) return v.toFixed(0) + '%';
      return (v * 100).toFixed(0) + '%';
    },
  },
  {
    key: 'gamesPlayed', label: 'GP', width: '2.4em', align: 'right', defaultDir: 'desc',
    match: h => /^(#\s*played|games?\s*played|gp)$/.test(h),
    parse: INT, format: v => String(v),
  },
  {
    key: 'avgGame', label: 'AVG.', width: '3.2em', align: 'right', defaultDir: 'desc',
    // "Avg." (with period) = team game average
    match: h => h === 'avg.',
    parse: INT, format: v => v ? String(v) : '—',
  },
  {
    key: 'stdDev', label: 'SD', width: '2.4em', align: 'right', defaultDir: 'asc',
    match: h => /^(std\.?\s*d|std\.?\s*dev|sd)$/.test(h),
    parse: INT, format: v => v ? String(v) : '—',
  },
  {
    key: 'total', label: 'TOT', width: '3.5em', align: 'right', defaultDir: 'desc',
    match: h => /^total$/.test(h),
    parse: (v: string) => parseInt(v.replace(/[^0-9]/g, '')) || 0,
    format: v => v ? v.toLocaleString() : '—',
  },
];

/** Parse the Standings CSV into typed rows + detect which columns are present */
function parseStandingsCSV(csv: string): { teams: StandingsTeam[]; presentCols: ColDef[] } {
  const allRows = parseCSVRows(csv);
  if (allRows.length < 2) return { teams: [], presentCols: [] };

  // Find header row (first row that contains "team")
  let headerIdx = 0;
  for (let i = 0; i < Math.min(allRows.length, 8); i++) {
    if (allRows[i].some(c => /^team$/i.test(c))) { headerIdx = i; break; }
  }

  const header = allRows[headerIdx].map(h => h.toLowerCase().replace(/[^a-z0-9.%# ]/g, ''));

  // Find team name column
  const teamColIdx = header.findIndex(h => h === 'team');
  if (teamColIdx === -1) return { teams: [], presentCols: [] };

  // Map each ColDef to its CSV column index (if present)
  // Special handling: "avg." (with period) = avgGame, "avg" (no period) = win pct
  const colMap: { def: ColDef; csvIdx: number }[] = [];
  const usedIndices = new Set<number>();

  // First pass: exact "avg." match for avgGame
  for (const def of COLUMN_DEFS) {
    if (def.key === 'avgGame') {
      const idx = header.findIndex((h, i) => h === 'avg.' && !usedIndices.has(i));
      if (idx !== -1) { colMap.push({ def, csvIdx: idx }); usedIndices.add(idx); }
    }
  }

  // Second pass: everything else
  for (const def of COLUMN_DEFS) {
    if (def.key === 'avgGame' && colMap.some(c => c.def.key === 'avgGame')) continue;
    const idx = header.findIndex((h, i) => !usedIndices.has(i) && i !== teamColIdx && def.match(h));
    if (idx !== -1) { colMap.push({ def, csvIdx: idx }); usedIndices.add(idx); }
  }

  // Parse data rows
  const teams: StandingsTeam[] = [];
  for (let i = headerIdx + 1; i < allRows.length; i++) {
    const cols = allRows[i];
    const teamName = (cols[teamColIdx] || '').trim();
    // Skip empty rows, ghost teams, and non-data rows
    if (!teamName || /ghost\s*team/i.test(teamName)) continue;
    // Skip rows where Place column isn't a number (junk rows from extra sheet content)
    const placeCol = colMap.find(c => c.def.key === 'place');
    if (placeCol) {
      const placeVal = (cols[placeCol.csvIdx] || '').trim();
      if (!placeVal || isNaN(parseInt(placeVal))) continue;
    }

    const row: any = {
      place: 0, team: teamName, wins: 0, losses: 0, ties: 0,
      pct: 0, gamesPlayed: 0, avgGame: 0, stdDev: 0, total: 0,
      playoffEligible: '',
    };

    for (const { def, csvIdx } of colMap) {
      row[def.key] = def.parse(cols[csvIdx] || '');
    }

    // Grab playoff eligible string if present
    const peIdx = header.findIndex(h => /playoff/i.test(h));
    if (peIdx !== -1) row.playoffEligible = (cols[peIdx] || '').trim();

    // Auto-assign place if not in CSV
    if (!row.place) row.place = teams.length + 1;

    teams.push(row as StandingsTeam);
  }

  // Sort colMap to match COLUMN_DEFS order for display
  const presentCols = COLUMN_DEFS.filter(d => colMap.some(c => c.def.key === d.key));

  return { teams, presentCols };
}

/* ── Sort Arrow ──────────────────────────────────────────────── */

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

/* ── Component ───────────────────────────────────────────────── */

export default function StandingsPage({ onBack, selectedTeamName }: StandingsPageProps) {
  const [allTeams, setAllTeams] = useState<StandingsTeam[]>([]);
  const [presentCols, setPresentCols] = useState<ColDef[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState('All Teams');
  const [sortKey, setSortKey] = useState<SortKey>('place');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  useEffect(() => {
    fetch(SHEET_URLS.standings)
      .then(r => r.text())
      .then(csv => {
        const { teams, presentCols: cols } = parseStandingsCSV(csv);
        setAllTeams(teams);
        // Hide ties column if all values are 0
        const hasTies = teams.some(t => t.ties > 0);
        setPresentCols(hasTies ? cols : cols.filter(c => c.key !== 'ties'));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const teamNames = useMemo(() => {
    return [...new Set(allTeams.map(t => t.team).filter(Boolean))].sort();
  }, [allTeams]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(prev => prev === 'desc' ? 'asc' : 'desc');
    } else {
      setSortKey(key);
      const def = COLUMN_DEFS.find(d => d.key === key);
      setSortDir(key === 'team' ? 'asc' : (def?.defaultDir ?? 'desc'));
    }
  };

  const sorted = useMemo(() => {
    let list = selectedTeam === 'All Teams'
      ? [...allTeams]
      : allTeams.filter(t => t.team === selectedTeam);

    list.sort((a, b) => {
      let cmp: number;
      if (sortKey === 'team') {
        cmp = a.team.localeCompare(b.team);
      } else {
        cmp = (a[sortKey] as number) - (b[sortKey] as number);
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [allTeams, selectedTeam, sortKey, sortDir]);

  /** Is this the user's selected team? */
  const isMyTeam = (name: string) =>
    name.toLowerCase() === selectedTeamName.toLowerCase();

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

        {/* Standings Card */}
        <div className="card">
          <div className="card__container">
            <div className="card-titlebar">
              <span className="card-titlebar__text">STANDINGS</span>
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
                Loading standings...
              </div>
            ) : sorted.length === 0 ? (
              <div style={{ color: 'var(--soft-black)', fontSize: '0.85em', padding: '1em 0', textAlign: 'center' }}>
                No teams found
              </div>
            ) : (
              <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                <table style={{ minWidth: '36em', borderCollapse: 'separate', borderSpacing: 0, tableLayout: 'auto' }}>
                  <colgroup>
                    {/* Place column */}
                    {presentCols.some(c => c.key === 'place') && <col style={{ width: '2em' }} />}
                    {/* Team name column — generous min so it never gets crushed */}
                    <col style={{ minWidth: '10em' }} />
                    {/* Stat columns */}
                    {presentCols.filter(c => c.key !== 'place').map(c => (
                      <col key={c.key} style={{ width: c.width }} />
                    ))}
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
                      {/* Place header — frozen */}
                      {presentCols.some(c => c.key === 'place') && (
                        <th onClick={() => handleSort('place')} style={{
                          ...thStyle, textAlign: 'left', cursor: 'pointer',
                          position: 'sticky', left: 0, zIndex: 2,
                          background: '#25252f',
                        }}>
                          #<SortArrow active={sortKey === 'place'} dir={sortDir} />
                        </th>
                      )}

                      {/* Team header — frozen */}
                      <th onClick={() => handleSort('team')} style={{
                        ...thStyle, textAlign: 'left', cursor: 'pointer',
                        position: 'sticky', left: presentCols.some(c => c.key === 'place') ? '2em' : 0, zIndex: 2,
                        background: '#25252f',
                      }}>
                        TEAM<SortArrow active={sortKey === 'team'} dir={sortDir} />
                      </th>

                      {/* Stat headers */}
                      {presentCols.filter(c => c.key !== 'place').map(c => (
                        <th
                          key={c.key}
                          onClick={() => handleSort(c.key)}
                          style={{ ...thStyle, textAlign: c.align, cursor: 'pointer' }}
                        >
                          {c.label}<SortArrow active={sortKey === c.key} dir={sortDir} />
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {sorted.map((t, i) => {
                      const highlighted = isMyTeam(t.team);
                      const medalColors = ['var(--yellow)', '#c0c0c0', '#cd7f32'];
                      const isTopThree = i < 3 && sortKey === 'place' && sortDir === 'asc' && selectedTeam === 'All Teams';
                      const placeColor = isTopThree ? medalColors[i] : 'var(--smoke)';

                      return (
                        <tr
                          key={`${t.team}-${i}`}
                          style={{
                            borderBottom: i < sorted.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                            background: highlighted ? 'rgba(255, 204, 0, 0.06)' : 'transparent',
                          }}
                        >
                          {/* Place — frozen */}
                          {presentCols.some(c => c.key === 'place') && (
                            <td style={{
                              padding: '0.55em 0.3em', verticalAlign: 'middle',
                              color: placeColor, fontWeight: 900, fontSize: '1em',
                              position: 'sticky', left: 0, zIndex: 1,
                              background: highlighted ? '#29272a' : '#25252f',
                            }}>
                              {t.place}
                            </td>
                          )}

                          {/* Team name — frozen */}
                          <td style={{
                            padding: '0.55em 0.3em', verticalAlign: 'middle',
                            position: 'sticky', left: presentCols.some(c => c.key === 'place') ? '2em' : 0, zIndex: 1,
                            background: highlighted ? '#29272a' : '#25252f',
                          }}>
                            <div style={{
                              color: highlighted ? 'var(--yellow)' : 'var(--white-smoke)',
                              fontWeight: highlighted ? 900 : 700,
                              fontSize: '0.92em',
                              whiteSpace: 'nowrap',
                            }}>
                              {t.team}
                            </div>
                          </td>

                          {/* Stat cells */}
                          {presentCols.filter(c => c.key !== 'place').map(c => (
                            <td
                              key={c.key}
                              style={{
                                padding: '0.55em 0.3em',
                                textAlign: c.align,
                                verticalAlign: 'middle',
                                color: sortKey === c.key ? 'var(--yellow)' : 'var(--white-smoke)',
                                fontWeight: sortKey === c.key ? 900 : 700,
                                fontSize: '0.9em',
                              }}
                            >
                              {c.format(t[c.key as keyof StandingsTeam] as number)}
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
