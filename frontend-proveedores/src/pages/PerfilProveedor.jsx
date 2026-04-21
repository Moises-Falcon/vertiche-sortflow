import { SUPPLIER_PROFILES, accionSistema } from '../data/demoData'
import NivelBadge from '../components/NivelBadge'
import Stars      from '../components/Stars'
import Sparkline  from '../components/Sparkline'

const ACTION_STYLES = {
  elite: { bg:'var(--green-bg)', border:'var(--green)', color:'var(--green-t)', icon:'✅' },
  media: { bg:'var(--amber-bg)', border:'var(--amber)', color:'var(--amber-t)', icon:'⚠️' },
  baja:  { bg:'var(--red-bg)',   border:'var(--red)',   color:'var(--red-t)',   icon:'🚨' },
  nuevo: { bg:'var(--blue-bg)',  border:'var(--blue)',  color:'var(--blue-t)',  icon:'🆕' },
}

const RESULT_STYLE = {
  ok:   { bg:'var(--green-bg)', color:'var(--green-t)', border:'#1e3a18', label:'APROBADO'  },
  warn: { bg:'var(--amber-bg)', color:'var(--amber-t)', border:'#2e1e00', label:'OBSERVADO' },
  fail: { bg:'var(--red-bg)',   color:'var(--red-t)',   border:'#2e0e0e', label:'RECHAZADO' },
}

export default function PerfilProveedor({ supplierId, suppliers, setProfileId }) {
  const s    = suppliers.find(x => x.id === supplierId) || suppliers[0]
  const prof = SUPPLIER_PROFILES[s.id] || SUPPLIER_PROFILES[1]
  const acc  = accionSistema(s.stars)
  const as   = ACTION_STYLES[acc.cls] || ACTION_STYLES.nuevo

  return (
    <div style={{ padding:'20px 32px', maxWidth:1400, margin:'0 auto' }}>

      <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'var(--r2)', padding:16, display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
        <div style={{ fontSize:11, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'.06em' }}>Proveedor:</div>
        <select value={supplierId} onChange={e => setProfileId(parseInt(e.target.value))} style={{
          maxWidth:300, background:'var(--bg3)', border:'1px solid var(--border2)',
          borderRadius:'var(--r)', padding:'8px 12px', fontSize:13,
          color:'var(--text)', fontFamily:'var(--font)', outline:'none',
        }}>
          {suppliers.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}
        </select>
      </div>

      <div style={{
        background:'linear-gradient(135deg, var(--bg2) 0%, var(--bg3) 100%)',
        border:'1px solid var(--border)', borderRadius:'var(--r2)',
        padding:24, marginBottom:16,
        display:'flex', alignItems:'center', gap:20,
      }}>
        <div style={{ width:72, height:72, borderRadius:'var(--r2)', background:'var(--bg3)', border:'2px solid var(--border2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:30, flexShrink:0 }}>
          🏭
        </div>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:26, fontWeight:600, marginBottom:4 }}>{s.name}</div>
          <div style={{ fontSize:13, color:'var(--text3)', fontFamily:'var(--mono)', marginBottom:8 }}>{prof.rfc} · {s.origin}</div>
          <NivelBadge level={s.level} color={s.color} />
        </div>
        <div style={{ textAlign:'right' }}>
          <div style={{ fontFamily:'var(--mono)', fontSize:36, fontWeight:600, color:'var(--gold)', lineHeight:1 }}>{s.stars.toFixed(1)}</div>
          <Stars rating={s.stars} size={14} />
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:16 }}>
        {[
          { label:'Entregas YTD',         value:prof.deliveries,        color:'var(--text)' },
          { label:'Tasa de aprobación',   value:`${prof.approval}%`,    color:'var(--green-t)' },
          { label:'Defectos detectados',  value:prof.defects,           color:'var(--red-t)' },
          { label:'Lead time promedio',   value:`${prof.leadtime} días`,color:'var(--blue-t)' },
        ].map(k => (
          <div key={k.label} style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'var(--r2)', padding:16 }}>
            <div style={{ fontSize:10, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'.07em', marginBottom:6 }}>{k.label}</div>
            <div style={{ fontFamily:'var(--mono)', fontSize:26, fontWeight:600, lineHeight:1, color:k.color }}>{k.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:16, marginBottom:16 }}>
        <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'var(--r2)', padding:16 }}>
          <div style={{ fontSize:10, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:12 }}>Información comercial</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:0 }}>
            {[
              { label:'Categoría',       value:prof.category },
              { label:'Proveedor desde', value:prof.since, mono:true },
              { label:'Contacto',        value:prof.contact },
              { label:'Teléfono',        value:prof.phone, mono:true },
              { label:'Email',           value:prof.email, mono:true },
              { label:'Términos de pago',value:prof.paymentTerms },
            ].map(r => (
              <div key={r.label} style={{ padding:'10px 0', borderBottom:'1px solid var(--border)' }}>
                <div style={{ fontSize:10, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:4 }}>{r.label}</div>
                <div style={{ fontSize:13, fontWeight:500, fontFamily: r.mono ? 'var(--mono)' : 'var(--font)', color:'var(--text)' }}>{r.value}</div>
              </div>
            ))}
            <div style={{ padding:'10px 0', gridColumn:'1 / -1' }}>
              <div style={{ fontSize:10, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:4 }}>Dirección</div>
              <div style={{ fontSize:13, fontWeight:500 }}>{prof.address}</div>
            </div>
          </div>
        </div>

        <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'var(--r2)', padding:16 }}>
          <div style={{ fontSize:10, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:12 }}>Acción del sistema QA</div>
          <div style={{
            padding:16, borderRadius:'var(--r2)',
            border:`1.5px solid ${as.border}`,
            background:as.bg, textAlign:'center',
          }}>
            <div style={{ fontSize:32, marginBottom:8 }}>{as.icon}</div>
            <div style={{ fontSize:14, fontWeight:600, marginBottom:4, color:as.color }}>{acc.label}</div>
            <div style={{ fontSize:11, color:'var(--text2)' }}>{acc.hint}</div>
          </div>
        </div>
      </div>

      <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'var(--r2)', padding:16, marginBottom:16 }}>
        <div style={{ fontSize:10, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:8 }}>
          Tendencia de calificación · Últimas 12 entregas
        </div>
        <Sparkline data={prof.sparkData} height={60} />
        <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:'var(--text3)', fontFamily:'var(--mono)', marginTop:4 }}>
          <span>hace 12</span><span>actual</span>
        </div>
      </div>

      <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'var(--r2)', padding:16 }}>
        <div style={{ fontSize:10, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:12 }}>
          Historial reciente de inspecciones
        </div>
        {prof.history.map((h, i) => {
          const rs = RESULT_STYLE[h.result] || RESULT_STYLE.ok
          return (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 0', borderBottom: i < prof.history.length-1 ? '1px solid var(--border)' : 'none', fontSize:12 }}>
              <span style={{ fontFamily:'var(--mono)', color:'var(--text3)', minWidth:90 }}>{h.date}</span>
              <span style={{ fontFamily:'var(--mono)', color:'var(--text2)', minWidth:110 }}>{h.po}</span>
              <span style={{ flex:1, color:'var(--text)' }}>{h.desc} <span style={{ color:'var(--text3)', fontSize:11 }}>· {h.note}</span></span>
              <span style={{ fontSize:11, fontWeight:600, padding:'3px 8px', borderRadius:4, background:rs.bg, color:rs.color, border:`1px solid ${rs.border}`, flexShrink:0 }}>
                {rs.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
