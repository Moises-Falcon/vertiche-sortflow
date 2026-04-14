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

// ─── Datos estáticos de demo ────────────────────────────────────────────────

const _t = (n,c,s,b,ci,e) => ({epc:`DEMO-${Math.random().toString(36).slice(2,8)}`,color:n,talla:c,qa_fallido:false,etapa_actual:s,tienda:{nombre:`Vértice ${b}`,ciudad:ci,estado:e,bahia_asignada:`BAHIA-${Math.ceil(Math.random()*10)}`}});
const _te = (n,c,s,b,ci,e) => ({..._t(n,c,s,b,ci,e),qa_fallido:true});

function ts(horaBase, minutosOffset=0) {
  const d=new Date(); d.setHours(Math.floor(horaBase),(horaBase%1)*60+minutosOffset,0,0); return d.toISOString();
}
function mkLog(etapa,hE,hS=null,pE=0,pS=null) {
  return {etapa,timestamp_entrada:ts(hE),timestamp_salida:hS!==null?ts(hS):null,prepacks_entrada:pE,prepacks_salida:pS!==null?pS:pE,tiene_anomalia:false,notas:''};
}
const _oc = (id,nom,prov,etapas,extra={}) => {
  const tagsPorEtapa = {PREREGISTRO:[],QA:[],REGISTRO:[],SORTER:[],BAHIA:[],AUDITORIA:[],ENVIO:[],COMPLETADO:[]};
  const allTags = [];
  Object.entries(etapas).forEach(([e,tags])=>{tagsPorEtapa[e]=tags;allTags.push(...tags);});
  const etapasActivas = ETAPAS_FLUJO.map(e=>e.id).filter(e=>tagsPorEtapa[e]?.length>0);
  const idxMin = etapasActivas.length>0?Math.min(...etapasActivas.map(e=>ETAPA_IDX[e]??99)):0;
  const idxMax = etapasActivas.length>0?Math.max(...etapasActivas.map(e=>ETAPA_IDX[e]??0)):0;
  const comp = allTags.filter(t=>['ENVIO','COMPLETADO'].includes(t.etapa_actual)).length;
  return {ordenId:id,nombre:nom,proveedor:prov,totalPrepacks:allTags.length,pct:allTags.length>0?(comp/allTags.length)*100:0,hasErr:allTags.some(t=>t.qa_fallido),tags:allTags,tagsPorEtapa,etapasActivas,idxMin,idxMax,
    etapa_logs:extra.etapa_logs||[],total_esperados:extra.total_esperados||allTags.length,total_recibidos:extra.total_recibidos||allTags.length,faltantes:extra.faltantes||0};
};

const DEMO_KPI = {
  mejora_porcentaje: 30.6,
  objetivo_mejora_pct: 32,
  tiempo_promedio_hoy_min: 125,
  palets_activos: 25,
  palets_completados_hoy: 8,
};

