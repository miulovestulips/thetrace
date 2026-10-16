// js/game/multiplayer.js
// Cliente cooperativo: dibuja a los demás jugadores, los objetos del nivel, el enemigo y el HUD.
// El servidor decide TODO (items, vida, enemigo, cambio de nivel); aquí solo se muestra y se mandan acciones.

import * as THREE from "three";
import { io } from "https://cdn.socket.io/4.7.5/socket.io.esm.min.js";
import { isGamePaused } from "./gameState.js";

const INTERVALO_ENVIO = 1000 / 15; // 15 envíos por segundo
const SUAVIZADO = 10;
const ALTURA_OJOS = 2; // tu cámara está a y = 2 sobre el piso
const DIST_INTERACCION = 2.5; // igual que en el servidor

// Solo si el juego se sirve desde OTRO hosting (por ejemplo tu hosting PHP).
// Si el mismo servidor Node entrega juego.html, déjalo vacío: "".
const SERVIDOR_EXTERNO = "";

let socket = null;
let scene = null;
let camera = null;
let cargarNivelFn = null;

let info = null; // datos del nivel actual
let estadoItems = { recogidos: [], mapaArmado: false, salidaAbierta: false, objetivo: "" };
let listo = false; // el nivel ya está cargado en este cliente
const yo = { hp: 100, armado: false, caido: false };
let cola = Promise.resolve(); // procesa "nivel" e "items" en orden
let ultimoEnvio = 0;
const reloj = new THREE.Clock();

const remotos = new Map(); // id -> { grupo, posObjetivo, rotObjetivo }
const itemsMeshes = new Map(); // id -> mesh
const decorado = { pared: null, salida: null, sendero: null };
let enemigo = null;
const trazos = [];
const hud = {};

// ======================= utilidades =======================

function el(tag, css, padre) {
    const e = document.createElement(tag);
    e.style.cssText = css;
    if (padre) padre.appendChild(e);
    return e;
}

function liberar(obj) {
    scene.remove(obj);
    obj.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) {
            if (o.material.map) o.material.map.dispose();
            o.material.dispose();
        }
    });
}

function colorDesdeNombre(texto) {
    let h = 0;
    for (let i = 0; i < texto.length; i++) h = (h * 31 + texto.charCodeAt(i)) % 360;
    return new THREE.Color().setHSL(h / 360, 0.6, 0.55);
}

// ======================= HUD =======================

function crearHUD() {
    const base =
        "position:fixed;pointer-events:none;font-family:sans-serif;color:#fff;text-shadow:0 1px 4px #000;z-index:20;";

    hud.objetivo = el(
        "div",
        base +
            "top:14px;left:50%;transform:translateX(-50%);font-size:18px;background:rgba(0,0,0,.45);padding:6px 16px;border-radius:8px;text-align:center;max-width:70vw;",
        document.body
    );

    // Barra del enemigo / jefe
    hud.enemigoCaja = el(
        "div",
        base + "top:62px;left:50%;transform:translateX(-50%);width:360px;text-align:center;display:none;",
        document.body
    );
    hud.enemigoNombre = el("div", "font-size:15px;margin-bottom:3px;", hud.enemigoCaja);
    const fondoE = el("div", "background:rgba(0,0,0,.6);height:12px;border-radius:6px;overflow:hidden;", hud.enemigoCaja);
    hud.enemigoBarra = el("div", "background:#c0261c;height:100%;width:100%;", fondoE);

    // Vida propia
    hud.vidaCaja = el("div", base + "bottom:24px;left:24px;width:220px;", document.body);
    hud.vidaTexto = el("div", "font-size:14px;margin-bottom:3px;", hud.vidaCaja);
    const fondoV = el("div", "background:rgba(0,0,0,.6);height:14px;border-radius:7px;overflow:hidden;", hud.vidaCaja);
    hud.vidaBarra = el("div", "background:#3fbf4f;height:100%;width:100%;", fondoV);

    // Aviso de interacción
    hud.prompt = el(
        "div",
        base + "bottom:18%;left:50%;transform:translateX(-50%);font-size:20px;background:rgba(0,0,0,.5);padding:6px 14px;border-radius:8px;display:none;",
        document.body
    );

    // Mensajes
    hud.toasts = el("div", base + "top:14px;right:14px;max-width:320px;", document.body);

    // Pantalla completa (cargando / game over / victoria)
    hud.overlay = el(
        "div",
        base +
            "inset:0;background:rgba(0,0,0,.75);display:none;align-items:center;justify-content:center;font-size:32px;text-align:center;padding:24px;",
        document.body
    );
}

