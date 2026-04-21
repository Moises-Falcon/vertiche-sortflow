# Datos Demo — Referencia Maestra

> **Fuente única de verdad** para los 4 frontends + backend.
> Todos los módulos (`frontend-rfid`, `frontend-sorter`, `frontend-dashboard`, `frontend-proveedores`) y el `backend/prisma/seed.js` usan **los mismos IDs, nombres y relaciones** documentados aquí.

Última sincronización: **2026-04-21**.

---

## 1. Proveedores (7) — PROV-001 a PROV-007

| Código | Nombre | Nivel | Rating | Origen | Categoría | En backend |
|---|---|---|---|---|---|---|
| **PROV-001** | Textiles Monterrey SA  | ELITE | 4.8 | Monterrey, NL | Playera / Polo / Camiseta | ✅ seed |
| **PROV-002** | Confecciones del Norte | MEDIA | 4.2 | Monterrey, NL | Pantalón / Jeans | ✅ seed |
| **PROV-003** | Moda Express MX        | ELITE | 4.5 | Guadalajara, JAL | Blusa / Falda | ✅ seed |
| **PROV-004** | ActiveWear CDMX        | ELITE | 4.6 | CDMX | Deportivo / Athletic | ✅ seed |
| **PROV-005** | Diseños Guadalajara    | MEDIA | 3.8 | Guadalajara, JAL | Vestido / Jeans mujer | ✅ seed |
| **PROV-006** | Estampados MX          | BAJA  | 2.1 | Puebla, PUE | Playera estampada / Shorts | ✅ seed |
| **PROV-007** | Urban Trends MX        | BAJA  | 1.9 | León, GTO | Sudadera / Chamarra urbana | ✅ seed |

---

## 2. Tiendas (20) — TDA-007 a TDA-055

Todas las tiendas del frontend demo también existen en `backend/prisma/seed.js`.

| ID | Nombre | Ciudad | Estado | Bahía |
|---|---|---|---|---|
| TDA-007 | Vértice Monterrey Centro | Monterrey | NL | **BAHIA-1** |
| TDA-008 | Vértice Monterrey Sur    | Monterrey | NL | BAHIA-1 |
| TDA-015 | Vértice San Pedro        | San Pedro Garza García | NL | **BAHIA-2** |
| TDA-016 | Vértice Saltillo         | Saltillo | COAH | BAHIA-2 |
| TDA-029 | Vértice Guadalajara      | Guadalajara | JAL | **BAHIA-3** |
| TDA-030 | Vértice Zapopan          | Zapopan | JAL | BAHIA-3 |
| TDA-033 | Vértice CDMX Polanco     | CDMX | CDMX | **BAHIA-4** |
| TDA-034 | Vértice CDMX Roma        | CDMX | CDMX | BAHIA-4 |
| TDA-044 | Vértice Puebla           | Puebla | PUE | **BAHIA-5** |
| TDA-045 | Vértice Querétaro        | Querétaro | QRO | BAHIA-5 |
| TDA-046 | Vértice San Luis Potosí  | San Luis Potosí | SLP | **BAHIA-6** |
| TDA-047 | Vértice Aguascalientes   | Aguascalientes | AGS | BAHIA-6 |
| TDA-048 | Vértice Hermosillo       | Hermosillo | SON | **BAHIA-7** |
| TDA-049 | Vértice Culiacán         | Culiacán | SIN | BAHIA-7 |
| TDA-050 | Vértice Tijuana          | Tijuana | BC | **BAHIA-8** |
| TDA-053 | Vértice Mexicali         | Mexicali | BC | BAHIA-8 |
| **TDA-051** | **Vértice Cancún**   | Cancún | QROO | **BAHIA-9** |
| TDA-052 | Vértice Mérida           | Mérida | YUC | BAHIA-9 |
| TDA-054 | Vértice Chihuahua        | Chihuahua | CHIH | **BAHIA-10** |
| TDA-055 | Vértice Ciudad Juárez    | Cd. Juárez | CHIH | BAHIA-10 |

---

## 3. 10 Bahías del CEDIS

Cada bahía agrupa 2 tiendas de la misma región:

