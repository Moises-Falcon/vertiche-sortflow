# Vertiche SortFlow - levantar todos los modulos
# Uso:
#   .\start-all.ps1             levanta backend + 4 frontends
#   .\start-all.ps1 -NoBackend  solo los 4 frontends (modo demo)
#   .\start-all.ps1 -WithSim    incluye simulador RFID

param(
    [switch]$NoBackend,
    [switch]$WithSim
)

$root = $PSScriptRoot

Write-Host ""
Write-Host "  Vertiche SortFlow - Iniciando servicios" -ForegroundColor Cyan
Write-Host "  ---------------------------------------" -ForegroundColor DarkGray

function Start-Module {
    param([string]$name, [string]$path)
    $title = "Vertiche " + $name
    Write-Host "  -> $name" -ForegroundColor Green
    $cmd = "`$Host.UI.RawUI.WindowTitle = '" + $title + "'; cd '" + $path + "'; npm run dev"
    Start-Process powershell -ArgumentList "-NoExit", "-Command", $cmd
    Start-Sleep -Milliseconds 600
}

if (-not $NoBackend) {
    Write-Host "  -> Backend (Express puerto 3000)" -ForegroundColor Yellow
    $cmd = "`$Host.UI.RawUI.WindowTitle = 'Vertiche Backend'; cd '" + $root + "\backend'; npm run dev"
    Start-Process powershell -ArgumentList "-NoExit", "-Command", $cmd
    Start-Sleep -Seconds 2
}

if ($WithSim) {
    Write-Host "  -> Simulador RFID" -ForegroundColor Magenta
    $cmd = "`$Host.UI.RawUI.WindowTitle = 'Vertiche Simulador'; cd '" + $root + "\simulator'; node simulator.js"
    Start-Process powershell -ArgumentList "-NoExit", "-Command", $cmd
    Start-Sleep -Milliseconds 600
}

Start-Module "frontend-rfid         [puerto 4000]" "$root\frontend-rfid"
Start-Module "frontend-sorter       [puerto 4001]" "$root\frontend-sorter"
Start-Module "frontend-dashboard    [puerto 4002]" "$root\frontend-dashboard"
Start-Module "frontend-proveedores  [puerto 4003]" "$root\frontend-proveedores"

Write-Host ""
Write-Host "  URLs:" -ForegroundColor Cyan
Write-Host "    RFID         http://localhost:4000" -ForegroundColor White
Write-Host "    Sorter       http://localhost:4001/sorter" -ForegroundColor White
Write-Host "    Bahia 3      http://localhost:4001/bahia/3" -ForegroundColor White
Write-Host "    Dashboard    http://localhost:4002" -ForegroundColor White
Write-Host "    Proveedores  http://localhost:4003" -ForegroundColor White
if (-not $NoBackend) {
    Write-Host "    Backend API  http://localhost:3000/health" -ForegroundColor White
}
Write-Host ""
Write-Host "  Para detener: .\stop-all.ps1" -ForegroundColor DarkGray
Write-Host ""
