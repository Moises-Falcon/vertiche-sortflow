export default function TerminalColumn({ terminalNum, prepacks = [] }) {
  return (
    <div style={{
      background: 'var(--bg1)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      borderRight: '1px solid var(--border)',
    }}>
      <div style={{
        padding: '16px 20px 12px',
        borderBottom: '1px solid var(--border)',
        flexShrink: 0,
      }}>
        <span style={{
          fontFamily: 'var(--mono)',
          fontSize: 11,
          letterSpacing: 3,
          color: 'var(--accent)',
          textTransform: 'uppercase',
          fontWeight: 700,
        }}>
          Estación {terminalNum}
        </span>
      </div>

      <div style={{
        flex: 1,
        padding: '16px 14px',
        display: 'grid',
        gridTemplateRows: 'repeat(4, 1fr)',
        gap: 10,
        overflow: 'hidden',
      }}>
        {prepacks.map((num, i) => (
          <div key={i} style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--card-border)',
            borderRadius: 8,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            textAlign: 'center',
            minHeight: 0,
            animation: 'slideIn .35s ease both',
            animationDelay: `${i * 0.08}s`,
            transition: 'border-color .2s, transform .15s',
            cursor: 'default',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(245,197,24,.35)'; e.currentTarget.style.transform = 'scale(1.02)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--card-border)'; e.currentTarget.style.transform = 'scale(1)' }}
          >
            <span style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: 2,
              color: 'var(--muted)',
              textTransform: 'uppercase',
            }}>
              Toma el Prepack
            </span>
            <span style={{
              fontSize: 28,
              fontWeight: 800,
              fontFamily: 'var(--mono)',
              background: 'linear-gradient(135deg, #f5c518, #ff6b35)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              #{num}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
