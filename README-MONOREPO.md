# Vertiche SortFlow — Monorepo Master

> Documento de referencia para todo el equipo y para las IAs (Claude Web + Claude Code).
> Cualquier decisión de arquitectura vive aquí. Última actualización: Abril 2026.

---

## Estructura del repositorio

```
vertiche-sortflow/
├── backend/                   ← API única compartida (Node.js + Express + Prisma)
├── frontend-rfid/             ← Módulo RFID y Trazabilidad        (puerto 4000)
├── frontend-sorter/           ← Módulo Sorter + Bahía + Empaque   (puerto 4001)
├── frontend-dashboard/        ← Módulo Dashboard + KPI + Flujo    (puerto 4002)
├── frontend-proveedores/      ← Módulo Calificación Proveedores   (puerto 4003)
├── simulator/                 ← Simulador de lecturas RFID
├── docker-compose.yml
├── README-MONOREPO.md         ← Este archivo
└── README-RFID.md             ← Detalle técnico del módulo RFID
```

---

## Principio fundamental

**Un solo backend. Una sola base de datos. Cuatro frontends independientes.**

- Los módulos NO se navegan entre sí. Cada uno corre en su propio puerto y es usado por un perfil de usuario distinto.
- Toda la información viene del mismo PostgreSQL vía el backend en puerto 3000.
- El backend del equipo RFID es el backend de todo el proyecto. Los demás módulos solo consumen y extienden su API.

---

## Módulos — quién los usa y qué hacen

| Módulo | Puerto | Usuario | Función |
|---|---|---|---|
| `frontend-rfid` | 4000 | Supervisor CEDIS | Trazabilidad en tiempo real, FlujoCEDIS Gantt, lecturas live, órdenes de compra |
| `frontend-sorter` | 4001 | Operador de bahía | Pantalla de bahía: qué prepack tomar en qué estación. Banner de error de sorter |
| `frontend-dashboard` | 4002 | Gerente de operaciones | KPIs del día, throughput, alertas, detalle por etapa |
| `frontend-proveedores` | 4003 | QA / Jefe de recepción | Inspección de prepacks, calificación de proveedores, historial de QA |

---

## Stack técnico

| Capa | Tecnología | Versión |
|---|---|---|
| Backend | Node.js + Express | 18+ / 4.x |
| ORM | Prisma | 5.x |
| Base de datos | PostgreSQL | 15+ |
| Tiempo real | Socket.io | 4.x |
| Frontend (todos) | React + Vite | 18.x / 4.x |
| Tipografía RFID | IBM Plex Sans / Mono | Google Fonts |
| Tipografía Sorter | Syne + Space Mono | Google Fonts |
| Tipografía Dashboard | Rajdhani + Inter | Google Fonts |

> **Nota de unificación:** En Sprint 3 se recomienda migrar todos los frontends a IBM Plex Sans/Mono (Design System V8 de RFID) para consistencia visual.

---

## Puertos

| Servicio | Puerto |
|---|---|
| Backend API | 3000 |
| PostgreSQL | 5432 |
| frontend-rfid | 4000 |
| frontend-sorter | 4001 |
| frontend-dashboard | 4002 |
| frontend-proveedores | 4003 |

---

## Las 7 etapas oficiales del CEDIS

Definidas por el equipo RFID. **Todos los módulos deben respetar exactamente estos nombres.**

| # | Etapa | Lector RFID | Módulo que la usa |
|---|---|---|---|
| 1 | PREREGISTRO | RFID-RECEPCION-1 | RFID, Proveedores |
| 2 | QA | RFID-QA-1 | RFID, Proveedores |
| 3 | REGISTRO | RFID-REGISTRO-1 | RFID |
| 4 | SORTER | RFID-SORTER-1 | RFID, Sorter |
| 5 | BAHIA | RFID-BAHIA-{N} | RFID, Sorter |
| 6 | AUDITORIA | RFID-AUDITORIA-1 | RFID, Dashboard |
| 7 | ENVIO | RFID-ENVIO-1 | RFID, Dashboard |

---

## Base de datos — tablas clave por módulo

