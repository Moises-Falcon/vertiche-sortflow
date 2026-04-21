// Barra del operador activo — se muestra en la parte superior
// de las pantallas de operador/supervisor para identificar al usuario.
export default function OperatorBar({
  name       = 'Luis Ramírez',
  initials   = 'LR',
  employeeId = '0042',
  station    = 'Arco RFID Bahía 02',
  status     = 'BAHÍA ACTIVA',
  counterLabel = 'Revisión',
  counterValue = 1,
}) {
  return (
    <div style={{
      background:'var(--bg2)', border:'1px solid var(--border)',
      borderRadius:'var(--r2)', padding:'14px 18px',
      display:'flex', alignItems:'center', gap:14, marginBottom:16,
    }}>
      {/* Avatar con iniciales */}
      <div style={{
        width:46, height:46, borderRadius:'50%',
        background:'var(--blue-bg)', border:'1px solid var(--blue)',
        display:'flex', alignItems:'center', justifyContent:'center',
        fontSize:14, fontWeight:600, color:'var(--blue-t)',
        flexShrink:0,
      }}>
        {initials}
      </div>

      {/* Info del operador */}
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:16, fontWeight:600, color:'var(--text)', marginBottom:2 }}>
          {name}
        </div>
        <div style={{ fontSize:11, color:'var(--text3)' }}>
          Emp. {employeeId} · {station}
        </div>
      </div>

      {/* Estado del turno */}
      <div style={{ textAlign:'right', flexShrink:0 }}>
        <div style={{
          display:'inline-flex', alignItems:'center', gap:6,
          fontSize:11, fontWeight:600, letterSpacing:'.08em',
          color:'var(--green-t)',
        }}>
          <span style={{
            width:7, height:7, borderRadius:'50%',
            background:'var(--green)',
            boxShadow:'0 0 6px rgba(76,175,80,0.6)',
          }} />
          {status}
        </div>
        <div style={{ fontSize:10, color:'var(--text3)', marginTop:3 }}>
          {counterLabel} #{counterValue}
        </div>
      </div>
    </div>
  )
}
