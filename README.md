# Sistema RFID Vertiche — CEDIS
## Equipo RFID | ITC Gpo 102 | Abril 2026

---

## Que es este proyecto

Sistema de trazabilidad en tiempo real para el CEDIS (Centro de Distribucion) de Vertiche.
Permite rastrear prendas de ropa desde que ingresan al almacen hasta que llegan a su bahia de destino
usando etiquetas RFID en cada prepack (bolsa de prendas).

**Problema que resuelve:** Sin RFID, los operadores no saben si un prepack fue a la bahia correcta,
si se escaneo dos veces, a que orden y pedido pertenece, o donde esta en el flujo del CEDIS en este momento.
Con este sistema todo queda registrado y visible en tiempo real desde un dashboard web.

---

## Arquitectura general

```
Simulador RFID          Backend (Node.js)         Frontend (React)
(reemplaza al     POST   Express + Prisma   WS     Vite — Puerto 4000
 lector fisico)  -----> Puerto 3000        <----
                         |
                         PostgreSQL
                         Puerto 5432
```

El simulador reemplaza al lector RFID fisico durante el desarrollo.
En produccion se conecta el hardware real al mismo endpoint `POST /api/lecturas`.

---

## Estructura del repositorio

```
rfid-vertiche/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma          Definicion de tablas, enums y relaciones
│   │   ├── seed.js                Datos iniciales + datos fijos de demo
│   │   └── migrations/            Historial de migraciones SQL
│   ├── src/
│   │   ├── index.js               Entrada: Express + Socket.io
│   │   ├── db.js                  Cliente de Prisma
│   │   ├── routes/
│   │   │   ├── lecturas.js        POST y GET de eventos de lectura
│   │   │   ├── tags.js            CRUD de tags RFID
│   │   │   ├── cajas.js           Estado y sellado de cajas
│   │   │   ├── anomalias.js       Consulta y resolucion de anomalias
│   │   │   ├── trazabilidad.js    Historial de un tag por EPC o SKU
│   │   │   ├── dashboard.js       KPIs y resumenes agregados
│   │   │   ├── proveedores.js     CRUD y resumen de proveedores
│   │   │   ├── tiendas.js         Lista de tiendas activas
│   │   │   ├── pedidos.js         Lista y detalle de pedidos
│   │   │   ├── palets.js          Detalle de palets con tags y etapa_logs
│   │   │   └── ordenes.js         Lista y detalle de ordenes de compra
│   │   ├── services/
│   │   │   ├── lecturaService.js  Logica principal: deduplicacion, anomalias, etapa, palet_etapa_log
│   │   │   ├── cajaService.js     Logica de estado de cajas
│   │   │   └── anomaliaService.js Helpers de anomalias
│   │   └── socket/
│   │       └── socketHandler.js   Inicializacion de Socket.io
│   ├── package.json
│   └── .env                       Variables de entorno (no subir a git)
│
├── simulator/
│   ├── simulator.js               Loop principal: flujo secuencial de prepacks (7 etapas)
│   ├── config.js                  10 tags conocidos, FLUJO_ETAPAS, probabilidades
│   ├── package.json
│   └── .env                       BACKEND_URL
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx                Navegacion por 5 tabs + navegacion Mapa->Palet
│   │   ├── main.jsx               Entry point
│   │   ├── index.css              Variables CSS del sistema de diseno
│   │   ├── pages/
│   │   │   ├── FlujoCEDIS.jsx     Vista principal: Modo Linea + Modo Mapa (zonas) + KPI bar
│   │   │   ├── Pedidos.jsx        Lista de pedidos con drill-down
│   │   │   ├── DetallePedido.jsx  Detalle de un pedido: stats, flujos, palets
│   │   │   ├── DetallePalet.jsx   Detalle completo: header, timeline, tabla color×talla, prepacks expandibles, QA fallo
│   │   │   ├── LecturasLive.jsx   Feed en tiempo real + contadores + anomalias
│   │   │   ├── Trazabilidad.jsx   Buscar historial por EPC o SKU (7 etapas)
│   │   │   ├── Vinculacion.jsx    Registrar tags + tabla de ultimos registros
│   │   │   └── EstadoCajas.jsx    (no importada en App.jsx — codigo disponible)
│   │   ├── components/
│   │   │   ├── TagBadge.jsx       Badge reutilizable para tags
│   │   │   ├── AnomaliaAlert.jsx  Alerta visual de anomalias
│   │   │   ├── CajaCard.jsx       Card de estado de caja
│   │   │   └── EventoRow.jsx      Fila de evento en tabla
│   │   ├── api/
│   │   │   └── rfidApi.js         Funciones fetch al backend
│   │   └── socket/
│   │       └── socketClient.js    Conexion WebSocket al backend
│   ├── vite.config.js
│   └── .env                       VITE_API_URL, VITE_SOCKET_URL
│
├── SETUP.md                       Guia de instalacion paso a paso
└── README.md                      Este archivo
```

