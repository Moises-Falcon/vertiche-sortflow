// Datos del dashboard — alineados con el módulo RFID
// Las mismas 7 etapas, mismos EPCs de prepacks (E001A..E025B), mismas tiendas (TDA-XXX), mismos proveedores

// ─── Tiendas reales del módulo RFID (backend/prisma/seed.js + frontend-rfid TIENDAS) ─
export const TIENDAS_REF = {
  'TDA-007': { nombre:'Vértice Monterrey Centro',  ciudad:'Monterrey',       bahia:'BAHIA-1' },
  'TDA-015': { nombre:'Vértice San Pedro',          ciudad:'San Pedro',       bahia:'BAHIA-2' },
  'TDA-029': { nombre:'Vértice Guadalajara',        ciudad:'Guadalajara',     bahia:'BAHIA-3' },
  'TDA-033': { nombre:'Vértice CDMX Polanco',       ciudad:'CDMX',            bahia:'BAHIA-4' },
  'TDA-044': { nombre:'Vértice Puebla',             ciudad:'Puebla',          bahia:'BAHIA-5' },
  'TDA-051': { nombre:'Vértice Cancún',             ciudad:'Cancún',          bahia:'BAHIA-9' },
}

// ─── Proveedores reales (los 7 del RFID, PROV-001/002 también en backend) ─────────
export const PROVEEDORES_REF = [
  { codigo:'PROV-001', nombre:'Textiles Monterrey SA' },
  { codigo:'PROV-002', nombre:'Confecciones del Norte' },
  { codigo:'PROV-003', nombre:'Moda Express MX' },
  { codigo:'PROV-004', nombre:'ActiveWear CDMX' },
  { codigo:'PROV-005', nombre:'Diseños Guadalajara' },
  { codigo:'PROV-006', nombre:'Estampados MX' },
  { codigo:'PROV-007', nombre:'Urban Trends MX' },
]

// ─── KPIs globales del día ─────────────────────────────────────────
export const DIA = {
  meta:          5000,
  procesados:    4090,
  cumplimiento:  81.8,
  operadores:    12,
  umbral:        32,
  cedi:         'CEDIS Vertiche',
  ocs_activas:  25,        // 25 OCs demo del RFID
  prepacks_demo: 62,        // total prepacks en el demo RFID
}

// ─── Alertas activas — referencian EPCs y bahías reales ─────────────
export const ALERTAS = [
  {
    id: 1, tipo: 'critica', etapa: 'QA',
    msg: 'Tasa de aceptación en 82.5% — por debajo del umbral mínimo (85%). Prepacks E006A (Polo Piqué · Textiles MTY), E011A (Camiseta Básica · Textiles MTY), E019A (Pantalón Vestir · Confecciones Norte) y E024B (Playera UV · Textiles MTY) rechazados en QA.',
    tiempo: 'Hace 14 min', modal: 'qa',
  },
  {
    id: 2, tipo: 'advertencia', etapa: 'BAHÍA',
    msg: 'BAHIA-4 operando a 11 pp/min — muy por debajo del promedio (32 pp/min). Posible atasco en la línea hacia Vértice CDMX Polanco (TDA-033).',
    tiempo: 'Hace 8 min', modal: 'bahia',
  },
  {
    id: 3, tipo: 'advertencia', etapa: 'BAHÍA',
    msg: 'Prepack E015B detectado en BAHIA-4 cuando su destino es BAHIA-3 (Vértice Guadalajara) — redirigido manualmente.',
    tiempo: 'Hace 22 min', modal: 'bahia',
  },
]

