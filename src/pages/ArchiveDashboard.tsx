import type { SeasonConfig } from '@/lib/constants';

interface ArchiveDashboardProps {
  season: SeasonConfig;
  onNavigateLeaderboard: () => void;
  onNavigateStandings: () => void;
  onNavigateTeams: () => void;
  onBack: () => void;
}

export default function ArchiveDashboard({
  season,
  onNavigateLeaderboard,
  onNavigateStandings,
  onNavigateTeams,
  onBack,
}: ArchiveDashboardProps) {
  const btnStyle: React.CSSProperties = {
    width: '100%',
    padding: '1em',
    fontSize: '0.9em',
    fontWeight: 900,
    fontFamily: 'var(--font-heading)',
    letterSpacing: '0.15em',
    textTransform: 'uppercase',
    border: '2px solid var(--soft-black)',
    borderRadius: '0.4em',
    background: 'linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))',
    color: 'var(--mint)',
    cursor: 'pointer',
    transition: 'all 0.2s',
  };

  return (
    <div style={{
      maxWidth: '480px',
      margin: '0 auto',
      padding: '1.2em',
    }}>
      {/* Header */}
      <div className="card" style={{ marginBottom: '1em' }}>
        <div className="card__container">
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: '0.7em',
              fontWeight: 700,
              letterSpacing: '0.16em',
              color: 'var(--smoke)',
              textTransform: 'uppercase',
              marginBottom: '0.2em',
            }}>
              {season.label}
            </div>
            {season.champion && (
              <div style={{
                fontSize: '0.75em',
                fontWeight: 900,
                letterSpacing: '0.1em',
                color: 'var(--yellow)',
                textTransform: 'uppercase',
                textShadow: '-1px -1px 0 #8a6e00, 1px -1px 0 #8a6e00, -1px 1px 0 #8a6e00, 1px 1px 0 #8a6e00, 0 0 10px rgba(255,204,0,1), 0 0 20px rgba(255,204,0,0.9), 0 0 40px rgba(255,204,0,0.7), 0 0 60px rgba(255,204,0,0.5)',
              }}>
                Champions: {season.champion}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7em' }}>
        <button style={btnStyle} onClick={onNavigateLeaderboard}>
          LEADERBOARD
        </button>
        <button style={btnStyle} onClick={onNavigateStandings}>
          STANDINGS
        </button>
        <button style={btnStyle} onClick={onNavigateTeams}>
          TEAMS
        </button>
      </div>

      {/* Back button */}
      <div style={{ textAlign: 'center', marginTop: '1.2em' }}>
        <button
          onClick={onBack}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--smoke)',
            fontSize: '0.75em',
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            cursor: 'pointer',
            fontFamily: 'var(--font-body)',
          }}
        >
          &#9664; BACK
        </button>
      </div>
    </div>
  );
}
