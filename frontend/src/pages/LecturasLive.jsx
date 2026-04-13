import { useEffect, useState, useRef } from 'react';
import { socket } from '../socket/socketClient';
import { api } from '../api/rfidApi';

const MAX_EVENTOS = 100;

function epcCorto(epc) {
  if (!epc) return '—';
  return epc.length > 20 ? epc.substring(0, 18) + '…' : epc;
}

function haceCuanto(timestamp) {
  const diff = Math.floor((Date.now() - new Date(timestamp)) / 1000);
  if (diff < 60)   return `hace ${diff}s`;
  if (diff < 3600) return `hace ${Math.floor(diff / 60)}min`;
  return `hace ${Math.floor(diff / 3600)}h`;
}

const CONTADORES_INIT = { preregistro: 0, bahia: 0, anomalias: 0, duplicados: 0 };
const ETAPAS_FILTRO = ['TODAS', 'PREREGISTRO', 'QA', 'REGISTRO', 'SORTER', 'BAHIA', 'AUDITORIA', 'ENVIO'];

const panelStyle = {
  background: 'var(--bg-panel)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius)',
  boxShadow: 'var(--shadow)',
};

const seccionTituloStyle = {
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.08em',
  color: 'var(--color-text-muted)',
  textTransform: 'uppercase',
  padding: '10px 16px',
  borderBottom: '1px solid var(--color-border)',
  margin: 0,
};