La DB completa está definida en `backend/prisma/schema.prisma`.

### Tablas que RFID ya creó (no tocar el schema sin coordinación)
- `tiendas` — sucursales con bahia_asignada
- `proveedores` — empresas que surten
- `ordenes_compra` — OC con nombre_producto, foto_url
- `detalle_orden` — desglose SKU/talla/color
- `pedidos` — envíos de proveedor
- `palets` — contenedores de prepacks
- `tags` — etiquetas RFID individuales (EPC)
- `lecturas` — cada lectura de un lector RFID
- `anomalias` — errores detectados
- `cajas` — cajas de desembarque en bahías
- `palet_etapa_log` — historial de etapas por palet

### Tablas que faltan (a agregar en Prisma)

**Para frontend-proveedores:**
```prisma
model inspeccion_qa {
  id              Int      @id @default(autoincrement())
  tag_epc         String   // FK a tags.epc
  proveedor_id    Int      // FK a proveedores
  operador_id     String   // quien hizo la inspección
  resultado       ResultadoQA  // APROBADO | OBSERVADO | RECHAZADO
  defecto_tipo    String?
  observacion     String?
  fecha           DateTime @default(now())
}

enum ResultadoQA { APROBADO OBSERVADO RECHAZADO }
```

**Para frontend-dashboard (ya existen en parte, verificar):**
- KPIs agregados se calculan desde `lecturas` y `palet_etapa_log` — no necesitan tabla nueva, solo endpoints.

**Para frontend-sorter:**
- No necesita tablas nuevas. Lee `tags`, `cajas`, `tiendas` y `palets` del backend existente.

---

## Rutas del backend por módulo

### Ya existen (equipo RFID)
```
POST /api/lecturas
GET  /api/lecturas
GET  /api/tags
GET  /api/cajas
GET  /api/anomalias
GET  /api/trazabilidad/:epc
GET  /api/dashboard
GET  /api/proveedores
GET  /api/tiendas
GET  /api/pedidos
GET  /api/palets/:id
GET  /api/ordenes
```

### Faltan — agregar al backend

**Para frontend-sorter:**
```
GET  /api/bahias/:id/prepacks-activos   ← prepacks en bahía ahora mismo
GET  /api/sorter/siguiente-prepack      ← qué prepack sigue en el conveyor
GET  /api/cajas/:id/estado              ← llenado actual de una caja
```

**Para frontend-dashboard:**
```
GET  /api/kpis/dia                      ← cumplimiento, throughput, alertas del día
GET  /api/kpis/throughput-timeline      ← 44 puntos cada 12 min para la gráfica
GET  /api/etapas/:nombre/detalle        ← KPIs de una etapa específica
```

**Para frontend-proveedores:**
```
GET  /api/proveedores/:id/perfil        ← datos extendidos + historial QA + sparkline
GET  /api/proveedores/:id/qa-historia   ← historial de inspecciones
POST /api/inspeccion-qa                 ← guardar resultado de inspección
GET  /api/qa/prepacks-pendientes        ← prepacks en etapa QA sin inspeccionar
PUT  /api/proveedores/:id/calificacion  ← actualizar rating del proveedor
```

---

## Descripción de cada módulo

### frontend-rfid (puerto 4000) — COMPLETO ✅
React + Vite. 5 tabs con modales flotantes. Design System V8 (IBM Plex).
Ver `README-RFID.md` para detalle completo.
**Sprint actual:** 6 completados. Pendiente: commit V9.9.2 + push.

---

### frontend-sorter (puerto 4001) — MIGRADO A REACT ✅
**Stack:** React + Vite + react-router-dom + socket.io-client. Tema oscuro, fuentes Syne + Space Mono, SVG icons inline (sin emojis).

**Dos rutas:**

**`/sorter` — Pantalla del operador del conveyor**

Layout en una sola pantalla sin scroll global. Tres regiones:
- Centro: círculo gigante con número de bahía destino (glow pulsante, color por bahía), info breve (RFID / Producto / Orden), tabla `color × talla` + tienda + estatus debajo, botón "ESCANEO RFID"
- Historial derecha (256px): últimos 20 escaneos clickeables — al dar clic actualiza el detalle central
- Header: contadores `Σ escaneados`, `⚡ pq/min`, indicador "Activo" (pulsante verde)

