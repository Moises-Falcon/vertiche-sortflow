import { useEffect } from 'react'
import { BAY_COLORS, getColorCSS, esColorClaro } from '../data/demoData'

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

export default function PrepackDetailModal({ prepack, onClose }) {
  useEffect(() => {
    const h = e => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [onClose])

  if (!prepack) return null

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
    <div onClick={onClose} style={{
      position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', zIndex:600,
      display:'flex', alignItems:'center', justifyContent:'center', padding:20,
      animation:'fadeIn .18s ease',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width:'100%', maxWidth:680, maxHeight:'90vh',
        background:'var(--bg1)', border:'1px solid var(--border)',
        borderRadius:14, overflow:'hidden', display:'flex', flexDirection:'column',
        boxShadow:'0 24px 64px rgba(0,0,0,0.6)',
      }}>

        {/* HEADER */}
        <div style={{
          padding:'16px 20px', borderBottom:'1px solid var(--border)',
          display:'flex', alignItems:'center', gap:14,
          background:`linear-gradient(135deg, ${bayColor}15, transparent)`,
        }}>
          {/* Muestra de color (multi o single) */}
          {colUnicos.length > 1 ? (
            <div style={{
              width:64, height:64, borderRadius:10, flexShrink:0,
              background:'var(--bg2)', border:'1px solid var(--border)',
              display:'flex', flexWrap:'wrap', alignItems:'center', justifyContent:'center',
              gap:4, padding:8,
            }}>
              {colUnicos.slice(0,4).map(c => (
                <div key={c} title={c} style={{
                  width:22, height:22, borderRadius:'50%',
                  background:getColorCSS(c),
                  border:esColorClaro(c)?'1.5px solid #cbd5e1':'1.5px solid rgba(255,255,255,0.15)',
                }}/>
              ))}
            </div>
          ) : (
            <div style={{
              width:64, height:64, borderRadius:10, flexShrink:0,
              background:cCSS, border:esC?'2px solid var(--border)':'none',
              display:'flex', alignItems:'center', justifyContent:'center',
              boxShadow:'0 2px 10px rgba(0,0,0,0.3)',
            }}>
              <span style={{ fontSize:10, fontWeight:700, color:txtC, textAlign:'center' }}>
                {colorPrincipal}
              </span>
            </div>
          )}

          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
              <span style={{
                fontFamily:'var(--mono)', fontSize:12, fontWeight:700,
                color:bayColor, background:`${bayColor}22`,
                border:`1px solid ${bayColor}55`,
                borderRadius:6, padding:'2px 10px',
              }}>{codigoCorto}</span>
              <span style={{ fontSize:9, color:'var(--muted)', fontFamily:'var(--mono)', letterSpacing:1 }}>
                CÓDIGO PREPACK
              </span>
            </div>
            <div style={{ fontSize:16, fontWeight:700, color:'var(--text)', lineHeight:1.2, marginBottom:2 }}>
              {prendas.length} prenda{prendas.length!==1?'s':''} — {colUnicos.join(' / ')}
            </div>
            <div style={{ fontSize:10, color:'var(--muted)' }}>
              {prepack.producto || '—'} · {prepack.proveedor || '—'}
            </div>
          </div>

          <button onClick={onClose} style={{
            background:'none', border:'1px solid var(--border)',
            borderRadius:6, width:30, height:30, cursor:'pointer',
            color:'var(--muted)', fontSize:16,
            display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
          }}>×</button>
        </div>

        {/* BODY */}
        <div style={{ padding:'16px 20px', overflow:'auto' }}>

          {/* Info grid */}
          <div style={{
            display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px 16px', marginBottom:16,
          }}>
            <div>
              <div style={{ fontSize:8, fontWeight:700, color:'var(--muted)', textTransform:'uppercase', letterSpacing:1, marginBottom:3 }}>Colores</div>
              <div style={{ fontSize:12, fontWeight:700, color:'var(--text)' }}>{colUnicos.join(' / ')}</div>
            </div>
            <div>
              <div style={{ fontSize:8, fontWeight:700, color:'var(--muted)', textTransform:'uppercase', letterSpacing:1, marginBottom:3 }}>Tallas</div>
              <div style={{ fontSize:12, fontWeight:700, color:'var(--text)' }}>{tallUnicas.join(', ')}</div>
            </div>
            <div>
              <div style={{ fontSize:8, fontWeight:700, color:'var(--muted)', textTransform:'uppercase', letterSpacing:1, marginBottom:3 }}>Prendas</div>
              <div style={{ fontSize:13, fontWeight:700, color:'var(--accent)' }}>{prendas.length}</div>
            </div>
            <div>
              <div style={{ fontSize:8, fontWeight:700, color:'var(--muted)', textTransform:'uppercase', letterSpacing:1, marginBottom:3 }}>Tipo flujo</div>
              <div style={{ fontSize:11, color:'var(--text)' }}>{prepack.tipo_flujo || '—'}</div>
            </div>
          </div>

          {/* Tabla color × talla */}
          <div style={{ marginBottom:16 }}>
            <div style={{ fontSize:8, fontWeight:700, color:'var(--muted)', textTransform:'uppercase', letterSpacing:1, marginBottom:8 }}>
              Contenido del prepack
            </div>
            <div style={{ borderRadius:8, border:'1px solid var(--border)', overflow:'hidden' }}>
              <table style={{ borderCollapse:'collapse', width:'100%', fontSize:11 }}>
                <thead>
                  <tr style={{ background:'var(--bg2)' }}>
                    <th style={{ padding:'6px 10px', textAlign:'left', fontSize:8, fontWeight:700, color:'var(--muted)', textTransform:'uppercase' }}>Color</th>
                    {tabla.tallas.map(t => (
                      <th key={t} style={{ padding:'6px 10px', textAlign:'center', fontSize:8, fontWeight:700, color:'var(--muted)', textTransform:'uppercase' }}>{t}</th>
                    ))}
                    <th style={{ padding:'6px 10px', textAlign:'center', fontSize:8, fontWeight:700, color:bayColor, background:`${bayColor}22` }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {tabla.colores.map((color, idx) => {
                    const cCol = getColorCSS(color)
                    const eC = esColorClaro(color)
                    return (
                      <tr key={color} style={{ background:idx%2===0?'transparent':'rgba(255,255,255,0.02)', borderTop:'1px solid var(--border)' }}>
                        <td style={{ padding:'7px 10px', fontWeight:600, color:'var(--text)' }}>
                          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                            <div style={{ width:12, height:12, borderRadius:'50%', background:cCol, border:eC?'1px solid #cbd5e1':'1px solid rgba(255,255,255,0.15)', flexShrink:0 }}/>
                            {color}
                          </div>
                        </td>
                        {tabla.tallas.map(t => {
                          const n = tabla.conteo(color, t)
                          return (
                            <td key={t} style={{ padding:'7px 10px', textAlign:'center', fontWeight:n>0?700:400, color:n>0?'var(--text)':'var(--muted)' }}>
                              {n>0 ? n : '—'}
                            </td>
                          )
                        })}
                        <td style={{ padding:'7px 10px', textAlign:'center', fontWeight:700, color:bayColor, background:`${bayColor}11` }}>
                          {tabla.totColor(color)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ borderTop:'2px solid var(--border)', background:'var(--bg2)' }}>
                    <td style={{ padding:'7px 10px', fontSize:8, fontWeight:700, color:'var(--muted)', textTransform:'uppercase' }}>Total</td>
                    {tabla.tallas.map(t => (
                      <td key={t} style={{ padding:'7px 10px', textAlign:'center', fontWeight:800, fontSize:12, color:'var(--text)' }}>
                        {tabla.totTalla(t)}
                      </td>
                    ))}
                    <td style={{ padding:'7px 10px', textAlign:'center', fontSize:14, fontWeight:900, color:'#fff', background:bayColor }}>
                      {tabla.gran}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Tienda destino */}
          <div style={{ marginBottom:14 }}>
            <div style={{ fontSize:8, fontWeight:700, color:'var(--muted)', textTransform:'uppercase', letterSpacing:1, marginBottom:8 }}>
              Tienda destino
            </div>
            <div style={{
              background:'var(--bg2)', border:'1px solid var(--border)',
              borderRadius:8, padding:'10px 14px',
              display:'flex', gap:16, alignItems:'center',
            }}>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:600, color:'var(--text)' }}>{prepack.tienda?.nombre || '—'}</div>
                <div style={{ fontSize:10, color:'var(--muted)', marginTop:2 }}>
                  {prepack.tienda?.ciudad || ''}{prepack.tienda?.estado ? `, ${prepack.tienda.estado}` : ''}
                </div>
              </div>
              <div style={{ textAlign:'center', minWidth:60 }}>
                <div style={{ fontSize:8, color:'var(--muted)', textTransform:'uppercase', marginBottom:2 }}>Bahía</div>
                <div style={{
                  fontSize:18, fontWeight:800, color:bayColor,
                  fontFamily:'var(--mono)',
                }}>
                  {prepack.bayNumber}
                </div>
              </div>
            </div>
          </div>

          {/* Estatus */}
          <div>
            <div style={{ fontSize:8, fontWeight:700, color:'var(--muted)', textTransform:'uppercase', letterSpacing:1, marginBottom:8 }}>
              Estatus
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <div style={{
                flex:1, padding:'8px 12px', borderRadius:8, textAlign:'center',
                background: prepack.qa_fallido ? 'rgba(239,68,68,0.1)' : 'rgba(76,175,80,0.1)',
                border: `1px solid ${prepack.qa_fallido ? '#ef4444' : '#4caf50'}`,
              }}>
                <div style={{ fontSize:14, marginBottom:2 }}>{prepack.qa_fallido ? '✗' : '✓'}</div>
                <div style={{ fontSize:10, fontWeight:700, color: prepack.qa_fallido ? '#ef4444' : '#4caf50' }}>
                  {prepack.qa_fallido ? 'QA Falló' : 'Calidad OK'}
                </div>
              </div>
              <div style={{
                flex:1, padding:'8px 12px', borderRadius:8, textAlign:'center',
                background:'var(--bg2)', border:'1px solid var(--border)',
              }}>
                <div style={{ fontSize:13, fontWeight:800, color:'var(--accent)', marginBottom:2 }}>
                  {prepack.orden_id || '—'}
                </div>
                <div style={{ fontSize:9, color:'var(--muted)' }}>orden de compra</div>
              </div>
              <div style={{
                flex:1, padding:'8px 12px', borderRadius:8, textAlign:'center',
                background:`${bayColor}15`, border:`1px solid ${bayColor}`,
              }}>
                <div style={{ fontSize:18, fontWeight:800, color:bayColor, fontFamily:'var(--mono)' }}>
                  {prepack.bayNumber}
                </div>
                <div style={{ fontSize:9, color:'var(--muted)' }}>bahía destino</div>
              </div>
            </div>
          </div>

          <div style={{ fontSize:8, color:'var(--muted)', textAlign:'center', marginTop:14 }}>
            EPC: <code style={{ fontFamily:'var(--mono)' }}>{prepack.epc}</code>
          </div>
        </div>
      </div>
    </div>
  )
}