---

## Las 7 etapas oficiales del CEDIS

| # | Etapa       | Descripcion                                      | Lector RFID          | Zona fisica     |
|---|-------------|--------------------------------------------------|----------------------|-----------------|
| 1 | PREREGISTRO | Llegada del cargamento al muelle de entrada       | RFID-RECEPCION-1     | RAMPA-ENTRADA   |
| 2 | QA          | Control de calidad — revision de prendas          | RFID-QA-1            | ZONA-QA         |
| 3 | REGISTRO    | Registro formal en sistema via tunel RFID         | RFID-REGISTRO-1      | ZONA-REGISTRO   |
| 4 | SORTER      | Clasificacion en conveyor hacia bahias            | RFID-SORTER-1        | ZONA-SORTER     |
| 5 | BAHIA       | Prepack llega a la bahia de tienda destino        | RFID-BAHIA-{N}       | BAHIA-{N}       |
| 6 | AUDITORIA   | Verificacion final antes de envio                 | RFID-AUDITORIA-1     | ZONA-AUDITORIA  |
| 7 | ENVIO       | Sale del CEDIS hacia la tienda                    | RFID-ENVIO-1         | MUELLE-SALIDA   |

---

## Base de datos — Modelos (V5)

### `tiendas`
Sucursales de Vertiche. Cada tienda tiene una bahia asignada en el CEDIS.

| Campo          | Tipo      | Descripcion                    |
|----------------|-----------|--------------------------------|
| tienda_id      | String PK | TDA-007, TDA-015, ...          |
| nombre         | String    | Nombre de la sucursal          |
| ciudad         | String    | Ciudad donde esta              |
| region         | String    | Noreste / Centro / etc.        |
| bahia_asignada | String    | BAHIA-1 / BAHIA-2 / ...       |
| estado_rep     | String?   | Estado de la republica          |
| activa         | Boolean   | Si recibe pedidos              |

### `proveedores`
Empresas que surten las prendas al CEDIS.

### `ordenes_compra`
Orden de compra emitida a un proveedor. Agrupa multiples palets.

| Campo           | Tipo       | Descripcion                        |
|-----------------|------------|------------------------------------|
| orden_id        | String PK  | OC-2026-001, ...                   |
| proveedor_id    | Int FK     | Proveedor que surte la orden       |
| modelo          | String     | Nombre del modelo / linea          |
| nombre_producto | String?    | Nombre legible del producto (ej. "Pantalon de mezclilla slim fit") |
| descripcion     | String?    | Descripcion adicional              |
| foto_url        | String?    | URL de imagen del producto         |
| estado          | EstadoOrden| PENDIENTE / EN_PROCESO / COMPLETADA|
| total_esperados | Int        | Prepacks esperados                 |
| total_recibidos | Int        | Prepacks confirmados al recibir    |

### `detalle_orden`
Desglose por SKU/talla/color de una orden de compra.

