import { useState, useEffect } from 'react';

const ETAPAS_ORDEN = ['PREREGISTRO','QA','REGISTRO','SORTER','BAHIA','AUDITORIA','ENVIO'];
const ETAPA_LABELS = { PREREGISTRO:'Pre-registro', QA:'QA', REGISTRO:'Registro', SORTER:'Sorter', BAHIA:'Bahías', AUDITORIA:'Auditoría', ENVIO:'Envío' };
const ETAPA_COLORS = { PREREGISTRO:'#2563EB', QA:'#059669', REGISTRO:'#D97706', SORTER:'#7C3AED', BAHIA:'#0891B2', AUDITORIA:'#DB2777', ENVIO:'#16A34A' };
const COLORES_CSS = { azul:'#3B82F6',rojo:'#EF4444',verde:'#22C55E',negro:'#1E293B',blanco:'#F8FAFC',amarillo:'#EAB308',rosa:'#EC4899',gris:'#94A3B8','café':'#92400E',cafe:'#92400E',naranja:'#F97316',morado:'#8B5CF6',beige:'#D4B896','azul oscuro':'#1E3A8A','azul marino':'#1E3A8A' };
function getColorCSS(c) { return COLORES_CSS[(c||'').toLowerCase()]||'#94A3B8'; }
function formatHora(ts) { return ts ? new Date(ts).toLocaleTimeString('es-MX',{hour:'2-digit',minute:'2-digit',hour12:false}) : '—'; }
function formatDur(min) { return !min?'—':min>=60?`${Math.floor(min/60)}h ${min%60}min`:`${min}min`; }

