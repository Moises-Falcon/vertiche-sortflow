import { useState, useEffect } from 'react';
import { api } from '../api/rfidApi';

const ETAPAS_ORDEN = [
  { key: 'PREREGISTRO', label: 'Preregistro', color: 'var(--etapa-preregistro)' },
  { key: 'QA',          label: 'QA',          color: 'var(--etapa-qa)'          },
  { key: 'REGISTRO',    label: 'Registro',    color: 'var(--etapa-registro)'    },
  { key: 'SORTER',      label: 'Sorter',      color: 'var(--etapa-sorter)'      },
  { key: 'BAHIA',       label: 'Bahia',       color: 'var(--etapa-bahia)'       },
  { key: 'AUDITORIA',   label: 'Auditoria',   color: 'var(--etapa-auditoria)'   },
  { key: 'ENVIO',       label: 'Envio',       color: 'var(--etapa-envio)'       },
];

const FLUJO_CONFIG = {
  CROSS_DOCK:   { label: 'Cross Dock',   color: 'var(--flujo-crossdock)',  bg: 'var(--flujo-crossdock-bg)' },
  NUEVA_TIENDA: { label: 'Nueva Tienda', color: 'var(--flujo-almacen)',    bg: 'var(--flujo-almacen-bg)' },
  REFILL:       { label: 'Refill',       color: 'var(--flujo-refill)',     bg: 'var(--flujo-refill-bg)' },
};

export default function DetallePedido({ pedidoId, onBack, onVerPalet }) {
  const [pedido, setPedido] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    setCargando(true);
    api.getPedido(pedidoId).then(d => { setPedido(d); setCargando(false); });
  }, [pedidoId]);

  if (cargando) return <div style={{ padding: 40, color: 'var(--color-text-secondary)', fontSize: 14 }}>Cargando pedido...</div>;
  if (!pedido || pedido.error) return <div style={{ padding: 40, color: 'var(--color-error)' }}>Pedido no encontrado.</div>;

  const tags = pedido.palets?.flatMap(p => p.tags) || [];
  const anomalias = tags.reduce((s, t) => s + (t.anomalias?.length || 0), 0);
  const completados = tags.filter(t => t.etapa_actual === 'ENVIO' || t.etapa_actual === 'COMPLETADO').length;
  const por_flujo = pedido.resumen?.por_flujo || {};
  const por_etapa = pedido.resumen?.por_etapa || {};

  return (
    <div>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
        <button onClick={onBack} style={{
          background: 'none', border: '1px solid var(--color-border)', borderRadius: 3,
          padding: '4px 12px', fontSize: 12, cursor: 'pointer', color: 'var(--color-text-secondary)'
        }}>
          Volver a Pedidos
        </button>
        <span style={{ color: 'var(--color-text-muted)', fontSize: 12 }}>/ {pedido.pedido_id}</span>
      </div>

      {/* Cabecera */}
      <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--color-border)', borderRadius: 4, padding: '16px 20px', marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 4, letterSpacing: '0.05em' }}>PEDIDO</div>
            <div style={{ fontSize: 18, fontWeight: 600 }}>{pedido.proveedor?.nombre || pedido.pedido_id}</div>
            <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 4 }}>
              {pedido.pedido_id} ({pedido.proveedor?.codigo})
              {pedido.fecha_entrega_estimada && (
                <span style={{ marginLeft: 12 }}>
                  Entrega estimada: {new Date(pedido.fecha_entrega_estimada).toLocaleDateString('es-MX')}
                </span>
              )}
            </div>
          </div>
          <span style={{
            padding: '3px 10px', borderRadius: 3, fontSize: 11, fontWeight: 600,
            color: pedido.estado === 'COMPLETADO' ? 'var(--color-ok)' : pedido.estado === 'EN_PROCESO' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            background: pedido.estado === 'COMPLETADO' ? 'var(--color-ok-bg)' : pedido.estado === 'EN_PROCESO' ? '#EBF5FB' : 'var(--bg-base)',
            border: '1px solid var(--color-border)'
          }}>
            {pedido.estado?.replace('_', ' ')}
          </span>
        </div>

        <div style={{ display: 'flex', gap: 32, marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--color-border)' }}>
          {[
            { label: 'Palets', value: pedido.palets?.length || 0 },
            { label: 'Tags totales', value: tags.length },
            { label: 'Completados', value: completados },
            { label: 'Anomalias', value: anomalias, warn: anomalias > 0 },
          ].map(s => (
            <div key={s.label}>
              <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 2 }}>{s.label}</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: s.warn ? 'var(--color-error)' : 'var(--color-text-primary)' }}>{s.value}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* Distribucion por flujo */}
        <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--color-border)', borderRadius: 4, padding: '16px 20px' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 12, letterSpacing: '0.05em' }}>DISTRIBUCION POR FLUJO</div>
          {Object.entries(FLUJO_CONFIG).map(([key, cfg]) => {
            const count = por_flujo[key] || 0;
            const pct = tags.length > 0 ? Math.round((count / tags.length) * 100) : 0;
            return (
              <div key={key} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12 }}>
                  <span style={{ color: cfg.color, fontWeight: 500 }}>{cfg.label}</span>
                  <span style={{ color: 'var(--color-text-secondary)' }}>{count} ({pct}%)</span>
                </div>
                <div className="progress-bar-bg">
                  <div className="progress-bar-fill" style={{ width: `${pct}%`, background: cfg.color }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Mapa de etapas */}
        <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--color-border)', borderRadius: 4, padding: '16px 20px' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 12, letterSpacing: '0.05em' }}>ESTADO ACTUAL POR ETAPA</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {ETAPAS_ORDEN.map((e, i) => {
              const count = por_etapa[e.key] || 0;
              return (
                <div key={e.key} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{
                    border: `2px solid ${e.color}`,
                    borderRadius: 4,
                    padding: '6px 12px',
                    textAlign: 'center',
                    minWidth: 80,
                  }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: e.color }}>{count}</div>
                    <div style={{ fontSize: 10, color: 'var(--color-text-secondary)', marginTop: 2 }}>{e.label}</div>
                  </div>
                  {i < ETAPAS_ORDEN.length - 1 && (
                    <div style={{ color: 'var(--color-border-strong)', fontSize: 16 }}>›</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Palets */}
      <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--color-border)', borderRadius: 4 }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border)', fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)' }}>
          PALETS ({pedido.palets?.length || 0})
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12, padding: 16 }}>
          {(pedido.palets || []).map(pal => {
            const palTags = pal.tags || [];
            const palComp = palTags.filter(t => t.etapa_actual === 'ENVIO' || t.etapa_actual === 'COMPLETADO').length;
            const palPct = palTags.length > 0 ? Math.round((palComp / palTags.length) * 100) : 0;
            return (
              <div key={pal.palet_id} style={{
                border: '1px solid var(--color-border)', borderRadius: 4, padding: '14px 16px', cursor: 'pointer',
                transition: 'border-color 0.15s',
              }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-primary)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--color-border)'}
                onClick={() => onVerPalet(pal.palet_id)}
              >
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2, lineHeight: 1.2 }}>{pal.orden?.nombre_producto || pal.orden?.modelo || pal.palet_id}</div>
                <div style={{ fontSize: 10, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', marginBottom: 4 }}>{pal.palet_id}</div>
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 10 }}>
                  {palTags.length} tags — {palComp} completados
                </div>
                <div className="progress-bar-bg">
                  <div className="progress-bar-fill" style={{ width: `${palPct}%` }} />
                </div>
                <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginTop: 4 }}>{palPct}% completado</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