function mostrarOverlay(texto) {
    hud.overlay.textContent = texto;
    hud.overlay.style.display = "flex";
}
function ocultarOverlay() {
    hud.overlay.style.display = "none";
}

function mostrarMensaje(texto) {
    const d = el(
        "div",
        "background:rgba(0,0,0,.55);padding:6px 12px;margin-bottom:6px;border-radius:6px;font-size:14px;",
        hud.toasts
    );
    d.textContent = texto;
    setTimeout(() => d.remove(), 5000);
}

function actualizarHUD() {
    hud.vidaBarra.style.width = `${Math.max(0, yo.hp)}%`;
    hud.vidaBarra.style.background = yo.hp > 50 ? "#3fbf4f" : yo.hp > 25 ? "#d9a21b" : "#c0261c";
    hud.vidaTexto.textContent = `Vida ${yo.hp}${yo.armado ? "  ·  ⚔ Armado (clic para atacar)" : ""}`;

    if (enemigo && info && info.enemigo.hpMax !== null && enemigo.activo) {
        hud.enemigoCaja.style.display = "block";
        hud.enemigoNombre.textContent = info.enemigo.nombre;
        hud.enemigoBarra.style.width = `${Math.max(0, (enemigo.hp / info.enemigo.hpMax) * 100)}%`;
    } else {
        hud.enemigoCaja.style.display = "none";
    }
}

function calcularPrompt() {
    if (yo.caido) return "Has caído. Observa a tu equipo…";
    const px = camera.position.x;
    const pz = camera.position.z;

    for (const it of info.items) {
        if (estadoItems.recogidos.includes(it.id)) continue;
        if (Math.hypot(it.x - px, it.z - pz) <= DIST_INTERACCION) {
            return it.tipo === "mapa" ? "[E] Recoger parte del mapa" : "[E] Recoger arma";
        }
    }
    if (info.pared && !estadoItems.mapaArmado) {
        const todas = info.items.filter((i) => i.tipo === "mapa").every((i) => estadoItems.recogidos.includes(i.id));
        if (todas && Math.hypot(info.pared.x - px, info.pared.z - pz) <= info.pared.r) {
            return "[E] Colocar el mapa en la pared";
        }
    }
    return "";
}

// ======================= modelos (procedurales) =======================
// Reemplaza estas funciones por tus FBX/GLB cuando tengas los modelos finales.

function texturaMapa(completo) {
    const c = document.createElement("canvas");
    c.width = 512;
    c.height = 360;
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#d8c69a";
    ctx.fillRect(0, 0, 512, 360);
    ctx.strokeStyle = "#5a3d1a";
    ctx.lineWidth = 10;
    ctx.strokeRect(5, 5, 502, 350);

    if (completo) {
        ctx.strokeStyle = "#a02020";
        ctx.lineWidth = 6;
        ctx.setLineDash([16, 10]);
        ctx.beginPath();
        ctx.moveTo(70, 290);
        ctx.lineTo(180, 220);
        ctx.lineTo(260, 250);
        ctx.lineTo(340, 140);
        ctx.lineTo(430, 80);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.moveTo(414, 64);
        ctx.lineTo(446, 96);
        ctx.moveTo(446, 64);
        ctx.lineTo(414, 96);
        ctx.stroke();
    } else {
        ctx.strokeStyle = "#5a3d1a";
        ctx.lineWidth = 4;
        ctx.setLineDash([10, 8]);
        ctx.strokeRect(40, 40, 200, 140);
        ctx.strokeRect(270, 40, 200, 140);
        ctx.strokeRect(40, 200, 200, 120);
        ctx.strokeRect(270, 200, 200, 120);
        ctx.setLineDash([]);
        ctx.fillStyle = "#5a3d1a";
        ctx.font = "bold 64px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("?", 256, 205);
    }
    return new THREE.CanvasTexture(c);
}

