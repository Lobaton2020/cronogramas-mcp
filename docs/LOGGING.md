# Sistema de Logging - MCP Server

## Descripción

El servidor MCP incluye un sistema completo de logging que registra:
- Todas las llamadas a herramientas (tools)
- Parámetros recibidos
- Respuestas generadas
- Errores y excepciones
- Eventos del servidor

## Archivos de Log

Los logs se guardan en el directorio `./logs/` con nombres por día:
```
logs/
├── log-2025-01-21.log
├── log-2025-01-22.log
└── log-2025-01-23.log
```

Cada archivo contiene todos los logs del día en formato ISO 8601.

## Formato de Logs

### Logs de Información
```
[2025-01-21T10:30:45.123Z] [INFO] Mensaje descriptivo
```

### Logs de Herramientas
```
================================================================================
[2025-01-21T10:30:45.123Z] [TOOL] TOOL CALL: get_cronogramas
{
  "request": {
    "method": "tools/call",
    "params": {
      "name": "get_cronogramas",
      "arguments": {}
    },
    "id": 1
  },
  "response": {
    "content": [
      {
        "type": "text",
        "text": "[...]"
      }
    ]
  },
  "timestamp": "2025-01-21T10:30:45.123Z"
}
================================================================================
```

### Logs de Error
```
[2025-01-21T10:30:45.123Z] [ERROR] Descripción del error
{
  "message": "Error details",
  "stack": "..."
}
```

## Control de Logs de Consola

### Opción 1: Variable de Entorno

Desabilitar logs de consola al iniciar:
```powershell
$env:CONSOLE_LOGS = "false"
npm start
```

O en una sola línea:
```powershell
CONSOLE_LOGS=false npm start
```

Habilitar logs de consola (por defecto):
```powershell
npm start
```

### Opción 2: Endpoint HTTP

**Desabilitar logs de consola en tiempo real:**
```powershell
$body = @{ enabled = $false } | ConvertTo-Json
Invoke-WebRequest -Uri "http://localhost:3000/logs/toggle" `
  -Method POST `
  -ContentType "application/json" `
  -Body $body
```

**Habilitar logs de consola en tiempo real:**
```powershell
$body = @{ enabled = $true } | ConvertTo-Json
Invoke-WebRequest -Uri "http://localhost:3000/logs/toggle" `
  -Method POST `
  -ContentType "application/json" `
  -Body $body
```

### Opción 3: Ver Estado de Logs

```powershell
Invoke-WebRequest -Uri "http://localhost:3000/logs/status"
```

Respuesta:
```json
{
  "consoleLogsEnabled": true,
  "logsDirectory": "./logs"
}
```

## Ejemplos de Uso

### Ejecutar sin logs en consola
```powershell
CONSOLE_LOGS=false npm start
```

Los logs seguirán guardándose en archivos, pero no aparecerán en la consola.

### Cambiar estado de logs mientras el servidor está corriendo

```powershell
# Desabilitar
Invoke-WebRequest -Uri "http://localhost:3000/logs/toggle" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"enabled":false}'

# Habilitar
Invoke-WebRequest -Uri "http://localhost:3000/logs/toggle" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"enabled":true}'
```

### Ver logs en tiempo real

```powershell
# Ver el archivo de hoy
Get-Content ".\logs\log-$(Get-Date -Format 'yyyy-MM-dd').log" -Tail 50 -Wait
```

## Información Registrada por Tool

### get_cronogramas
- Request: método, parámetros, ID
- Response: lista de cronogramas
- Timestamp de ejecución

### get_projects
- Request: método, parámetros, ID
- Response: lista de proyectos
- Timestamp de ejecución

### get_tareas_cronograma
- Request: método, parámetros (id_cronograma), ID
- Response: lista de tareas
- Timestamp de ejecución

## Troubleshooting

**P: ¿Dónde están los logs?**
R: En el directorio `./logs/` con nombre `log-YYYY-MM-DD.log`

**P: ¿Cómo desabilito los logs de consola permanentemente?**
R: Usa `CONSOLE_LOGS=false npm start`

**P: ¿Los logs se guardan aunque desabilite la consola?**
R: Sí, los logs siempre se guardan en archivos independientemente del estado de la consola.

**P: ¿Cómo limpio los logs antiguos?**
R: Puedes eliminar manualmente los archivos de `./logs/` que ya no necesites.
