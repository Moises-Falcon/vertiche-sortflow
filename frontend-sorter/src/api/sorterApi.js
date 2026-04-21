const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export async function getPrepacksBahia(bayId) {
  const res = await fetch(`${BASE}/api/bahias/${bayId}/prepacks-activos`)
  if (!res.ok) throw new Error('Error al obtener prepacks de bahia')
  return res.json()
}

export async function getSiguientePrepack() {
  const res = await fetch(`${BASE}/api/sorter/siguiente-prepack`)
  if (!res.ok) throw new Error('Error al obtener siguiente prepack')
  return res.json()
}

export async function getTiendas() {
  const res = await fetch(`${BASE}/api/tiendas`)
  if (!res.ok) throw new Error('Error al obtener tiendas')
  return res.json()
}

export async function getCajasBahia(bayId) {
  const res = await fetch(`${BASE}/api/cajas?bahia=BAHIA-${bayId}`)
  if (!res.ok) throw new Error('Error al obtener cajas')
  return res.json()
}