**Modo alerta full-screen** cuando el sorter ruteo mal un paquete (`isMisrouted=true`):
- Fondo radial rojo reemplaza el color de la bahía
- Título cambia a "⚠ ERROR DE SORTER ⚠" parpadeando
- **Dos bahías lado a lado** con flecha roja grande entre ellas: izq bahía incorrecta (tachada, opaca), der bahía correcta (tamaño completo, con glow)
- Texto grande "Redirigir a Bahía X" + nombre de la tienda destino
- Info breve y tabla color×talla siguen visibles pero escaladas al 72% con opacidad 85% (no se comprimen ni se ocultan)
- Transición suave al volver a flujo normal

**`/bahia/:id` — Monitor fijo de bahía (1–10)**

- Header con círculo del número de bahía y contador de prepacks
- Grid de 3 estaciones que reparten los prepacks de la bahía round-robin
- Cada tarjeta de prepack muestra código EPC, orden, producto, colores/tallas y tienda
- Panel lateral derecho `PrepackDetailPanel` full-height con el detalle del prepack seleccionado (tabla color×talla, tienda, estatus QA)

**Datos compartidos con frontend-rfid:**
- `src/data/demoData.js` replica las 20 tiendas y 32 prepacks reales del módulo RFID (EPCs E001A, E002A, etc.)
- Cada prepack sigue la estructura V9.9.2: **1 EPC = 1 prepack con `prendas[]`** de distintos colores y tallas
- 10 bahías (BAHIA-1 a BAHIA-10) con color HEX único por bahía

**Componentes clave:**
- `PrepackDetailBar` — detalle inline 3-columnas (tabla / tienda / estatus), usado en SorterScreen
- `PrepackDetailPanel` — detalle vertical full-height, usado en BayScreen
- `ScanHistory` — panel de historial con prop `side="right"|"left"`
- `Icons.jsx` — SVG inline: Antenna, Scan, Bolt, Sigma, Check, X, Warning, Arrow, Dot

**WebSocket:**
Escucha `lectura` y `nueva_lectura` del backend. Solo procesa `etapa === 'SORTER'` o `'BAHIA'`. Busca el EPC en `DEMO_PREPACKS` para enriquecer con producto/tienda/prendas.

**Datos que necesita del backend (pendientes):**
- `GET /api/bahias/:id/prepacks-activos`
- `GET /api/sorter/siguiente-prepack`
- Anomalías de ruteo `BAHIA_INCORRECTA` vía evento WebSocket

Por ahora funciona 100% standalone con datos demo — el botón "ESCANEO RFID" simula escaneos y cada 5 dispara la alerta de mis-routing para demo.

---

### frontend-dashboard (puerto 4002) — MIGRADO A REACT ✅
**Stack:** React + Vite · Chart.js (líneas + donut) · fuentes Rajdhani + Inter · tema claro · sin router (SPA de una pantalla).

**Layout (una sola pantalla):**
- **Topbar** con logo VERTICHE + "OPERACIÓN EN VIVO" + dot pulsante verde + reloj
- **Subbar**: `CEDI: CEDIS Vertiche · OPERADORES: 12 · UMBRAL: 32 paq/min`
- **2 top-cards**: Cumplimiento del día (81.8% con barra de progreso) + Estado operativo (3 alertas — clickeable abre drawer)
- **ThroughputChart** (Chart.js line): 3 datasets — Flujo real (área turquesa) · Proyectado (línea punteada ámbar) · Umbral 32 pp/min (línea roja)
- **7 StageCards** clickeables (PRE-REGISTRO, QA, REGISTRO, SORTER, BAHÍA, AUDITORÍA, ENVÍO) con dot verde/ámbar/rojo y borde color por etapa
- **AlertsDrawer** (slide-in derecha): alertas críticas + advertencias con botón "IR A etapa"
- **StageModal** (overlay): detalle por etapa con KPI, stats, barras, stacked bars, donut (REGISTRO), tabla 10 bahías (BAHÍA), tabla discrepancias (ENVÍO), banners

