# frontend-sorter — Módulo Sorter & Bahía
## Vertiche SortFlow · Puerto 4001

Módulo del operador junto al conveyor del sorter y monitor fijo en cada bahía.
Consume la API del backend RFID (puerto 3000) y escucha WebSocket en tiempo real.

---

## Qué resuelve

El operador del sorter necesita saber **a qué bahía llevar cada prepack** en cuanto el lector RFID lo detecta. Este módulo lo muestra con claridad instantánea, y dispara una alerta visual de pantalla completa cuando el sorter rutea un paquete a la bahía incorrecta.

Adicionalmente hay una pantalla fija en cada bahía del CEDIS que muestra a los operadores de las 3 estaciones qué prepack tomar en cada momento.

---

## Rutas

| Ruta | Pantalla | Usuario |
|---|---|---|
| `/` | Redirige a `/sorter` | — |
| `/sorter` | Vista del operador del conveyor | Operador del sorter |
| `/bahia/:id` | Monitor fijo de una bahía (1–10) | Operador de bahía |

---

## Estructura

```
frontend-sorter/
├── src/
│   ├── App.jsx                      Router (sorter + bahia/:id) + carga de Google Fonts
│   ├── main.jsx                     Entry point
│   ├── index.css                    Variables CSS, keyframes, reset
│   ├── api/
│   │   └── sorterApi.js             fetch al backend (/api/bahias, /api/cajas, /api/tiendas)
│   ├── socket/
│   │   └── socketClient.js          Socket.io singleton conectado al backend
│   ├── data/
│   │   └── demoData.js              20 TIENDAS + 32 DEMO_PREPACKS + BAY_COLORS + helpers
│   ├── components/
│   │   ├── Icons.jsx                SVG icons inline (sin emojis)
│   │   ├── BayHero.jsx              Círculo gigante de bahía (legacy, reemplazado inline)
│   │   ├── ScanHistory.jsx          Panel historial clickeable
│   │   ├── PackageDetails.jsx       Barra inferior con detalles (legacy)
│   │   ├── MisrouteAlert.jsx        Banner rojo (legacy, reemplazado por alerta full-screen)
│   │   ├── TerminalColumn.jsx       Columna de estación (legacy)
│   │   ├── PrepackDetailBar.jsx     Detalle inline centro (3 columnas: tabla / tienda / estatus)
│   │   └── PrepackDetailPanel.jsx   Detalle lateral full-height (usado en BayScreen)
│   └── pages/
│       ├── SorterScreen.jsx         Pantalla del sorter
│       └── BayScreen.jsx            Pantalla monitor de bahía
└── .env                             VITE_API_URL + VITE_SOCKET_URL
```

---

## Datos y modelo

### Estructura real del prepack (compartida con frontend-rfid)

> **1 EPC = 1 prepack físico = varias prendas de distintos colores y tallas**

```js
{
  epc: 'E001A',
  orden_id: 'OC-001',
  producto: 'Playera Básica Manga Corta',
  proveedor: 'Textiles Monterrey SA',
  tienda: { nombre, ciudad, estado, bahia_asignada: 'BAHIA-3' },
  bayNumber: 3,                                   // parseado de bahia_asignada
  prendas: [
    { color:'Azul',  talla:'S' },
    { color:'Azul',  talla:'M' },
    { color:'Negro', talla:'S' },
    { color:'Negro', talla:'L' },
  ],
  colores, tallas, total_prendas,                 // derivados
  qa_fallido, tipo_flujo, sku, color, talla,
}
```

El demo tiene **32 prepacks repartidos en 10 bahías**, con los mismos productos/tiendas que el módulo RFID.

---

## SorterScreen (`/sorter`)

### Layout (una sola pantalla sin scroll global)

```
┌──────────────────────────────────────────────────────────────────┐
│  HEADER   Vertiche SortFlow — Sorter       Σ5  ⚡5  • Activo     │
├───────────────────────────────────────────────┬──────────────────┤
│                                                │  HISTORIAL 15    │
│              LLEVAR A                          │  ┌────────────┐  │
│                                                │  │ 3 Playera… │  │
│               ┌──────┐                         │  ├────────────┤  │
│               │  7   │   (bahía — min 26vh)    │  │ 2 Playera… │  │
│               └──────┘                         │  ├────────────┤  │
│             Bahía 7                            │  │ 1 Playera… │  │
│          Vértice Hermosillo · Hermosillo       │  │     …      │  │
│                                                │  │            │  │
│   RFID ···E002A | Producto Pant. | Orden OC-02│  │            │  │
│                                                │  │            │  │
│   ┌── Contenido ──┐ ┌── Tienda ──┐ ┌─ Estatus ─┐│  │            │  │
│   │ color × talla │ │ V. Herm.   │ │ ✓ QA OK   ││  │            │  │
│   │ tabla         │ │ BC · bahía │ │ Orden 002 ││  │            │  │
│   └───────────────┘ └────────────┘ └───────────┘│  │            │  │
│                                                │  │            │  │
│          [ ⊟ ESCANEO RFID ]                    │  └────────────┘  │
└───────────────────────────────────────────────┴──────────────────┘
```