### `pedidos`
Un pedido agrupa todos los palets de un proveedor en un envio.

| Campo                  | Tipo        | Descripcion                     |
|------------------------|-------------|---------------------------------|
| pedido_id              | String PK   | PED-2026-001, ...               |
| proveedor_id           | Int FK      | Proveedor que envia             |
| estado                 | EstadoPedido| PENDIENTE / EN_PROCESO / ...    |
| fecha_llegada          | DateTime?   | Cuando llego al CEDIS           |
| fecha_entrega_estimada | DateTime?   | Cuando debe llegar              |
| total_esperados        | Int         | Tags esperados                  |
| total_recibidos        | Int         | Tags confirmados                |

### `palets`
Un palet contiene varios prepacks del mismo pedido/orden.

| Campo             | Tipo       | Descripcion                      |
|-------------------|------------|----------------------------------|
| palet_id          | String PK  | PAL-001, PAL-002, ...            |
| pedido_id         | String FK  | Pedido al que pertenece          |
| orden_id          | String? FK | Orden de compra asociada         |
| estado            | EstadoPalet| ACTIVO / PROCESADO / DESPACHADO  |
| total_prepacks    | Int        | Cantidad de prepacks en el palet |
| timestamp_llegada | DateTime?  | Cuando entro al CEDIS            |
| timestamp_salida  | DateTime?  | Cuando salio                     |
| tiempo_ciclo_min  | Int?       | Minutos de llegada a salida      |

### `palet_etapa_log` (NUEVO V5)
Registra el tiempo que cada palet estuvo en cada etapa. Permite reconstruir el historial completo.

| Campo             | Tipo      | Descripcion                              |
|-------------------|-----------|------------------------------------------|
| id                | Int PK    | Autoincremental                          |
| palet_id          | String FK | Palet al que pertenece                   |
| etapa             | EtapaRFID | Etapa del CEDIS                          |
| timestamp_entrada | DateTime  | Cuando entro a esta etapa                |
| timestamp_salida  | DateTime? | Cuando salio (null = en curso)           |
| prepacks_entrada  | Int       | Cuantos prepacks entraron                |
| prepacks_salida   | Int       | Cuantos salieron (puede diferir en QA)   |
| tiene_anomalia    | Boolean   | Si hubo anomalia en esta etapa           |
| notas             | String?   | Detalle adicional                        |

Indices: `palet_id`, `etapa`.

### `tags`
Cada tag RFID representa un prepack.

| Campo             | Tipo          | Descripcion                         |
|-------------------|---------------|-------------------------------------|
| epc               | String PK     | Codigo unico del chip RFID          |
| sku               | String        | SKU del producto                    |
| talla             | String        | XS / S / M / L / XL                |
| color             | String        | Color de la prenda                  |
| cantidad_piezas   | Int           | Cantidad de piezas en el prepack    |
| proveedor_id      | Int FK        | Proveedor del tag (FK a proveedores)|
| tienda_id         | String? FK    | Tienda destino (FK a tiendas)       |
| palet_id          | String? FK    | Palet al que pertenece              |
| pedido_id         | String? FK    | Pedido al que pertenece             |
| tipo_flujo        | TipoFlujo     | CROSS_DOCK / NUEVA_TIENDA / REFILL  |
| etapa_actual      | EstadoPrepack | Estado actual del prepack           |
| qa_fallido        | Boolean       | Si fue rechazado en QA              |
| qa_motivo_fallo   | String?       | Motivo del rechazo en QA            |
| qa_timestamp      | DateTime?     | Cuando fue rechazado                |
| registrado_en     | DateTime      | Timestamp de registro               |

**EstadoPrepack V5:** EN_TRANSITO / PREREGISTRO / QA / REGISTRO / SORTER / BAHIA / AUDITORIA / ENVIO / COMPLETADO

### `eventos_lectura`
Cada vez que un lector detecta un tag se guarda un evento.