function crearItemMapa() {
    const g = new THREE.Group();
    g.add(
        new THREE.Mesh(
            new THREE.BoxGeometry(0.7, 0.5, 0.04),
            new THREE.MeshStandardMaterial({ color: 0xe8d9a8, emissive: 0xaa8833, emissiveIntensity: 0.9 })
        )
    );
    g.add(
        new THREE.Mesh(
            new THREE.SphereGeometry(0.6, 12, 12),
            new THREE.MeshBasicMaterial({ color: 0xffcc66, transparent: true, opacity: 0.18, depthWrite: false, fog: false })
        )
    );
    return g;
}

function crearItemArma() {
    const g = new THREE.Group();
    const inner = new THREE.Group();
    inner.rotation.z = Math.PI / 4;
    const metal = new THREE.MeshStandardMaterial({ color: 0xc8d8ff, emissive: 0x4466ff, emissiveIntensity: 0.9 });
    const madera = new THREE.MeshStandardMaterial({ color: 0x5a3d1a });
    inner.add(new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.0, 0.03), metal));
    const guarda = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.08, 0.08), madera);
    guarda.position.y = -0.5;
    inner.add(guarda);
    const mango = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.3, 0.1), madera);
    mango.position.y = -0.7;
    inner.add(mango);
    g.add(inner);
    g.add(
        new THREE.Mesh(
            new THREE.SphereGeometry(0.7, 12, 12),
            new THREE.MeshBasicMaterial({ color: 0x66aaff, transparent: true, opacity: 0.15, depthWrite: false, fog: false })
        )
    );
    return g;
}

function crearEnemigoMesh(cfg) {
    const g = new THREE.Group();
    const jefe = cfg.tipo === "jefe";
    const mat = new THREE.MeshStandardMaterial({
        color: jefe ? 0x3a0f0f : 0x15151c,
        roughness: 0.9,
        emissive: jefe ? 0x330000 : 0x110011,
    });
    const cuerpo = new THREE.Mesh(new THREE.CapsuleGeometry(0.5, 1.3, 4, 10), mat);
    cuerpo.position.y = 1.2;
    g.add(cuerpo);
    const cabeza = new THREE.Mesh(new THREE.SphereGeometry(0.38, 12, 12), mat);
    cabeza.position.y = 2.35;
    g.add(cabeza);

    const ojoMat = new THREE.MeshBasicMaterial({ color: 0xff2200, fog: false });
    for (const s of [-1, 1]) {
        const ojo = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8), ojoMat);
        ojo.position.set(0.15 * s, 2.4, -0.32);
        g.add(ojo);

        const brazo = new THREE.Mesh(new THREE.BoxGeometry(0.22, 1.3, 0.22), mat);
        brazo.position.set(0.75 * s, 1.5, -0.2);
        brazo.rotation.x = 0.9;
        g.add(brazo);

        if (jefe) {
            const cuerno = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.5, 8), new THREE.MeshStandardMaterial({ color: 0xddd5c0 }));
            cuerno.position.set(0.25 * s, 2.8, 0);
            cuerno.rotation.z = -0.4 * s;
            g.add(cuerno);
        }
    }
    g.scale.setScalar(cfg.escala || 1);
    return g;
}

// Avatar de otro jugador
function crearEtiqueta(texto) {
    const c = document.createElement("canvas");
    c.width = 256;
    c.height = 64;
    const ctx = c.getContext("2d");
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(0, 0, 256, 64);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 32px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(texto, 128, 34);

    const sprite = new THREE.Sprite(
        new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthTest: false, fog: false })
    );
    sprite.scale.set(2, 0.5, 1);
    sprite.position.y = 2.6;
    sprite.renderOrder = 10;
    return sprite;
}