**Datos alineados con el módulo RFID:**
- `TIENDAS_REF` con las 6 tiendas del seed (TDA-007, 015, 029, 033, 044, 051)
- `PROVEEDORES_REF` con los 7 proveedores reales (PROV-001 a PROV-007)
- `ETAPAS` con valores del demo RFID (9 prepacks en PREREGISTRO, 6 en QA, 7 en REGISTRO, etc.)
- `ALERTAS` referencian EPCs reales del demo: **E006A, E011A, E019A, E024B** (los 4 `qa_fallido=true` del DEMO_OCS) · tienda real `TDA-033` para BAHIA-4 · prepack real `E015B` en el mis-routing
- `MODALS.bahia.tablaBahias` con las 10 bahías etiquetadas con su tienda asignada (BAHIA-1 MTY Centro, BAHIA-4 CDMX Polanco, etc.)
- `MODALS.envio.tablaDiscrepancias` con `TDA-044 Puebla` y `TDA-051 Cancún`

**Pendiente en backend:**
- `GET /api/dashboard/kpi-dia` (cumplimiento, operadores, total prepacks)
- `GET /api/dashboard/throughput-timeline` (44 puntos cada 12 min)
- `GET /api/dashboard/alertas` (anomalías activas)
- `GET /api/dashboard/etapa/:nombre` (detalle por etapa)

Por ahora funciona 100% con datos demo estáticos — no hay animaciones ni random.

---

### frontend-proveedores (puerto 4003) — MIGRADO A REACT ✅
**Stack:** React + Vite · tabs state-based (sin router) · IBM Plex Sans/Mono · tema oscuro · SVG icons + emojis selectivos en el flujo de operador.

**4 tabs (sin login)** — todas comparten estado de `suppliers` y `stats` en `App.jsx`, lo que permite que el rating del proveedor se recalcule en tiempo real y se propague a todas las vistas:

**`op-inicio` — Operador QA (flujo de inspección)**
- Estado 1: pantalla de espera con botón "Iniciar revisión — Siguiente carga" (toma el siguiente `CARGO_SCENARIO`)
- Estado 2: grid 2×2 con:
  - **Info del cargamento**: proveedor, RFC, PO (OC-XXX real del RFID), nivel, rating + estrellas, 3 stats, lista del contenido con círculo de color + producto + talla + qty
  - **Muestreo requerido**: número grande calculado por `calcSampleSize(stars, qty)` — 34% elite / 67% media / 100% baja / 50% nuevo (optimizado para lotes pequeños 2-3 prepacks)
  - **Captura de siniestros** (inline 3 pasos): tipo de defecto (8 categorías) → escaneo RFID (usa EPCs reales E001A, E005B, etc.) → decisión (Rechazar / Pasar con observación)
- Footer "Terminar revisión" → `onReviewFinished` recalcula el rating: ≥95% aprobación +0.1, 70-95% 0, <70% -0.2

**`sup-resumen` — Resumen de turno**
- 4 KPIs: Entregas hoy, Cajas inspeccionadas, Rechazos críticos, Calificación promedio
- **Dashboard de Reputación Dinámica** clickeable con barra de rating por proveedor (abre su perfil)

**`sup-plan` — Plan QA**
- Tabla: Proveedor · Rating numérico + estrellas + NivelBadge · % de muestreo · Acción del sistema (FLUJO LIBRE / STOP ALEATORIO / STOP OBLIGATORIO / PROVEEDOR NUEVO)

**`sup-proveedor` — Perfil del proveedor**
- Dropdown para cambiar de proveedor
- Header degradado con nombre + RFC + nivel + rating grande + estrellas
- 4 KPIs YTD (Entregas, Tasa de aprobación, Defectos, Lead time)
- Info comercial en grid 2×2 + Tarjeta de acción del sistema
- **Sparkline** últimas 12 entregas
- Historial reciente con badges APROBADO / OBSERVADO / RECHAZADO

