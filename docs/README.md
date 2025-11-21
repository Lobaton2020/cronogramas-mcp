# Cronogramas MCP Server

MCP (Model Context Protocol) Server para gestionar cronogramas, proyectos y tareas en una base de datos MySQL.

## Instalación

1. Instalar dependencias:
```bash
npm install
```

2. Configurar variables de entorno (crear archivo `.env`):
```bash
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_contraseña
DB_NAME=cronogramas_db
```

## Ejecución

```bash
npm start
```

El servidor se ejecutará en `http://localhost:3000` (o el puerto especificado en `.env`)

## Transporte HTTP Streamable

Este MCP utiliza **HTTP con Express** como transporte, lo que permite:
- Conexiones HTTP estándar
- Streaming de datos
- Fácil integración con clientes HTTP
- Mejor escalabilidad que stdio

## Tools Disponibles

### 1. get_cronogramas
Obtiene todos los cronogramas de la base de datos.

**Parámetros:** Ninguno

**Respuesta:** Array de cronogramas con id, usuario, título y fecha.

### 2. get_projects
Obtiene todos los proyectos activos de la base de datos.

**Parámetros:** Ninguno

**Respuesta:** Array de proyectos con id, usuario, nombre, estado, descripción y fecha de creación.

### 3. get_tareas_cronograma
Obtiene todas las tareas de un cronograma específico.

**Parámetros:**
- `id_cronograma` (number, requerido): ID del cronograma

**Respuesta:** Array de tareas con descripción, hora, minuto, meridiano, estado, proyecto y orden.

## Estructura de Base de Datos

```sql
CREATE TABLE `cronograma` (
  `id_cronograma_PK` int(11) NOT NULL AUTO_INCREMENT,
  `id_usuario_FK` int(11) NOT NULL,
  `titulo` varchar(100) DEFAULT NULL,
  `fecha` datetime NOT NULL
);

CREATE TABLE `projects` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `status` tinyint(1) NOT NULL DEFAULT 1,
  `descripcion` varchar(1000) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
);

CREATE TABLE `tarea_cronograma` (
  `id_tarea_cronograma_PK` int(11) NOT NULL AUTO_INCREMENT,
  `id_cronograma_FK` int(11) NOT NULL,
  `descripcion` varchar(1000) NOT NULL,
  `hora` int(11) NOT NULL,
  `minuto` int(11) NOT NULL,
  `meridiano` varchar(2) DEFAULT NULL,
  `estado` tinyint(1) NOT NULL,
  `project_id` int(11) DEFAULT NULL,
  `order` int(11) NOT NULL DEFAULT 0
);
```

## Endpoints HTTP Disponibles

### GET /health
Verifica que el servidor está activo.

**Respuesta:**
```json
{
  "status": "ok",
  "message": "MCP Server is running"
}
```

### GET /api/cronogramas
Obtiene todos los cronogramas.

**Respuesta:** Array de cronogramas

### GET /api/projects
Obtiene todos los proyectos activos.

**Respuesta:** Array de proyectos

### GET /api/tareas/:id_cronograma
Obtiene todas las tareas de un cronograma específico.

**Parámetros:**
- `id_cronograma` (en URL): ID del cronograma

**Respuesta:** Array de tareas

### POST /call
Llama a cualquier tool del MCP.

**Body (JSON):**
```json
{
  "name": "nombre_del_tool",
  "arguments": {
    "param1": "valor1"
  }
}
```

## Pruebas

### Opción 1: Ejecutar script de pruebas
```powershell
.\test.ps1
```

### Opción 2: Usar PowerShell manualmente
```powershell
# Verificar salud
Invoke-WebRequest -Uri "http://localhost:3000/health"

# Obtener cronogramas
Invoke-WebRequest -Uri "http://localhost:3000/api/cronogramas"

# Obtener tareas (ID = 1)
Invoke-WebRequest -Uri "http://localhost:3000/api/tareas/1"
```

### Opción 3: Usar cURL
```bash
curl http://localhost:3000/health
curl http://localhost:3000/api/cronogramas
curl http://localhost:3000/api/tareas/1
```

### Opción 4: Usar Postman o Insomnia
Importa las rutas HTTP y prueba directamente desde la interfaz gráfica.

Ver `TEST_GUIDE.md` para más detalles.

## Notas

- El servidor utiliza un pool de conexiones para mejor rendimiento
- Las conexiones se liberan automáticamente después de cada query
- Los errores se manejan y devuelven mensajes descriptivos
- El transporte HTTP permite mejor escalabilidad y debugging
