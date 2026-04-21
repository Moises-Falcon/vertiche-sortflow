# frontend-proveedores — Módulo QA & Calificación de Proveedores
## Vertiche SortFlow · Puerto 4003

Sistema de inspección de calidad y reputación dinámica de proveedores.
Funciona en standalone con datos demo alineados al módulo RFID; opcionalmente consume `/api/qa` y `/api/inspeccion-qa` del backend.

---

## Qué resuelve

Cuando llega un camión al andén del CEDI, el operador QA debe inspeccionar una muestra de los prepacks según la reputación del proveedor. Si hay defectos, los documenta (tipo, fotos, EPC del prepack) y decide si **rechaza** el prepack o lo deja **pasar con observación**. El sistema recalcula el rating del proveedor en tiempo real.

El supervisor ve un dashboard con el estado de turno, el plan de muestreo actual por proveedor, y puede abrir el perfil completo de cada uno (historial, tendencia, info comercial).

---

## Stack

| Capa | Tecnología |
|---|---|
| Framework | React 19 + Vite |
| Navegación | State-based tabs (sin router) |
| Fuentes | IBM Plex Sans + IBM Plex Mono |
| Estado | `useState` local en `App.jsx` (suppliers + stats) |
| API | `fetch` directo a `/api/qa/prepacks-pendientes` y `/api/inspeccion-qa` (opcional) |

---

## Estructura

```
frontend-proveedores/
├── src/
│   ├── App.jsx                      State: suppliers + stats · 4 tabs
│   ├── main.jsx                     Entry + Google Fonts
│   ├── index.css                    Variables CSS + keyframes
│   ├── data/
│   │   └── demoData.js              SUPPLIERS_INITIAL, SUPPLIER_PROFILES,
│   │                                PRODUCT_CATALOG, CARGO_SCENARIOS,
│   │                                DEFECT_TYPES, MOCK_EPCS, helpers
│   ├── components/
│   │   ├── AppNav.jsx               Navbar con 4 tabs + reloj
│   │   ├── Stars.jsx                SVG star clip-path (1-5)
│   │   ├── Sparkline.jsx            Barras de tendencia (12 entregas)
│   │   └── NivelBadge.jsx           Pill "NIVEL ELITE/MEDIA/BAJA/NUEVO"
│   └── pages/
│       ├── OperatorScreen.jsx       Flujo de inspección (2 estados)
│       ├── ResumenTurno.jsx         KPIs + Dashboard de Reputación
│       ├── PlanQA.jsx               Tabla rating/muestreo/acción
│       └── PerfilProveedor.jsx      Perfil completo de un proveedor
└── .env                             VITE_API_URL
```

---

## Datos — alineados con módulo RFID

Los 7 proveedores del demo coinciden con los usados en `frontend-rfid/FlujoCEDIS.jsx` y `frontend-sorter/demoData.js`:

| ID | Código | Proveedor | Rating | Nivel | Origen | Categoría |
|---|---|---|---|---|---|---|
| 1 | **PROV-001** | Textiles Monterrey SA | 4.8 | ELITE | Monterrey, NL | Playera / Polo / Camiseta |
| 2 | **PROV-002** | Confecciones del Norte | 4.2 | MEDIA | Monterrey, NL | Pantalón / Jeans |
| 3 | PROV-003 | Moda Express MX | 4.5 | ELITE | Guadalajara, JAL | Blusa / Falda |
| 4 | PROV-004 | ActiveWear CDMX | 4.6 | ELITE | CDMX | Deportivo / Athletic |
| 5 | PROV-005 | Diseños Guadalajara | 3.8 | MEDIA | Guadalajara, JAL | Vestido / Jeans mujer |
| 6 | PROV-006 | Estampados MX | 2.1 | BAJA | Puebla, PUE | Playera estampada / Shorts |
| 7 | PROV-007 | Urban Trends MX | 1.9 | BAJA | León, GTO | Sudadera / Chamarra urbana |

> **PROV-001 y PROV-002** también existen en el backend (`backend/prisma/seed.js`) con los mismos nombres, contactos (Carlos Mendez / Ana Torres) y emails.