| Bahía | Tiendas destino | Región |
|---|---|---|
| BAHIA-1  | TDA-007 · TDA-008 | Monterrey |
| BAHIA-2  | TDA-015 · TDA-016 | San Pedro / Saltillo |
| BAHIA-3  | TDA-029 · TDA-030 | Guadalajara / Zapopan |
| BAHIA-4  | TDA-033 · TDA-034 | CDMX |
| BAHIA-5  | TDA-044 · TDA-045 | Puebla / Querétaro |
| BAHIA-6  | TDA-046 · TDA-047 | SLP / Aguascalientes |
| BAHIA-7  | TDA-048 · TDA-049 | Hermosillo / Culiacán |
| BAHIA-8  | TDA-050 · TDA-053 | Tijuana / Mexicali |
| BAHIA-9  | TDA-051 · TDA-052 | Cancún / Mérida |
| BAHIA-10 | TDA-054 · TDA-055 | Chihuahua / Juárez |

---

## 4. Órdenes de Compra (25) — OC-001 a OC-025

25 OCs distribuidas en las 7 etapas del CEDIS.

| OC | Producto | Proveedor | Etapa(s) | Prepacks | Faltantes |
|---|---|---|---|---|---|
| OC-001 | Playera Básica Manga Corta | PROV-001 | PREREGISTRO | 3 | 0 |
| OC-002 | Pantalón Cargo Denim Slim  | PROV-002 | PREREGISTRO | 2 | **1** |
| OC-003 | Blusa Fluida Manga Larga   | PROV-003 | PREREGISTRO | 2 | 0 |
| OC-004 | Chamarra Impermeable Sport | PROV-004 | PREREGISTRO | 2 | 0 |
| OC-005 | Vestido Casual Verano      | PROV-005 | PREREGISTRO + QA | 3 | 0 |
| OC-006 | Polo Piqué Hombre          | PROV-001 | QA | 2 | **1** · E006A rechazado |
| OC-007 | Short Deportivo Running    | PROV-004 | QA | 2 | 0 |
| OC-008 | Playera Estampada Temporada| PROV-006 | QA + REGISTRO | 3 | 0 |
| OC-009 | Pantalón Chino Slim Fit    | PROV-002 | REGISTRO | 2 | 0 |
| OC-010 | Sudadera Hoodie Oversize   | PROV-007 | REGISTRO | 2 | 0 |
| OC-011 | Camiseta Básica Pack       | PROV-001 | REGISTRO | 2 | **1** · E011A rechazado |
| OC-012 | Blusa Campesina Bordada    | PROV-003 | REGISTRO + SORTER | 3 | 0 |
| OC-013 | Jean Skinny Mujer          | PROV-005 | SORTER | 2 | 0 |
| OC-014 | Playera Polo Sport         | PROV-004 | SORTER + BAHIA | 2 | 0 |
| OC-015 | Shorts Playa Tropical      | PROV-006 | BAHIA | 3 | 0 |
| OC-016 | Falda Midi Plisada         | PROV-005 | SORTER + BAHIA | 2 | 0 |
| OC-017 | Chamarra Denim Oversize    | PROV-007 | BAHIA | 2 | 0 |
| OC-018 | Playera Básica Premium     | PROV-001 | BAHIA + AUDITORIA | 3 | 0 |
| OC-019 | Pantalón Vestir Slim       | PROV-002 | AUDITORIA | 2 | **1** · E019A rechazado |
| OC-020 | Blusa Casual Rayas         | PROV-003 | AUDITORIA | 2 | 0 |
| OC-021 | Sudadera Crew Neck Básica  | PROV-007 | AUDITORIA + ENVIO | 2 | 0 |
| OC-022 | Pantalón Jogger Tech       | PROV-004 | ENVIO | 3 | 0 |
| OC-023 | Vestido Formal Noche       | PROV-005 | ENVIO | 2 | 0 |
| OC-024 | Playera Manga Larga UV     | PROV-001 | ENVIO | 2 | **1** · E024B rechazado |
| OC-025 | Short Gym Hombre           | PROV-004 | AUDITORIA + ENVIO | 2 | 0 |

**Total:** 62 prepacks · 5 OCs con faltantes · 4 prepacks con `qa_fallido=true`

---

## 5. EPCs — formato E<OC><letra>

Convención: `E<número-OC-3-dígitos><letra>` donde las letras van A, B, C... por prepack.

