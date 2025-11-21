# Script de prueba para el MCP Server
# Ejecutar: .\test.ps1

$baseUrl = "http://localhost:3000"

Write-Host "=== Pruebas del MCP Server ===" -ForegroundColor Cyan

# Test 1: Health Check
Write-Host "`n1. Verificando salud del servidor..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/health" -ErrorAction Stop
    Write-Host "✓ Servidor activo" -ForegroundColor Green
    Write-Host ($response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 2)
} catch {
    Write-Host "✗ Error: $_" -ForegroundColor Red
}

# Test 2: Get Cronogramas
Write-Host "`n2. Obteniendo cronogramas..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/cronogramas" -ErrorAction Stop
    $data = $response.Content | ConvertFrom-Json
    Write-Host "✓ Cronogramas obtenidos: $($data.Count) registros" -ForegroundColor Green
    Write-Host ($data | ConvertTo-Json -Depth 2)
} catch {
    Write-Host "✗ Error: $_" -ForegroundColor Red
}

# Test 3: Get Projects
Write-Host "`n3. Obteniendo proyectos..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/projects" -ErrorAction Stop
    $data = $response.Content | ConvertFrom-Json
    Write-Host "✓ Proyectos obtenidos: $($data.Count) registros" -ForegroundColor Green
    Write-Host ($data | ConvertTo-Json -Depth 2)
} catch {
    Write-Host "✗ Error: $_" -ForegroundColor Red
}

# Test 4: Get Tareas (ID = 1)
Write-Host "`n4. Obteniendo tareas del cronograma 1..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/tareas/1" -ErrorAction Stop
    $data = $response.Content | ConvertFrom-Json
    Write-Host "✓ Tareas obtenidas: $($data.Count) registros" -ForegroundColor Green
    Write-Host ($data | ConvertTo-Json -Depth 2)
} catch {
    Write-Host "✗ Error: $_" -ForegroundColor Red
}

# Test 5: Call Tool via POST
Write-Host "`n5. Llamando tool 'get_cronogramas' via POST..." -ForegroundColor Yellow
try {
    $body = @{
        name = "get_cronogramas"
        arguments = @{}
    } | ConvertTo-Json

    $response = Invoke-WebRequest -Uri "$baseUrl/call" `
        -Method POST `
        -ContentType "application/json" `
        -Body $body `
        -ErrorAction Stop
    
    Write-Host "✓ Tool ejecutado exitosamente" -ForegroundColor Green
    Write-Host ($response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 2)
} catch {
    Write-Host "✗ Error: $_" -ForegroundColor Red
}

Write-Host "`n=== Pruebas completadas ===" -ForegroundColor Cyan
