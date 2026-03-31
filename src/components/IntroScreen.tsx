import type { CSSProperties } from 'react';
import { TEAM_NAMES, formatBowlingDate, isCurrentBowlingWeek } from '@/lib/constants';
import { DottedSurface } from '@/components/ui/dotted-surface';

interface IntroScreenProps {
  selectedTeamIndex: number;
  selectedDate: Date;
  currentWeek: number;
  loading: boolean;
  onChangeTeam: (delta: number) => void;
  onChangeWeek: (delta: number) => void;
  onEnter: () => void;
}

export default function IntroScreen({
  selectedTeamIndex,
  selectedDate,
  currentWeek,
  loading,
  onChangeTeam,
  onChangeWeek,
  onEnter,
}: IntroScreenProps) {
  const teamName = TEAM_NAMES[selectedTeamIndex];
  const weekLabel = isCurrentBowlingWeek(selectedDate) ? 'THIS WEEK' : `WEEK ${currentWeek}`;

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

        {/* Team selector */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '0.7em',
        }}>
          <button className="week-nav-btn" onClick={() => onChangeTeam(-1)} style={{ fontSize: '0.75em' }}>&#9664;</button>
          <div style={{ textAlign: 'center', flex: 1 }}>
            <div style={{
              fontSize: '0.72em',
              fontWeight: 700,
              letterSpacing: '0.16em',
              color: 'var(--yellow)',
              textTransform: 'uppercase',
            }}>
              YOUR TEAM
            </div>
            <div style={{
              fontSize: '0.85em',
              fontWeight: 900,
              color: 'var(--white-smoke)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}>
              {teamName.toUpperCase()}
            </div>
          </div>
          <button className="week-nav-btn" onClick={() => onChangeTeam(1)} style={{ fontSize: '0.75em' }}>&#9654;</button>
        </div>

        {/* Week / Date selector */}
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

        {/* Power button */}
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
      </div>

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