const DEMO_OCS = [
  _oc('OC-001','Playera Básica Manga Corta','Textiles Monterrey SA',{PREREGISTRO:[_t('Azul','M','PREREGISTRO','Monterrey Centro','Monterrey','NL'),_t('Azul','L','PREREGISTRO','Monterrey Sur','Monterrey','NL'),_t('Negro','S','PREREGISTRO','San Pedro','San Pedro','NL'),_t('Negro','M','PREREGISTRO','Guadalajara','Guadalajara','JAL'),_t('Blanco','XS','PREREGISTRO','CDMX Polanco','CDMX','CDMX'),_t('Blanco','S','PREREGISTRO','CDMX Roma','CDMX','CDMX'),_t('Rojo','M','PREREGISTRO','Puebla','Puebla','PUE'),_t('Rojo','L','PREREGISTRO','Querétaro','Querétaro','QRO')]},{etapa_logs:[mkLog('PREREGISTRO',9.5,null,8,null)]}),
  _oc('OC-002','Pantalón Cargo Denim Slim','Confecciones del Norte',{PREREGISTRO:[_t('Azul','28','PREREGISTRO','Hermosillo','Hermosillo','SON'),_t('Azul','30','PREREGISTRO','Culiacán','Culiacán','SIN'),_t('Negro','32','PREREGISTRO','Tijuana','Tijuana','BC'),_t('Negro','34','PREREGISTRO','Mexicali','Mexicali','BC'),_t('Café','30','PREREGISTRO','Ensenada','Ensenada','BC'),_t('Café','32','PREREGISTRO','La Paz','La Paz','BCS')]},{etapa_logs:[mkLog('PREREGISTRO',9.75,null,6,null)]}),
  _oc('OC-003','Blusa Fluida Manga Larga','Moda Express MX',{PREREGISTRO:[_t('Blanco','S','PREREGISTRO','Monterrey Centro','Monterrey','NL'),_t('Blanco','M','PREREGISTRO','San Pedro','San Pedro','NL'),_t('Rosa','S','PREREGISTRO','Guadalajara','Guadalajara','JAL'),_t('Rosa','M','PREREGISTRO','CDMX Polanco','CDMX','CDMX'),_t('Azul','L','PREREGISTRO','Puebla','Puebla','PUE')]},{total_esperados:7,total_recibidos:5,faltantes:2,etapa_logs:[mkLog('PREREGISTRO',10.0,null,5,null)]}),
  _oc('OC-004','Chamarra Impermeable Sport','ActiveWear CDMX',{PREREGISTRO:[_t('Negro','M','PREREGISTRO','Monterrey Norte','Monterrey','NL'),_t('Negro','L','PREREGISTRO','Saltillo','Saltillo','COAH'),_t('Gris','M','PREREGISTRO','Torreón','Torreón','COAH'),_t('Gris','XL','PREREGISTRO','Durango','Durango','DGO')]},{etapa_logs:[mkLog('PREREGISTRO',10.25,null,4,null)]}),
  _oc('OC-005','Vestido Casual Verano','Diseños Guadalajara',{PREREGISTRO:[_t('Verde','S','PREREGISTRO','Monterrey Centro','Monterrey','NL'),_t('Verde','M','PREREGISTRO','San Pedro','San Pedro','NL')],QA:[_t('Amarillo','S','QA','Guadalajara','Guadalajara','JAL'),_t('Amarillo','M','QA','Zapopan','Zapopan','JAL'),_t('Azul','S','QA','CDMX Polanco','CDMX','CDMX'),_t('Azul','M','QA','CDMX Roma','CDMX','CDMX'),_t('Blanco','L','QA','Puebla','Puebla','PUE')]},{etapa_logs:[mkLog('PREREGISTRO',8.5,9.0,7,7),mkLog('QA',9.0,null,7,null)]}),
  _oc('OC-006','Polo Piqué Hombre','Textiles Monterrey SA',{QA:[_te('Azul','M','QA','Hermosillo','Hermosillo','SON'),_t('Azul','L','QA','Culiacán','Culiacán','SIN'),_t('Blanco','S','QA','Tijuana','Tijuana','BC'),_t('Blanco','M','QA','Mexicali','Mexicali','BC'),_t('Negro','L','QA','Ensenada','Ensenada','BC'),_t('Negro','XL','QA','La Paz','La Paz','BCS')]},{total_esperados:8,total_recibidos:6,faltantes:2,etapa_logs:[mkLog('PREREGISTRO',8.25,8.75,6,6),{...mkLog('QA',8.75,null,6,null),tiene_anomalia:true}]}),
  _oc('OC-007','Short Deportivo Running','ActiveWear CDMX',{QA:[_t('Negro','S','QA','Monterrey Centro','Monterrey','NL'),_t('Negro','M','QA','Monterrey Sur','Monterrey','NL'),_t('Azul','S','QA','San Pedro','San Pedro','NL'),_t('Azul','M','QA','Saltillo','Saltillo','COAH'),_t('Rojo','L','QA','Torreón','Torreón','COAH')]},{etapa_logs:[mkLog('PREREGISTRO',8.75,9.25,5,5),mkLog('QA',9.25,null,5,null)]}),
  _oc('OC-008','Playera Estampada Temporada','Estampados MX',{QA:[_t('Blanco','S','QA','Guadalajara','Guadalajara','JAL'),_t('Blanco','M','QA','Zapopan','Zapopan','JAL'),_t('Gris','L','QA','León','León','GTO')],REGISTRO:[_t('Gris','XL','REGISTRO','Irapuato','Irapuato','GTO'),_t('Verde','S','REGISTRO','Celaya','Celaya','GTO'),_t('Verde','M','REGISTRO','Querétaro','Querétaro','QRO'),_t('Azul','L','REGISTRO','SLP','San Luis Potosí','SLP'),_t('Azul','XS','REGISTRO','Aguascalientes','Aguascalientes','AGS')]},{etapa_logs:[mkLog('PREREGISTRO',7.5,8.0,8,8),mkLog('QA',8.0,8.5,8,8),mkLog('REGISTRO',8.5,null,8,null)]}),
  _oc('OC-009','Pantalón Chino Slim Fit','Confecciones del Norte',{REGISTRO:[_t('Beige','30','REGISTRO','Monterrey Centro','Monterrey','NL'),_t('Beige','32','REGISTRO','Monterrey Sur','Monterrey','NL'),_t('Verde','30','REGISTRO','San Pedro','San Pedro','NL'),_t('Verde','34','REGISTRO','Guadalajara','Guadalajara','JAL'),_t('Azul','32','REGISTRO','Zapopan','Zapopan','JAL'),_t('Azul','36','REGISTRO','CDMX Polanco','CDMX','CDMX')]},{etapa_logs:[mkLog('PREREGISTRO',7.75,8.25,6,6),mkLog('QA',8.25,8.75,6,6),mkLog('REGISTRO',8.75,null,6,null)]}),
  _oc('OC-010','Sudadera Hoodie Oversize','Urban Trends MX',{REGISTRO:[_t('Negro','S','REGISTRO','CDMX Roma','CDMX','CDMX'),_t('Negro','M','REGISTRO','CDMX Satélite','CDMX','CDMX'),_t('Gris','M','REGISTRO','Puebla','Puebla','PUE'),_t('Gris','L','REGISTRO','Tlaxcala','Tlaxcala','TLAX'),_t('Azul','XL','REGISTRO','Veracruz','Veracruz','VER'),_t('Azul','XXL','REGISTRO','Xalapa','Xalapa','VER'),_t('Blanco','S','REGISTRO','Oaxaca','Oaxaca','OAX')]},{etapa_logs:[mkLog('PREREGISTRO',7.25,7.75,7,7),mkLog('QA',7.75,8.25,7,7),mkLog('REGISTRO',8.25,null,7,null)]}),
  _oc('OC-011','Camiseta Básica Pack x3','Textiles Monterrey SA',{REGISTRO:[_te('Blanco','S','REGISTRO','Mérida','Mérida','YUC'),_t('Blanco','M','REGISTRO','Cancún','Cancún','QROO'),_t('Negro','S','REGISTRO','Playa Carmen','Playa del Carmen','QROO'),_t('Negro','M','REGISTRO','Campeche','Campeche','CAMP'),_t('Gris','L','REGISTRO','Villahermosa','Villahermosa','TAB')]},{total_esperados:6,total_recibidos:5,faltantes:1,etapa_logs:[mkLog('PREREGISTRO',8.0,8.5,5,5),mkLog('QA',8.5,9.0,5,5),{...mkLog('REGISTRO',9.0,null,5,null),tiene_anomalia:true}]}),
  _oc('OC-012','Blusa Campesina Bordada','Moda Express MX',{REGISTRO:[_t('Blanco','S','REGISTRO','Monterrey Centro','Monterrey','NL'),_t('Blanco','M','REGISTRO','San Pedro','San Pedro','NL'),_t('Rosa','S','REGISTRO','Saltillo','Saltillo','COAH')],SORTER:[_t('Rosa','M','SORTER','Torreón','Torreón','COAH'),_t('Azul','S','SORTER','Durango','Durango','DGO'),_t('Azul','M','SORTER','Chihuahua','Chihuahua','CHIH'),_t('Verde','L','SORTER','Juárez','Ciudad Juárez','CHIH'),_t('Verde','XL','SORTER','Monterrey Norte','Monterrey','NL')]},{etapa_logs:[mkLog('PREREGISTRO',6.5,7.0,8,8),mkLog('QA',7.0,7.5,8,8),mkLog('REGISTRO',7.5,8.0,8,8),mkLog('SORTER',8.0,null,8,null)]}),
  _oc('OC-013','Jean Skinny Mujer','Diseños Guadalajara',{SORTER:[_t('Azul Oscuro','25','SORTER','Guadalajara','Guadalajara','JAL'),_t('Azul Oscuro','27','SORTER','Zapopan','Zapopan','JAL'),_t('Negro','25','SORTER','León','León','GTO'),_t('Negro','27','SORTER','Irapuato','Irapuato','GTO'),_t('Gris','29','SORTER','Celaya','Celaya','GTO'),_t('Gris','31','SORTER','Querétaro','Querétaro','QRO')]},{etapa_logs:[mkLog('PREREGISTRO',6.75,7.25,6,6),mkLog('QA',7.25,7.75,6,6),mkLog('REGISTRO',7.75,8.25,6,6),mkLog('SORTER',8.25,null,6,null)]}),
  _oc('OC-014','Playera Polo Sport','ActiveWear CDMX',{SORTER:[_t('Blanco','M','SORTER','Hermosillo','Hermosillo','SON'),_t('Blanco','L','SORTER','Culiacán','Culiacán','SIN')],BAHIA:[_t('Azul','S','BAHIA','Tijuana','Tijuana','BC'),_t('Azul','M','BAHIA','Mexicali','Mexicali','BC'),_t('Negro','XL','BAHIA','Ensenada','Ensenada','BC')]},{etapa_logs:[mkLog('PREREGISTRO',6.25,6.75,5,5),mkLog('QA',6.75,7.25,5,5),mkLog('REGISTRO',7.25,7.75,5,5),mkLog('SORTER',7.75,null,5,null),mkLog('BAHIA',8.5,null,3,null)]}),
  _oc('OC-015','Shorts Playa Tropical','Estampados MX',{BAHIA:[_t('Azul','S','BAHIA','Monterrey Centro','Monterrey','NL'),_t('Azul','M','BAHIA','Monterrey Sur','Monterrey','NL'),_t('Verde','S','BAHIA','San Pedro','San Pedro','NL'),_t('Verde','M','BAHIA','Guadalajara','Guadalajara','JAL'),_t('Naranja','L','BAHIA','Zapopan','Zapopan','JAL'),_t('Naranja','XL','BAHIA','León','León','GTO'),_t('Rojo','M','BAHIA','CDMX Polanco','CDMX','CDMX')]},{etapa_logs:[mkLog('PREREGISTRO',6.0,6.5,7,7),mkLog('QA',6.5,7.0,7,7),mkLog('REGISTRO',7.0,7.5,7,7),mkLog('SORTER',7.5,8.0,7,7),mkLog('BAHIA',8.0,null,7,null)]}),
  _oc('OC-016','Falda Midi Plisada','Diseños Guadalajara',{SORTER:[_t('Rosa','S','SORTER','CDMX Roma','CDMX','CDMX'),_t('Rosa','M','SORTER','Puebla','Puebla','PUE')],BAHIA:[_t('Beige','S','BAHIA','Querétaro','Querétaro','QRO'),_t('Beige','M','BAHIA','SLP','San Luis Potosí','SLP'),_t('Negro','L','BAHIA','Aguascalientes','Aguascalientes','AGS'),_t('Negro','XL','BAHIA','Zacatecas','Zacatecas','ZAC')]},{etapa_logs:[mkLog('PREREGISTRO',6.25,6.75,6,6),mkLog('QA',6.75,7.25,6,6),mkLog('REGISTRO',7.25,7.75,6,6),mkLog('SORTER',7.75,null,6,null),mkLog('BAHIA',8.25,null,4,null)]}),
  _oc('OC-017','Chamarra Denim Oversize','Urban Trends MX',{BAHIA:[_t('Azul','S','BAHIA','Hermosillo','Hermosillo','SON'),_t('Azul','M','BAHIA','Culiacán','Culiacán','SIN'),_t('Negro','L','BAHIA','Tijuana','Tijuana','BC'),_t('Negro','XL','BAHIA','Mexicali','Mexicali','BC'),_t('Blanco','M','BAHIA','La Paz','La Paz','BCS')]},{etapa_logs:[mkLog('PREREGISTRO',5.75,6.25,5,5),mkLog('QA',6.25,6.75,5,5),mkLog('REGISTRO',6.75,7.25,5,5),mkLog('SORTER',7.25,7.75,5,5),mkLog('BAHIA',7.75,null,5,null)]}),
  _oc('OC-018','Playera Básica Premium','Textiles Monterrey SA',{BAHIA:[_t('Blanco','S','BAHIA','Monterrey Centro','Monterrey','NL'),_t('Blanco','M','BAHIA','San Pedro','San Pedro','NL'),_t('Negro','L','BAHIA','Saltillo','Saltillo','COAH')],AUDITORIA:[_t('Negro','XL','AUDITORIA','Torreón','Torreón','COAH'),_t('Gris','S','AUDITORIA','Chihuahua','Chihuahua','CHIH'),_t('Gris','M','AUDITORIA','Juárez','Ciudad Juárez','CHIH'),_t('Azul','S','AUDITORIA','Durango','Durango','DGO')]},{etapa_logs:[mkLog('PREREGISTRO',5.0,5.5,7,7),mkLog('QA',5.5,6.0,7,7),mkLog('REGISTRO',6.0,6.5,7,7),mkLog('SORTER',6.5,7.0,7,7),mkLog('BAHIA',7.0,null,7,null),mkLog('AUDITORIA',7.75,null,4,null)]}),
  _oc('OC-019','Pantalón Vestir Slim','Confecciones del Norte',{AUDITORIA:[_te('Negro','30','AUDITORIA','Guadalajara','Guadalajara','JAL'),_t('Negro','32','AUDITORIA','Zapopan','Zapopan','JAL'),_t('Gris','30','AUDITORIA','CDMX Polanco','CDMX','CDMX'),_t('Gris','34','AUDITORIA','Puebla','Puebla','PUE'),_t('Azul','32','AUDITORIA','Querétaro','Querétaro','QRO'),_t('Azul','36','AUDITORIA','SLP','San Luis Potosí','SLP')]},{total_esperados:8,total_recibidos:6,faltantes:2,etapa_logs:[mkLog('PREREGISTRO',5.25,5.75,6,6),mkLog('QA',5.75,6.25,6,6),mkLog('REGISTRO',6.25,6.75,6,6),mkLog('SORTER',6.75,7.25,6,6),mkLog('BAHIA',7.25,7.75,6,6),{...mkLog('AUDITORIA',7.75,null,6,null),tiene_anomalia:true}]}),
  _oc('OC-020','Blusa Casual Rayas','Moda Express MX',{AUDITORIA:[_t('Azul','S','AUDITORIA','Hermosillo','Hermosillo','SON'),_t('Azul','M','AUDITORIA','Culiacán','Culiacán','SIN'),_t('Rojo','S','AUDITORIA','Tijuana','Tijuana','BC'),_t('Rojo','M','AUDITORIA','Mexicali','Mexicali','BC'),_t('Blanco','L','AUDITORIA','Ensenada','Ensenada','BC')]},{etapa_logs:[mkLog('PREREGISTRO',5.5,6.0,5,5),mkLog('QA',6.0,6.5,5,5),mkLog('REGISTRO',6.5,7.0,5,5),mkLog('SORTER',7.0,7.5,5,5),mkLog('BAHIA',7.5,8.0,5,5),mkLog('AUDITORIA',8.0,null,5,null)]}),
  _oc('OC-021','Sudadera Crew Neck Básica','Urban Trends MX',{AUDITORIA:[_t('Gris','S','AUDITORIA','Monterrey Norte','Monterrey','NL'),_t('Gris','M','AUDITORIA','Monterrey Sur','Monterrey','NL')],ENVIO:[_t('Negro','S','ENVIO','San Pedro','San Pedro','NL'),_t('Negro','M','ENVIO','Guadalajara','Guadalajara','JAL'),_t('Azul','L','ENVIO','CDMX Polanco','CDMX','CDMX'),_t('Azul','XL','ENVIO','Puebla','Puebla','PUE')]},{etapa_logs:[mkLog('PREREGISTRO',4.75,5.25,6,6),mkLog('QA',5.25,5.75,6,6),mkLog('REGISTRO',5.75,6.25,6,6),mkLog('SORTER',6.25,6.75,6,6),mkLog('BAHIA',6.75,7.25,6,6),mkLog('AUDITORIA',7.25,null,6,null),mkLog('ENVIO',7.75,null,4,null)]}),
  _oc('OC-022','Pantalón Jogger Tech','ActiveWear CDMX',{ENVIO:[_t('Negro','S','ENVIO','Hermosillo','Hermosillo','SON'),_t('Negro','M','ENVIO','Culiacán','Culiacán','SIN'),_t('Gris','L','ENVIO','Tijuana','Tijuana','BC'),_t('Gris','XL','ENVIO','Mexicali','Mexicali','BC'),_t('Azul','M','ENVIO','Ensenada','Ensenada','BC'),_t('Azul','L','ENVIO','La Paz','La Paz','BCS'),_t('Verde','S','ENVIO','Los Cabos','Los Cabos','BCS')]},{etapa_logs:[mkLog('PREREGISTRO',4.0,4.5,7,7),mkLog('QA',4.5,5.0,7,7),mkLog('REGISTRO',5.0,5.5,7,7),mkLog('SORTER',5.5,6.0,7,7),mkLog('BAHIA',6.0,6.75,7,7),mkLog('AUDITORIA',6.75,7.25,7,7),mkLog('ENVIO',7.25,null,7,null)]}),
  _oc('OC-023','Vestido Formal Noche','Diseños Guadalajara',{ENVIO:[_t('Negro','S','ENVIO','Monterrey Centro','Monterrey','NL'),_t('Negro','M','ENVIO','San Pedro','San Pedro','NL'),_t('Rojo','S','ENVIO','Guadalajara','Guadalajara','JAL'),_t('Rojo','M','ENVIO','CDMX Polanco','CDMX','CDMX'),_t('Azul Marino','L','ENVIO','Puebla','Puebla','PUE')]},{etapa_logs:[mkLog('PREREGISTRO',4.25,4.75,5,5),mkLog('QA',4.75,5.25,5,5),mkLog('REGISTRO',5.25,5.75,5,5),mkLog('SORTER',5.75,6.25,5,5),mkLog('BAHIA',6.25,7.0,5,5),mkLog('AUDITORIA',7.0,7.5,5,5),mkLog('ENVIO',7.5,8.0,5,5)]}),
  _oc('OC-024','Playera Manga Larga UV','Textiles Monterrey SA',{ENVIO:[_t('Blanco','S','ENVIO','Querétaro','Querétaro','QRO'),_t('Blanco','M','ENVIO','SLP','San Luis Potosí','SLP'),_te('Azul','S','ENVIO','Aguascalientes','Aguascalientes','AGS'),_t('Azul','M','ENVIO','Zacatecas','Zacatecas','ZAC'),_t('Negro','L','ENVIO','Durango','Durango','DGO'),_t('Negro','XL','ENVIO','Chihuahua','Chihuahua','CHIH')]},{total_esperados:7,total_recibidos:6,faltantes:1,etapa_logs:[mkLog('PREREGISTRO',3.75,4.25,6,6),mkLog('QA',4.25,4.75,6,6),mkLog('REGISTRO',4.75,5.25,6,6),mkLog('SORTER',5.25,5.75,6,6),mkLog('BAHIA',5.75,6.5,6,6),mkLog('AUDITORIA',6.5,7.0,6,6),{...mkLog('ENVIO',7.0,null,6,null),tiene_anomalia:true}]}),
  _oc('OC-025','Short Gym Hombre','ActiveWear CDMX',{AUDITORIA:[_t('Negro','S','AUDITORIA','Mérida','Mérida','YUC'),_t('Negro','M','AUDITORIA','Cancún','Cancún','QROO')],ENVIO:[_t('Azul','S','ENVIO','Playa Carmen','Playa del Carmen','QROO'),_t('Azul','M','ENVIO','Campeche','Campeche','CAMP'),_t('Gris','L','ENVIO','Villahermosa','Villahermosa','TAB')]},{etapa_logs:[mkLog('PREREGISTRO',4.5,5.0,5,5),mkLog('QA',5.0,5.5,5,5),mkLog('REGISTRO',5.5,6.0,5,5),mkLog('SORTER',6.0,6.5,5,5),mkLog('BAHIA',6.5,7.0,5,5),mkLog('AUDITORIA',7.0,null,5,null),mkLog('ENVIO',7.5,null,3,null)]}),
];

