import { formatBowlingDate, isCurrentBowlingWeek } from '@/lib/constants';

interface WeekSelectorProps {
  currentWeek: number;
  selectedDate: Date;
  onChangeWeek: (delta: number) => void;
}

export default function WeekSelector({ currentWeek, selectedDate, onChangeWeek }: WeekSelectorProps) {
  const isThisWeek = isCurrentBowlingWeek(selectedDate);
  const weekLabel = isThisWeek ? 'THIS WEEK' : `WEEK ${currentWeek}`;

  return (
    <div className="card">
      <div className="card__container" style={{ padding: '0.8em 1em' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.8em',
        }}>
          <button
            className="week-nav-btn"
            onClick={() => onChangeWeek(-1)}
            title="Previous week"
          >
            &#9664;
          </button>

          <div style={{ textAlign: 'center', minWidth: '8em' }}>
            <div style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: '0.75em',
              fontWeight: 700,
              letterSpacing: '0.16em',
              color: 'var(--yellow)',
              textTransform: 'uppercase',
              textShadow: isThisWeek
                ? '-1px -1px 0 #8a6e00, 1px -1px 0 #8a6e00, -1px 1px 0 #8a6e00, 1px 1px 0 #8a6e00, 0 0 10px rgba(255,204,0,1), 0 0 20px rgba(255,204,0,0.9), 0 0 40px rgba(255,204,0,0.7), 0 0 60px rgba(255,204,0,0.5), 0 0 80px rgba(255,204,0,0.3)'
                : '-1px -1px 0 #8a6e00, 1px -1px 0 #8a6e00, -1px 1px 0 #8a6e00, 1px 1px 0 #8a6e00',
            }}>
              {weekLabel}
            </div>
            <div style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: '1.05em',
              fontWeight: 900,
              letterSpacing: '0.06em',
              color: 'var(--white-smoke)',
              textTransform: 'uppercase',
            }}>
              {formatBowlingDate(selectedDate)}
            </div>
          </div>

          <button
            className="week-nav-btn"
            onClick={() => onChangeWeek(1)}
            title="Next week"
          >
            &#9654;
          </button>
        </div>
      </div>
    </div>
  );
}
