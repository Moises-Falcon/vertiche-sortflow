import { useState, useEffect } from 'react'
import { DIA } from '../data/dashboardData'
import ThemeToggle from '../theme/ThemeToggle'

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
      <div style={{ display:'flex', alignItems:'center', height:56, padding:'0 20px', background:'var(--bg-card)', borderBottom:'1px solid var(--border)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, flexShrink:0, marginRight:20 }}>
          <div style={{
            width:32, height:32, borderRadius:8, background:'#4F46E5',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:15, fontWeight:700, color:'#fff', fontFamily:'IBM Plex Mono, monospace',
          }}>V</div>
          <div>
            <div style={{ color:'var(--text)', fontSize:13, fontWeight:600, lineHeight:1.1, letterSpacing:'.02em' }}>VERTICHE</div>
            <div style={{ color:'var(--text-muted)', fontSize:10, lineHeight:1.4, letterSpacing:'.1em', textTransform:'uppercase' }}>SortFlow · Dashboard</div>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:11, color:'var(--text-muted)', fontWeight:500, letterSpacing:'.04em', borderLeft:'1px solid var(--border)', paddingLeft:16 }}>
          <span style={{ color:'var(--text)' }}>OPERACIÓN EN VIVO</span>
        </div>
        <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:14, fontSize:11, color:'var(--text-2)' }}>
          <span>
            <span style={{ display:'inline-block', width:7, height:7, borderRadius:'50%', background:'#1a9060', marginRight:5, boxShadow:'0 0 5px rgba(26,144,96,0.5)', animation:'pulse 2s ease-in-out infinite' }} />
            EN VIVO
          </span>
          <span style={{ fontFamily:'monospace' }}>{time}</span>
          <ThemeToggle size={28} />
        </div>
      </div>

      <div style={{ display:'flex', alignItems:'center', gap:22, height:36, padding:'0 18px', background:'var(--bg-card)', borderBottom:'1px solid var(--border)' }}>
        <span style={{ fontSize:12, color:'var(--text-2)' }}>CEDI: <strong style={{ color:'var(--text)', fontWeight:600 }}>{DIA.cedi}</strong></span>
        <span style={{ fontSize:12, color:'var(--text-2)' }}>OPERADORES: <strong style={{ color:'var(--text)', fontWeight:600 }}>{DIA.operadores}</strong></span>
        <span style={{ background:'rgba(26,144,96,0.08)', border:'1px solid rgba(26,144,96,0.25)', color:'#1a7a50', fontSize:11, fontWeight:600, letterSpacing:'.04em', padding:'2px 10px', borderRadius:3 }}>
          UMBRAL: {DIA.umbral} paq/min
        </span>
      </div>
    </>
  )
}
