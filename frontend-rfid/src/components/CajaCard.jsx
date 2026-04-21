const COLORES = {
  ABIERTA:  { bg: '#fff3cd', text: '#856404', border: '#ffc107' },
  LLENANDO: { bg: '#cce5ff', text: '#004085', border: '#007bff' },
  LLENA:    { bg: '#d4edda', text: '#155724', border: '#28a745' },
  SELLADA:  { bg: '#e2e3e5', text: '#383d41', border: '#adb5bd' },
}

export default function CajaCard({ caja, onSellar }) {
  const c = COLORES[caja.estado] || COLORES.ABIERTA

  return (
    <div style={{
      border: `1px solid ${c.border}`,
      borderRadius: 8,
      padding: 16,
      background: c.bg
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <strong style={{ fontSize: 14 }}>{caja.caja_id}</strong>
        <span style={{
          fontSize: 11,
          fontWeight: 700,
          color: c.text,
          background: 'rgba(255,255,255,0.6)',
          padding: '2px 8px',
          borderRadius: 10
        }}>
          {caja.estado}
        </span>
      </div>
      <div style={{ fontSize: 13, color: '#444', lineHeight: 1.8 }}>
        <div>Tienda: <strong>{caja.tienda_destino}</strong></div>
        <div>Bahia: <strong>{caja.bahia}</strong></div>
        <div>Prepacks: <strong>{caja.prepack_cajas?.length || 0}</strong></div>
      </div>
      {caja.estado !== 'SELLADA' && onSellar && (
        <button
          onClick={() => onSellar(caja.caja_id)}
          style={{
            marginTop: 12,
            padding: '8px 16px',
            background: '#28a745',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            width: '100%',
            fontWeight: 600,
            fontSize: 13
          }}
        >
          Marcar como Sellada
        </button>
      )}
    </div>
  )
}
