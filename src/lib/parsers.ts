import type { Player, TeamPlayer, TeamData, GameRow, WeekSchedule, TimeSlot, StandingsEntry, TopScore } from './types';

// ── CSV Line Parser (handles quoted fields with embedded commas) ────────────

export function parseCSVLine(line: string): string[] {
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

// ── Roster / Leaderboard CSV ────────────────────────────────────────────────

export function parseRosterCSV(csv: string): Player[] {
  const lines = csv.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim().split('\n');
  if (lines.length < 2) return [];

  let headerIdx = -1;
  for (let i = 0; i < Math.min(lines.length, 10); i++) {
    const lower = lines[i].toLowerCase();
    const hasNameOrPlayer = lower.includes('player') || lower.includes('name');
    const hasTeam = lower.includes('team');
    const hasAvg = lower.includes('avg') || lower.includes('average');
    if (hasNameOrPlayer && hasTeam && hasAvg) { headerIdx = i; break; }
  }
  if (headerIdx === -1) return [];

  const header = lines[headerIdx].split(',').map(h => h.trim().toLowerCase().replace(/[^a-z]/g, ''));
  const nameIdx = header.findIndex(h => h === 'player' || h === 'name' || h.includes('player') || h.includes('name'));
  const teamIdx = header.findIndex(h => h.includes('team'));
  const avgIdx  = header.findIndex(h => h.startsWith('avg') || h === 'average');
  if (nameIdx === -1 || avgIdx === -1) return [];

  return lines.slice(headerIdx + 1).filter(l => l.trim()).map(line => {
    const parts = parseCSVLine(line);
    const name  = (parts[nameIdx] || '').trim();
    const team  = teamIdx >= 0 ? (parts[teamIdx] || '').trim() : '';
    const avg   = avgIdx >= 0 ? (parseFloat(parts[avgIdx]) || 0) : 0;
    const handicap = Math.max(0, Math.floor((200 - avg) * 0.70));
    return { name, team, avg, handicap };
  }).filter(p =>
    p.name &&
    p.avg > 0 &&
    !/ghost\s*team/i.test(p.name)
  );
}

// ── Team Tab CSV ────────────────────────────────────────────────────────────

export function parseTeamTab(csv: string): TeamData | null {
  const rows = csv.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')
                  .map(r => parseCSVLine(r));
  if (rows.length < 2) return null;

  // Find header row — col[1] = 'Week'
  let hdrIdx = -1;
  for (let i = 0; i < Math.min(8, rows.length); i++) {
    if ((rows[i][1] || '').trim().toLowerCase() === 'week') { hdrIdx = i; break; }
  }
  if (hdrIdx < 0) return null;

  const hdr = rows[hdrIdx];
  const playerCols: { name: string; col: number }[] = [];
  for (let c = 6; c < hdr.length; c++) {
    const h = (hdr[c] || '').trim();
    if (!h || /^sub\s*\d/i.test(h) || /^w\/l/i.test(h)) break;
    playerCols.push({ name: h, col: c });
  }

  const wltCol = hdr.findIndex((h, i) => i > 5 && /^w\/l/i.test((h || '').trim()));

  const gameRows: GameRow[] = [];
  let statsStart = -1;
  let lastWeekNum = 0;
  for (let i = hdrIdx + 1; i < rows.length; i++) {
    const row = rows[i];
    const label5 = (row[5] || '').trim();
    if (/^(total|average|handicap|high|std\s*dev)/i.test(label5)) { statsStart = i; break; }
    let wk = parseInt(row[1]);
    if (isNaN(wk)) {
      if (lastWeekNum > 0 && label5 && !/^(bye|open|byes?)\s*$/i.test(label5)) {
        wk = lastWeekNum;
      } else {
        continue;
      }
    } else {
      lastWeekNum = wk;
    }
    const scores: Record<string, number | null> = {};
    playerCols.forEach(p => {
      const v = parseInt((row[p.col] || '').replace(/[^0-9]/g, ''));
      scores[p.name] = isNaN(v) || v === 0 ? null : v;
    });
    gameRows.push({
      weekNum:  wk,
      date:     (row[2] || '').trim(),
      time:     (row[3] || '').trim(),
      lane:     (row[4] || '').trim(),
      opponent: label5,
      scores,
      wlt: wltCol >= 0 ? (row[wltCol] || '').trim() : '',
    });
  }

  // Parse stats section
  const statRows: Record<string, Record<string, number | null>> = {};
  if (statsStart >= 0) {
    for (let i = statsStart; i < rows.length; i++) {
      const row = rows[i];
      const label = (row[5] || '').trim();
      if (!label) continue;
      const vals: Record<string, number | null> = {};
      playerCols.forEach(p => {
        const raw = (row[p.col] || '').replace(/,/g, '').trim();
        const v = parseFloat(raw);
        vals[p.name] = isNaN(v) ? null : v;
      });
      statRows[label] = vals;
    }
  }

  const players: TeamPlayer[] = playerCols.map(p => ({
    name:        p.name,
    avg:         statRows['Average']?.[p.name]  ?? 0,
    handicap:    statRows['Handicap']?.[p.name] ?? 0,
    high:        statRows['High']?.[p.name]     ?? 0,
    stdDev:      statRows['Std Dev']?.[p.name]  ?? 0,
    gamesPlayed: statRows['# Played']?.[p.name] ?? 0,
    prevAvg:     statRows['Previous Average']?.[p.name] ?? 0,
  }));

  return {
    teamName: (rows[0][0] || '').trim(),
    players,
    weeks: gameRows,
  };
}

// ── Handicap Sheet Overlay ──────────────────────────────────────────────────

export function applyHandicapSheet(csv: string, roster: Player[]): number {
  const lines = csv.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim().split('\n');
  let count = 0;

  lines.forEach(line => {
    if (!line.trim()) return;
    const parts = parseCSVLine(line);
    for (let col = 0; col + 1 < parts.length; col += 3) {
      const name = (parts[col] || '').trim();
      const hcp  = parseInt((parts[col + 1] || '').trim(), 10);
      if (!name || isNaN(hcp)) continue;
      const player = roster.find(p => p.name.toLowerCase() === name.toLowerCase());
      if (player) {
        player.handicap = hcp;
        count++;
      }
    }
  });
  return count;
}

// ── Standings CSV ───────────────────────────────────────────────────────────

export function parseStandingsCSV(csv: string): { avgMap: Record<string, number>; entries: StandingsEntry[] } {
  const lines = csv.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter(l => l.trim());
  if (lines.length < 2) return { avgMap: {}, entries: [] };

  const header = parseCSVLine(lines[0]).map(h => h.trim().toLowerCase());
  const teamIdx     = header.findIndex(h => h === 'team');
  const avgGameIdx  = header.findIndex(h => h === 'avg.');
  const placeIdx    = header.findIndex(h => h === 'place');
  const winPctIdx   = header.findIndex(h => h === 'avg');     // "Avg" = win pct
  const winsIdx     = header.findIndex(h => h === 'w');
  const lossesIdx   = header.findIndex(h => h === 'l');
  const tiesIdx     = header.findIndex(h => h === 't');
  const playedIdx   = header.findIndex(h => h === '# played');
  const stdDevIdx   = header.findIndex(h => h === 'std. d');
  const totalIdx    = header.findIndex(h => h === 'total');
  const eligibleIdx = header.findIndex(h => h === 'playoff eligible');

  if (teamIdx === -1) return { avgMap: {}, entries: [] };

  const avgMap: Record<string, number> = {};
  const entries: StandingsEntry[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    const team = (cols[teamIdx] || '').trim();
    if (!team) continue;

    const avg = avgGameIdx >= 0 ? parseInt((cols[avgGameIdx] || '').replace(/[^0-9]/g, '')) : 0;
    if (!isNaN(avg) && avg > 0) avgMap[team] = avg;

    entries.push({
      place:           placeIdx >= 0 ? parseInt(cols[placeIdx]) || 0 : i,
      team,
      winPct:          winPctIdx >= 0 ? parseFloat(cols[winPctIdx]) || 0 : 0,
      wins:            winsIdx >= 0 ? parseInt(cols[winsIdx]) || 0 : 0,
      losses:          lossesIdx >= 0 ? parseInt(cols[lossesIdx]) || 0 : 0,
      ties:            tiesIdx >= 0 ? parseInt(cols[tiesIdx]) || 0 : 0,
      gamesPlayed:     playedIdx >= 0 ? parseInt(cols[playedIdx]) || 0 : 0,
      avg:             !isNaN(avg) ? avg : 0,
      stdDev:          stdDevIdx >= 0 ? parseFloat(cols[stdDevIdx]) || 0 : 0,
      total:           totalIdx >= 0 ? parseInt((cols[totalIdx] || '').replace(/[^0-9]/g, '')) || 0 : 0,
      playoffEligible: eligibleIdx >= 0 ? (cols[eligibleIdx] || '').trim() : '',
    });
  }

  return { avgMap, entries };
}

// ── Schedule CSV — Horizontal (live Google Sheet) ───────────────────────────

function parseScheduleCSVHorizontal(csv: string): WeekSchedule[] {
  const rows = csv.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const datePattern = /^\d{1,2}-[A-Za-z]{3}$/;
  const weeks: WeekSchedule[] = [];

  let dateRowIdx = -1;
  let dateRow: string[] | null = null;
  for (let i = 0; i < rows.length; i++) {
    const cells = parseCSVLine(rows[i]).map(c => c.trim());
    if (cells.some(c => datePattern.test(c))) { dateRow = cells; dateRowIdx = i; break; }
  }
  if (!dateRow) return [];

  const weekDefs: { date: string; laneCol: number }[] = [];
  for (let d = 0; d < dateRow.length; d++) {
    if (datePattern.test(dateRow[d]) && d >= 3) {
      weekDefs.push({ date: dateRow[d], laneCol: d - 3 });
    }
  }

  for (const { date, laneCol } of weekDefs) {
    const week: WeekSchedule = { week: date, date, slots: [] };
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
        if (home || away) currentSlot.lanes.push({ lane: label, home, away });
      }
    }
    if (week.slots.length > 0) weeks.push(week);
  }
  return weeks;
}

// ── Schedule CSV — Vertical (fallback) ──────────────────────────────────────

function parseScheduleCSVVertical(csv: string): WeekSchedule[] {
  const lines = csv.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim().split('\n');
  const weeks: WeekSchedule[] = [];
  let currentWeek: WeekSchedule | null = null;
  let currentSlot: TimeSlot | null = null;

  for (const line of lines) {
    if (!line.trim()) continue;
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

/** Auto-detects format and routes to the correct parser */
export function parseScheduleCSV(csv: string): WeekSchedule[] {
  const datePattern = /\d{1,2}-[A-Za-z]{3}/;
  const isHorizontal = csv.split('\n').slice(0, 10).some(line =>
    line.split(',').some(cell => datePattern.test(cell.trim()))
  );
  return isHorizontal ? parseScheduleCSVHorizontal(csv) : parseScheduleCSVVertical(csv);
}
