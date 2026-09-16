import type { CSSProperties } from 'react';
import { formatBowlingDate, isCurrentBowlingWeek } from '@/lib/constants';
import type { SeasonConfig } from '@/lib/constants';
import { DottedSurface } from '@/components/ui/dotted-surface';

interface IntroScreenProps {
  selectedTeamIndex: number;
  selectedDate: Date;
  currentWeek: number;
  loading: boolean;
  onChangeTeam: (delta: number) => void;
  onChangeWeek: (delta: number) => void;
  onEnter: () => void;
  onPlayoffs: () => void;
  season: SeasonConfig;
  seasons: SeasonConfig[];
  onChangeSeason: (season: SeasonConfig) => void;
}

export default function IntroScreen({
  selectedTeamIndex,
  selectedDate,
  currentWeek,
  loading,
  onChangeTeam,
  onChangeWeek,
  onEnter,
  onPlayoffs,
  season,
  seasons,
  onChangeSeason,
}: IntroScreenProps) {
  const teamName = season.teamNames[selectedTeamIndex];
  const isThisWeek = isCurrentBowlingWeek(selectedDate);
  const weekLabel = isThisWeek ? 'THIS WEEK' : `WEEK ${currentWeek}`;

  const powerBtnStyle: CSSProperties = {
    opacity: loading ? 0.4 : 1,
    pointerEvents: loading ? 'none' : 'auto',
  };

  return (
    <div className="intro">
      {/* Three.js dotted wave background replaces the old dot-bg */}
      <DottedSurface />

      <div className="intro-badge">
        <div className="intro-screws">
          <ScrewIcon />
          <div className="dot-grid" />
          <ScrewIcon />
        </div>

        <div className="intro-screen-box">
          <img
            src="/apple-touch-icon.png"
            alt="A Bowling Club"
            style={{
              width: '180px',
              height: '180px',
              display: 'block',
              margin: '-60px auto 0.4em',
              position: 'relative',
              zIndex: 10,
            }}
          />
          <p>
            {loading ? 'Loading data...' : 'Select your team and week'}
          </p>
        </div>

        {/* Season toggle */}
        {seasons.length > 1 && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: '0.7em',
            gap: '0.35em',
          }}>
            {seasons.map(s => (
              <button
                key={s.id}
                onClick={() => onChangeSeason(s)}
                style={{
                  padding: '0.25em 0.65em',
                  fontSize: '0.62em',
                  fontWeight: 800,
                  fontFamily: 'var(--font-body)',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  borderRadius: '0.3em',
                  border: s.id === season.id ? '2px solid var(--yellow)' : '2px solid var(--soft-black)',
                  background: s.id === season.id ? 'rgba(255,204,0,0.15)' : 'rgba(0,0,0,0.3)',
                  color: s.id === season.id ? 'var(--yellow)' : 'var(--smoke)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {s.label}
              </button>
            ))}
          </div>
        )}

        {season.isArchive ? (
          <>
            {/* Archive: Champion display */}
            <div style={{ textAlign: 'center', marginBottom: '0.9em' }}>
              <div style={{
                fontSize: '0.72em',
                fontWeight: 700,
                letterSpacing: '0.16em',
                color: 'var(--yellow)',
                textTransform: 'uppercase',
                textShadow: '-1px -1px 0 #8a6e00, 1px -1px 0 #8a6e00, -1px 1px 0 #8a6e00, 1px 1px 0 #8a6e00',
              }}>
                CHAMPIONS
              </div>
              <div style={{
                fontSize: '1em',
                fontWeight: 900,
                color: 'var(--yellow)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                textShadow: '-1px -1px 0 #8a6e00, 1px -1px 0 #8a6e00, -1px 1px 0 #8a6e00, 1px 1px 0 #8a6e00, 0 0 10px rgba(255,204,0,1), 0 0 20px rgba(255,204,0,0.9), 0 0 40px rgba(255,204,0,0.7), 0 0 60px rgba(255,204,0,0.5), 0 0 80px rgba(255,204,0,0.3)',
              }}>
                {season.champion || ''}
              </div>
            </div>

            {/* Archive: Enter button */}
            <button
              className="power-btn"
              onClick={onEnter}
              disabled={loading}
              style={powerBtnStyle}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                <path d="M12 2v8" />
                <path d="M16.24 5.76a8 8 0 1 1-8.48 0" />
              </svg>
              <span className="click-bubble">CLICK</span>
            </button>
          </>
        ) : (
          <>
            {/* Live: Team dropdown */}
            <div style={{ marginBottom: '0.7em', textAlign: 'center' }}>
              <div style={{
                fontSize: '0.72em',
                fontWeight: 700,
                letterSpacing: '0.16em',
                color: 'var(--yellow)',
                textTransform: 'uppercase',
                textShadow: '-1px -1px 0 #8a6e00, 1px -1px 0 #8a6e00, -1px 1px 0 #8a6e00, 1px 1px 0 #8a6e00',
                marginBottom: '0.3em',
              }}>
                PICK YOUR TEAM
              </div>
              <select
                value={selectedTeamIndex}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  if (!isNaN(val)) onChangeTeam(val - selectedTeamIndex);
                }}
                style={{
                  width: '100%',
                  padding: '0.5em 0.6em',
                  fontSize: '0.82em',
                  fontWeight: 900,
                  fontFamily: 'var(--font-heading)',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'var(--white-smoke)',
                  background: 'var(--dark-bg)',
                  border: '2px solid var(--soft-black)',
                  borderRadius: '0.35em',
                  cursor: 'pointer',
                  appearance: 'none',
                  WebkitAppearance: 'none',
                  backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%23888\' stroke-width=\'3\'%3E%3Cpath d=\'M6 9l6 6 6-6\'/%3E%3C/svg%3E")',
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 0.6em center',
                  textAlign: 'center',
                }}
              >
                {season.teamNames.map((name, idx) => (
                  <option key={name} value={idx} style={{ textTransform: 'uppercase' }}>
                    {name.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            {/* Live: Week / Date selector */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '0.9em',
            }}>
              <button className="week-nav-btn" onClick={() => onChangeWeek(-1)} style={{ fontSize: '0.75em' }}>&#9664;</button>
              <div style={{ textAlign: 'center', flex: 1 }}>
                <div style={{
                  fontSize: '0.72em',
                  fontWeight: 700,
                  letterSpacing: '0.16em',
                  color: 'var(--yellow)',
                  textShadow: isThisWeek
                    ? '-1px -1px 0 #8a6e00, 1px -1px 0 #8a6e00, -1px 1px 0 #8a6e00, 1px 1px 0 #8a6e00, 0 0 10px rgba(255,204,0,1), 0 0 20px rgba(255,204,0,0.9), 0 0 40px rgba(255,204,0,0.7), 0 0 60px rgba(255,204,0,0.5), 0 0 80px rgba(255,204,0,0.3)'
                    : '-1px -1px 0 #8a6e00, 1px -1px 0 #8a6e00, -1px 1px 0 #8a6e00, 1px 1px 0 #8a6e00',
                }}>
                  {weekLabel}
                </div>
                <div style={{
                  fontSize: '0.95em',
                  fontWeight: 900,
                  color: 'var(--white-smoke)',
                  letterSpacing: '0.06em',
                }}>
                  {formatBowlingDate(selectedDate)}
                </div>
              </div>
              <button className="week-nav-btn" onClick={() => onChangeWeek(1)} style={{ fontSize: '0.75em' }}>&#9654;</button>
            </div>

            {/* Live: Power button */}
            <button
              className="power-btn"
              onClick={onEnter}
              disabled={loading}
              style={powerBtnStyle}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                <path d="M12 2v8" />
                <path d="M16.24 5.76a8 8 0 1 1-8.48 0" />
              </svg>
              <span className="click-bubble">CLICK</span>
            </button>
          </>
        )}
      </div>

      {/* Playoffs button below the badge */}
      <button
        className="contact-btn"
        onClick={onPlayoffs}
        style={{
          marginTop: '1em',
          padding: '0.7em 1.5em',
          fontSize: '0.85em',
          letterSpacing: '0.15em',
          fontWeight: 900,
        }}
      >
        PLAYOFFS
      </button>

      <div className="intro-hint">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
          <path d="M12 8v4m0 4h.01" />
        </svg>
        LIVE DATA FROM GOOGLE SHEETS
      </div>
    </div>
  );
}

function ScrewIcon() {
  return (
    <svg className="screw" viewBox="0 0 24 24" fill="currentColor">
      <circle cx={12} cy={12} r={10} fill="none" stroke="currentColor" strokeWidth={2} />
      <line x1={8} y1={12} x2={16} y2={12} stroke="currentColor" strokeWidth={2} />
    </svg>
  );
}
