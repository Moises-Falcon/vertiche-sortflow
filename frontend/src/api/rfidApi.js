const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const api = {
  // Tags
  vincularTag: (data) =>
    fetch(`${BASE_URL}/api/tags`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(r => r.json()),

  getTag: (epc) => fetch(`${BASE_URL}/api/tags/${encodeURIComponent(epc)}`).then(r => r.json()),

  getTags: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return fetch(`${BASE_URL}/api/tags?${qs}`).then(r => r.json());
  },

  getProveedores: () => fetch(`${BASE_URL}/api/proveedores`).then(r => r.json()),

  // Lecturas
  getLecturas: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return fetch(`${BASE_URL}/api/lecturas?${qs}`).then(r => r.json());
  },

  // Cajas
  getCajas: () => fetch(`${BASE_URL}/api/cajas`).then(r => r.json()),

  sellarCaja: (caja_id) =>
    fetch(`${BASE_URL}/api/cajas/${encodeURIComponent(caja_id)}/sellar`, {
      method: 'POST'
    }).then(r => r.json()),

  // Anomalias
  getAnomalias: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return fetch(`${BASE_URL}/api/anomalias?${qs}`).then(r => r.json());
  },

  // Trazabilidad
  getTrazabilidad: (epc) =>
    fetch(`${BASE_URL}/api/trazabilidad/${encodeURIComponent(epc)}`).then(r => r.json()),

  buscarPorSku: (sku) =>
    fetch(`${BASE_URL}/api/trazabilidad?sku=${encodeURIComponent(sku)}`).then(r => r.json()),

  // Tiendas
  getTiendas: () => fetch(`${BASE_URL}/api/tiendas`).then(r => r.json()),

  // Pedidos
  getPedidos: () => fetch(`${BASE_URL}/api/pedidos`).then(r => r.json()),
  getPedido: (id) => fetch(`${BASE_URL}/api/pedidos/${encodeURIComponent(id)}`).then(r => r.json()),

  // Palets
  getPalet: (id) => fetch(`${BASE_URL}/api/palets/${encodeURIComponent(id)}`).then(r => r.json()),
  getPaletValidacion: (id) => fetch(`${BASE_URL}/api/palets/${encodeURIComponent(id)}/validacion`).then(r => r.json()),
  getPaletQaFallidos: (id) => fetch(`${BASE_URL}/api/palets/${encodeURIComponent(id)}/qa-fallidos`).then(r => r.json()),

  // QA Fallo
  marcarQaFallo: (epc, motivo) =>
    fetch(`${BASE_URL}/api/tags/${encodeURIComponent(epc)}/qa-fallo`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ motivo })
    }).then(r => r.json()),

  // Dashboard KPIs
  getKpiCiclo: () => fetch(`${BASE_URL}/api/dashboard/kpi-ciclo`).then(r => r.json()),

  // Ordenes de compra
  getOrdenes: () => fetch(`${BASE_URL}/api/ordenes`).then(r => r.json()),
  getOrden: (id) => fetch(`${BASE_URL}/api/ordenes/${encodeURIComponent(id)}`).then(r => r.json()),
};