// ─── Datos por etapa ────────────────────────────────────────────────────────

function getDatosEtapa(etapaId, tagsEnEtapa, oc) {
  const total=oc.totalPrepacks, n=tagsEnEtapa.length;
  const pct=total>0?Math.round((n/total)*100):0;
  const err=tagsEnEtapa.filter(t=>t.qa_fallido).length, ok=n-err;
  const pctOk=n>0?Math.round((ok/n)*100):100;
  const esp=oc.total_esperados||total;
  const m={
    PREREGISTRO:[{l:'recibidos',v:n},{l:'esperados',v:esp},{l:'%',v:`${pct}%`}],
    QA:[{l:'revisados',v:n},{l:'aprobados',v:ok},{l:'calidad',v:`${pctOk}%`}],
    REGISTRO:[{l:'registrados',v:n},{l:'de',v:total},{l:'avance',v:`${pct}%`}],
    SORTER:[{l:'clasificados',v:n},{l:'total',v:total},{l:'procesado',v:`${pct}%`}],
    BAHIA:[{l:'en bahía',v:n},{l:'total',v:total},{l:'distribuido',v:`${pct}%`}],
    AUDITORIA:[{l:'auditados',v:n},{l:'aprobados',v:ok},{l:'aprobación',v:`${pctOk}%`}],
    ENVIO:[{l:'enviados',v:n},{l:'de',v:total},{l:'completado',v:`${pct}%`}],
  };
  return m[etapaId]||[{l:'prepacks',v:n},{l:'',v:''},{l:'%',v:`${pct}%`}];
}