### Historial (SUPPLIER_PROFILES)

Cada perfil incluye historial de inspecciones con **OCs reales del demo RFID** (OC-001 a OC-025). Ejemplo Textiles Monterrey SA:
- OC-018 "Playera Básica Premium"
- OC-011 "Camiseta Básica Pack"
- OC-006 "Polo Piqué Hombre"
- OC-001 "Playera Básica Manga Corta"

### Catálogo de productos

`PRODUCT_CATALOG` tiene los 24 productos de las OCs del RFID con sus `colors[]` reales.

### Escenarios de carga (`CARGO_SCENARIOS`)

7 escenarios, cada uno es una OC real:
- `OC-018` → Textiles Monterrey SA (Elite, 3 prepacks Playera Premium)
- `OC-012` → Moda Express MX (Elite, 3 prepacks Blusa Campesina)
- `OC-022` → ActiveWear CDMX (Elite, 3 prepacks Jogger Tech)
- `OC-005` → Diseños Guadalajara (Media, 3 prepacks Vestido Casual)
- `OC-008` → Estampados MX (Baja, 3 prepacks Playera Estampada)
- `OC-009` → Confecciones del Norte (Media, 2 prepacks Pantalón Chino)
- `OC-010` → Urban Trends MX (Baja, 2 prepacks Sudadera Hoodie)

### EPCs simulados

`MOCK_EPCS` usa los EPCs reales del demo RFID: `E001A`, `E005B`, `E006A`, `E018A`, `E022B`, etc.

---

## Navegación — 4 tabs

State-based, no hay router. Todas las tabs comparten el mismo estado `suppliers` y `stats` en `App.jsx`.

| Tab | Componente | Rol | Función |
|---|---|---|---|
| `op-inicio` | `OperatorScreen` | Operador | Flujo de inspección: escaneo, muestreo, reporte de siniestros |
| `sup-resumen` | `ResumenTurno` | Supervisor | KPIs del turno + Dashboard de Reputación Dinámica |
| `sup-plan` | `PlanQA` | Supervisor | Tabla con criterio de muestreo por proveedor |
| `sup-proveedor` | `PerfilProveedor` | Supervisor | Perfil completo: KPIs, info comercial, sparkline, historial |

---

## OperatorScreen — flujo de inspección

### Estado 1: Espera
Pantalla centrada con círculo pulsante azul y botón **"Iniciar revisión — Siguiente carga"**. Cada clic toma el siguiente `CARGO_SCENARIO` (round-robin).

### Estado 2: Revisión activa (grid 2×2)

**Sección 1 — Info del cargamento:**
- Proveedor + RFC + origen + PO (OC-XXX) + NivelBadge + rating con estrellas
- 3 stats: `Total prepacks`, `Entregas previas`, `Aprobación histórica`
- Lista del contenido: círculo de color + nombre del producto + color + talla + qty

**Sección 2 — Muestreo requerido:**
- Número grande ámbar con el tamaño de muestra (`calcSampleSize(stars, qty)`)
- Hint según reputación:
  - ≥4.5★ → 34% (1 de 3) · Elite
  - ≥2.5★ → 67% (2 de 3) · Media
  - >0★ → 100% · Baja
  - =0 → 50% · Nuevo
- Contadores: Defectos reportados, Prepacks rechazados, Pasados con observación

**Sección 3 — Captura de siniestros (inline 3 pasos):**
1. **Tipo de defecto** — grid 4×2 con 8 categorías (Mala calidad, Ruptura, Mancha, Costura, Etiqueta, Cantidad, SKU, Otro)
2. **Identificar prepack** — simulación de escaneo RFID (usa EPCs reales del demo)
3. **Decisión final** — Rechazar (rojo) o Pasar con observación (ámbar)

### Footer
Botón **"Terminar revisión"** verde → llama `onReviewFinished({ supplierId, defectCount, totalSample })` y **recalcula el rating del proveedor en tiempo real**:

| Aprobación | Δ rating |
|---|---|
| ≥95% | +0.1 |
| 70–95% | 0 |
| <70% | −0.2 |

El nivel se re-asigna (ELITE/MEDIA/BAJA/NUEVO) y el cambio se propaga a todas las tabs.

