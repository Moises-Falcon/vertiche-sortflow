import { useEffect } from 'react'
import { ALERTAS } from '../data/dashboardData'

const BADGE_STYLE = {
  critica:     { bg:'#fde8e8', color:'#c03020', border:'#f5b8b8' },
  advertencia: { bg:'#fef3e0', color:'#8a5e10', border:'#f5d090' },
}

export default function AlertsDrawer({ open, onClose, onGoToStage }) {
  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  const criticas    = ALERTAS.filter(a => a.tipo === 'critica')
  const advertencias = ALERTAS.filter(a => a.tipo === 'advertencia')

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position:'fixed', inset:0, zIndex:8888,
        background: open ? 'rgba(0,0,0,0.35)' : 'rgba(0,0,0,0)',
        pointerEvents: open ? 'all' : 'none',
        transition:'background .25s',
      }}
    >
      <div style={{
        position:'fixed', top:0, right:0, bottom:0,
        width:360, maxWidth:'95vw',
        background:'#ffffff', color:'#111',
        boxShadow:'-8px 0 40px rgba(0,0,0,0.15)',
        transform: open ? 'none' : 'translateX(100%)',
        transition:'transform .28s cubic-bezier(0.4,0,0.2,1)',
        display:'flex', flexDirection:'column',
        fontFamily:'Inter,sans-serif', zIndex:8889,
        colorScheme:'light',
      }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'18px 20px 14px', borderBottom:'1px solid #e5eae6' }}>
          <div style={{ display:'flex', alignItems:'center' }}>
            <span style={{ fontFamily:'Rajdhani,sans-serif', fontSize:16, fontWeight:700, letterSpacing:'.1em', color:'#111' }}>ALERTAS ACTIVAS</span>
            <span style={{ fontSize:10, fontWeight:700, letterSpacing:'.08em', padding:'2px 8px', borderRadius:2, marginLeft:8, background:'#fde8e8', color:'#c03020', border:'1px solid #f5b8b8' }}>
              {ALERTAS.length}
            </span>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'#aaa', cursor:'pointer', fontSize:20, lineHeight:1, padding:'0 4px' }}>×</button>
        </div>

        <div style={{ flex:1, overflowY:'auto', padding:'14px 16px' }}>
          {criticas.length > 0 && (
            <>
              <p style={{ fontSize:10, letterSpacing:'.1em', color:'#8aa090', fontWeight:600, textTransform:'uppercase', marginBottom:8 }}>Críticas</p>
              {criticas.map(a => <AlertNotif key={a.id} alerta={a} onGo={() => { onClose(); onGoToStage(a.modal) }} />)}
              <div style={{ height:1, background:'#e5eae6', margin:'14px 0' }} />
            </>
          )}
          {advertencias.length > 0 && (
            <>
              <p style={{ fontSize:10, letterSpacing:'.1em', color:'#8aa090', fontWeight:600, textTransform:'uppercase', marginBottom:8 }}>Advertencias</p>
              {advertencias.map(a => <AlertNotif key={a.id} alerta={a} onGo={() => { onClose(); onGoToStage(a.modal) }} />)}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function AlertNotif({ alerta, onGo }) {
  const ts = alerta.tipo === 'critica' ? BADGE_STYLE.critica : BADGE_STYLE.advertencia
  const bl = alerta.tipo === 'critica' ? '#c03020' : '#c08010'

  return (
    <div style={{ background:'#ffffff', border:'1px solid #e5eae6', borderLeft:`3px solid ${bl}`, borderRadius:6, padding:'12px 14px', marginBottom:10 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:4 }}>
        <span style={{ fontSize:10, fontWeight:700, letterSpacing:'.09em', padding:'1px 7px', borderRadius:2, background:ts.bg, color:ts.color, border:`1px solid ${ts.border}` }}>
          {alerta.etapa}
        </span>
        <span style={{ fontSize:10, color:'#aaa' }}>{alerta.tiempo}</span>
      </div>
      <div style={{ fontSize:12, color:'#333', lineHeight:1.5, marginBottom:10 }}>{alerta.msg}</div>
      <button onClick={onGo} style={{
        fontSize:11, fontWeight:600, letterSpacing:'.05em', padding:'5px 12px',
        borderRadius:3, border:'1px solid #dde3dd', background:'#f5f8f5', color:'#1a7a50',
        cursor:'pointer', display:'inline-flex', alignItems:'center', gap:5,
        fontFamily:'Inter,sans-serif',
      }}>
        → IR A {alerta.etapa}
      </button>
    </div>
  )
}
