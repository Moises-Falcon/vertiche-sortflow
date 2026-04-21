import { useState, useEffect } from 'react';
import { api } from '../api/rfidApi';

const panelStyle = {
  background: '#FFFFFF',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius)',
  boxShadow: 'var(--shadow)',
};

const seccionTituloStyle = {
  fontSize: 11, fontWeight: 600,
  letterSpacing: '0.08em',
  color: 'var(--color-text-muted)',
  textTransform: 'uppercase',
  padding: '10px 16px',
  borderBottom: '1px solid var(--color-border)',
  margin: 0,
};

const labelStyle = {
  display: 'block',
  fontSize: 10, fontWeight: 600,
  letterSpacing: '0.08em',
  color: 'var(--color-text-muted)',
  textTransform: 'uppercase',
  marginBottom: 5,
};

const inputStyle = {
  width: '100%', padding: '9px 12px',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius)',
  fontSize: 13, outline: 'none',
  color: 'var(--color-text-primary)',
};

function haceCuanto(timestamp) {
  if (!timestamp) return '';
  const diff = Math.floor((Date.now() - new Date(timestamp)) / 1000);
  if (diff < 60)   return `hace ${diff}s`;
  if (diff < 3600) return `hace ${Math.floor(diff / 60)}min`;
  return `hace ${Math.floor(diff / 3600)}h`;
}

function epcCorto(epc) {
  if (!epc) return '—';
  return epc.length > 18 ? epc.substring(0, 16) + '…' : epc;
}

const FORM_INIT = {
  epc: '', sku: '', talla: 'M', color: '',
  cantidad_piezas: 12, tienda_id: '', proveedor_id: 1,
  palet_id: '', pedido_id: ''
};

