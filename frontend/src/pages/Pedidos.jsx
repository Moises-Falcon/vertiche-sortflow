import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/rfidApi';

const ETAPAS_RFID = [
  { key: 'PREREGISTRO', label: 'Preregistro' },
  { key: 'QA',          label: 'QA'          },
  { key: 'REGISTRO',    label: 'Registro'    },
  { key: 'SORTER',      label: 'Sorter'      },
  { key: 'BAHIA',       label: 'Bahia'       },
  { key: 'AUDITORIA',   label: 'Auditoria'   },
  { key: 'ENVIO',       label: 'Envio'       },
];

const ESTADO_CONFIG = {
  PENDIENTE:   { label: 'Pendiente',  color: 'var(--color-text-secondary)', bg: 'var(--bg-base)' },
  EN_PROCESO:  { label: 'En Proceso', color: 'var(--color-primary)',        bg: '#EBF5FB'        },
  COMPLETADO:  { label: 'Completado', color: 'var(--color-ok)',             bg: 'var(--color-ok-bg)' },
  CANCELADO:   { label: 'Cancelado',  color: 'var(--color-error)',          bg: 'var(--color-error-bg)' },
};

export default function Pedidos({ onAbrirOC, onVerHistorial }) {
  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(() => {
    api.getPedidos().then(d => {
      setPedidos(Array.isArray(d) ? d : []);
      setCargando(false);
    }).catch(() => setCargando(false));
  }, []);

  useEffect(() => {
    cargar();
    const id = setInterval(cargar, 10000);
    return () => clearInterval(id);
  }, [cargar]);

  const totalTags        = pedidos.reduce((s, p) => s + (p.total_tags || 0), 0);
  const totalAnomalias   = pedidos.reduce((s, p) => s + (p.total_anomalias || 0), 0);
  const totalCompletados = pedidos.reduce((s, p) => s + (p.completados || 0), 0);

  const globalPorEtapa = pedidos.reduce((acc, p) => {
    if (p.por_etapa) {
      Object.entries(p.por_etapa).forEach(([k, v]) => { acc[k] = (acc[k] || 0) + v; });
    }
    return acc;
  }, {});

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20, alignItems: 'start' }}>

      {/* Panel izquierdo */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--color-border)', borderRadius: 4, padding: '16px 18px' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 12, letterSpacing: '0.05em' }}>RESUMEN GENERAL</div>
          {[
            { label: 'Pedidos activos', value: pedidos.filter(p => p.estado === 'EN_PROCESO').length },
            { label: 'Tags en sistema',  value: totalTags },
            { label: 'Completados',      value: totalCompletados },
            { label: 'Anomalias',        value: totalAnomalias, warn: true },
          ].map(s => (
            <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--color-border)' }}>
              <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{s.label}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: s.warn && s.value > 0 ? 'var(--color-error)' : 'var(--color-text-primary)' }}>{s.value}</span>
            </div>
          ))}
        </div>

        <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--color-border)', borderRadius: 4, padding: '16px 18px' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 12, letterSpacing: '0.05em' }}>TAGS POR ETAPA</div>
          {ETAPAS_RFID.map(e => (
            <div key={e.key} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid var(--color-border)' }}>
              <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{e.label}</span>
              <span style={{ fontSize: 13, fontWeight: 600 }}>{globalPorEtapa[e.key] || 0}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Panel derecho — tabla */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontSize: 15, fontWeight: 600 }}>Pedidos</div>
          <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Actualiza cada 10s</div>
        </div>

        <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--color-border)', borderRadius: 4, overflow: 'hidden' }}>
          {cargando ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 13 }}>Cargando pedidos...</div>
          ) : pedidos.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 13 }}>No hay pedidos en el sistema.</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: 'var(--bg-base)', borderBottom: '1px solid var(--color-border)' }}>
                  {['Pedido', 'Proveedor', 'Estado', 'Palets', 'Tags', 'Anomalias', 'Progreso', ''].map(h => (
                    <th key={h} style={{ padding: '9px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pedidos.map(p => {
                  const cfg = ESTADO_CONFIG[p.estado] || ESTADO_CONFIG.PENDIENTE;
                  return (
                    <tr key={p.pedido_id}
                      style={{ borderBottom: '1px solid var(--color-border)', cursor: 'pointer' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-base)'}
                      onMouseLeave={e => e.currentTarget.style.background = ''}
                      onClick={() => onAbrirOC(p.palets?.[0]?.palet_id || p.pedido_id)}
                    >
                      <td style={{ padding: '10px 12px', fontWeight: 600, fontFamily: 'var(--font-mono)', fontSize: 11 }}>{p.pedido_id}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <div style={{ fontWeight: 500 }}>{p.proveedor?.nombre}</div>
                        <div style={{ color: 'var(--color-text-muted)', fontSize: 11 }}>{p.proveedor?.codigo}</div>
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{ padding: '2px 8px', borderRadius: 3, fontSize: 11, fontWeight: 600, color: cfg.color, background: cfg.bg }}>
                          {cfg.label}
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'center' }}>{p.total_palets}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'center' }}>{p.total_tags}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'center', color: p.total_anomalias > 0 ? 'var(--color-error)' : 'var(--color-text-muted)', fontWeight: p.total_anomalias > 0 ? 700 : 400 }}>
                        {p.total_anomalias > 0 ? p.total_anomalias : '—'}
                      </td>
                      <td style={{ padding: '10px 12px', minWidth: 120 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div className="progress-bar-bg" style={{ flex: 1 }}>
                            <div className="progress-bar-fill" style={{ width: `${p.progreso_pct}%` }} />
                          </div>
                          <span style={{ fontSize: 11, color: 'var(--color-text-secondary)', minWidth: 32 }}>{p.progreso_pct}%</span>
                        </div>
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{ fontSize: 11, color: 'var(--color-primary)' }}>Ver detalle ›</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
