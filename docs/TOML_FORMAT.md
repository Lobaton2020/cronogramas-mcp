# Formato TOML en Respuestas

## ¿Por qué TOML?

TOML (Tom's Obvious, Minimal Language) es más eficiente y legible que JSON para ciertos casos:

- **Más compacto:** Menos caracteres, menos ancho de banda
- **Más legible:** Sintaxis más clara para humanos
- **Más rápido:** Parsing más eficiente
- **Mejor para configuración:** Diseñado para datos estructurados

## Ejemplos de Conversión

### JSON vs TOML

**JSON:**
```json
{
  "id_cronograma_PK": 5,
  "id_usuario_FK": 1,
  "titulo": "Activities 21 November 2025",
  "fecha": "2025-11-21 00:00:00"
}
```

**TOML (más compacto):**
```toml
id_cronograma_PK = 5
id_usuario_FK = 1
titulo = "Activities 21 November 2025"
fecha = "2025-11-21 00:00:00"
```

### Arrays en TOML

**JSON:**
```json
{
  "tareas": [
    {
      "id": 1,
      "descripcion": "Tarea 1",
      "hora": 10
    },
    {
      "id": 2,
      "descripcion": "Tarea 2",
      "hora": 14
    }
  ]
}
```

**TOML:**
```toml
[[tareas]]
id = 1
descripcion = "Tarea 1"
hora = 10

[[tareas]]
id = 2
descripcion = "Tarea 2"
hora = 14
```

## Respuestas del MCP

Todas las respuestas de `tools/call` ahora devuelven TOML en lugar de JSON:

### Ejemplo: create_cronograma

**Solicitud:**
```json
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "create_cronograma",
    "arguments": {
      "fecha": "2025-11-21 00:00:00",
      "titulo": "Actividades 21 Noviembre 2025"
    }
  },
  "id": 1
}
```

**Respuesta (TOML):**
```toml
id_cronograma_PK = 5
id_usuario_FK = 1
titulo = "Actividades 21 Noviembre 2025"
fecha = "2025-11-21 00:00:00"
```

### Ejemplo: create_tareas_cronograma

**Solicitud:**
```json
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "create_tareas_cronograma",
    "arguments": {
      "id_cronograma": 5,
      "tareas": [
        {
          "descripcion": "Reunión con equipo",
          "hora": 10,
          "minuto": 30
        }
      ]
    }
  },
  "id": 2
}
```

**Respuesta (TOML):**
```toml
[[]]
id_tarea_cronograma_PK = 10
id_cronograma_FK = 5
descripcion = "Reunión con equipo"
hora = 10
minuto = 30
meridiano = "AM"
estado = 0
project_id = null
order = 1
```

## Ventajas para ChatGPT

✓ **Parsing más rápido:** ChatGPT procesa TOML más eficientemente  
✓ **Menos tokens:** Respuestas más compactas = menos consumo de tokens  
✓ **Más legible:** El LLM entiende mejor la estructura  
✓ **Mejor contexto:** Información más clara para el modelo

## Fallback a JSON

Si hay error al convertir a TOML, el sistema automáticamente devuelve JSON como fallback:

```javascript
function jsonToToml(data) {
  try {
    return TOML.stringify(data);
  } catch (error) {
    logError("Error convirtiendo a TOML", error);
    return JSON.stringify(data, null, 2); // Fallback a JSON
  }
}
```

## Especificación TOML

Para más información sobre TOML, visita: https://toml.io/

## Notas

- Las fechas se representan como strings en TOML
- Los valores null se representan como `null`
- Los arrays de objetos usan `[[nombre]]`
- Las strings se envuelven en comillas dobles
