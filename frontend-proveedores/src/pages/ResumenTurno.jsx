import NivelBadge from '../components/NivelBadge'
import Stars      from '../components/Stars'

export default function ResumenTurno({ suppliers, stats, avgStars, setTab, setProfileId }) {
  return (
    <div style={{ padding:'20px 32px', maxWidth:1400, margin:'0 auto' }}>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:16 }}>
        {[
          { label:'Entregas hoy',         value:stats.totalSO,   sub:'7 proveedores activos' },
          { label:'Cajas inspeccionadas', value:stats.inspected, sub:'Turno actual',          color:'var(--gold)' },
          { label:'Rechazos Críticos',    value:stats.rejected,  sub:'Penalización aplicada', color:'var(--red-t)' },
          { label:'Calificación Promedio',value:avgStars,        sub:'KPI Global de Calidad', color:'var(--green-t)' },
        ].map(k => (
          <div key={k.label} style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'var(--r2)', padding:16 }}>
            <div style={{ fontSize:10, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'.07em', marginBottom:6 }}>{k.label}</div>
            <div style={{ fontFamily:'var(--mono)', fontSize:26, fontWeight:600, lineHeight:1, marginBottom:4, color:k.color || 'var(--text)' }}>{k.value}</div>
            <div style={{ fontSize:11, color:'var(--text3)' }}>{k.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'var(--r2)', padding:16 }}>
        <div style={{ fontSize:10, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'.08em', fontWeight:500, marginBottom:12 }}>
          Dashboard de Reputación Dinámica
        </div>
        {suppliers.map(s => (
          <div key={s.id} style={{
            display:'flex', alignItems:'center', justifyContent:'space-between',
            padding:'10px 0', borderBottom:'1px solid var(--border)', cursor:'pointer',
          }}
          onClick={() => { setProfileId(s.id); setTab('sup-proveedor') }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg3)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <div style={{ minWidth:0, flex:1 }}>
              <div style={{ fontSize:13, fontWeight:500, color:'var(--text)', marginBottom:2 }}>{s.name}</div>
              <div style={{ fontSize:11, color:'var(--text3)' }}>{s.origin}</div>
            </div>
            <NivelBadge level={s.level} color={s.color} />
            <div style={{ width:160, margin:'0 16px' }}>
              <div style={{ height:6, background:'var(--bg3)', borderRadius:3, overflow:'hidden' }}>
                <div style={{
                  height:'100%', borderRadius:3,
                  width:`${(s.stars/5)*100}%`,
                  background: s.stars >= 4.5 ? 'var(--green)' : s.stars >= 2.5 ? 'var(--amber)' : s.stars > 0 ? 'var(--red)' : 'var(--bg2)',
                  transition:'width .5s ease',
                }} />
              </div>
            </div>
            <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:3, minWidth:68 }}>
              <span style={{ fontFamily:'var(--mono)', fontSize:18, fontWeight:600 }}>{s.stars.toFixed(1)}</span>
              <Stars rating={s.stars} size={10} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