export default function Vinculacion() {
  const [form, setForm] = useState(FORM_INIT);
  const [mensaje, setMensaje] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tagsRecientes, setTagsRecientes] = useState([]);
  const [tiendas, setTiendas] = useState([]);
  const [palets, setPalets] = useState([]);
  const [proveedores, setProveedores] = useState([]);

  const cargarRecientes = () => {
    api.getTags().then(data => {
      if (Array.isArray(data)) {
        const ordenados = [...data].sort((a, b) => new Date(b.registrado_en) - new Date(a.registrado_en));
        setTagsRecientes(ordenados.slice(0, 10));
      }
    }).catch(() => {});
  };

  useEffect(() => {
    cargarRecientes();
    api.getTiendas().then(d => { if (Array.isArray(d)) setTiendas(d); }).catch(() => {});
    api.getProveedores().then(d => { if (Array.isArray(d)) setProveedores(d); }).catch(() => {});
    // Cargar palets activos (abiertos)
    fetch('http://localhost:3000/api/palets').then(r => r.json()).then(d => {
      // La ruta /api/palets no lista todos; construimos desde pedidos
    }).catch(() => {});
    api.getPedidos().then(pedidos => {
      if (!Array.isArray(pedidos)) return;
      const abiertos = pedidos.flatMap(p =>
        (p.palets || []).filter ? [] : []
      );
      // Simplificado: mostrar palets derivados de pedidos en estado EN_PROCESO
    }).catch(() => {});
  }, []);

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handlePaletChange = (palet_id) => {
    set('palet_id', palet_id);
    // Si hay palet, auto-rellenar pedido si lo conocemos
    const paletData = palets.find(p => p.id === palet_id);
    if (paletData) set('pedido_id', paletData.pedido_id || '');
  };

  const handleSubmit = async () => {
    if (!form.epc || !form.sku || !form.tienda_id) {
      setMensaje({ tipo: 'error', texto: 'EPC, SKU y Tienda destino son requeridos.' });
      return;
    }
    setLoading(true); setMensaje(null);
    try {
      // Enviar con tienda_id en lugar de tienda_destino
      const payload = {
        epc: form.epc,
        sku: form.sku,
        talla: form.talla,
        color: form.color,
        cantidad_piezas: form.cantidad_piezas,
        tienda_id: form.tienda_id,
        proveedor_id: form.proveedor_id,
        palet_id: form.palet_id || undefined,
        pedido_id: form.pedido_id || undefined,
        tipo_flujo: 'CROSS_DOCK',
      };
      const resultado = await api.vincularTag(payload);
      if (resultado.epc) {
        setMensaje({ tipo: 'exito', texto: `Tag ${resultado.epc.substring(0, 20)}… registrado correctamente.` });
        setForm(FORM_INIT);
        cargarRecientes();
      } else {
        setMensaje({ tipo: 'error', texto: resultado.error || 'Error al registrar el tag.' });
      }
    } catch {
      setMensaje({ tipo: 'error', texto: 'No se pudo conectar al servidor.' });
    }
    setLoading(false);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '440px 1fr', gap: 16, alignItems: 'start' }}>

      {/* Formulario */}
      <div style={panelStyle}>
        <div style={seccionTituloStyle}>Registrar Tag RFID</div>
        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>

          {mensaje && (
            <div style={{
              padding: '10px 14px', borderRadius: 'var(--radius)',
              background: mensaje.tipo === 'exito' ? 'var(--color-ok-bg)' : 'var(--color-error-bg)',
              color: mensaje.tipo === 'exito' ? 'var(--color-ok)' : 'var(--color-error)',
              border: `1px solid ${mensaje.tipo === 'exito' ? 'var(--color-ok)' : 'var(--color-error)'}`,
              fontSize: 13,
            }}>
              {mensaje.tipo === 'exito' ? 'Registrado: ' : 'Error: '}{mensaje.texto}
            </div>
          )}

          <div>
            <label style={labelStyle}>EPC del Tag *</label>
            <input
              placeholder="EPC-SIM-0000000000000101"
              value={form.epc}
              onChange={e => set('epc', e.target.value)}
              style={{ ...inputStyle, fontFamily: 'var(--font-mono)', fontSize: 12 }}
            />
          </div>

          <div>
            <label style={labelStyle}>SKU del Producto *</label>
            <input
              placeholder="BLU-F-M-001"
              value={form.sku}
              onChange={e => set('sku', e.target.value)}
              style={inputStyle}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Talla</label>
              <select value={form.talla} onChange={e => set('talla', e.target.value)} style={inputStyle}>
                {['XS', 'S', 'M', 'L', 'XL'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Color</label>
              <input
                placeholder="Ej. Azul"
                value={form.color}
                onChange={e => set('color', e.target.value)}
                style={inputStyle}
              />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Piezas por Prepack</label>
            <select value={form.cantidad_piezas} onChange={e => set('cantidad_piezas', parseInt(e.target.value))} style={inputStyle}>
              <option value={6}>6 piezas</option>
              <option value={12}>12 piezas</option>
              <option value={24}>24 piezas</option>
              <option value={48}>48 piezas</option>
            </select>
          </div>

          <div>
            <label style={labelStyle}>Tienda Destino *</label>
            <select value={form.tienda_id} onChange={e => set('tienda_id', e.target.value)} style={inputStyle}>
              <option value="">Seleccionar tienda...</option>
              {tiendas.map(t => <option key={t.tienda_id} value={t.tienda_id}>{t.tienda_id} — {t.nombre}</option>)}
              {tiendas.length === 0 && (
                <>
                  <option value="TDA-007">TDA-007 — Vertiche Monterrey Centro</option>
                  <option value="TDA-015">TDA-015 — Vertiche San Pedro</option>
                  <option value="TDA-029">TDA-029 — Vertiche Guadalajara</option>
                  <option value="TDA-033">TDA-033 — Vertiche CDMX Polanco</option>
                  <option value="TDA-044">TDA-044 — Vertiche Puebla</option>
                  <option value="TDA-051">TDA-051 — Vertiche Cancun</option>
                </>
              )}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Palet (opcional)</label>
            <select value={form.palet_id} onChange={e => handlePaletChange(e.target.value)} style={inputStyle}>
              <option value="">Sin palet asignado</option>
              {palets.map(p => <option key={p.id} value={p.id}>{p.id}</option>)}
              {palets.length === 0 && (
                <>
                  <option value="PAL-001">PAL-001</option>
                  <option value="PAL-002">PAL-002</option>
                  <option value="PAL-003">PAL-003</option>
                  <option value="PAL-004">PAL-004</option>
                </>
              )}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Pedido (opcional)</label>
            <input
              placeholder="PED-2026-001"
              value={form.pedido_id}
              onChange={e => set('pedido_id', e.target.value)}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Proveedor</label>
            <select value={form.proveedor_id} onChange={e => set('proveedor_id', parseInt(e.target.value))} style={inputStyle}>
              {proveedores.map(p => <option key={p.id} value={p.id}>{p.codigo} — {p.nombre}</option>)}
              {proveedores.length === 0 && (
                <>
                  <option value={1}>PROV-001 — Textiles Monterrey SA</option>
                  <option value={2}>PROV-002 — Confecciones del Norte</option>
                </>
              )}
            </select>
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              padding: '10px 0', background: 'var(--color-primary)',
              color: '#fff', border: 'none', borderRadius: 'var(--radius)',
              fontSize: 14, fontWeight: 500, cursor: 'pointer', width: '100%',
              opacity: loading ? 0.6 : 1, marginTop: 4,
            }}
          >
            {loading ? 'Registrando...' : 'Registrar Tag'}
          </button>
        </div>
      </div>

      {/* Ultimos registros */}
      <div style={panelStyle}>
        <div style={seccionTituloStyle}>Ultimos Registros</div>

        {tagsRecientes.length === 0 ? (
          <div style={{ padding: '32px 24px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 13 }}>
            No hay tags registrados aun
          </div>
        ) : (
          <>
            <div style={{
              display: 'grid', gridTemplateColumns: '170px 120px 1fr 80px',
              padding: '8px 16px', background: '#EBF5FB',
              fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)',
              borderBottom: '1px solid var(--color-border)',
            }}>
              <span>EPC</span>
              <span>SKU</span>
              <span>TIENDA</span>
              <span>REGISTRO</span>
            </div>
            {tagsRecientes.map((tag, i) => (
              <div key={tag.epc} style={{
                display: 'grid', gridTemplateColumns: '170px 120px 1fr 80px',
                padding: '10px 16px',
                background: i % 2 === 0 ? '#fff' : '#F8F9FA',
                borderBottom: '1px solid var(--color-border)',
                alignItems: 'center', fontSize: 13,
              }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }} title={tag.epc}>
                  {epcCorto(tag.epc)}
                </span>
                <span>{tag.sku}</span>
                <span>
                  <span style={{
                    fontSize: 11, padding: '2px 7px',
                    background: '#EBF5FB', color: 'var(--color-primary)',
                    border: '1px solid #AED6F1', borderRadius: 2,
                  }}>
                    {tag.tienda?.nombre || tag.tienda_id || '—'}
                  </span>
                </span>
                <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                  {haceCuanto(tag.registrado_en)}
                </span>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
