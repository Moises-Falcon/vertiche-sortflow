import { STAGE_COLORS } from '../data/dashboardData'

const DOT_STYLE = {
  g: { background:'#1a9060', boxShadow:'0 0 4px rgba(26,144,96,0.5)' },
  a: { background:'#c08010' },
  r: { background:'#d03020', boxShadow:'0 0 4px rgba(208,48,32,0.4)' },
}
const STATUS_COLOR = { g:'#1a7a50', a:'#a06010', r:'#c03020' }

export default function StageCard({ etapa, onClick }) {
  const colors = STAGE_COLORS[etapa.color]

  return (
    <div
      onClick={onClick}
      style={{
        background:'#ffffff', border:'1px solid #dde3dd',
        borderLeft:`3px solid ${colors.border}`,
        borderRadius:4, padding:'14px 16px',
        cursor:'pointer', position:'relative',
        transition:'background .15s, box-shadow .15s',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = '#f5f8f5'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)' }}
      onMouseLeave={e => { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.boxShadow = 'none' }}
    >
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
        <span style={{ fontSize:11, fontWeight:700, letterSpacing:'.1em', color:colors.name }}>
          {etapa.label}
        </span>
        <span style={{ width:7, height:7, borderRadius:'50%', flexShrink:0, ...DOT_STYLE[etapa.dot] }} />
      </div>
      <div style={{ fontFamily:'Rajdhani,sans-serif', fontSize:36, fontWeight:700, color:'#111', lineHeight:1.05 }}>
        {etapa.val}
        {etapa.unit && <span style={{ fontSize:14, fontWeight:500, color:'#8aa090', marginLeft:2 }}>{etapa.unit}</span>}
      </div>
      <div style={{ fontSize:10, color:'#8aa090', letterSpacing:'.05em', margin:'3px 0 8px', textTransform:'uppercase' }}>
        {etapa.sub}
      </div>
      <div style={{ fontSize:11, fontWeight:600, letterSpacing:'.04em', color:STATUS_COLOR[etapa.status] }}>
        VER DETALLES →
      </div>
    </div>
  )
}
