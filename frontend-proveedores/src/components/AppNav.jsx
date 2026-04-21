import { useState, useEffect } from 'react'

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
      background:'#080808', borderBottom:'1px solid var(--border)',
      padding:'0 20px', display:'flex', alignItems:'center',
      height:48, gap:0,
    }}>
      <div style={{ background:'var(--gold)', color:'#000', fontWeight:600, fontSize:13, padding:'3px 10px', borderRadius:4, marginRight:16, flexShrink:0 }}>
        VTC
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
      <div style={{ marginLeft:'auto', flexShrink:0, textAlign:'right' }}>
        <div style={{ fontFamily:'var(--mono)', fontSize:13, color:'var(--text)' }}>{time}</div>
        <div style={{ fontSize:10, color:'var(--text3)' }}>Turno matutino</div>
      </div>
    </nav>
  )
}
