import { useState, useEffect } from 'react';
import { api } from '../api/rfidApi';

const ETAPAS_ORDEN = ['PREREGISTRO', 'QA', 'REGISTRO', 'SORTER', 'BAHIA', 'AUDITORIA', 'ENVIO'];
const ETAPA_LABELS = { PREREGISTRO:'Preregistro', QA:'QA', REGISTRO:'Registro', SORTER:'Sorter', BAHIA:'Bahia', AUDITORIA:'Auditoria', ENVIO:'Envio' };
const ETAPA_COLORS = { PREREGISTRO:'#2471A3', QA:'#1E8449', REGISTRO:'#7D6608', SORTER:'#6C3483', BAHIA:'#BA4A00', AUDITORIA:'#1C2B3A', ENVIO:'#1E8449' };

const ETAPA_CONFIG = {
  EN_TRANSITO:{ label:'En Transito', color:'#566573', bg:'#F2F3F4' },
  PREREGISTRO:{ label:'Preregistro', color:'var(--etapa-preregistro)', bg:'var(--etapa-preregistro-bg)' },
  QA:{ label:'QA', color:'var(--etapa-qa)', bg:'var(--etapa-qa-bg)' },
  REGISTRO:{ label:'Registro', color:'var(--etapa-registro)', bg:'var(--etapa-registro-bg)' },
  SORTER:{ label:'Sorter', color:'var(--etapa-sorter)', bg:'var(--etapa-sorter-bg)' },
  BAHIA:{ label:'Bahia', color:'var(--etapa-bahia)', bg:'var(--etapa-bahia-bg)' },
  AUDITORIA:{ label:'Auditoria', color:'var(--etapa-auditoria)', bg:'var(--etapa-auditoria-bg)' },
  ENVIO:{ label:'Envio', color:'var(--etapa-envio)', bg:'var(--etapa-envio-bg)' },
  COMPLETADO:{ label:'Completado', color:'var(--color-ok)', bg:'var(--color-ok-bg)' },
};

function Badge({ value, config }) {
  const cfg = config[value] || { label: value, color: '#566573', bg: '#F2F3F4' };
  return <span style={{ padding:'2px 8px', borderRadius:3, fontSize:11, fontWeight:600, color:cfg.color, background:cfg.bg }}>{cfg.label}</span>;
}

function formatHora(ts) { return ts ? new Date(ts).toLocaleTimeString('es-MX',{hour:'2-digit',minute:'2-digit',hour12:false}) : '—'; }
function formatDuracion(min) { return min >= 60 ? `${Math.floor(min/60)}h ${min%60}min` : `${min}min`; }

// ─── Header ─────────────────────────────────────────────────────────────────

