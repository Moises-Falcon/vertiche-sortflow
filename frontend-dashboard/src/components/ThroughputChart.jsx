import { useEffect, useRef } from 'react'
import { Chart, LineController, LineElement, PointElement, LinearScale, CategoryScale, Filler, Tooltip } from 'chart.js'
import { CHART_LABELS, CHART_REAL, CHART_PROJ, CHART_UMBRAL } from '../data/dashboardData'

Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Filler, Tooltip)

export default function ThroughputChart() {
  const canvasRef = useRef(null)
  const chartRef  = useRef(null)

  useEffect(() => {
    if (!canvasRef.current) return
    if (chartRef.current) chartRef.current.destroy()

    chartRef.current = new Chart(canvasRef.current, {
      type: 'line',
      data: {
        labels: CHART_LABELS,
        datasets: [
          {
            label: 'Flujo real',
            data: CHART_REAL,
            borderColor: '#0a8fa8', borderWidth: 2,
            pointRadius: 0, pointHoverRadius: 5, pointHoverBackgroundColor: '#0a8fa8',
            tension: 0.4, fill: true, backgroundColor: 'rgba(10,143,168,0.07)',
          },
          {
            label: 'Proyectado',
            data: CHART_PROJ,
            borderColor: '#c08010', borderWidth: 1.5, borderDash: [5,4],
            pointRadius: 0, pointHoverRadius: 4, pointHoverBackgroundColor: '#c08010',
            tension: 0.4, fill: false,
          },
          {
            label: 'Umbral',
            data: CHART_UMBRAL,
            borderColor: 'rgba(192,48,32,0.5)', borderWidth: 1, borderDash: [3,3],
            pointRadius: 0, fill: false, tension: 0,
          },
        ],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#fff', borderColor: '#dde3dd', borderWidth: 1,
            titleColor: '#333', bodyColor: '#555',
            titleFont: { family: 'Rajdhani', size: 13, weight: '700' },
            bodyFont:  { family: 'Inter', size: 12 },
            padding: 10,
            callbacks: {
              title: ctx => ctx[0].label,
              label: ctx => ctx.dataset.label === 'Umbral' ? null : `${ctx.dataset.label}: ${ctx.raw} pp/min`,
            },
          },
        },
        scales: {
          x: {
            display: true,
            ticks: { color:'#8aa090', font:{family:'Inter',size:10}, maxTicksLimit:9, maxRotation:0 },
            grid: { display: false }, border: { display: false },
          },
          y: {
            display: true, min: 0, max: 50,
            ticks: { color:'#8aa090', font:{family:'Inter',size:10}, stepSize:10, callback: v => v+' pp/m' },
            grid: { color:'rgba(0,0,0,0.05)', drawTicks:false },
            border: { display:false, dash:[3,3] },
          },
        },
        animation: { duration: 0 },
      },
    })
    return () => chartRef.current?.destroy()
  }, [])

  return (
    <div style={{ background:'#ffffff', border:'1px solid #dde3dd', borderRadius:4, padding:'12px 16px', marginBottom:12 }}>
      <div style={{ display:'flex', gap:16, marginBottom:8 }}>
        <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:11, fontWeight:600, letterSpacing:'.07em', color:'#0a7a90' }}>
          <div style={{ width:12, height:2, background:'#0a8fa8', borderRadius:1 }} />
          FLUJO REAL
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:11, fontWeight:600, letterSpacing:'.07em', color:'#8a6010' }}>
          <div style={{ width:14, height:0, borderTop:'2px dashed #c08010' }} />
          PROYECTADO
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:11, fontWeight:600, letterSpacing:'.07em', color:'#888' }}>
          <div style={{ width:14, height:0, borderTop:'1.5px dashed #c03020' }} />
          UMBRAL (32 pp/min)
        </div>
      </div>
      <div style={{ position:'relative', height:160 }}>
        <canvas ref={canvasRef} />
      </div>
      <div style={{ fontSize:9, color:'#b0c0b4', letterSpacing:'.08em', textAlign:'right', marginTop:5 }}>
        MONITOR DE FLUJO V.2.4.0
      </div>
    </div>
  )
}
