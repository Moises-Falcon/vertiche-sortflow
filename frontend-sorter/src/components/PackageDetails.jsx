import { BAY_COLORS } from '../data/demoData'

export default function PackageDetails({ scan, onClick }) {
  if (!scan) return null

  const color = BAY_COLORS[scan.bayNumber] || '#6b7280'

  const cols = [
    { label: 'RFID', value: scan.epc, mono: true, color: '#6eaaee' },
    { label: 'Producto', value: scan.product || '—', sub: scan.proveedor || scan.category },
    { label: 'Orden', value: scan.orden_id || '—', mono: true, color },
    { label: 'Tienda', value: scan.storeName || '—', sub: new Date(scan.scannedAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }) },
  ]

  return (
    <div
      onClick={onClick}
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr) auto',
        borderTop: '1px solid var(--border)',
        flexShrink: 0,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'background .15s',
      }}
      onMouseEnter={e => { if (onClick) e.currentTarget.style.background = 'rgba(255,255,255,0.02)' }}
      onMouseLeave={e => { if (onClick) e.currentTarget.style.background = 'transparent' }}
    >
      {cols.map((col, i) => (
        <div key={i} style={{
          padding: '14px 20px',
          borderRight: '1px solid var(--border)',
        }}>
          <p style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--muted)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 }}>
            {col.label}
          </p>
          <p style={{
            fontFamily: col.mono ? 'var(--mono)' : 'var(--font)',
            fontSize: col.mono ? 14 : 14,
            fontWeight: 700,
            color: col.color || 'var(--text)',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {col.value}
          </p>
          {col.sub && (
            <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{col.sub}</p>
          )}
        </div>
      ))}
      {onClick && (
        <div style={{
          padding:'14px 20px', display:'flex', alignItems:'center',
          color: 'var(--accent)', fontSize:11, fontWeight:700,
          fontFamily:'var(--mono)', letterSpacing:2,
        }}>
          VER DETALLE →
        </div>
      )}
    </div>
  )
}
