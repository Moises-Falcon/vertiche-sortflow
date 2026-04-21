import { useState, useEffect, useRef, useCallback } from 'react'
import { socket } from '../socket/socketClient'
import { DEMO_PREPACKS, BAY_COLORS } from '../data/demoData'
import ScanHistory      from '../components/ScanHistory'
import PrepackDetailBar from '../components/PrepackDetailBar'
import { IconAntenna, IconScan, IconBolt, IconSigma, IconWarning, IconArrow } from '../components/Icons'
import ThemeToggle from '../theme/ThemeToggle'

export default function SorterScreen() {
  const [current,      setCurrent]      = useState(null)
  const [history,      setHistory]      = useState([])
  const [scanning,     setScanning]     = useState(false)
  const [scanRate,     setScanRate]     = useState(0)
  const [totalScanned, setTotalScanned] = useState(0)
  const [selected,     setSelected]     = useState(null)

  const idxRef        = useRef(0)
  const scanCountRef  = useRef(0)
  const scanEventsRef = useRef([])

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now()
      scanEventsRef.current = scanEventsRef.current.filter(t => now - t < 60000)
      setScanRate(scanEventsRef.current.length)
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const processScan = useCallback((prepackOverride) => {
    const prepack = prepackOverride || DEMO_PREPACKS[idxRef.current % DEMO_PREPACKS.length]
    scanCountRef.current++

    const correctBay  = prepack.bayNumber
    const isMisrouted = !prepackOverride && scanCountRef.current % 5 === 0
    const wrongBays   = [1,2,3,4,5,6,7,8,9,10].filter(b => b !== correctBay)
    const currentBay  = isMisrouted
      ? wrongBays[Math.floor(Math.random() * wrongBays.length)]
      : correctBay

    const scan = {
      ...prepack,
      id:          Date.now(),
      product:     prepack.producto,
      storeName:   prepack.tienda?.nombre,
      city:        prepack.tienda?.ciudad,
      bayNumber:   currentBay,
      correctBay,
      isMisrouted,
      scannedAt:   Date.now(),
    }

    if (!prepackOverride) idxRef.current++
    scanEventsRef.current.push(Date.now())
    setTotalScanned(p => p + 1)
    setCurrent(scan)
    setSelected(scan)
    setHistory(prev => [scan, ...prev].slice(0, 20))
  }, [])

  useEffect(() => {
    const handler = (data) => {
      if (data.etapa !== 'SORTER') return
      const found = DEMO_PREPACKS.find(p => p.epc === data.epc)
      if (found) processScan(found)
    }
    socket.on('lectura', handler)
    socket.on('nueva_lectura', handler)
    return () => {
      socket.off('lectura', handler)
      socket.off('nueva_lectura', handler)
    }
  }, [processScan])

  const handleScan = () => {
    if (scanning) return
    setScanning(true)
    setTimeout(() => { processScan(); setScanning(false) }, 300)
  }

  const bayColor = current ? (BAY_COLORS[current.bayNumber] || '#6b7280') : '#6b7280'

  return (
    <div style={{
      display:'grid', gridTemplateRows:'auto 1fr',
      height:'100vh', background:'var(--bg)', overflow:'hidden',
    }}>

      {/* HEADER */}
      <header style={{
        display:'flex', alignItems:'center', padding:'0 24px', height:56,
        borderBottom:'1px solid var(--border)', position:'relative',
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
          <div style={{
            width:32, height:32, borderRadius:8, background:'#4F46E5',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:15, fontWeight:700, color:'#fff', fontFamily:'var(--mono)',
          }}>V</div>
          <div>
            <div style={{ color:'var(--text)', fontSize:13, fontWeight:600, lineHeight:1.1, letterSpacing:'.02em' }}>VERTICHE</div>
            <div style={{ color:'var(--muted)', fontSize:10, lineHeight:1.4, letterSpacing:'.1em', textTransform:'uppercase' }}>SortFlow · Sorter</div>
          </div>
        </div>
        <div style={{ flex:1 }} />

        <div style={{ position:'absolute', right:24, display:'flex', gap:18, alignItems:'center' }}>
          <div style={{ textAlign:'right', display:'flex', alignItems:'center', gap:6 }}>
            <IconSigma size={14} color="#4caf50" />
            <div>
              <p style={{ fontFamily:'var(--mono)', fontSize:16, fontWeight:700, color:'#4caf50', lineHeight:1 }}>{totalScanned}</p>
              <p style={{ fontFamily:'var(--mono)', fontSize:8, color:'var(--muted)', letterSpacing:1, marginTop:2 }}>ESCANEADOS</p>
            </div>
          </div>
          <div style={{ textAlign:'right', display:'flex', alignItems:'center', gap:6 }}>
            <IconBolt size={14} color="#3b82f6" />
            <div>
              <p style={{ fontFamily:'var(--mono)', fontSize:16, fontWeight:700, color:'#3b82f6', lineHeight:1, animation: scanRate !== 0 ? 'pop .3s ease' : 'none' }}>{scanRate}</p>
              <p style={{ fontFamily:'var(--mono)', fontSize:8, color:'var(--muted)', letterSpacing:1, marginTop:2 }}>PQ/MIN</p>
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:5 }}>
            <div style={{ width:6, height:6, borderRadius:'50%', background:'#4caf50', animation:'blink 1.5s ease-in-out infinite' }} />
            <span style={{ fontFamily:'var(--mono)', fontSize:9, color:'#4caf50' }}>Activo</span>
          </div>
          <ThemeToggle size={28} />
        </div>
      </header>

      {/* BODY: Centro + Historial derecho */}
      <div style={{ display:'flex', overflow:'hidden', minHeight:0 }}>

        {/* CENTRO: bahía + info breve + detalle inline + botón abajo */}
        <div style={{
          flex:1, display:'flex', flexDirection:'column',
          overflow:'hidden', position:'relative', minWidth:0,
        }}>

          {!current ? (
            <div style={{
              flex:1, display:'flex', flexDirection:'column',
              alignItems:'center', justifyContent:'center', gap:14,
            }}>
              <div style={{
                width:90, height:90, borderRadius:'50%',
                background:'var(--bg2)', border:'1px solid var(--border)',
                display:'flex', alignItems:'center', justifyContent:'center',
              }}>
                <IconAntenna size={40} color="#4F46E5" />
              </div>
              <p style={{ color:'var(--muted)', fontSize:14, fontFamily:'var(--mono)' }}>Esperando escaneo</p>
              <p style={{ color:'var(--muted)', fontSize:11 }}>Acerque la etiqueta RFID al lector</p>
            </div>
          ) : (
            <div style={{
              flex:1, display:'flex', flexDirection:'column',
              alignItems:'center', gap:14,
              background: current.isMisrouted
                ? 'radial-gradient(ellipse at top, rgba(239,68,68,0.22) 0%, rgba(239,68,68,0.05) 40%, transparent 70%)'
                : `radial-gradient(ellipse at top, ${bayColor}15 0%, transparent 55%)`,
              animation:'fadeIn .4s ease',
              padding:'18px 24px 95px', overflow:'auto',
              transition:'background .3s ease',
            }}>
              {current.isMisrouted ? (
                <div style={{
                  display:'flex', alignItems:'center', gap:14,
                  animation:'blink 1.4s ease-in-out infinite',
                  marginTop:10,
                }}>
                  <IconWarning size={26} color="#ef4444" />
                  <p style={{
                    fontFamily:'var(--mono)', fontSize:18, letterSpacing:5,
                    color:'#ef4444', textTransform:'uppercase', fontWeight:800,
                  }}>
                    Error de Sorter
                  </p>
                  <IconWarning size={26} color="#ef4444" />
                </div>
              ) : (
                <p style={{
                  fontFamily:'var(--mono)', fontSize:12, letterSpacing:4,
                  color:'var(--muted)', textTransform:'uppercase', marginTop:4,
                }}>
                  Llevar a
                </p>
              )}

              {/* Bahías: lado a lado si hay mis-routing */}
              {current.isMisrouted ? (
                <div style={{
                  display:'flex', alignItems:'center', gap:'min(5vh, 40px)',
                  marginTop:8,
                }}>
                  {/* Bahía actual (incorrecta) */}
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8 }}>
                    <div style={{
                      fontFamily:'var(--mono)', fontSize:10, letterSpacing:2,
                      color:'#ef4444', textTransform:'uppercase', fontWeight:700,
                    }}>
                      Está en
                    </div>
                    <div style={{
                      width:'min(22vh, 180px)', height:'min(22vh, 180px)',
                      borderRadius:'50%', border:'3px solid #ef4444',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      color:'#ef4444', fontSize:'min(12vh, 100px)',
                      fontFamily:'var(--mono)', fontWeight:700,
                      opacity:0.55, textDecoration:'line-through',
                      flexShrink:0,
                    }}>
                      {current.bayNumber}
                    </div>
                  </div>

                  {/* Flecha */}
                  <div style={{ animation:'blink 1s ease-in-out infinite' }}>
                    <IconArrow size={60} color="#ef4444" />
                  </div>

                  {/* Bahía correcta */}
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8 }}>
                    <div style={{
                      fontFamily:'var(--mono)', fontSize:10, letterSpacing:2,
                      color:BAY_COLORS[current.correctBay] || '#4caf50',
                      textTransform:'uppercase', fontWeight:700,
                    }}>
                      Llevar a
                    </div>
                    <div style={{
                      width:'min(26vh, 225px)', height:'min(26vh, 225px)',
                      borderRadius:'50%',
                      border:`4px solid ${BAY_COLORS[current.correctBay] || '#4caf50'}`,
                      display:'flex', alignItems:'center', justifyContent:'center',
                      color:BAY_COLORS[current.correctBay] || '#4caf50',
                      fontSize:'min(14vh, 120px)',
                      fontFamily:'var(--mono)', fontWeight:700,
                      animation:'glow-bay 2.4s ease-in-out infinite',
                      flexShrink:0,
                    }}>
                      {current.correctBay}
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{
                  width:'min(26vh, 225px)', height:'min(26vh, 225px)',
                  borderRadius:'50%', border:`4px solid ${bayColor}`,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  color:bayColor, fontSize:'min(14vh, 120px)',
                  fontFamily:'var(--mono)', fontWeight:700,
                  animation:'glow-bay 2.4s ease-in-out infinite',
                  flexShrink:0,
                }}>
                  {current.bayNumber}
                </div>
              )}

              {current.isMisrouted ? (
                <div style={{ textAlign:'center', marginTop:6 }}>
                  <p style={{
                    fontSize:20, fontWeight:800, color:'#ffffff', lineHeight:1.2,
                    letterSpacing:.5,
                  }}>
                    Redirigir a <span style={{ color:BAY_COLORS[current.correctBay] || '#4caf50' }}>Bahía {current.correctBay}</span>
                  </p>
                  <p style={{ fontSize:14, color:'#e8e8f0', marginTop:6 }}>
                    {current.storeName} · {current.city}
                  </p>
                </div>
              ) : (
                <div style={{ textAlign:'center' }}>
                  <p style={{ fontSize:17, fontWeight:700, color:'var(--text)', marginBottom:3 }}>
                    Bahía {current.bayNumber}
                  </p>
                  <p style={{ fontSize:12, color:'var(--muted)' }}>
                    {current.storeName} · {current.city}
                  </p>
                </div>
              )}

              {/* Info breve — visible siempre (versión compacta si hay alerta) */}
              <div style={{
                display:'flex', gap: current.isMisrouted ? 12 : 16,
                padding: current.isMisrouted ? '7px 14px' : '10px 18px',
                background:'var(--bg1)',
                border:`1px solid ${current.isMisrouted ? 'rgba(239,68,68,0.25)' : 'var(--border)'}`,
                borderRadius:8, fontSize: current.isMisrouted ? 10 : 12,
              }}>
                <div>
                  <div style={{ fontFamily:'var(--mono)', fontSize: current.isMisrouted?8:9, color:'var(--muted)', letterSpacing:1.5, textTransform:'uppercase' }}>RFID</div>
                  <div style={{ fontFamily:'var(--mono)', fontSize: current.isMisrouted?10:12, color:'#6eaaee', fontWeight:700, marginTop:2 }}>···{current.epc?.slice(-6)}</div>
                </div>
                <div style={{ borderLeft:'1px solid var(--border)' }} />
                <div>
                  <div style={{ fontFamily:'var(--mono)', fontSize: current.isMisrouted?8:9, color:'var(--muted)', letterSpacing:1.5, textTransform:'uppercase' }}>Producto</div>
                  <div style={{ fontSize: current.isMisrouted?10:12, color:'var(--text)', fontWeight:600, marginTop:2 }}>{current.producto}</div>
                </div>
                <div style={{ borderLeft:'1px solid var(--border)' }} />
                <div>
                  <div style={{ fontFamily:'var(--mono)', fontSize: current.isMisrouted?8:9, color:'var(--muted)', letterSpacing:1.5, textTransform:'uppercase' }}>Orden</div>
                  <div style={{ fontFamily:'var(--mono)', fontSize: current.isMisrouted?10:12, color: current.isMisrouted ? (BAY_COLORS[current.correctBay]||'#4caf50') : bayColor, fontWeight:700, marginTop:2 }}>{current.orden_id}</div>
                </div>
              </div>

              {/* Detalle inline — escalado al 70% cuando hay alerta */}
              <div style={{
                transform: current.isMisrouted ? 'scale(0.72)' : 'none',
                transformOrigin:'top center',
                marginTop: current.isMisrouted ? -10 : 0,
                opacity: current.isMisrouted ? 0.85 : 1,
                transition:'transform .25s, opacity .25s',
                width:'100%', display:'flex', justifyContent:'center',
              }}>
                <PrepackDetailBar prepack={selected} />
              </div>
            </div>
          )}

          {/* Botón de escaneo — centrado abajo */}
          <button
            onClick={handleScan}
            disabled={scanning}
            style={{
              position:'absolute', bottom:22, left:'50%',
              transform:'translateX(-50%)',
              background: scanning ? 'var(--bg2)' : '#4F46E5',
              border:`2px solid ${scanning ? 'var(--border)' : '#4F46E5'}`,
              borderRadius:14, padding:'14px 32px',
              color: scanning ? 'var(--muted)' : '#fff',
              fontFamily:'var(--mono)', fontSize:12, fontWeight:700,
              cursor: scanning ? 'not-allowed' : 'pointer',
              letterSpacing:2.5, textTransform:'uppercase',
              transition:'all .2s', zIndex:10,
              boxShadow:'0 4px 22px rgba(59,130,246,0.35)',
              display:'flex', alignItems:'center', gap:10,
            }}
          >
            <IconScan size={17} color={scanning ? '#666680' : '#fff'} />
            {scanning ? 'Escaneando...' : 'Escaneo RFID'}
          </button>
        </div>

        {/* HISTORIAL A LA DERECHA */}
        <ScanHistory
          history={history}
          total={totalScanned}
          onClickItem={item => setSelected(item)}
          side="right"
        />
      </div>
    </div>
  )
}