Ejemplos: `E001A`, `E001B`, `E001C`, `E002A`, ..., `E024A`, `E024B`, `E025A`, `E025B`.

### Prepacks rechazados en QA (`qa_fallido = true`)

| EPC | OC | Producto | Proveedor |
|---|---|---|---|
| **E006A** | OC-006 | Polo Piqué Hombre      | Textiles Monterrey SA |
| **E011A** | OC-011 | Camiseta Básica Pack   | Textiles Monterrey SA |
| **E019A** | OC-019 | Pantalón Vestir Slim   | Confecciones del Norte |
| **E024B** | OC-024 | Playera Manga Larga UV | Textiles Monterrey SA |

---

## 6. Estructura de un prepack

Cada prepack (1 EPC) contiene **varias prendas** de distintos colores y tallas:

```js
{
  epc: 'E001A',
  orden_id: 'OC-001',
  producto: 'Playera Básica Manga Corta',
  proveedor: 'Textiles Monterrey SA',
  tienda: { tienda_id:'TDA-007', nombre:'...', bahia_asignada:'BAHIA-1' },
  bayNumber: 1,
  etapa_actual: 'PREREGISTRO',
  qa_fallido: false,
  tipo_flujo: 'CROSS_DOCK',
  prendas: [
    { color:'Azul',  talla:'S' },
    { color:'Azul',  talla:'M' },
    { color:'Negro', talla:'S' },
    { color:'Negro', talla:'L' },
  ],
  total_prendas: 4,
}
```

---

## 7. 7 Etapas oficiales del CEDIS

| # | Etapa | Lector RFID | Zona física |
|---|---|---|---|
| 1 | PREREGISTRO | RFID-RECEPCION-1 | RAMPA-ENTRADA |
| 2 | QA          | RFID-QA-1        | ZONA-QA       |
| 3 | REGISTRO    | RFID-REGISTRO-1  | ZONA-REGISTRO |
| 4 | SORTER      | RFID-SORTER-1    | ZONA-SORTER   |
| 5 | BAHIA       | RFID-BAHIA-{N}   | BAHIA-{N}     |
| 6 | AUDITORIA   | RFID-AUDITORIA-1 | ZONA-AUDITORIA|
| 7 | ENVIO       | RFID-ENVIO-1     | MUELLE-SALIDA |

---

## 8. Dónde vive cada dato en el código

| Dato | Archivo | Módulo |
|---|---|---|
| Tiendas (20) | `frontend-sorter/src/data/demoData.js` · `TIENDAS` | Sorter |
|  | `frontend-rfid/src/pages/FlujoCEDIS.jsx` · `TIENDAS` | RFID |
|  | `frontend-dashboard/src/data/dashboardData.js` · `TIENDAS_REF` (6 referenciadas) | Dashboard |
|  | `backend/prisma/seed.js` · `tiendas[]` | Backend |
| Proveedores (7) | `frontend-proveedores/src/data/demoData.js` · `SUPPLIERS_INITIAL`, `SUPPLIER_PROFILES` | Proveedores |
|  | `frontend-dashboard/src/data/dashboardData.js` · `PROVEEDORES_REF` | Dashboard |
|  | `backend/prisma/seed.js` · proveedores | Backend |
| OCs/prepacks (25 / 62) | `frontend-rfid/src/pages/FlujoCEDIS.jsx` · `DEMO_OCS` | RFID (fuente) |
|  | `frontend-sorter/src/data/demoData.js` · `DEMO_PREPACKS` (32 del subset SORTER/BAHIA) | Sorter |
|  | `frontend-proveedores/src/data/demoData.js` · `CARGO_SCENARIOS` (7 escenarios) | Proveedores |
|  | `frontend-dashboard/src/data/dashboardData.js` · `ETAPAS` + `MODALS` | Dashboard |

---

## 9. Cómo mantener la sincronía

Cuando se modifique un dato:
1. **Fuente de verdad:** `frontend-rfid/src/pages/FlujoCEDIS.jsx` (DEMO_OCS + TIENDAS)
2. Después actualizar los demás módulos y este documento
3. Si cambian tiendas/proveedores, actualizar `backend/prisma/seed.js` y correr `npx prisma migrate reset`

---

*Vertiche SortFlow — Referencia de datos demo — Abril 2026*
