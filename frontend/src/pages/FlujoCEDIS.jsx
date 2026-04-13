import { useState, useEffect, useCallback, useRef } from 'react';
import { socket } from '../socket/socketClient';
import { api }    from '../api/rfidApi';

// ─── Constantes ─────────────────────────────────────────────────────────────

const ETAPAS_FLUJO = [
  { id:'PREREGISTRO', label:'Pre-reg',   short:'PRE'  },
  { id:'QA',          label:'QA',        short:'QA'   },
  { id:'REGISTRO',    label:'Registro',  short:'REG'  },
  { id:'SORTER',      label:'Sorter',    short:'SORT' },
  { id:'BAHIA',       label:'Bahías',    short:'BAH'  },
  { id:'AUDITORIA',   label:'Auditoría', short:'AUD'  },
  { id:'ENVIO',       label:'Envío',     short:'ENV'  },
];

const ETAPA_IDX = Object.fromEntries(ETAPAS_FLUJO.map((e,i) => [e.id, i]));

const ETAPA_COLORS = {
  PREREGISTRO:'#2563EB', QA:'#059669', REGISTRO:'#D97706',
  SORTER:'#7C3AED', BAHIA:'#0891B2', AUDITORIA:'#DB2777', ENVIO:'#16A34A',
};

const ZONA_COLORS = {
  BAHIA:     { main:'var(--ds-zona-bahia)',     bg:'var(--ds-zona-bahia-bg)',     border:'var(--ds-zona-bahia-border)'     },
  AUDITORIA: { main:'var(--ds-zona-auditoria)', bg:'var(--ds-zona-auditoria-bg)', border:'var(--ds-zona-auditoria-border)' },
  ENVIO:     { main:'var(--ds-zona-envio)',     bg:'var(--ds-zona-envio-bg)',     border:'var(--ds-zona-envio-border)'     },
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function Dot({ estado = 'gris', size = 12 }) {
  const cfg = {
    verde:    { bg:'var(--ds-verde)',    shadow:`0 0 0 ${Math.round(size*.3)}px var(--ds-verde-halo)`,    anim:'none' },
    amarillo: { bg:'var(--ds-amarillo)', shadow:`0 0 0 ${Math.round(size*.3)}px var(--ds-amarillo-halo)`, anim:'none' },
    rojo:     { bg:'var(--ds-rojo)',     shadow:`0 0 0 ${Math.round(size*.3)}px var(--ds-rojo-halo)`,     anim:'ds-pulso-rojo 1.4s ease-in-out infinite' },
    gris:     { bg:'var(--ds-gris-dot)', shadow:'none', anim:'none' },
  }[estado] || { bg:'var(--ds-gris-dot)', shadow:'none', anim:'none' };
  return <div style={{ width:size, height:size, borderRadius:'50%', background:cfg.bg, boxShadow:cfg.shadow, animation:cfg.anim, flexShrink:0 }} />;
}

function BarraProgreso({ pct, color='var(--ds-primary)', height=4 }) {
  return <div style={{ height, background:'var(--ds-border-light)', borderRadius:height, overflow:'hidden' }}><div style={{ width:`${Math.min(100,Math.round(pct||0))}%`, height:'100%', background:color, borderRadius:height, transition:'width .5s ease' }} /></div>;
}

// ─── buildOC ────────────────────────────────────────────────────────────────

const ORDEN_ETAPAS = ['PREREGISTRO','QA','REGISTRO','SORTER','BAHIA','AUDITORIA','ENVIO','COMPLETADO'];

function buildOC(palet) {
  const tags = palet.tags || [];
  const tagsPorEtapa = {};
  ORDEN_ETAPAS.forEach(e => { tagsPorEtapa[e] = []; });
  tags.forEach(t => { const e = t.etapa_actual || 'PREREGISTRO'; if (tagsPorEtapa[e]) tagsPorEtapa[e].push(t); });
  const etapasActivas = ETAPAS_FLUJO.map(e => e.id).filter(e => tagsPorEtapa[e]?.length > 0);
  const idxMin = etapasActivas.length > 0 ? Math.min(...etapasActivas.map(e => ETAPA_IDX[e] ?? 99)) : 0;
  const idxMax = etapasActivas.length > 0 ? Math.max(...etapasActivas.map(e => ETAPA_IDX[e] ?? 0)) : 0;
  const completados = tags.filter(t => ['ENVIO','COMPLETADO'].includes(t.etapa_actual)).length;
  const pct = tags.length > 0 ? (completados / tags.length) * 100 : 0;
  const hasErr = tags.some(t => t.qa_fallido === true);
  return {
    ordenId: palet.palet_id,
    nombre: palet.nombre_producto || palet.orden?.nombre_producto || palet.orden?.modelo || palet.palet_id,
    proveedor: palet.pedido?.proveedor?.nombre || '',
    totalPrepacks: tags.length, pct, hasErr, tags, tagsPorEtapa, etapasActivas, idxMin, idxMax,
  };
}

// ─── BarraOC (fila del Gantt) ───────────────────────────────────────────────

function BarraOC({ oc, columnWidths, onClickSegmento, panelKey }) {
  return (
    <div style={{ display:'grid', gridTemplateColumns:columnWidths, width:'100%', minHeight:40, alignItems:'center', borderBottom:'1px solid var(--ds-border-light)', position:'relative' }}>
      <div style={{ gridColumn:'1 / 2', paddingLeft:12, paddingRight:8, display:'flex', flexDirection:'column', gap:1, position:'sticky', left:0, background:'var(--ds-bg-surface)', zIndex:2, borderRight:'1px solid var(--ds-border-light)', minHeight:40, justifyContent:'center' }}>
        <div style={{ fontSize:11, fontWeight:600, color:'var(--ds-text-primary)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', maxWidth:160 }}>{oc.nombre}</div>
        <div style={{ fontSize:9, color:'var(--ds-text-disabled)', fontFamily:'monospace' }}>{oc.totalPrepacks} prep. · {Math.round(oc.pct)}%</div>
      </div>
      {ETAPAS_FLUJO.map((etapa, idx) => {
        const tagsEnEtapa = oc.tagsPorEtapa[etapa.id] || [];
        const tienePrep = tagsEnEtapa.length > 0;
        const key = `${oc.ordenId}-${etapa.id}`;
        const activa = panelKey === key;
        const errEnEtapa = tagsEnEtapa.some(t => t.qa_fallido === true);
        const enRango = idx >= oc.idxMin && idx <= oc.idxMax;
        const color = ETAPA_COLORS[etapa.id] || '#94A3B8';
        const bgActivo = tienePrep ? (errEnEtapa ? 'var(--ds-rojo-bg)' : `${color}18`) : enRango ? '#F1F5F9' : 'transparent';
        return (
          <div key={etapa.id} onClick={tienePrep ? () => onClickSegmento(key, oc, etapa, tagsEnEtapa) : undefined} style={{
            height:36, margin:'2px 1px', borderRadius:6,
            background: activa ? `${color}30` : bgActivo,
            border: activa ? `2px solid ${color}` : tienePrep ? `1.5px solid ${errEnEtapa ? 'var(--ds-rojo-border)' : `${color}44`}` : enRango ? '1px dashed var(--ds-border-light)' : 'none',
            cursor: tienePrep ? 'pointer' : 'default',
            display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:1,
            transition:'all .15s', position:'relative', overflow:'hidden',
          }}>
            {tienePrep && <>
              <div style={{ position:'absolute', bottom:0, left:0, right:0, height:`${Math.min(100, (tagsEnEtapa.length / oc.totalPrepacks) * 100 * 3)}%`, background:`${color}22`, borderRadius:'0 0 6px 6px' }} />
              <div style={{ fontSize:11, fontWeight:800, color, lineHeight:1, zIndex:1 }}>{tagsEnEtapa.length}</div>
              <div style={{ fontSize:7, color, fontWeight:600, textTransform:'uppercase', letterSpacing:'.3px', zIndex:1 }}>prep.</div>
              {errEnEtapa && <div style={{ position:'absolute', top:3, right:4, width:6, height:6, borderRadius:'50%', background:'var(--ds-rojo)', animation:'ds-pulso-rojo 1.4s ease-in-out infinite' }} />}
            </>}
            {enRango && !tienePrep && <div style={{ width:20, height:2, background:'var(--ds-border-medium)', borderRadius:2 }} />}
          </div>
        );
      })}
    </div>
  );
}

// ─── PanelSegmento ──────────────────────────────────────────────────────────

function PanelSegmento({ data, onClose, onAbrirOC }) {
  if (!data) return null;
  const { oc, etapa, tags } = data;
  const color = ETAPA_COLORS[etapa.id] || '#94A3B8';
  return (
    <div style={{ marginTop:14, background:'var(--ds-bg-surface)', border:`1.5px solid ${color}`, borderRadius:'var(--ds-radius-lg)', padding:'14px 18px', boxShadow:'var(--ds-shadow-panel)', animation:'ds-entrada-panel .2s ease' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
        <div>
          <div style={{ fontSize:9, fontWeight:700, color, textTransform:'uppercase', letterSpacing:'.5px', marginBottom:3 }}>{etapa.label} — {oc.nombre}</div>
          <div style={{ fontSize:13, fontWeight:700, color:'var(--ds-text-primary)' }}>{tags.length} prepack{tags.length !== 1 ? 's' : ''} en esta etapa</div>
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <button onClick={() => onAbrirOC && onAbrirOC(oc.ordenId)} style={{ background:'var(--ds-primary)', color:'#fff', border:'none', borderRadius:6, padding:'6px 14px', fontSize:11, fontWeight:600, cursor:'pointer' }}>Ver OC completa</button>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--ds-text-disabled)', fontSize:22, lineHeight:1 }}>×</button>
        </div>
      </div>
      <div style={{ overflowX:'auto' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11 }}>
          <thead><tr style={{ background:'var(--ds-bg-surface-2)' }}>
            {['Producto','Tienda','Bahía','Estado'].map(h => <th key={h} style={{ padding:'6px 10px', textAlign:'left', fontSize:9, fontWeight:700, color:'var(--ds-text-disabled)', textTransform:'uppercase', letterSpacing:'.4px', borderBottom:'1px solid var(--ds-border-light)' }}>{h}</th>)}
          </tr></thead>
          <tbody>{tags.map(tag => {
            const errTag = tag.qa_fallido === true;
            return (
              <tr key={tag.epc} style={{ borderBottom:'1px solid var(--ds-border-light)', background: errTag ? 'var(--ds-rojo-bg)' : 'transparent' }}>
                <td style={{ padding:'7px 10px', fontWeight:500 }}>{tag.color} {tag.talla}</td>
                <td style={{ padding:'7px 10px', color:'var(--ds-text-secondary)' }}><div>{tag.tienda?.nombre || '—'}</div>{tag.tienda?.ciudad && <div style={{ fontSize:9, color:'var(--ds-text-disabled)' }}>{tag.tienda.ciudad}</div>}</td>
                <td style={{ padding:'7px 10px', color:'var(--ds-text-muted)', fontSize:10 }}>{tag.tienda?.bahia_asignada || '—'}</td>
                <td style={{ padding:'7px 10px' }}>{errTag ? <span style={{ fontSize:9, fontWeight:700, padding:'2px 7px', borderRadius:4, background:'var(--ds-rojo-bg)', color:'var(--ds-rojo-text)' }}>QA Falló</span> : <span style={{ fontSize:9, fontWeight:700, padding:'2px 7px', borderRadius:4, background:'var(--ds-verde-bg)', color:'var(--ds-verde-text)' }}>OK</span>}</td>
              </tr>
            );
          })}</tbody>
        </table>
      </div>
    </div>
  );
}

// ─── BarraKPI ───────────────────────────────────────────────────────────────

function BarraKPI({ kpi, pausado, onTogglePausa }) {
  const mejora = kpi?.mejora_porcentaje ?? null;
  const metaOk = mejora !== null && mejora >= (kpi?.objetivo_mejora_pct || 32);
  const semM = mejora === null ? 'gris' : metaOk ? 'verde' : mejora >= 20 ? 'amarillo' : 'rojo';
  const kc = {
    verde:    { bg:'var(--ds-verde-bg)',    border:'var(--ds-verde-border)',    text:'var(--ds-verde-text)' },
    amarillo: { bg:'var(--ds-amarillo-bg)', border:'var(--ds-amarillo-border)', text:'var(--ds-amarillo-text)' },
    rojo:     { bg:'var(--ds-rojo-bg)',     border:'var(--ds-rojo-border)',     text:'var(--ds-rojo-text)' },
    gris:     { bg:'#F8FAFC', border:'var(--ds-border-light)', text:'#94A3B8' },
  }[semM];
  return (
    <div style={{ display:'flex', alignItems:'center', gap:0, background:'#fff', border:'1px solid var(--ds-border-light)', borderRadius:12, padding:'0 20px', height:62, marginBottom:16, overflowX:'auto', boxShadow:'var(--ds-shadow-sm)', flexShrink:0 }}>
      <div style={{ display:'flex', alignItems:'center', gap:12, padding:'8px 16px', borderRadius:10, marginRight:20, flexShrink:0, background:kc.bg, border:`1.5px solid ${kc.border}` }}>
        <Dot estado={semM} size={14} />
        <div>
          <div style={{ fontSize:9, fontWeight:700, color:kc.text, textTransform:'uppercase', letterSpacing:'.6px', marginBottom:2 }}>Mejora vs manual · meta: {kpi?.objetivo_mejora_pct || 32}%</div>
          <div style={{ fontSize:24, fontWeight:800, color:kc.text, lineHeight:1 }}>{mejora !== null ? `${mejora.toFixed(1)}%` : '—'}{metaOk && <span style={{ fontSize:11, marginLeft:8, fontWeight:600 }}>✓ Meta cumplida</span>}</div>
        </div>
      </div>
      <div style={{ width:1, height:34, background:'var(--ds-border-light)', marginRight:20, flexShrink:0 }} />
      {[
        { label:'Ciclo promedio', value:kpi?.tiempo_promedio_hoy_min ? `${Math.floor(kpi.tiempo_promedio_hoy_min/60)}h ${kpi.tiempo_promedio_hoy_min%60}min` : '—', color:'var(--ds-text-primary)' },
        { label:'OCs activas', value:kpi?.palets_activos ?? '—', color:'var(--ds-text-primary)' },
        { label:'Completadas hoy', value:kpi?.palets_completados_hoy ?? '—', color:'var(--ds-verde-text)' },
      ].map((s,i) => (
        <div key={i} style={{ marginRight:24, flexShrink:0 }}>
          <div style={{ fontSize:20, fontWeight:800, color:s.color, lineHeight:1 }}>{s.value}</div>
          <div style={{ fontSize:9, color:'#94A3B8', fontWeight:700, textTransform:'uppercase', letterSpacing:'.5px', marginTop:2 }}>{s.label}</div>
        </div>
      ))}
      <div style={{ marginLeft:'auto', flexShrink:0 }}>
        <button onClick={onTogglePausa} style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 16px', borderRadius:8, border:`1.5px solid ${pausado ? 'var(--ds-verde-border)' : 'var(--ds-border-medium)'}`, background:pausado ? 'var(--ds-verde-bg)' : 'var(--ds-bg-surface-2)', color:pausado ? 'var(--ds-verde-text)' : 'var(--ds-text-muted)', fontSize:11, fontWeight:700, cursor:'pointer', transition:'all .2s ease' }}>
          <span style={{ fontSize:14 }}>{pausado ? '▶' : '⏸'}</span>
          {pausado ? 'Reanudar' : 'Pausar'}
          {pausado && <span style={{ fontSize:9, fontWeight:600, color:'var(--ds-verde)', marginLeft:2 }}>· datos congelados</span>}
        </button>
      </div>
    </div>
  );
}

// ─── Celdas bahías ──────────────────────────────────────────────────────────

function CeldaPill({ bahia, n, hasErr, activa, onClick, isDetalle, ocs }) {
  const vacia = n === 0;
  const sem = n === 0 ? 'gris' : hasErr ? 'rojo' : 'verde';
  return (
    <div className={!vacia ? 'ds-celda-hover' : ''} onClick={!vacia ? onClick : undefined} style={{
      width:isDetalle?90:76, minHeight:isDetalle?80:68, borderRadius:'999px',
      border: activa ? '2.5px solid var(--ds-primary)' : `2px solid ${vacia ? 'var(--ds-gris-border)' : hasErr ? 'var(--ds-rojo-border)' : 'var(--ds-border-light)'}`,
      background: activa ? 'var(--ds-primary-light)' : vacia ? 'var(--ds-gris-bg)' : hasErr ? 'var(--ds-rojo-bg)' : '#fff',
      display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'8px 4px', flexShrink:0,
      boxShadow:activa ? 'var(--ds-shadow-panel)' : 'var(--ds-shadow-xs)', transition:'all .15s',
    }}>
      <div style={{ fontSize:7, fontWeight:700, color:'var(--ds-text-disabled)', textTransform:'uppercase', letterSpacing:'.3px', marginBottom:3 }}>B-{bahia}</div>
      {!isDetalle ? <>
        <Dot estado={sem} size={9} />
        <div style={{ fontSize:22, fontWeight:800, color:vacia?'var(--ds-text-disabled)':'var(--ds-text-primary)', lineHeight:1, marginTop:3 }}>{n}</div>
        <div style={{ fontSize:7, color:'var(--ds-text-disabled)', marginTop:1 }}>OCs</div>
      </> : <div style={{ width:'100%', textAlign:'center' }}>
        <div style={{ fontSize:18, fontWeight:800, color:vacia?'var(--ds-text-disabled)':'var(--ds-text-primary)', lineHeight:1 }}>{n}</div>
        <div style={{ fontSize:7, color:'var(--ds-text-disabled)', marginBottom:3 }}>OCs</div>
        {n>0&&<div style={{ fontSize:9, color:'var(--ds-text-muted)' }}>{ocs.reduce((s,o)=>s+(o.totalPrepacks||0),0)} prep.</div>}
        {hasErr&&<div style={{ fontSize:8, fontWeight:700, color:'var(--ds-rojo-text)', marginTop:2 }}>{ocs.filter(o=>o.hasErr).length} err</div>}
      </div>}
    </div>
  );
}

function CeldaRect({ bahia, n, hasErr, activa, onClick, isDetalle, ocs, tipo }) {
  const vacia = n === 0;
  const sem = n === 0 ? 'gris' : hasErr ? 'rojo' : 'verde';
  const zona = ZONA_COLORS[tipo === 'aud' ? 'AUDITORIA' : 'ENVIO'];
  const hoverClass = tipo === 'aud' ? 'ds-rect-aud' : 'ds-rect-env';
  return (
    <div className={!vacia ? hoverClass : ''} onClick={!vacia ? onClick : undefined} style={{
      width:isDetalle?90:76, minHeight:isDetalle?60:52, borderRadius:'var(--ds-radius-md)',
      border: activa ? '2px solid var(--ds-primary)' : `1.5px solid ${vacia ? 'var(--ds-gris-border)' : hasErr ? 'var(--ds-rojo-border)' : zona.border}`,
      background: activa ? 'var(--ds-primary-light)' : vacia ? 'var(--ds-gris-bg)' : hasErr ? 'var(--ds-rojo-bg)' : '#fff',
      display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'6px 4px', flexShrink:0,
      boxShadow:'var(--ds-shadow-xs)', transition:'all .15s',
    }}>
      {!isDetalle ? <>
        <Dot estado={sem} size={8} />
        <div style={{ fontSize:18, fontWeight:800, color:vacia?'var(--ds-text-disabled)':'var(--ds-text-primary)', lineHeight:1, marginTop:3 }}>{n}</div>
        <div style={{ fontSize:7, color:'var(--ds-text-disabled)' }}>OCs</div>
      </> : <div style={{ textAlign:'center' }}>
        <div style={{ fontSize:16, fontWeight:800, color:vacia?'var(--ds-text-disabled)':'var(--ds-text-primary)', lineHeight:1 }}>{n}</div>
        <div style={{ fontSize:7, color:'var(--ds-text-disabled)', marginBottom:2 }}>OCs</div>
        {n>0&&<div style={{ fontSize:8, color:'var(--ds-text-muted)' }}>{ocs.reduce((s,o)=>s+(o.totalPrepacks||0),0)} prep.</div>}
        {hasErr&&<div style={{ fontSize:7, fontWeight:700, color:'var(--ds-rojo-text)', marginTop:1 }}>{ocs.filter(o=>o.hasErr).length} err</div>}
      </div>}
    </div>
  );
}

// ─── PanelBahia ─────────────────────────────────────────────────────────────

function PanelBahia({ titulo, ocs, onClose, onAbrirOC }) {
  if (!ocs || ocs.length === 0) return null;
  return (
    <div style={{ marginTop:14, background:'var(--ds-bg-surface)', border:'1.5px solid var(--ds-primary)', borderRadius:'var(--ds-radius-lg)', padding:'14px 18px', boxShadow:'var(--ds-shadow-panel)', animation:'ds-entrada-panel .2s ease' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
        <div>
          <div style={{ fontSize:14, fontWeight:700, color:'var(--ds-text-primary)' }}>{titulo}</div>
          <div style={{ fontSize:11, color:'var(--ds-text-muted)', marginTop:2 }}>{ocs.length} orden{ocs.length!==1?'es':''} de compra</div>
        </div>
        <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--ds-text-disabled)', fontSize:22, lineHeight:1 }}>×</button>
      </div>
      <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
        {ocs.map(oc => (
          <div key={oc.ordenId} className="ds-card-hover" onClick={() => onAbrirOC && onAbrirOC(oc.ordenId)} style={{
            border:`1px solid ${oc.hasErr?'var(--ds-rojo-border)':'var(--ds-border-light)'}`,
            borderLeft:`4px solid ${oc.hasErr?'var(--ds-rojo)':'var(--ds-primary)'}`,
            borderRadius:'var(--ds-radius-md)', padding:'10px 14px',
            background:oc.hasErr?'var(--ds-rojo-bg)':'var(--ds-bg-surface-2)',
            minWidth:180, flex:1, cursor:'pointer',
          }}>
            <div style={{ fontSize:12, fontWeight:600, color:'var(--ds-text-primary)', marginBottom:2 }}>{oc.nombre}</div>
            <div style={{ fontSize:9, color:'var(--ds-text-disabled)', fontFamily:'monospace', marginBottom:6 }}>{oc.ordenId} · {oc.totalPrepacks} prepacks</div>
            <BarraProgreso pct={oc.pct} color={oc.hasErr?'var(--ds-rojo)':'var(--ds-primary)'} height={4} />
            <div style={{ fontSize:9, color:'var(--ds-text-muted)', marginTop:3 }}>{Math.round(oc.pct)}% procesado</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── COMPONENTE PRINCIPAL ───────────────────────────────────────────────────

export default function FlujoCEDIS({ onAbrirOC }) {
  const [ordenesFull, setOrdenesFull] = useState([]);
  const [kpi, setKpi] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [pausado, setPausado] = useState(false);
  const [modo, setModo] = useState(() => localStorage.getItem('rfid_modo') || 'compacto');
  const [panelSeg, setPanelSeg] = useState(null);
  const [panelBahia, setPanelBahia] = useState(null);
  const pausadoRef = useRef(false);
  pausadoRef.current = pausado;

  const cargarDatos = useCallback(async () => {
    if (pausadoRef.current) return;
    try {
      const [pedidos, kpiData] = await Promise.allSettled([api.getPedidos(), api.getKpiCiclo()]);
      const peds = pedidos.status === 'fulfilled' ? pedidos.value || [] : [];
      const paletIds = []; const seen = new Set();
      peds.forEach(ped => (ped.palets || []).forEach(p => { if (!seen.has(p.palet_id)) { seen.add(p.palet_id); paletIds.push(p.palet_id); } }));
      const detalles = await Promise.all(paletIds.map(id => api.getPalet(id).catch(() => null)));
      setOrdenesFull(detalles.filter(Boolean));
      if (kpiData.status === 'fulfilled') setKpi(kpiData.value);
      setCargando(false);
    } catch (err) { console.error(err); setCargando(false); }
  }, []);

  useEffect(() => { cargarDatos(); const iv = setInterval(cargarDatos, 8000); return () => clearInterval(iv); }, [cargarDatos]);
  useEffect(() => { const h = () => { if (!pausadoRef.current) cargarDatos(); }; socket.on('lectura', h); return () => socket.off('lectura', h); }, [cargarDatos]);

  function togglePausa() { setPausado(prev => { const n = !prev; if (!n) setTimeout(() => cargarDatos(), 100); return n; }); }
  function cambiarModo(m) { setModo(m); localStorage.setItem('rfid_modo', m); }

  const ocs = ordenesFull.map(buildOC).filter(oc => oc.etapasActivas.length > 0);
  function ocsEnBahiaYEtapa(numBahia, etapa) {
    const bahiaId = `BAHIA-${numBahia}`;
    return ocs.filter(oc => (oc.tagsPorEtapa[etapa] || []).some(t => t.tienda?.bahia_asignada === bahiaId || t.bahia === bahiaId));
  }
  const isDetalle = modo === 'detalle';
  const GANTT_COLS = `200px repeat(${ETAPAS_FLUJO.length}, 1fr)`;

  return (
    <div style={{ fontFamily:'IBM Plex Sans, sans-serif' }}>
      <BarraKPI kpi={kpi} pausado={pausado} onTogglePausa={togglePausa} />
      <div style={{ background:'var(--ds-bg-surface)', border:'1px solid var(--ds-border-light)', borderRadius:12, padding:'18px 22px', boxShadow:'var(--ds-shadow-sm)' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18, flexWrap:'wrap', gap:10 }}>
          <div style={{ fontSize:9, fontWeight:700, color:'var(--ds-text-disabled)', textTransform:'uppercase', letterSpacing:'.6px', display:'flex', alignItems:'center', gap:8 }}>
            Flujo del CEDIS
            {pausado && <span style={{ background:'var(--ds-verde-bg)', color:'var(--ds-verde-text)', padding:'2px 8px', borderRadius:4, fontSize:9, fontWeight:700 }}>⏸ Pausado</span>}
            {!cargando && <span style={{ fontWeight:400, color:'var(--ds-text-disabled)' }}>— {ocs.length} OCs activas</span>}
          </div>
          <div style={{ display:'flex', background:'var(--ds-bg-surface-2)', border:'1px solid var(--ds-border-light)', borderRadius:8, overflow:'hidden' }}>
            {[{ id:'compacto', label:'Compacto' },{ id:'detalle', label:'Detalle' }].map(m => (
              <button key={m.id} onClick={() => cambiarModo(m.id)} style={{ padding:'5px 14px', border:'none', cursor:'pointer', fontSize:11, fontWeight:600, background:modo===m.id?'var(--ds-primary)':'transparent', color:modo===m.id?'#fff':'#475569', transition:'all .15s' }}>{m.label}</button>
            ))}
          </div>
        </div>

        {cargando ? <div style={{ padding:40, textAlign:'center', color:'var(--ds-text-disabled)', fontSize:13 }}>Cargando datos del CEDIS...</div>
        : ocs.length === 0 ? <div style={{ padding:40, textAlign:'center', color:'var(--ds-text-disabled)', fontSize:13 }}>Sin órdenes de compra activas</div>
        : <>
          {/* GANTT */}
          <div style={{ overflowX:'auto', marginBottom:20 }}>
            <div style={{ minWidth:800 }}>
              <div style={{ display:'grid', gridTemplateColumns:GANTT_COLS, marginBottom:4 }}>
                <div style={{ paddingLeft:12, paddingBottom:6, borderBottom:'2px solid var(--ds-border-light)' }}><span style={{ fontSize:9, fontWeight:700, color:'var(--ds-text-disabled)', textTransform:'uppercase', letterSpacing:'.4px' }}>Orden de compra</span></div>
                {ETAPAS_FLUJO.map(etapa => <div key={etapa.id} style={{ textAlign:'center', paddingBottom:6, borderBottom:`2px solid ${ETAPA_COLORS[etapa.id]}` }}><div style={{ fontSize:9, fontWeight:700, color:ETAPA_COLORS[etapa.id], textTransform:'uppercase', letterSpacing:'.3px' }}>{etapa.short}</div></div>)}
              </div>
              {ocs.map(oc => <BarraOC key={oc.ordenId} oc={oc} columnWidths={GANTT_COLS} onClickSegmento={(key,oc,etapa,tags) => { setPanelSeg(panelSeg?.key===key?null:{key,oc,etapa,tags}); setPanelBahia(null); }} panelKey={panelSeg?.key} />)}
            </div>
          </div>
          {panelSeg && <PanelSegmento data={panelSeg} onClose={() => setPanelSeg(null)} onAbrirOC={onAbrirOC} />}

          {/* BAHÍAS */}
          <div style={{ borderTop:'1px solid var(--ds-border-light)', paddingTop:18, marginTop:8 }}>
            <div style={{ fontSize:9, fontWeight:700, color:'var(--ds-text-disabled)', textTransform:'uppercase', letterSpacing:'.6px', marginBottom:12 }}>Estado por bahía</div>
            {[{ label:'Bahías', color:'var(--ds-zona-bahia)', etapa:'BAHIA' }, { label:'Auditoría', color:'var(--ds-zona-auditoria)', etapa:'AUDITORIA' }, { label:'Envío', color:'var(--ds-zona-envio)', etapa:'ENVIO' }].map(fila => (
              <div key={fila.label} style={{ display:'flex', alignItems:'center', gap:0, marginBottom:8 }}>
                <div style={{ width:80, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'flex-end', paddingRight:12 }}><span style={{ fontSize:9, fontWeight:700, color:fila.color, textTransform:'uppercase', letterSpacing:'.4px' }}>{fila.label}</span></div>
                <div style={{ display:'flex', gap:5, overflowX:'auto' }}>
                  {Array.from({ length:10 }, (_,i) => { const n=i+1; const ocsB=ocsEnBahiaYEtapa(n,fila.etapa); const err=ocsB.some(o=>o.hasErr); const key=`${fila.etapa}-B${n}`; const activa=panelBahia?.key===key;
                    if (fila.etapa==='BAHIA') return <CeldaPill key={n} bahia={n} n={ocsB.length} hasErr={err} activa={activa} onClick={() => { setPanelBahia(activa?null:{key,titulo:`Bahía ${n}`,ocs:ocsB}); setPanelSeg(null); }} isDetalle={isDetalle} ocs={ocsB} />;
                    return <CeldaRect key={n} bahia={n} tipo={fila.etapa==='AUDITORIA'?'aud':'env'} n={ocsB.length} hasErr={err} activa={activa} onClick={() => { setPanelBahia(activa?null:{key,titulo:`${fila.label} — Bahía ${n}`,ocs:ocsB}); setPanelSeg(null); }} isDetalle={isDetalle} ocs={ocsB} />;
                  })}
                </div>
              </div>
            ))}
            {panelBahia && <PanelBahia titulo={panelBahia.titulo} ocs={panelBahia.ocs} onClose={() => setPanelBahia(null)} onAbrirOC={onAbrirOC} />}
          </div>
        </>}
      </div>
    </div>
  );
}
