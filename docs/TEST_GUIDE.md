# Guía de Prueba - MCP HTTP Server

## 1. Iniciar el Servidor

```powershell
npm start
```

El servidor se iniciará en `http://localhost:3000`

Deberías ver en la consola:
```
MCP Server HTTP escuchando en http://localhost:3000

Endpoints disponibles:
  GET  http://localhost:3000/health
  GET  http://localhost:3000/api/cronogramas
  GET  http://localhost:3000/api/projects
  GET  http://localhost:3000/api/tareas/:id_cronograma
  POST http://localhost:3000/call
```

## 2. Probar los Endpoints

### Opción A: Usar PowerShell (Invoke-WebRequest)

#### Verificar que el servidor está activo:
```powershell
Invoke-WebRequest -Uri "http://localhost:3000/health" | ConvertTo-Json
```

#### Obtener todos los cronogramas:
```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/cronogramas" | ConvertTo-Json
```

#### Obtener todos los proyectos:
```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/projects" | ConvertTo-Json
```

#### Obtener tareas de un cronograma (ID = 1):
```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/tareas/1" | ConvertTo-Json
```

#### Llamar a un tool específico (POST):
```powershell
$body = @{
    name = "get_cronogramas"
    arguments = @{}
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:3000/call" `
  -Method POST `
  -ContentType "application/json" `
  -Body $body | ConvertTo-Json
```

### Opción B: Usar cURL (si está disponible)

```bash
# Verificar salud
curl http://localhost:3000/health

# Obtener cronogramas
curl http://localhost:3000/api/cronogramas

# Obtener proyectos
curl http://localhost:3000/api/projects

# Obtener tareas (ID = 1)
curl http://localhost:3000/api/tareas/1

# Llamar tool por POST
curl -X POST http://localhost:3000/call \
  -H "Content-Type: application/json" \
  -d '{"name":"get_cronogramas","arguments":{}}'
```

### Opción C: Usar Postman o Insomnia

1. **Crear una nueva request GET:**
   - URL: `http://localhost:3000/api/cronogramas`
   - Método: GET
   - Click en "Send"

2. **Crear una nueva request POST:**
   - URL: `http://localhost:3000/call`
   - Método: POST
   - Headers: `Content-Type: application/json`
   - Body (JSON):
   ```json
   {
     "name": "get_cronogramas",
     "arguments": {}
   }
   ```

## 3. Respuestas Esperadas

### Si la BD está conectada:
```json
[
  {
    "id_cronograma_PK": 1,
    "id_usuario_FK": 1,
    "titulo": "Mi Cronograma",
    "fecha": "2025-01-21T10:00:00.000Z"
  }
]
```

### Si hay error de conexión:
```json
{
  "error": "Error al obtener cronogramas: connect ECONNREFUSED 127.0.0.1:3306"
}
```

## 4. Configurar Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto:

```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_contraseña
DB_NAME=cronogramas_db
PORT=3000
```

## 5. Estructura de Respuestas

### GET /api/cronogramas
Retorna array de cronogramas

### GET /api/projects
Retorna array de proyectos

### GET /api/tareas/:id_cronograma
Retorna array de tareas para un cronograma específico

### POST /call
Permite llamar a cualquier tool del MCP
- Body: `{ "name": "nombre_del_tool", "arguments": {...} }`

## 6. Troubleshooting

**Error: "connect ECONNREFUSED"**
- Verifica que MySQL está corriendo
- Verifica las credenciales en `.env`

**Error: "Unknown database"**
- Crea la BD: `CREATE DATABASE cronogramas_db;`
- Importa las tablas SQL

**Puerto 3000 ya está en uso:**
- Cambia el puerto en `.env`: `PORT=3001`
- O mata el proceso: `netstat -ano | findstr :3000`