// ─── BarraOC (fila del Gantt) ───────────────────────────────────────────────

function BarraOC({ oc, columnWidths, onClickSegmento, onClickNombre }) {
  return (
    <div style={{ display:'grid', gridTemplateColumns:columnWidths, width:'100%', minHeight:44, alignItems:'center', borderBottom:'1px solid var(--ds-border-light)' }}>
      <div onClick={e=>{e.stopPropagation();if(onClickNombre)onClickNombre(oc);}} style={{ paddingLeft:12, paddingRight:8, display:'flex', flexDirection:'column', gap:1, position:'sticky', left:0, background:'var(--ds-bg-surface)', zIndex:2, borderRight:'1px solid var(--ds-border-light)', minHeight:44, justifyContent:'center', cursor:'pointer', transition:'background .15s' }} onMouseEnter={e=>e.currentTarget.style.background='var(--ds-primary-light)'} onMouseLeave={e=>e.currentTarget.style.background='var(--ds-bg-surface)'}>
        <div style={{ fontSize:12, fontWeight:600, color:'var(--ds-primary)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', maxWidth:160, textDecoration:'underline dotted' }}>{oc.nombre}</div>
        <div style={{ fontSize:9, color:'var(--ds-text-disabled)', fontFamily:'monospace' }}>{oc.totalPrepacks} prep. · {oc.proveedor}</div>
      </div>
      {ETAPAS_FLUJO.map((etapa, idx) => {
        const tagsEnEtapa = oc.tagsPorEtapa[etapa.id] || [];
        const tienePrep = tagsEnEtapa.length > 0;
        const enRango = idx >= oc.idxMin && idx <= oc.idxMax;
        const errEnEtapa = tagsEnEtapa.some(t => t.qa_fallido === true);
        const color = ETAPA_COLORS[etapa.id] || '#94A3B8';
        const datos = tienePrep ? getDatosEtapa(etapa.id, tagsEnEtapa, oc) : null;
        return (
          <div key={etapa.id} onClick={tienePrep ? () => onClickSegmento(oc, etapa) : undefined}
            style={{ height:36, margin:'3px 2px', borderRadius:6, background:tienePrep?(errEnEtapa?'var(--ds-rojo-bg)':`${color}20`):enRango?'#F8FAFC':'transparent', border:tienePrep?`1.5px solid ${errEnEtapa?'var(--ds-rojo-border)':`${color}55`}`:enRango?'1px dashed #E2E8F0':'none', cursor:tienePrep?'pointer':'default', display:'flex', alignItems:'center', justifyContent:'center', transition:'all .15s', position:'relative', overflow:'hidden' }}
            onMouseEnter={e=>{if(tienePrep){e.currentTarget.style.background=`${color}35`;e.currentTarget.style.borderColor=color;}}}
            onMouseLeave={e=>{if(tienePrep){e.currentTarget.style.background=errEnEtapa?'var(--ds-rojo-bg)':`${color}20`;e.currentTarget.style.borderColor=errEnEtapa?'var(--ds-rojo-border)':`${color}55`;}}}
          >
            {tienePrep && datos && <>
              <div style={{ position:'absolute', left:0, top:0, bottom:0, width:`${Math.min(100,Math.round((tagsEnEtapa.length/oc.totalPrepacks)*100))}%`, background:`${color}12`, borderRadius:'6px 0 0 6px' }} />
              <div style={{ display:'flex', alignItems:'center', gap:0, width:'100%', justifyContent:'space-around', padding:'0 6px', zIndex:1, position:'relative' }}>
                {datos.map((d,i) => <div key={i} style={{ textAlign:'center', flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:800, color:errEnEtapa?'var(--ds-rojo)':color, lineHeight:1 }}>{d.v}</div>
                  {d.l && <div style={{ fontSize:7, fontWeight:600, color:errEnEtapa?'var(--ds-rojo-text)':color, textTransform:'uppercase', letterSpacing:'.3px', opacity:.8, lineHeight:1.2, marginTop:1 }}>{d.l}</div>}
                </div>)}
              </div>
              {errEnEtapa && <div style={{ position:'absolute', top:3, right:4, width:8, height:8, borderRadius:'50%', background:'var(--ds-rojo)', border:'2px solid #fff', animation:'ds-pulso-rojo 1.4s ease-in-out infinite' }} />}
            </>}
            {enRango && !tienePrep && <div style={{ width:20, height:2, background:'var(--ds-border-medium)', borderRadius:2 }} />}
          </div>
        );
      })}
    </div>
  );
}

