import { useState, useEffect } from 'react';
import { api } from '../api/rfidApi';

const ETAPAS_ORDEN = ['PREREGISTRO','QA','REGISTRO','SORTER','BAHIA','AUDITORIA','ENVIO'];
const ETAPA_LABELS = { PREREGISTRO:'Pre-registro', QA:'QA', REGISTRO:'Registro', SORTER:'Sorter', BAHIA:'Bahia', AUDITORIA:'Auditoria', ENVIO:'Envio' };
const ETAPA_COLORS = { PREREGISTRO:'#2563EB', QA:'#059669', REGISTRO:'#D97706', SORTER:'#7C3AED', BAHIA:'#0891B2', AUDITORIA:'#DB2777', ENVIO:'#16A34A' };
const ORDEN_TALLAS = ['XS','S','CH','M','G','L','XL','XXL'];

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

export default function ModalOC({ ordenId, onClose, onVerHistorial }) {
  const [palet, setPalet] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [expandido, setExpandido] = useState(null);

  useEffect(() => { api.getPalet(ordenId).then(d=>{setPalet(d);setCargando(false);}).catch(()=>setCargando(false)); }, [ordenId]);
  useEffect(() => {
    const h = e => { if(e.key==='Escape') onClose(); };
    document.addEventListener('keydown',h); document.body.style.overflow='hidden';
    return () => { document.removeEventListener('keydown',h); document.body.style.overflow=''; };
  }, [onClose]);

  const tags = palet?.tags||[];
  const etapaLogs = palet?.etapa_logs||[];
  const nombre = palet?.nombre_producto||palet?.orden?.nombre_producto||palet?.orden?.modelo||ordenId;
  const etapasActuales = ETAPAS_ORDEN.filter(e => tags.some(t => t.etapa_actual===e));
  const fallidos = tags.filter(t => t.qa_fallido);
  const tieneErr = fallidos.length>0 || etapaLogs.some(l => l.tiene_anomalia);

  const tagsOk = tags.filter(t => !t.qa_fallido);
  const colores = [...new Set(tagsOk.map(t=>t.color))].sort();
  const tallas = [...new Set(tagsOk.map(t=>t.talla))].sort((a,b)=>(ORDEN_TALLAS.indexOf(a)===-1?99:ORDEN_TALLAS.indexOf(a))-(ORDEN_TALLAS.indexOf(b)===-1?99:ORDEN_TALLAS.indexOf(b)));
  const conteo = (c,t) => tagsOk.filter(x=>x.color===c&&x.talla===t).length;
  const totColor = c => tagsOk.filter(x=>x.color===c).length;
  const totTalla = t => tagsOk.filter(x=>x.talla===t).length;

  const bahiasOC = Array.from({length:10},(_,i)=>{
    const id=`BAHIA-${i+1}`; const enB=tags.filter(t=>t.tienda?.bahia_asignada===id); return {n:i+1,id,total:enB.length};
  }).filter(b=>b.total>0);

  const tagsSorted = [...tags].sort((a,b)=>{
    if(a.qa_fallido&&!b.qa_fallido) return -1; if(!a.qa_fallido&&b.qa_fallido) return 1;
    const ae=(a.anomalias?.length||0)>0, be=(b.anomalias?.length||0)>0;
    if(ae&&!be) return -1; if(!ae&&be) return 1; return 0;
  });

  const td={padding:'8px 14px',borderBottom:'1px solid #F1F5F9',fontSize:12};
  const th={padding:'8px 14px',fontSize:9,fontWeight:700,color:'#94A3B8',textTransform:'uppercase',letterSpacing:'.4px',background:'#F8FAFC',borderBottom:'1px solid var(--ds-border-light)'};

  return (
    <div onClick={onClose} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.52)',zIndex:500,display:'flex',alignItems:'flex-start',justifyContent:'center',overflow:'auto',padding:'32px 20px'}}>
      <div onClick={e=>e.stopPropagation()} style={{width:'100%',maxWidth:920,background:'#fff',borderRadius:14,boxShadow:'0 24px 64px rgba(0,0,0,0.22)',marginBottom:32,animation:'ds-entrada-modal .22s ease'}}>

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
            <div style={{fontSize:20,fontWeight:700,color:'#0F172A',marginBottom:4}}>{cargando?'...':nombre}</div>
            <div style={{fontSize:11,color:'#94A3B8'}}>{ordenId} · {palet?.pedido?.proveedor?.nombre||''} · {tags.length} prepacks</div>
          </div>
          <button onClick={onClose} style={{background:'none',border:'1px solid var(--ds-border-light)',borderRadius:6,width:32,height:32,cursor:'pointer',fontSize:18,color:'#94A3B8',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>×</button>
        </div>

        {cargando?<div style={{padding:60,textAlign:'center',color:'#94A3B8'}}>Cargando detalle...</div>
        :!palet?<div style={{padding:60,textAlign:'center',color:'#EF4444'}}>No se pudo cargar la orden.</div>
        :<>
          {/* TABLA COLOR x TALLA */}
          <div style={{padding:'20px 26px',borderBottom:'1px solid var(--ds-border-light)'}}>
            <div style={{fontSize:9,fontWeight:700,color:'#94A3B8',textTransform:'uppercase',letterSpacing:'.6px',marginBottom:12}}>Contenido — tabla color × talla</div>
            {tagsOk.length===0?<div style={{fontSize:13,color:'#94A3B8'}}>Sin prepacks activos.</div>:(
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
                    <td style={{...td,fontSize:9,fontWeight:700,color:'#94A3B8',textTransform:'uppercase'}}>Total</td>
                    {tallas.map(t=><td key={t} style={{...td,textAlign:'center',fontWeight:800,fontSize:13}}>{totTalla(t)}</td>)}
                    <td style={{...td,textAlign:'center',fontSize:16,fontWeight:900,background:'var(--ds-primary)',color:'#fff'}}>{tagsOk.length}</td>
                  </tr></tfoot>
                </table>
              </div>
            )}
            {fallidos.length>0&&<div style={{marginTop:8,fontSize:11,color:'#991B1B'}}>⚠ {fallidos.length} prepack{fallidos.length>1?'s':''} excluido{fallidos.length>1?'s':''} por QA.</div>}
          </div>

          {/* HISTORIAL GENERAL — consolidado, una línea por etapa */}
          {etapaLogs.length>0&&(
            <div style={{padding:'20px 26px',borderBottom:'1px solid var(--ds-border-light)'}}>
              <div style={{fontSize:9,fontWeight:700,color:'#94A3B8',textTransform:'uppercase',letterSpacing:'.6px',marginBottom:14}}>Historial del cargamento</div>
              {(()=>{
                const logsC = consolidarHistorial(etapaLogs);
                if(logsC.length===0) return <div style={{fontSize:12,color:'#94A3B8'}}>Sin historial registrado.</div>;
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
                              <div style={{fontSize:10,color:'#64748B',fontWeight:600}}>{formatHora(log.timestamp_entrada)}</div>
                              <div style={{fontSize:10,color:enCurso?'var(--ds-verde)':'#94A3B8',fontWeight:enCurso?700:400}}>{enCurso?'en curso':`→ ${formatHora(log.timestamp_salida)}`}</div>
                              {dur!==null&&dur>0&&<div style={{fontSize:9,color:'#94A3B8',marginTop:2}}>{formatDur(dur)}</div>}
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
              <div style={{fontSize:9,fontWeight:700,color:'#94A3B8',textTransform:'uppercase',letterSpacing:'.6px',marginBottom:12}}>Distribucion en bahias</div>
              <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                {bahiasOC.map(b=>(
                  <div key={b.id} style={{border:'1.5px solid var(--ds-zona-auditoria-border)',borderLeft:'4px solid var(--ds-zona-auditoria)',borderRadius:8,padding:'8px 14px',background:'var(--ds-zona-auditoria-bg)',minWidth:100}}>
                    <div style={{fontSize:9,fontWeight:700,color:'#7C3AED',textTransform:'uppercase',marginBottom:2}}>Bahia {b.n}</div>
                    <div style={{fontSize:18,fontWeight:800,color:'#0F172A',lineHeight:1}}>{b.total}</div>
                    <div style={{fontSize:9,color:'#94A3B8',marginTop:1}}>prepacks</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PREPACKS */}
          <div style={{padding:'20px 26px'}}>
            <div style={{fontSize:9,fontWeight:700,color:'#94A3B8',textTransform:'uppercase',letterSpacing:'.6px',marginBottom:12}}>
              Prepacks ({tags.length}){fallidos.length>0&&<span style={{color:'#991B1B',marginLeft:8}}>· {fallidos.length} rechazado{fallidos.length>1?'s':''} en QA</span>}
            </div>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
              <thead><tr style={{background:'#F8FAFC'}}>
                {['Producto','Tienda destino','Bahia','Etapa','Estado',''].map(h=><th key={h} style={{...th,textAlign:'left'}}>{h}</th>)}
              </tr></thead>
              <tbody>
                {tagsSorted.map(tag=>{
                  const tieneAnomalia=(tag.anomalias?.length||0)>0;
                  const isExp=expandido===tag.epc;
                  return[
                    <tr key={tag.epc} onDoubleClick={()=>setExpandido(isExp?null:tag.epc)} style={{borderBottom:'1px solid var(--ds-border-light)',cursor:'pointer',background:tag.qa_fallido?'#FFF5F5':tieneAnomalia?'#FFFBEB':'transparent'}}>
                      <td style={{...td,fontWeight:500}}>{tag.color} {tag.talla}</td>
                      <td style={{...td,fontSize:11}}>{tag.tienda?.nombre||tag.tienda_id||'—'}{tag.tienda?.ciudad&&<div style={{fontSize:10,color:'#64748B',marginTop:1}}>{tag.tienda.ciudad}{tag.tienda.estado_rep?`, ${tag.tienda.estado_rep}`:''}</div>}</td>
                      <td style={{...td,fontSize:11,color:'#94A3B8'}}>{tag.tienda?.bahia_asignada||'—'}</td>
                      <td style={td}><span style={{fontSize:10,fontWeight:600,padding:'2px 7px',borderRadius:4,background:`${ETAPA_COLORS[tag.etapa_actual]||'#94A3B8'}18`,color:ETAPA_COLORS[tag.etapa_actual]||'#94A3B8'}}>{ETAPA_LABELS[tag.etapa_actual]||tag.etapa_actual}</span></td>
                      <td style={td}>{(()=>{const{presente,entregado,calidadOk}=calcEstatusPrepack(tag);return(
                        <div style={{display:'flex',flexDirection:'column',gap:2}}>
                          <span style={{fontSize:9,fontWeight:700,padding:'1px 6px',borderRadius:3,display:'inline-block',background:presente?'#DCFCE7':'#FEE2E2',color:presente?'#14532D':'#7F1D1D'}}>{presente?'✓ Presente':'✗ Ausente'}</span>
                          <span style={{fontSize:9,fontWeight:700,padding:'1px 6px',borderRadius:3,display:'inline-block',background:entregado?'#DCFCE7':'#F1F5F9',color:entregado?'#14532D':'#64748B'}}>{entregado?'✓ Entregado':'· Pendiente'}</span>
                          <span style={{fontSize:9,fontWeight:700,padding:'1px 6px',borderRadius:3,display:'inline-block',background:calidadOk?'#DCFCE7':'#FEE2E2',color:calidadOk?'#14532D':'#7F1D1D'}}>{calidadOk?'✓ QA OK':'✗ QA Falló'}</span>
                        </div>);})()}</td>
                      <td style={td}><button onClick={e=>{e.stopPropagation();onClose();onVerHistorial(tag.epc);}} style={{background:'none',border:'1px solid var(--ds-border-light)',borderRadius:4,padding:'3px 9px',fontSize:10,cursor:'pointer',color:'var(--ds-primary)'}}>Historial</button></td>
                    </tr>,
                    isExp&&<tr key={`${tag.epc}-d`}><td colSpan={6} style={{padding:'16px 20px',background:'var(--ds-primary-light)',borderBottom:'1px solid var(--ds-border-light)'}}>
                      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px 24px',marginBottom:14,fontSize:12}}>
                        <div><span style={{fontSize:9,color:'var(--ds-primary-dark)',fontWeight:700,textTransform:'uppercase'}}>Producto</span><div style={{fontWeight:600,color:'#0F172A',marginTop:2}}>{tag.color} {tag.talla}</div></div>
                        <div><span style={{fontSize:9,color:'var(--ds-primary-dark)',fontWeight:700,textTransform:'uppercase'}}>Tienda destino</span><div style={{fontWeight:600,color:'#0F172A',marginTop:2}}>{tag.tienda?.nombre||'—'}{tag.tienda?.ciudad&&<span style={{fontWeight:400,color:'#64748B'}}> — {tag.tienda.ciudad}{tag.tienda.estado_rep?`, ${tag.tienda.estado_rep}`:''}</span>}</div></div>
                        <div><span style={{fontSize:9,color:'var(--ds-primary-dark)',fontWeight:700,textTransform:'uppercase'}}>Tipo de flujo</span><div style={{marginTop:2}}>{tag.tipo_flujo||'—'}</div></div>
                        <div><span style={{fontSize:9,color:'var(--ds-primary-dark)',fontWeight:700,textTransform:'uppercase'}}>Piezas en prepack</span><div style={{fontWeight:700,fontSize:15,color:'#0F172A',marginTop:2}}>{tag.cantidad_piezas||'—'}</div></div>
                        <div><span style={{fontSize:9,color:'var(--ds-primary-dark)',fontWeight:700,textTransform:'uppercase'}}>EPC</span><code style={{fontSize:10,color:'#64748B',marginTop:2,display:'block'}}>{tag.epc}</code></div>
                        <div><span style={{fontSize:9,color:'var(--ds-primary-dark)',fontWeight:700,textTransform:'uppercase'}}>Bahía asignada</span><div style={{fontWeight:600,color:'var(--ds-zona-auditoria)',marginTop:2}}>{tag.tienda?.bahia_asignada||'—'}</div></div>
                        {tag.qa_fallido&&<div style={{gridColumn:'1/-1',background:'var(--ds-rojo-bg)',borderRadius:6,padding:'8px 12px',border:'1px solid var(--ds-rojo-border)'}}><strong style={{color:'var(--ds-rojo-text)'}}>Rechazado en QA: </strong><span style={{color:'var(--ds-rojo-text)'}}>{tag.qa_motivo_fallo||'Sin motivo registrado'}</span></div>}
                      </div>
                      <div style={{borderTop:'1px solid var(--ds-primary-border)',paddingTop:12}}>
                        <div style={{fontSize:9,fontWeight:700,color:'var(--ds-primary-dark)',textTransform:'uppercase',letterSpacing:'.5px',marginBottom:10}}>Recorrido de este prepack</div>
                        {(()=>{const logsC=consolidarHistorial(etapaLogs);if(logsC.length===0)return<div style={{fontSize:11,color:'#94A3B8'}}>Sin historial disponible.</div>;return(
                          <div style={{display:'flex',alignItems:'flex-start',gap:0,overflowX:'auto'}}>
                            {logsC.map((log,idx)=>{const color=ETAPA_COLORS[log.etapa]||'#94A3B8';const enCurso=!log.timestamp_salida;const dur=log.timestamp_salida?Math.round((new Date(log.timestamp_salida)-new Date(log.timestamp_entrada))/60000):null;return(
                              <div key={log.etapa} style={{display:'flex',alignItems:'flex-start'}}>
                                {idx>0&&<div style={{width:20,height:2,background:'var(--ds-primary-border)',marginTop:16,flexShrink:0}}/>}
                                <div style={{width:84,textAlign:'center',flexShrink:0}}>
                                  <div style={{width:32,height:32,borderRadius:'50%',background:enCurso?color:`${color}18`,border:`2px solid ${color}`,margin:'0 auto 5px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,color:enCurso?'#fff':color}}>{enCurso?'●':'✓'}</div>
                                  <div style={{fontSize:8,fontWeight:700,color:'#334155',textTransform:'uppercase',letterSpacing:'.2px',marginBottom:2}}>{ETAPA_LABELS[log.etapa]}</div>
                                  <div style={{fontSize:9,color:'#64748B',fontWeight:600}}>{formatHora(log.timestamp_entrada)}</div>
                                  <div style={{fontSize:9,color:enCurso?'var(--ds-verde)':'#94A3B8'}}>{enCurso?'en curso':formatHora(log.timestamp_salida)}</div>
                                  {dur!==null&&dur>0&&<div style={{fontSize:8,color:'#94A3B8',marginTop:1}}>{formatDur(dur)}</div>}
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
    </div>
  );
}
