import { useState, useEffect, useMemo } from 'react';
import { SHEET_URLS } from '@/lib/constants';

interface LaneMatchup {
  lane: string;
  home: string;
  away: string;
}

interface TimeSlot {
  time: string;
  lanes: LaneMatchup[];
}

interface ScheduleWeek {
  week: string;
  date: string;
  slots: TimeSlot[];
}

interface SchedulePageProps {
  onBack: () => void;
  selectedTeamName: string;
  initialWeekIndex: number;
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

function parseScheduleCSV(csv: string): ScheduleWeek[] {
  const rows = csv.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const datePattern = /^\d{1,2}-[A-Za-z]{3}$/;

  // Check if horizontal format (dates in header row)
  const isHorizontal = rows.slice(0, 10).some(line =>
    line.split(',').some(cell => datePattern.test(cell.trim()))
  );

  if (isHorizontal) {
    return parseHorizontal(rows, datePattern);
  }
  return parseVertical(rows);
}

function parseHorizontal(rows: string[], datePattern: RegExp): ScheduleWeek[] {
  const weeks: ScheduleWeek[] = [];

  // Find the date header row
  let dateRowIdx = -1;
  let dateRow: string[] | null = null;
  for (let i = 0; i < rows.length; i++) {
    const cells = parseCSVLine(rows[i]).map(c => c.trim());
    if (cells.some(c => datePattern.test(c))) {
      dateRow = cells;
      dateRowIdx = i;
      break;
    }
  }
  if (!dateRow) return [];

  // Locate each week: date cell at column d → lane/time column at d−3
  const weekDefs: { date: string; laneCol: number }[] = [];
  for (let d = 0; d < dateRow.length; d++) {
    if (datePattern.test(dateRow[d]) && d >= 3) {
      weekDefs.push({ date: dateRow[d], laneCol: d - 3 });
    }
  }

  // Parse each week's time slots and lane matchups
  for (const { date, laneCol } of weekDefs) {
    const week: ScheduleWeek = { week: date, date, slots: [] };
    let currentSlot: TimeSlot | null = null;

    for (let i = dateRowIdx + 1; i < rows.length; i++) {
      const cells = parseCSVLine(rows[i]).map(c => c.trim());
      const label = cells[laneCol] || '';
      if (/^\d{1,2}:\d{2}$/.test(label)) {
        currentSlot = { time: label, lanes: [] };
        week.slots.push(currentSlot);
      } else if (/^lane\s*\d/i.test(label) && currentSlot) {
        const home = (cells[laneCol + 1] || '').trim();
        const away = (cells[laneCol + 3] || '').trim();
        if (home || away) {
          currentSlot.lanes.push({ lane: label, home, away });
        }
      }
    }
    if (week.slots.length > 0) weeks.push(week);
  }
  return weeks;
}

function parseVertical(rows: string[]): ScheduleWeek[] {
  const lines = rows.filter(l => l.trim());
  const weeks: ScheduleWeek[] = [];
  let currentWeek: ScheduleWeek | null = null;
  let currentSlot: TimeSlot | null = null;

  for (const line of lines) {
    const parts = line.split(',').map(p => p.trim());
    if (parts[0].toLowerCase().startsWith('week')) {
      currentWeek = { week: parts[0], date: (parts[1] || '').trim(), slots: [] };
      weeks.push(currentWeek);
      currentSlot = null;
    } else if (/^\d{1,2}:\d{2}$/.test(parts[0]) && currentWeek) {
      currentSlot = { time: parts[0], lanes: [] };
      currentWeek.slots.push(currentSlot);
    } else if (/^lane/i.test(parts[0]) && currentSlot) {
      currentSlot.lanes.push({ lane: parts[0], home: parts[1] || '', away: parts[3] || '' });
    }
  }
  return weeks;
}

/** Format "21-Jan" → "Jan 21" for display */
function formatWeekDate(dateStr: string): string {
  const m = dateStr.match(/^(\d{1,2})-([A-Za-z]{3})$/);
  if (!m) return dateStr;
  return `${m[2]} ${m[1]}`;
}

export default function SchedulePage({ onBack, selectedTeamName, initialWeekIndex }: SchedulePageProps) {
  const [weeks, setWeeks] = useState<ScheduleWeek[]>([]);
  const [loading, setLoading] = useState(true);
  const [weekIdx, setWeekIdx] = useState(initialWeekIndex);

  useEffect(() => {
    fetch(SHEET_URLS.schedule)
      .then(r => r.text())
      .then(csv => {
        const parsed = parseScheduleCSV(csv);
        setWeeks(parsed);
        // Clamp initialWeekIndex to available weeks
        if (initialWeekIndex >= parsed.length) {
          setWeekIdx(Math.max(0, parsed.length - 1));
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [initialWeekIndex]);

  const currentWeek = weeks[weekIdx] || null;
  const totalWeeks = weeks.length;

  const handlePrev = () => setWeekIdx(prev => Math.max(0, prev - 1));
  const handleNext = () => setWeekIdx(prev => Math.min(totalWeeks - 1, prev + 1));

  /** Check if a team name matches the user's selected team (case-insensitive) */
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

        {/* Schedule Card */}
        <div className="card">
          <div className="card__container">
            <div className="card-titlebar">
              <span className="card-titlebar__text">SCHEDULE</span>
            </div>

            {loading ? (
              <div style={{ color: 'var(--soft-black)', fontSize: '0.85em', padding: '1em 0', textAlign: 'center' }}>
                Loading schedule...
              </div>
            ) : totalWeeks === 0 ? (
              <div style={{ color: 'var(--soft-black)', fontSize: '0.85em', padding: '1em 0', textAlign: 'center' }}>
                No schedule data found
              </div>
            ) : (
              <>
                {/* Week selector */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '0.8em',
                  padding: '0.5em 0',
                }}>
                  <button
                    onClick={handlePrev}
                    disabled={weekIdx === 0}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: weekIdx === 0 ? 'var(--soft-black)' : 'var(--white-smoke)',
                      cursor: weekIdx === 0 ? 'default' : 'pointer',
                      padding: '0.4em',
                      fontSize: '1em',
                    }}
                  >
                    <svg width="10" height="14" viewBox="0 0 10 14" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><polyline points="8,1 2,7 8,13" /></svg>
                  </button>

                  <div style={{ textAlign: 'center' }}>
                    <div style={{
                      color: 'var(--yellow)',
                      fontSize: '1.1em',
                      fontWeight: 900,
                      letterSpacing: '0.06em',
                    }}>
                      WEEK {weekIdx + 1}
                    </div>
                    <div style={{
                      color: 'var(--smoke)',
                      fontSize: '0.75em',
                      letterSpacing: '0.08em',
                      marginTop: '0.15em',
                    }}>
                      {currentWeek ? formatWeekDate(currentWeek.date) : ''}
                    </div>
                  </div>

                  <button
                    onClick={handleNext}
                    disabled={weekIdx >= totalWeeks - 1}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: weekIdx >= totalWeeks - 1 ? 'var(--soft-black)' : 'var(--white-smoke)',
                      cursor: weekIdx >= totalWeeks - 1 ? 'default' : 'pointer',
                      padding: '0.4em',
                      fontSize: '1em',
                    }}
                  >
                    <svg width="10" height="14" viewBox="0 0 10 14" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><polyline points="2,1 8,7 2,13" /></svg>
                  </button>
                </div>

                {/* Time slots & matchups */}
                {currentWeek && currentWeek.slots.map((slot, si) => (
                  <div key={si} style={{ marginBottom: si < currentWeek.slots.length - 1 ? '1em' : 0 }}>
                    {/* Time header */}
                    <div style={{
                      color: 'var(--light-blue)',
                      fontSize: '0.72em',
                      fontWeight: 700,
                      letterSpacing: '0.14em',
                      textTransform: 'uppercase',
                      marginBottom: '0.4em',
                      paddingBottom: '0.3em',
                      borderBottom: '1px solid rgba(255,255,255,0.08)',
                    }}>
                      {slot.time}
                    </div>

                    {/* Lane matchup cards */}
                    {slot.lanes.map((lane, li) => {
                      const homeHighlight = isMyTeam(lane.home);
                      const awayHighlight = isMyTeam(lane.away);
                      const hasMyTeam = homeHighlight || awayHighlight;

                      return (
                        <div
                          key={li}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            padding: '0.55em 0.5em',
                            marginBottom: li < slot.lanes.length - 1 ? '0.3em' : 0,
                            borderRadius: '0.35em',
                            background: hasMyTeam
                              ? 'rgba(255, 204, 0, 0.08)'
                              : 'rgba(255,255,255,0.02)',
                            border: hasMyTeam
                              ? '1px solid rgba(255, 204, 0, 0.25)'
                              : '1px solid rgba(255,255,255,0.04)',
                          }}
                        >
                          {/* Lane number */}
                          <div style={{
                            color: 'var(--smoke)',
                            fontSize: '0.65em',
                            fontWeight: 700,
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase',
                            width: '3.5em',
                            flexShrink: 0,
                          }}>
                            {lane.lane.replace(/lane\s*/i, 'L')}
                          </div>

                          {/* Home team */}
                          <div style={{
                            flex: 1,
                            textAlign: 'right',
                            paddingRight: '0.5em',
                          }}>
                            <span style={{
                              color: homeHighlight ? 'var(--yellow)' : 'var(--white-smoke)',
                              fontWeight: homeHighlight ? 900 : 700,
                              fontSize: '0.88em',
                            }}>
                              {lane.home || '—'}
                            </span>
                          </div>

                          {/* VS divider */}
                          <div style={{
                            color: 'var(--soft-black)',
                            fontSize: '0.65em',
                            fontWeight: 700,
                            letterSpacing: '0.1em',
                            padding: '0 0.4em',
                            flexShrink: 0,
                          }}>
                            VS
                          </div>

                          {/* Away team */}
                          <div style={{
                            flex: 1,
                            textAlign: 'left',
                            paddingLeft: '0.5em',
                          }}>
                            <span style={{
                              color: awayHighlight ? 'var(--yellow)' : 'var(--white-smoke)',
                              fontWeight: awayHighlight ? 900 : 700,
                              fontSize: '0.88em',
                            }}>
                              {lane.away || '—'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
