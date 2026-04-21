import { useState } from 'react'
import Topbar        from './components/Topbar'
import TopCards      from './components/TopCards'
import ThroughputChart from './components/ThroughputChart'
import StageCard     from './components/StageCard'
import AlertsDrawer  from './components/AlertsDrawer'
import StageModal    from './components/StageModal'
import { ETAPAS }    from './data/dashboardData'

export default function App() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [modalStage, setModalStage] = useState(null)

  return (
    <div style={{ minHeight:'100vh', background:'#f0f2f0', colorScheme:'light' }}>
      <Topbar />

      <div style={{ padding:'14px 18px' }}>
        <TopCards onOpenDrawer={() => setDrawerOpen(true)} />

        <ThroughputChart />

        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
          <div style={{ fontSize:11, color:'#8aa090', letterSpacing:'.08em', fontWeight:500 }}>
            ETAPAS — CLIC PARA DETALLE
          </div>
          <div style={{ display:'flex' }}>
            <div style={{ fontSize:11, fontWeight:600, letterSpacing:'.06em', padding:'4px 11px', color:'#1a7a50', background:'rgba(26,144,96,0.07)', border:'1px solid rgba(26,144,96,0.25)', borderRadius:'2px 0 0 2px', cursor:'pointer' }}>
              VISTA RED
            </div>
            <div style={{ fontSize:11, fontWeight:600, letterSpacing:'.06em', padding:'4px 11px', color:'#8aa090', background:'#fff', border:'1px solid #dde3dd', borderLeft:'none', borderRadius:'0 2px 2px 0', cursor:'pointer' }}>
              VISTA FLUJO
            </div>
          </div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8 }}>
          {ETAPAS.map(etapa => (
            <StageCard
              key={etapa.key}
              etapa={etapa}
              onClick={() => setModalStage(etapa.key)}
            />
          ))}
        </div>
      </div>

      <AlertsDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onGoToStage={key => setModalStage(key)}
      />

      <StageModal
        stageKey={modalStage}
        onClose={() => setModalStage(null)}
      />
    </div>
  )
}
