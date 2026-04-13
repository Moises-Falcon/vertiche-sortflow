# Setup — Sistema RFID Vertiche
## Equipo RFID | ITC Gpo 102

---

## 1. Requisitos — Qué descargar antes de empezar

### Node.js (obligatorio)
- Descarga: https://nodejs.org
- Version recomendada: 18 o superior (LTS)
- Verificar instalacion:
  ```
  node --version
  ```

### PostgreSQL (obligatorio — la base de datos)
- Descarga: https://www.postgresql.org/download/windows
- Durante la instalacion:
  - Pon una contraseña al superusuario (guardala, la necesitaras)
  - Puerto: dejar 5432 (el que viene por defecto)
  - Al final NO instalar Stack Builder
- Verificar: buscar "SQL Shell (psql)" en el menu inicio

---

## 2. Configurar la base de datos (solo la primera vez)

Abre **SQL Shell (psql)** desde el menu inicio.

Presiona **Enter** en todo hasta que pida el password:

```
Server [localhost]:         → Enter
Database [postgres]:        → Enter
Port [5432]:                → Enter
Username [postgres]:        → Enter
Password for user postgres: → escribe tu contraseña y Enter
```

Cuando veas `postgres=#` copia y pega estos comandos **uno por uno**:

```sql
CREATE USER rfid WITH PASSWORD 'rfid123';
```
```sql
CREATE DATABASE vertiche_rfid OWNER rfid;
```
```sql
GRANT ALL PRIVILEGES ON DATABASE vertiche_rfid TO rfid;
```
```sql
ALTER USER rfid CREATEDB;
```
```sql
\q
```

> El comando `ALTER USER rfid CREATEDB` es obligatorio — sin el, Prisma no puede correr las migraciones.

---

## 3. Levantar el proyecto (3 terminales)

Abre **3 terminales separadas** (CMD o PowerShell) y **reemplaza TU_USUARIO con tu nombre de usuario de Windows**.

---

### Terminal 1 — Backend (empezar por esta)

```bash
cd C:\Users\TU_USUARIO\rfid-vertiche\backend
npm install
npx prisma migrate dev --name sprint3_pedidos_palets_tiendas
npx prisma db seed
npm run dev
```

**Espera** a ver este mensaje antes de continuar:
```
Backend RFID corriendo en puerto 3000
```

> Si `npx prisma migrate dev` da error de permisos, asegurate de haber corrido `ALTER USER rfid CREATEDB;`

---

### Terminal 2 — Simulador RFID

```bash
cd C:\Users\TU_USUARIO\rfid-vertiche\simulator
npm install
node simulator.js
```

Veras el flujo de prepacks en consola:
```
[OK]   [10:32:14] BLU-F-M-001    | RECEPCION        | RECEPCION   | CROSS_DOCK [201]
[OK]   [10:32:18] BLU-F-M-001    | CONTROL_CALIDAD  | QA          | CROSS_DOCK [201]
[WARN] [10:32:25] ROJ-F-S-002    | BAHIA            | BAHIA-3     | CROSS_DOCK ! BAHIA_INCORRECTA (esperada BAHIA-1)
[DONE] [10:32:49] BLU-F-M-001    completado -> AUDITORIA
```

---

### Terminal 3 — Frontend

```bash
cd C:\Users\TU_USUARIO\rfid-vertiche\frontend
npm install
npm run dev
```

Abre el navegador en: **http://localhost:4000**

---

## 4. Puertos que usa el sistema

| Servicio   | Puerto |
|------------|--------|
| Backend    | 3000   |
| Frontend   | 4000   |
| PostgreSQL | 5432   |

---

## 5. Volver a levantar (dias siguientes)

La base de datos y el seed solo se corren **una vez**. Del dia 2 en adelante:

**Terminal 1 — Backend:**
```bash
cd C:\Users\TU_USUARIO\rfid-vertiche\backend
npm run dev
```

**Terminal 2 — Simulador:**
```bash
cd C:\Users\TU_USUARIO\rfid-vertiche\simulator
node simulator.js
```

**Terminal 3 — Frontend:**
```bash
cd C:\Users\TU_USUARIO\rfid-vertiche\frontend
npm run dev
```

---

## 6. Tabs del sistema

| Tab              | Que muestra                                                             |
|------------------|-------------------------------------------------------------------------|
| Pedidos          | Lista de pedidos con progreso, drill-down a palets y tags              |
| Lecturas en Vivo | Feed en tiempo real + contadores por etapa + anomalias                 |
| Trazabilidad     | Historial completo de un prepack por EPC o SKU (timeline 6 etapas)    |
| Registrar Tag    | Formulario para vincular un tag nuevo al sistema                       |

---

## 7. Accesos rapidos para la demo (Trazabilidad)

En la tab **Trazabilidad**, la columna izquierda tiene tres botones de ejemplo rapido:

| Boton                  | Que muestra                                                    |
|------------------------|----------------------------------------------------------------|
| Prepack sin errores    | Timeline completo 6 etapas verde, vinculado a caja y pedido   |
| Prepack con anomalia   | Etapa BAHIA en rojo (fue a bahia incorrecta), resto normal     |
| Buscar por SKU         | Lista de tags con SKU BLU-F-M-001                              |

---

## 8. Navegar por Pedidos

La tab **Pedidos** tiene navegacion jerarquica sin recargar la pagina:

1. Lista de pedidos (con progreso en %)
2. Click en un pedido -> DetallePedido (distribucion por flujo, mapa de etapas, cards de palets)
3. Click en un palet -> DetallePalet (tabla de todos los tags)
4. Click en "Ver historial" en un tag -> va a Trazabilidad con ese EPC ya buscado

---

## 9. Flujos que simula el sistema

| Tipo         | Etapas                                                          |
|--------------|-----------------------------------------------------------------|
| CROSS_DOCK   | Recepcion -> Control Calidad -> Desviacion -> Cross Dock -> Bahia -> Auditoria |
| NUEVA_TIENDA | Recepcion -> Control Calidad -> Desviacion -> (queda en almacen) |
| REFILL       | Recepcion -> Control Calidad -> Desviacion -> (queda en almacen) |

---

## 10. Si necesitas re-correr el seed

El seed esta protegido contra duplicados — puedes correrlo varias veces sin problema:

```bash
cd C:\Users\TU_USUARIO\rfid-vertiche\backend
npx prisma db seed
```

---

## 11. Errores comunes y solucion

| Error | Solucion |
|-------|----------|
| `P3014 - permission to create databases` | Correr `ALTER USER rfid CREATEDB;` en SQL Shell |
| `Cannot find module 'dotenv'` | Correr `npm install` en la carpeta simulator |
| Frontend no conecta al backend | Verificar que la Terminal 1 (backend) este corriendo |
| No hay datos en Trazabilidad | Correr `npx prisma db seed` en la carpeta backend |
| Timeline muestra todo gris | El seed no se corrio o los eventos DEMO no se crearon |
| Error de columna desconocida | Regenerar cliente: `npx prisma generate` en backend |
| `Column etapa does not exist` | Correr migracion: `npx prisma migrate dev --name sprint3_...` |

---

*Equipo RFID — Proyecto Vertiche — ITC Gpo 102 — Abril 2026*
