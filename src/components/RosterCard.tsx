import type { Player } from '@/lib/types';

interface RosterCardProps {
  side: 'a' | 'b';
  teamName: string;
  roster: Player[];
  selectedPlayers: string[];
  onTogglePlayer: (name: string) => void;
}

export default function RosterCard({ side, teamName, roster, selectedPlayers, onTogglePlayer }: RosterCardProps) {
  const sideClass = side === 'a' ? 'side-a' : 'side-b';
  const accentColor = side === 'a' ? 'var(--red)' : 'var(--light-blue)';

  // Filter roster for this team
  const lower = teamName.toLowerCase().trim();
  let players = roster.filter(p => p.team === teamName);
  if (players.length === 0) {
    players = roster.filter(p => p.team.toLowerCase().trim() === lower);
  }

  return (
    <div className={`team-roster-card ${sideClass}`}>
      <div className="team-roster-header">
        <span className="team-name">{teamName ? teamName.toUpperCase() : side === 'a' ? 'TEAM A' : 'TEAM B'}</span>
        <span style={{ fontSize: '0.72em', color: accentColor, letterSpacing: '0.08em' }}>
          {selectedPlayers.length} / 3 selected
        </span>
      </div>

      <div className="roster-list">
        {!teamName ? (
          <div className="roster-empty">Select a team to load players</div>
        ) : players.length === 0 ? (
          <div className="roster-empty">No players found for {teamName}</div>
        ) : (
          players.map(p => {
            const isSelected = selectedPlayers.includes(p.name);
            return (
              <div
                key={p.name}
                className={`roster-player ${isSelected ? `selected-${side}` : ''}`}
                onClick={() => onTogglePlayer(p.name)}
              >
                <span className="rp-name">{p.name}</span>
                <span className="rp-stats">
                  <span className="rp-avg">AVG&nbsp;{Math.round(p.avg)}</span>
                  <span className="rp-hcp">+{p.handicap}</span>
                </span>
              </div>
            );
          })
        )}
      </div>

      <div style={{ padding: '0.4em 0.9em 0.6em', fontSize: '0.72em', letterSpacing: '0.08em', color: accentColor, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span>{selectedPlayers.length} / 3 selected</span>
        <div style={{ display: 'flex', gap: '0.3em' }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              width: '0.55em', height: '0.55em', borderRadius: '50%',
              background: i < selectedPlayers.length ? accentColor : 'var(--soft-black)',
              transition: 'background 0.15s',
            }} />
          ))}
        </div>
      </div>
    </div>
  );
}
