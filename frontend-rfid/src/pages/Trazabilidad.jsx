import { useState, useEffect } from 'react';
import { api } from '../api/rfidApi';

const ETAPAS_ORDEN = ['PREREGISTRO', 'QA', 'REGISTRO', 'SORTER', 'BAHIA', 'AUDITORIA', 'ENVIO'];

// Deriva la EtapaRFID a partir del ID del lector (fallback cuando el evento no trae etapa)
function lectorAEtapa(lector_id) {
  if (!lector_id) return null;
  if (lector_id.includes('RECEPCION'))  return 'PREREGISTRO';
  if (lector_id.includes('QA'))         return 'QA';
  if (lector_id.includes('REGISTRO'))   return 'REGISTRO';
  if (lector_id.includes('SORTER'))     return 'SORTER';
  if (lector_id.includes('BAHIA'))      return 'BAHIA';
  if (lector_id.includes('AUDITORIA'))  return 'AUDITORIA';
  if (lector_id.includes('ENVIO'))      return 'ENVIO';
  return null;
}

// Calcula el estado de cada etapa a partir del timeline
function calcularEtapas(timeline, tipoFlujo) {
  return ETAPAS_ORDEN.map(etapa => {
    // El campo detalle ahora es el nombre de la EtapaRFID
    const evento = timeline?.find(e =>
      e.tipo === 'LECTURA' && (e.detalle === etapa || lectorAEtapa(e.lector) === etapa)
    );
    const tieneError = timeline?.some(
      e => e.tipo === 'ANOMALIA' && (e.etapa === etapa || lectorAEtapa(e.lector) === etapa)
    );

    // Para flujos NUEVA_TIENDA/REFILL, CROSS_DOCK y BAHIA/AUDITORIA no aplican
    const esAlmacen = tipoFlujo === 'NUEVA_TIENDA' || tipoFlujo === 'REFILL';
    const noAplica = esAlmacen && (etapa === 'SORTER' || etapa === 'BAHIA' || etapa === 'AUDITORIA' || etapa === 'ENVIO');

    return {
      nombre: etapa,
      completada: !!evento,
      noAplica,
      timestamp: evento?.tiempo,
      lector: evento?.lector,
      tieneError: !!tieneError,
    };
  });
}

const ETAPA_LABELS = {
  PREREGISTRO: 'Preregistro',
  QA:          'QA',
  REGISTRO:    'Registro',
  SORTER:      'Sorter',
  BAHIA:       'Bahia',
  AUDITORIA:   'Auditoria',
  ENVIO:       'Envio',
};

