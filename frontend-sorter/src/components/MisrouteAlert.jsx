import { IconWarning, IconArrow } from './Icons'

export default function MisrouteAlert({ currentBay, correctBay, visible }) {
  if (!visible) return null

  return (
    <div style={{
      background: '#1e0000',
      border: '1px solid #ef4444',
      borderRadius: 8,
      padding: '12px 20px',
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      flexShrink: 0,
      margin: '0 0 8px 0',
    }}>
      <IconWarning size={20} color="#ef4444" />
      <div style={{ flex: 1, display:'flex', alignItems:'center', gap:10 }}>
        <span style={{ color: '#ef4444', fontWeight: 700, fontSize: 13 }}>
          Error de Sorter
        </span>
        <span style={{ color: '#e8e8f0', fontSize: 13, display:'inline-flex', alignItems:'center', gap:8 }}>
          Paquete en Bahía {currentBay} <IconArrow size={12} color="#94a3b8" /> redirigir a Bahía {correctBay}
        </span>
      </div>
      <span style={{
        color: '#ef4444',
        fontFamily: 'var(--mono)',
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: 2,
        animation: 'blink 1s ease-in-out infinite',
      }}>
        ACCIÓN REQUERIDA
      </span>
    </div>
  )
}
