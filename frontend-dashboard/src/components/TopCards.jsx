import { DIA, ALERTAS } from '../data/dashboardData'

export default function TopCards({ onOpenDrawer }) {
  const criticas = ALERTAS.filter(a => a.tipo === 'critica').length
  const advertencias = ALERTAS.filter(a => a.tipo === 'advertencia').length
  const totalAlertas = ALERTAS.length

  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:12 }}>
      <div style={{ background:'#ffffff', border:'1px solid #dde3dd', borderRadius:4, padding:'16px 20px' }}>
        <div style={{ fontSize:10, letterSpacing:'.1em', color:'#8aa090', fontWeight:500, marginBottom:4, textTransform:'uppercase' }}>
          CUMPLIMIENTO DEL DÍA
        </div>
        <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:10 }}>
          <div style={{ fontFamily:'Rajdhani,sans-serif', fontSize:50, fontWeight:700, color:'#1a9060', lineHeight:1 }}>
            {DIA.cumplimiento}%
          </div>
          <div style={{ fontSize:12, color:'#6a8070' }}>
            {DIA.procesados.toLocaleString()} / {DIA.meta.toLocaleString()} prepacks
          </div>
        </div>
        <div style={{ height:5, background:'#e0e8e2', borderRadius:2, overflow:'hidden' }}>
          <div style={{ height:'100%', background:'#1a9060', borderRadius:2, width:`${DIA.cumplimiento}%`, transition:'width .5s ease' }} />
        </div>
      </div>

      <div onClick={onOpenDrawer} style={{ background:'#ffffff', border:'1px solid #dde3dd', borderRadius:4, padding:'16px 20px', cursor:'pointer' }}
        onMouseEnter={e => e.currentTarget.style.background = '#f5f8f5'}
        onMouseLeave={e => e.currentTarget.style.background = '#ffffff'}
      >
        <div style={{ fontSize:10, letterSpacing:'.1em', color:'#8aa090', fontWeight:500, marginBottom:4, textTransform:'uppercase' }}>
          ESTADO OPERATIVO
        </div>
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginTop:4 }}>
          <div>
            <div style={{ fontFamily:'Rajdhani,sans-serif', fontSize:54, fontWeight:700, color:'#d03020', lineHeight:1 }}>{totalAlertas}</div>
            <div style={{ fontSize:11, color:'#d03020', letterSpacing:'.1em', fontWeight:600, marginTop:2 }}>EN ALERTA</div>
          </div>
          <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:10 }}>
            <div style={{ display:'flex', gap:5 }}>
              {criticas > 0 && <span style={{ fontSize:10, fontWeight:700, letterSpacing:'.07em', padding:'2px 8px', borderRadius:2, background:'rgba(208,48,32,0.1)', color:'#d03020', border:'1px solid rgba(208,48,32,0.25)' }}>QA</span>}
              {advertencias > 0 && <span style={{ fontSize:10, fontWeight:700, letterSpacing:'.07em', padding:'2px 8px', borderRadius:2, background:'rgba(200,120,10,0.1)', color:'#a06010', border:'1px solid rgba(200,120,10,0.25)' }}>BAHÍA</span>}
            </div>
            <div style={{ fontSize:11, color:'#1a7a50', fontWeight:500 }}>VER ALERTAS →</div>
          </div>
        </div>
      </div>
    </div>
  )
}