| Campo        | Tipo      | Descripcion                           |
|--------------|-----------|---------------------------------------|
| epc          | String    | Tag leido                             |
| lector_id    | String    | ID del lector fisico                  |
| bahia        | String    | Zona fisica donde esta el lector      |
| etapa        | EtapaRFID | PREREGISTRO / QA / REGISTRO / ...     |
| rssi         | Float?    | Intensidad de senal (dBm)             |
| es_duplicado | Boolean   | Si fue leido hace menos de 5 segundos |

Indices: `epc`, `timestamp`, `bahia`.

### `cajas`
Contenedores fisicos en las bahias donde se depositan los prepacks.

| Campo              | Tipo       | Descripcion                        |
|--------------------|------------|------------------------------------|
| caja_id            | String PK  | Identificador de la caja           |
| tienda_id          | String FK  | Tienda destino (FK a tiendas)      |
| bahia              | String     | Bahia donde esta la caja           |
| estado             | EstadoCaja | ABIERTA / LLENANDO / LLENA / SELLADA |
| timestamp_creacion | DateTime   | Cuando se creo la caja             |
| timestamp_sellado  | DateTime?  | Cuando se sello                    |

### `prepack_caja`
Tabla de union: relaciona tags (prepacks) con cajas.

| Campo                 | Tipo     | Descripcion                              |
|-----------------------|----------|------------------------------------------|
| id                    | Int PK   | Autoincremental                          |
| epc                   | String FK| Tag vinculado (FK a tags)                |
| caja_id               | String FK| Caja destino (FK a cajas)                |
| timestamp_vinculacion | DateTime | Cuando se vinculo el tag a la caja       |
| es_correcto           | Boolean  | Si el tag corresponde a esa caja/tienda  |

Constraint unico: `(epc, caja_id)` — un tag no puede estar dos veces en la misma caja.

### `anomalias`
Registro de cualquier lectura irregular.

| Campo        | Tipo         | Descripcion                             |
|--------------|--------------|-----------------------------------------|
| id           | Int PK       | Autoincremental                         |
| epc          | String? FK   | Tag involucrado (null si desconocido)   |
| tipo_error   | TipoAnomalia | TAG_DESCONOCIDO / TAG_DUPLICADO / BAHIA_INCORRECTA / QA_RECHAZADO / etc. |
| lector_id    | String       | ID del lector que detecto la anomalia   |
| bahia        | String       | Zona fisica                             |
| etapa        | EtapaRFID?   | Etapa donde ocurrio                     |
| timestamp    | DateTime     | Cuando ocurrio                          |
| proveedor_id | Int? FK      | Proveedor relacionado                   |
| resuelto     | Boolean      | Si ya fue atendida                      |
| descripcion  | String?      | Detalle adicional                       |

Indices: `timestamp`, `proveedor_id`, `tipo_error`.

---

## Flujos RFID

| Tipo         | Etapas que recorre                                                                    |
|--------------|---------------------------------------------------------------------------------------|
| CROSS_DOCK   | PREREGISTRO -> QA -> REGISTRO -> SORTER -> BAHIA -> AUDITORIA -> ENVIO               |
| NUEVA_TIENDA | PREREGISTRO -> QA -> REGISTRO                                                        |
| REFILL       | PREREGISTRO -> QA -> REGISTRO                                                        |

---

## Backend — API Endpoints

### Lecturas
| Metodo | Ruta          | Descripcion                                      |
|--------|---------------|--------------------------------------------------|
| POST   | /api/lecturas | Recibe lectura del simulador o lector fisico     |
| GET    | /api/lecturas | Lista eventos (`?limit=50`)                      |

**Body del POST:**
```json
{
  "epc": "E2003411B802011803B96101",
  "lector_id": "RFID-BAHIA-1",
  "bahia": "BAHIA-1",
  "etapa": "BAHIA",
  "rssi": -62.4,
  "antenna_port": "Antenna_1"
}
```