// ─── BarraKPI ───────────────────────────────────────────────────────────────

function BarraKPI({ kpi, pausado, onTogglePausa, modoDemo, onToggleDemo }) {
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
          <div style={{ fontSize:9, color:'var(--ds-text-disabled)', fontWeight:700, textTransform:'uppercase', letterSpacing:'.5px', marginTop:2 }}>{s.label}</div>
        </div>
      ))}
      <div style={{ flex:1 }} />
      <div style={{ width:1, height:34, background:'var(--ds-border-light)', marginRight:16, flexShrink:0 }} />
      <button onClick={onTogglePausa} style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 14px', borderRadius:8, marginRight:8, border:`1.5px solid ${pausado ? 'var(--ds-verde-border)' : 'var(--ds-border-medium)'}`, background:pausado ? 'var(--ds-verde-bg)' : 'var(--ds-bg-surface-2)', color:pausado ? 'var(--ds-verde-text)' : 'var(--ds-text-muted)', fontSize:11, fontWeight:700, cursor:'pointer', transition:'all .2s ease', flexShrink:0 }}>
        <span style={{ fontSize:13 }}>{pausado ? '▶' : '⏸'}</span>
        {pausado ? 'Reanudar' : 'Pausar'}
      </button>
      <button onClick={onToggleDemo} style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 14px', borderRadius:8, border:`1.5px solid ${modoDemo ? 'var(--ds-primary-border)' : 'var(--ds-border-medium)'}`, background:modoDemo ? 'var(--ds-primary-light)' : 'var(--ds-bg-surface-2)', color:modoDemo ? 'var(--ds-primary-dark)' : 'var(--ds-text-muted)', fontSize:11, fontWeight:700, cursor:'pointer', transition:'all .2s ease', flexShrink:0 }}>
        <span style={{ fontSize:11, color:modoDemo ? 'var(--ds-primary)' : 'var(--ds-text-disabled)' }}>◆</span>
        {modoDemo ? 'Demo activo' : 'Demo'}
      </button>
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
          <div key={oc.ordenId} className="ds-card-hover" onClick={() => { if (onAbrirOC) onAbrirOC(oc.ordenId, oc); }} style={{
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

export default function FlujoCEDIS({ onAbrirOC, onAbrirResumen }) {
  const [ordenesFull, setOrdenesFull] = useState([]);
  const [kpi, setKpi] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [pausado, setPausado] = useState(false);
  const [modoDemo, setModoDemo] = useState(false);
  const [panelBahia, setPanelBahia] = useState(null);
  const pausadoRef = useRef(false);
  const modoDemoRef = useRef(false);
  pausadoRef.current = pausado;
  modoDemoRef.current = modoDemo;

  const cargarDatos = useCallback(async () => {
    if (pausadoRef.current || modoDemoRef.current) return;
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

  const ocs = (modoDemo ? DEMO_OCS : ordenesFull.map(buildOC).filter(oc => oc.etapasActivas.length > 0)).filter(oc => !oc.etapasActivas.every(e => e === 'COMPLETADO'));
  function ocsEnBahiaYEtapa(numBahia, etapa) {
    const bahiaId = `BAHIA-${numBahia}`;
    return ocs.filter(oc => (oc.tagsPorEtapa[etapa] || []).some(t => t.tienda?.bahia_asignada === bahiaId || t.bahia === bahiaId));
  }
  const GANTT_COLS = `180px repeat(${ETAPAS_FLUJO.length}, 1fr)`;

  return (
    <div style={{ fontFamily:'IBM Plex Sans, sans-serif' }}>
      <BarraKPI kpi={modoDemo ? DEMO_KPI : kpi} pausado={pausado} onTogglePausa={togglePausa} modoDemo={modoDemo} onToggleDemo={() => { setModoDemo(prev => !prev); setCargando(false); }} />
      <div style={{ background:'var(--ds-bg-surface)', border:'1px solid var(--ds-border-light)', borderRadius:12, padding:'18px 22px', boxShadow:'var(--ds-shadow-sm)' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18, flexWrap:'wrap', gap:10 }}>
          <div style={{ fontSize:9, fontWeight:700, color:'var(--ds-text-disabled)', textTransform:'uppercase', letterSpacing:'.6px', display:'flex', alignItems:'center', gap:8 }}>
            Flujo del CEDIS
            {pausado && <span style={{ background:'var(--ds-verde-bg)', color:'var(--ds-verde-text)', padding:'2px 8px', borderRadius:4, fontSize:9, fontWeight:700 }}>⏸ Pausado</span>}
            {!cargando && <span style={{ fontWeight:400, color:'var(--ds-text-disabled)' }}>— {ocs.length} OCs activas</span>}
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
              {ocs.map(oc => <BarraOC key={oc.ordenId} oc={oc} columnWidths={GANTT_COLS} onClickSegmento={(ocData, etapa) => { if (onAbrirOC) onAbrirOC(ocData.ordenId, modoDemo ? ocData : null, etapa.id); }} onClickNombre={(ocData) => { if (onAbrirResumen) onAbrirResumen(modoDemo ? (DEMO_OCS.find(d=>d.ordenId===ocData.ordenId)||ocData) : ocData); }} />)}
            </div>
          </div>
          {/* BAHÍAS */}
          <div style={{ borderTop:'1px solid var(--ds-border-light)', paddingTop:18, marginTop:8 }}>
            <div style={{ fontSize:9, fontWeight:700, color:'var(--ds-text-disabled)', textTransform:'uppercase', letterSpacing:'.6px', marginBottom:12 }}>Estado por bahía</div>
            {[{ label:'Bahías', color:'var(--ds-zona-bahia)', etapa:'BAHIA' }, { label:'Auditoría', color:'var(--ds-zona-auditoria)', etapa:'AUDITORIA' }, { label:'Envío', color:'var(--ds-zona-envio)', etapa:'ENVIO' }].map(fila => (
              <div key={fila.label} style={{ display:'flex', alignItems:'center', gap:0, marginBottom:8 }}>
                <div style={{ width:80, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'flex-end', paddingRight:12 }}><span style={{ fontSize:9, fontWeight:700, color:fila.color, textTransform:'uppercase', letterSpacing:'.4px' }}>{fila.label}</span></div>
                <div style={{ flex:1, display:'flex', gap:5, overflowX:'auto', justifyContent:'center' }}>
                  {Array.from({ length:10 }, (_,i) => { const n=i+1; const ocsB=ocsEnBahiaYEtapa(n,fila.etapa); const err=ocsB.some(o=>o.hasErr); const key=`${fila.etapa}-B${n}`; const activa=panelBahia?.key===key;
                    if (fila.etapa==='BAHIA') return <CeldaPill key={n} bahia={n} n={ocsB.length} hasErr={err} activa={activa} onClick={() => { setPanelBahia(activa?null:{key,titulo:`Bahía ${n}`,ocs:ocsB});}} isDetalle={true} ocs={ocsB} />;
                    return <CeldaRect key={n} bahia={n} tipo={fila.etapa==='AUDITORIA'?'aud':'env'} n={ocsB.length} hasErr={err} activa={activa} onClick={() => { setPanelBahia(activa?null:{key,titulo:`${fila.label} — Bahía ${n}`,ocs:ocsB});}} isDetalle={true} ocs={ocsB} />;
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
