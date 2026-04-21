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

function ts(horaBase, minutosOffset=0) {
  const d=new Date(); d.setHours(Math.floor(horaBase),(horaBase%1)*60+minutosOffset,0,0); return d.toISOString();
}
function mkLog(etapa,hE,hS=null,pE=0,pS=null) {
  return {etapa,timestamp_entrada:ts(hE),timestamp_salida:hS!==null?ts(hS):null,prepacks_entrada:pE,prepacks_salida:pS!==null?pS:pE,tiene_anomalia:false,notas:''};
}

// Cada prepack = 1 etiqueta RFID que contiene varias prendas distintas
let _epcCounter = 0;
function mkPrepack(epc, etapa, tienda, prendas) {
  _epcCounter++;
  const colores = [...new Set(prendas.map(p => p.color))];
  const tallas  = [...new Set(prendas.map(p => p.talla))];
  return {
    epc, etapa_actual: etapa, qa_fallido: false, anomalias: [],
    prendas, tienda, colores, tallas,
    total_prendas: prendas.length, cantidad_piezas: prendas.length,
    color: colores[0], talla: tallas.join('/'),
    tipo_flujo: 'CROSS_DOCK',
    sku: `${(colores[0]||'X').substring(0,3).toUpperCase()}-${tallas[0]||'X'}`,
  };
}
function mkPrepackError(epc, etapa, tienda, prendas) {
  return { ...mkPrepack(epc, etapa, tienda, prendas), qa_fallido: true, qa_motivo_fallo: 'Prenda defectuosa' };
}

const TIENDAS = {
  MTY_CENTRO:  { nombre:'Vértice Monterrey Centro',  ciudad:'Monterrey',       estado:'NL',   estado_rep:'NL',   bahia_asignada:'BAHIA-1' },
  MTY_SUR:     { nombre:'Vértice Monterrey Sur',     ciudad:'Monterrey',       estado:'NL',   estado_rep:'NL',   bahia_asignada:'BAHIA-1' },
  SAN_PEDRO:   { nombre:'Vértice San Pedro',          ciudad:'San Pedro',       estado:'NL',   estado_rep:'NL',   bahia_asignada:'BAHIA-2' },
  SALTILLO:    { nombre:'Vértice Saltillo',           ciudad:'Saltillo',        estado:'COAH', estado_rep:'COAH', bahia_asignada:'BAHIA-2' },
  GUADALAJARA: { nombre:'Vértice Guadalajara',        ciudad:'Guadalajara',     estado:'JAL',  estado_rep:'JAL',  bahia_asignada:'BAHIA-3' },
  ZAPOPAN:     { nombre:'Vértice Zapopan',            ciudad:'Zapopan',         estado:'JAL',  estado_rep:'JAL',  bahia_asignada:'BAHIA-3' },
  CDMX_POL:    { nombre:'Vértice CDMX Polanco',       ciudad:'CDMX',            estado:'CDMX', estado_rep:'CDMX', bahia_asignada:'BAHIA-4' },
  CDMX_ROM:    { nombre:'Vértice CDMX Roma',          ciudad:'CDMX',            estado:'CDMX', estado_rep:'CDMX', bahia_asignada:'BAHIA-4' },
  PUEBLA:      { nombre:'Vértice Puebla',             ciudad:'Puebla',          estado:'PUE',  estado_rep:'PUE',  bahia_asignada:'BAHIA-5' },
  QUERETARO:   { nombre:'Vértice Querétaro',          ciudad:'Querétaro',       estado:'QRO',  estado_rep:'QRO',  bahia_asignada:'BAHIA-5' },
  SLP:         { nombre:'Vértice San Luis Potosí',    ciudad:'San Luis Potosí', estado:'SLP',  estado_rep:'SLP',  bahia_asignada:'BAHIA-6' },
  AGUASC:      { nombre:'Vértice Aguascalientes',     ciudad:'Aguascalientes',  estado:'AGS',  estado_rep:'AGS',  bahia_asignada:'BAHIA-6' },
  HERMOSILLO:  { nombre:'Vértice Hermosillo',         ciudad:'Hermosillo',      estado:'SON',  estado_rep:'SON',  bahia_asignada:'BAHIA-7' },
  CULIACAN:    { nombre:'Vértice Culiacán',           ciudad:'Culiacán',        estado:'SIN',  estado_rep:'SIN',  bahia_asignada:'BAHIA-7' },
  TIJUANA:     { nombre:'Vértice Tijuana',            ciudad:'Tijuana',         estado:'BC',   estado_rep:'BC',   bahia_asignada:'BAHIA-8' },
  MEXICALI:    { nombre:'Vértice Mexicali',           ciudad:'Mexicali',        estado:'BC',   estado_rep:'BC',   bahia_asignada:'BAHIA-8' },
  MERIDA:      { nombre:'Vértice Mérida',             ciudad:'Mérida',          estado:'YUC',  estado_rep:'YUC',  bahia_asignada:'BAHIA-9' },
  CANCUN:      { nombre:'Vértice Cancún',             ciudad:'Cancún',          estado:'QROO', estado_rep:'QROO', bahia_asignada:'BAHIA-9' },
  CHIHUAHUA:   { nombre:'Vértice Chihuahua',          ciudad:'Chihuahua',       estado:'CHIH', estado_rep:'CHIH', bahia_asignada:'BAHIA-10' },
  JUAREZ:      { nombre:'Vértice Ciudad Juárez',      ciudad:'Cd. Juárez',      estado:'CHIH', estado_rep:'CHIH', bahia_asignada:'BAHIA-10' },
};

