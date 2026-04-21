import { useState } from 'react'
import { CARGO_SCENARIOS, PRODUCT_CATALOG, DEFECT_TYPES, MOCK_EPCS, COLOR_MAP,
         calcSampleSize, sampleHint, SUPPLIER_PROFILES } from '../data/demoData'
import NivelBadge  from '../components/NivelBadge'
import Stars       from '../components/Stars'
import OperatorBar from '../components/OperatorBar'

const SINIESTRO_IDLE   = 'idle'
const SINIESTRO_TYPE   = 'type'
const SINIESTRO_RFID   = 'rfid'
const SINIESTRO_DECIDE = 'decide'

export default function OperatorScreen({ suppliers, onReviewFinished }) {
  const [review,     setReview]     = useState(null)
  const [siniestros, setSiniestros] = useState([])
  const [sinStep,    setSinStep]    = useState(SINIESTRO_IDLE)
  const [sinDraft,   setSinDraft]   = useState({ type:null, notes:'', otherText:'', ppk:null })
  const [rfidInput,  setRfidInput]  = useState('')
  const [rfidOk,     setRfidOk]     = useState(false)
  const [cycleIdx,   setCycleIdx]   = useState(0)
  const [cycleNum,   setCycleNum]   = useState(1)

  const startReview = () => {
    const scenario = CARGO_SCENARIOS[cycleIdx % CARGO_SCENARIOS.length]
    const supplier = suppliers.find(s => s.id === scenario.supplierId)
    const profile  = SUPPLIER_PROFILES[scenario.supplierId]
    setReview({ supplier, profile, scenario, sampleSize: calcSampleSize(supplier.stars, scenario.qty) })
    setSiniestros([])
    setSinStep(SINIESTRO_IDLE)
    setSinDraft({ type:null, notes:'', otherText:'', ppk:null })
    setRfidInput('')
    setRfidOk(false)
    setCycleIdx(i => i + 1)
  }

  const finishReview = () => {
    if (!review) return
    onReviewFinished({
      supplierId:  review.supplier.id,
      defectCount: siniestros.filter(s => s.decision === 'reject').length,
      totalSample: review.sampleSize,
    })
    setReview(null)
    setCycleNum(n => n + 1)
  }

  const startSiniestro = () => {
    setSinDraft({ type:null, notes:'', otherText:'', ppk:null })
    setRfidInput('')
    setRfidOk(false)
    setSinStep(SINIESTRO_TYPE)
  }
  const selectType = (cat) => setSinDraft(d => ({ ...d, type: cat }))
  const goToRfid = () => { if (sinDraft.type) setSinStep(SINIESTRO_RFID) }
  const simulateRfid = () => {
    const epc = MOCK_EPCS[siniestros.length % MOCK_EPCS.length]
    setRfidInput(epc); setRfidOk(true)
    setSinDraft(d => ({ ...d, ppk: epc }))
  }
  const goToDecide = () => { if (rfidOk) setSinStep(SINIESTRO_DECIDE) }
  const finalizeSiniestro = (decision) => {
    const type = sinDraft.type === 'Otro (especificar)' && sinDraft.otherText
      ? sinDraft.otherText : sinDraft.type
    setSiniestros(prev => [...prev, {
      id: Date.now(), type, notes: sinDraft.notes, ppk: sinDraft.ppk, decision,
    }])
    setSinStep(SINIESTRO_IDLE)
  }
  const cancelSiniestro = () => setSinStep(SINIESTRO_IDLE)

  if (!review) {
    return (
      <div style={{ padding:'20px 32px', maxWidth:1400, margin:'0 auto' }}>
        <OperatorBar
          name="Luis Ramírez"
          initials="LR"
          employeeId="0042"
          station="Arco RFID Bahía 02"
          status="BAHÍA ACTIVA"
          counterLabel="Revisión"
          counterValue={cycleNum}
        />
        <div style={{
          background:'var(--bg2)', border:'1px solid var(--border)',
          borderRadius:'var(--r2)', padding:40, textAlign:'center',
          animation:'fadeIn .4s ease',
        }}>
          <div style={{
            width:90, height:90, background:'var(--blue-bg)',
            borderRadius:'50%', display:'flex', alignItems:'center',
            justifyContent:'center', margin:'0 auto 20px',
            animation:'pulse-blue 2s infinite', border:'2px solid var(--blue)',
          }}>
            <span style={{ fontSize:36 }}>📦</span>
          </div>
          <p style={{ fontSize:16, fontWeight:500, marginBottom:6 }}>
            Esperando siguiente carga
          </p>
          <p style={{ fontSize:12, color:'var(--text3)', marginBottom:28 }}>
            Presiona el botón cuando llegue un camión al andén
          </p>
          <button onClick={startReview} style={{
            background:'var(--blue)', border:'1px solid var(--blue)',
            borderRadius:'var(--r2)', padding:'13px 32px',
            fontSize:14, fontWeight:600, color:'#fff',
            cursor:'pointer', fontFamily:'var(--font)',
          }}>
            Iniciar revisión — Siguiente carga
          </button>
        </div>
      </div>
    )
  }

  const { supplier, profile, scenario } = review
  const rejected = siniestros.filter(s => s.decision === 'reject').length
  const observed = siniestros.filter(s => s.decision === 'pass').length

  return (
    <div style={{ padding:'20px 32px', maxWidth:1400, margin:'0 auto' }}>

      <OperatorBar
        name="Luis Ramírez"
        initials="LR"
        employeeId="0042"
        station="Arco RFID Bahía 02"
        status="BAHÍA ACTIVA"
        counterLabel="Revisión"
        counterValue={cycleNum}
      />

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gridTemplateRows:'auto auto', gap:14, marginBottom:14 }}>

        {/* SECCIÓN 1 */}
        <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'var(--r2)', padding:18, gridColumn:1, gridRow:1 }}>
          <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:14, paddingBottom:10, borderBottom:'1px solid var(--border)' }}>
            <div style={{ width:8, height:8, borderRadius:'50%', background:'var(--blue)', flexShrink:0 }} />
            <span style={{ fontSize:10, fontWeight:600, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'.08em' }}>1</span>
            <span style={{ fontSize:13, fontWeight:600, color:'var(--text)' }}>Info del cargamento</span>
          </div>

          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:12 }}>
            <div>
              <div style={{ fontSize:16, fontWeight:600, marginBottom:3 }}>{supplier.name}</div>
              <div style={{ fontSize:11, color:'var(--text3)', fontFamily:'var(--mono)', marginBottom:6 }}>
                {profile?.rfc || '—'} · {supplier.origin} · {scenario.po}
              </div>
              <NivelBadge level={supplier.level} color={supplier.color} />
            </div>
            <div style={{ textAlign:'right' }}>
              <div style={{ fontFamily:'var(--mono)', fontSize:28, fontWeight:600, color:'var(--gold)', lineHeight:1 }}>
                {supplier.stars.toFixed(1)}
              </div>
              <Stars rating={supplier.stars} size={13} />
            </div>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:14 }}>
            {[
              { label:'Total prepacks', value:scenario.qty },
              { label:'Entregas previas', value:profile?.deliveries ?? '—' },
              { label:'Aprobación hist.', value:profile ? `${profile.approval}%` : '—' },
            ].map(k => (
              <div key={k.label} style={{ background:'var(--bg3)', borderRadius:'var(--r)', padding:'8px 10px' }}>
                <div style={{ fontSize:9, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:3 }}>{k.label}</div>
                <div style={{ fontFamily:'var(--mono)', fontSize:16, fontWeight:600 }}>{k.value}</div>
              </div>
            ))}
          </div>

          <div style={{ fontSize:10, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'.07em', marginBottom:8 }}>Contenido del cargamento</div>
          {scenario.composition.map((c, i) => {
            const p = PRODUCT_CATALOG.find(x => x.id === c.productId) || { name: c.productId }
            const colorCSS = COLOR_MAP[(c.color||'').toLowerCase()] || '#a855f7'
            const esClaro = ['blanco','white','beige','amarillo'].includes((c.color||'').toLowerCase())
            return (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0', borderBottom:'1px solid var(--border)' }}>
                <span style={{ width:14, height:14, borderRadius:'50%', background:colorCSS, border: esClaro?'1px solid #cbd5e1':'1px solid rgba(255,255,255,0.1)', flexShrink:0 }} />
                <span style={{ flex:1, fontSize:13 }}>
                  {p.name} <span style={{ color:'var(--text3)' }}>· {c.color} · {c.talla}</span>
                </span>
                <span style={{ fontFamily:'var(--mono)', fontSize:13, fontWeight:600, color:'var(--gold)' }}>{c.qty} prenda{c.qty!==1?'s':''}</span>
              </div>
            )
          })}
        </div>

        {/* SECCIÓN 2 */}
        <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'var(--r2)', padding:18, gridColumn:2, gridRow:1 }}>
          <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:14, paddingBottom:10, borderBottom:'1px solid var(--border)' }}>
            <div style={{ width:8, height:8, borderRadius:'50%', background:'var(--amber)', flexShrink:0 }} />
            <span style={{ fontSize:10, fontWeight:600, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'.08em' }}>2</span>
            <span style={{ fontSize:13, fontWeight:600, color:'var(--text)' }}>Muestreo requerido</span>
          </div>

          <div style={{ textAlign:'center', padding:'12px 0 16px' }}>
            <div style={{ fontFamily:'var(--mono)', fontSize:64, fontWeight:600, color:'var(--amber-t)', lineHeight:1, marginBottom:6 }}>
              {review.sampleSize}
            </div>
            <div style={{ fontSize:13, fontWeight:500, marginBottom:6 }}>prepacks a revisar</div>
            <div style={{ fontSize:11, color:'var(--text3)', maxWidth:260, margin:'0 auto' }}>
              {sampleHint(supplier.stars)}
            </div>
          </div>

          <hr style={{ border:'none', borderTop:'1px solid var(--border)', margin:'12px 0' }} />

          <div style={{ fontSize:10, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:10 }}>Progreso</div>
          {[
            { label:'Defectos reportados',     value:siniestros.length, color:'var(--text)' },
            { label:'Prepacks rechazados',      value:rejected,          color:'var(--red-t)' },
            { label:'Pasados con observación',  value:observed,          color:'var(--amber-t)' },
          ].map(r => (
            <div key={r.label} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid var(--border)', fontSize:12 }}>
              <span style={{ color:'var(--text2)' }}>{r.label}</span>
              <span style={{ fontFamily:'var(--mono)', fontSize:15, fontWeight:600, color:r.color }}>{r.value}</span>
            </div>
          ))}

          <div style={{ marginTop:12, padding:'10px 12px', background:'var(--blue-bg)', border:'1px solid #0e1e2e', borderRadius:'var(--r)', fontSize:11, color:'var(--text2)', lineHeight:1.5 }}>
            ⓘ Los prepacks sin reporte de siniestro se asumen como OK al finalizar la revisión.
          </div>
        </div>

        {/* SECCIÓN 3 */}
        <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'var(--r2)', padding:18, gridColumn:'1 / -1', gridRow:2 }}>
          <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:14, paddingBottom:10, borderBottom:'1px solid var(--border)' }}>
            <div style={{ width:8, height:8, borderRadius:'50%', background:'var(--red)', flexShrink:0 }} />
            <span style={{ fontSize:10, fontWeight:600, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'.08em' }}>3</span>
            <span style={{ fontSize:13, fontWeight:600, color:'var(--text)' }}>Captura de siniestros</span>
            <span style={{ marginLeft:'auto', fontFamily:'var(--mono)', fontSize:11, color:'var(--text3)' }}>
              {siniestros.length} reportado(s)
            </span>
          </div>

          {sinStep === SINIESTRO_IDLE && (
            <>
              <button onClick={startSiniestro} style={{
                width:'100%', background:'var(--red-bg)', border:'2px dashed var(--red)',
                borderRadius:'var(--r2)', padding:24, textAlign:'center',
                cursor:'pointer', fontFamily:'var(--font)', color:'var(--text)',
                transition:'background .12s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(193,51,51,0.15)'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--red-bg)'}
              >
                <div style={{ fontSize:32, marginBottom:4 }}>⚠️</div>
                <div style={{ fontSize:15, fontWeight:600 }}>Reportar siniestro en prepack</div>
                <div style={{ fontSize:11, color:'var(--text3)', marginTop:4 }}>Captura defectos, roturas, calidad, etc.</div>
              </button>

              {siniestros.length > 0 && (
                <div style={{ marginTop:14 }}>
                  <div style={{ fontSize:10, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'.07em', marginBottom:8 }}>Siniestros en esta carga</div>
                  {siniestros.map(s => (
                    <div key={s.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:'var(--r)', marginBottom:6 }}>
                      <span style={{ fontSize:18 }}>{s.decision === 'reject' ? '❌' : '⚠️'}</span>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:12, fontWeight:600, fontFamily:'var(--mono)' }}>{s.ppk} · {s.type}</div>
                        <div style={{ fontSize:11, color:'var(--text3)', marginTop:2 }}>{s.notes || 'Sin notas adicionales'}</div>
                      </div>
                      <span style={{
                        fontSize:10, fontWeight:600, padding:'3px 8px', borderRadius:4,
                        textTransform:'uppercase', letterSpacing:'.05em',
                        background: s.decision === 'reject' ? 'var(--red-bg)' : 'var(--amber-bg)',
                        color: s.decision === 'reject' ? 'var(--red-t)' : 'var(--amber-t)',
                        border: `1px solid ${s.decision === 'reject' ? 'var(--red)' : 'var(--amber)'}`,
                      }}>
                        {s.decision === 'reject' ? 'Rechazado' : 'Pasó c/ obs'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {sinStep === SINIESTRO_TYPE && (
            <div style={{ animation:'fadeIn .25s ease' }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14, paddingBottom:10, borderBottom:'1px solid var(--border)' }}>
                <button onClick={cancelSiniestro} style={{ background:'var(--bg3)', border:'1px solid var(--border2)', color:'var(--text2)', width:30, height:30, borderRadius:'var(--r)', cursor:'pointer', fontSize:15, fontFamily:'var(--font)' }}>←</button>
                <span style={{ fontSize:13, fontWeight:600 }}>Paso 1 de 3 · Tipo de defecto</span>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, marginBottom:12 }}>
                {DEFECT_TYPES.map(d => (
                  <button key={d.cat} onClick={() => selectType(d.cat)} style={{
                    background: sinDraft.type === d.cat ? 'var(--red-bg)' : 'var(--bg3)',
                    border: `1px solid ${sinDraft.type === d.cat ? 'var(--red)' : 'var(--border2)'}`,
                    borderRadius:'var(--r)', padding:'12px 10px', textAlign:'center',
                    fontSize:12, fontWeight:500, cursor:'pointer',
                    color: sinDraft.type === d.cat ? 'var(--red-t)' : 'var(--text2)',
                    fontFamily:'var(--font)', display:'flex', flexDirection:'column',
                    alignItems:'center', gap:6, transition:'all .12s',
                  }}>
                    <span style={{ fontSize:20 }}>{d.icon}</span>
                    <span>{d.cat}</span>
                  </button>
                ))}
              </div>
              {sinDraft.type === 'Otro (especificar)' && (
                <div style={{ marginBottom:12, animation:'fadeIn .25s ease' }}>
                  <label style={{ fontSize:10, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'.06em', display:'block', marginBottom:5 }}>Describe el problema</label>
                  <textarea
                    value={sinDraft.otherText}
                    onChange={e => setSinDraft(d => ({ ...d, otherText: e.target.value }))}
                    placeholder="Ej: pintura corrida en logo frontal..."
                    rows={2}
                    style={{ width:'100%', background:'var(--bg3)', border:'1px solid var(--border2)', borderRadius:'var(--r)', padding:'10px 12px', fontSize:13, color:'var(--text)', fontFamily:'var(--font)', resize:'vertical', outline:'none' }}
                  />
                </div>
              )}
              <div style={{ marginBottom:12 }}>
                <label style={{ fontSize:10, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'.06em', display:'block', marginBottom:5 }}>Notas adicionales (opcional)</label>
                <textarea
                  value={sinDraft.notes}
                  onChange={e => setSinDraft(d => ({ ...d, notes: e.target.value }))}
                  placeholder="Ubicación del defecto, severidad..."
                  rows={2}
                  style={{ width:'100%', background:'var(--bg3)', border:'1px solid var(--border2)', borderRadius:'var(--r)', padding:'10px 12px', fontSize:13, color:'var(--text)', fontFamily:'var(--font)', resize:'vertical', outline:'none' }}
                />
              </div>
              <button onClick={goToRfid} disabled={!sinDraft.type} style={{
                width:'100%', background: sinDraft.type ? 'var(--blue)' : 'var(--bg3)',
                border:'none', borderRadius:'var(--r)', padding:12, fontSize:13,
                fontWeight:600, color: sinDraft.type ? '#fff' : 'var(--text3)',
                cursor: sinDraft.type ? 'pointer' : 'not-allowed', fontFamily:'var(--font)',
              }}>
                Continuar al escaneo RFID →
              </button>
            </div>
          )}

          {sinStep === SINIESTRO_RFID && (
            <div style={{ animation:'fadeIn .25s ease' }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14, paddingBottom:10, borderBottom:'1px solid var(--border)' }}>
                <button onClick={() => setSinStep(SINIESTRO_TYPE)} style={{ background:'var(--bg3)', border:'1px solid var(--border2)', color:'var(--text2)', width:30, height:30, borderRadius:'var(--r)', cursor:'pointer', fontSize:15, fontFamily:'var(--font)' }}>←</button>
                <span style={{ fontSize:13, fontWeight:600 }}>Paso 2 de 3 · Identificar prepack</span>
              </div>
              <div style={{ background:'var(--blue-bg)', border:'1px solid var(--blue)', borderRadius:'var(--r2)', padding:24, textAlign:'center' }}>
                <div style={{ fontSize:44, marginBottom:10 }}>📡</div>
                <div style={{ fontSize:15, fontWeight:600, marginBottom:4 }}>Escanea el prepack con defecto</div>
                <div style={{ fontSize:12, color:'var(--text2)', marginBottom:16 }}>
                  Acerca el lector RFID al prepack que presenta: <span style={{ fontFamily:'var(--mono)', color:'var(--red-t)' }}>{sinDraft.type}</span>
                </div>
                <div style={{ maxWidth:340, margin:'0 auto' }}>
                  <input
                    type="text"
                    value={rfidInput}
                    onChange={e => setRfidInput(e.target.value)}
                    placeholder="Esperando lectura RFID..."
                    style={{ width:'100%', background:'var(--bg3)', border:'1px solid var(--border2)', borderRadius:'var(--r)', padding:'10px 12px', fontSize:13, color:'var(--text)', fontFamily:'var(--mono)', textAlign:'center', outline:'none' }}
                  />
                  <button onClick={simulateRfid} style={{ background:'var(--blue)', border:'none', borderRadius:'var(--r)', padding:'8px 16px', fontSize:12, fontWeight:600, color:'#fff', cursor:'pointer', fontFamily:'var(--font)', marginTop:10 }}>
                    Simular lectura RFID
                  </button>
                </div>
              </div>
              {rfidOk && (
                <div style={{ marginTop:14 }}>
                  <div style={{ background:'var(--green-bg)', border:'1px solid var(--green)', borderRadius:'var(--r)', padding:14, textAlign:'center', marginBottom:12 }}>
                    <div style={{ fontSize:12, color:'var(--green-t)', fontWeight:600, marginBottom:4 }}>✓ PREPACK IDENTIFICADO</div>
                    <div style={{ fontFamily:'var(--mono)', fontSize:18 }}>{sinDraft.ppk}</div>
                  </div>
                  <button onClick={goToDecide} style={{ width:'100%', background:'var(--blue)', border:'none', borderRadius:'var(--r)', padding:12, fontSize:13, fontWeight:600, color:'#fff', cursor:'pointer', fontFamily:'var(--font)' }}>
                    Continuar a decisión →
                  </button>
                </div>
              )}
            </div>
          )}

          {sinStep === SINIESTRO_DECIDE && (
            <div style={{ animation:'fadeIn .25s ease' }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14, paddingBottom:10, borderBottom:'1px solid var(--border)' }}>
                <button onClick={() => setSinStep(SINIESTRO_RFID)} style={{ background:'var(--bg3)', border:'1px solid var(--border2)', color:'var(--text2)', width:30, height:30, borderRadius:'var(--r)', cursor:'pointer', fontSize:15, fontFamily:'var(--font)' }}>←</button>
                <span style={{ fontSize:13, fontWeight:600 }}>Paso 3 de 3 · Decisión final</span>
              </div>
              <div style={{ background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:'var(--r)', padding:'12px 14px', marginBottom:12 }}>
                {[
                  { label:'Prepack', value:sinDraft.ppk, mono:true },
                  { label:'Defecto', value:sinDraft.type },
                ].map(r => (
                  <div key={r.label} style={{ display:'flex', justifyContent:'space-between', padding:'6px 0', borderBottom:'1px solid var(--border)', fontSize:12 }}>
                    <span style={{ color:'var(--text3)' }}>{r.label}</span>
                    <span style={{ fontFamily: r.mono ? 'var(--mono)' : 'var(--font)', fontWeight:500 }}>{r.value}</span>
                  </div>
                ))}
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                <button onClick={() => finalizeSiniestro('reject')} style={{
                  borderRadius:'var(--r2)', padding:18, textAlign:'center',
                  cursor:'pointer', border:'2px solid var(--border2)',
                  background:'var(--bg3)', fontFamily:'var(--font)', transition:'all .12s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--red-bg)'; e.currentTarget.style.borderColor = 'var(--red)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg3)';   e.currentTarget.style.borderColor = 'var(--border2)' }}
                >
                  <div style={{ fontSize:24 }}>❌</div>
                  <div style={{ fontSize:13, fontWeight:600, color:'var(--red-t)', marginTop:4 }}>Rechazar</div>
                  <div style={{ fontSize:10, color:'var(--text3)', marginTop:2 }}>No entra al flujo</div>
                </button>
                <button onClick={() => finalizeSiniestro('pass')} style={{
                  borderRadius:'var(--r2)', padding:18, textAlign:'center',
                  cursor:'pointer', border:'2px solid var(--border2)',
                  background:'var(--bg3)', fontFamily:'var(--font)', transition:'all .12s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--amber-bg)'; e.currentTarget.style.borderColor = 'var(--amber)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg3)';      e.currentTarget.style.borderColor = 'var(--border2)' }}
                >
                  <div style={{ fontSize:24 }}>⚠️</div>
                  <div style={{ fontSize:13, fontWeight:600, color:'var(--amber-t)', marginTop:4 }}>Pasar con obs.</div>
                  <div style={{ fontSize:10, color:'var(--text3)', marginTop:2 }}>Entra con penalización</div>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={{
        display:'flex', alignItems:'center', justifyContent:'space-between', gap:20,
        background:'var(--bg2)', border:'1px solid var(--border)',
        borderRadius:'var(--r2)', padding:'14px 18px',
      }}>
        <p style={{ fontSize:12, color:'var(--text2)', flex:1 }}>
          Cuando termines la inspección de la muestra, cierra la revisión para liberar la carga y actualizar la calificación del proveedor.
        </p>
        <button onClick={finishReview} style={{
          background:'#1a7a4a', border:'none', borderRadius:'var(--r)',
          padding:'12px 24px', fontSize:14, fontWeight:600, color:'#fff',
          cursor:'pointer', fontFamily:'var(--font)', flexShrink:0,
        }}
        onMouseEnter={e => e.currentTarget.style.background = '#1e8a54'}
        onMouseLeave={e => e.currentTarget.style.background = '#1a7a4a'}
        >
          Terminar revisión →
        </button>
      </div>
    </div>
  )
}
