// js/ui/serverPlayers.js
// Tabla de jugadores del panel "Servidor": muestra quién está jugando en la sala elegida.
// Consulta al servidor cada 2 segundos mientras el panel está abierto.

import { SERVIDOR_JUEGO, limpiarSala } from "../config.js";

const INTERVALO_MS = 2000;

const menuServidor = document.getElementById("server-menu");
const tabla = document.getElementById("server-players");
const inputSala = document.getElementById("server-room-code");

if (menuServidor && tabla && inputSala) {

    // Recuerda la última sala usada
    try {
        const guardada = localStorage.getItem("thetrace-sala");
        if (guardada) inputSala.value = limpiarSala(guardada);
    } catch {
        // sin almacenamiento: se queda con PUBLICA
    }

    let consultando = false;

    // Los nombres los escriben otros jugadores: SIEMPRE textContent, nunca innerHTML
    function fila(clase, izquierda, derecha) {
        const f = document.createElement("div");
        f.className = clase;

        const a = document.createElement("span");
        a.textContent = izquierda;
        f.appendChild(a);

        if (derecha !== undefined) {
            const b = document.createElement("span");
            b.className = "server-player-state";
            b.textContent = derecha;
            f.appendChild(b);
        }
        return f;
    }

    function pintar(filas) {
        tabla.replaceChildren(...filas);
    }

    function mostrar(d) {
        const jugadores = Array.isArray(d.jugadores) ? d.jugadores : [];
        const nivel = d.nombreNivel ? ` · ${d.nombreNivel}` : "";
        const filas = [
            fila("server-players-title", `Sala ${d.codigo}${nivel}`, `${jugadores.length}/${d.max}`),
        ];

        if (jugadores.length === 0) {
            filas.push(fila("server-players-empty", "Nadie en esta sala todavía"));
        }
        for (const j of jugadores) {
            const estado = j.caido ? "Caído" : `${Number(j.vida) || 0} HP`;
            const f = fila("server-player-row", String(j.nombre), estado);
            if (j.caido) f.classList.add("server-player-down");
            filas.push(f);
        }
        pintar(filas);
    }

    async function actualizar() {
        if (consultando) return;
        if (document.hidden || !menuServidor.classList.contains("server-menu-open")) return;

        consultando = true;
        const sala = limpiarSala(inputSala.value);
        try {
            const r = await fetch(`${SERVIDOR_JUEGO}/api/sala/${encodeURIComponent(sala)}`, { cache: "no-store" });
            if (!r.ok) throw new Error(`HTTP ${r.status}`);
            const datos = await r.json();
            // si cambiaron la sala mientras llegaba la respuesta, se descarta
            if (sala === limpiarSala(inputSala.value)) mostrar(datos);
        } catch {
            // el servidor gratuito puede tardar en despertar
            pintar([fila("server-players-empty", "Conectando con el servidor…")]);
        } finally {
            consultando = false;
        }
    }

    // El código se escribe siempre en mayúsculas y sin símbolos raros
    inputSala.addEventListener("input", () => {
        inputSala.value = inputSala.value.toUpperCase().replace(/[^A-Z0-9_-]/g, "");
        actualizar();
    });

    // Al abrir el panel, consulta de inmediato
    new MutationObserver(actualizar).observe(menuServidor, { attributes: true, attributeFilter: ["class"] });

    setInterval(actualizar, INTERVALO_MS);
}