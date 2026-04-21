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

export default function PrepackDetailPanel({ prepack, compact = false }) {
  if (!prepack) {
    return (
      <div style={{
        flex:1, display:'flex', flexDirection:'column',
        alignItems:'center', justifyContent:'center',
        background:'var(--bg1)', borderLeft:'1px solid var(--border)',
        padding:24, color:'var(--muted)', fontSize:12,
      }}>
        <div style={{ fontFamily:'var(--mono)', fontSize:10, letterSpacing:2, marginBottom:8 }}>
          DETALLE DEL PREPACK
        </div>
        <div style={{ textAlign:'center' }}>Selecciona un prepack para ver su contenido</div>
      </div>
    )
  }

  const prendas = prepack.prendas || []
  const colUnicos = [...new Set(prendas.map(p => p.color))]
  const tallUnicas = [...new Set(prendas.map(p => p.talla))]
  const colorPrincipal = colUnicos[0] || prepack.color || ''
  const cCSS = getColorCSS(colorPrincipal)
  const esC = esColorClaro(colorPrincipal)
  const txtC = esC ? '#1e293b' : '#ffffff'
  const bayColor = BAY_COLORS[prepack.bayNumber] || '#6b7280'
  const tabla = buildTabla(prendas)
  const codigoCorto = prepack.epc?.length > 6 ? `···${prepack.epc.slice(-6)}` : prepack.epc

  return (
    <div style={{
      display:'flex', flexDirection:'column',
      background:'var(--bg1)', borderLeft:'1px solid var(--border)',
      overflow:'hidden', height:'100%',
    }}>
      {/* HEADER */}
      <div style={{
        padding:'12px 16px', borderBottom:'1px solid var(--border)',
        display:'flex', alignItems:'center', gap:10, flexShrink:0,
        background:`linear-gradient(135deg, ${bayColor}15, transparent)`,
      }}>
        {colUnicos.length > 1 ? (
          <div style={{
            width:46, height:46, borderRadius:8, flexShrink:0,
            background:'var(--bg2)', border:'1px solid var(--border)',
            display:'flex', flexWrap:'wrap', alignItems:'center', justifyContent:'center',
            gap:3, padding:5,
          }}>
            {colUnicos.slice(0,4).map(c => (
              <div key={c} title={c} style={{
                width:16, height:16, borderRadius:'50%',
                background:getColorCSS(c),
                border:esColorClaro(c)?'1px solid #cbd5e1':'1px solid rgba(255,255,255,0.15)',
              }}/>
            ))}
          </div>
        ) : (
          <div style={{
            width:46, height:46, borderRadius:8, flexShrink:0,
            background:cCSS, border:esC?'1.5px solid var(--border)':'none',
            display:'flex', alignItems:'center', justifyContent:'center',
          }}>
            <span style={{ fontSize:9, fontWeight:700, color:txtC }}>{colorPrincipal}</span>
          </div>
        )}

        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:2 }}>
            <span style={{
              fontFamily:'var(--mono)', fontSize:11, fontWeight:700,
              color:bayColor, background:`${bayColor}22`,
              border:`1px solid ${bayColor}55`, borderRadius:5, padding:'1px 7px',
            }}>{codigoCorto}</span>
          </div>
          <div style={{ fontSize:13, fontWeight:700, color:'var(--text)', lineHeight:1.2, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
            {prendas.length} prenda{prendas.length!==1?'s':''} — {colUnicos.join(' / ')}
          </div>
          <div style={{ fontSize:10, color:'var(--muted)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', marginTop:2 }}>
            {prepack.producto || '—'}
          </div>
        </div>
      </div>

      {/* BODY */}
      <div style={{ padding:'12px 14px', overflow:'auto', flex:1 }}>

        {/* Tabla color × talla */}
        <div style={{ marginBottom:12 }}>
          <div style={{ fontSize:8, fontWeight:700, color:'var(--muted)', textTransform:'uppercase', letterSpacing:1, marginBottom:6 }}>
            Contenido del prepack
          </div>
          <div style={{ borderRadius:6, border:'1px solid var(--border)', overflow:'hidden' }}>
            <table style={{ borderCollapse:'collapse', width:'100%', fontSize:10 }}>
              <thead>
                <tr style={{ background:'var(--bg2)' }}>
                  <th style={{ padding:'5px 8px', textAlign:'left', fontSize:8, fontWeight:700, color:'var(--muted)', textTransform:'uppercase' }}>Color</th>
                  {tabla.tallas.map(t => (
                    <th key={t} style={{ padding:'5px 6px', textAlign:'center', fontSize:8, fontWeight:700, color:'var(--muted)', textTransform:'uppercase' }}>{t}</th>
                  ))}
                  <th style={{ padding:'5px 8px', textAlign:'center', fontSize:8, fontWeight:700, color:bayColor, background:`${bayColor}22` }}>Tot</th>
                </tr>
              </thead>
              <tbody>
                {tabla.colores.map((color, idx) => {
                  const cCol = getColorCSS(color)
                  const eC = esColorClaro(color)
                  return (
                    <tr key={color} style={{ background:idx%2===0?'transparent':'rgba(255,255,255,0.02)', borderTop:'1px solid var(--border)' }}>
                      <td style={{ padding:'5px 8px', fontWeight:600, color:'var(--text)' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                          <div style={{ width:9, height:9, borderRadius:'50%', background:cCol, border:eC?'1px solid #cbd5e1':'1px solid rgba(255,255,255,0.15)', flexShrink:0 }}/>
                          {color}
                        </div>
                      </td>
                      {tabla.tallas.map(t => {
                        const n = tabla.conteo(color, t)
                        return (
                          <td key={t} style={{ padding:'5px 6px', textAlign:'center', fontWeight:n>0?700:400, color:n>0?'var(--text)':'var(--muted)' }}>
                            {n>0 ? n : '—'}
                          </td>
                        )
                      })}
                      <td style={{ padding:'5px 8px', textAlign:'center', fontWeight:700, color:bayColor, background:`${bayColor}11` }}>
                        {tabla.totColor(color)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr style={{ borderTop:'2px solid var(--border)', background:'var(--bg2)' }}>
                  <td style={{ padding:'5px 8px', fontSize:8, fontWeight:700, color:'var(--muted)', textTransform:'uppercase' }}>Tot</td>
                  {tabla.tallas.map(t => (
                    <td key={t} style={{ padding:'5px 6px', textAlign:'center', fontWeight:800, fontSize:11, color:'var(--text)' }}>
                      {tabla.totTalla(t)}
                    </td>
                  ))}
                  <td style={{ padding:'5px 8px', textAlign:'center', fontSize:12, fontWeight:900, color:'#fff', background:bayColor }}>
                    {tabla.gran}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Tienda destino */}
        <div style={{ marginBottom:10 }}>
          <div style={{ fontSize:8, fontWeight:700, color:'var(--muted)', textTransform:'uppercase', letterSpacing:1, marginBottom:5 }}>
            Tienda destino
          </div>
          <div style={{
            background:'var(--bg2)', border:'1px solid var(--border)',
            borderRadius:6, padding:'8px 10px',
            display:'flex', gap:10, alignItems:'center',
          }}>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:11, fontWeight:600, color:'var(--text)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                {prepack.tienda?.nombre || '—'}
              </div>
              <div style={{ fontSize:9, color:'var(--muted)', marginTop:1 }}>
                {prepack.tienda?.ciudad || ''}{prepack.tienda?.estado ? `, ${prepack.tienda.estado}` : ''}
              </div>
            </div>
            <div style={{ textAlign:'center', minWidth:46 }}>
              <div style={{ fontSize:7, color:'var(--muted)', textTransform:'uppercase' }}>Bahía</div>
              <div style={{ fontSize:18, fontWeight:800, color:bayColor, fontFamily:'var(--mono)', lineHeight:1 }}>
                {prepack.bayNumber}
              </div>
            </div>
          </div>
        </div>

        {/* Estatus */}
        <div>
          <div style={{ fontSize:8, fontWeight:700, color:'var(--muted)', textTransform:'uppercase', letterSpacing:1, marginBottom:5 }}>
            Estatus
          </div>
          <div style={{ display:'flex', gap:6 }}>
            <div style={{
              flex:1, padding:'7px 8px', borderRadius:6, textAlign:'center',
              background: prepack.qa_fallido ? 'rgba(239,68,68,0.1)' : 'rgba(76,175,80,0.1)',
              border: `1px solid ${prepack.qa_fallido ? '#ef4444' : '#4caf50'}`,
              display:'flex', flexDirection:'column', alignItems:'center', gap:3,
            }}>
              {prepack.qa_fallido
                ? <IconX size={14} color="#ef4444" />
                : <IconCheck size={14} color="#4caf50" />}
              <div style={{ fontSize:9, fontWeight:700, color: prepack.qa_fallido ? '#ef4444' : '#4caf50' }}>
                {prepack.qa_fallido ? 'QA Falló' : 'QA OK'}
              </div>
            </div>
            <div style={{
              flex:1, padding:'7px 8px', borderRadius:6, textAlign:'center',
              background:'var(--bg2)', border:'1px solid var(--border)',
            }}>
              <div style={{ fontSize:12, fontWeight:800, color:'var(--accent)', lineHeight:1.1 }}>
                {prepack.orden_id || '—'}
              </div>
              <div style={{ fontSize:8, color:'var(--muted)', marginTop:2 }}>orden</div>
            </div>
            <div style={{
              flex:1, padding:'7px 8px', borderRadius:6, textAlign:'center',
              background:`${bayColor}15`, border:`1px solid ${bayColor}`,
            }}>
              <div style={{ fontSize:14, fontWeight:800, color:bayColor, fontFamily:'var(--mono)', lineHeight:1 }}>
                {prepack.bayNumber}
              </div>
              <div style={{ fontSize:8, color:'var(--muted)', marginTop:2 }}>bahía</div>
            </div>
          </div>
        </div>

        <div style={{ fontSize:7, color:'var(--muted)', textAlign:'center', marginTop:10, fontFamily:'var(--mono)' }}>
          EPC: {prepack.epc}
        </div>
      </div>
    </div>
  )
}
