import { useState, useEffect } from 'react';
import type { WeekSchedule, TeamGame, Player, StandingsEntry } from '@/lib/types';

interface MatchupPickerProps {
  schedule: WeekSchedule;
  selectedTeamName: string;
  getTeamGames: (teamName: string, schedule: WeekSchedule) => TeamGame[];
  roster: Player[];
  onSelectGame: (game: TeamGame, gameIdx: number) => void;
  onTeamChange?: (teamName: string) => void;
  standings?: StandingsEntry[];
}

function placeLabel(p: number): string {
  if (p === 1) return '1st';
  if (p === 2) return '2nd';
  if (p === 3) return '3rd';
  return p + 'th';
}

export default function MatchupPicker({
  schedule,
  selectedTeamName,
  getTeamGames,
  roster,
  onSelectGame,
  onTeamChange,
  standings = [],
}: MatchupPickerProps) {
  const [yourTeam, setYourTeam] = useState(selectedTeamName);
  const [games, setGames] = useState<TeamGame[]>([]);
  const [activeGameIdx, setActiveGameIdx] = useState<number | null>(null);

  // Get teams from schedule
  const teams = [...new Set(
    schedule.slots.flatMap(s => s.lanes.flatMap(l => [l.home, l.away]))
  )].filter(Boolean).sort();

  // Helper to find a team's standing
  const getRecord = (name: string) =>
    standings.find(s => s.team.toLowerCase() === name.toLowerCase()) || null;

  useEffect(() => {
    setYourTeam(selectedTeamName);
  }, [selectedTeamName]);

  useEffect(() => {
    if (yourTeam) {
      setGames(getTeamGames(yourTeam, schedule));
    } else {
      setGames([]);
    }
    setActiveGameIdx(null);
  }, [yourTeam, schedule, getTeamGames]);

  const handleTeamChange = (team: string) => {
    setYourTeam(team);
    setActiveGameIdx(null);
    if (onTeamChange) {
      onTeamChange(team);
    }
  };

  const handleGameClick = (idx: number) => {
    setActiveGameIdx(idx);
    onSelectGame(games[idx], idx);
  };

  const yourRecord = getRecord(yourTeam);

  return (
    <div className="card">
      <div className="card__container">
        <div className="card-titlebar">
          <span className="card-titlebar__text">MATCHUP PICKER</span>
        </div>

        {/* Team selector */}
        <div style={{ marginBottom: '0.7em' }}>
          <select
            value={yourTeam}
            onChange={e => handleTeamChange(e.target.value)}
            style={{
              width: '100%',
              padding: '0.5em 0.7em',
              background: 'var(--dark-black)',
              color: 'var(--white-smoke)',
              border: '1px solid var(--soft-black)',
              borderRadius: '0.35em',
              fontFamily: 'var(--font-main)',
              fontWeight: 700,
              fontSize: '0.9em',
              letterSpacing: '0.05em',
              cursor: 'pointer',
            }}
          >
            <option value="">— SELECT YOUR TEAM —</option>
            {teams.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          {/* Your team record */}
          {yourRecord && (
            <div style={{
              textAlign: 'center', marginTop: '0.35em',
              fontSize: '0.72em', color: 'var(--smoke)', letterSpacing: '0.05em',
            }}>
              <span style={{ color: 'var(--yellow)', fontWeight: 800 }}>
                {placeLabel(yourRecord.place)}
              </span>
              {' \u2022 '}
              <span style={{ fontWeight: 700 }}>
                {yourRecord.wins}-{yourRecord.losses}{yourRecord.ties > 0 ? '-' + yourRecord.ties : ''}
              </span>
            </div>
          )}
        </div>

        {/* Game buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35em' }}>
          {!yourTeam || games.length === 0 ? (
            <div style={{
              color: 'var(--soft-black)',
              fontSize: '0.8em',
              padding: '0.4em 0',
              fontFamily: 'var(--font-body)',
              fontWeight: 400,
            }}>
              {yourTeam ? 'No games scheduled this week' : 'Select your team above'}
            </div>
          ) : (
            games.map((g, i) => {
              const oppRecord = getRecord(g.opponent);
              return (
                <button
                  key={i}
                  className={`game-select-btn ${activeGameIdx === i ? 'active' : ''}`}
                  onClick={() => handleGameClick(i)}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', textAlign: 'left', gap: '0.15em' }}
                >
                  <div style={{ display: 'grid', gridTemplateColumns: '5.2em 4.5em 3.5em 1fr', alignItems: 'center' }}>
                    <span style={{ color: 'var(--yellow)', whiteSpace: 'nowrap' }}>GAME {i + 1}</span>
                    <span style={{ color: 'var(--smoke)', fontSize: '0.85em', textAlign: 'center' }}>{g.lane}</span>
                    <span style={{ color: 'var(--smoke)', fontSize: '0.85em', textAlign: 'center' }}>{g.time}</span>
                    <span style={{ color: 'var(--light-blue)', textAlign: 'right', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>vs {g.opponent}</span>
                  </div>
                  {oppRecord && (
                    <div style={{ textAlign: 'right', fontSize: '0.68em', color: 'var(--smoke)', letterSpacing: '0.04em' }}>
                      <span style={{ color: 'var(--light-blue)', fontWeight: 700 }}>
                        {placeLabel(oppRecord.place)}
                      </span>
                      {' \u2022 '}
                      <span style={{ fontWeight: 600 }}>
                        {oppRecord.wins}-{oppRecord.losses}{oppRecord.ties > 0 ? '-' + oppRecord.ties : ''}
                      </span>
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Current matchup display */}
        {activeGameIdx !== null && games[activeGameIdx] && (
          <div style={{ marginTop: '0.6em', textAlign: 'center', fontSize: '0.9em' }}>
            <span style={{ color: 'var(--red)' }}>{yourTeam}</span>
            &nbsp;<span style={{ color: 'var(--smoke)' }}>vs</span>&nbsp;
            <span style={{ color: 'var(--light-blue)' }}>{games[activeGameIdx].opponent}</span>
          </div>
        )}
      </div>
    </div>
  );
}
