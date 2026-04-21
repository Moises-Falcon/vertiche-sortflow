# Vertiche SortFlow — Comandos útiles

> Referencia rápida de todo lo que se puede correr en el proyecto.

---

## 1. Arrancar todo (scripts automáticos)

```powershell
cd c:\Users\Moise\rfid-vertiche

# Levantar TODO (backend + 4 frontends)
.\start-all.ps1

# Solo los 4 frontends (sin backend — modo demo puro)
.\start-all.ps1 -NoBackend

# Con simulador RFID
.\start-all.ps1 -WithSim

# Backend + simulador + frontends
.\start-all.ps1 -WithSim

# Detener todo
.\stop-all.ps1
```

---

## 2. Arrancar cada servicio manual (una terminal por servicio)

```powershell
# Backend (puerto 3000)
cd c:\Users\Moise\rfid-vertiche\backend
npm run dev

# Simulador RFID (opcional)
cd c:\Users\Moise\rfid-vertiche\simulator
node simulator.js

# Frontend RFID (puerto 4000)
cd c:\Users\Moise\rfid-vertiche\frontend-rfid
npm run dev

# Frontend Sorter (puerto 4001)
cd c:\Users\Moise\rfid-vertiche\frontend-sorter
npm run dev

# Frontend Dashboard (puerto 4002)
cd c:\Users\Moise\rfid-vertiche\frontend-dashboard
npm run dev

# Frontend Proveedores (puerto 4003)
cd c:\Users\Moise\rfid-vertiche\frontend-proveedores
npm run dev
```

---

## 3. URLs de cada módulo

| Módulo | URL |
|---|---|
| RFID (dashboard Gantt) | http://localhost:4000 |
| Sorter (operador) | http://localhost:4001/sorter |
| Sorter (monitor bahía) | http://localhost:4001/bahia/1 (cambiar 1 por 1-10) |
| Dashboard operativo | http://localhost:4002 |
| Proveedores QA | http://localhost:4003 |
| Backend API health | http://localhost:3000/health |

---

## 4. Base de datos PostgreSQL (Docker)

```powershell
cd c:\Users\Moise\rfid-vertiche

# Levantar PostgreSQL
docker-compose up postgres

# Levantar en segundo plano
docker-compose up -d postgres

# Ver logs
docker-compose logs -f postgres

# Detener
docker-compose stop

# Detener y eliminar contenedores
docker-compose down

# Detener + borrar volumen (resetea datos)
docker-compose down -v
```

---

## 5. Migraciones y seed de BD (Prisma)

```powershell
cd c:\Users\Moise\rfid-vertiche\backend

# Resetear BD y aplicar todas las migraciones + seed
npx prisma migrate reset

# Correr solo el seed (sin borrar datos)
npx prisma db seed

# Crear una nueva migración
npx prisma migrate dev --name nombre-descriptivo

# Regenerar el cliente Prisma
npx prisma generate

# Abrir Prisma Studio (UI de la BD)
npx prisma studio
```

---

## 6. Build de producción

```powershell
# Build de cada frontend
cd c:\Users\Moise\rfid-vertiche\frontend-rfid       ; npm run build
cd c:\Users\Moise\rfid-vertiche\frontend-sorter     ; npm run build
cd c:\Users\Moise\rfid-vertiche\frontend-dashboard  ; npm run build
cd c:\Users\Moise\rfid-vertiche\frontend-proveedores; npm run build

# Preview de un build (ver el build localmente)
npm run preview
```

---

## 7. Git / GitHub (repo vertiche-sortflow)

```powershell
cd c:\Users\Moise\rfid-vertiche

# Ver estado
git status

# Ver remoto
git remote -v

# Ver últimos 10 commits
git log --oneline -10

# Stagear y commitear todo
git add .
git commit -m "descripcion del cambio"

# Push al repo
git push

# Pull
git pull

# Ver branch actual
git branch

# Crear rama nueva y cambiar a ella
git checkout -b nombre-de-rama

# Volver a master
git checkout master
```

---

## 8. Instalación (solo primera vez o al clonar)

```powershell
cd c:\Users\Moise\rfid-vertiche

# Backend
cd backend ; npm install ; cd ..

# Simulador
cd simulator ; npm install ; cd ..

# 4 Frontends
cd frontend-rfid         ; npm install ; cd ..
cd frontend-sorter       ; npm install ; cd ..
cd frontend-dashboard    ; npm install ; cd ..
cd frontend-proveedores  ; npm install ; cd ..
```

---

## 9. Troubleshooting

```powershell
# Ver qué está usando un puerto
Get-NetTCPConnection -LocalPort 3000

# Matar un proceso específico por PID
Stop-Process -Id 1234 -Force

# Matar todos los procesos node de golpe (cuidado)
Get-Process node | Stop-Process -Force

# Permitir ejecutar scripts .ps1 (primera vez, una sola vez)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Si hay error EPERM al regenerar Prisma: detener backend primero
.\stop-all.ps1
cd backend ; npx prisma generate

# Limpiar node_modules y reinstalar (de un frontend)
cd frontend-rfid
Remove-Item node_modules -Recurse -Force
Remove-Item package-lock.json -Force
npm install
```

---

## 10. Flujo típico para demo

```powershell
cd c:\Users\Moise\rfid-vertiche

# 1. Levantar PostgreSQL (en terminal aparte o detached)
docker-compose up -d postgres

# 2. Levantar todo (backend + 4 frontends)
.\start-all.ps1

# 3. Abrir navegador en los 4 puertos
start http://localhost:4000
start http://localhost:4001/sorter
start http://localhost:4002
start http://localhost:4003

# Cuando termines
.\stop-all.ps1
docker-compose stop
```

---

## 11. Endpoints del backend (prueba rápida)

```powershell
# Salud
curl http://localhost:3000/health

# Tags
curl http://localhost:3000/api/tags

# Proveedores
curl http://localhost:3000/api/proveedores

# Tiendas
curl http://localhost:3000/api/tiendas

# Órdenes de compra
curl http://localhost:3000/api/ordenes

# Prepacks pendientes de QA
curl http://localhost:3000/api/qa/prepacks-pendientes

# KPI de ciclo
curl http://localhost:3000/api/dashboard/kpi-ciclo

# POST inspección QA (ejemplo)
$body = @{
    tag_epc      = 'E006A'
    proveedor_id = 1
    operador_id  = 'Juan'
    resultado    = 'RECHAZADO'
    defecto_tipo = 'Costuras abiertas'
    observacion  = 'Costura floja en manga'
} | ConvertTo-Json
curl -Method POST -Uri http://localhost:3000/api/inspeccion-qa -Body $body -ContentType 'application/json'
```

---

*Vertiche SortFlow — Guía de comandos — Abril 2026*