---

## ResumenTurno — KPIs + Dashboard

4 KPIs del turno:
- Entregas hoy (contador de revisiones completadas)
- Cajas inspeccionadas (suma de muestras revisadas)
- Rechazos críticos (suma de prepacks rechazados)
- Calificación promedio (avg stars de proveedores activos)

**Dashboard de Reputación Dinámica:** lista clickeable de proveedores con barra de rating (color por nivel) + rating numérico + estrellas. Click en cualquier fila → salta a `PerfilProveedor` con ese proveedor seleccionado.

---

## PlanQA — tabla de muestreo

Cada fila muestra: Proveedor + Rating numérico + estrellas + NivelBadge + % de muestreo + acción del sistema (FLUJO LIBRE / STOP ALEATORIO / STOP OBLIGATORIO / PROVEEDOR NUEVO) con descripción.

---

## PerfilProveedor

- Dropdown para cambiar de proveedor (navega sin recargar)
- Header con degradado: logo + nombre + RFC + origen + NivelBadge + rating grande + estrellas
- 4 KPIs YTD: Entregas, Tasa de aprobación, Defectos detectados, Lead time
- Info comercial en grid 2×2 (Categoría, Proveedor desde, Contacto, Teléfono, Email, Términos de pago + Dirección)
- Tarjeta "Acción del sistema QA" con icon + nivel + hint
- **Sparkline** de las últimas 12 entregas (barras color por rating)
- **Historial reciente** con badges APROBADO / OBSERVADO / RECHAZADO

---

## Design system

Tema oscuro. Variables CSS:

| Variable | Valor | Uso |
|---|---|---|
| `--bg` | `#0a0a0a` | Fondo principal |
| `--bg1` / `--bg2` / `--bg3` | `#111` / `#181818` / `#202020` | Escalones de profundidad |
| `--gold` | `#F5C518` | Acento — números/ratings |
| `--green` / `--amber` / `--red` / `--blue` | Semafóro + versiones `-bg` y `-t` | Estados Elite/Media/Baja/Nuevo |

### Animaciones
`fadeIn`, `modalIn`, `pulse-blue`, `belt-move`, `failShake`.

### Layout
- Páginas con `maxWidth: 1400px` (aprovecha el ancho)
- Padding horizontal 32px
- Navbar 48px sticky

---

## Endpoints del backend (opcionales)

Si hay backend corriendo en `http://localhost:3000`, el módulo puede consumir:

```
GET  /api/qa/prepacks-pendientes     → Tags en etapa QA sin inspección
POST /api/inspeccion-qa              → Guarda resultado (APROBADO/OBSERVADO/RECHAZADO)
```

Sin backend funciona 100% con los datos demo de `demoData.js`.

El backend ya tiene implementado el modelo `InspeccionQA` y las rutas (`backend/src/routes/inspeccionQa.js`).

---

## Cómo correr

```bash
cd frontend-proveedores
npm install
npm run dev
# http://localhost:4003
```

---

## Historial de iteraciones

1. **v1** — Login con rol (gerente/operador) + dashboard + flujo de inspección simple + listado + perfil (4 niveles A/B/C/D)
2. **v2** — Refactor completo según análisis del HTML real:
   - Sin login (state-based tabs)
   - 4 niveles `ELITE/MEDIA/BAJA/NUEVO` con colores `ba/bb/bc/bn`
   - Rating dinámico que se recalcula tras cada revisión
   - Flujo de siniestro inline de 3 pasos (tipo → RFID → decisión)
   - `CARGO_SCENARIOS` para simular cargamentos reales
3. **v3 (actual)** — Alineación con módulo RFID:
   - 7 proveedores reales (mismos nombres que `frontend-rfid`)
   - `PROV-001` y `PROV-002` coinciden con el backend
   - `PRODUCT_CATALOG` con las 24 OCs del demo RFID
   - `MOCK_EPCS` con EPCs reales (E001A, E005B, etc.)
   - Layout ampliado a `maxWidth: 1400px`
   - Estrellas en todas las listas

---

*Vertiche SortFlow — frontend-proveedores — Abril 2026*
