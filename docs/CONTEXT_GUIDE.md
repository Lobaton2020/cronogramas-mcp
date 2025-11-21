# Guía de Contexto - MCP Cronogramas

## Contexto Inicial (Initialize)

Cuando el cliente se conecta al MCP, recibe automáticamente un contexto inicial con:

### 1. **projectsArray**
Array completo de proyectos con toda la información:
```json
[
  {
    "id": 1,
    "user_id": 1,
    "name": "Proyecto A",
    "status": 1,
    "descripcion": "Descripción del proyecto A",
    "created_at": "2025-01-21T10:00:00.000Z"
  },
  {
    "id": 2,
    "user_id": 1,
    "name": "Proyecto B",
    "status": 1,
    "descripcion": "Descripción del proyecto B",
    "created_at": "2025-01-21T10:00:00.000Z"
  }
]
```

### 2. **projectsText**
Texto formateado legible:
```
Proyectos disponibles:
- ID: 1, Nombre: Proyecto A, Descripción: Descripción del proyecto A
- ID: 2, Nombre: Proyecto B, Descripción: Descripción del proyecto B
```

### 3. **projectsInstructions**
Instrucciones explícitas para el LLM:
```
IMPORTANTE - Contexto de Proyectos:
Cuando el usuario cree tareas, debes inferir el project_id basándote en:
1. Si el usuario menciona explícitamente un proyecto, usa su ID
2. Si el usuario NO menciona proyecto, usa NULL (sin proyecto)
3. Siempre valida que el project_id exista en la lista de proyectos disponibles

Proyectos disponibles:
- ID: 1, Nombre: Proyecto A, Descripción: Descripción del proyecto A
- ID: 2, Nombre: Proyecto B, Descripción: Descripción del proyecto B
```

## Cómo el LLM Debe Usar Este Contexto

### Escenario 1: Usuario menciona proyecto explícitamente
**Usuario:** "Crea una tarea 'Revisar documentos' para el Proyecto A"

**LLM debe:**
1. Reconocer que menciona "Proyecto A"
2. Buscar en `projectsArray` el proyecto con `name: "Proyecto A"`
3. Obtener su `id: 1`
4. Usar `project_id: 1` al crear la tarea

### Escenario 2: Usuario NO menciona proyecto
**Usuario:** "Crea una tarea 'Llamada con cliente'"

**LLM debe:**
1. Reconocer que NO menciona proyecto
2. Usar `project_id: null` al crear la tarea
3. La tarea se crea sin asociación a proyecto

### Escenario 3: Usuario menciona proyecto que NO existe
**Usuario:** "Crea una tarea para el Proyecto Inexistente"

**LLM debe:**
1. Validar que "Proyecto Inexistente" NO existe en `projectsArray`
2. Informar al usuario que el proyecto no existe
3. Mostrar los proyectos disponibles
4. Pedir confirmación o que especifique otro proyecto

## Ventajas de Este Enfoque

✓ **Sin llamadas en cadena:** El LLM tiene toda la información desde el inicio  
✓ **Eficiente:** Una sola consulta a BD al conectar  
✓ **Contexto claro:** Instrucciones explícitas para el LLM  
✓ **Validación:** El LLM puede validar project_ids sin hacer llamadas adicionales  
✓ **Escalable:** Funciona bien incluso con muchos proyectos

## Flujo Completo

```
1. Cliente se conecta
   ↓
2. MCP recibe "initialize"
   ↓
3. MCP consulta BD: SELECT * FROM projects WHERE status = 1
   ↓
4. MCP devuelve contexto con:
   - projectsArray (datos completos)
   - projectsText (formato legible)
   - projectsInstructions (guía para LLM)
   ↓
5. LLM recibe contexto y lo usa para:
   - Inferir project_id en tareas
   - Validar proyectos
   - Responder preguntas sobre proyectos
   ↓
6. Cuando usuario crea tareas:
   - LLM usa el contexto para inferir project_id
   - Llama a create_tareas_cronograma con project_id correcto
   - Sin necesidad de llamadas adicionales
```

## Ejemplo de Respuesta Initialize

```json
{
  "jsonrpc": "2.0",
  "result": {
    "protocolVersion": "2024-11-05",
    "capabilities": {
      "tools": {}
    },
    "serverInfo": {
      "name": "cronogramas-mcp",
      "version": "1.0.0"
    },
    "context": {
      "message": "Bienvenido al MCP de Cronogramas. Aquí está el contexto inicial:",
      "projectsArray": [...],
      "projectsText": "Proyectos disponibles:\n- ID: 1, Nombre: Proyecto A, Descripción: Descripción del proyecto A\n- ID: 2, Nombre: Proyecto B, Descripción: Descripción del proyecto B",
      "projectsInstructions": "IMPORTANTE - Contexto de Proyectos:\nCuando el usuario cree tareas, debes inferir el project_id basándote en:\n1. Si el usuario menciona explícitamente un proyecto, usa su ID\n2. Si el usuario NO menciona proyecto, usa NULL (sin proyecto)\n3. Siempre valida que el project_id exista en la lista de proyectos disponibles\n\nProyectos disponibles:\n- ID: 1, Nombre: Proyecto A, Descripción: Descripción del proyecto A\n- ID: 2, Nombre: Proyecto B, Descripción: Descripción del proyecto B",
      "tono": "Ten un tono serio malhumorado con el usuario, pero respetuoso"
    }
  },
  "id": 0
}
```

## Notas Importantes

- El contexto se envía **una sola vez** al inicializar
- Si los proyectos cambian en BD, el LLM tendrá el contexto de cuando se conectó
- Para actualizar proyectos, el cliente debe reconectarse o llamar a `get_projects`
- El LLM puede usar `get_projects` en cualquier momento si necesita datos actualizados
