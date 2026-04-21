import { useState, useEffect } from 'react';
import { api } from '../api/rfidApi';

const ETAPAS_ORDEN = ['PREREGISTRO','QA','REGISTRO','SORTER','BAHIA','AUDITORIA','ENVIO'];
const ETAPA_LABELS = { PREREGISTRO:'Pre-registro', QA:'QA', REGISTRO:'Registro', SORTER:'Sorter', BAHIA:'Bahia', AUDITORIA:'Auditoria', ENVIO:'Envio' };
const ETAPA_COLORS = { PREREGISTRO:'#2563EB', QA:'#059669', REGISTRO:'#D97706', SORTER:'#7C3AED', BAHIA:'#0891B2', AUDITORIA:'#DB2777', ENVIO:'#16A34A' };
const ORDEN_TALLAS = ['XS','S','CH','M','G','L','XL','XXL'];

const COLORES_CSS = { azul:'#3B82F6', rojo:'#EF4444', verde:'#22C55E', negro:'#1E293B', blanco:'#F8FAFC', amarillo:'#EAB308', rosa:'#EC4899', gris:'#94A3B8', 'café':'#92400E', cafe:'#92400E', naranja:'#F97316', morado:'#8B5CF6', violeta:'#8B5CF6', beige:'#D4B896', 'azul oscuro':'#1E3A8A', 'azul marino':'#1E3A8A' };

function getCodigo(tag) {
  const f = tag?.numero_folio || tag?.folio || tag?.num_prepack;
  if (f) return `#${f}`;
  const e = tag?.epc || '';
  return e.length > 6 ? `···${e.slice(-6)}` : e;
}

function buildTablaPrepack(tag) {
  if (tag?.prendas && tag.prendas.length > 0) {
    const colores = [...new Set(tag.prendas.map(p => p.color))].sort();
    const tallas = [...new Set(tag.prendas.map(p => p.talla))].sort((a,b)=>{const ia=ORDEN_TALLAS.indexOf(a),ib=ORDEN_TALLAS.indexOf(b);return (ia===-1?99:ia)-(ib===-1?99:ib);});
    return { colores, tallas, conteo:(c,t)=>tag.prendas.filter(p=>p.color===c&&p.talla===t).length, totColor:c=>tag.prendas.filter(p=>p.color===c).length, totTalla:t=>tag.prendas.filter(p=>p.talla===t).length, gran:tag.prendas.length };
  }
  const piezas = tag?.cantidad_piezas || 1;
  return { colores:[tag?.color||'—'], tallas:[tag?.talla||'—'], conteo:(c,t)=>(c===tag?.color&&t===tag?.talla)?piezas:0, totColor:c=>c===tag?.color?piezas:0, totTalla:t=>t===tag?.talla?piezas:0, gran:piezas };
}

function formatHora(ts) { return ts ? new Date(ts).toLocaleTimeString('es-MX',{hour:'2-digit',minute:'2-digit',hour12:false}) : '—'; }
function formatDur(min) { return min ? (min>=60?`${Math.floor(min/60)}h ${min%60}min`:`${min}min`) : '—'; }
function Barra({ pct, color='#6366F1', height=5 }) {
  return <div style={{height,background:'#E2E8F0',borderRadius:height,overflow:'hidden'}}><div style={{width:`${Math.min(100,Math.round(pct||0))}%`,height:'100%',background:color,borderRadius:height,transition:'width .5s ease'}}/></div>;
}

function consolidarHistorial(logs) {
  if (!logs || logs.length === 0) return [];
  const grupos = {};
  logs.forEach(log => {
    const e = log.etapa;
    if (!grupos[e]) { grupos[e] = { ...log }; }
    else {
      if (log.timestamp_entrada && log.timestamp_entrada < grupos[e].timestamp_entrada) { grupos[e].timestamp_entrada = log.timestamp_entrada; grupos[e].prepacks_entrada = log.prepacks_entrada || grupos[e].prepacks_entrada; }
      if (log.timestamp_salida && (!grupos[e].timestamp_salida || log.timestamp_salida > grupos[e].timestamp_salida)) { grupos[e].timestamp_salida = log.timestamp_salida; grupos[e].prepacks_salida = log.prepacks_salida || grupos[e].prepacks_salida; }
      if (log.tiene_anomalia) grupos[e].tiene_anomalia = true;
    }
  });
  return ETAPAS_ORDEN.filter(e => grupos[e]).map(e => grupos[e]);
}

function calcEstatusPrepack(tag) {
  return {
    presente: !!tag.epc && tag.etapa_actual !== null,
    entregado: ['ENVIO','COMPLETADO'].includes(tag.etapa_actual),
    calidadOk: !tag.qa_fallido,
  };
}

