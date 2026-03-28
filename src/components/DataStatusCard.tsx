import type { Player } from '@/lib/types';

interface DataStatusCardProps {
  roster: Player[];
}

export default function DataStatusCard({ roster }: DataStatusCardProps) {
  const teams = new Set(roster.map(p => p.team).filter(Boolean));

  return (
    <div className="card">
      <div className="card__container">
        <div className="card-titlebar">
          <span className="card-titlebar__text">DATA STATUS</span>
        </div>
        <div style={{ fontSize: '0.85em', color: 'var(--smoke)' }}>
          <div style={{ marginBottom: '0.5em' }}>
            <div style={{ color: 'var(--light-blue)', fontWeight: 600, marginBottom: '0.2em' }}>Source</div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--yellow)', fontSize: '0.85em' }}>Google Sheets</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5em' }}>
            <div>
              <div style={{ color: 'var(--light-blue)', fontWeight: 600, marginBottom: '0.2em' }}>Players</div>
              <div>{roster.length}</div>
            </div>
            <div>
              <div style={{ color: 'var(--light-blue)', fontWeight: 600, marginBottom: '0.2em' }}>Teams</div>
              <div>{teams.size}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
