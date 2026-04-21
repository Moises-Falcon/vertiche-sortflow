import { useEffect, useRef } from 'react'
import { Chart, DoughnutController, ArcElement, Tooltip, Legend } from 'chart.js'
import { MODALS } from '../data/dashboardData'

Chart.register(DoughnutController, ArcElement, Tooltip, Legend)

const BADGE_STYLE = {
  ok:     { bg:'#e6f7ef', color:'#1a7a4a', border:'#a8dfc0' },
  alerta: { bg:'#fde8e8', color:'#c03020', border:'#f5b8b8' },
  warn:   { bg:'#fef3e0', color:'#8a5e10', border:'#f5d090' },
}
const KV_COLOR = { g:'#1a7a4a', a:'#d4860c', r:'#c83020' }

export default function StageModal({ stageKey, onClose }) {
  const donutRef  = useRef(null)
  const chartInst = useRef(null)
  const open      = !!stageKey
  const modal     = stageKey ? MODALS[stageKey] : null

  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  useEffect(() => {
    if (!open || !modal?.donut || !donutRef.current) return
    if (chartInst.current) chartInst.current.destroy()
    const t = setTimeout(() => {
      if (!donutRef.current) return
      chartInst.current = new Chart(donutRef.current, {
        type: 'doughnut',
        data: {
          labels: modal.donutData.labels,
          datasets: [{ data: modal.donutData.data, backgroundColor: modal.donutData.colors, borderWidth: 0, hoverOffset: 4 }],
        },
        options: {
          responsive: true, maintainAspectRatio: false, cutout: '68%',
          plugins: {
            legend: { display: false },
            tooltip: { callbacks: { label: ctx => `${ctx.label}: ${ctx.raw}%` } },
          },
        },
      })
    }, 50)
    return () => { clearTimeout(t); chartInst.current?.destroy() }
  }, [open, stageKey, modal])

  if (!open || !modal) return null
  const bs = BADGE_STYLE[modal.badgeType] || BADGE_STYLE.ok

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position:'fixed', inset:0, background:'rgba(0,0,0,0.72)',
        zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center',
        backdropFilter:'blur(2px)', animation:'fadeIn .2s ease',
      }}
    >
      <div style={{
        background:'#ffffff', color:'#111', borderRadius:6,
        width:420, maxWidth:'95vw', maxHeight:'90vh',
        overflowY:'auto', boxShadow:'0 20px 60px rgba(0,0,0,0.5)',
        fontFamily:'Inter,sans-serif', colorScheme:'light',
      }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'18px 22px 14px', borderBottom:'1px solid #e5eae6', position:'sticky', top:0, background:'#ffffff', zIndex:1 }}>
          <div style={{ display:'flex', alignItems:'center' }}>
            <span style={{ fontFamily:'Rajdhani,sans-serif', fontSize:18, fontWeight:700, letterSpacing:'.1em', color:'#111' }}>{modal.title}</span>
            <span style={{ fontSize:10, fontWeight:700, letterSpacing:'.08em', padding:'3px 10px', borderRadius:3, marginLeft:10, background:bs.bg, color:bs.color, border:`1px solid ${bs.border}` }}>
              {modal.badge}
            </span>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'#aaa', cursor:'pointer', fontSize:22, lineHeight:1, padding:'0 4px' }}>×</button>
        </div>

        <div style={{ padding:'20px 22px', background:'#ffffff', color:'#111' }}>
          <div style={{ fontSize:10, letterSpacing:'.1em', color:'#7a9080', fontWeight:500, textTransform:'uppercase', marginBottom:4 }}>{modal.kpiLabel}</div>
          <div style={{ fontFamily:'Rajdhani,sans-serif', fontSize:40, fontWeight:700, lineHeight:1, color:KV_COLOR[modal.kpiColor], marginBottom:4 }}>{modal.kpiVal}</div>

          <div style={{ height:1, background:'#e5eae6', margin:'16px 0' }} />

          {modal.stats2 && (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', border:'1px solid #e5eae6', borderRadius:4, overflow:'hidden', marginBottom:12 }}>
              {modal.stats2.map((s,i) => (
                <div key={i} style={{ padding:'12px 14px', borderRight: i===0 ? '1px solid #e5eae6' : 'none', background:'#ffffff' }}>
                  <div style={{ fontSize:10, letterSpacing:'.08em', color:'#8a9e90', fontWeight:500, textTransform:'uppercase', marginBottom:4 }}>{s.label}</div>
                  <div style={{ fontFamily:'Rajdhani,sans-serif', fontSize:26, fontWeight:700, lineHeight:1, color: s.valColor || '#111' }}>{s.val}</div>
                  {s.sub && <div style={{ fontSize:11, color: s.subColor || '#aaa', marginTop:2 }}>{s.sub}</div>}
                </div>
              ))}
            </div>
          )}

          {modal.alertBanner && (
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', borderRadius:3, margin:'10px 0', background:'#fdf0f0', border:'1px solid #f0c0bc' }}>
              <div style={{ fontSize:12, fontWeight:600, color:'#c03020' }}>{modal.alertBanner.msg}</div>
              <div style={{ fontFamily:'Rajdhani,sans-serif', fontSize:28, fontWeight:700, color:'#c83020' }}>{modal.alertBanner.pct}</div>
            </div>
          )}

          {modal.stats4 && (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:12 }}>
              {modal.stats4.map((s,i) => (
                <div key={i} style={{ background:'#f5f8f5', border:'1px solid #e0e8e2', borderRadius:3, padding:'11px 13px' }}>
                  <div style={{ fontSize:10, letterSpacing:'.08em', color:'#8a9e90', marginBottom:3, textTransform:'uppercase', fontWeight:500 }}>{s.label}</div>
                  <div style={{ fontFamily:'Rajdhani,sans-serif', fontSize:22, fontWeight:700, lineHeight:1, color: s.valColor || '#111' }}>{s.val}</div>
                  {s.sub && <div style={{ fontSize:11, color:'#aaa', marginTop:2 }}>{s.sub}</div>}
                </div>
              ))}
            </div>
          )}

          {modal.donut && (
            <>
              <div style={{ fontSize:10, letterSpacing:'.1em', color:'#8a9e90', fontWeight:500, textTransform:'uppercase', marginBottom:10 }}>DISTRIBUCIÓN DE CARGA</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, alignItems:'center', marginBottom:12 }}>
                <div style={{ position:'relative', height:160 }}>
                  <canvas ref={donutRef} />
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  {modal.donutData.labels.map((lbl,i) => (
                    <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:13 }}>
                      <span style={{ display:'flex', alignItems:'center', gap:6, color:'#333' }}>
                        <span style={{ width:10, height:10, borderRadius:2, background:modal.donutData.colors[i], display:'inline-block' }} />
                        {lbl}
                      </span>
                      <span style={{ fontWeight:600, color:modal.donutData.colors[i], fontFamily:'Rajdhani,sans-serif', fontSize:16 }}>
                        {modal.donutData.data[i]}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {modal.bars && modal.bars.map((bar, i) => (
            <div key={i} style={{ marginBottom:10 }}>
              {i===0 && <div style={{ fontSize:10, letterSpacing:'.1em', color:'#8a9e90', fontWeight:500, textTransform:'uppercase', marginBottom:10 }}>
                {stageKey === 'qa' ? 'TASA VS UMBRALES' : stageKey === 'sorter' ? 'VELOCIDAD VS UMBRAL (32 pp/min)' : stageKey === 'auditoria' ? 'TASA VS UMBRALES' : 'SALIDA REAL VS ESPERADA'}
              </div>}
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5, fontSize:12 }}>
                <span style={{ color:'#333' }}>{bar.name}</span>
                <span style={{ color: bar.valColor || '#555', fontWeight:500 }}>{bar.pct}</span>
              </div>
              <div style={{ height:5, background:'#e8eee9', borderRadius:2, overflow:'visible', position:'relative', marginBottom: bar.thresholds ? 18 : 0 }}>
                <div style={{ height:'100%', borderRadius:2, overflow:'hidden' }}>
                  <div style={{ height:'100%', background:bar.color, width:`${bar.fill}%` }} />
                </div>
                {bar.thresholds?.map((t,ti) => (
                  <div key={ti} style={{ position:'absolute', top:-3, left:`${t.pos}%`, width:1, height:11, background:'rgba(0,0,0,0.18)' }}>
                    <span style={{ position:'absolute', top:10, fontSize:9, color:'#aaa', transform:'translateX(-50%)', whiteSpace:'nowrap' }}>{t.lbl}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {modal.stacked && (
            <>
              <div style={{ fontSize:10, letterSpacing:'.1em', color:'#8a9e90', fontWeight:500, textTransform:'uppercase', marginBottom:10 }}>
                {stageKey === 'qa' ? 'ACEPTADOS / RECHAZADOS' : stageKey === 'sorter' ? 'AVANCE DEL DÍA' : 'AVANCE DE AUDITORÍA'}
              </div>
              <div style={{ height:7, borderRadius:3, display:'flex', overflow:'hidden', gap:1 }}>
                {modal.stacked.segments.map((seg,i) => (
                  <div key={i} style={{ width:`${seg.pct}%`, background:seg.color, borderRadius: i===0 ? '3px 0 0 3px' : '0 3px 3px 0' }} />
                ))}
              </div>
              <div style={{ display:'flex', gap:14, fontSize:11, color:'#8a9e90', marginTop:5, flexWrap:'wrap' }}>
                {modal.stacked.legend.map((l,i) => (
                  <span key={i} style={{ display:'flex', alignItems:'center', gap:4 }}>
                    <span style={{ width:8, height:8, borderRadius:1, background:l.color, flexShrink:0 }} />
                    {l.label}
                  </span>
                ))}
              </div>
            </>
          )}

          {modal.tablaBahias && (
            <>
              <div style={{ height:1, background:'#e5eae6', margin:'16px 0' }} />
              <div style={{ fontSize:10, letterSpacing:'.1em', color:'#8a9e90', fontWeight:500, textTransform:'uppercase', marginBottom:10 }}>DETALLE POR BAHÍA</div>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12, background:'#ffffff' }}>
                <thead>
                  <tr>
                    {['BAHÍA','PREPACKS','PP/MIN','ESTADO'].map(h => (
                      <th key={h} style={{ fontSize:10, letterSpacing:'.08em', color:'#8a9e90', fontWeight:500, textTransform:'uppercase', textAlign:'left', padding:'0 10px 7px 0', borderBottom:'1px solid #e5eae6' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {modal.tablaBahias.map((row,i) => (
                    <tr key={i}>
                      <td style={{ padding:'8px 10px 8px 0', borderBottom:'1px solid #e5eae6', color:'#111', fontWeight:500 }}>{row.bahia}</td>
                      <td style={{ padding:'8px 10px 8px 0', borderBottom:'1px solid #e5eae6', color:'#444' }}>{row.prepacks}</td>
                      <td style={{ padding:'8px 10px 8px 0', borderBottom:'1px solid #e5eae6', color:'#444' }}>{row.ppm}</td>
                      <td style={{ padding:'8px 10px 8px 0', borderBottom:'1px solid #e5eae6' }}>
                        <span style={{ fontSize:10, padding:'1px 7px', borderRadius:2, fontWeight:600, ...(row.ok ? { background:'#e8f5ee', color:'#1a7a4a', border:'1px solid #b0ddc0' } : { background:'#fde8e8', color:'#c03020', border:'1px solid #f0b8b8' }) }}>
                          {row.ok ? 'OK' : 'ALERTA'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          {modal.tablaDiscrepancias && (
            <>
              <div style={{ height:1, background:'#e5eae6', margin:'16px 0' }} />
              <div style={{ fontSize:10, letterSpacing:'.1em', color:'#8a9e90', fontWeight:500, textTransform:'uppercase', marginBottom:10 }}>TIENDAS CON DISCREPANCIA</div>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                <thead>
                  <tr>
                    {['TIENDA','ESPERADAS','ENVIADAS','DIFF'].map(h => (
                      <th key={h} style={{ fontSize:10, letterSpacing:'.08em', color:'#8a9e90', fontWeight:500, textTransform:'uppercase', textAlign:'left', padding:'0 10px 7px 0', borderBottom:'1px solid #e5eae6' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {modal.tablaDiscrepancias.map((row,i) => (
                    <tr key={i}>
                      <td style={{ padding:'8px 10px 8px 0', color:'#111', fontWeight:500 }}>#{row.tienda}</td>
                      <td style={{ padding:'8px 10px 8px 0', color:'#444' }}>{row.esperadas}</td>
                      <td style={{ padding:'8px 10px 8px 0', color:'#444' }}>{row.enviadas}</td>
                      <td style={{ padding:'8px 10px 8px 0', color:'#c83020', fontWeight:600 }}>{row.diff}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          {modal.banners && (
            <>
              <div style={{ height:1, background:'#e5eae6', margin:'16px 0' }} />
              {modal.banners.map((b,i) => {
                const style = {
                  r: { bg:'#fdf0f0', border:'#f0c0bc', color:'#c03020' },
                  a: { bg:'#fef8ee', border:'#f0d898', color:'#8a5e10' },
                  g: { bg:'#edf8f2', border:'#a0d8b8', color:'#1a7a4a' },
                }[b.type]
                return (
                  <div key={i} style={{ display:'flex', alignItems:'center', padding:'10px 14px', borderRadius:3, margin:'10px 0', background:style.bg, border:`1px solid ${style.border}` }}>
                    <span style={{ fontSize:12, fontWeight:600, color:style.color }}>{b.msg}</span>
                  </div>
                )
              })}
            </>
          )}
        </div>

        <button style={{
          width:'100%', padding:14,
          background:'#2a6e3a', color:'#ffffff',
          fontFamily:'Inter,sans-serif', fontSize:11, fontWeight:600,
          letterSpacing:'.1em', border:'none', cursor:'pointer',
          display:'flex', alignItems:'center', justifyContent:'center', gap:8,
          textTransform:'uppercase', borderRadius:'0 0 6px 6px',
        }}
        onMouseEnter={e => e.currentTarget.style.background = '#236030'}
        onMouseLeave={e => e.currentTarget.style.background = '#2a6e3a'}
        >
          GENERAR REPORTE DE ETAPA
        </button>
      </div>
    </div>
  )
}
