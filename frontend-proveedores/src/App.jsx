import { useState } from 'react'
import AppNav          from './components/AppNav'
import OperatorScreen  from './pages/OperatorScreen'
import ResumenTurno    from './pages/ResumenTurno'
import PlanQA          from './pages/PlanQA'
import PerfilProveedor from './pages/PerfilProveedor'
import { SUPPLIERS_INITIAL } from './data/demoData'

export default function App() {
  const [tab,       setTab]       = useState('op-inicio')
  const [suppliers, setSuppliers] = useState(SUPPLIERS_INITIAL)
  const [stats,     setStats]     = useState({ totalSO: 0, inspected: 0, rejected: 0 })
  const [profileId, setProfileId] = useState(5)

  const onReviewFinished = ({ supplierId, defectCount, totalSample }) => {
    setSuppliers(prev => prev.map(s => {
      if (s.id !== supplierId) return s
      const approvalRate = totalSample > 0 ? (totalSample - defectCount) / totalSample : 1
      const delta   = approvalRate >= 0.95 ? +0.1 : approvalRate >= 0.7 ? 0 : -0.2
      const newStars = Math.max(0, Math.min(5, parseFloat((s.stars + delta).toFixed(1))))
      const newLevel = newStars >= 4.5 ? 'ELITE' : newStars >= 2.5 ? 'MEDIA' : newStars > 0 ? 'BAJA' : 'NUEVO'
      const newColor = newStars >= 4.5 ? 'ba'    : newStars >= 2.5 ? 'bb'    : newStars > 0 ? 'bc'   : 'bn'
      return { ...s, stars: newStars, level: newLevel, color: newColor }
    }))
    setStats(prev => ({
      totalSO:    prev.totalSO + 1,
      inspected:  prev.inspected + totalSample,
      rejected:   prev.rejected + defectCount,
    }))
  }

  const active = suppliers.filter(s => s.stars > 0)
  const avgStars = active.length
    ? (active.reduce((a, s) => a + s.stars, 0) / active.length).toFixed(1)
    : '0.0'

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <AppNav tab={tab} setTab={setTab} />

      {tab === 'op-inicio'   && <OperatorScreen  suppliers={suppliers} onReviewFinished={onReviewFinished} />}
      {tab === 'sup-resumen' && <ResumenTurno    suppliers={suppliers} stats={stats} avgStars={avgStars} setTab={setTab} setProfileId={setProfileId} />}
      {tab === 'sup-plan'    && <PlanQA          suppliers={suppliers} />}
      {tab === 'sup-proveedor' && <PerfilProveedor supplierId={profileId} suppliers={suppliers} setProfileId={setProfileId} />}
    </div>
  )
}
