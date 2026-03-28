import { formatBowlingDate } from '@/lib/constants';

interface WeekSelectorProps {
  currentWeek: number;
  selectedDate: Date;
  onChangeWeek: (delta: number) => void;
}

export default function WeekSelector({ currentWeek, selectedDate, onChangeWeek }: WeekSelectorProps) {
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
            }}>
              WEEK {currentWeek}
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
