import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import mysql from "mysql2/promise.js";
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { logInfo, logError, logToolCall, setConsoleLogsEnabled } from "./logger.js";
dotenv.config({ path: ".env" });

// Configuración de la conexión a MySQL
const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "cronogramas_db",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

// Crear pool de conexiones
const pool = mysql.createPool(dbConfig);

// Función para obtener todos los cronogramas
async function getCronogramas() {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query(
      "SELECT * FROM cronograma ORDER BY fecha DESC limit 15"
    );
    connection.release();
    return rows;
  } catch (error) {
    throw new Error(`Error al obtener cronogramas: ${error.message}`);
  }
}

// Función para obtener todos los proyectos
async function getProjects() {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query(
      "SELECT * FROM projects WHERE status = 1 ORDER BY created_at DESC"
    );
    connection.release();
    return rows;
  } catch (error) {
    throw new Error(`Error al obtener proyectos: ${error.message}`);
  }
}

// Función para obtener todas las tareas de un cronograma
async function getTareasCronograma(idCronograma) {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query(
      "SELECT * FROM tarea_cronograma WHERE id_cronograma_FK = ? ORDER BY `order` ASC",
      [idCronograma]
    );
    connection.release();
    return rows;
  } catch (error) {
    throw new Error(
      `Error al obtener tareas del cronograma: ${error.message}`
    );
  }
}

// Función para crear un nuevo cronograma
async function createCronograma(idUsuario = 1, fecha, titulo = null) {
  try {
    const connection = await pool.getConnection();
    
    // Si no se proporciona título, generarlo automáticamente basado en la fecha
    let finalTitulo = titulo;
    if (!finalTitulo) {
      const dateObj = new Date(fecha);
      const day = dateObj.getDate();
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                         'July', 'August', 'September', 'October', 'November', 'December'];
      const month = monthNames[dateObj.getMonth()];
      const year = dateObj.getFullYear();
      finalTitulo = `Activities ${day} ${month} ${year}`;
    }
    
    const [result] = await connection.query(
      "INSERT INTO cronograma (id_usuario_FK, titulo, fecha) VALUES (?, ?, ?)",
      [idUsuario, finalTitulo, fecha]
    );
    connection.release();
    
    return {
      id_cronograma_PK: result.insertId,
      id_usuario_FK: idUsuario,
      titulo: finalTitulo,
      fecha,
    };
  } catch (error) {
    throw new Error(`Error al crear cronograma: ${error.message}`);
  }
}

// Función para crear tareas en un cronograma
async function createTareasCronograma(idCronograma, tareas) {
  try {
    const connection = await pool.getConnection();
    const createdTareas = [];
    
    // Obtener el máximo orden actual
    const [maxOrderResult] = await connection.query(
      "SELECT MAX(`order`) as maxOrder FROM tarea_cronograma WHERE id_cronograma_FK = ?",
      [idCronograma]
    );
    let nextOrder = (maxOrderResult[0]?.maxOrder || 0) + 1;
    
    // Insertar cada tarea
    for (const tarea of tareas) {
      const { descripcion, hora = 0, minuto = 0, meridiano = "AM", project_id = null } = tarea;
      
      const [result] = await connection.query(
        "INSERT INTO tarea_cronograma (id_cronograma_FK, descripcion, hora, minuto, meridiano, estado, project_id, `order`) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [idCronograma, descripcion, hora, minuto, meridiano, 0, project_id ? project_id : null, nextOrder]
      );
      
      createdTareas.push({
        id_tarea_cronograma_PK: result.insertId,
        id_cronograma_FK: idCronograma,
        descripcion,
        hora,
        minuto,
        meridiano,
        estado: 0,
        project_id,
        order: nextOrder,
      });
      
      nextOrder++;
    }
    
    connection.release();
    return createdTareas;
  } catch (error) {
    throw new Error(`Error al crear tareas: ${error.message}`);
  }
}

// Crear servidor MCP
const server = new Server(
  {
    name: "cronogramas-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Manejador para listar tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  
  return {
    tools: [
      {
        name: "get_cronogramas",
        description: "Obtiene todos los cronogramas de la base de datos",
        inputSchema: {
          type: "object",
          properties: {},
          required: [],
        },
      },
      {
        name: "get_projects",
        description: "Obtiene todos los proyectos activos de la base de datos",
        inputSchema: {
          type: "object",
          properties: {},
          required: [],
        },
      },
      {
        name: "get_tareas_cronograma",
        description: "Obtiene todas las tareas de un cronograma específico",
        inputSchema: {
          type: "object",
          properties: {
            id_cronograma: {
              type: "number",
              description: "ID del cronograma",
            },
          },
          required: ["id_cronograma"],
        },
      },
    ],
  };
});