const panelStyle = {
  background: 'var(--ds-bg-surface)',
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

const btnOutlineStyle = {
  width: '100%', padding: '9px 14px',
  background: 'var(--ds-bg-surface)',
  border: '1px solid var(--color-primary)',
  borderRadius: 'var(--radius)',
  color: 'var(--color-primary)',
  fontSize: 13, fontWeight: 500,
  cursor: 'pointer', textAlign: 'left',
};

// EPCs de demo fijos — creados en seed, el simulador no los toca
const DEMO_OK  = 'DEMO0000000000000000OK01';
const DEMO_ERR = 'DEMO000000000000000ERR02';

export default function Trazabilidad({ initialEpc }) {
  const [tipoBusqueda, setTipoBusqueda] = useState('epc');
  const [busqueda, setBusqueda] = useState('');
  const [resultado, setResultado] = useState(null);
  const [resultadoLista, setResultadoLista] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Si se recibe un EPC inicial (desde DetallePalet), buscarlo automaticamente
  useEffect(() => {
    if (initialEpc) {
      setBusqueda(initialEpc);
      setTipoBusqueda('epc');
      buscarEpc(initialEpc);
    }
  }, [initialEpc]);

  async function buscarEpc(epc) {
    setLoading(true); setError(null); setResultado(null); setResultadoLista(null);
    try {
      const data = await api.getTrazabilidad(epc);
      if (data.error) throw new Error(data.error);
      setResultado(data);
    } catch (e) {
      setError(e.message || 'No se encontro informacion para esa busqueda.');
    }
    setLoading(false);
  }

  const buscar = async (epcOverride, skuOverride) => {
    const query = epcOverride || skuOverride || busqueda.trim();
    const tipo  = epcOverride ? 'epc' : skuOverride ? 'sku' : tipoBusqueda;
    if (!query) return;

    setLoading(true); setError(null); setResultado(null); setResultadoLista(null);

    try {
      if (tipo === 'epc') {
        await buscarEpc(query);
      } else {
        const data = await api.buscarPorSku(query);
        if (data.error) throw new Error(data.error);
        setResultadoLista(Array.isArray(data) ? data : []);
        setLoading(false);
      }
    } catch (e) {
      setError(e.message || 'No se encontro informacion para esa busqueda.');
      setLoading(false);
    }
  };

  const verDetalle = (epc) => {
    setBusqueda(epc);
    setTipoBusqueda('epc');
    buscarEpc(epc);
  };

  const tipoFlujo = resultado?.tag?.tipo_flujo;
  const etapas = resultado?.tag ? calcularEtapas(resultado.timeline, tipoFlujo) : [];
  const anomaliasTimeline = resultado?.timeline?.filter(e => e.tipo === 'ANOMALIA') || [];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 16, alignItems: 'start' }}>

      {/* Columna izquierda */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        <div style={panelStyle}>
          <div style={seccionTituloStyle}>Buscar Prepack</div>
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', borderRadius: 'var(--radius)', overflow: 'hidden', border: '1px solid var(--color-border)' }}>
              {['epc', 'sku'].map(t => (
                <button key={t} onClick={() => setTipoBusqueda(t)} style={{
                  flex: 1, padding: '7px 0',
                  background: tipoBusqueda === t ? 'var(--color-primary)' : '#fff',
                  color: tipoBusqueda === t ? '#fff' : 'var(--color-text-secondary)',
                  border: 'none', cursor: 'pointer',
                  fontSize: 12, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em',
                }}>
                  {t.toUpperCase()}
                </button>
              ))}
            </div>

            <input
              placeholder={tipoBusqueda === 'epc' ? 'EPC-SIM-000...' : 'BLU-F-M-001'}
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && buscar()}
              style={{
                padding: '9px 12px',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius)',
                fontSize: 13,
                fontFamily: tipoBusqueda === 'epc' ? 'var(--font-mono)' : 'var(--font-main)',
                outline: 'none',
              }}
            />

            <button
              onClick={() => buscar()}
              disabled={loading || !busqueda.trim()}
              style={{
                padding: '9px 0', background: 'var(--color-primary)',
                color: '#fff', border: 'none', borderRadius: 'var(--radius)',
                fontSize: 13, fontWeight: 500, cursor: 'pointer',
                opacity: loading || !busqueda.trim() ? 0.5 : 1,
              }}
            >
              {loading ? 'Buscando...' : 'Buscar'}
            </button>
          </div>
        </div>

        {/* Accesos rapidos */}
        <div style={panelStyle}>
          <div style={seccionTituloStyle}>Ejemplos Rapidos</div>
          <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button onClick={() => { setBusqueda(DEMO_OK); buscar(DEMO_OK); }} style={btnOutlineStyle}>
              Prepack sin errores
            </button>
            <button
              onClick={() => { setBusqueda(DEMO_ERR); buscar(DEMO_ERR); }}
              style={{ ...btnOutlineStyle, borderColor: 'var(--color-error)', color: 'var(--color-error)' }}
            >
              Prepack con anomalia
            </button>
            <button
              onClick={() => { setTipoBusqueda('sku'); setBusqueda('BLU-F-M-001'); buscar(null, 'BLU-F-M-001'); }}
              style={{ ...btnOutlineStyle, borderColor: 'var(--color-text-muted)', color: 'var(--color-text-secondary)' }}
            >
              Buscar por SKU
            </button>
          </div>
        </div>

      </div>

      {/* Columna derecha */}
      <div>
        {!resultado && !resultadoLista && !error && !loading && (
          <div style={{ ...panelStyle, padding: '48px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
              Ingresa un EPC o usa los accesos rapidos para ver el historial de un prepack
            </div>
          </div>
        )}

        {error && (
          <div style={{ ...panelStyle, padding: 16, background: 'var(--color-error-bg)', borderColor: 'var(--color-error)' }}>
            <span style={{ color: 'var(--color-error)', fontSize: 13 }}>{error}</span>
          </div>
        )}

        {loading && (
          <div style={{ ...panelStyle, padding: '32px 24px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 13 }}>
            Buscando...
          </div>
        )}

        {/* Lista por SKU */}
        {resultadoLista && (
          <div style={panelStyle}>
            <div style={seccionTituloStyle}>
              Tags con SKU &quot;{busqueda}&quot; — {resultadoLista.length} resultados
            </div>
            {resultadoLista.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 13 }}>
                No se encontraron tags con ese SKU.
              </div>
            ) : (
              resultadoLista.map(tag => (
                <div key={tag.epc} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '12px 16px', borderBottom: '1px solid var(--color-border)',
                }}>
                  <div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, marginBottom: 3 }}>{tag.epc}</div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                      {tag.talla} | {tag.color} | {tag.cantidad_piezas} pzas | {tag.tienda?.nombre || tag.tienda_id || '—'}
                    </div>
                  </div>
                  <button onClick={() => verDetalle(tag.epc)} style={{
                    padding: '6px 14px', background: 'var(--color-primary)',
                    color: '#fff', border: 'none', borderRadius: 'var(--radius)',
                    fontSize: 12, fontWeight: 500, cursor: 'pointer',
                  }}>
                    Ver historial
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* Detalle por EPC */}
        {resultado?.tag && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Info del prepack */}
            <div style={panelStyle}>
              <div style={seccionTituloStyle}>Informacion del Prepack</div>
              <div style={{ padding: 16, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
                {[
                  { label: 'EPC',          valor: resultado.tag.epc,                   mono: true, span: 3 },
                  { label: 'SKU',          valor: resultado.tag.sku                    },
                  { label: 'Talla',        valor: resultado.tag.talla                  },
                  { label: 'Color',        valor: resultado.tag.color                  },
                  { label: 'Piezas',       valor: resultado.tag.cantidad_piezas        },
                  { label: 'Tienda',       valor: resultado.tag.tienda?.nombre || resultado.tag.tienda_id },
                  { label: 'Tipo flujo',   valor: resultado.tag.tipo_flujo             },
                  { label: 'Etapa actual', valor: resultado.tag.etapa_actual           },
                  { label: 'Pedido',       valor: resultado.tag.pedido_id              },
                  { label: 'Proveedor',    valor: resultado.tag.proveedor?.nombre,     span: 3 },
                ].map((f, i) => (
                  <div key={i} style={{ gridColumn: f.span ? `span ${f.span}` : undefined }}>
                    <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-muted)', marginBottom: 3 }}>
                      {f.label}
                    </div>
                    <div style={{ fontSize: 13, fontFamily: f.mono ? 'var(--font-mono)' : undefined, wordBreak: 'break-all' }}>
                      {f.valor || '—'}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Timeline horizontal — 6 nodos */}
            <div style={panelStyle}>
              <div style={seccionTituloStyle}>Recorrido del Prepack</div>
              <div style={{ padding: '24px 24px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', position: 'relative' }}>
                  {/* Linea de fondo */}
                  <div style={{
                    position: 'absolute', top: 17,
                    left: '8%', right: '8%',
                    height: 2, background: 'var(--color-border)',
                    zIndex: 0,
                  }} />

                  {etapas.map((etapa) => {
                    let bgColor, textColor, label;
                    if (etapa.noAplica) {
                      bgColor = 'var(--bg-base)'; textColor = 'var(--color-text-muted)'; label = 'N/A';
                    } else if (!etapa.completada) {
                      bgColor = 'var(--color-border)'; textColor = 'var(--color-text-muted)'; label = '';
                    } else if (etapa.tieneError) {
                      bgColor = 'var(--color-error)'; textColor = '#fff'; label = 'ERR';
                    } else {
                      bgColor = 'var(--color-ok)'; textColor = '#fff'; label = 'OK';
                    }

                    return (
                      <div key={etapa.nombre} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, zIndex: 1 }}>
                        <div style={{
                          width: 34, height: 34, borderRadius: '50%',
                          background: bgColor,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 9, fontWeight: 700, color: textColor,
                          border: '3px solid #fff',
                          boxShadow: `0 0 0 2px ${bgColor}`,
                        }}>
                          {label}
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: etapa.completada && !etapa.noAplica ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }}>
                            {ETAPA_LABELS[etapa.nombre]}
                          </div>
                          {etapa.timestamp && (
                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--color-text-muted)', marginTop: 2 }}>
                              {new Date(etapa.timestamp).toLocaleTimeString('es-MX', { hour12: false })}
                            </div>
                          )}
                          {etapa.noAplica && (
                            <div style={{ fontSize: 9, color: 'var(--color-text-muted)', marginTop: 2 }}>En almacen</div>
                          )}
                          {etapa.tieneError && (
                            <div style={{ fontSize: 9, color: 'var(--color-error)', fontWeight: 600, marginTop: 2 }}>BAHIA INCORRECTA</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Anomalias */}
            {anomaliasTimeline.length > 0 && (
              <div style={{ ...panelStyle, borderColor: 'var(--color-error)' }}>
                <div style={{ ...seccionTituloStyle, color: 'var(--color-error)', background: 'var(--color-error-bg)' }}>
                  Anomalias Detectadas — {anomaliasTimeline.length}
                </div>
                <div style={{ padding: '8px 12px' }}>
                  {anomaliasTimeline.map((a, i) => (
                    <div key={i} style={{
                      padding: '10px 12px', marginBottom: 6,
                      background: 'var(--color-error-bg)',
                      borderLeft: '3px solid var(--color-error)',
                      borderRadius: 2,
                    }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-error)', textTransform: 'uppercase', marginBottom: 3 }}>
                        {a.detalle}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                        {a.descripcion}{a.bahia ? ` — Bahia: ${a.bahia}` : ''}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 3 }}>
                        {a.tiempo ? new Date(a.tiempo).toLocaleString('es-MX') : ''}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tabla de eventos */}
            <div style={panelStyle}>
              <div style={seccionTituloStyle}>Eventos Registrados — {resultado.timeline?.length || 0}</div>
              {(!resultado.timeline || resultado.timeline.length === 0) ? (
                <div style={{ padding: 24, textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 13 }}>
                  Sin eventos registrados.
                </div>
              ) : (
                <>
                  <div style={{
                    display: 'grid', gridTemplateColumns: '160px 140px 220px 110px',
                    padding: '8px 16px', background: '#EBF5FB',
                    fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)',
                    borderBottom: '1px solid var(--color-border)',
                  }}>
                    <span>FECHA / HORA</span>
                    <span>ETAPA</span>
                    <span>LECTOR</span>
                    <span>BAHIA</span>
                  </div>
                  {resultado.timeline.map((item, i) => {
                    const esAnomalia = item.tipo === 'ANOMALIA';
                    return (
                      <div key={i} style={{
                        display: 'grid', gridTemplateColumns: '160px 140px 220px 110px',
                        padding: '9px 16px',
                        background: esAnomalia ? 'var(--color-error-bg)' : (i % 2 === 0 ? '#fff' : '#F8F9FA'),
                        borderBottom: '1px solid var(--color-border)',
                        fontSize: 13, alignItems: 'center',
                      }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-text-secondary)' }}>
                          {item.tiempo ? new Date(item.tiempo).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'medium' }) : '—'}
                        </span>
                        <span>
                          <span style={{
                            fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 2, textTransform: 'uppercase',
                            background: esAnomalia ? 'var(--color-error-bg)' : '#EBF5FB',
                            color: esAnomalia ? 'var(--color-error)' : 'var(--color-primary)',
                            border: `1px solid ${esAnomalia ? 'var(--color-error)' : '#AED6F1'}`,
                          }}>
                            {item.detalle || item.tipo}
                          </span>
                        </span>
                        <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                          {item.lector || (item.tipo === 'VINCULACION_CAJA' ? `Caja: ${item.caja}` : '—')}
                        </span>
                        <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                          {item.bahia || '—'}
                        </span>
                      </div>
                    );
                  })}
                </>
              )}
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
