import { useState, useEffect } from 'react'
import ThemeToggle from '../theme/ThemeToggle'

const TABS = [
  { id:'op-inicio',    label:'Op: inspección' },
  { id:'sup-resumen',  label:'Resumen turno'  },
  { id:'sup-plan',     label:'Plan QA'        },
  { id:'sup-proveedor',label:'Perfil proveedor' },
]

export default function AppNav({ tab, setTab }) {
  const [time, setTime] = useState('')

  useEffect(() => {
    const tick = () => {
      const n = new Date(), p = v => String(v).padStart(2,'0')
      setTime(`${p(n.getHours())}:${p(n.getMinutes())}:${p(n.getSeconds())}`)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <nav style={{
      position:'sticky', top:0, zIndex:100,
      background:'var(--bg1)', borderBottom:'1px solid var(--border)',
      padding:'0 20px', display:'flex', alignItems:'center',
      height:56, gap:0,
    }}>
      <div style={{ display:'flex', alignItems:'center', gap:10, flexShrink:0, marginRight:20 }}>
        <div style={{
          width:32, height:32, borderRadius:8, background:'#4F46E5',
          display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:15, fontWeight:700, color:'#fff', fontFamily:'var(--mono)',
        }}>V</div>
        <div>
          <div style={{ color:'var(--text)', fontSize:13, fontWeight:600, lineHeight:1.1, letterSpacing:'.02em' }}>VERTICHE</div>
          <div style={{ color:'var(--text3)', fontSize:10, lineHeight:1.4, letterSpacing:'.1em', textTransform:'uppercase' }}>SortFlow · QA</div>
        </div>
      </div>
      <div style={{ display:'flex', gap:2, flex:1, overflowX:'auto' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding:'6px 12px', fontSize:12, fontWeight:500, whiteSpace:'nowrap',
            color: tab === t.id ? 'var(--gold)' : 'var(--text3)',
            background: tab === t.id ? 'var(--bg2)' : 'none',
            border:'none', cursor:'pointer', borderRadius:'var(--r)',
            fontFamily:'var(--font)', transition:'all .15s',
          }}>
            {t.label}
          </button>
        ))}
      </div>
      <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:12, flexShrink:0 }}>
        <div style={{ textAlign:'right' }}>
          <div style={{ fontFamily:'var(--mono)', fontSize:13, color:'var(--text)' }}>{time}</div>
          <div style={{ fontSize:10, color:'var(--text3)' }}>Turno matutino</div>
        </div>
        <ThemeToggle size={30} />
      </div>
    </nav>
  )
}