**Niveles de proveedor (4):**
- `ELITE` (≥4.5★, verde) — Flujo libre, muestreo 34%
- `MEDIA` (≥2.5★, ámbar) — Stop aleatorio, muestreo 67%
- `BAJA` (>0★, rojo) — Stop obligatorio, muestreo 100%
- `NUEVO` (=0★, azul) — Período de evaluación, muestreo 50%

**Datos alineados con el módulo RFID:**
- **7 proveedores reales** con los mismos nombres que `frontend-rfid/FlujoCEDIS.jsx`:
  Textiles Monterrey SA, Confecciones del Norte, Moda Express MX, ActiveWear CDMX, Diseños Guadalajara, Estampados MX, Urban Trends MX
- **PROV-001 y PROV-002** coinciden con el backend (`seed.js`): mismo nombre, contacto (Carlos Mendez, Ana Torres), email
- `SUPPLIER_PROFILES` con historial usando OCs reales del demo RFID (OC-001 a OC-025)
- `PRODUCT_CATALOG` con los 24 productos de las OCs del RFID
- `CARGO_SCENARIOS` referencian OCs reales (OC-018, OC-012, OC-022, OC-005, OC-008, OC-009, OC-010) con proveedor correcto y composición de productos reales
- `MOCK_EPCS` usa los EPCs reales (E001A, E005B, E006A, E018A, E022B, etc.)

**Datos del backend (ya implementados):**
- `GET /api/qa/prepacks-pendientes` ✅ (tags en etapa QA sin `InspeccionQA` registrada)
- `POST /api/inspeccion-qa` ✅ (guarda resultado, si `RECHAZADO` marca el tag con `qa_fallido=true`)
- Modelo `InspeccionQA` + enum `ResultadoQA` en el schema Prisma

**Pendiente en backend:**
- Extender `Proveedor` con `rating`, `nivel`, `deliveries`, `approval`, `defects`, `leadtime`
- Endpoint `GET /api/proveedores/:id/perfil` con toda la info comercial + sparkline
- Recalcular rating en el backend cuando llegue un `POST /api/inspeccion-qa`

Por ahora el módulo funciona 100% con datos demo de `src/data/demoData.js` y recalcula el rating en el estado de React al terminar cada revisión.

---

## Flujo de datos entre módulos

```
Proveedor llega al CEDIS
        │
        ▼
[PREREGISTRO] ── RFID lee EPC ──► backend guarda lectura
        │
        ▼
[QA] ◄── frontend-proveedores consulta prepacks pendientes
 │    └── Operador inspecciona → POST /api/inspeccion-qa
 │         └── Rating del proveedor se actualiza
        │
        ▼
[REGISTRO] ── tunnel RFID vincula caja
        │
        ▼
[SORTER] ◄── frontend-sorter consulta bahía destino
 │        └── Muestra número de bahía al operador
 │        └── Detecta error de ruteo → banner rojo
        │
        ▼
[BAHIA] ◄── frontend-sorter pantalla de estación
 │       └── 3 terminales × 4 prepacks por tomar
        │
        ▼
[AUDITORIA] ──► frontend-dashboard muestra KPI de auditoría
        │
        ▼
[ENVIO] ──► frontend-dashboard marca cumplimiento del día
        │
        ▼
[frontend-rfid] ← todo el flujo visible en tiempo real vía WebSocket
```

---

## Convenciones de código

- **Nombres de etapas:** siempre en MAYÚSCULAS: `PREREGISTRO`, `QA`, `REGISTRO`, `SORTER`, `BAHIA`, `AUDITORIA`, `ENVIO`
- **IDs:** snake_case: `tienda_id`, `palet_id`, `orden_id`
- **Componentes React:** PascalCase: `ModalOC`, `TerminalColumn`
- **Archivos de página:** PascalCase: `FlujoCEDIS.jsx`, `StationScreen.jsx`
- **Variables CSS:** prefijo `--ds-` en módulo RFID. Los demás módulos usan sus propias variables pero deben respetar los colores semánticos:
  - Verde = OK / flujo normal
  - Ámbar = atención / cerca del límite
  - Rojo = error real