// Manejador para ejecutar tools
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    let result;

    switch (request.params.name) {
      case "get_cronogramas":
        result = await getCronogramas();
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };

      case "get_projects":
        result = await getProjects();
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };

      case "get_tareas_cronograma":
        const idCronograma = request.params.arguments.id_cronograma;
        if (!idCronograma) {
          throw new Error("El parámetro id_cronograma es requerido");
        }
        result = await getTareasCronograma(idCronograma);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };

      default:
        throw new Error(`Tool no encontrada: ${request.params.name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error.message}`,
          isError: true,
        },
      ],
    };
  }
});

// Iniciar servidor HTTP
async function main() {
  const app = express();
  const port = process.env.PORT || 3000;

  // Configurar flag de logs desde variable de entorno
  if (process.env.CONSOLE_LOGS === "false") {
    setConsoleLogsEnabled(false);
  }

  logInfo("=".repeat(80));
  logInfo("Iniciando MCP Server de Cronogramas");
  logInfo(`Puerto: ${port}`);
  logInfo(`BD Host: ${process.env.DB_HOST}`);
  logInfo(`BD Name: ${process.env.DB_NAME}`);
  logInfo("=".repeat(80));

  // Middleware para parsear JSON
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cors({
    origin: "*",
    methods: "*",
    allowedHeaders: "*",
  }));

  // Ruta de salud
  app.get("/health", (req, res) => {
    logInfo("Health check realizado");
    res.json({ status: "ok", message: "MCP Server is running" });
  });

  // Ruta para controlar logs
  app.post("/logs/toggle", (req, res) => {
    const { enabled } = req.body;
    if (typeof enabled === "boolean") {
      setConsoleLogsEnabled(enabled);
      res.json({
        status: "ok",
        message: `Logs de consola ${enabled ? "habilitados" : "deshabilitados"}`,
        consoleLogsEnabled: enabled,
      });
    } else {
      res.status(400).json({
        error: "El parámetro 'enabled' debe ser un booleano",
      });
    }
  });

  // Ruta para obtener estado de logs
  app.get("/logs/status", (req, res) => {
    res.json({
      consoleLogsEnabled: process.env.CONSOLE_LOGS !== "false",
      logsDirectory: "./logs",
    });
  });

  // Ruta de prueba para verificar tools disponibles
  app.get("/tools", async (req, res) => {
    try {
      const projects = await getProjects();
      const projectsContext = projects.length > 0 
        ? `Proyectos disponibles:\n${projects.map(p => `- ID: ${p.id}, Nombre: ${p.name}, Descripción: ${p.descripcion || 'N/A'}`).join('\n')}`
        : "No hay proyectos disponibles en la base de datos.";

      res.json({
        tools: [
          {
            name: "get_cronogramas",
            description: "Obtiene todos los cronogramas de la base de datos",
            inputSchema: {
              type: "object",
              properties: {},
              required: [],
              additionalProperties: false,
            },
          },
          {
            name: "get_projects",
            description: "Obtiene todos los proyectos activos de la base de datos",
            inputSchema: {
              type: "object",
              properties: {},
              required: [],
              additionalProperties: false,
            },
          },
          {
            name: "get_tareas_cronograma",
            description: "Obtiene todas las tareas de un cronograma específico",
            inputSchema: {
              type: "object",
              properties: {
                id_cronograma: {
                  type: "integer",
                  description: "ID del cronograma",
                },
              },
              required: ["id_cronograma"],
              additionalProperties: false,
            },
          },
          {
            name: "create_cronograma",
            description: "Crea un nuevo cronograma. El título puede ser explícito o se genera automáticamente con la fecha en formato 'Activities DD Month YYYY'",
            inputSchema: {
              type: "object",
              properties: {
                id_usuario: {
                  type: "integer",
                  description: "ID del usuario propietario del cronograma (opcional, por defecto 1)",
                },
                fecha: {
                  type: "string",
                  description: "Fecha del cronograma en formato ISO (YYYY-MM-DD HH:mm:ss)",
                },
                titulo: {
                  type: "string",
                  description: "Título del cronograma (opcional). Si no se proporciona, se genera automáticamente",
                },
              },
              required: ["fecha"],
              additionalProperties: false,
            },
          },
          {
            name: "create_tareas_cronograma",
            description: "Crea una o varias tareas en un cronograma. El orden se asigna automáticamente, La hora debe ser militar (0-23), y el meridiano esta deprecado",
            inputSchema: {
              type: "object",
              properties: {
                id_cronograma: {
                  type: "integer",
                  description: "ID del cronograma donde crear las tareas",
                },
                tareas: {
                  type: "array",
                  description: "Array de tareas a crear",
                  items: {
                    type: "object",
                    properties: {
                      descripcion: {
                        type: "string",
                        description: "Descripción de la tarea",
                      },
                      hora: {
                        type: "integer",
                        description: "Hora militar (0-23), por defecto 0",
                      },
                      minuto: {
                        type: "integer",
                        description: "Minuto (0-59), por defecto 0",
                      },
                      meridiano: {
                        type: "string",
                        description: "AM o PM, por defecto AM (Deprecado)",
                      },
                      project_id: {
                        type: "integer",
                        description: "ID del proyecto (opcional, por defecto NULL)",
                      },
                    },
                    required: ["descripcion"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["id_cronograma", "tareas"],
              additionalProperties: false,
            },
          },
        ],
        projectsContext: projectsContext,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Endpoint MCP Streamable HTTP
  app.post("/call", async (req, res) => {
    try {
      const body = req.body;

      // Validar que sea una solicitud MCP válida
      if (!body.jsonrpc || !body.method) {
        return res.status(400).json({
          jsonrpc: "2.0",
          error: { code: -32600, message: "Invalid Request" },
          id: body.id || null,
        });
      }

      let result;

      // Procesar según el método
      switch (body.method) {
        case "ping":
          result = {};
          break;

        case "initialize":
          // Obtener proyectos para el contexto inicial
          let projects = [];
          try {
            projects = await getProjects();
          } catch (error) {
            logError("Error obteniendo proyectos para contexto inicial", error);
          }

          // Generar contexto con los proyectos disponibles
          const projectsContext = projects.length > 0 
            ? `Proyectos disponibles:\n${projects.map(p => `- ID: ${p.id}, Nombre: ${p.name}, Descripción: ${p.descripcion || 'N/A'}`).join('\n')}`
            : "No hay proyectos disponibles en la base de datos.";

          // Generar instrucciones para el LLM sobre cómo usar los proyectos
          const projectsInstructions = `IMPORTANTE - Contexto de Proyectos:
            Cuando el usuario cree tareas, debes inferir el project_id basándote en:
            1. Si el usuario menciona explícitamente un proyecto, usa su ID
            2. Si el usuario NO menciona proyecto, usa NULL (sin proyecto)
            3. Siempre valida que el project_id exista en la lista de proyectos disponibles

${projectsContext}`;

          result = {
            protocolVersion: "2024-11-05",
            capabilities: {
              tools: {},
            },
            serverInfo: {
              name: "cronogramas-mcp",
              version: "1.0.0",
            },
            context: {
              message: "Bienvenido al MCP de Cronogramas. Aquí está el contexto inicial:",
              projectsArray: projects,
              projectsText: projectsContext,
              projectsInstructions: projectsInstructions,
              tono: "Ten un tono serio malhumorado con el usuario, pero respetuoso"
            },
          };
          logInfo("Inicializando MCP Server de Cronogramas loading context", result);
          break;

        case "notifications/initialized":
          // Las notificaciones no requieren respuesta
          res.json({
            jsonrpc: "2.0",
            result: null,
            id: body.id,
          });
          return;

        case "tools/list":
          result = {
            tools: [
              {
                name: "get_cronogramas",
                description: "Obtiene todos los cronogramas de la base de datos",
                inputSchema: {
                  type: "object",
                  properties: {},
                  required: [],
                  additionalProperties: false,
                },
              },
              {
                name: "get_projects",
                description: "Obtiene todos los proyectos activos de la base de datos",
                inputSchema: {
                  type: "object",
                  properties: {},
                  required: [],
                  additionalProperties: false,
                },
              },
              {
                name: "get_tareas_cronograma",
                description: "Obtiene todas las tareas de un cronograma específico",
                inputSchema: {
                  type: "object",
                  properties: {
                    id_cronograma: {
                      type: "integer",
                      description: "ID del cronograma",
                    },
                  },
                  required: ["id_cronograma"],
                  additionalProperties: false,
                },
              },
              {
                name: "create_cronograma",
                description: "Crea un nuevo cronograma. El título puede ser explícito o se genera automáticamente con la fecha en formato 'Activities DD Month YYYY'",
                inputSchema: {
                  type: "object",
                  properties: {
                    id_usuario: {
                      type: "integer",
                      description: "ID del usuario propietario del cronograma (opcional, por defecto 1)",
                    },
                    fecha: {
                      type: "string",
                      description: "Fecha del cronograma en formato ISO (YYYY-MM-DD HH:mm:ss)",
                    },
                    titulo: {
                      type: "string",
                      description: "Título del cronograma (opcional). Si no se proporciona, se genera automáticamente",
                    },
                  },
                  required: ["fecha"],
                  additionalProperties: false,
                },
              },
              {
                name: "create_tareas_cronograma",
                description: "Crea una o varias tareas en un cronograma. El orden se asigna automáticamente, La hora debe ser militar (0-23), y el meridiano esta deprecado",
                inputSchema: {
                  type: "object",
                  properties: {
                    id_cronograma: {
                      type: "integer",
                      description: "ID del cronograma donde crear las tareas",
                    },
                    tareas: {
                      type: "array",
                      description: "Array de tareas a crear",
                      items: {
                        type: "object",
                        properties: {
                          descripcion: {
                            type: "string",
                            description: "Descripción de la tarea",
                          },
                          hora: {
                            type: "integer",
                            description: "Hora militar (0-23), por defecto 0",
                          },
                          minuto: {
                            type: "integer",
                            description: "Minuto (0-59), por defecto 0",
                          },
                          meridiano: {
                            type: "string",
                            description: "AM o PM, por defecto AM (Deprecado)",
                          },
                          project_id: {
                            type: "integer",
                            description: "ID del proyecto (opcional, por defecto NULL)",
                          },
                        },
                        required: ["descripcion"],
                        additionalProperties: false,
                      },
                    },
                  },
                  required: ["id_cronograma", "tareas"],
                  additionalProperties: false,
                },
              },
            ],
          };
          break;

        case "tools/call":
          const toolName = body.params?.name;
          const toolArgs = body.params?.arguments || {};

          let toolResult;
          try {
            if (toolName === "get_cronogramas") {
              toolResult = await getCronogramas();
            } else if (toolName === "get_projects") {
              toolResult = await getProjects();
            } else if (toolName === "get_tareas_cronograma") {
              toolResult = await getTareasCronograma(toolArgs.id_cronograma);
            } else if (toolName === "create_cronograma") {
              const { id_usuario = 1, fecha, titulo = null } = toolArgs;
              if (!fecha) {
                throw new Error("Parámetro requerido: fecha");
              }
              toolResult = await createCronograma(id_usuario, fecha, titulo);
            } else if (toolName === "create_tareas_cronograma") {
              const { id_cronograma, tareas } = toolArgs;
              if (!id_cronograma || !tareas || !Array.isArray(tareas)) {
                throw new Error("Parámetros requeridos: id_cronograma (número), tareas (array)");
              }
              toolResult = await createTareasCronograma(id_cronograma, tareas);
            } else {
              throw new Error(`Tool no encontrada: ${toolName}`);
            }

            // Registrar la llamada a la herramienta
            const response = {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(toolResult, null, 2),
                },
              ],
            };

            logToolCall(toolName, {
              method: body.method,
              params: body.params,
              id: body.id,
            }, response);

            result = response;
          } catch (toolError) {
            logError(`Error ejecutando tool ${toolName}`, toolError);
            throw toolError;
          }
          break;

        default:
          return res.status(400).json({
            jsonrpc: "2.0",
            error: { code: -32601, message: `Method not found: ${body.method}` },
            id: body.id,
          });
      }

      // Enviar respuesta MCP
      res.json({
        jsonrpc: "2.0",
        result,
        id: body.id,
      });
    } catch (error) {
      console.error("Error en /call:", error);
      res.status(500).json({
        jsonrpc: "2.0",
        error: { code: -32603, message: error.message },
        id: req.body.id || null,
      });
    }
  });

  // Rutas específicas para cada tool (para pruebas directas)
  app.get("/api/cronogramas", async (req, res) => {
    try {
      const result = await getCronogramas();
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/projects", async (req, res) => {
    try {
      const result = await getProjects();
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/cronogramas/:id_cronograma/tareas", async (req, res) => {
    try {
      const { id_cronograma } = req.params;
      const result = await getTareasCronograma(id_cronograma);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Iniciar servidor HTTP
  app.listen(port, () => {
    logInfo(`MCP Server HTTP escuchando en http://localhost:${port}`);
    logInfo(`\nEndpoints disponibles:`);
    logInfo(`  GET  http://localhost:${port}/health`);
    logInfo(`  GET  http://localhost:${port}/api/cronogramas`);
    logInfo(`  GET  http://localhost:${port}/api/projects`);
    logInfo(`  GET  http://localhost:${port}/api/cronogramas/:id_cronograma/tareas`);
    logInfo(`  POST http://localhost:${port}/call (MCP Protocol - Streamable HTTP)`);
    logInfo(`  POST http://localhost:${port}/logs/toggle (Control de logs)`);
    logInfo(`  GET  http://localhost:${port}/logs/status (Estado de logs)`);
    logInfo(`\nPara desabilitar logs de consola, usa: CONSOLE_LOGS=false npm start`);
  });
}

main().catch((error) => {
  console.error("Error al iniciar servidor:", error);
  process.exit(1);
});