// Construye una OC completa a partir de los prepacks por etapa
function mkOC(id, nom, prov, etapas, extra={}) {
  const tagsPorEtapa = {PREREGISTRO:[],QA:[],REGISTRO:[],SORTER:[],BAHIA:[],AUDITORIA:[],ENVIO:[],COMPLETADO:[]};
  Object.entries(etapas).forEach(([e,prepacks])=>{ tagsPorEtapa[e] = prepacks; });
  const allTags = Object.values(tagsPorEtapa).flat();
  const etapasActivas = ETAPAS_FLUJO.map(e=>e.id).filter(e=>tagsPorEtapa[e]?.length>0);
  const idxMin = etapasActivas.length>0?Math.min(...etapasActivas.map(e=>ETAPA_IDX[e]??99)):0;
  const idxMax = etapasActivas.length>0?Math.max(...etapasActivas.map(e=>ETAPA_IDX[e]??0)):0;
  const comp = allTags.filter(t=>['ENVIO','COMPLETADO'].includes(t.etapa_actual)).length;
  return {
    ordenId:id, nombre:nom, nombre_producto:nom, proveedor:prov,
    totalPrepacks:allTags.length,
    pct:allTags.length>0?(comp/allTags.length)*100:0,
    hasErr:allTags.some(t=>t.qa_fallido),
    tags:allTags, tagsPorEtapa, etapasActivas, idxMin, idxMax,
    etapa_logs:extra.etapa_logs||[],
    total_esperados:extra.total_esperados||allTags.length,
    total_recibidos:extra.total_recibidos||allTags.length,
    faltantes:extra.faltantes||0,
    orden:{orden_id:id,nombre_producto:nom,foto_url:null},
    pedido:{pedido_id:'PED-DEMO',proveedor:{nombre:prov}},
    pedido_id:'PED-DEMO', palet_id:id,
    estado:comp===allTags.length&&allTags.length>0?'DESPACHADO':'ACTIVO',
  };
}

const DEMO_KPI = {
  mejora_porcentaje: 30.6,
  objetivo_mejora_pct: 32,
  tiempo_promedio_hoy_min: 125,
  palets_activos: 25,
  palets_completados_hoy: 8,
};