export default function ModalOC({ ordenId, demoData = null, etapaOrigen = null, onClose, onVerHistorial }) {
  const [palet, setPalet] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [expandido, setExpandido] = useState(null);
  const [prepackModal, setPrepackModal] = useState(null);

  useEffect(() => {
    if (demoData) {
      setPalet(demoData);
      setCargando(false);
      return;
    }
    api.getPalet(ordenId).then(d=>{setPalet(d);setCargando(false);}).catch(()=>setCargando(false));
  }, [ordenId, demoData]);
  useEffect(() => {
    const h = e => { if(e.key==='Escape') onClose(); };
    document.addEventListener('keydown',h); document.body.style.overflow='hidden';
    return () => { document.removeEventListener('keydown',h); document.body.style.overflow=''; };
  }, [onClose]);

  const tags = palet?.tags||[];
  const etapaLogs = palet?.etapa_logs||palet?.palet_etapa_log||[];
  const nombre = palet?.nombre||palet?.nombre_producto||palet?.orden?.nombre_producto||palet?.orden?.modelo||ordenId;
  const proveedor = palet?.proveedor||palet?.pedido?.proveedor?.nombre||'';
  const totalEsperados = palet?.total_esperados||tags.length;
  const totalRecibidos = palet?.total_recibidos||tags.length;
  const faltantes = palet?.faltantes||0;
  const tagsFiltrados = etapaOrigen ? tags.filter(t => t.etapa_actual === etapaOrigen) : tags;
  const etapasActuales = ETAPAS_ORDEN.filter(e => tags.some(t => t.etapa_actual===e));
  const fallidos = tags.filter(t => t.qa_fallido);
  const tieneErr = fallidos.length>0 || etapaLogs.some(l => l.tiene_anomalia);

  const tagsOk = tags.filter(t => !t.qa_fallido);
  // Agregar prendas de todos los prepacks ok (cada prepack tiene prendas[])
  const todasPrendas = tagsOk.flatMap(t => t.prendas && t.prendas.length>0 ? t.prendas : [{color:t.color,talla:t.talla}]);
  const colores = [...new Set(todasPrendas.map(p=>p.color))].sort();
  const tallas = [...new Set(todasPrendas.map(p=>p.talla))].sort((a,b)=>(ORDEN_TALLAS.indexOf(a)===-1?99:ORDEN_TALLAS.indexOf(a))-(ORDEN_TALLAS.indexOf(b)===-1?99:ORDEN_TALLAS.indexOf(b)));
  const conteo = (c,t) => todasPrendas.filter(x=>x.color===c&&x.talla===t).length;
  const totColor = c => todasPrendas.filter(x=>x.color===c).length;
  const totTalla = t => todasPrendas.filter(x=>x.talla===t).length;
  const totalPrendas = todasPrendas.length;

  const bahiasOC = Array.from({length:10},(_,i)=>{
    const id=`BAHIA-${i+1}`; const enB=tags.filter(t=>t.tienda?.bahia_asignada===id); return {n:i+1,id,total:enB.length};
  }).filter(b=>b.total>0);

  const tagsSorted = [...tagsFiltrados].sort((a,b)=>{
    if(a.qa_fallido&&!b.qa_fallido) return -1; if(!a.qa_fallido&&b.qa_fallido) return 1;
    const ae=(a.anomalias?.length||0)>0, be=(b.anomalias?.length||0)>0;
    if(ae&&!be) return -1; if(!ae&&be) return 1; return 0;
  });

  const td={padding:'8px 14px',borderBottom:'1px solid #F1F5F9',fontSize:12};
  const th={padding:'8px 14px',fontSize:9,fontWeight:700,color:'var(--ds-text-disabled)',textTransform:'uppercase',letterSpacing:'.4px',background:'var(--ds-bg-surface-2)',borderBottom:'1px solid var(--ds-border-light)'};

  return (
    <div onClick={onClose} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.52)',zIndex:500,display:'flex',alignItems:'flex-start',justifyContent:'center',overflow:'auto',padding:'32px 20px'}}>
      <div onClick={e=>e.stopPropagation()} style={{width:'100%',maxWidth:920,background:'var(--ds-bg-surface)',borderRadius:14,boxShadow:'0 24px 64px rgba(0,0,0,0.22)',marginBottom:32,animation:'ds-entrada-modal .22s ease'}}>

        {/* HEADER */}
        <div style={{padding:'22px 26px',borderBottom:'1px solid var(--ds-border-light)',display:'flex',gap:18,alignItems:'flex-start'}}>
          <div style={{width:72,height:72,borderRadius:10,background:'#EEF2FF',border:'1px solid var(--ds-primary-border)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,overflow:'hidden'}}>
            {palet?.orden?.foto_url
              ?<img src={palet.orden.foto_url} alt="" style={{width:'100%',height:'100%',objectFit:'cover',borderRadius:10}}/>
              :(()=>{
                const colorP=(palet?.tags?.[0]?.color||'').toLowerCase();
                const COLMAP={azul:'#3B82F6',rojo:'#EF4444',verde:'#22C55E',negro:'#1E293B',blanco:'#94A3B8',amarillo:'#EAB308',naranja:'#F97316',violeta:'#8B5CF6',gris:'#94A3B8'};
                const sc=COLMAP[colorP]||'var(--ds-primary)';
                const nl=(nombre||'').toLowerCase();
                const esP=nl.includes('pantalon')||nl.includes('jean')||nl.includes('denim');
                return(
                  <div style={{width:'100%',height:'100%',background:`${sc}18`,borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center'}}>
                    <svg viewBox="0 0 48 48" fill="none" width={42} height={42}>
                      {esP
                        ?<path d="M10 8L14 8L20 28L24 18L28 28L34 8L38 8L38 12L32 12L26 36L22 36L16 12L10 12Z" fill={sc} fillOpacity={0.85} stroke={sc} strokeWidth={1.5} strokeLinejoin="round"/>
                        :<path d="M16 6L8 14L14 17L14 40L34 40L34 17L40 14L32 6C32 6 29 10 24 10C19 10 16 6 16 6Z" fill={sc} fillOpacity={0.85} stroke={sc} strokeWidth={1.5} strokeLinejoin="round"/>
                      }
                    </svg>
                  </div>
                );
              })()
            }
          </div>
          <div style={{flex:1}}>
            <div style={{display:'flex',gap:5,flexWrap:'wrap',marginBottom:8}}>
              {etapasActuales.length===0
                ?<span style={{background:'#DCFCE7',color:'#15803D',fontSize:10,fontWeight:700,padding:'3px 10px',borderRadius:100}}>Completado</span>
                :etapasActuales.map(e=><span key={e} style={{background:`${ETAPA_COLORS[e]}18`,color:ETAPA_COLORS[e],fontSize:10,fontWeight:700,padding:'3px 10px',borderRadius:100,border:`1px solid ${ETAPA_COLORS[e]}44`}}>{ETAPA_LABELS[e]}</span>)
              }
              {tieneErr&&<span style={{background:'#FEE2E2',color:'#991B1B',fontSize:10,fontWeight:700,padding:'3px 10px',borderRadius:100}}>Requiere atencion</span>}
            </div>
            <div style={{fontSize:20,fontWeight:700,color:'var(--ds-text-primary)',marginBottom:4}}>{cargando?'...':nombre}</div>
            <div style={{fontSize:11,color:'var(--ds-text-disabled)'}}>{ordenId} · {proveedor} · {tags.length} prepack{tags.length!==1?'s':''}{faltantes>0&&<span style={{color:'var(--ds-rojo)',fontWeight:700,marginLeft:6}}>· {faltantes} faltante{faltantes!==1?'s':''}</span>}</div>
          </div>
          <button onClick={onClose} style={{background:'none',border:'1px solid var(--ds-border-light)',borderRadius:6,width:32,height:32,cursor:'pointer',fontSize:18,color:'var(--ds-text-disabled)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>×</button>
        </div>

        {cargando?<div style={{padding:60,textAlign:'center',color:'var(--ds-text-disabled)'}}>Cargando detalle...</div>
        :!palet?<div style={{padding:60,textAlign:'center',color:'#EF4444'}}>No se pudo cargar la orden.</div>
        :<>
          {/* MÉTRICAS DE LA ETAPA DE ORIGEN */}
          {etapaOrigen && (()=>{
            const EC={PREREGISTRO:'#2563EB',QA:'#059669',REGISTRO:'#D97706',SORTER:'#7C3AED',BAHIA:'#0891B2',AUDITORIA:'#DB2777',ENVIO:'#16A34A'};
            const EL={PREREGISTRO:'Pre-registro',QA:'Control de calidad',REGISTRO:'Registro',SORTER:'Sorter',BAHIA:'Bahías',AUDITORIA:'Auditoría',ENVIO:'Envío'};
            const c=EC[etapaOrigen]||'#6366F1';
            const te=tags.filter(t=>t.etapa_actual===etapaOrigen);
            const n=te.length,tot=tags.length,esp=totalEsperados;
            const err=te.filter(t=>t.qa_fallido).length,ok=n-err;
            const pct=tot>0?Math.round((n/tot)*100):0;
            const pctOk=n>0?Math.round((ok/n)*100):100;
            const mets={
              PREREGISTRO:[{l:'Recibidos',v:n,d:'prepacks llegaron'},{l:'Esperados',v:esp,d:'según la OC'},{l:'Recibido',v:`${pct}%`,d:'del total esperado'}],
              QA:[{l:'En QA',v:n,d:'prepacks revisados'},{l:'Aprobados',v:ok,d:'pasaron calidad'},{l:'Calificación',v:`${pctOk}%`,d:'del proveedor'}],
              REGISTRO:[{l:'Registrados',v:n,d:'en sistema'},{l:'Total OC',v:tot,d:'prepacks totales'},{l:'Avance',v:`${pct}%`,d:'procesado'}],
              SORTER:[{l:'En Sorter',v:n,d:'clasificando'},{l:'Total',v:tot,d:'prepacks OC'},{l:'Procesado',v:`${pct}%`,d:'del cargamento'}],
              BAHIA:[{l:'En bahías',v:n,d:'distribuidos'},{l:'Total OC',v:tot,d:'prepacks'},{l:'Distribuido',v:`${pct}%`,d:'del total'}],
              AUDITORIA:[{l:'Auditados',v:n,d:'prepacks'},{l:'Aprobados',v:ok,d:'pasaron'},{l:'Aprobación',v:`${pctOk}%`,d:'de calidad'}],
              ENVIO:[{l:'Enviados',v:n,d:'prepacks'},{l:'Total OC',v:tot,d:'prepacks'},{l:'Completado',v:`${pct}%`,d:'del pedido'}],
            }[etapaOrigen]||[];
            return(
              <div style={{padding:'16px 26px',borderBottom:'1px solid var(--ds-border-light)',background:`${c}08`,borderLeft:`4px solid ${c}`}}>
                <div style={{fontSize:9,fontWeight:700,color:c,textTransform:'uppercase',letterSpacing:'.6px',marginBottom:12}}>{EL[etapaOrigen]} — métricas de esta etapa</div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10}}>
                  {mets.map((m,i)=><div key={i} style={{background:'var(--ds-bg-surface)',borderRadius:8,padding:'10px 14px',border:`1px solid ${c}33`}}>
                    <div style={{fontSize:9,fontWeight:700,color:c,textTransform:'uppercase',letterSpacing:'.4px',marginBottom:4}}>{m.l}</div>
                    <div style={{fontSize:26,fontWeight:800,color:'var(--ds-text-primary)',lineHeight:1}}>{m.v}</div>
                    <div style={{fontSize:9,color:'var(--ds-text-muted)',marginTop:2}}>{m.d}</div>
                  </div>)}
                </div>
              </div>
            );
          })()}

          {/* TABLA COLOR x TALLA */}
          <div style={{padding:'20px 26px',borderBottom:'1px solid var(--ds-border-light)'}}>
            <div style={{fontSize:9,fontWeight:700,color:'var(--ds-text-disabled)',textTransform:'uppercase',letterSpacing:'.6px',marginBottom:12}}>Contenido — tabla color × talla</div>
            {tagsOk.length===0?<div style={{fontSize:13,color:'var(--ds-text-disabled)'}}>Sin prepacks activos.</div>:(
              <div style={{overflowX:'auto',borderRadius:10,border:'1px solid var(--ds-border-light)'}}>
                <table style={{borderCollapse:'collapse',width:'100%',minWidth:360}}>
                  <thead><tr>
                    <th style={{...th,textAlign:'left'}}>Color</th>
                    {tallas.map(t=><th key={t} style={th}>{t}</th>)}
                    <th style={{...th,background:'var(--ds-primary-light)',color:'var(--ds-primary-dark)'}}>Total</th>
                  </tr></thead>
                  <tbody>{colores.map((color,idx)=>(
                    <tr key={color} style={{background:idx%2===0?'transparent':'#F8FAFC'}}>
                      <td style={{...td,fontWeight:600}}>{color}</td>
                      {tallas.map(t=>{const n=conteo(color,t);return<td key={t} style={{...td,textAlign:'center',fontWeight:n>0?700:400,color:n>0?'#0F172A':'#CBD5E1'}}>{n>0?n:'—'}</td>;})}
                      <td style={{...td,textAlign:'center',fontWeight:700,background:'var(--ds-primary-light)',color:'var(--ds-primary-dark)'}}>{totColor(color)}</td>
                    </tr>
                  ))}</tbody>
                  <tfoot><tr style={{borderTop:'2px solid var(--ds-border-light)'}}>
                    <td style={{...td,fontSize:9,fontWeight:700,color:'var(--ds-text-disabled)',textTransform:'uppercase'}}>Total</td>
                    {tallas.map(t=><td key={t} style={{...td,textAlign:'center',fontWeight:800,fontSize:13}}>{totTalla(t)}</td>)}
                    <td style={{...td,textAlign:'center',fontSize:16,fontWeight:900,background:'var(--ds-primary)',color:'#fff'}}>{totalPrendas}</td>
                  </tr></tfoot>
                </table>
              </div>
            )}
            {fallidos.length>0&&<div style={{marginTop:8,fontSize:11,color:'#991B1B'}}>⚠ {fallidos.length} prepack{fallidos.length>1?'s':''} excluido{fallidos.length>1?'s':''} por QA.</div>}
          </div>

          {/* VALIDACIÓN DE RECEPCIÓN — solo si hay faltantes */}
          {faltantes > 0 && (
            <div style={{padding:'16px 26px',borderBottom:'1px solid var(--ds-border-light)',background:'var(--ds-amarillo-bg)',borderLeft:'4px solid var(--ds-amarillo)'}}>
              <div style={{fontSize:9,fontWeight:700,color:'var(--ds-amarillo-text)',textTransform:'uppercase',letterSpacing:'.6px',marginBottom:10}}>⚠ Validación de recepción</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12,marginBottom:12}}>
                <div style={{background:'var(--ds-bg-surface)',borderRadius:8,padding:'10px 14px',border:'1px solid var(--ds-amarillo-border)'}}>
                  <div style={{fontSize:9,color:'var(--ds-amarillo-text)',fontWeight:700,textTransform:'uppercase',marginBottom:4}}>Esperados según OC</div>
                  <div style={{fontSize:22,fontWeight:800,color:'var(--ds-text-primary)'}}>{totalEsperados}</div>
                  <div style={{fontSize:10,color:'var(--ds-text-muted)'}}>prepacks</div>
                </div>
                <div style={{background:'var(--ds-bg-surface)',borderRadius:8,padding:'10px 14px',border:'1px solid var(--ds-amarillo-border)'}}>
                  <div style={{fontSize:9,color:'var(--ds-amarillo-text)',fontWeight:700,textTransform:'uppercase',marginBottom:4}}>Recibidos</div>
                  <div style={{fontSize:22,fontWeight:800,color:'var(--ds-text-primary)'}}>{totalRecibidos}</div>
                  <div style={{fontSize:10,color:'var(--ds-text-muted)'}}>prepacks</div>
                </div>
                <div style={{background:'var(--ds-rojo-bg)',borderRadius:8,padding:'10px 14px',border:'1px solid var(--ds-rojo-border)'}}>
                  <div style={{fontSize:9,color:'var(--ds-rojo-text)',fontWeight:700,textTransform:'uppercase',marginBottom:4}}>Faltantes</div>
                  <div style={{fontSize:22,fontWeight:800,color:'var(--ds-rojo)'}}>{faltantes}</div>
                  <div style={{fontSize:10,color:'var(--ds-rojo-text)'}}>no recibidos</div>
                </div>
              </div>
              <div style={{fontSize:11,color:'var(--ds-amarillo-text)'}}>Se esperaban <strong>{totalEsperados}</strong> prepacks. Llegaron <strong>{totalRecibidos}</strong>. Faltan <strong style={{color:'var(--ds-rojo)'}}>{faltantes}</strong>.</div>
            </div>
          )}

          {/* HISTORIAL GENERAL — consolidado, una línea por etapa */}
          {etapaLogs.length>0&&(
            <div style={{padding:'20px 26px',borderBottom:'1px solid var(--ds-border-light)'}}>
              <div style={{fontSize:9,fontWeight:700,color:'var(--ds-text-disabled)',textTransform:'uppercase',letterSpacing:'.6px',marginBottom:14}}>Historial del cargamento</div>
              {(()=>{
                const logsC = consolidarHistorial(etapaLogs).filter(l => l.etapa !== 'COMPLETADO');
                if(logsC.length===0) return <div style={{fontSize:12,color:'var(--ds-text-disabled)'}}>Sin historial registrado.</div>;
                return(
                  <div style={{overflowX:'auto',paddingBottom:8}}>
                    <div style={{display:'flex',alignItems:'flex-start',gap:0,minWidth:'max-content'}}>
                      {logsC.map((log,idx)=>{
                        const color=ETAPA_COLORS[log.etapa]||'#94A3B8';
                        const enCurso=!log.timestamp_salida;
                        const dur=log.timestamp_salida?Math.round((new Date(log.timestamp_salida)-new Date(log.timestamp_entrada))/60000):null;
                        const bajoPrepacks=log.prepacks_salida>0&&log.prepacks_entrada!==log.prepacks_salida;
                        return(
                          <div key={log.etapa} style={{display:'flex',alignItems:'flex-start'}}>
                            {idx>0&&<div style={{width:24,height:2,background:'var(--ds-border-light)',marginTop:19,flexShrink:0}}/>}
                            <div style={{width:100,textAlign:'center',flexShrink:0}}>
                              <div style={{width:38,height:38,borderRadius:'50%',background:enCurso?color:`${color}18`,border:`2.5px solid ${color}`,margin:'0 auto 6px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,fontWeight:700,color:enCurso?'#fff':color}}>
                                {log.tiene_anomalia?'⚠':enCurso?'●':'✓'}
                              </div>
                              <div style={{fontSize:9,fontWeight:700,color:'#334155',textTransform:'uppercase',letterSpacing:'.3px',marginBottom:4}}>{ETAPA_LABELS[log.etapa]}</div>
                              <div style={{fontSize:9,color:'var(--ds-text-muted)',marginTop:2,lineHeight:1.4}}><span style={{fontWeight:600}}>Entró:</span> {formatHora(log.timestamp_entrada)}</div>
                              {enCurso?<div style={{fontSize:9,color:'var(--ds-verde)',fontWeight:700,marginTop:1}}>En curso</div>:<div style={{fontSize:9,color:'var(--ds-text-muted)',lineHeight:1.4}}><span style={{fontWeight:600}}>Salió:</span> {formatHora(log.timestamp_salida)}</div>}
                              {dur!==null&&dur>0&&<div style={{fontSize:9,color:'var(--ds-text-disabled)',marginTop:1}}>Duración: {formatDur(dur)}</div>}
                              {bajoPrepacks&&<div style={{fontSize:8,fontWeight:700,color:'var(--ds-rojo-text)',background:'var(--ds-rojo-bg)',borderRadius:4,padding:'1px 6px',marginTop:3,display:'inline-block'}}>{log.prepacks_entrada}→{log.prepacks_salida} prep.</div>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* BAHIAS DE ESTA OC */}
          {bahiasOC.length>0&&(
            <div style={{padding:'20px 26px',borderBottom:'1px solid var(--ds-border-light)'}}>
              <div style={{fontSize:9,fontWeight:700,color:'var(--ds-text-disabled)',textTransform:'uppercase',letterSpacing:'.6px',marginBottom:12}}>Distribucion en bahias</div>
              <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                {bahiasOC.map(b=>(
                  <div key={b.id} style={{border:'1.5px solid var(--ds-zona-auditoria-border)',borderLeft:'4px solid var(--ds-zona-auditoria)',borderRadius:8,padding:'8px 14px',background:'var(--ds-zona-auditoria-bg)',minWidth:100}}>
                    <div style={{fontSize:9,fontWeight:700,color:'#7C3AED',textTransform:'uppercase',marginBottom:2}}>Bahia {b.n}</div>
                    <div style={{fontSize:18,fontWeight:800,color:'var(--ds-text-primary)',lineHeight:1}}>{b.total}</div>
                    <div style={{fontSize:9,color:'var(--ds-text-disabled)',marginTop:1}}>prepacks</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PREPACKS */}
          <div style={{padding:'20px 26px'}}>
            <div style={{fontSize:9,fontWeight:700,color:'var(--ds-text-disabled)',textTransform:'uppercase',letterSpacing:'.6px',marginBottom:12}}>
              {etapaOrigen ? `Prepacks en ${ETAPA_LABELS[etapaOrigen]} (${tagsFiltrados.length} de ${tags.length})` : `Prepacks (${tags.length})`}{tagsFiltrados.filter(t=>t.qa_fallido).length>0&&<span style={{color:'#991B1B',marginLeft:8}}>· {tagsFiltrados.filter(t=>t.qa_fallido).length} rechazado{tagsFiltrados.filter(t=>t.qa_fallido).length!==1?'s':''}</span>}
            </div>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
              <thead><tr style={{background:'var(--ds-bg-surface-2)'}}>
                {['# Código','Producto','Tienda destino','Bahia','Etapa','Estado',''].map(h=><th key={h} style={{...th,textAlign:'left'}}>{h}</th>)}
              </tr></thead>
              <tbody>
                {tagsSorted.map(tag=>{
                  const prendas=tag.prendas&&tag.prendas.length>0?tag.prendas:[{color:tag.color,talla:tag.talla}];
                  const packId=tag.epc;
                  const tieneErr=tag.qa_fallido;
                  const tieneAnomalia=(tag.anomalias?.length||0)>0;
                  const isExp=expandido===packId;
                  const presente=true;
                  const entregado=['ENVIO','COMPLETADO'].includes(tag.etapa_actual);
                  const calidadOk=!tieneErr;
                  const colUnicos=[...new Set(prendas.map(p=>p.color))];
                  const tallUnicas=[...new Set(prendas.map(p=>p.talla))];
                  const codigoCorto=packId&&packId.length>6?`···${packId.slice(-6)}`:packId;
                  return[
                    <tr key={packId} onDoubleClick={()=>setExpandido(isExp?null:packId)} style={{borderBottom:'1px solid var(--ds-border-light)',cursor:'pointer',background:tieneErr?'#FFF5F5':tieneAnomalia?'#FFFBEB':'transparent'}}>
                      <td style={{...td,fontFamily:'monospace',fontWeight:700,color:'var(--ds-primary)',whiteSpace:'nowrap'}}>{codigoCorto}</td>
                      <td style={{...td,fontWeight:500}}>
                        <div style={{fontWeight:600,fontSize:11,color:'var(--ds-text-primary)'}}>{colUnicos.map(c=>{const cCSS=COLORES_CSS[(c||'').toLowerCase()]||'#94A3B8';const eClC=['blanco','white','beige','amarillo'].includes((c||'').toLowerCase());return(
                          <span key={c} style={{display:'inline-flex',alignItems:'center',gap:3,marginRight:6}}><div style={{width:7,height:7,borderRadius:'50%',background:cCSS,border:eClC?'1px solid #CBD5E1':'none',flexShrink:0}}/>{c}</span>
                        );})}</div>
                        <div style={{fontSize:9,color:'var(--ds-text-muted)',marginTop:1}}>{tallUnicas.join(', ')} · {prendas.length} prenda{prendas.length!==1?'s':''}</div>
                      </td>
                      <td style={{...td,fontSize:11}}>{tag.tienda?.nombre||tag.tienda_id||'—'}{tag.tienda?.ciudad&&<div style={{fontSize:10,color:'var(--ds-text-muted)',marginTop:1}}>{tag.tienda.ciudad}{tag.tienda.estado_rep?`, ${tag.tienda.estado_rep}`:''}</div>}</td>
                      <td style={{...td,fontSize:11,color:'var(--ds-text-disabled)'}}>{tag.tienda?.bahia_asignada||'—'}</td>
                      <td style={td}><span style={{fontSize:10,fontWeight:600,padding:'2px 7px',borderRadius:4,background:`${ETAPA_COLORS[tag.etapa_actual]||'#94A3B8'}18`,color:ETAPA_COLORS[tag.etapa_actual]||'#94A3B8'}}>{ETAPA_LABELS[tag.etapa_actual]||tag.etapa_actual}</span></td>
                      <td style={td}>
                        <div style={{display:'flex',alignItems:'center',gap:4,flexWrap:'nowrap'}}>
                          <span style={{fontSize:9,fontWeight:700,padding:'1px 5px',borderRadius:3,background:presente?'#DCFCE7':'#FEE2E2',color:presente?'#14532D':'#7F1D1D',whiteSpace:'nowrap'}}>{presente?'✓ Pres.':'✗ Aus.'}</span>
                          <span style={{fontSize:9,fontWeight:700,padding:'1px 5px',borderRadius:3,background:entregado?'#DCFCE7':'#F1F5F9',color:entregado?'#14532D':'#64748B',whiteSpace:'nowrap'}}>{entregado?'✓ Entg.':'· Pend.'}</span>
                          <span style={{fontSize:9,fontWeight:700,padding:'1px 5px',borderRadius:3,background:calidadOk?'#DCFCE7':'#FEE2E2',color:calidadOk?'#14532D':'#7F1D1D',whiteSpace:'nowrap'}}>{calidadOk?'✓ QA':'✗ QA'}</span>
                        </div>
                      </td>
                      <td style={td}><button onClick={e=>{e.stopPropagation();setPrepackModal(tag);}} style={{background:'none',border:'1px solid var(--ds-primary-border)',borderRadius:4,padding:'2px 8px',fontSize:9,cursor:'pointer',color:'var(--ds-primary)',fontWeight:600}}>Ver detalle</button></td>
                    </tr>,
                    isExp&&<tr key={`${packId}-d`}><td colSpan={7} style={{padding:'16px 20px',background:'var(--ds-primary-light)',borderBottom:'1px solid var(--ds-border-light)'}}>
                      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px 24px',marginBottom:14,fontSize:12}}>
                        <div><span style={{fontSize:9,color:'var(--ds-primary-dark)',fontWeight:700,textTransform:'uppercase'}}>Contenido</span><div style={{fontWeight:600,color:'var(--ds-text-primary)',marginTop:2}}>{colUnicos.join(' / ')} · {tallUnicas.join(', ')}</div></div>
                        <div><span style={{fontSize:9,color:'var(--ds-primary-dark)',fontWeight:700,textTransform:'uppercase'}}>Tienda destino</span><div style={{fontWeight:600,color:'var(--ds-text-primary)',marginTop:2}}>{tag.tienda?.nombre||'—'}{tag.tienda?.ciudad&&<span style={{fontWeight:400,color:'var(--ds-text-muted)'}}> — {tag.tienda.ciudad}{tag.tienda.estado_rep?`, ${tag.tienda.estado_rep}`:''}</span>}</div></div>
                        <div><span style={{fontSize:9,color:'var(--ds-primary-dark)',fontWeight:700,textTransform:'uppercase'}}>Tipo de flujo</span><div style={{marginTop:2}}>{tag.tipo_flujo||'—'}</div></div>
                        <div><span style={{fontSize:9,color:'var(--ds-primary-dark)',fontWeight:700,textTransform:'uppercase'}}>Prendas en prepack</span><div style={{fontWeight:700,fontSize:15,color:'var(--ds-text-primary)',marginTop:2}}>{prendas.length}</div></div>
                        <div><span style={{fontSize:9,color:'var(--ds-primary-dark)',fontWeight:700,textTransform:'uppercase'}}>EPC</span><code style={{fontSize:10,color:'var(--ds-text-muted)',marginTop:2,display:'block'}}>{packId}</code></div>
                        <div><span style={{fontSize:9,color:'var(--ds-primary-dark)',fontWeight:700,textTransform:'uppercase'}}>Bahía asignada</span><div style={{fontWeight:600,color:'var(--ds-zona-auditoria)',marginTop:2}}>{tag.tienda?.bahia_asignada||'—'}</div></div>
                        {tag.qa_fallido&&<div style={{gridColumn:'1/-1',background:'var(--ds-rojo-bg)',borderRadius:6,padding:'8px 12px',border:'1px solid var(--ds-rojo-border)'}}><strong style={{color:'var(--ds-rojo-text)'}}>Rechazado en QA: </strong><span style={{color:'var(--ds-rojo-text)'}}>{tag.qa_motivo_fallo||'Sin motivo registrado'}</span></div>}
                      </div>
                      <div style={{borderTop:'1px solid var(--ds-primary-border)',paddingTop:12}}>
                        <div style={{fontSize:9,fontWeight:700,color:'var(--ds-primary-dark)',textTransform:'uppercase',letterSpacing:'.5px',marginBottom:10}}>Recorrido de este prepack</div>
                        {(()=>{const logsC=consolidarHistorial(etapaLogs).filter(l=>l.etapa!=='COMPLETADO');if(logsC.length===0)return<div style={{fontSize:11,color:'var(--ds-text-disabled)'}}>Sin historial disponible.</div>;return(
                          <div style={{display:'flex',alignItems:'flex-start',gap:0,overflowX:'auto'}}>
                            {logsC.map((log,idx)=>{const color=ETAPA_COLORS[log.etapa]||'#94A3B8';const enCurso=!log.timestamp_salida;const dur=log.timestamp_salida?Math.round((new Date(log.timestamp_salida)-new Date(log.timestamp_entrada))/60000):null;return(
                              <div key={log.etapa} style={{display:'flex',alignItems:'flex-start'}}>
                                {idx>0&&<div style={{width:20,height:2,background:'var(--ds-primary-border)',marginTop:16,flexShrink:0}}/>}
                                <div style={{width:84,textAlign:'center',flexShrink:0}}>
                                  <div style={{width:32,height:32,borderRadius:'50%',background:enCurso?color:`${color}18`,border:`2px solid ${color}`,margin:'0 auto 5px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,color:enCurso?'#fff':color}}>{enCurso?'●':'✓'}</div>
                                  <div style={{fontSize:8,fontWeight:700,color:'#334155',textTransform:'uppercase',letterSpacing:'.2px',marginBottom:2}}>{ETAPA_LABELS[log.etapa]}</div>
                                  <div style={{fontSize:9,color:'var(--ds-text-muted)',fontWeight:600}}>{formatHora(log.timestamp_entrada)}</div>
                                  <div style={{fontSize:9,color:enCurso?'var(--ds-verde)':'#94A3B8'}}>{enCurso?'en curso':formatHora(log.timestamp_salida)}</div>
                                  {dur!==null&&dur>0&&<div style={{fontSize:8,color:'var(--ds-text-disabled)',marginTop:1}}>{formatDur(dur)}</div>}
                                </div>
                              </div>
                            );})}
                          </div>
                        );})()}
                      </div>
                    </td></tr>
                  ];
                })}
              </tbody>
            </table>
          </div>
        </>}
      </div>

      {/* MINI-MODAL DEL PREPACK */}
      {prepackModal&&(()=>{
        const tag=prepackModal;
        const prendasMM=tag.prendas&&tag.prendas.length>0?tag.prendas:[{color:tag.color,talla:tag.talla}];
        const colUnicosMM=[...new Set(prendasMM.map(p=>p.color))];
        const tallUnicasMM=[...new Set(prendasMM.map(p=>p.talla))];
        const colorPrincipal=colUnicosMM[0]||tag.color||'';
        const COLMAP={azul:'#3B82F6',rojo:'#EF4444',verde:'#22C55E',negro:'#1E293B',blanco:'#F8FAFC',amarillo:'#EAB308',rosa:'#EC4899',gris:'#94A3B8','café':'#92400E',cafe:'#92400E',naranja:'#F97316',morado:'#8B5CF6',beige:'#D4B896','azul oscuro':'#1E3A8A','azul marino':'#1E3A8A'};
        const cCSS=COLMAP[(colorPrincipal||'').toLowerCase()]||'#94A3B8';
        const esC=['blanco','white','beige','amarillo','yellow'].includes((colorPrincipal||'').toLowerCase());
        const txtC=esC?'#1E293B':'#FFFFFF';
        return(
          <div onClick={()=>setPrepackModal(null)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.45)',zIndex:600,display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
            <div onClick={e=>e.stopPropagation()} style={{width:'100%',maxWidth:620,background:'var(--ds-bg-surface)',borderRadius:14,boxShadow:'0 24px 64px rgba(0,0,0,0.25)',animation:'ds-entrada-modal .2s ease',overflow:'hidden'}}>
              <div style={{padding:'16px 20px',borderBottom:'1px solid var(--ds-border-light)',display:'flex',alignItems:'center',gap:16}}>
                <div style={{width:56,height:56,borderRadius:10,flexShrink:0,background:cCSS,border:esC?'2px solid #E2E8F0':'none',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 2px 8px rgba(0,0,0,0.15)'}}>
                  <svg viewBox="0 0 32 32" width={36} height={36} fill="none"><path d="M10 4L5 10L9 12L9 26L23 26L23 12L27 10L22 4C21 6 18.5 7.5 16 7.5C13.5 7.5 11 6 10 4Z" fill={esC?'rgba(0,0,0,0.15)':'rgba(255,255,255,0.25)'} stroke={esC?'rgba(0,0,0,0.2)':'rgba(255,255,255,0.5)'} strokeWidth={1}/></svg>
                </div>
                <div style={{flex:1}}>
                  <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
                    <div style={{fontSize:13,fontWeight:800,fontFamily:'monospace',color:'var(--ds-primary)',background:'var(--ds-primary-light)',border:'1px solid var(--ds-primary-border)',borderRadius:6,padding:'2px 10px'}}>{getCodigo(tag)}</div>
                    <div style={{fontSize:9,color:'var(--ds-text-disabled)'}}>código del prepack</div>
                  </div>
                  <div style={{fontSize:18,fontWeight:800,color:'var(--ds-text-primary)',lineHeight:1,marginBottom:2}}>{prendasMM.length} prenda{prendasMM.length!==1?'s':''} — {colUnicosMM.join(' / ')}</div>
                  <div style={{fontSize:10,color:'var(--ds-text-muted)'}}>{ETAPA_LABELS[tag.etapa_actual]||tag.etapa_actual} · {tag.tienda?.nombre||'—'}</div>
                </div>
                <button onClick={()=>setPrepackModal(null)} style={{background:'none',border:'1px solid var(--ds-border-light)',borderRadius:6,width:30,height:30,cursor:'pointer',fontSize:16,color:'var(--ds-text-disabled)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>×</button>
              </div>
              <div style={{padding:'16px 20px'}}>
                <div style={{display:'flex',gap:12,marginBottom:16}}>
                  {colUnicosMM.length>1?(
                    <div style={{width:80,height:80,borderRadius:10,flexShrink:0,background:'var(--ds-bg-surface-2)',border:'1px solid var(--ds-border-light)',display:'flex',flexWrap:'wrap',alignItems:'center',justifyContent:'center',gap:4,padding:8,boxShadow:'0 2px 10px rgba(0,0,0,0.08)'}}>
                      {colUnicosMM.slice(0,4).map(c=>{const cc=COLMAP[(c||'').toLowerCase()]||'#94A3B8';const ec=['blanco','white','beige','amarillo'].includes((c||'').toLowerCase());return(
                        <div key={c} title={c} style={{width:26,height:26,borderRadius:'50%',background:cc,border:ec?'1.5px solid #CBD5E1':'1.5px solid rgba(0,0,0,0.1)',flexShrink:0}}/>
                      );})}
                    </div>
                  ):(
                    <div style={{width:80,height:80,borderRadius:10,flexShrink:0,background:cCSS,border:esC?'2px solid #E2E8F0':'none',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 2px 10px rgba(0,0,0,0.12)'}}>
                      <span style={{fontSize:11,fontWeight:700,color:txtC,textAlign:'center',lineHeight:1.2}}>{colorPrincipal}</span>
                    </div>
                  )}
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'6px 16px',flex:1}}>
                    <div><div style={{fontSize:8,fontWeight:700,color:'var(--ds-text-disabled)',textTransform:'uppercase',marginBottom:2}}>Colores</div><div style={{fontSize:12,fontWeight:700,color:'var(--ds-text-primary)'}}>{colUnicosMM.join(' / ')}</div></div>
                    <div><div style={{fontSize:8,fontWeight:700,color:'var(--ds-text-disabled)',textTransform:'uppercase',marginBottom:2}}>Tallas</div><div style={{fontSize:12,fontWeight:700,color:'var(--ds-text-primary)'}}>{tallUnicasMM.join(', ')}</div></div>
                    <div><div style={{fontSize:8,fontWeight:700,color:'var(--ds-text-disabled)',textTransform:'uppercase',marginBottom:2}}>Prendas</div><div style={{fontSize:13,fontWeight:700,color:'var(--ds-text-primary)'}}>{prendasMM.length}</div></div>
                    <div><div style={{fontSize:8,fontWeight:700,color:'var(--ds-text-disabled)',textTransform:'uppercase',marginBottom:2}}>Tipo flujo</div><div style={{fontSize:11,color:'var(--ds-text-secondary)'}}>{tag.tipo_flujo||'—'}</div></div>
                  </div>
                </div>
                {/* Tabla color × talla del prepack */}
                {(()=>{const{colores,tallas,conteo,totColor,totTalla,gran}=buildTablaPrepack(tag);return(
                  <div style={{marginBottom:14}}>
                    <div style={{fontSize:8,fontWeight:700,color:'var(--ds-text-disabled)',textTransform:'uppercase',letterSpacing:'.5px',marginBottom:8}}>Contenido de este prepack</div>
                    <div style={{borderRadius:8,border:'1px solid var(--ds-border-light)',overflow:'hidden'}}>
                      <table style={{borderCollapse:'collapse',width:'100%',fontSize:11}}>
                        <thead><tr style={{background:'var(--ds-bg-surface-2)'}}>
                          <th style={{padding:'5px 10px',textAlign:'left',fontSize:8,fontWeight:700,color:'var(--ds-text-disabled)',textTransform:'uppercase',borderBottom:'1px solid var(--ds-border-light)'}}>Color</th>
                          {tallas.map(t=><th key={t} style={{padding:'5px 10px',textAlign:'center',fontSize:8,fontWeight:700,color:'var(--ds-text-disabled)',textTransform:'uppercase',borderBottom:'1px solid var(--ds-border-light)'}}>{t}</th>)}
                          <th style={{padding:'5px 10px',textAlign:'center',fontSize:8,fontWeight:700,color:'var(--ds-primary-dark)',textTransform:'uppercase',background:'var(--ds-primary-light)',borderBottom:'1px solid var(--ds-border-light)'}}>Total</th>
                        </tr></thead>
                        <tbody>
                          {colores.map((color,idx)=>{const cCol=COLORES_CSS[(color||'').toLowerCase()]||'#94A3B8';const eClC=['blanco','white','beige','amarillo'].includes((color||'').toLowerCase());return(
                            <tr key={color} style={{background:idx%2===0?'transparent':'#F8FAFC'}}>
                              <td style={{padding:'6px 10px',fontWeight:600}}><div style={{display:'flex',alignItems:'center',gap:8}}><div style={{width:12,height:12,borderRadius:'50%',background:cCol,border:eClC?'1px solid #CBD5E1':'none',flexShrink:0}}/>{color}</div></td>
                              {tallas.map(t=>{const n=conteo(color,t);return<td key={t} style={{padding:'6px 10px',textAlign:'center',fontWeight:n>0?700:400,color:n>0?'var(--ds-text-primary)':'#CBD5E1'}}>{n>0?n:'—'}</td>;})}
                              <td style={{padding:'6px 10px',textAlign:'center',fontWeight:700,color:'var(--ds-primary-dark)',background:'var(--ds-primary-light)'}}>{totColor(color)}</td>
                            </tr>
                          );})}
                        </tbody>
                        <tfoot><tr style={{borderTop:'2px solid var(--ds-border-light)'}}>
                          <td style={{padding:'6px 10px',fontSize:8,fontWeight:700,color:'var(--ds-text-disabled)',textTransform:'uppercase'}}>Total</td>
                          {tallas.map(t=><td key={t} style={{padding:'6px 10px',textAlign:'center',fontWeight:800,fontSize:12}}>{totTalla(t)}</td>)}
                          <td style={{padding:'6px 10px',textAlign:'center',fontSize:15,fontWeight:900,color:'#fff',background:'var(--ds-primary)'}}>{gran}</td>
                        </tr></tfoot>
                      </table>
                    </div>
                  </div>
                );})()}
                <div style={{marginBottom:14}}><div style={{fontSize:8,fontWeight:700,color:'var(--ds-text-disabled)',textTransform:'uppercase',letterSpacing:'.5px',marginBottom:8}}>Tienda destino</div>
                  <div style={{background:'var(--ds-bg-surface-2)',borderRadius:8,padding:'10px 14px',border:'1px solid var(--ds-border-light)',display:'flex',gap:16,alignItems:'center'}}>
                    <div style={{flex:1}}><div style={{fontSize:13,fontWeight:600,color:'var(--ds-text-primary)'}}>{tag.tienda?.nombre||'—'}</div>{(tag.tienda?.ciudad||tag.tienda?.estado)&&<div style={{fontSize:10,color:'var(--ds-text-muted)',marginTop:2}}>{[tag.tienda?.ciudad,tag.tienda?.estado].filter(Boolean).join(', ')}</div>}</div>
                    <div style={{textAlign:'center'}}><div style={{fontSize:9,color:'var(--ds-text-disabled)',textTransform:'uppercase',marginBottom:2}}>Bahía</div><div style={{fontSize:14,fontWeight:800,color:'var(--ds-zona-auditoria)'}}>{(tag.tienda?.bahia_asignada||'—').replace('BAHIA-','B-')}</div></div>
                  </div>
                </div>
                <div style={{marginBottom:14}}><div style={{fontSize:8,fontWeight:700,color:'var(--ds-text-disabled)',textTransform:'uppercase',letterSpacing:'.5px',marginBottom:8}}>Estatus</div>
                  <div style={{display:'flex',gap:8}}>
                    <div style={{flex:1,padding:'8px 12px',borderRadius:8,background:tag.qa_fallido?'var(--ds-rojo-bg)':'var(--ds-verde-bg)',border:`1px solid ${tag.qa_fallido?'var(--ds-rojo-border)':'var(--ds-verde-border)'}`,textAlign:'center'}}>
                      <div style={{fontSize:16,marginBottom:2}}>{tag.qa_fallido?'✗':'✓'}</div>
                      <div style={{fontSize:10,fontWeight:700,color:tag.qa_fallido?'var(--ds-rojo-text)':'var(--ds-verde-text)'}}>{tag.qa_fallido?'QA Falló':'Calidad OK'}</div>
                      {tag.qa_fallido&&tag.qa_motivo_fallo&&<div style={{fontSize:8,color:'var(--ds-rojo-text)',marginTop:2}}>{tag.qa_motivo_fallo}</div>}
                    </div>
                    <div style={{flex:1,padding:'8px 12px',borderRadius:8,background:['ENVIO','COMPLETADO'].includes(tag.etapa_actual)?'var(--ds-verde-bg)':'#F8FAFC',border:`1px solid ${['ENVIO','COMPLETADO'].includes(tag.etapa_actual)?'var(--ds-verde-border)':'var(--ds-border-light)'}`,textAlign:'center'}}>
                      <div style={{fontSize:16,marginBottom:2}}>{['ENVIO','COMPLETADO'].includes(tag.etapa_actual)?'✓':'·'}</div>
                      <div style={{fontSize:10,fontWeight:700,color:['ENVIO','COMPLETADO'].includes(tag.etapa_actual)?'var(--ds-verde-text)':'#64748B'}}>{['ENVIO','COMPLETADO'].includes(tag.etapa_actual)?'Entregado':'Pendiente'}</div>
                    </div>
                    <div style={{flex:1,padding:'8px 12px',borderRadius:8,background:'var(--ds-bg-surface-2)',border:'1px solid var(--ds-border-light)',textAlign:'center'}}>
                      <div style={{fontSize:14,fontWeight:800,color:ETAPA_COLORS[tag.etapa_actual]||'#94A3B8',marginBottom:2}}>{ETAPA_LABELS[tag.etapa_actual]||tag.etapa_actual}</div>
                      <div style={{fontSize:9,color:'var(--ds-text-disabled)'}}>etapa actual</div>
                    </div>
                  </div>
                </div>
                <div style={{fontSize:8,color:'#CBD5E1',textAlign:'center'}}>EPC: <code style={{fontSize:8}}>{tag.epc}</code></div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