export default function ModalResumenOC({ oc, onClose }) {
  if (!oc) return null;
  const tags=oc.tags||[], etapaLogs=oc.etapa_logs||[], total=oc.totalPrepacks||tags.length;
  const esperados=oc.total_esperados||total, faltantes=oc.faltantes||0;
  const colorPrincipal=tags[0]?.color||'';
  const colorCSS=getColorCSS(colorPrincipal);
  const esClaro=['blanco','white','beige','amarillo','yellow'].includes(colorPrincipal.toLowerCase());
  const nl=(oc.nombre||'').toLowerCase();
  const esP=nl.includes('pantalon')||nl.includes('jean')||nl.includes('denim')||nl.includes('jogger')||nl.includes('chino')||nl.includes('short')||nl.includes('falda');
  const svgPath=esP?'M10 8L14 8L19 26L16 26L16 18L16 26L13 26L18 8Z':'M10 4L5 10L9 12L9 26L23 26L23 12L27 10L22 4C21 6 18.5 7.5 16 7.5C13.5 7.5 11 6 10 4Z';

  function getM(eId) {
    const te=tags.filter(t=>t.etapa_actual===eId),n=te.length,err=te.filter(t=>t.qa_fallido).length,ok=n-err;
    const log=etapaLogs.find(l=>l.etapa===eId), enCurso=log&&!log.timestamp_salida;
    const dur=log?.timestamp_salida?Math.round((new Date(log.timestamp_salida)-new Date(log.timestamp_entrada))/60000):null;
    // Usar prepacks_entrada del log si no hay tags activos en esta etapa (ya pasaron)
    const nEfectivo = n > 0 ? n : (log?.prepacks_entrada || 0);
    const pct=total>0?Math.round((nEfectivo/total)*100):0;
    const pctOk=nEfectivo>0?Math.round((ok>0?ok:nEfectivo-err)/nEfectivo*100):100;
    return {n:nEfectivo,err,ok:nEfectivo-err,pct,pctOk,log,enCurso,dur};
  }

  useEffect(()=>{const h=e=>{if(e.key==='Escape')onClose();};document.addEventListener('keydown',h);document.body.style.overflow='hidden';return()=>{document.removeEventListener('keydown',h);document.body.style.overflow='';};}, [onClose]);

  return (
    <div onClick={onClose} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.52)',zIndex:500,display:'flex',alignItems:'flex-start',justifyContent:'center',overflow:'auto',padding:'28px 20px'}}>
      <div onClick={e=>e.stopPropagation()} style={{width:'100%',maxWidth:860,background:'var(--ds-bg-surface)',borderRadius:14,boxShadow:'0 24px 64px rgba(0,0,0,0.22)',marginBottom:32,animation:'ds-entrada-modal .22s ease'}}>

        {/* HEADER */}
        <div style={{padding:'20px 26px',borderBottom:'1px solid var(--ds-border-light)',display:'flex',gap:18,alignItems:'flex-start'}}>
          <div style={{width:72,height:72,borderRadius:10,flexShrink:0,background:colorCSS,border:esClaro?'2px solid #E2E8F0':'none',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 2px 10px rgba(0,0,0,0.15)'}}>
            <svg viewBox="0 0 32 32" width={48} height={48} fill="none"><path d={svgPath} fill={esClaro?'rgba(0,0,0,0.12)':'rgba(255,255,255,0.22)'} stroke={esClaro?'rgba(0,0,0,0.2)':'rgba(255,255,255,0.5)'} strokeWidth={1}/></svg>
          </div>
          <div style={{flex:1}}>
            <div style={{display:'flex',gap:5,flexWrap:'wrap',marginBottom:8}}>
              {oc.etapasActivas?.map(e=><span key={e} style={{fontSize:9,fontWeight:700,padding:'2px 8px',borderRadius:100,background:`${ETAPA_COLORS[e]}18`,color:ETAPA_COLORS[e],border:`1px solid ${ETAPA_COLORS[e]}44`}}>{ETAPA_LABELS[e]}</span>)}
              {oc.hasErr&&<span style={{fontSize:9,fontWeight:700,padding:'2px 8px',borderRadius:100,background:'#FEE2E2',color:'#991B1B'}}>⚠ Requiere atención</span>}
            </div>
            <div style={{fontSize:20,fontWeight:700,color:'var(--ds-text-primary)',marginBottom:4}}>{oc.nombre}</div>
            <div style={{fontSize:11,color:'var(--ds-text-disabled)'}}>{oc.ordenId} · {oc.proveedor} · {total} prepacks{faltantes>0&&<span style={{color:'var(--ds-rojo)',fontWeight:700,marginLeft:6}}>· {faltantes} faltantes</span>}</div>
            <div style={{display:'flex',alignItems:'center',gap:6,marginTop:6}}>
              <div style={{width:16,height:16,borderRadius:'50%',background:colorCSS,border:esClaro?'1px solid #CBD5E1':'none',flexShrink:0}}/>
              <span style={{fontSize:10,color:'#64748B'}}>Color principal: <strong>{colorPrincipal||'—'}</strong></span>
            </div>
          </div>
          <button onClick={onClose} style={{background:'none',border:'1px solid var(--ds-border-light)',borderRadius:6,width:32,height:32,cursor:'pointer',fontSize:18,color:'var(--ds-text-disabled)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>×</button>
        </div>

        {/* MÉTRICAS POR ETAPA */}
        <div style={{padding:'20px 26px',borderBottom:'1px solid var(--ds-border-light)'}}>
          <div style={{fontSize:9,fontWeight:700,color:'var(--ds-text-disabled)',textTransform:'uppercase',letterSpacing:'.6px',marginBottom:14}}>Recorrido completo — métricas por etapa</div>
          <div style={{display:'flex',gap:8,overflowX:'auto',paddingBottom:4}}>
            {ETAPAS_ORDEN.map(eId=>{
              const {n,err,ok,pct,pctOk,log,enCurso,dur}=getM(eId);
              if(n===0&&!log&&!oc.etapasActivas?.includes(eId)) return null;
              const color=ETAPA_COLORS[eId];
              return(
                <div key={eId} style={{minWidth:120,flexShrink:0,border:`1.5px solid ${enCurso?color:`${color}44`}`,borderTop:`4px solid ${color}`,borderRadius:10,padding:'10px 12px',background:enCurso?`${color}08`:'#fff'}}>
                  <div style={{fontSize:9,fontWeight:700,color,textTransform:'uppercase',letterSpacing:'.3px',marginBottom:6}}>
                    {ETAPA_LABELS[eId]}
                    {enCurso&&<span style={{marginLeft:4,fontSize:8,fontWeight:700,color:'var(--ds-verde)',background:'var(--ds-verde-bg)',padding:'1px 4px',borderRadius:3}}>EN CURSO</span>}
                  </div>
                  <div style={{fontSize:22,fontWeight:900,color,lineHeight:1,marginBottom:2}}>{pct}%</div>
                  <div style={{fontSize:10,color:'#64748B',marginBottom:8}}>{n} de {total} prepacks</div>
                  {(eId==='QA'||eId==='AUDITORIA')&&<div style={{fontSize:9,color:'#475569',marginBottom:6}}>Calidad: <strong style={{color:pctOk===100?'var(--ds-verde)':'var(--ds-rojo)'}}>{pctOk}%</strong>{err>0&&<span style={{color:'var(--ds-rojo)',marginLeft:4}}>({err} rech.)</span>}</div>}
                  {log&&<div style={{fontSize:8,color:'var(--ds-text-disabled)',lineHeight:1.6,borderTop:'1px solid #F1F5F9',paddingTop:6,marginTop:4}}>
                    <div><span style={{fontWeight:600}}>Entró:</span> {formatHora(log.timestamp_entrada)}</div>
                    {enCurso?<div style={{color:'var(--ds-verde)',fontWeight:600}}>En curso</div>:<div><span style={{fontWeight:600}}>Salió:</span> {formatHora(log.timestamp_salida)}</div>}
                    {dur!==null&&dur>0&&<div><span style={{fontWeight:600}}>Duración:</span> {formatDur(dur)}</div>}
                  </div>}
                </div>
              );
            })}
          </div>
        </div>

        {/* VALIDACIÓN */}
        {faltantes>0&&<div style={{padding:'14px 26px',borderBottom:'1px solid var(--ds-border-light)',background:'var(--ds-amarillo-bg)',borderLeft:'4px solid var(--ds-amarillo)',display:'flex',gap:20,alignItems:'center'}}>
          <div style={{fontSize:22}}>⚠</div>
          <div style={{flex:1}}>
            <div style={{fontSize:11,fontWeight:700,color:'var(--ds-amarillo-text)',marginBottom:2}}>Validación de recepción</div>
            <div style={{fontSize:11,color:'var(--ds-amarillo-text)'}}>Esperados: <strong>{esperados}</strong>. Llegaron: <strong>{total}</strong>. <strong style={{color:'var(--ds-rojo)'}}>Faltan {faltantes}.</strong></div>
          </div>
        </div>}

        {/* PREPACKS */}
        <div style={{padding:'16px 26px'}}>
          <div style={{fontSize:9,fontWeight:700,color:'var(--ds-text-disabled)',textTransform:'uppercase',letterSpacing:'.6px',marginBottom:10}}>Prepacks ({tags.length})</div>
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}>
              <thead><tr style={{background:'var(--ds-bg-surface-2)'}}>
                {['Producto','Tienda','Bahía','Etapa','Estado'].map(h=><th key={h} style={{padding:'5px 10px',textAlign:'left',fontSize:8,fontWeight:700,color:'var(--ds-text-disabled)',textTransform:'uppercase',letterSpacing:'.4px',borderBottom:'1px solid var(--ds-border-light)',whiteSpace:'nowrap'}}>{h}</th>)}
              </tr></thead>
              <tbody>{tags.map(tag=>{
                const prendasTag=tag.prendas&&tag.prendas.length>0?tag.prendas:[{color:tag.color,talla:tag.talla}];
                const colsT=[...new Set(prendasTag.map(p=>p.color))];
                const tallsT=[...new Set(prendasTag.map(p=>p.talla))];
                const err=tag.qa_fallido;
                return <tr key={tag.epc} style={{borderBottom:'1px solid var(--ds-border-light)',background:err?'#FFF5F5':'transparent'}}>
                  <td style={{padding:'4px 10px',fontWeight:600}}>
                    <div style={{display:'flex',alignItems:'center',gap:6,flexWrap:'wrap'}}>
                      {colsT.slice(0,4).map(c=><div key={c} title={c} style={{width:10,height:10,borderRadius:'50%',background:getColorCSS(c),border:'1px solid rgba(0,0,0,0.1)',flexShrink:0}}/>)}
                      <span style={{fontSize:10}}>{colsT.join('/')} · {tallsT.join(',')} · {prendasTag.length}p</span>
                    </div>
                  </td>
                  <td style={{padding:'4px 10px'}}><div style={{fontSize:11}}>{tag.tienda?.nombre||'—'}</div>{tag.tienda?.ciudad&&<div style={{fontSize:9,color:'var(--ds-text-disabled)'}}>{tag.tienda.ciudad}</div>}</td>
                  <td style={{padding:'4px 10px',fontSize:10,color:'var(--ds-text-muted)',whiteSpace:'nowrap'}}>{(tag.tienda?.bahia_asignada||'—').replace('BAHIA-','B-')}</td>
                  <td style={{padding:'4px 10px'}}><span style={{fontSize:9,fontWeight:700,padding:'1px 6px',borderRadius:4,background:`${ETAPA_COLORS[tag.etapa_actual]||'#94A3B8'}18`,color:ETAPA_COLORS[tag.etapa_actual]||'#94A3B8',whiteSpace:'nowrap'}}>{ETAPA_LABELS[tag.etapa_actual]||tag.etapa_actual}</span></td>
                  <td style={{padding:'4px 10px'}}>{err?<span style={{fontSize:9,fontWeight:700,padding:'1px 6px',borderRadius:3,background:'#FEE2E2',color:'#991B1B',whiteSpace:'nowrap'}}>✗ QA</span>:<span style={{fontSize:9,fontWeight:700,padding:'1px 6px',borderRadius:3,background:'#DCFCE7',color:'#15803D',whiteSpace:'nowrap'}}>✓ OK</span>}</td>
                </tr>;
              })}</tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