export default function LecturasLive() {
  const [eventos, setEventos] = useState([]);
  const [anomalias, setAnomalias] = useState([]);
  const [contadores, setContadores] = useState(CONTADORES_INIT);
  const [filtroEtapa, setFiltroEtapa] = useState('TODAS');
  const [conectado, setConectado] = useState(socket.connected);
  const tagsVistos = useRef(new Set());

  useEffect(() => {
    api.getLecturas({ limit: 50 }).then(data => {
      if (!Array.isArray(data)) return;
      setEventos(data);
      const unicos = new Set(data.map(e => e.epc));
      const dups = data.filter(e => e.es_duplicado).length;
      const pre  = data.filter(e => e.etapa === 'PREREGISTRO').length;
      const bah  = data.filter(e => e.etapa === 'BAHIA').length;
      tagsVistos.current = unicos;
      setContadores(prev => ({ ...prev, preregistro: pre, bahia: bah, duplicados: dups }));
    }).catch(() => {});

    api.getAnomalias({ limit: 5 }).then(data => {
      if (Array.isArray(data)) setAnomalias(data);
    }).catch(() => {});

    socket.on('connect', () => setConectado(true));
    socket.on('disconnect', () => setConectado(false));
    setConectado(socket.connected);

    socket.on('lectura', (evento) => {
      setEventos(prev => [evento, ...prev].slice(0, MAX_EVENTOS));
      setContadores(prev => ({
        ...prev,
        preregistro: prev.preregistro + (evento.etapa === 'PREREGISTRO' ? 1 : 0),
        bahia:      prev.bahia      + (evento.etapa === 'BAHIA' ? 1 : 0),
        duplicados: prev.duplicados + (evento.es_duplicado ? 1 : 0),
      }));
    });

    socket.on('anomalia', (anomalia) => {
      setAnomalias(prev => [{ ...anomalia, _key: Date.now() }, ...prev].slice(0, 5));
      setContadores(prev => ({ ...prev, anomalias: prev.anomalias + 1 }));
    });

    return () => {
      socket.off('lectura');
      socket.off('anomalia');
      socket.off('connect');
      socket.off('disconnect');
    };
  }, []);

  const eventosFiltrados = filtroEtapa === 'TODAS'
    ? eventos
    : eventos.filter(e => e.etapa === filtroEtapa);

  const statCards = [
    { label: 'Lecturas Preregistro', valor: contadores.preregistro, color: 'var(--etapa-preregistro)' },
    { label: 'Lecturas Bahia',      valor: contadores.bahia,      color: 'var(--etapa-bahia)'      },
    { label: 'Anomalias hoy',      valor: contadores.anomalias, color: contadores.anomalias > 0 ? 'var(--color-error)' : 'var(--color-ok)' },
    { label: 'Duplicados hoy',     valor: contadores.duplicados,color: contadores.duplicados > 0 ? 'var(--color-warn)' : 'var(--color-ok)' },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16, alignItems: 'start' }}>

      {/* Feed */}
      <div style={panelStyle}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderBottom: '1px solid var(--color-border)' }}>
          <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
            Feed en Tiempo Real
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: conectado ? 'var(--color-ok)' : 'var(--color-error)', display: 'inline-block' }} />
            <span style={{ fontSize: 12, color: conectado ? 'var(--color-ok)' : 'var(--color-error)', fontWeight: 500 }}>
              {conectado ? 'Conectado' : 'Desconectado'}
            </span>
          </div>
        </div>

        {/* Filtros por etapa */}
        <div style={{ display: 'flex', gap: 5, padding: '10px 16px', borderBottom: '1px solid var(--color-border)', flexWrap: 'wrap' }}>
          {ETAPAS_FILTRO.map(e => (
            <button key={e} onClick={() => setFiltroEtapa(e)} style={{
              padding: '3px 10px',
              borderRadius: 20,
              border: `1px solid ${filtroEtapa === e ? 'var(--color-primary)' : 'var(--color-border)'}`,
              background: filtroEtapa === e ? 'var(--color-primary)' : 'transparent',
              color: filtroEtapa === e ? '#fff' : 'var(--color-text-secondary)',
              fontSize: 11, fontWeight: filtroEtapa === e ? 600 : 400,
              cursor: 'pointer',
            }}>
              {e}
            </button>
          ))}
          <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--color-text-muted)', alignSelf: 'center' }}>
            {eventosFiltrados.length} eventos
          </span>
        </div>

        {/* Tabla */}
        <div style={{ overflowX: 'auto' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '75px 115px 170px 110px 110px 55px',
            padding: '8px 16px',
            background: '#EBF5FB',
            fontSize: 11, fontWeight: 600,
            color: 'var(--color-text-secondary)',
            letterSpacing: '0.04em',
            borderBottom: '1px solid var(--color-border)',
          }}>
            <span>HORA</span>
            <span>ETAPA</span>
            <span>EPC</span>
            <span>PEDIDO</span>
            <span>TIENDA</span>
            <span>OK</span>
          </div>

          {eventosFiltrados.length === 0 && (
            <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 13 }}>
              Esperando lecturas...
            </div>
          )}

          {eventosFiltrados.map((e, i) => (
            <div key={e.id || i} style={{
              display: 'grid',
              gridTemplateColumns: '75px 115px 170px 110px 110px 55px',
              padding: '8px 16px',
              background: e.es_duplicado ? 'var(--color-error-bg)' : (i % 2 === 0 ? '#fff' : '#F8F9FA'),
              borderBottom: '1px solid var(--color-border)',
              alignItems: 'center',
              fontSize: 12,
            }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-text-secondary)' }}>
                {new Date(e.timestamp).toLocaleTimeString('es-MX', { hour12: false })}
              </span>
              <span>
                <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 2, background: '#EBF5FB', color: 'var(--color-primary)', border: '1px solid #AED6F1' }}>
                  {e.etapa || '—'}
                </span>
              </span>
              <span title={e.epc}>
                <span style={{ fontSize: 12, fontWeight: 500 }}>{e.sku || ''}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--color-text-muted)', marginLeft: 4 }}>{epcCorto(e.epc)}</span>
              </span>
              <span style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>
                {e.pedido_id || '—'}
              </span>
              <span style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>
                {e.tienda_nombre || e.tienda_id || e.tag?.tienda?.nombre || '—'}
              </span>
              <span>
                <span style={{
                  fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 2,
                  background: e.es_duplicado ? 'var(--color-error-bg)' : 'var(--color-ok-bg)',
                  color: e.es_duplicado ? 'var(--color-error)' : 'var(--color-ok)',
                  border: `1px solid ${e.es_duplicado ? 'var(--color-error)' : 'var(--color-ok)'}`,
                }}>
                  {e.es_duplicado ? 'ERR' : 'OK'}
                </span>
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Panel derecho */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        <div style={panelStyle}>
          <div style={seccionTituloStyle}>Contadores del turno</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: 'var(--color-border)' }}>
            {statCards.map((s, i) => (
              <div key={i} style={{ background: 'var(--bg-panel)', padding: '14px 16px', borderLeft: `3px solid ${s.color}` }}>
                <div style={{ fontSize: 26, fontWeight: 600, color: s.color, lineHeight: 1 }}>{s.valor}</div>
                <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={panelStyle}>
          <div style={seccionTituloStyle}>Anomalias recientes</div>
          <div style={{ padding: '8px 12px' }}>
            {anomalias.length === 0 ? (
              <div style={{ padding: '16px 4px', fontSize: 13, color: 'var(--color-text-muted)', textAlign: 'center' }}>
                Sin anomalias recientes
              </div>
            ) : (
              anomalias.map((a, i) => (
                <div key={a._key || a.id || i} style={{
                  padding: '10px 12px', marginBottom: 6,
                  background: 'var(--color-error-bg)',
                  borderLeft: '3px solid var(--color-error)',
                  borderRadius: 2,
                }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-error)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>
                    {a.tipo_error || a.tipo}
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 2 }}>
                    {epcCorto(a.epc) || 'EPC desconocido'}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--color-text-muted)' }}>
                    <span>{a.etapa || a.bahia}</span>
                    <span>{a.timestamp ? haceCuanto(a.timestamp) : ''}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