### Regiones

| Región | Descripción |
|---|---|
| Header | Título + contadores `Σ escaneados`, `⚡ pq/min`, estado `Activo` (verde pulsante) |
| Centro | Bahía gigante (número + color), info breve, tabla `color × talla`, tienda, estatus, botón |
| Historial derecha | Últimos 20 escaneos — clic en uno actualiza el detalle central |

### Cuando todo va bien

- Fondo: gradiente radial tenue con el color de la bahía
- Círculo de bahía con borde de 4px y glow animado (keyframe `glow-bay`)
- Debajo: info breve (RFID, Producto, Orden) en una tarjeta pill
- Debajo: grid 3 columnas con tabla `color × talla` + tienda destino + estatus
- Botón "ESCANEO RFID" centrado abajo, azul

### Cuando el sorter se equivoca (modo alerta)

Cuando `isMisrouted === true`:

- **Fondo de todo el centro se vuelve rojo** (gradiente radial `rgba(239,68,68,0.22)`)
- El título "LLEVAR A" se reemplaza por **"⚠ ERROR DE SORTER ⚠"** en rojo, parpadeando
- Se muestran **dos bahías lado a lado** con una flecha roja grande entre ellas:
  - Izquierda: bahía incorrecta (tachada, opacidad 55%, label "Está en")
  - Derecha: bahía correcta a tamaño completo con glow, label "Llevar a"
- Texto debajo: **"Redirigir a Bahía X"** grande, blanco + color de la bahía correcta
- La info breve y el detalle `color × talla` siguen visibles pero **reducidos al 72%** y opacidad 85%
- Cuando pasa el siguiente escaneo sin error, todo vuelve a normal con transición suave

Esto evita el banner arriba (que comprimía el layout) y da al operador una respuesta inmediata: **solo ve la bahía correcta y la incorrecta, grandes y claras.**

### Botón "ESCANEO RFID"

Simula un escaneo manual (útil para demo sin simulador corriendo). Toma el siguiente prepack del array `DEMO_PREPACKS` y lo procesa. Cada 5 escaneos simula un error de sorter para mostrar la alerta.

### Conexión WebSocket

Escucha eventos `lectura` y `nueva_lectura` del backend. Si la etapa es `SORTER`, busca el EPC en `DEMO_PREPACKS` y dispara `processScan`.

---

## BayScreen (`/bahia/:id`)

### Layout

```
┌──────────────────────────────────────────────────────────────────┐
│  HEADER   ⊙ Bahía 3 — 4 prepacks                   • En vivo      │
├────────────────────┬────────────────────┬──────────┬──────────────┤
│ Estación 1         │ Estación 2         │ Estac. 3 │  DETALLE     │
│ ┌────────────────┐ │ ┌────────────────┐ │ ┌──────┐ │  (full height)│
│ │···E015A        │ │ │···E015B        │ │ │E015C │ │  Header      │
│ │Shorts Playa T. │ │ │Shorts Playa T. │ │ │ …    │ │  Tabla c×t    │
│ │Azul·Verde      │ │ │Naranja·Rojo    │ │ └──────┘ │  Tienda      │
│ │Vtc. MTY Centro │ │ │Vtc. GDL        │ │          │  Estatus     │
│ └────────────────┘ │ └────────────────┘ │          │              │
│                    │                    │          │              │
└────────────────────┴────────────────────┴──────────┴──────────────┘
```

### Regiones

| Región | Descripción |
|---|---|
| Header | Círculo con número de bahía + contador de prepacks + indicador "En vivo" |
| 3 Estaciones | Grid 3 columnas. Prepacks de la bahía se reparten round-robin entre estaciones. Cada tarjeta muestra código EPC, orden, producto, colores/tallas y tienda |
| Panel detalle derecha | `PrepackDetailPanel` full-height con tabla `color × talla`, tienda destino, estatus QA |

Al hacer clic en cualquier prepack de las estaciones, el panel de la derecha se actualiza.

---

## Componentes clave

### `PrepackDetailBar.jsx` (inline, centro)

Grid de 3 columnas compacto. Usado en SorterScreen debajo de la bahía.

- **Col 1 — Contenido del prepack**: tabla `color × talla` con círculos de color, totales por fila/columna y total global resaltado con el color de la bahía
- **Col 2 — Tienda destino**: nombre, ciudad/estado, resumen de prendas, EPC completo
- **Col 3 — Estatus**: pill de calidad (✓/✗) + tarjeta con el ID de orden

