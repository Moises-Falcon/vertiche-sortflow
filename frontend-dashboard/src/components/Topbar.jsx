import { useState, useEffect } from 'react'
import { DIA } from '../data/dashboardData'

export default function Topbar() {
  const [time, setTime] = useState('')

  useEffect(() => {
    const tick = () => {
      const n = new Date(), p = v => String(v).padStart(2,'0')
      setTime(`${n.getFullYear()}-${p(n.getMonth()+1)}-${p(n.getDate())} | ${p(n.getHours())}:${p(n.getMinutes())}:${p(n.getSeconds())}`)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <>
      <div style={{ display:'flex', alignItems:'center', height:46, padding:'0 18px', background:'#ffffff', borderBottom:'1px solid #dde3dd' }}>
        <div style={{ display:'flex', alignItems:'center', fontFamily:'Rajdhani,sans-serif', fontSize:16, fontWeight:700, letterSpacing:'.1em', color:'#111', borderRight:'1px solid #dde3dd', paddingRight:16, marginRight:14 }}>
          <div style={{ width:3, height:18, background:'#1a9060', marginRight:8 }} />
          VERTICHE
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:11, color:'#8aa090', fontWeight:500, letterSpacing:'.04em' }}>
          <span style={{ color:'#2a3a2e' }}>OPERACIÓN EN VIVO</span>
        </div>
        <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:18, fontSize:11, color:'#6a8070' }}>
          <span>
            <span style={{ display:'inline-block', width:7, height:7, borderRadius:'50%', background:'#1a9060', marginRight:5, boxShadow:'0 0 5px rgba(26,144,96,0.5)', animation:'pulse 2s ease-in-out infinite' }} />
            EN VIVO
          </span>
          <span style={{ fontFamily:'monospace' }}>{time}</span>
        </div>
      </div>

      <div style={{ display:'flex', alignItems:'center', gap:22, height:36, padding:'0 18px', background:'#ffffff', borderBottom:'1px solid #dde3dd' }}>
        <span style={{ fontSize:12, color:'#6a8070' }}>CEDI: <strong style={{ color:'#1a1e1a', fontWeight:600 }}>{DIA.cedi}</strong></span>
        <span style={{ fontSize:12, color:'#6a8070' }}>OPERADORES: <strong style={{ color:'#1a1e1a', fontWeight:600 }}>{DIA.operadores}</strong></span>
        <span style={{ background:'rgba(26,144,96,0.08)', border:'1px solid rgba(26,144,96,0.25)', color:'#1a7a50', fontSize:11, fontWeight:600, letterSpacing:'.04em', padding:'2px 10px', borderRadius:3 }}>
          UMBRAL: {DIA.umbral} paq/min
        </span>
      </div>
    </>
  )
}
