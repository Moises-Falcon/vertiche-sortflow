import { useEffect, useState } from 'react'
import { api } from '../api/rfidApi'

const COLORES = {
  ABIERTA:  { bg: '#fff3cd', text: '#856404', border: '#ffc107' },
  LLENANDO: { bg: '#cce5ff', text: '#004085', border: '#004085' },
  LLENA:    { bg: '#d4edda', text: '#155724', border: '#28a745' },
  SELLADA:  { bg: '#e2e3e5', text: '#383d41', border: '#adb5bd' },
}

export default function EstadoCajas() {
  const [cajas, setCajas] = useState([])
  const [loading, setLoading] = useState(true)

  const cargar = () => {
    api.getCajas()
      .then(data => { setCajas(data); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    cargar()
    const interval = setInterval(cargar, 5000)
    return () => clearInterval(interval)
  }, [])

  const sellar = async (caja_id) => {
    await api.sellarCaja(caja_id)
    cargar()
  }

  const cajasActivas  = cajas.filter(c => c.estado !== 'SELLADA')
  const cajasSelladas = cajas.filter(c => c.estado === 'SELLADA')

  if (loading) {
    return <div style={{ padding: 48, textAlign: 'center', color: '#999' }}>Cargando cajas...</div>
  }

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ margin: 0 }}>Estado de Cajas</h2>
        <span style={{ fontSize: 13, color: '#666' }}>
          Activas: <strong>{cajasActivas.length}</strong> | Selladas: <strong>{cajasSelladas.length}</strong>
        </span>
      </div>

      {cajas.length === 0 && (
        <div style={{ padding: 48, textAlign: 'center', color: '#999', background: '#fff', borderRadius: 8, border: '1px solid #eee' }}>
          No hay cajas registradas. Las cajas aparecen cuando se crean desde el sistema.
        </div>
      )}

      {cajasActivas.length > 0 && (
        <>
          <h3 style={{ fontSize: 14, color: '#444', marginBottom: 12 }}>Cajas activas</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16, marginBottom: 32 }}>
            {cajasActivas.map(caja => {
              const colores = COLORES[caja.estado] || COLORES.ABIERTA
              return (
                <div key={caja.caja_id} style={{
                  border: `1px solid ${colores.border}`,
                  borderRadius: 8,
                  padding: 16,
                  background: colores.bg
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <strong style={{ fontSize: 14 }}>{caja.caja_id}</strong>
                    <span style={{ fontSize: 11, fontWeight: 700, color: colores.text, background: 'rgba(255,255,255,0.6)', padding: '2px 8px', borderRadius: 10 }}>
                      {caja.estado}
                    </span>
                  </div>
                  <div style={{ fontSize: 13, color: '#444', lineHeight: 1.8 }}>
                    <div>Tienda: <strong>{caja.tienda_destino}</strong></div>
                    <div>Bahia: <strong>{caja.bahia}</strong></div>
                    <div>Prepacks: <strong>{caja.prepack_cajas?.length || 0}</strong></div>
                  </div>
                  <button
                    onClick={() => sellar(caja.caja_id)}
                    style={{
                      marginTop: 12,
                      padding: '8px 16px',
                      background: '#28a745',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 6,
                      cursor: 'pointer',
                      width: '100%',
                      fontWeight: 600,
                      fontSize: 13
                    }}
                  >
                    Marcar como Sellada
                  </button>
                </div>
              )
            })}
          </div>
        </>
      )}

      {cajasSelladas.length > 0 && (
        <>
          <h3 style={{ fontSize: 14, color: '#444', marginBottom: 12 }}>Cajas selladas</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
            {cajasSelladas.map(caja => (
              <div key={caja.caja_id} style={{
                border: '1px solid #adb5bd',
                borderRadius: 8,
                padding: 14,
                background: '#e2e3e5',
                opacity: 0.8
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <strong style={{ fontSize: 13 }}>{caja.caja_id}</strong>
                  <span style={{ fontSize: 11, color: '#383d41', fontWeight: 600 }}>SELLADA</span>
                </div>
                <div style={{ fontSize: 12, color: '#555' }}>
                  {caja.tienda_destino} | {caja.bahia} | {caja.prepack_cajas?.length || 0} prepacks
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