function crearAvatar(nombre) {
    const g = new THREE.Group();
    const cuerpo = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.4, 1.0, 4, 8),
        new THREE.MeshStandardMaterial({ color: colorDesdeNombre(nombre), roughness: 0.8 })
    );
    cuerpo.position.y = 0.9;
    g.add(cuerpo);
    const cabeza = new THREE.Mesh(
        new THREE.SphereGeometry(0.28, 12, 12),
        new THREE.MeshStandardMaterial({ color: 0xffe0c0, roughness: 0.8 })
    );
    cabeza.position.y = 1.75;
    g.add(cabeza);
    const nariz = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.25), new THREE.MeshStandardMaterial({ color: 0x222222 }));
    nariz.position.set(0, 1.75, -0.3); // la cámara mira hacia -Z
    g.add(nariz);
    g.add(crearEtiqueta(nombre));
    return g;
}

function agregarRemoto(p) {
    const grupo = crearAvatar(p.name);
    grupo.position.set(p.x, p.y - ALTURA_OJOS, p.z);
    grupo.rotation.y = p.rotY;
    scene.add(grupo);
    remotos.set(p.id, {
        grupo,
        posObjetivo: new THREE.Vector3(p.x, p.y - ALTURA_OJOS, p.z),
        rotObjetivo: p.rotY,
    });
}

function quitarRemoto(id) {
    const r = remotos.get(id);
    if (!r) return;
    liberar(r.grupo);
    remotos.delete(id);
}

// ======================= nivel =======================

function limpiarNivel() {
    listo = false;
    for (const id of [...remotos.keys()]) quitarRemoto(id);
    for (const m of itemsMeshes.values()) liberar(m);
    itemsMeshes.clear();
    for (const k of Object.keys(decorado)) {
        if (decorado[k]) liberar(decorado[k]);
        decorado[k] = null;
    }
    if (enemigo) {
        liberar(enemigo.grupo);
        enemigo = null;
    }
    for (const t of trazos) liberar(t.obj);
    trazos.length = 0;
}

function construirNivel() {
    for (const it of info.items) {
        const m = it.tipo === "mapa" ? crearItemMapa() : crearItemArma();
        m.position.set(it.x, it.y, it.z);
        m.userData.baseY = it.y;
        scene.add(m);
        itemsMeshes.set(it.id, m);
    }

    // Pared donde se coloca el mapa (nivel 1) + sendero hacia la salida
    if (info.pared && info.salida) {
        const p = info.pared;
        const marco = new THREE.Mesh(
            new THREE.PlaneGeometry(2.4, 1.7),
            new THREE.MeshBasicMaterial({ map: texturaMapa(false), side: THREE.DoubleSide, fog: false })
        );
        marco.position.set(p.x, p.y, p.z);
        marco.rotation.y = p.rotY || 0;
        marco.userData.armado = false;
        scene.add(marco);
        decorado.pared = marco;

        const s = info.salida;
        const sendero = new THREE.Group();
        const dx = s.x - p.x;
        const dz = s.z - p.z;
        const n = Math.max(2, Math.floor(Math.hypot(dx, dz) / 1.5));
        const puntoMat = new THREE.MeshBasicMaterial({ color: 0xffcc44, fog: false });
        for (let i = 1; i < n; i++) {
            const punto = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), puntoMat);
            punto.position.set(p.x + (dx * i) / n, 0.15, p.z + (dz * i) / n);
            sendero.add(punto);
        }
        sendero.visible = false;
        scene.add(sendero);
        decorado.sendero = sendero;
    }

    // Zona de salida
    if (info.salida) {
        const s = info.salida;
        const anillo = new THREE.Mesh(
            new THREE.CylinderGeometry(s.r, s.r, 4, 32, 1, true),
            new THREE.MeshBasicMaterial({ color: 0xff3333, transparent: true, opacity: 0.18, side: THREE.DoubleSide, depthWrite: false, fog: false })
        );
        anillo.position.set(s.x, s.y + 1.5, s.z);
        scene.add(anillo);
        decorado.salida = anillo;
    }

    // Enemigo (invisible hasta que el servidor lo active)
    const g = crearEnemigoMesh(info.enemigo);
    g.visible = false;
    scene.add(g);
    enemigo = {
        grupo: g,
        posObjetivo: new THREE.Vector3(),
        rotObjetivo: 0,
        activo: false,
        hp: info.enemigo.hpMax,
        primera: true,
    };

    refrescarItems();
}

