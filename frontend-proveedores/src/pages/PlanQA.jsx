import NivelBadge from '../components/NivelBadge'
import Stars      from '../components/Stars'
import { accionSistema } from '../data/demoData'

export default function PlanQA({ suppliers }) {
  return (
    <div style={{ padding:'20px 32px', maxWidth:1400, margin:'0 auto' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
        <div>
          <div style={{ fontSize:16, fontWeight:600 }}>Plan de muestreo — Reputación en Tiempo Real</div>
          <div style={{ fontSize:11, color:'var(--text3)', marginTop:3 }}>Actualización dinámica por inspección</div>
        </div>
      </div>

      <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'var(--r2)', overflow:'hidden' }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr>
              {['Proveedor','Rating','Criterio Muestreo','Acción Sistema'].map(h => (
                <th key={h} style={{ fontSize:10, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'.06em', padding:'8px 10px', borderBottom:'1px solid var(--border)', textAlign:'left', fontWeight:500 }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {suppliers.map(s => {
              const acc = accionSistema(s.stars)
              const pct = s.stars >= 4.5 ? '1%' : s.stars >= 2.5 ? '5%' : s.stars > 0 ? '15%' : '10%'
              return (
                <tr key={s.id}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg3)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding:10, borderBottom:'1px solid var(--border)' }}>
                    <div style={{ fontSize:13, fontWeight:500 }}>{s.name}</div>
                    <div style={{ fontSize:11, color:'var(--text3)' }}>{s.origin}</div>
                  </td>
                  <td style={{ padding:10, borderBottom:'1px solid var(--border)' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <span style={{ fontFamily:'var(--mono)', fontSize:18, fontWeight:600, color:'var(--gold)' }}>{s.stars.toFixed(1)}</span>
                      <Stars rating={s.stars} size={11} />
                      <NivelBadge level={s.level} color={s.color} />
                    </div>
                  </td>
                  <td style={{ padding:10, borderBottom:'1px solid var(--border)', fontSize:12, color:'var(--text2)' }}>
                    {pct} de la carga
                  </td>
                  <td style={{ padding:10, borderBottom:'1px solid var(--border)' }}>
                    <span style={{ fontSize:12, fontWeight:600, color: acc.cls === 'elite' ? 'var(--green-t)' : acc.cls === 'media' ? 'var(--amber-t)' : acc.cls === 'baja' ? 'var(--red-t)' : 'var(--blue-t)' }}>
                      {acc.label}
                    </span>
                    <div style={{ fontSize:10, color:'var(--text3)', marginTop:2 }}>{acc.hint}</div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