---

## Cómo levantar todo en desarrollo

Hay **scripts automáticos de PowerShell** en la raíz: `start-all.ps1` y `stop-all.ps1`. Ver `COMANDOS.md` para todo el detalle.

```powershell
cd c:\Users\Moise\rfid-vertiche

# Levantar TODO (backend + 4 frontends)
.\start-all.ps1

# Solo los 4 frontends en modo demo (sin backend)
.\start-all.ps1 -NoBackend

# Con simulador RFID
.\start-all.ps1 -WithSim

# Detener todo
.\stop-all.ps1
```

PostgreSQL se maneja aparte con Docker:

```powershell
docker-compose up -d postgres    # levantar en background
docker-compose stop              # detener
```

Manual (una terminal por servicio):

```bash
docker-compose up postgres                         # Terminal 1 — BD
cd backend              && npm run dev             # Terminal 2 — Backend (:3000)
cd simulator            && node simulator.js       # Terminal 3 — Simulador (opcional)
cd frontend-rfid        && npm run dev             # Terminal 4 — RFID (:4000)
cd frontend-sorter      && npm run dev             # Terminal 5 — Sorter (:4001)
cd frontend-dashboard   && npm run dev             # Terminal 6 — Dashboard (:4002)
cd frontend-proveedores && npm run dev             # Terminal 7 — Proveedores (:4003)
```

---

## Datos demo alineados

Los 4 frontends + el `backend/prisma/seed.js` usan los **mismos IDs y relaciones**. Ver [`DEMO-DATA-REFERENCIA.md`](DEMO-DATA-REFERENCIA.md) para el detalle completo:

- **7 proveedores** (PROV-001 a PROV-007) — todos en backend + frontend
- **20 tiendas** (TDA-007 a TDA-055) distribuidas en **10 bahías** (2 tiendas por bahía)
- **25 OCs** (OC-001 a OC-025) con **62 prepacks** totales
- **EPCs** formato `E<OC><letra>`: E001A, E001B, ..., E025B
- **4 prepacks rechazados en QA** documentados: E006A, E011A, E019A, E024B
- **5 OCs con faltantes**: OC-002, OC-006, OC-011, OC-019, OC-024

---

## Estado actual por módulo

| Módulo | Estado | Pendiente inmediato |
|---|---|---|
| backend | ✅ Funcional | Agregar rutas de KPIs, QA e inspección |
| frontend-rfid | ✅ Sprint 6 completo | Commit V9.9.2 + push |
| frontend-sorter | ✅ Migrado a React | Conectar rutas `/api/bahias/:id/prepacks-activos` y `/api/sorter/siguiente-prepack` cuando estén en backend |
| frontend-dashboard | ✅ Migrado a React | Endpoints `/api/dashboard/kpi-dia`, `/throughput-timeline`, `/alertas`, `/etapa/:nombre` |
| frontend-proveedores | ✅ Migrado a React | Extender tabla `Proveedor` con rating/nivel/deliveries/approval; endpoint de perfil con sparkline |
| DB schema | ✅ Base completa | Agregar tabla `inspeccion_qa` |

---

## Instrucciones para Claude Code (VSC)

Cuando Claude Code necesite contexto de arquitectura, referenciarlo a este archivo.

**Próxima tarea para Claude Code:**
1. Copiar `backend/prisma/schema.prisma` y agregar el modelo `inspeccion_qa` y el enum `ResultadoQA`
2. Correr `npx prisma migrate dev --name add-inspeccion-qa`
3. Agregar las rutas faltantes listadas arriba en `backend/src/routes/`
4. En `frontend-sorter/src/` crear estructura de componentes basada en sorter.html y testpantalla.html
5. En `frontend-dashboard/src/` crear estructura basada en dashboard_cedisAnalisis.html
6. En `frontend-proveedores/src/` crear estructura basada en modulo_prepack.html

---

*Vertiche SortFlow — ITC Gpo 102 — Abril 2026*
*Equipo RFID: Moises Falcon, Alberto Gallegos + team*
