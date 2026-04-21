// Datos demo compartidos con frontend-rfid (mismas tiendas, mismos prepacks)
// Estructura real: 1 EPC = 1 prepack con varias prendas distintas

export const TIENDAS = {
  MTY_CENTRO:  { tienda_id:'TDA-007', nombre:'Vértice Monterrey Centro',  ciudad:'Monterrey',       estado:'NL',   bahia_asignada:'BAHIA-1' },
  MTY_SUR:     { tienda_id:'TDA-008', nombre:'Vértice Monterrey Sur',     ciudad:'Monterrey',       estado:'NL',   bahia_asignada:'BAHIA-1' },
  SAN_PEDRO:   { tienda_id:'TDA-015', nombre:'Vértice San Pedro',          ciudad:'San Pedro',       estado:'NL',   bahia_asignada:'BAHIA-2' },
  SALTILLO:    { tienda_id:'TDA-016', nombre:'Vértice Saltillo',           ciudad:'Saltillo',        estado:'COAH', bahia_asignada:'BAHIA-2' },
  GUADALAJARA: { tienda_id:'TDA-029', nombre:'Vértice Guadalajara',        ciudad:'Guadalajara',     estado:'JAL',  bahia_asignada:'BAHIA-3' },
  ZAPOPAN:     { tienda_id:'TDA-030', nombre:'Vértice Zapopan',            ciudad:'Zapopan',         estado:'JAL',  bahia_asignada:'BAHIA-3' },
  CDMX_POL:    { tienda_id:'TDA-033', nombre:'Vértice CDMX Polanco',       ciudad:'CDMX',            estado:'CDMX', bahia_asignada:'BAHIA-4' },
  CDMX_ROM:    { tienda_id:'TDA-034', nombre:'Vértice CDMX Roma',          ciudad:'CDMX',            estado:'CDMX', bahia_asignada:'BAHIA-4' },
  PUEBLA:      { tienda_id:'TDA-044', nombre:'Vértice Puebla',             ciudad:'Puebla',          estado:'PUE',  bahia_asignada:'BAHIA-5' },
  QUERETARO:   { tienda_id:'TDA-045', nombre:'Vértice Querétaro',          ciudad:'Querétaro',       estado:'QRO',  bahia_asignada:'BAHIA-5' },
  SLP:         { tienda_id:'TDA-046', nombre:'Vértice San Luis Potosí',    ciudad:'San Luis Potosí', estado:'SLP',  bahia_asignada:'BAHIA-6' },
  AGUASC:      { tienda_id:'TDA-047', nombre:'Vértice Aguascalientes',     ciudad:'Aguascalientes',  estado:'AGS',  bahia_asignada:'BAHIA-6' },
  HERMOSILLO:  { tienda_id:'TDA-048', nombre:'Vértice Hermosillo',         ciudad:'Hermosillo',      estado:'SON',  bahia_asignada:'BAHIA-7' },
  CULIACAN:    { tienda_id:'TDA-049', nombre:'Vértice Culiacán',           ciudad:'Culiacán',        estado:'SIN',  bahia_asignada:'BAHIA-7' },
  TIJUANA:     { tienda_id:'TDA-050', nombre:'Vértice Tijuana',            ciudad:'Tijuana',         estado:'BC',   bahia_asignada:'BAHIA-8' },
  CANCUN:      { tienda_id:'TDA-051', nombre:'Vértice Cancún',             ciudad:'Cancún',          estado:'QROO', bahia_asignada:'BAHIA-9' },
  MERIDA:      { tienda_id:'TDA-052', nombre:'Vértice Mérida',             ciudad:'Mérida',          estado:'YUC',  bahia_asignada:'BAHIA-9' },
  MEXICALI:    { tienda_id:'TDA-053', nombre:'Vértice Mexicali',           ciudad:'Mexicali',        estado:'BC',   bahia_asignada:'BAHIA-8' },
  CHIHUAHUA:   { tienda_id:'TDA-054', nombre:'Vértice Chihuahua',          ciudad:'Chihuahua',       estado:'CHIH', bahia_asignada:'BAHIA-10' },
  JUAREZ:      { tienda_id:'TDA-055', nombre:'Vértice Ciudad Juárez',      ciudad:'Cd. Juárez',      estado:'CHIH', bahia_asignada:'BAHIA-10' },
}

