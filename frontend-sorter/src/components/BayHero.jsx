import { BAY_COLORS } from '../data/demoData'

export default function BayHero({ bayNumber, storeName, city }) {
  const color = BAY_COLORS[bayNumber] || '#6b7280'

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: `radial-gradient(ellipse at top, ${color}18 0%, transparent 60%)`,
      animation: 'fadeIn .4s ease',
      gap: 16,
    }}>
      <p style={{
        fontFamily: 'var(--mono)',
        fontSize: 13,
        letterSpacing: 4,
        color: 'var(--muted)',
        textTransform: 'uppercase',
      }}>
        Llevar a
      </p>

      <div style={{
        width: 'min(38vh, 260px)',
        height: 'min(38vh, 260px)',
        borderRadius: '50%',
        border: `4px solid ${color}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color,
        fontSize: 'min(20vh, 140px)',
        fontFamily: 'var(--mono)',
        fontWeight: 700,
        animation: 'glow-bay 2.4s ease-in-out infinite',
      }}>
        {bayNumber}
      </div>

      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>
          Bahía {bayNumber}
        </p>
        {storeName && (
          <p style={{ fontSize: 14, color: 'var(--muted)' }}>
            {storeName} · {city}
          </p>
        )}
      </div>
    </div>
  )
}