function refrescarItems() {
    for (const [id, m] of itemsMeshes) m.visible = !estadoItems.recogidos.includes(id);

    if (decorado.pared && decorado.pared.userData.armado !== estadoItems.mapaArmado) {
        const mat = decorado.pared.material;
        mat.map.dispose();
        mat.map = texturaMapa(estadoItems.mapaArmado);
        mat.needsUpdate = true;
        decorado.pared.userData.armado = estadoItems.mapaArmado;
    }
    if (decorado.sendero) decorado.sendero.visible = estadoItems.mapaArmado;
    if (decorado.salida) {
        decorado.salida.material.color.setHex(estadoItems.salidaAbierta ? 0x33ff66 : 0xff3333);
        decorado.salida.material.opacity = estadoItems.salidaAbierta ? 0.35 : 0.15;
    }
    hud.objetivo.textContent = estadoItems.objetivo || "";
}

async function procesarNivel(i) {
    limpiarNivel();
    info = i;
    estadoItems = i.estadoItems;
    yo.hp = 100;
    yo.caido = false;
    yo.armado = i.n === 3;

    mostrarOverlay(`Cargando: ${i.nombre}…`);
    await cargarNivelFn(i.n);

    camera.position.set(i.spawn.x, i.spawn.y, i.spawn.z);
    camera.rotation.set(0, 0, 0);

    construirNivel();
    listo = true;
    ocultarOverlay();
    mostrarMensaje(`Nivel ${i.n}: ${i.nombre}`);
    socket.emit("nivel-listo", { n: i.n });
}

// ======================= API pública =======================

export function jugadorCaido() {
    return yo.caido;
}

export function initMultiplayer({ scene: s, camera: c, cargarNivel }) {
    scene = s;
    camera = c;
    cargarNivelFn = cargarNivel;

    const params = new URLSearchParams(window.location.search);
    const nombre = localStorage.getItem("thetrace-nombre") || `Jugador${Math.floor(Math.random() * 1000)}`;
    const codigo = params.get("sala") || localStorage.getItem("thetrace-sala") || "PUBLICA";
    const nivelInicial = Number(params.get("nivel")) || 1; // ?nivel=2 sirve para probar un escenario

    crearHUD();
    mostrarOverlay("Conectando al servidor…");

    // Producción: mismo origen que sirvió la página (undefined).
    // Desarrollo con Live Server u otro puerto: apunta al 3000.
    const esDev = location.protocol === "http:" && location.port && location.port !== "3000";
    socket = io(SERVIDOR_EXTERNO || (esDev ? `http://${location.hostname}:3000` : undefined));

    socket.on("connect", () => {
        console.log("🟢 Conectado al servidor:", socket.id);
        socket.emit("join", { name: nombre, codigo, nivel: nivelInicial });
    });
    socket.on("connect_error", () => {
        console.warn("🔴 No se pudo conectar (¿el servidor está encendido?)");
        mostrarOverlay("No se pudo conectar. Reintentando…");
    });
    socket.on("disconnect", () => {
        mostrarOverlay("Conexión perdida. Reconectando…");
    });
    socket.on("sala-llena", () => mostrarOverlay("La sala está llena"));

    // Si el servidor rechaza una posición, volvemos a la última válida
    socket.on("corregir", (p) => camera.position.set(p.x, p.y, p.z));

    // "nivel" e "items" se procesan en orden para no pisarse
    socket.on("nivel", (i) => {
        cola = cola.then(() => procesarNivel(i)).catch((e) => console.error(e));
    });
    socket.on("items", (d) => {
        cola = cola.then(() => {
            estadoItems = d;
            if (listo) refrescarItems();
        });
    });

    socket.on("estado", (s) => {
        if (!listo) return;

        if (enemigo) {
            enemigo.posObjetivo.set(s.e.x, s.e.y, s.e.z);
            enemigo.rotObjetivo = s.e.rotY;
            enemigo.activo = s.e.activo;
            enemigo.hp = s.e.hp;
            enemigo.grupo.visible = s.e.activo;
            if (enemigo.primera) {
                enemigo.grupo.position.copy(enemigo.posObjetivo);
                enemigo.grupo.rotation.y = s.e.rotY;
                enemigo.primera = false;
            }
        }

        const vistos = new Set();
        for (const p of s.j) {
            if (p.id === socket.id) {
                yo.hp = p.hp;
                yo.armado = p.armado;
                yo.caido = p.caido;
                continue;
            }
            vistos.add(p.id);
            if (!remotos.has(p.id)) agregarRemoto(p);
            const r = remotos.get(p.id);
            r.posObjetivo.set(p.x, p.y - ALTURA_OJOS, p.z);
            r.rotObjetivo = p.rotY;
            r.grupo.scale.y = p.caido ? 0.35 : 1;
        }
        for (const id of [...remotos.keys()]) if (!vistos.has(id)) quitarRemoto(id);

        actualizarHUD();
    });

    socket.on("evento", (e) => {
        if (e.tipo === "msg") mostrarMensaje(e.texto);
        else if (e.tipo === "gameover" || e.tipo === "victoria") mostrarOverlay(e.texto);
    });

    socket.on("disparo", (d) => {
        if (!listo) return;
        const origen = new THREE.Vector3(d.o.x, d.o.y - 0.3, d.o.z);
        const fin = origen.clone().addScaledVector(new THREE.Vector3(d.d.x, d.d.y, d.d.z), d.t);
        const linea = new THREE.Line(
            new THREE.BufferGeometry().setFromPoints([origen, fin]),
            new THREE.LineBasicMaterial({ color: d.hit ? 0xff5533 : 0xaaddff, transparent: true, fog: false })
        );
        scene.add(linea);
        trazos.push({ obj: linea, vida: 0.15 });
    });

    // Entradas del jugador
    document.addEventListener("keydown", (e) => {
        if (e.code === "KeyE" && !e.repeat && listo && !isGamePaused()) socket.emit("interact");
    });
    document.addEventListener("mousedown", (e) => {
        if (e.button !== 0 || !listo || isGamePaused() || !document.pointerLockElement) return;
        if (!yo.armado || yo.caido) return;
        const d = new THREE.Vector3();
        camera.getWorldDirection(d);
        socket.emit("attack", { dir: { x: d.x, y: d.y, z: d.z } });
    });
}

