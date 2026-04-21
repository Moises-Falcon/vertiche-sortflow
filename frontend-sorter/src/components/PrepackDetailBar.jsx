import { BAY_COLORS, getColorCSS, esColorClaro } from '../data/demoData'
import { IconCheck, IconX } from './Icons'

const ORDEN_TALLAS = ['XS','S','CH','M','G','L','XL','XXL','25','27','28','29','30','31','32','34','36']

function buildTabla(prendas) {
  const colores = [...new Set(prendas.map(p => p.color))].sort()
  const tallas  = [...new Set(prendas.map(p => p.talla))].sort((a,b)=>{
    const ia = ORDEN_TALLAS.indexOf(a), ib = ORDEN_TALLAS.indexOf(b)
    return (ia===-1?99:ia) - (ib===-1?99:ib)
  })
  const conteo   = (c,t) => prendas.filter(p => p.color===c && p.talla===t).length
  const totColor = c     => prendas.filter(p => p.color===c).length
  const totTalla = t     => prendas.filter(p => p.talla===t).length
  return { colores, tallas, conteo, totColor, totTalla, gran: prendas.length }
}

export default function PrepackDetailBar({ prepack }) {
  if (!prepack) return null

  const prendas = prepack.prendas || []
  const colUnicos = [...new Set(prendas.map(p => p.color))]
  const bayColor = BAY_COLORS[prepack.bayNumber] || '#6b7280'
  const tabla = buildTabla(prendas)

  return (
    <div style={{
      display:'grid',
      gridTemplateColumns:'minmax(300px, 1.4fr) minmax(210px, 1fr) minmax(200px, 1fr)',
      gap:12, width:'100%', maxWidth:950,
      marginTop:6,
    }}>

      {/* Tabla color × talla */}
      <div style={{
        background:'var(--bg1)', border:'1px solid var(--border)',
        borderRadius:8, padding:'10px 14px', overflow:'hidden',
      }}>
        <div style={{ fontSize:9, fontWeight:700, color:'var(--muted)', textTransform:'uppercase', letterSpacing:1.5, marginBottom:8 }}>
          Contenido del prepack
        </div>
        <div style={{ overflow:'auto' }}>
          <table style={{ borderCollapse:'collapse', width:'100%', fontSize:11 }}>
            <thead>
              <tr style={{ background:'var(--bg2)' }}>
                <th style={{ padding:'5px 9px', textAlign:'left', fontSize:9, fontWeight:700, color:'var(--muted)', textTransform:'uppercase' }}>Color</th>
                {tabla.tallas.map(t => (
                  <th key={t} style={{ padding:'5px 7px', textAlign:'center', fontSize:9, fontWeight:700, color:'var(--muted)', textTransform:'uppercase' }}>{t}</th>
                ))}
                <th style={{ padding:'5px 9px', textAlign:'center', fontSize:9, fontWeight:700, color:bayColor, background:`${bayColor}22` }}>Tot</th>
              </tr>
            </thead>
            <tbody>
              {tabla.colores.map((color, idx) => {
                const cCol = getColorCSS(color)
                const eC = esColorClaro(color)
                return (
                  <tr key={color} style={{ background:idx%2===0?'transparent':'rgba(255,255,255,0.02)', borderTop:'1px solid var(--border)' }}>
                    <td style={{ padding:'6px 9px', fontWeight:600, color:'var(--text)' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                        <div style={{ width:11, height:11, borderRadius:'50%', background:cCol, border:eC?'1px solid #cbd5e1':'1px solid rgba(255,255,255,0.15)', flexShrink:0 }}/>
                        {color}
                      </div>
                    </td>
                    {tabla.tallas.map(t => {
                      const n = tabla.conteo(color, t)
                      return (
                        <td key={t} style={{ padding:'6px 7px', textAlign:'center', fontSize:12, fontWeight:n>0?700:400, color:n>0?'var(--text)':'var(--muted)' }}>
                          {n>0 ? n : '—'}
                        </td>
                      )
                    })}
                    <td style={{ padding:'6px 9px', textAlign:'center', fontWeight:700, fontSize:12, color:bayColor, background:`${bayColor}11` }}>
                      {tabla.totColor(color)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr style={{ borderTop:'2px solid var(--border)', background:'var(--bg2)' }}>
                <td style={{ padding:'6px 9px', fontSize:9, fontWeight:700, color:'var(--muted)', textTransform:'uppercase' }}>Tot</td>
                {tabla.tallas.map(t => (
                  <td key={t} style={{ padding:'6px 7px', textAlign:'center', fontWeight:800, fontSize:12, color:'var(--text)' }}>
                    {tabla.totTalla(t)}
                  </td>
                ))}
                <td style={{ padding:'6px 9px', textAlign:'center', fontSize:14, fontWeight:900, color:'#fff', background:bayColor }}>
                  {tabla.gran}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Tienda destino */}
      <div style={{
        background:'var(--bg1)', border:'1px solid var(--border)',
        borderRadius:8, padding:'10px 14px',
        display:'flex', flexDirection:'column', gap:5,
      }}>
        <div style={{ fontSize:9, fontWeight:700, color:'var(--muted)', textTransform:'uppercase', letterSpacing:1.5 }}>
          Tienda destino
        </div>
        <div style={{ fontSize:13, fontWeight:700, color:'var(--text)', lineHeight:1.3 }}>
          {prepack.tienda?.nombre || '—'}
        </div>
        <div style={{ fontSize:11, color:'var(--muted)' }}>
          {prepack.tienda?.ciudad || ''}{prepack.tienda?.estado ? `, ${prepack.tienda.estado}` : ''}
        </div>
        <div style={{ fontSize:10, color:'var(--muted)', marginTop:2 }}>
          {prendas.length} prendas · {colUnicos.join('/')}
        </div>
        <div style={{ fontSize:8, color:'var(--muted)', fontFamily:'var(--mono)', marginTop:'auto', paddingTop:4 }}>
          EPC: {prepack.epc}
        </div>
      </div>

      {/* Estatus */}
      <div style={{
        background:'var(--bg1)', border:'1px solid var(--border)',
        borderRadius:8, padding:'10px 14px',
        display:'flex', flexDirection:'column', gap:8,
      }}>
        <div style={{ fontSize:9, fontWeight:700, color:'var(--muted)', textTransform:'uppercase', letterSpacing:1.5 }}>
          Estatus
        </div>
        <div style={{
          padding:'9px 12px', borderRadius:6,
          background: prepack.qa_fallido ? 'rgba(239,68,68,0.1)' : 'rgba(76,175,80,0.1)',
          border: `1px solid ${prepack.qa_fallido ? '#ef4444' : '#4caf50'}`,
          display:'flex', alignItems:'center', justifyContent:'center', gap:10,
        }}>
          {prepack.qa_fallido
            ? <IconX size={16} color="#ef4444" />
            : <IconCheck size={16} color="#4caf50" />}
          <span style={{ fontSize:12, fontWeight:700, color: prepack.qa_fallido ? '#ef4444' : '#4caf50' }}>
            {prepack.qa_fallido ? 'QA Falló' : 'Calidad OK'}
          </span>
        </div>
        <div style={{
          padding:'9px 12px', borderRadius:6,
          background:'var(--bg2)', border:'1px solid var(--border)',
          display:'flex', justifyContent:'space-between', alignItems:'center',
        }}>
          <span style={{ fontSize:9, color:'var(--muted)', textTransform:'uppercase', letterSpacing:1 }}>Orden</span>
          <span style={{ fontSize:15, fontWeight:800, color:'var(--accent)', fontFamily:'var(--mono)' }}>
            {prepack.orden_id || '—'}
          </span>
        </div>
      </div>
    </div>
  )
}
