import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { socket } from '../socket/socketClient'
import { DEMO_PREPACKS, BAY_COLORS } from '../data/demoData'
import PrepackDetailPanel from '../components/PrepackDetailPanel'

export default function BayScreen() {
  const { id }     = useParams()
  const bayId      = parseInt(id) || 1
  const bayColor   = BAY_COLORS[bayId] || '#6b7280'

  const prepacksDeBahia = DEMO_PREPACKS.filter(p => p.bayNumber === bayId)

  const terminals = [1, 2, 3].map(termNum => ({
    terminal: termNum,
    prepacks: prepacksDeBahia.filter((_, i) => (i % 3) === (termNum - 1)),
  }))

  const [selected, setSelected] = useState(prepacksDeBahia[0] || null)

  useEffect(() => {
    const handler = (lectura) => {
      if (lectura.etapa !== 'BAHIA') return
      const bayNum = parseInt(lectura.bahia_asignada?.replace('BAHIA-',''))
      if (bayNum !== bayId) return
      const found = DEMO_PREPACKS.find(p => p.epc === lectura.epc)
      if (found) setSelected(found)
    }
    socket.on('lectura', handler)
    socket.on('nueva_lectura', handler)
    return () => {
      socket.off('lectura', handler)
      socket.off('nueva_lectura', handler)
    }
  }, [bayId])

  function PrepackCard({ p, isSelected, onClick }) {
    return (
      <div onClick={onClick} style={{
        background: isSelected ? `${bayColor}20` : 'var(--card-bg)',
        border:`1.5px solid ${isSelected ? bayColor : 'var(--card-border)'}`,
        borderLeft:`3px solid ${bayColor}`,
        borderRadius:6, padding:'8px 10px',
        cursor:'pointer', transition:'all .15s',
        display:'flex', flexDirection:'column', gap:3,
      }}
      onMouseEnter={e => { if (!isSelected) e.currentTarget.style.borderColor='var(--accent)' }}
      onMouseLeave={e => { if (!isSelected) e.currentTarget.style.borderColor='var(--card-border)' }}
      >
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span style={{ fontFamily:'var(--mono)', fontSize:11, fontWeight:700, color:'var(--accent)' }}>
            ···{p.epc.slice(-4)}
          </span>
          <span style={{ fontSize:8, color:'var(--muted)', fontFamily:'var(--mono)' }}>{p.orden_id}</span>
        </div>
        <div style={{ fontSize:11, fontWeight:600, color:'var(--text)', lineHeight:1.2, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
          {p.producto}
        </div>
        <div style={{ fontSize:9, color:'var(--muted)' }}>
          {p.colores.join('·')} — {p.tallas.join(',')} · {p.total_prendas}p
        </div>
        <div style={{ fontSize:9, color:'var(--muted)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
          {p.tienda.nombre}
        </div>
      </div>
    )
  }

  return (
    <div style={{
      display:'grid', gridTemplateRows:'auto 1fr',
      height:'100vh', background:'var(--bg)', overflow:'hidden',
    }}>

      <header style={{
        display:'flex', alignItems:'center', padding:'12px 20px',
        borderBottom:'1px solid var(--border)',
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, flex:1 }}>
          <div style={{
            width:34, height:34, borderRadius:'50%',
            border:`2px solid ${bayColor}`, color:bayColor,
            display:'flex', alignItems:'center', justifyContent:'center',
            fontFamily:'var(--mono)', fontSize:16, fontWeight:700,
          }}>{bayId}</div>
          <span style={{
            fontFamily:'var(--mono)', fontSize:12, letterSpacing:3,
            color:'var(--muted)', textTransform:'uppercase',
          }}>
            Bahía {bayId} — {prepacksDeBahia.length} prepacks
          </span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:5 }}>
          <div style={{ width:6, height:6, borderRadius:'50%', background:'#4caf50', animation:'blink 1.5s ease-in-out infinite' }} />
          <span style={{ fontFamily:'var(--mono)', fontSize:9, color:'#4caf50' }}>En vivo</span>
        </div>
      </header>

      <div style={{ display:'flex', overflow:'hidden', minHeight:0 }}>

        <div style={{
          flex:1,
          display:'grid',
          gridTemplateColumns:'repeat(3, 1fr)',
          gap:1, background:'var(--border)',
          overflow:'hidden', minWidth:0,
        }}>
          {terminals.map(t => (
            <div key={t.terminal} style={{
              background:'var(--bg1)',
              display:'flex', flexDirection:'column',
              overflow:'hidden',
            }}>
              <div style={{
                padding:'12px 14px',
                borderBottom:'1px solid var(--border)',
                flexShrink:0,
              }}>
                <span style={{
                  fontFamily:'var(--mono)', fontSize:10, letterSpacing:3,
                  color:bayColor, textTransform:'uppercase', fontWeight:700,
                }}>
                  Estación {t.terminal}
                </span>
                <span style={{ fontSize:9, color:'var(--muted)', marginLeft:6 }}>
                  · {t.prepacks.length} prepacks
                </span>
              </div>

              <div style={{
                flex:1, padding:'12px 10px',
                display:'flex', flexDirection:'column', gap:8,
                overflowY:'auto',
              }}>
                {t.prepacks.length === 0 && (
                  <p style={{ color:'var(--muted)', fontSize:10, textAlign:'center', marginTop:14 }}>
                    Sin prepacks
                  </p>
                )}
                {t.prepacks.map(p => (
                  <PrepackCard
                    key={p.epc}
                    p={p}
                    isSelected={selected?.epc === p.epc}
                    onClick={() => setSelected(p)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        <div style={{ width:360, flexShrink:0, display:'flex', flexDirection:'column' }}>
          <PrepackDetailPanel prepack={selected} />
        </div>
      </div>
    </div>
  )
}
