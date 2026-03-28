import { formatBowlingDate } from '@/lib/constants';
import type { ScoringMode } from '@/hooks/useBowlingGame';

interface BottomBarProps {
  currentWeek: number;
  selectedDate: Date;
  scoringMode: ScoringMode;
  onChangeWeek: (delta: number) => void;
  onSetMode: (mode: ScoringMode) => void;
  onSaveWeek: () => void;
  onLockOrder: () => void;
  onReset: () => void;
}

export default function BottomBar({
  currentWeek, selectedDate, scoringMode,
  onChangeWeek, onSetMode, onSaveWeek, onLockOrder, onReset,
}: BottomBarProps) {
  return (
    <div className="bottom-bar">
      {/* Week + Date display with nav arrows */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4em', whiteSpace: 'nowrap' }}>
        <button className="week-nav-btn" onClick={() => onChangeWeek(-1)} title="Previous week" style={{ flexShrink: 0 }}>&#9664;</button>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', lineHeight: 1.3, minWidth: '5.5em', textAlign: 'center' }}>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '0.72em', fontWeight: 700, letterSpacing: '0.16em', color: 'var(--yellow)', textTransform: 'uppercase' }}>
            WEEK {currentWeek}
          </div>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '0.95em', fontWeight: 900, letterSpacing: '0.06em', color: 'var(--white-smoke)', textTransform: 'uppercase' }}>
            {formatBowlingDate(selectedDate)}
          </div>
        </div>
        <button className="week-nav-btn" onClick={() => onChangeWeek(1)} title="Next week" style={{ flexShrink: 0 }}>&#9654;</button>
      </div>

      <div className="bar-divider" />

      {/* Mode buttons */}
      <div style={{ display: 'flex', gap: '0.4em', flex: 1, minWidth: 0 }}>
        <button
          className={`mode-btn ${scoringMode === 'hcpcalc' ? 'active-hcpcalc' : ''}`}
          onClick={() => onSetMode('hcpcalc')}
        >
          HCP CALC
        </button>
        <button
          className={`mode-btn ${scoringMode === 'frame' ? 'active' : ''}`}
          onClick={() => onSetMode('frame')}
        >
          FRAME
        </button>
        <button
          className={`mode-btn ${scoringMode === 'endgame' ? 'active' : ''}`}
          onClick={() => onSetMode('endgame')}
        >
          END GAME
        </button>
      </div>

      <div className="bar-divider" />

      {/* Action buttons */}
      <button className="contact-btn" onClick={onSaveWeek} style={{ whiteSpace: 'nowrap', marginBottom: 0 }}>SAVE WEEK</button>
      <button className="cta-yellow-btn" onClick={onLockOrder} style={{ whiteSpace: 'nowrap' }}>LOCK ORDER</button>
      <button className="cta-red-btn" onClick={onReset} style={{ whiteSpace: 'nowrap' }}>RESET</button>
    </div>
  );
}