### Tags
| Metodo | Ruta                      | Descripcion                      |
|--------|---------------------------|----------------------------------|
| GET    | /api/tags                 | Lista todos los tags             |
| POST   | /api/tags                 | Registrar un tag nuevo           |
| GET    | /api/tags/:epc            | Detalle de un tag                |
| PATCH  | /api/tags/:epc/qa-fallo   | Marcar prepack como fallido en QA|

### Tiendas
| Metodo | Ruta         | Descripcion              |
|--------|--------------|--------------------------|
| GET    | /api/tiendas | Lista tiendas activas    |

### Ordenes de Compra
| Metodo | Ruta               | Descripcion                            |
|--------|--------------------|----------------------------------------|
| GET    | /api/ordenes       | Lista ordenes con progreso y faltantes |
| GET    | /api/ordenes/:id   | Detalle completo con palets y tags     |

### Pedidos
| Metodo | Ruta                  | Descripcion                           |
|--------|-----------------------|---------------------------------------|
| GET    | /api/pedidos          | Lista pedidos con resumen y progreso  |
| GET    | /api/pedidos/:id      | Detalle completo de un pedido         |

### Palets
| Metodo | Ruta                       | Descripcion                                          |
|--------|----------------------------|------------------------------------------------------|
| GET    | /api/palets/:id            | Detalle completo con tags, etapa_logs, orden, pedido, progreso |
| GET    | /api/palets/:id/validacion | Comparar recibido vs esperado en orden de compra     |
| GET    | /api/palets/:id/qa-fallidos| Tags rechazados en QA de este palet                  |

**Response de GET /api/palets/:id incluye:** palet, tags[], etapa_logs[], pedido (con proveedor), orden (con nombre_producto), nombre_producto, tags_ok, tags_fallidos, progreso (sorter/bahia/auditoria/envio).

### Trazabilidad
| Metodo | Ruta                       | Descripcion                          |
|--------|----------------------------|--------------------------------------|
| GET    | /api/trazabilidad/:epc     | Historial completo de un tag por EPC |
| GET    | /api/trazabilidad?sku=...  | Buscar tags por SKU                  |

### Cajas
| Metodo | Ruta                    | Descripcion                        |
|--------|-------------------------|------------------------------------|
| GET    | /api/cajas              | Lista todas las cajas con prepacks |
| GET    | /api/cajas/:id/estado   | Estado de una caja especifica      |
| POST   | /api/cajas              | Crear nueva caja                   |
| POST   | /api/cajas/:id/sellar   | Marcar caja como sellada           |

### Anomalias
| Metodo | Ruta                        | Descripcion                                              |
|--------|-----------------------------|----------------------------------------------------------|
| GET    | /api/anomalias              | Lista anomalias (`?proveedor_id=1&tipo=TAG_DUPLICADO&desde=2026-04-01&limit=50`) |
| PATCH  | /api/anomalias/:id/resolver | Marcar anomalia como resuelta                            |

### Dashboard
| Metodo | Ruta                            | Descripcion                                    |
|--------|---------------------------------|------------------------------------------------|
| GET    | /api/dashboard/eventos/resumen  | KPIs de eventos por fecha (`?fecha=2026-04-03`)|
| GET    | /api/dashboard/anomalias/resumen| KPIs de anomalias por fecha                    |
| GET    | /api/dashboard/cajas/resumen    | Resumen de cajas agrupado por estado           |
| GET    | /api/dashboard/throughput       | Paquetes/min ultimos 5 min (`?bahia=BAHIA-3`) |
| GET    | /api/dashboard/kpi-ciclo        | KPI de tiempo de ciclo vs proceso manual       |

### Proveedores
| Metodo | Ruta                           | Descripcion                                    |
|--------|--------------------------------|------------------------------------------------|
| GET    | /api/proveedores               | Lista todos los proveedores                    |
| GET    | /api/proveedores/resumen       | Resumen con tasa de error por proveedor        |
| GET    | /api/proveedores/:id/anomalias | Anomalias de un proveedor especifico           |

