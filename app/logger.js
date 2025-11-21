import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logsDir = path.join(__dirname, "..", "logs");

// Crear directorio de logs si no existe
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Flag para habilitar/deshabilitar logs de consola
let consoleLogsEnabled = process.env.CONSOLE_LOGS !== "false";

/**
 * Obtiene el nombre del archivo de log del día actual
 */
function getLogFileName() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `log-${year}-${month}-${day}.log`;
}

/**
 * Formatea un mensaje de log con timestamp
 */
function formatMessage(level, message, data = null) {
  const timestamp = new Date().toISOString();
  let formatted = `[${timestamp}] [${level}] ${message}`;

  if (data) {
    formatted += `\n${JSON.stringify(data, null, 2)}`;
  }

  return formatted;
}

/**
 * Escribe en el archivo de log
 */
function writeToFile(message) {
  const logFile = path.join(logsDir, getLogFileName());

  try {
    fs.appendFileSync(logFile, message + "\n");
  } catch (error) {
    console.error("Error escribiendo en archivo de log:", error);
  }
}

/**
 * Log de información
 */
export function logInfo(message, data = null) {
  const formatted = formatMessage("INFO", message, data);

  if (consoleLogsEnabled) {
    console.log(formatted);
  }

  writeToFile(formatted);
}

/**
 * Log de error
 */
export function logError(message, error = null) {
  const formatted = formatMessage("ERROR", message, error);

  if (consoleLogsEnabled) {
    console.error(formatted);
  }

  writeToFile(formatted);
}

/**
 * Log de herramienta llamada
 */
export function logToolCall(toolName, body, response) {
  const message = `TOOL CALL: ${toolName}`;
  const data = {
    request: body,
    response: response,
    timestamp: new Date().toISOString(),
  };

  const formatted = formatMessage("TOOL", message, data);

  if (consoleLogsEnabled) {
    console.log("\n" + "=".repeat(80));
    console.log(formatted);
    console.log("=".repeat(80) + "\n");
  }

  writeToFile("\n" + "=".repeat(80) + "\n" + formatted + "\n" + "=".repeat(80) + "\n");
}

/**
 * Habilitar/Deshabilitar logs de consola
 */
export function setConsoleLogsEnabled(enabled) {
  consoleLogsEnabled = enabled;
  logInfo(`Logs de consola ${enabled ? "HABILITADOS" : "DESHABILITADOS"}`);
}

/**
 * Obtener estado de logs de consola
 */
export function isConsoleLogsEnabled() {
  return consoleLogsEnabled;
}

/**
 * Obtener ruta del directorio de logs
 */
export function getLogsDirectory() {
  return logsDir;
}
