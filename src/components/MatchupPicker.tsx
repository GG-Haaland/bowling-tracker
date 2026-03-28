import { useState, useEffect } from 'react';
import type { WeekSchedule, TeamGame, Player } from '@/lib/types';

interface MatchupPickerProps {
  schedule: WeekSchedule;
  selectedTeamName: string;
  getTeamGames: (teamName: string, schedule: WeekSchedule) => TeamGame[];
  roster: Player[];
  onSelectGame: (game: TeamGame, gameIdx: number) => void;
  onTeamChange?: (teamName: string) => void;
}

export default function MatchupPicker({
  schedule,
  selectedTeamName,
  getTeamGames,
  roster,
  onSelectGame,
  onTeamChange,
}: MatchupPickerProps) {
  const [yourTeam, setYourTeam] = useState(selectedTeamName);
  const [games, setGames] = useState<TeamGame[]>([]);
  const [activeGameIdx, setActiveGameIdx] = useState<number | null>(null);

  // Get teams from schedule
  const teams = [...new Set(
    schedule.slots.flatMap(s => s.lanes.flatMap(l => [l.home, l.away]))
  )].filter(Boolean).sort();

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
    // Notify parent so YOUR TEAM card & WEEK RESULTS update too
    if (onTeamChange) {
      onTeamChange(team);
    }
  };

  const handleGameClick = (idx: number) => {
    setActiveGameIdx(idx);
    onSelectGame(games[idx], idx);
  };

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
            games.map((g, i) => (
              <button
                key={i}
                className={`game-select-btn ${activeGameIdx === i ? 'active' : ''}`}
                onClick={() => handleGameClick(i)}
              >
                <span style={{ color: 'var(--yellow)' }}>GAME {i + 1}</span>
                <span style={{ color: 'var(--smoke)', fontSize: '0.85em' }}>{g.lane}</span>
                <span style={{ color: 'var(--smoke)', fontSize: '0.85em' }}>{g.time}</span>
                <span style={{ color: 'var(--light-blue)' }}>vs {g.opponent}</span>
              </button>
            ))
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