---

## WebSocket — Eventos en tiempo real

| Evento    | Cuando se emite                              | Datos clave                                          |
|-----------|----------------------------------------------|------------------------------------------------------|
| `lectura` | Cada lectura valida procesada                | epc, lector_id, bahia, etapa, sku, pedido_id, tienda_nombre |
| `anomalia`| Cuando se detecta cualquier tipo de anomalia | tipo, epc, lector_id, etapa, timestamp               |

---

## Logica de procesamiento (lecturaService.js)

```
1. Recibir: epc, lector_id, bahia, etapa, rssi
2. EPC en BD? NO -> anomalia TAG_DESCONOCIDO
3. Leido en los ultimos 5s? SI -> anomalia TAG_DUPLICADO
4. etapa === BAHIA y bahia != tienda.bahia_asignada? -> anomalia BAHIA_INCORRECTA
5. Crear EventoLectura con etapa
6. Actualizar tag.etapa_actual
7. Registrar cambio en palet_etapa_log (cerrar etapa anterior, abrir nueva)
8. Emitir WebSocket 'lectura'
```

---

## Simulador RFID (V5)

Pool de 10 tags (EPCs formato industrial `E2003411B802011803B961xx`). Flujo unico `FLUJO_ETAPAS`.

| Etapa       | Lector              | Bahia           | Delay |
|-------------|---------------------|-----------------|-------|
| PREREGISTRO | RFID-RECEPCION-1    | RAMPA-ENTRADA   | 0s    |
| QA          | RFID-QA-1           | ZONA-QA         | +4s   |
| REGISTRO    | RFID-REGISTRO-1     | ZONA-REGISTRO   | +5s   |
| SORTER      | RFID-SORTER-1       | ZONA-SORTER     | +4s   |
| BAHIA       | RFID-BAHIA-{N}      | BAHIA-{N}       | +6s   |
| AUDITORIA   | RFID-AUDITORIA-1    | ZONA-AUDITORIA  | +4s   |
| ENVIO       | RFID-ENVIO-1        | MUELLE-SALIDA   | +5s   |

NUEVA_TIENDA y REFILL recorren solo las primeras 3 etapas.
Un nuevo prepack arranca cada 6 segundos.
Anomalias: ~0.2% por tipo (demo limpia).

---

## Frontend — 5 Tabs (V5)

### Flujo CEDIS (tab principal)
Vista operativa del CEDIS con dos modos:
- **Barra KPI:** Siempre visible arriba — Ciclo promedio hoy, % mejora vs proceso manual (meta 32%), palets completados, palets activos.
- **Modo Linea:** Grid de 8 columnas (7 etapas + Completado). Tarjetas de palet muestran nombre_producto (GRANDE) y palet_id (pequeño). Barra de resumen con conteo por etapa.
- **Modo Mapa:** Zonas horizontales con semaforo por zona. Cada zona muestra conteo, iconos de palets, y flashea con WebSocket. Zona Bahias con grid de 6 bahias individuales. Click en zona abre panel con lista de palets.
Panel superior: Ordenes de Compra con nombre_producto, barra de progreso y faltantes.
Modo se persiste en localStorage.

**Regla de nomenclatura:** En TODAS las pantallas, el nombre del producto va PRIMERO y grande, el ID tecnico va SEGUNDO y pequeño.

### Pedidos
Vista jerarquica: Pedidos -> DetallePedido -> DetallePalet -> Trazabilidad.
- Lista de pedidos con progreso, proveedor, palets, anomalias
- DetallePedido: stats, distribucion por flujo, mapa de 7 etapas, cards de palets
- DetallePalet: 4 secciones (ver abajo)
- "Ver historial" navega al tab Trazabilidad con el EPC preseleccionado

