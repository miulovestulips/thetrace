// js/config.js
// Dónde está el servidor del juego (Node). Lo usan el menú y la tabla de jugadores.

// Si el menú está en OTRO hosting (por ejemplo uno con PHP) y el juego en Render,
// pon aquí la URL de Render sin "/" al final: "https://thetrace.onrender.com"
// Si el menú y el juego los sirve el mismo servidor Node, déjalo vacío.
const URL_EXTERNA = "";

const esLocal = /^(localhost|127\.|192\.168\.|10\.)/.test(location.hostname);

// En tu PC (XAMPP, Live Server...) el servidor Node está en el puerto 3000
export const SERVIDOR_JUEGO =
    URL_EXTERNA || (esLocal && location.port !== "3000" ? `http://${location.hostname}:3000` : "");

// Deja el código de sala solo con letras, números, guion y guion bajo (máx. 12)
export function limpiarSala(valor) {
    return String(valor || "").toUpperCase().replace(/[^A-Z0-9_-]/g, "").slice(0, 12) || "PUBLICA";
}