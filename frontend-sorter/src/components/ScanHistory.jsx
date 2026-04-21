import { BAY_COLORS } from '../data/demoData'
import { IconWarning } from './Icons'

function fmt(ts) {
  const d = new Date(ts)
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}

export default function ScanHistory({ history, total, onClickItem, side='right' }) {
  return (
    <aside style={{
      width: 256,
      flexShrink: 0,
      background: 'var(--bg1)',
      [side==='right' ? 'borderLeft' : 'borderRight']: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      <div style={{
        padding: '16px 16px 12px',
        borderBottom: '1px solid var(--border)',
        flexShrink: 0,
      }}>
        <p style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--muted)', letterSpacing: 2, textTransform: 'uppercase' }}>
          Historial
        </p>
        <p style={{ fontFamily: 'var(--mono)', fontSize: 20, fontWeight: 700, color: 'var(--accent)', marginTop: 2 }}>
          {total}
        </p>
        <p style={{ fontSize: 10, color: 'var(--muted)' }}>escaneados hoy</p>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {history.length === 0 && (
          <p style={{ color: 'var(--muted)', fontSize: 12, textAlign: 'center', marginTop: 20 }}>
            Sin escaneos aún
          </p>
        )}
        {history.map((item, i) => {
          const color = BAY_COLORS[item.bayNumber] || '#6b7280'
          return (
            <div key={item.id || i}
              onClick={() => onClickItem && onClickItem(item)}
              style={{
                background: i === 0 ? '#1e1e2e' : 'var(--card-bg)',
                border: `1px solid ${i === 0 ? '#3a3a5a' : 'var(--card-border)'}`,
                borderRadius: 8,
                padding: '10px 12px',
                animation: i === 0 ? 'slideIn .35s ease' : 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                cursor: onClickItem ? 'pointer' : 'default',
                transition: 'border-color .15s',
              }}
              onMouseEnter={e => { if (onClickItem) e.currentTarget.style.borderColor = color }}
              onMouseLeave={e => { if (onClickItem) e.currentTarget.style.borderColor = i===0?'#3a3a5a':'var(--card-border)' }}
            >
              <div style={{
                width: 28, height: 28,
                borderRadius: '50%',
                background: `${color}22`,
                border: `1px solid ${color}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 700, color,
                flexShrink: 0,
              }}>
                {item.bayNumber}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display:'flex', alignItems:'center', gap:4 }}>
                  {item.product || item.epc}
                  {item.isMisrouted && <IconWarning size={11} color="#ef4444" />}
                </p>
                <p style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2 }}>
                  {item.city} · {fmt(item.scannedAt)}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </aside>
  )
}