### DetallePalet (V5 — rediseño completo)
1. **Header del cargamento:** Foto/placeholder, nombre_producto (GRANDE), palet_id + orden_id (pequeño), proveedor, badge de estado (Todo OK / Con observaciones / Requiere atencion), total prepacks, tiempo de ciclo, conteo de rechazados en QA.
2. **Historial del cargamento:** Timeline horizontal de 7 nodos. Cada nodo muestra hora entrada/salida, prepacks entrada/salida (en rojo si difieren), icono de estado, notas de anomalia. Nota visual en SORTER: "Palet se divide en prepacks".
3. **Validacion vs Orden de Compra:** Si hay faltantes, muestra comparativo esperados vs recibidos con detalle por color/talla.
4. **Tabla color × talla:** Matriz dinamica (solo tags no fallidos) con totales. Nota al pie con conteo de rechazados en QA.
5. **Prepacks del cargamento:** Tabla con EPC, producto legible (color + talla), tienda, bahia, etapa, estado (OK/ERR/QA FALLO). Ordenados: fallidos primero, luego con anomalia, luego ok. Doble clic expande inline con detalle + mini-timeline + boton "Marcar como fallido en QA" con selector de motivo.

### Lecturas en Vivo
Feed WebSocket. Columnas: HORA | ETAPA | SKU + EPC | PEDIDO | TIENDA | OK
Contadores: Lecturas Preregistro | Lecturas Bahia | Anomalias hoy | Duplicados hoy
Filtros por las 7 etapas.

### Trazabilidad
Busqueda por EPC o SKU. Timeline horizontal de 7 nodos.
Botones de acceso rapido: DEMO OK y DEMO ERR (datos fijos de cajon).
Acepta prop `initialEpc` para navegar directamente desde DetallePalet.

### Registrar Tag
Formulario con tienda_id TDA-xxx (FK), palet_id opcional, pedido_id opcional.

---

## Navegacion entre vistas

- **FlujoCEDIS (Mapa) -> DetallePalet:** Click en palet del panel lateral navega al tab Pedidos con el palet seleccionado.
- **DetallePalet -> Trazabilidad:** "Ver historial" en fila de prepack navega al tab Trazabilidad con EPC preseleccionado.
- **DetallePedido -> DetallePalet:** Click en card de palet.
- **Pedidos -> DetallePedido:** Click en fila de pedido.

---

## Datos del seed (V5)

Al correr `npx prisma db seed` se crean:

**2 proveedores:** PROV-001 Textiles Monterrey SA | PROV-002 Confecciones del Norte

**6 tiendas** con bahia_asignada:

| tienda_id | Nombre                    | bahia_asignada |
|-----------|---------------------------|----------------|
| TDA-007   | Vertiche Monterrey Centro | BAHIA-1        |
| TDA-015   | Vertiche San Pedro        | BAHIA-2        |
| TDA-029   | Vertiche Guadalajara      | BAHIA-3        |
| TDA-033   | Vertiche CDMX Polanco     | BAHIA-4        |
| TDA-044   | Vertiche Puebla           | BAHIA-1        |
| TDA-051   | Vertiche Cancun           | BAHIA-2        |

**2 ordenes de compra** con nombre_producto:
- OC-2026-001: "Pantalon de mezclilla slim fit" (PROV-001)
- OC-2026-002: "Blusa fluida manga larga" (PROV-002)

**2 pedidos:** PED-2026-001 (PROV-001) | PED-2026-002 (PROV-002)

**4 palets con historias distintas:**
- PAL-001: Playera Basica — flujo completo sin errores (DESPACHADO, 125 min ciclo)
- PAL-002: Playera Basica — 1 prepack rechazado en QA, 2 activos en BAHIA
- PAL-003: Pantalon Cargo — bahia incorrecta detectada, en AUDITORIA
- PAL-004: Pantalon Cargo — recien llegado, en PREREGISTRO

**10 tags del simulador** + **2 tags demo fijos:**

| EPC                      | Para que sirve en la demo                                |
|--------------------------|----------------------------------------------------------|
| DEMO0000000000000000OK01 | Boton "Prepack sin errores" — timeline 7 etapas verde    |
| DEMO000000000000000ERR02 | Boton "Prepack con anomalia" — BAHIA en rojo             |