// Llama esto en cada frame de animate()
export function actualizarMultijugador() {
    if (!socket) return;
    const delta = Math.min(reloj.getDelta(), 0.1);
    if (!listo) return;
    const ahora = performance.now();

    // Enviar mi posición
    if (socket.connected && !yo.caido && ahora - ultimoEnvio >= INTERVALO_ENVIO) {
        ultimoEnvio = ahora;
        socket.emit("move", {
            pos: { x: camera.position.x, y: camera.position.y, z: camera.position.z },
            rotY: camera.rotation.y,
        });
    }

    // Suavizar a los demás y al enemigo
    const t = 1 - Math.exp(-SUAVIZADO * delta);
    const suavizar = (grupo, posObj, rotObj) => {
        grupo.position.lerp(posObj, t);
        let dif = rotObj - grupo.rotation.y;
        dif = Math.atan2(Math.sin(dif), Math.cos(dif));
        grupo.rotation.y += dif * t;
    };
    for (const r of remotos.values()) suavizar(r.grupo, r.posObjetivo, r.rotObjetivo);
    if (enemigo && !enemigo.primera) suavizar(enemigo.grupo, enemigo.posObjetivo, enemigo.rotObjetivo);

    // Items flotando y girando
    const seg = ahora / 1000;
    for (const m of itemsMeshes.values()) {
        if (!m.visible) continue;
        m.rotation.y += delta * 1.5;
        m.position.y = m.userData.baseY + Math.sin(seg * 2 + m.position.x) * 0.1;
    }

    // Trazos de disparo
    for (let i = trazos.length - 1; i >= 0; i--) {
        trazos[i].vida -= delta;
        trazos[i].obj.material.opacity = Math.max(0, trazos[i].vida / 0.15);
        if (trazos[i].vida <= 0) {
            liberar(trazos[i].obj);
            trazos.splice(i, 1);
        }
    }

    // Aviso [E]
    const texto = calcularPrompt();
    hud.prompt.style.display = texto ? "block" : "none";
    hud.prompt.textContent = texto;
}