function HeaderCargamento({ palet, tags, etapaLogs }) {
  const tieneAnomalias = etapaLogs.some(l => l.tiene_anomalia);
  const completado = etapaLogs.length === 7 && etapaLogs.every(l => l.timestamp_salida);
  const fallidos = tags.filter(t => t.qa_fallido).length;

  let statusBadge;
  if (!tieneAnomalias && completado && fallidos === 0) statusBadge = { label:'Todo OK', color:'#1E8449', bg:'#EAFAF1' };
  else if (completado) statusBadge = { label:'Completado con observaciones', color:'#B7770D', bg:'#FEF9E7' };
  else if (tieneAnomalias || fallidos > 0) statusBadge = { label:'Requiere atencion', color:'#922B21', bg:'#FDEDEC' };
  else statusBadge = { label:'En proceso', color:'#2471A3', bg:'#EBF5FB' };

  const nombre = palet.nombre_producto || palet.orden?.nombre_producto || palet.orden?.modelo || palet.palet_id;
  const ciclo = palet.tiempo_ciclo_min;

  return (
    <div style={{ background:'var(--bg-panel)', border:'1px solid var(--color-border)', borderRadius:4, padding:'20px 24px', marginBottom:16 }}>
      <div style={{ display:'flex', gap:20, alignItems:'flex-start' }}>
        <div style={{ width:80, height:80, borderRadius:6, flexShrink:0, background:'linear-gradient(135deg,#EBF5FB,#D6EAF8)', display:'flex', alignItems:'center', justifyContent:'center', border:'1px solid var(--color-border)' }}>
          {palet.orden?.foto_url
            ? <img src={palet.orden.foto_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:6 }} />
            : <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#2980B9" strokeWidth="1.5"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
          }
        </div>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:18, fontWeight:700, marginBottom:4 }}>{nombre}</div>
          <div style={{ fontSize:12, color:'var(--color-text-muted)', marginBottom:6 }}>{palet.palet_id} · {palet.orden?.orden_id || ''} · {palet.pedido?.proveedor?.nombre || ''}</div>
          <div style={{ display:'flex', gap:12, alignItems:'center', flexWrap:'wrap' }}>
            <span style={{ padding:'4px 12px', borderRadius:4, fontSize:12, fontWeight:600, color:statusBadge.color, background:statusBadge.bg }}>{statusBadge.label}</span>
            <span style={{ fontSize:13, fontWeight:600 }}>{tags.filter(t=>!t.qa_fallido).length} prepacks</span>
            {ciclo && <span style={{ fontSize:12, color:'var(--color-text-muted)' }}>Ciclo: {formatDuracion(ciclo)}</span>}
            {fallidos > 0 && <span style={{ fontSize:11, color:'var(--color-error)', fontWeight:600 }}>{fallidos} rechazado{fallidos>1?'s':''} en QA</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Timeline ───────────────────────────────────────────────────────────────

function HistorialTimeline({ etapaLogs }) {
  const getLog = (etapa) => etapaLogs.find(l => l.etapa === etapa);
  return (
    <div style={{ background:'var(--bg-panel)', border:'1px solid var(--color-border)', borderRadius:4, padding:'20px 24px', marginBottom:16 }}>
      <div style={{ fontSize:11, fontWeight:600, color:'var(--color-text-muted)', letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:16 }}>Historial del Cargamento</div>
      <div style={{ display:'flex', alignItems:'flex-start', position:'relative' }}>
        <div style={{ position:'absolute', top:17, left:'6%', right:'6%', height:2, background:'var(--color-border)', zIndex:0 }} />
        {ETAPAS_ORDEN.map((etapa) => {
          const log = getLog(etapa);
          let icon, bgColor;
          if (!log) { icon=''; bgColor='var(--color-border)'; }
          else if (log.tiene_anomalia) { icon='!'; bgColor='var(--color-warn)'; }
          else if (log.timestamp_salida) { icon='\u2713'; bgColor='var(--color-ok)'; }
          else { icon='...'; bgColor=ETAPA_COLORS[etapa]; }
          const isSorter = etapa === 'SORTER';
          return (
            <div key={etapa} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:6, zIndex:1 }}>
              <div style={{ width:34, height:34, borderRadius:'50%', background:bgColor, display:'flex', alignItems:'center', justifyContent:'center', fontSize:log?.tiene_anomalia?14:11, fontWeight:700, color:log?'#fff':'var(--color-text-muted)', border:'3px solid #fff', boxShadow:`0 0 0 2px ${bgColor}` }}>{icon}</div>
              <div style={{ textAlign:'center' }}>
                <div style={{ fontSize:10, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.04em', color:log?'var(--color-text-primary)':'var(--color-text-muted)' }}>{ETAPA_LABELS[etapa]}</div>
                {log && <>
                  <div style={{ fontFamily:'var(--font-mono)', fontSize:9, color:'var(--color-text-muted)', marginTop:2 }}>{formatHora(log.timestamp_entrada)}{log.timestamp_salida?`-${formatHora(log.timestamp_salida)}`:' en curso'}</div>
                  <div style={{ fontSize:9, color:log.prepacks_entrada!==log.prepacks_salida && log.timestamp_salida?'var(--color-error)':'var(--color-text-muted)', marginTop:1 }}>{log.prepacks_entrada} prep{log.timestamp_salida && log.prepacks_salida!==log.prepacks_entrada?` → ${log.prepacks_salida}`:''}</div>
                  {log.notas && <div style={{ fontSize:8, color:'var(--color-warn)', marginTop:1, maxWidth:90, lineHeight:1.2 }}>{log.notas}</div>}
                </>}
                {isSorter && !log && <div style={{ fontSize:7, color:'var(--color-text-muted)', marginTop:2, maxWidth:70, lineHeight:1.1 }}>Palet se divide en prepacks</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Tabla color × talla ────────────────────────────────────────────────────

function TablaColorTalla({ tags }) {
  const tagsOk = tags.filter(t => !t.qa_fallido);
  if (tagsOk.length === 0) return null;
  const ordenTallas = ['XS','S','CH','M','G','L','XL'];
  const colores = [...new Set(tagsOk.map(t=>t.color))].sort();
  const tallas = [...new Set(tagsOk.map(t=>t.talla))].sort((a,b)=>(ordenTallas.indexOf(a)===-1?99:ordenTallas.indexOf(a))-(ordenTallas.indexOf(b)===-1?99:ordenTallas.indexOf(b)));
  const matriz = {}; colores.forEach(c=>{matriz[c]={};tallas.forEach(t=>{matriz[c][t]=0;});}); tagsOk.forEach(tag=>{if(matriz[tag.color])matriz[tag.color][tag.talla]=(matriz[tag.color][tag.talla]||0)+1;});
  const maxVal = Math.max(...colores.flatMap(c=>tallas.map(t=>matriz[c][t])));
  const fallidos = tags.filter(t=>t.qa_fallido).length;

  return (
    <div style={{ background:'var(--bg-panel)', border:'1px solid var(--color-border)', borderRadius:4, padding:'16px 20px', marginBottom:16 }}>
      <div style={{ fontSize:11, fontWeight:600, color:'var(--color-text-muted)', letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:12 }}>Resumen del Producto</div>
      <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
        <thead><tr>
          <th style={{ padding:'8px 12px', textAlign:'left', fontSize:11, fontWeight:600, color:'var(--color-text-secondary)', borderBottom:'2px solid var(--color-border)' }}></th>
          {tallas.map(t=><th key={t} style={{ padding:'8px 12px', textAlign:'center', fontSize:11, fontWeight:600, color:'var(--color-text-secondary)', borderBottom:'2px solid var(--color-border)' }}>{t}</th>)}
          <th style={{ padding:'8px 12px', textAlign:'center', fontSize:11, fontWeight:700, borderBottom:'2px solid var(--color-border)' }}>TOTAL</th>
        </tr></thead>
        <tbody>
          {colores.map(color=>{
            const total=tallas.reduce((s,t)=>s+(matriz[color][t]||0),0);
            return <tr key={color} style={{ borderBottom:'1px solid var(--color-border)' }}>
              <td style={{ padding:'8px 12px', fontWeight:500 }}>{color}</td>
              {tallas.map(t=>{const v=matriz[color][t]||0; return <td key={t} style={{ padding:'8px 12px', textAlign:'center', color:v===0?'var(--color-text-muted)':'var(--color-text-primary)', fontWeight:v>0?600:400, background:v>0&&v>=maxVal*0.75?'#f0fdf4':'transparent' }}>{v||'—'}</td>;})}
              <td style={{ padding:'8px 12px', textAlign:'center', fontWeight:700, background:'var(--ds-bg-surface-2)' }}>{total}</td>
            </tr>;
          })}
          <tr style={{ background:'var(--ds-bg-surface-2)' }}>
            <td style={{ padding:'8px 12px', fontWeight:700 }}>TOTAL</td>
            {tallas.map(t=>{const tot=colores.reduce((s,c)=>s+(matriz[c][t]||0),0); return <td key={t} style={{ padding:'8px 12px', textAlign:'center', fontWeight:700 }}>{tot}</td>;})}
            <td style={{ padding:'8px 12px', textAlign:'center', fontWeight:700, fontSize:15, color:'var(--color-primary)' }}>{tagsOk.length}</td>
          </tr>
        </tbody>
      </table>
      {fallidos > 0 && <div style={{ marginTop:10, fontSize:12, color:'var(--color-error)' }}>⚠ {fallidos} prepack{fallidos>1?'s':''} excluido{fallidos>1?'s':''} por fallo en QA</div>}
    </div>
  );
}

// ─── Mini-timeline para prepack expandido ───────────────────────────────────

function MiniTimeline({ trazabilidad }) {
  if (!trazabilidad?.timeline) return null;
  return (
    <div style={{ display:'flex', gap:4, alignItems:'center', marginTop:8 }}>
      {ETAPAS_ORDEN.map((etapa,i)=>{
        const ev = trazabilidad.timeline.find(e=>e.tipo==='LECTURA'&&e.detalle===etapa);
        const err = trazabilidad.timeline.some(e=>e.tipo==='ANOMALIA'&&e.etapa===etapa);
        let bg='var(--color-border)',txt='';
        if(ev&&err){bg='var(--color-error)';txt='!';}else if(ev){bg='var(--color-ok)';txt='\u2713';}
        return <div key={etapa} style={{ display:'flex', alignItems:'center', gap:2 }}>
          <div title={ETAPA_LABELS[etapa]} style={{ width:22, height:22, borderRadius:'50%', background:bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:700, color:ev?'#fff':'var(--color-text-muted)' }}>{txt}</div>
          {i<ETAPAS_ORDEN.length-1&&<div style={{ width:8, height:1, background:'var(--color-border)' }}/>}
        </div>;
      })}
    </div>
  );
}

// ─── QA Fallo form ──────────────────────────────────────────────────────────

function QaFalloForm({ epc, onDone }) {
  const [motivo, setMotivo] = useState('');
  const [enviando, setEnviando] = useState(false);
  const motivos = ['Prenda defectuosa','Etiqueta danada','Talla incorrecta','Producto no corresponde a la orden'];
  const handleSubmit = async () => {
    if(!motivo) return;
    setEnviando(true);
    await api.marcarQaFallo(epc, motivo);
    setEnviando(false);
    onDone();
  };
  return (
    <div style={{ marginTop:8, padding:10, background:'var(--color-error-bg)', borderRadius:4, border:'1px solid var(--color-error)' }}>
      <div style={{ fontSize:11, fontWeight:600, color:'var(--color-error)', marginBottom:6 }}>Marcar como fallido en QA</div>
      <select value={motivo} onChange={e=>setMotivo(e.target.value)} style={{ width:'100%', padding:6, fontSize:12, borderRadius:3, border:'1px solid var(--color-border)', marginBottom:6 }}>
        <option value="">Seleccionar motivo...</option>
        {motivos.map(m=><option key={m} value={m}>{m}</option>)}
      </select>
      <button onClick={handleSubmit} disabled={!motivo||enviando} style={{ padding:'4px 14px', fontSize:11, fontWeight:600, background:'var(--color-error)', color:'#fff', border:'none', borderRadius:3, cursor:'pointer', opacity:!motivo||enviando?0.5:1 }}>
        {enviando?'Enviando...':'Confirmar fallo'}
      </button>
    </div>
  );
}

// ─── Fila expandida ─────────────────────────────────────────────────────────

function PrepackDetalle({ tag, onRefresh }) {
  const [trazabilidad, setTrazabilidad] = useState(null);
  const [showQaForm, setShowQaForm] = useState(false);
  useEffect(()=>{ api.getTrazabilidad(tag.epc).then(setTrazabilidad).catch(()=>{}); },[tag.epc]);

  return (
    <tr><td colSpan={7} style={{ padding:'12px 16px', background:'var(--ds-bg-surface-2)', borderBottom:'2px solid var(--color-primary)' }}>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, fontSize:12, marginBottom:8 }}>
        <div><span style={{ color:'var(--color-text-muted)', fontSize:10 }}>EPC completo:</span><br/><span style={{ fontFamily:'var(--font-mono)', fontSize:11 }}>{tag.epc}</span></div>
        <div><span style={{ color:'var(--color-text-muted)', fontSize:10 }}>Producto:</span><br/><strong>{tag.color} {tag.talla} · {tag.cantidad_piezas} piezas</strong></div>
        <div><span style={{ color:'var(--color-text-muted)', fontSize:10 }}>Tienda:</span><br/><strong>{tag.tienda?.nombre||tag.tienda_id||'—'}</strong></div>
        <div><span style={{ color:'var(--color-text-muted)', fontSize:10 }}>Bahia asignada:</span><br/><strong>{tag.tienda?.bahia_asignada||'—'}</strong></div>
        <div><span style={{ color:'var(--color-text-muted)', fontSize:10 }}>Etapa:</span><br/><Badge value={tag.etapa_actual} config={ETAPA_CONFIG}/></div>
        <div><span style={{ color:'var(--color-text-muted)', fontSize:10 }}>Flujo:</span><br/><strong>{tag.tipo_flujo}</strong></div>
      </div>
      {tag.qa_fallido && <div style={{ padding:8, background:'var(--color-error-bg)', borderRadius:4, marginBottom:8, fontSize:12 }}>
        <strong style={{ color:'var(--color-error)' }}>Rechazado en QA:</strong> {tag.qa_motivo_fallo} <span style={{ color:'var(--color-text-muted)' }}>({tag.qa_timestamp?formatHora(tag.qa_timestamp):''})</span>
      </div>}
      {(tag.anomalias||[]).filter(a=>a.tipo_error!=='QA_RECHAZADO').map((a,i)=><div key={i} style={{ fontSize:11, color:'var(--color-error)', fontWeight:600, marginBottom:4 }}>Anomalia: {a.tipo_error}{a.descripcion?` — ${a.descripcion}`:''}</div>)}
      <MiniTimeline trazabilidad={trazabilidad}/>
      {tag.etapa_actual==='QA'&&!tag.qa_fallido&&!showQaForm&&<button onClick={()=>setShowQaForm(true)} style={{ marginTop:8, padding:'4px 12px', fontSize:11, background:'var(--color-error-bg)', color:'var(--color-error)', border:'1px solid var(--color-error)', borderRadius:3, cursor:'pointer', fontWeight:600 }}>Marcar como fallido en QA</button>}
      {showQaForm&&<QaFalloForm epc={tag.epc} onDone={onRefresh}/>}
    </td></tr>
  );
}

// ─── Validacion vs Orden ────────────────────────────────────────────────────

function ValidacionOC({ paletId }) {
  const [data, setData] = useState(null);
  useEffect(()=>{ api.getPaletValidacion(paletId).then(setData).catch(()=>{}); },[paletId]);
  if(!data || data.faltantes===0) return null;
  return (
    <div style={{ background:'var(--color-warn-bg)', border:'1px solid var(--color-warn)', borderRadius:4, padding:'16px 20px', marginBottom:16 }}>
      <div style={{ fontSize:12, fontWeight:700, color:'var(--color-warn)', marginBottom:8 }}>⚠ Validacion de recepcion</div>
      <div style={{ fontSize:12, color:'var(--color-text-primary)', marginBottom:4 }}>Esperados segun {data.orden_id}: <strong>{data.esperados}</strong> prepacks</div>
      <div style={{ fontSize:12, marginBottom:4 }}>Recibidos: <strong>{data.recibidos}</strong> prepacks</div>
      <div style={{ fontSize:12, fontWeight:700, color:'var(--color-error)' }}>Faltantes: {data.faltantes} prepacks</div>
      {data.detalle_faltantes?.length>0&&<div style={{ marginTop:8, fontSize:11 }}>
        {data.detalle_faltantes.map((d,i)=><div key={i} style={{ color:'var(--color-text-secondary)', marginBottom:2 }}>{d.color} {d.talla}: esperados {d.cantidad_esperada}, recibidos {d.cantidad_recibida} — faltan {Math.abs(d.diferencia)}</div>)}
      </div>}
    </div>
  );
}

// ─── Componente Principal ───────────────────────────────────────────────────

export default function DetallePalet({ paletId, onBack, onVerHistorial }) {
  const [palet, setPalet] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [expandedTag, setExpandedTag] = useState(null);

  const cargar = () => {
    setCargando(true);
    api.getPalet(paletId).then(d=>{setPalet(d);setCargando(false);});
  };
  useEffect(cargar,[paletId]);

  if(cargando) return <div style={{ padding:40, color:'var(--color-text-secondary)', fontSize:14 }}>Cargando palet...</div>;
  if(!palet||palet.error) return <div style={{ padding:40, color:'var(--color-error)' }}>Palet no encontrado.</div>;

  const tags = palet.tags||[];
  const etapaLogs = palet.etapa_logs||[];
  // Ordenar: fallidos primero, luego con anomalia, luego ok
  const tagsSorted = [...tags].sort((a,b)=>{
    if(a.qa_fallido&&!b.qa_fallido) return -1; if(!a.qa_fallido&&b.qa_fallido) return 1;
    const aErr=(a.anomalias?.length||0)>0, bErr=(b.anomalias?.length||0)>0;
    if(aErr&&!bErr) return -1; if(!aErr&&bErr) return 1;
    return 0;
  });

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:20 }}>
        <button onClick={onBack} style={{ background:'none', border:'1px solid var(--color-border)', borderRadius:3, padding:'4px 12px', fontSize:12, cursor:'pointer', color:'var(--color-text-secondary)' }}>Cerrar</button>
        <span style={{ color:'var(--color-text-muted)', fontSize:12 }}>/ {palet.nombre_product||palet.palet_id}</span>
      </div>

      <HeaderCargamento palet={palet} tags={tags} etapaLogs={etapaLogs}/>
      {etapaLogs.length>0&&<HistorialTimeline etapaLogs={etapaLogs}/>}
      <ValidacionOC paletId={paletId}/>
      <TablaColorTalla tags={tags}/>

      <div style={{ background:'var(--bg-panel)', border:'1px solid var(--color-border)', borderRadius:4, overflow:'hidden' }}>
        <div style={{ padding:'12px 16px', borderBottom:'1px solid var(--color-border)', fontSize:12, fontWeight:600, color:'var(--color-text-secondary)' }}>
          PREPACKS DEL CARGAMENTO ({tags.filter(t=>!t.qa_fallido).length} activos{tags.some(t=>t.qa_fallido)?`, ${tags.filter(t=>t.qa_fallido).length} rechazados`:''})
          <span style={{ fontSize:11, color:'var(--color-text-muted)', fontWeight:400, marginLeft:8 }}>doble clic para expandir</span>
        </div>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
            <thead><tr style={{ background:'var(--bg-base)' }}>
              {['EPC','Producto','Tienda','Bahia','Etapa','Estado',''].map(h=><th key={h} style={{ padding:'8px 12px', textAlign:'left', fontWeight:600, color:'var(--color-text-secondary)', whiteSpace:'nowrap', borderBottom:'1px solid var(--color-border)' }}>{h}</th>)}
            </tr></thead>
            <tbody>
              {tagsSorted.map(t=>{
                const tieneError=(t.anomalias?.length||0)>0;
                const isExpanded=expandedTag===t.epc;
                return [
                  <tr key={t.epc} onDoubleClick={()=>setExpandedTag(isExpanded?null:t.epc)} style={{ borderBottom:'1px solid var(--color-border)', cursor:'pointer', background:t.qa_fallido?'#FEF2F2':tieneError?'var(--color-error-bg)':'transparent', opacity:t.qa_fallido?0.6:1 }}>
                    <td style={{ padding:'8px 12px', fontFamily:'var(--font-mono)', fontSize:11, color:'var(--color-text-muted)' }} title={t.epc}>{t.epc.length>10?t.epc.substring(0,8)+'...':t.epc}</td>
                    <td style={{ padding:'8px 12px', fontWeight:500 }}>{t.color} {t.talla}</td>
                    <td style={{ padding:'8px 12px', fontSize:11 }}>{t.tienda?.nombre||'—'}</td>
                    <td style={{ padding:'8px 12px', fontSize:11, color:'var(--color-text-muted)' }}>{t.tienda?.bahia_asignada||'—'}</td>
                    <td style={{ padding:'8px 12px' }}><Badge value={t.etapa_actual} config={ETAPA_CONFIG}/></td>
                    <td style={{ padding:'8px 12px' }}>
                      {t.qa_fallido?<span style={{ fontSize:10, fontWeight:600, padding:'2px 6px', borderRadius:2, background:'#FEE2E2', color:'#991B1B' }}>QA FALLO</span>
                      :tieneError?<span style={{ fontSize:10, fontWeight:600, padding:'2px 6px', borderRadius:2, background:'var(--color-error-bg)', color:'var(--color-error)' }}>ERR</span>
                      :<span style={{ fontSize:10, fontWeight:600, padding:'2px 6px', borderRadius:2, background:'var(--color-ok-bg)', color:'var(--color-ok)' }}>OK</span>}
                    </td>
                    <td style={{ padding:'8px 12px' }}>
                      <button onClick={e=>{e.stopPropagation();onVerHistorial(t.epc);}} style={{ background:'none', border:'1px solid var(--color-border)', borderRadius:3, padding:'3px 10px', fontSize:11, cursor:'pointer', color:'var(--color-primary)', whiteSpace:'nowrap' }}>Historial</button>
                    </td>
                  </tr>,
                  isExpanded&&<PrepackDetalle key={`${t.epc}-d`} tag={t} onRefresh={cargar}/>,
                ];
              })}
              {tags.length===0&&<tr><td colSpan={7} style={{ padding:'24px 12px', textAlign:'center', color:'var(--color-text-muted)' }}>Sin tags en este palet</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