// ─── Datos del gráfico (44 puntos, cada 12 min, 06:00–14:48) ───────
export const CHART_LABELS = (() => {
  const l = []
  for (let i = 0; i < 44; i++) {
    const totalMin = 6*60 + i*12
    const h = Math.floor(totalMin/60), m = totalMin%60
    l.push(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`)
  }
  return l
})()

export const CHART_REAL    = [8,14,20,26,31,35,38,40,41,42,43,44,44,43,42,40,38,35,32,29,26,22,18,15,19,23,27,30,32,33,34,35,35,35,35,35,35,35,35,35,35,35,35,35]
export const CHART_PROJ    = [12,18,24,30,35,38,40,42,43,44,44,44,44,43,42,41,40,39,38,37,36,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35]
export const CHART_UMBRAL  = Array(44).fill(32)

// ─── Etapas (7 del CEDI Vertiche — mismas que RFID y sorter) ────────
export const ETAPAS = [
  { key:'preregistro', label:'PRE-REGISTRO', color:'blue',   dot:'g', val:'9',     unit:'',       sub:'4 OCs · 9 PREPACKS',             status:'g' },
  { key:'qa',          label:'QA',           color:'orange', dot:'r', val:'82.5%', unit:'',       sub:'5 DE 6 APROBADOS',               status:'r' },
  { key:'registro',    label:'REGISTRO',     color:'red',    dot:'r', val:'7',     unit:'',       sub:'4 OCs · 1 RECHAZADO',            status:'r' },
  { key:'sorter',      label:'SORTER',       color:'purple', dot:'g', val:'35',    unit:'pp/min', sub:'5 PREPACKS ACTIVOS',             status:'g' },
  { key:'bahia',       label:'BAHÍA',        color:'teal',   dot:'a', val:'31',    unit:'pp/min', sub:'9 PREPACKS · 10 BAHÍAS',         status:'a' },
  { key:'auditoria',   label:'AUDITORÍA',    color:'green',  dot:'g', val:'7',     unit:'',       sub:'4 OCs · 97.6% APROBADAS',        status:'g' },
  { key:'envio',       label:'ENVÍO',        color:'teal',   dot:'g', val:'13',    unit:'',       sub:'4 OCs · 2 CON FALTANTES',        status:'g' },
]

// ─── Colores por etapa ─────────────────────────────────────────────
export const STAGE_COLORS = {
  blue:   { border:'#0e8fa8', name:'#0a7a90' },
  orange: { border:'#c07010', name:'#a06010' },
  red:    { border:'#b02818', name:'#c03020' },
  purple: { border:'#6040a0', name:'#6040a0' },
  teal:   { border:'#0e8fa8', name:'#0a7a90' },
  green:  { border:'#1a7a4a', name:'#1a7a4a' },
}

// ─── Contenido de los modales ──────────────────────────────────────
export const MODALS = {
  preregistro: {
    title: 'PRE-REGISTRO', badge: 'OPERANDO', badgeType: 'ok',
    kpiLabel: 'OCs ACTIVAS', kpiVal: '4', kpiColor: 'g',
    stats2: [
      { label:'PREPACKS RECIBIDOS', val:'9',    sub:'de 10 esperados (OC-001..OC-004)' },
      { label:'TASA DE RECEPCIÓN',  val:'90%',  sub:'1 faltante en OC-002', valColor:'#1a7a4a' },
    ],
    stats4: [
      { label:'DISCREPANCIA',   val:'1',  valColor:'#b07010', sub:'OC-002 (Pantalón Cargo)' },
      { label:'RFID INVÁLIDOS', val:'0',  valColor:'#1a7a4a', sub:'todos reconocidos' },
    ],
    bars: [
      { name:'Prepacks', pct:'9 / 10', fill:90, color:'#2db87a' },
    ],
    banners: [
      { type:'g', msg:'4 cargamentos recibidos correctamente (Textiles MTY, Confecciones Norte, Moda Express, ActiveWear)' },
      { type:'a', msg:'OC-002 Pantalón Cargo Denim Slim — 1 prepack faltante respecto a lo esperado' },
    ],
  },

  qa: {
    title: 'QA', badge: 'ALERTA', badgeType: 'alerta',
    kpiLabel: 'TASA DE ACEPTACIÓN', kpiVal: '82.5%', kpiColor: 'a',
    stats2: [
      { label:'APROBADOS',  val:'5', sub:'de 6 inspeccionados (3 OCs)' },
      { label:'RECHAZADOS', val:'1', sub:'E006A · Polo Piqué', valColor:'#c83020' },
    ],
    bars: [
      { name:'Aceptación actual', pct:'82.5%', fill:82.5, color:'#e8453c', valColor:'#c83020',
        thresholds:[{pos:50,lbl:'50%'},{pos:60,lbl:'60%'},{pos:85,lbl:'85%'}] },
    ],
    stacked: {
      segments:[{pct:82.5,color:'#2db87a'},{pct:17.5,color:'#f0b8b0'}],
      legend:[
        {color:'#2db87a', label:'Aprobados 82.5% (5 prepacks)'},
        {color:'#f0b8b0', label:'Rechazados 17.5% (1 prepack)'},
      ],
    },
    banners: [
      { type:'r', msg:'Tasa por debajo del umbral (85%). Prepack E006A (Textiles MTY · Polo Piqué) rechazado — revisar OC-006.' },
    ],
  },

  registro: {
    title: 'REGISTRO', badge: 'ALERTA', badgeType: 'alerta',
    kpiLabel: 'RENDIMIENTO ACTUAL', kpiVal: '28 PP/MIN', kpiColor: 'a',
    stats2: [
      { label:'PREPACKS EN REGISTRO', val:'7', sub:'OCs 008-011' },
      { label:'RECHAZADOS',           val:'1', sub:'E011A · Textiles MTY', valColor:'#c83020' },
    ],
    alertBanner: { type:'r', msg:'PREPACK RECHAZADO EN QA POSTERIOR', pct:'E011A' },
    donut: true,
    donutData: {
      labels:['Cross-dock','Refill','Nuevas tiendas'],
      data:[60,30,10],
      colors:['#1a7a4a','#8a9e90','#2db87a'],
    },
  },

  sorter: {
    title: 'SORTER', badge: 'ÓPTIMO', badgeType: 'ok',
    kpiLabel: 'VELOCIDAD ACTUAL', kpiVal: '35 PP/MIN', kpiColor: 'g',
    stats2: [
      { label:'PREPACKS ACTIVOS',   val:'5',   sub:'OCs 012-014' },
      { label:'% DEL CROSS-DOCK',   val:'100%', sub:'todos tipo CROSS_DOCK', valColor:'#1a7a4a' },
    ],
    bars: [
      { name:'Flujo operativo', pct:'35 pp/min', fill:70, color:'#2db87a', valColor:'#1a7a4a',
        thresholds:[{pos:67,lbl:'32 pp/min'}] },
    ],
    stacked: {
      segments:[{pct:100,color:'#2db87a'}],
      legend:[{color:'#2db87a', label:'Procesados 100% (5)'}],
    },
    banners:[{ type:'g', msg:'Por encima del umbral operativo (32 pp/min) — rendimiento pico' }],
  },

  bahia: {
    title: 'BAHÍA', badge: 'ALERTA', badgeType: 'warn',
    kpiLabel: 'TASA PROMEDIO', kpiVal: '31 PP/MIN', kpiColor: 'a',
    stats2: [
      { label:'PREPACKS EN BAHÍA',  val:'9',    sub:'5 OCs activas' },
      { label:'BAHÍAS ACTIVAS',     val:'9/10', sub:'BAHIA-4 con alerta', subColor:'#c83020' },
    ],
    // las 10 bahías del CEDIS — coinciden con frontend-sorter
    tablaBahias: [
      { bahia:'BAHIA-1  · MTY Centro',    prepacks:2, ppm:33, ok:true },
      { bahia:'BAHIA-2  · San Pedro',     prepacks:1, ppm:32, ok:true },
      { bahia:'BAHIA-3  · Guadalajara',   prepacks:2, ppm:34, ok:true },
      { bahia:'BAHIA-4  · CDMX Polanco',  prepacks:1, ppm:11, ok:false },
      { bahia:'BAHIA-5  · Puebla',        prepacks:1, ppm:33, ok:true },
      { bahia:'BAHIA-6  · SLP',           prepacks:1, ppm:32, ok:true },
      { bahia:'BAHIA-7  · Hermosillo',    prepacks:0, ppm:0,  ok:true },
      { bahia:'BAHIA-8  · Tijuana',       prepacks:1, ppm:34, ok:true },
      { bahia:'BAHIA-9  · Cancún',        prepacks:0, ppm:0,  ok:true },
      { bahia:'BAHIA-10 · Ciudad Juárez', prepacks:0, ppm:0,  ok:true },
    ],
    banners:[
      { type:'r', msg:'BAHIA-4 (Vértice CDMX Polanco) crítica a 11 pp/min — posible atasco' },
      { type:'a', msg:'Prepack E015B re-dirigido: llegó a BAHIA-4 cuando su destino era BAHIA-3 (Guadalajara)' },
    ],
  },

  auditoria: {
    title: 'AUDITORÍA', badge: 'ÓPTIMO', badgeType: 'ok',
    kpiLabel: 'TASA DE ACEPTACIÓN', kpiVal: '97.6%', kpiColor: 'g',
    stats2: [
      { label:'PREPACKS AUDITADOS', val:'7',     sub:'4 OCs (018-021)' },
      { label:'% APROBACIÓN',       val:'97.6%', sub:'1 anomalía pendiente', valColor:'#1a7a4a' },
    ],
    stats4: [
      { label:'APROBADOS',   val:'6', valColor:'#1a7a4a' },
      { label:'CON ALERTA',  val:'1', valColor:'#c83020', sub:'OC-019 (E019A)' },
    ],
    bars:[
      { name:'Aceptación', pct:'97.6%', fill:97.6, color:'#2db87a', valColor:'#1a7a4a',
        thresholds:[{pos:85,lbl:'85%'}] },
    ],
    stacked:{
      segments:[{pct:97.6,color:'#7a5ab8'},{pct:2.4,color:'#dde8df'}],
      legend:[
        {color:'#7a5ab8', label:'Aprobados 97.6% (6)'},
        {color:'#dde8df', label:'Con alerta 2.4% (1)'},
      ],
    },
    banners:[{ type:'g', msg:'Tasa muy por encima del umbral crítico (85%)' }],
  },

  envio: {
    title: 'ENVÍO', badge: 'OPERANDO', badgeType: 'ok',
    kpiLabel: 'PREPACKS ENVIADOS', kpiVal: '13', kpiColor: 'g',
    stats2: [
      { label:'ENVIADOS / APROBADOS', val:'100%', sub:'13 / 13', valColor:'#1a7a4a' },
      { label:'OCs CON FALTANTES',    val:'2',    sub:'OC-024 · OC-019', valColor:'#b07010' },
    ],
    bars:[
      { name:'Cumplimiento de envío', pct:'100%', fill:100, color:'#2db87a', valColor:'#1a7a4a' },
    ],
    // tiendas reales del RFID con discrepancia (OCs con faltantes del demo)
    tablaDiscrepancias:[
      { tienda:'TDA-044 · Puebla',  esperadas:3, enviadas:2, diff:-1 },
      { tienda:'TDA-051 · Cancún',  esperadas:3, enviadas:2, diff:-1 },
    ],
    banners:[
      { type:'a', msg:'Tiendas TDA-044 (Puebla) y TDA-051 (Cancún) con faltantes — verificar OCs originales' },
    ],
  },
}