const DEMO_OCS = [
  // ── PRE-REGISTRO ────────────────────────────────────────────────────────
  mkOC('OC-001','Playera Básica Manga Corta','Textiles Monterrey SA',{
    PREREGISTRO:[
      mkPrepack('E001A','PREREGISTRO',TIENDAS.MTY_CENTRO,[{color:'Azul',talla:'S'},{color:'Azul',talla:'M'},{color:'Negro',talla:'S'},{color:'Negro',talla:'L'}]),
      mkPrepack('E001B','PREREGISTRO',TIENDAS.SAN_PEDRO,[{color:'Blanco',talla:'XS'},{color:'Blanco',talla:'S'},{color:'Rojo',talla:'M'},{color:'Rojo',talla:'L'}]),
      mkPrepack('E001C','PREREGISTRO',TIENDAS.GUADALAJARA,[{color:'Verde',talla:'S'},{color:'Verde',talla:'M'},{color:'Azul',talla:'XL'}]),
    ],
  },{etapa_logs:[mkLog('PREREGISTRO',9.5,null,3,null)]}),

  mkOC('OC-002','Pantalón Cargo Denim Slim','Confecciones del Norte',{
    PREREGISTRO:[
      mkPrepack('E002A','PREREGISTRO',TIENDAS.HERMOSILLO,[{color:'Azul',talla:'28'},{color:'Azul',talla:'30'},{color:'Negro',talla:'32'},{color:'Negro',talla:'34'}]),
      mkPrepack('E002B','PREREGISTRO',TIENDAS.TIJUANA,[{color:'Café',talla:'30'},{color:'Café',talla:'32'},{color:'Azul',talla:'36'}]),
    ],
  },{total_esperados:3,total_recibidos:2,faltantes:1,etapa_logs:[mkLog('PREREGISTRO',9.75,null,2,null)]}),

  mkOC('OC-003','Blusa Fluida Manga Larga','Moda Express MX',{
    PREREGISTRO:[
      mkPrepack('E003A','PREREGISTRO',TIENDAS.CDMX_POL,[{color:'Blanco',talla:'S'},{color:'Blanco',talla:'M'},{color:'Rosa',talla:'S'},{color:'Rosa',talla:'M'}]),
      mkPrepack('E003B','PREREGISTRO',TIENDAS.PUEBLA,[{color:'Azul',talla:'L'},{color:'Azul',talla:'XL'},{color:'Blanco',talla:'L'}]),
    ],
  },{etapa_logs:[mkLog('PREREGISTRO',10.0,null,2,null)]}),

  mkOC('OC-004','Chamarra Impermeable Sport','ActiveWear CDMX',{
    PREREGISTRO:[
      mkPrepack('E004A','PREREGISTRO',TIENDAS.MTY_SUR,[{color:'Negro',talla:'M'},{color:'Negro',talla:'L'},{color:'Gris',talla:'M'},{color:'Gris',talla:'XL'}]),
      mkPrepack('E004B','PREREGISTRO',TIENDAS.SALTILLO,[{color:'Azul',talla:'S'},{color:'Azul',talla:'M'},{color:'Negro',talla:'XL'}]),
    ],
  },{etapa_logs:[mkLog('PREREGISTRO',10.25,null,2,null)]}),

  // ── QA ───────────────────────────────────────────────────────────────────
  mkOC('OC-005','Vestido Casual Verano','Diseños Guadalajara',{
    PREREGISTRO:[
      mkPrepack('E005A','PREREGISTRO',TIENDAS.MTY_CENTRO,[{color:'Verde',talla:'S'},{color:'Verde',talla:'M'},{color:'Amarillo',talla:'S'}]),
    ],
    QA:[
      mkPrepack('E005B','QA',TIENDAS.GUADALAJARA,[{color:'Amarillo',talla:'M'},{color:'Azul',talla:'S'},{color:'Azul',talla:'M'},{color:'Blanco',talla:'L'}]),
      mkPrepack('E005C','QA',TIENDAS.ZAPOPAN,[{color:'Blanco',talla:'S'},{color:'Rosa',talla:'M'},{color:'Rosa',talla:'L'}]),
    ],
  },{etapa_logs:[mkLog('PREREGISTRO',8.5,9.0,3,3),mkLog('QA',9.0,null,2,null)]}),

  mkOC('OC-006','Polo Piqué Hombre','Textiles Monterrey SA',{
    QA:[
      mkPrepackError('E006A','QA',TIENDAS.HERMOSILLO,[{color:'Azul',talla:'M'},{color:'Azul',talla:'L'},{color:'Blanco',talla:'S'}]),
      mkPrepack('E006B','QA',TIENDAS.CULIACAN,[{color:'Blanco',talla:'M'},{color:'Negro',talla:'L'},{color:'Negro',talla:'XL'}]),
    ],
  },{total_esperados:3,total_recibidos:2,faltantes:1,etapa_logs:[mkLog('PREREGISTRO',8.25,8.75,2,2),{...mkLog('QA',8.75,null,2,null),tiene_anomalia:true}]}),

  mkOC('OC-007','Short Deportivo Running','ActiveWear CDMX',{
    QA:[
      mkPrepack('E007A','QA',TIENDAS.SAN_PEDRO,[{color:'Negro',talla:'S'},{color:'Negro',talla:'M'},{color:'Azul',talla:'S'},{color:'Azul',talla:'M'}]),
      mkPrepack('E007B','QA',TIENDAS.SALTILLO,[{color:'Rojo',talla:'L'},{color:'Rojo',talla:'XL'},{color:'Negro',talla:'L'}]),
    ],
  },{etapa_logs:[mkLog('PREREGISTRO',8.75,9.25,2,2),mkLog('QA',9.25,null,2,null)]}),

  // ── REGISTRO ─────────────────────────────────────────────────────────────
  mkOC('OC-008','Playera Estampada Temporada','Estampados MX',{
    QA:[
      mkPrepack('E008A','QA',TIENDAS.GUADALAJARA,[{color:'Blanco',talla:'S'},{color:'Blanco',talla:'M'},{color:'Gris',talla:'L'}]),
    ],
    REGISTRO:[
      mkPrepack('E008B','REGISTRO',TIENDAS.SLP,[{color:'Gris',talla:'XL'},{color:'Verde',talla:'S'},{color:'Verde',talla:'M'},{color:'Azul',talla:'L'}]),
      mkPrepack('E008C','REGISTRO',TIENDAS.QUERETARO,[{color:'Azul',talla:'XS'},{color:'Rojo',talla:'S'},{color:'Rojo',talla:'M'}]),
    ],
  },{etapa_logs:[mkLog('PREREGISTRO',7.5,8.0,3,3),mkLog('QA',8.0,8.5,3,3),mkLog('REGISTRO',8.5,null,2,null)]}),

  mkOC('OC-009','Pantalón Chino Slim Fit','Confecciones del Norte',{
    REGISTRO:[
      mkPrepack('E009A','REGISTRO',TIENDAS.MTY_CENTRO,[{color:'Beige',talla:'30'},{color:'Beige',talla:'32'},{color:'Verde',talla:'30'},{color:'Verde',talla:'34'}]),
      mkPrepack('E009B','REGISTRO',TIENDAS.CDMX_POL,[{color:'Azul',talla:'32'},{color:'Azul',talla:'36'},{color:'Café',talla:'30'}]),
    ],
  },{etapa_logs:[mkLog('PREREGISTRO',7.75,8.25,2,2),mkLog('QA',8.25,8.75,2,2),mkLog('REGISTRO',8.75,null,2,null)]}),

  mkOC('OC-010','Sudadera Hoodie Oversize','Urban Trends MX',{
    REGISTRO:[
      mkPrepack('E010A','REGISTRO',TIENDAS.CDMX_ROM,[{color:'Negro',talla:'S'},{color:'Negro',talla:'M'},{color:'Gris',talla:'M'},{color:'Gris',talla:'L'}]),
      mkPrepack('E010B','REGISTRO',TIENDAS.PUEBLA,[{color:'Azul',talla:'XL'},{color:'Azul',talla:'XXL'},{color:'Blanco',talla:'S'},{color:'Blanco',talla:'M'}]),
    ],
  },{etapa_logs:[mkLog('PREREGISTRO',7.25,7.75,2,2),mkLog('QA',7.75,8.25,2,2),mkLog('REGISTRO',8.25,null,2,null)]}),

  mkOC('OC-011','Camiseta Básica Pack','Textiles Monterrey SA',{
    REGISTRO:[
      mkPrepackError('E011A','REGISTRO',TIENDAS.MERIDA,[{color:'Blanco',talla:'S'},{color:'Blanco',talla:'M'},{color:'Negro',talla:'S'}]),
      mkPrepack('E011B','REGISTRO',TIENDAS.CANCUN,[{color:'Negro',talla:'M'},{color:'Gris',talla:'L'},{color:'Gris',talla:'XL'}]),
    ],
  },{total_esperados:3,total_recibidos:2,faltantes:1,etapa_logs:[mkLog('PREREGISTRO',8.0,8.5,2,2),mkLog('QA',8.5,9.0,2,2),{...mkLog('REGISTRO',9.0,null,2,null),tiene_anomalia:true}]}),

  // ── SORTER ───────────────────────────────────────────────────────────────
  mkOC('OC-012','Blusa Campesina Bordada','Moda Express MX',{
    REGISTRO:[
      mkPrepack('E012A','REGISTRO',TIENDAS.MTY_CENTRO,[{color:'Blanco',talla:'S'},{color:'Blanco',talla:'M'},{color:'Rosa',talla:'S'},{color:'Rosa',talla:'M'}]),
    ],
    SORTER:[
      mkPrepack('E012B','SORTER',TIENDAS.SALTILLO,[{color:'Azul',talla:'S'},{color:'Azul',talla:'M'},{color:'Verde',talla:'L'},{color:'Verde',talla:'XL'}]),
      mkPrepack('E012C','SORTER',TIENDAS.CHIHUAHUA,[{color:'Rojo',talla:'S'},{color:'Rojo',talla:'M'},{color:'Blanco',talla:'L'}]),
    ],
  },{etapa_logs:[mkLog('PREREGISTRO',6.5,7.0,3,3),mkLog('QA',7.0,7.5,3,3),mkLog('REGISTRO',7.5,8.0,3,3),mkLog('SORTER',8.0,null,2,null)]}),

  mkOC('OC-013','Jean Skinny Mujer','Diseños Guadalajara',{
    SORTER:[
      mkPrepack('E013A','SORTER',TIENDAS.GUADALAJARA,[{color:'Azul Oscuro',talla:'25'},{color:'Azul Oscuro',talla:'27'},{color:'Negro',talla:'25'},{color:'Negro',talla:'27'}]),
      mkPrepack('E013B','SORTER',TIENDAS.ZAPOPAN,[{color:'Gris',talla:'29'},{color:'Gris',talla:'31'},{color:'Negro',talla:'29'}]),
    ],
  },{etapa_logs:[mkLog('PREREGISTRO',6.75,7.25,2,2),mkLog('QA',7.25,7.75,2,2),mkLog('REGISTRO',7.75,8.25,2,2),mkLog('SORTER',8.25,null,2,null)]}),

  mkOC('OC-014','Playera Polo Sport','ActiveWear CDMX',{
    SORTER:[
      mkPrepack('E014A','SORTER',TIENDAS.HERMOSILLO,[{color:'Blanco',talla:'M'},{color:'Blanco',talla:'L'},{color:'Azul',talla:'S'},{color:'Azul',talla:'M'}]),
    ],
    BAHIA:[
      mkPrepack('E014B','BAHIA',TIENDAS.TIJUANA,[{color:'Negro',talla:'XL'},{color:'Negro',talla:'XXL'},{color:'Gris',talla:'L'}]),
    ],
  },{etapa_logs:[mkLog('PREREGISTRO',6.25,6.75,2,2),mkLog('QA',6.75,7.25,2,2),mkLog('REGISTRO',7.25,7.75,2,2),mkLog('SORTER',7.75,null,1,null),mkLog('BAHIA',8.5,null,1,null)]}),

  // ── BAHÍAS ───────────────────────────────────────────────────────────────
  mkOC('OC-015','Shorts Playa Tropical','Estampados MX',{
    BAHIA:[
      mkPrepack('E015A','BAHIA',TIENDAS.MTY_CENTRO,[{color:'Azul',talla:'S'},{color:'Azul',talla:'M'},{color:'Verde',talla:'S'},{color:'Verde',talla:'M'}]),
      mkPrepack('E015B','BAHIA',TIENDAS.GUADALAJARA,[{color:'Naranja',talla:'L'},{color:'Naranja',talla:'XL'},{color:'Rojo',talla:'M'}]),
      mkPrepack('E015C','BAHIA',TIENDAS.CDMX_POL,[{color:'Azul',talla:'L'},{color:'Verde',talla:'XL'},{color:'Blanco',talla:'S'}]),
    ],
  },{etapa_logs:[mkLog('PREREGISTRO',6.0,6.5,3,3),mkLog('QA',6.5,7.0,3,3),mkLog('REGISTRO',7.0,7.5,3,3),mkLog('SORTER',7.5,8.0,3,3),mkLog('BAHIA',8.0,null,3,null)]}),

  mkOC('OC-016','Falda Midi Plisada','Diseños Guadalajara',{
    SORTER:[
      mkPrepack('E016A','SORTER',TIENDAS.CDMX_ROM,[{color:'Rosa',talla:'S'},{color:'Rosa',talla:'M'},{color:'Beige',talla:'S'}]),
    ],
    BAHIA:[
      mkPrepack('E016B','BAHIA',TIENDAS.SLP,[{color:'Beige',talla:'M'},{color:'Negro',talla:'L'},{color:'Negro',talla:'XL'}]),
    ],
  },{etapa_logs:[mkLog('PREREGISTRO',6.25,6.75,2,2),mkLog('QA',6.75,7.25,2,2),mkLog('REGISTRO',7.25,7.75,2,2),mkLog('SORTER',7.75,null,1,null),mkLog('BAHIA',8.25,null,1,null)]}),

  mkOC('OC-017','Chamarra Denim Oversize','Urban Trends MX',{
    BAHIA:[
      mkPrepack('E017A','BAHIA',TIENDAS.MEXICALI,[{color:'Azul',talla:'S'},{color:'Azul',talla:'M'},{color:'Negro',talla:'L'},{color:'Negro',talla:'XL'}]),
      mkPrepack('E017B','BAHIA',TIENDAS.CHIHUAHUA,[{color:'Blanco',talla:'M'},{color:'Blanco',talla:'L'},{color:'Gris',talla:'XL'}]),
    ],
  },{etapa_logs:[mkLog('PREREGISTRO',5.75,6.25,2,2),mkLog('QA',6.25,6.75,2,2),mkLog('REGISTRO',6.75,7.25,2,2),mkLog('SORTER',7.25,7.75,2,2),mkLog('BAHIA',7.75,null,2,null)]}),

  // ── AUDITORÍA ────────────────────────────────────────────────────────────
  mkOC('OC-018','Playera Básica Premium','Textiles Monterrey SA',{
    BAHIA:[
      mkPrepack('E018A','BAHIA',TIENDAS.MTY_CENTRO,[{color:'Blanco',talla:'S'},{color:'Blanco',talla:'M'},{color:'Negro',talla:'L'},{color:'Negro',talla:'XL'}]),
    ],
    AUDITORIA:[
      mkPrepack('E018B','AUDITORIA',TIENDAS.SAN_PEDRO,[{color:'Gris',talla:'S'},{color:'Gris',talla:'M'},{color:'Azul',talla:'S'}]),
      mkPrepack('E018C','AUDITORIA',TIENDAS.QUERETARO,[{color:'Azul',talla:'L'},{color:'Blanco',talla:'XL'},{color:'Negro',talla:'M'}]),
    ],
  },{etapa_logs:[mkLog('PREREGISTRO',5.0,5.5,3,3),mkLog('QA',5.5,6.0,3,3),mkLog('REGISTRO',6.0,6.5,3,3),mkLog('SORTER',6.5,7.0,3,3),mkLog('BAHIA',7.0,null,3,null),mkLog('AUDITORIA',7.75,null,2,null)]}),

  mkOC('OC-019','Pantalón Vestir Slim','Confecciones del Norte',{
    AUDITORIA:[
      mkPrepackError('E019A','AUDITORIA',TIENDAS.GUADALAJARA,[{color:'Negro',talla:'30'},{color:'Negro',talla:'32'},{color:'Gris',talla:'30'}]),
      mkPrepack('E019B','AUDITORIA',TIENDAS.PUEBLA,[{color:'Gris',talla:'34'},{color:'Azul',talla:'32'},{color:'Azul',talla:'36'}]),
    ],
  },{total_esperados:3,total_recibidos:2,faltantes:1,etapa_logs:[mkLog('PREREGISTRO',5.25,5.75,2,2),mkLog('QA',5.75,6.25,2,2),mkLog('REGISTRO',6.25,6.75,2,2),mkLog('SORTER',6.75,7.25,2,2),mkLog('BAHIA',7.25,7.75,2,2),{...mkLog('AUDITORIA',7.75,null,2,null),tiene_anomalia:true}]}),

  mkOC('OC-020','Blusa Casual Rayas','Moda Express MX',{
    AUDITORIA:[
      mkPrepack('E020A','AUDITORIA',TIENDAS.HERMOSILLO,[{color:'Azul',talla:'S'},{color:'Azul',talla:'M'},{color:'Rojo',talla:'S'},{color:'Rojo',talla:'M'}]),
      mkPrepack('E020B','AUDITORIA',TIENDAS.MERIDA,[{color:'Blanco',talla:'L'},{color:'Blanco',talla:'XL'},{color:'Azul',talla:'L'}]),
    ],
  },{etapa_logs:[mkLog('PREREGISTRO',5.5,6.0,2,2),mkLog('QA',6.0,6.5,2,2),mkLog('REGISTRO',6.5,7.0,2,2),mkLog('SORTER',7.0,7.5,2,2),mkLog('BAHIA',7.5,8.0,2,2),mkLog('AUDITORIA',8.0,null,2,null)]}),

  mkOC('OC-021','Sudadera Crew Neck Básica','Urban Trends MX',{
    AUDITORIA:[
      mkPrepack('E021A','AUDITORIA',TIENDAS.MTY_CENTRO,[{color:'Gris',talla:'S'},{color:'Gris',talla:'M'},{color:'Negro',talla:'S'}]),
    ],
    ENVIO:[
      mkPrepack('E021B','ENVIO',TIENDAS.GUADALAJARA,[{color:'Negro',talla:'M'},{color:'Azul',talla:'L'},{color:'Azul',talla:'XL'}]),
    ],
  },{etapa_logs:[mkLog('PREREGISTRO',4.75,5.25,2,2),mkLog('QA',5.25,5.75,2,2),mkLog('REGISTRO',5.75,6.25,2,2),mkLog('SORTER',6.25,6.75,2,2),mkLog('BAHIA',6.75,7.25,2,2),mkLog('AUDITORIA',7.25,null,1,null),mkLog('ENVIO',7.75,null,1,null)]}),

  // ── ENVÍO ────────────────────────────────────────────────────────────────
  mkOC('OC-022','Pantalón Jogger Tech','ActiveWear CDMX',{
    ENVIO:[
      mkPrepack('E022A','ENVIO',TIENDAS.HERMOSILLO,[{color:'Negro',talla:'S'},{color:'Negro',talla:'M'},{color:'Gris',talla:'L'},{color:'Gris',talla:'XL'}]),
      mkPrepack('E022B','ENVIO',TIENDAS.TIJUANA,[{color:'Azul',talla:'M'},{color:'Azul',talla:'L'},{color:'Verde',talla:'S'}]),
      mkPrepack('E022C','ENVIO',TIENDAS.MEXICALI,[{color:'Verde',talla:'M'},{color:'Negro',talla:'XL'},{color:'Gris',talla:'M'}]),
    ],
  },{etapa_logs:[mkLog('PREREGISTRO',4.0,4.5,3,3),mkLog('QA',4.5,5.0,3,3),mkLog('REGISTRO',5.0,5.5,3,3),mkLog('SORTER',5.5,6.0,3,3),mkLog('BAHIA',6.0,6.75,3,3),mkLog('AUDITORIA',6.75,7.25,3,3),mkLog('ENVIO',7.25,null,3,null)]}),

  mkOC('OC-023','Vestido Formal Noche','Diseños Guadalajara',{
    ENVIO:[
      mkPrepack('E023A','ENVIO',TIENDAS.MTY_CENTRO,[{color:'Negro',talla:'S'},{color:'Negro',talla:'M'},{color:'Rojo',talla:'S'},{color:'Rojo',talla:'M'}]),
      mkPrepack('E023B','ENVIO',TIENDAS.CDMX_POL,[{color:'Azul Marino',talla:'L'},{color:'Azul Marino',talla:'XL'},{color:'Negro',talla:'XL'}]),
    ],
  },{etapa_logs:[mkLog('PREREGISTRO',4.25,4.75,2,2),mkLog('QA',4.75,5.25,2,2),mkLog('REGISTRO',5.25,5.75,2,2),mkLog('SORTER',5.75,6.25,2,2),mkLog('BAHIA',6.25,7.0,2,2),mkLog('AUDITORIA',7.0,7.5,2,2),mkLog('ENVIO',7.5,8.0,2,2)]}),

  mkOC('OC-024','Playera Manga Larga UV','Textiles Monterrey SA',{
    ENVIO:[
      mkPrepack('E024A','ENVIO',TIENDAS.QUERETARO,[{color:'Blanco',talla:'S'},{color:'Blanco',talla:'M'},{color:'Azul',talla:'S'}]),
      mkPrepackError('E024B','ENVIO',TIENDAS.AGUASC,[{color:'Azul',talla:'M'},{color:'Negro',talla:'L'},{color:'Negro',talla:'XL'}]),
    ],
  },{total_esperados:3,total_recibidos:2,faltantes:1,etapa_logs:[mkLog('PREREGISTRO',3.75,4.25,2,2),mkLog('QA',4.25,4.75,2,2),mkLog('REGISTRO',4.75,5.25,2,2),mkLog('SORTER',5.25,5.75,2,2),mkLog('BAHIA',5.75,6.5,2,2),mkLog('AUDITORIA',6.5,7.0,2,2),{...mkLog('ENVIO',7.0,null,2,null),tiene_anomalia:true}]}),

  mkOC('OC-025','Short Gym Hombre','ActiveWear CDMX',{
    AUDITORIA:[
      mkPrepack('E025A','AUDITORIA',TIENDAS.MERIDA,[{color:'Negro',talla:'S'},{color:'Negro',talla:'M'},{color:'Azul',talla:'S'},{color:'Azul',talla:'M'}]),
    ],
    ENVIO:[
      mkPrepack('E025B','ENVIO',TIENDAS.CANCUN,[{color:'Gris',talla:'L'},{color:'Gris',talla:'XL'},{color:'Negro',talla:'L'}]),
    ],
  },{etapa_logs:[mkLog('PREREGISTRO',4.5,5.0,2,2),mkLog('QA',5.0,5.5,2,2),mkLog('REGISTRO',5.5,6.0,2,2),mkLog('SORTER',6.0,6.5,2,2),mkLog('BAHIA',6.5,7.0,2,2),mkLog('AUDITORIA',7.0,null,1,null),mkLog('ENVIO',7.5,null,1,null)]}),
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
        <div style={{ fontSize:12, fontWeight:600, color:'var(--ds-text-primary)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', maxWidth:160 }}>{oc.nombre}</div>
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
    gris:     { bg:'var(--ds-bg-surface-2)', border:'var(--ds-border-light)', text:'var(--ds-text-disabled)' },
  }[semM];
  return (
    <div style={{ display:'flex', alignItems:'center', gap:0, background:'var(--ds-bg-surface)', border:'1px solid var(--ds-border-light)', borderRadius:12, padding:'0 20px', height:62, marginBottom:16, overflowX:'auto', boxShadow:'var(--ds-shadow-sm)', flexShrink:0 }}>
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
