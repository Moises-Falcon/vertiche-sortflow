# Vertiche SortFlow - detener todos los modulos
# Mata procesos node escuchando en puertos 3000, 4000, 4001, 4002, 4003
# y cierra las ventanas PowerShell con titulo "Vertiche"

$ports = 3000, 4000, 4001, 4002, 4003
$killed = 0

Write-Host ""
Write-Host "  Vertiche SortFlow - Deteniendo servicios" -ForegroundColor Cyan
Write-Host "  ----------------------------------------" -ForegroundColor DarkGray

foreach ($port in $ports) {
    $conns = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    foreach ($c in $conns) {
        try {
            $p = Get-Process -Id $c.OwningProcess -ErrorAction SilentlyContinue
            if ($p) {
                Stop-Process -Id $p.Id -Force -ErrorAction SilentlyContinue
                $msg = "  -> Puerto " + $port + " [PID " + $p.Id + "] detenido"
                Write-Host $msg -ForegroundColor Yellow
                $killed++
            }
        } catch {}
    }
}

Get-Process powershell -ErrorAction SilentlyContinue | Where-Object {
    $_.MainWindowTitle -like "Vertiche*"
} | ForEach-Object {
    try {
        $title = $_.MainWindowTitle
        Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
        $msg = "  -> Ventana '" + $title + "' cerrada"
        Write-Host $msg -ForegroundColor DarkYellow
        $killed++
    } catch {}
}

Write-Host ""
if ($killed -eq 0) {
    Write-Host "  No habia servicios corriendo." -ForegroundColor DarkGray
} else {
    $total = "  " + $killed + " servicios detenidos."
    Write-Host $total -ForegroundColor Green
}
Write-Host ""