### `PrepackDetailPanel.jsx` (lateral, full-height)

Versión vertical del panel de detalle. Usado en BayScreen como columna derecha fija.

### `Icons.jsx`

SVG icons inline (no se usan emojis en ningún lado):
`IconAntenna`, `IconScan`, `IconBolt`, `IconSigma`, `IconCheck`, `IconX`, `IconWarning`, `IconArrow`, `IconDot`.

### `ScanHistory.jsx`

Panel lateral con los últimos 20 escaneos. Cada item es clickeable — actualiza el detalle central. Prop `side="right"|"left"` controla el borde.

### `demoData.js`

- `TIENDAS`: 20 tiendas con `bahia_asignada` (BAHIA-1 a BAHIA-10)
- `DEMO_PREPACKS`: 32 prepacks reales (mismos EPCs que frontend-rfid: E001A, E002A, etc.)
- `BAY_COLORS`: mapa número → color HEX para las 10 bahías
- `COLORES_CSS`, `getColorCSS`, `esColorClaro`: helpers para renderizar círculos de color

---

## Design system

Tema oscuro, fuentes **Syne** (display) + **Space Mono** (código/números).

### Colores

| Variable | Valor | Uso |
|---|---|---|
| `--bg` | `#0f0f13` | Fondo principal |
| `--bg1` | `#13131a` | Paneles y tarjetas |
| `--bg2` | `#1a1a24` | Headers de tablas, fondos secundarios |
| `--border` | `#2a2a40` | Bordes y divisores |
| `--text` | `#e8e8f0` | Texto principal |
| `--muted` | `#666680` | Etiquetas, texto secundario |
| `--accent` | `#f5c518` | Amarillo — números destacados |
| `--accent2` | `#ff6b35` | Naranja — gradientes de headers |

### Colores de bahía (10 bahías)

```js
{
  1: '#3b82f6',  2: '#8b5cf6',  3: '#f59e0b',  4: '#ec4899',  5: '#10b981',
  6: '#06b6d4',  7: '#f97316',  8: '#a855f7',  9: '#84cc16', 10: '#ef4444',
}
```

### Estados semánticos

| Color | Hex | Significado |
|---|---|---|
| Verde | `#4caf50` | QA OK, flujo normal, estado activo |
| Rojo | `#ef4444` | QA falló, error de sorter, alerta |
| Ámbar | `#f59e0b` | Atención (no usado activamente aún) |

### Animaciones

| Keyframe | Uso |
|---|---|
| `glow-bay` | Glow pulsante del círculo de bahía |
| `blink` | Alerta parpadeante (error de sorter, dot de en vivo) |
| `slideIn` | Entrada de tarjetas nuevas (historial, prepacks) |
| `fadeIn` | Entrada de paneles al cambiar de estado |
| `pop` | Rebote cuando cambia el contador pq/min |

### Sin emojis

Todos los íconos son SVG inline. En ninguna parte del código se usan caracteres emoji.

---

## API y WebSocket

### Endpoints consumidos (en `sorterApi.js`)

```
GET /api/bahias/:id/prepacks-activos     ← pendiente en backend
GET /api/sorter/siguiente-prepack        ← pendiente en backend
GET /api/tiendas                         ← existe
GET /api/cajas?bahia=BAHIA-N             ← existe
```

Los endpoints marcados como "pendiente" se agregarán cuando el equipo RFID los implemente. Por ahora la app funciona 100% con los datos demo de `demoData.js`.

### Eventos WebSocket

Escucha tanto `lectura` (evento actual del backend RFID) como `nueva_lectura` (evento futuro). Solo procesa lecturas con `etapa === 'SORTER'` o `etapa === 'BAHIA'`.

---

## Cómo correr

```bash
cd frontend-sorter
npm install
npm run dev
# http://localhost:4001/sorter
# http://localhost:4001/bahia/1  …  /bahia/10
```

Requiere que el backend esté corriendo en `http://localhost:3000` para WebSocket. Sin backend, el botón "ESCANEO RFID" funciona igual con datos demo.

---

## Historial de iteraciones visuales

1. **v1** — Layout 3 columnas (historial izq + bahía centro + detalle der)
2. **v2** — Modal al hacer clic en el prepack
3. **v3** — Modal reemplazado por panel lateral always-visible
4. **v4** — Panel lateral → barra horizontal inferior
5. **v5** — Barra inferior → panel lateral derecho (full height)
6. **v6** — Historial movido a la derecha, detalle inline debajo de la bahía
7. **v7** — Sin emojis, todo con SVG icons
8. **v8** — Banner de error arriba reemplazado por alerta de pantalla completa (rojo)
9. **v9 (actual)** — En modo alerta: dos bahías lado a lado con flecha roja, info y detalle escalados al 72%

---

*Vertiche SortFlow — frontend-sorter — Abril 2026*