**palet_etapa_log de demo (timestamps relativos a hoy):**
- PAL-001: 7 etapas completas sin anomalias — 08:00 a 10:05
- PAL-002: 5 etapas — QA con anomalia (1 prepack rechazado), en BAHIA sin cerrar
- PAL-003: 6 etapas — BAHIA con anomalia (bahia incorrecta), en AUDITORIA sin cerrar
- PAL-004: 1 etapa — en PREREGISTRO, recien llegado

**Anomalia QA:** Tag E2003411...107 marcado con qa_fallido=true, motivo "Prenda defectuosa"

---

## Sistema de diseno

Sin librerias de UI. Solo CSS inline y variables CSS.
Fuente: IBM Plex Sans / IBM Plex Mono (Google Fonts).

| Variable             | Uso                            |
|----------------------|--------------------------------|
| --flujo-crossdock    | Badge tipo CROSS_DOCK          |
| --flujo-almacen      | Badge tipo NUEVA_TIENDA        |
| --flujo-refill       | Badge tipo REFILL              |
| --etapa-preregistro  | Nodo timeline PREREGISTRO      |
| --etapa-qa           | Nodo timeline QA               |
| --etapa-registro     | Nodo timeline REGISTRO         |
| --etapa-sorter       | Nodo timeline SORTER           |
| --etapa-bahia        | Nodo timeline BAHIA            |
| --etapa-auditoria    | Nodo timeline AUDITORIA        |
| --etapa-envio        | Nodo timeline ENVIO            |

---

## Tecnologias usadas

| Capa       | Tecnologia       | Version | Para que                         |
|------------|------------------|---------|----------------------------------|
| Backend    | Node.js          | 18+     | Runtime JavaScript del servidor  |
| Backend    | Express.js       | 4.x     | Framework HTTP                   |
| Backend    | Socket.io        | 4.x     | WebSocket bidireccional          |
| Backend    | Prisma ORM       | 5.x     | Acceso a base de datos           |
| Base datos | PostgreSQL       | 15+     | Base de datos relacional         |
| Frontend   | React            | 18.x    | UI reactiva                      |
| Frontend   | Vite             | 4.x     | Bundler y dev server             |
| Frontend   | socket.io-client | 4.x     | Cliente WebSocket                |
| Simulador  | axios            | 1.x     | HTTP requests al backend         |
| Simulador  | dotenv           | 16.x   | Variables de entorno             |

---

## Puertos

| Servicio   | Puerto |
|------------|--------|
| Backend    | 3000   |
| Frontend   | 4000   |
| PostgreSQL | 5432   |

---

## Variables de entorno

**`backend/.env`**
```
DATABASE_URL="postgresql://rfid:rfid123@localhost:5432/vertiche_rfid"
PORT=3000
NODE_ENV=development
```

**`frontend/.env`** (opcional)
```
VITE_API_URL=http://localhost:3000
VITE_SOCKET_URL=http://localhost:3000
```

**`simulator/.env`**
```
BACKEND_URL=http://localhost:3000
```

---

## Sprint plan

| Sprint | Objetivo                                               | Estado     |
|--------|--------------------------------------------------------|------------|
| 1      | Diseno de base de datos y API REST                     | Completado |
| 2      | Simulador secuencial + WebSocket + Frontend (3 tabs)   | Completado |
| 3      | Pedidos/Palets/Tiendas + 6 etapas + 4 tabs frontend   | Completado |
| 4      | OrdenCompra + FlujoCEDIS (Linea/Mapa) + 5 tabs V3     | Completado |
| 5      | 7 etapas oficiales + palet_etapa_log + QA fallo + KPI ciclo + nomenclatura + Mapa zonas | Completado |

---

*Equipo RFID — Proyecto Vertiche — ITC Gpo 102 — Abril 2026*