function mkPrepack(epc, ocId, ocNombre, proveedor, tienda, prendas) {
  const colores = [...new Set(prendas.map(p => p.color))]
  const tallas  = [...new Set(prendas.map(p => p.talla))]
  return {
    epc,
    orden_id: ocId,
    producto: ocNombre,
    proveedor,
    tienda,
    bayNumber: parseInt(tienda.bahia_asignada.replace('BAHIA-','')),
    prendas,
    colores,
    tallas,
    total_prendas: prendas.length,
    color: colores[0],
    talla: tallas.join('/'),
    qa_fallido: false,
    tipo_flujo: 'CROSS_DOCK',
  }
}

// Lista plana de prepacks (mismos del DEMO_OCS de frontend-rfid)
// El sorter va escaneándolos uno a uno simulando que llegan al conveyor
export const DEMO_PREPACKS = [
  mkPrepack('E001A','OC-001','Playera Básica Manga Corta','Textiles Monterrey SA', TIENDAS.MTY_CENTRO,  [{color:'Azul',talla:'S'},{color:'Azul',talla:'M'},{color:'Negro',talla:'S'},{color:'Negro',talla:'L'}]),
  mkPrepack('E001B','OC-001','Playera Básica Manga Corta','Textiles Monterrey SA', TIENDAS.SAN_PEDRO,    [{color:'Blanco',talla:'XS'},{color:'Blanco',talla:'S'},{color:'Rojo',talla:'M'},{color:'Rojo',talla:'L'}]),
  mkPrepack('E001C','OC-001','Playera Básica Manga Corta','Textiles Monterrey SA', TIENDAS.GUADALAJARA, [{color:'Verde',talla:'S'},{color:'Verde',talla:'M'},{color:'Azul',talla:'XL'}]),
  mkPrepack('E002A','OC-002','Pantalón Cargo Denim Slim','Confecciones del Norte', TIENDAS.HERMOSILLO,  [{color:'Azul',talla:'28'},{color:'Azul',talla:'30'},{color:'Negro',talla:'32'},{color:'Negro',talla:'34'}]),
  mkPrepack('E002B','OC-002','Pantalón Cargo Denim Slim','Confecciones del Norte', TIENDAS.TIJUANA,    [{color:'Café',talla:'30'},{color:'Café',talla:'32'},{color:'Azul',talla:'36'}]),
  mkPrepack('E003A','OC-003','Blusa Fluida Manga Larga','Moda Express MX',         TIENDAS.CDMX_POL,    [{color:'Blanco',talla:'S'},{color:'Blanco',talla:'M'},{color:'Rosa',talla:'S'},{color:'Rosa',talla:'M'}]),
  mkPrepack('E003B','OC-003','Blusa Fluida Manga Larga','Moda Express MX',         TIENDAS.PUEBLA,      [{color:'Azul',talla:'L'},{color:'Azul',talla:'XL'},{color:'Blanco',talla:'L'}]),
  mkPrepack('E004A','OC-004','Chamarra Impermeable Sport','ActiveWear CDMX',       TIENDAS.MTY_SUR,     [{color:'Negro',talla:'M'},{color:'Negro',talla:'L'},{color:'Gris',talla:'M'},{color:'Gris',talla:'XL'}]),
  mkPrepack('E004B','OC-004','Chamarra Impermeable Sport','ActiveWear CDMX',       TIENDAS.SALTILLO,    [{color:'Azul',talla:'S'},{color:'Azul',talla:'M'},{color:'Negro',talla:'XL'}]),
  mkPrepack('E005B','OC-005','Vestido Casual Verano','Diseños Guadalajara',        TIENDAS.GUADALAJARA, [{color:'Amarillo',talla:'M'},{color:'Azul',talla:'S'},{color:'Azul',talla:'M'},{color:'Blanco',talla:'L'}]),
  mkPrepack('E005C','OC-005','Vestido Casual Verano','Diseños Guadalajara',        TIENDAS.ZAPOPAN,     [{color:'Blanco',talla:'S'},{color:'Rosa',talla:'M'},{color:'Rosa',talla:'L'}]),
  mkPrepack('E007A','OC-007','Short Deportivo Running','ActiveWear CDMX',          TIENDAS.SAN_PEDRO,   [{color:'Negro',talla:'S'},{color:'Negro',talla:'M'},{color:'Azul',talla:'S'},{color:'Azul',talla:'M'}]),
  mkPrepack('E007B','OC-007','Short Deportivo Running','ActiveWear CDMX',          TIENDAS.SALTILLO,    [{color:'Rojo',talla:'L'},{color:'Rojo',talla:'XL'},{color:'Negro',talla:'L'}]),
  mkPrepack('E009A','OC-009','Pantalón Chino Slim Fit','Confecciones del Norte',   TIENDAS.MTY_CENTRO,  [{color:'Beige',talla:'30'},{color:'Beige',talla:'32'},{color:'Verde',talla:'30'},{color:'Verde',talla:'34'}]),
  mkPrepack('E009B','OC-009','Pantalón Chino Slim Fit','Confecciones del Norte',   TIENDAS.CDMX_POL,    [{color:'Azul',talla:'32'},{color:'Azul',talla:'36'},{color:'Café',talla:'30'}]),
  mkPrepack('E010A','OC-010','Sudadera Hoodie Oversize','Urban Trends MX',         TIENDAS.CDMX_ROM,    [{color:'Negro',talla:'S'},{color:'Negro',talla:'M'},{color:'Gris',talla:'M'},{color:'Gris',talla:'L'}]),
  mkPrepack('E010B','OC-010','Sudadera Hoodie Oversize','Urban Trends MX',         TIENDAS.PUEBLA,      [{color:'Azul',talla:'XL'},{color:'Azul',talla:'XXL'},{color:'Blanco',talla:'S'},{color:'Blanco',talla:'M'}]),
  mkPrepack('E013A','OC-013','Jean Skinny Mujer','Diseños Guadalajara',            TIENDAS.GUADALAJARA, [{color:'Azul Oscuro',talla:'25'},{color:'Azul Oscuro',talla:'27'},{color:'Negro',talla:'25'},{color:'Negro',talla:'27'}]),
  mkPrepack('E013B','OC-013','Jean Skinny Mujer','Diseños Guadalajara',            TIENDAS.ZAPOPAN,     [{color:'Gris',talla:'29'},{color:'Gris',talla:'31'},{color:'Negro',talla:'29'}]),
  mkPrepack('E014A','OC-014','Playera Polo Sport','ActiveWear CDMX',               TIENDAS.HERMOSILLO,  [{color:'Blanco',talla:'M'},{color:'Blanco',talla:'L'},{color:'Azul',talla:'S'},{color:'Azul',talla:'M'}]),
  mkPrepack('E014B','OC-014','Playera Polo Sport','ActiveWear CDMX',               TIENDAS.TIJUANA,     [{color:'Negro',talla:'XL'},{color:'Negro',talla:'XXL'},{color:'Gris',talla:'L'}]),
  mkPrepack('E015A','OC-015','Shorts Playa Tropical','Estampados MX',              TIENDAS.MTY_CENTRO,  [{color:'Azul',talla:'S'},{color:'Azul',talla:'M'},{color:'Verde',talla:'S'},{color:'Verde',talla:'M'}]),
  mkPrepack('E015B','OC-015','Shorts Playa Tropical','Estampados MX',              TIENDAS.GUADALAJARA, [{color:'Naranja',talla:'L'},{color:'Naranja',talla:'XL'},{color:'Rojo',talla:'M'}]),
  mkPrepack('E015C','OC-015','Shorts Playa Tropical','Estampados MX',              TIENDAS.CDMX_POL,    [{color:'Azul',talla:'L'},{color:'Verde',talla:'XL'},{color:'Blanco',talla:'S'}]),
  mkPrepack('E017A','OC-017','Chamarra Denim Oversize','Urban Trends MX',          TIENDAS.MEXICALI,    [{color:'Azul',talla:'S'},{color:'Azul',talla:'M'},{color:'Negro',talla:'L'},{color:'Negro',talla:'XL'}]),
  mkPrepack('E017B','OC-017','Chamarra Denim Oversize','Urban Trends MX',          TIENDAS.CHIHUAHUA,   [{color:'Blanco',talla:'M'},{color:'Blanco',talla:'L'},{color:'Gris',talla:'XL'}]),
  mkPrepack('E018A','OC-018','Playera Básica Premium','Textiles Monterrey SA',     TIENDAS.MTY_CENTRO,  [{color:'Blanco',talla:'S'},{color:'Blanco',talla:'M'},{color:'Negro',talla:'L'},{color:'Negro',talla:'XL'}]),
  mkPrepack('E020A','OC-020','Blusa Casual Rayas','Moda Express MX',               TIENDAS.HERMOSILLO,  [{color:'Azul',talla:'S'},{color:'Azul',talla:'M'},{color:'Rojo',talla:'S'},{color:'Rojo',talla:'M'}]),
  mkPrepack('E020B','OC-020','Blusa Casual Rayas','Moda Express MX',               TIENDAS.MERIDA,      [{color:'Blanco',talla:'L'},{color:'Blanco',talla:'XL'},{color:'Azul',talla:'L'}]),
  mkPrepack('E022A','OC-022','Pantalón Jogger Tech','ActiveWear CDMX',             TIENDAS.HERMOSILLO,  [{color:'Negro',talla:'S'},{color:'Negro',talla:'M'},{color:'Gris',talla:'L'},{color:'Gris',talla:'XL'}]),
  mkPrepack('E022B','OC-022','Pantalón Jogger Tech','ActiveWear CDMX',             TIENDAS.TIJUANA,     [{color:'Azul',talla:'M'},{color:'Azul',talla:'L'},{color:'Verde',talla:'S'}]),
  mkPrepack('E022C','OC-022','Pantalón Jogger Tech','ActiveWear CDMX',             TIENDAS.MEXICALI,    [{color:'Verde',talla:'M'},{color:'Negro',talla:'XL'},{color:'Gris',talla:'M'}]),
]

// Color por número de bahía (10 bahías reales)
export const BAY_COLORS = {
  1:  '#3b82f6', 2:  '#8b5cf6', 3:  '#f59e0b', 4:  '#ec4899', 5:  '#10b981',
  6:  '#06b6d4', 7:  '#f97316', 8:  '#a855f7', 9:  '#84cc16', 10: '#ef4444',
}

export const COLORES_CSS = {
  azul:'#3b82f6', rojo:'#ef4444', verde:'#22c55e', negro:'#1e293b',
  blanco:'#f8fafc', amarillo:'#eab308', rosa:'#ec4899', gris:'#94a3b8',
  'café':'#92400e', cafe:'#92400e', naranja:'#f97316', morado:'#8b5cf6',
  beige:'#d4b896', 'azul oscuro':'#1e3a8a', 'azul marino':'#1e3a8a',
}

export function getColorCSS(c) {
  return COLORES_CSS[(c||'').toLowerCase()] || '#94a3b8'
}

export function esColorClaro(c) {
  return ['blanco','white','beige','amarillo','yellow'].includes((c||'').toLowerCase())
}
