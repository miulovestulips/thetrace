const express = require("express");
const http = require("http");
const path = require("path");

const { Server } = require("socket.io");
const NIVELES = require("./nivelesConfig");

const PORT = process.env.PORT || 3000;
const MAX_JUGADORES = 6;
const TICK_MS = 50; // 20 ticks por segundo
const VIDA_JUGADOR = 100;
const DIST_INTERACCION = 2.5;
const DANIO_ARMA = 25;
const ENFRIAMIENTO_ARMA = 600; // ms
const ALCANCE_ARMA = 25;
const VEL_MAX = 14; // u/seg máximo aceptado (tu jugador va a 9 en game.js)
const ESPERA_MAX_MS = 60000; // tiempo máximo esperando a que todos carguen el nivel

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: process.env.ORIGENES ? process.env.ORIGENES.split(",") : "*" },
});

// Solo carpetas del cliente (NO la raíz: expondría server.js y package.json)
app.use("/js", express.static(path.join(__dirname, "js")));
app.use("/css", express.static(path.join(__dirname, "css")));
app.use("/assets", express.static(path.join(__dirname, "assets")));
app.get("/", (req, res) => res.redirect("/juego.html"));
app.get("/juego.html", (req, res) => res.sendFile(path.join(__dirname, "juego.html")));

const partidas = new Map(); // codigo -> Partida

// ---------- utilidades ----------
const num = (v) => typeof v === "number" && Number.isFinite(v);
const r2 = (v) => Math.round(v * 100) / 100;
const dist2D = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
const posValida = (p) => p && num(p.x) && num(p.y) && num(p.z);

// Misma fórmula de relieve que usa tu terreno del nivel 2 en game.js
const suelo = (nivel, x, z) => (nivel === 2 ? Math.sin(x * 0.1) * Math.cos(z * 0.1) * 2 : 0);

// ---------- Partida ----------
class Partida {
    constructor(codigo, nivelInicial) {
        this.codigo = codigo;
        this.jugadores = new Map();
        this.ultimoTick = Date.now();
        this.cargarNivel(nivelInicial);
        this.intervalo = setInterval(() => this.tick(), TICK_MS);
    }

    viva() {
        return partidas.get(this.codigo) === this;
    }

    // ----- niveles -----
    cargarNivel(n) {
        this.nivel = n;
        this.cfg = NIVELES[n];
        this.items = this.cfg.items.map((it, id) => ({
            id,
            tipo: it.tipo,
            x: it.x,
            z: it.z,
            y: n === 2 ? suelo(n, it.x, it.z) + 1 : it.y,
            recogido: false,
        }));
        this.mapaArmado = false;
        this.salidaAbierta = false;

        const e = this.cfg.enemigo;
        this.enemigo = {
            x: e.spawn.x,
            z: e.spawn.z,
            y: suelo(n, e.spawn.x, e.spawn.z),
            rotY: 0,
            hp: e.hp,
            activo: false,
            ultimoGolpe: 0,
        };

        this.fase = "esperando"; // esperando | jugando | gameover | victoria
        this.inicioEspera = Date.now();
        this.tJuego = 0;

        let i = 0;
        for (const j of this.jugadores.values()) {
            this.reiniciarJugador(j, i++);
            j.socket.emit("nivel", this.infoNivel(j));
        }
    }

    reiniciarJugador(j, indice) {
        const s = this.cfg.spawn;
        j.spawn = {
            x: s.x + (indice % 3) * 1.5 - 1.5,
            y: s.y,
            z: s.z + Math.floor(indice / 3) * 1.5,
        };
        j.pos = { ...j.spawn };
        j.rotY = 0;
        j.hp = VIDA_JUGADOR;
        j.caido = false;
        j.armado = this.nivel === 3; // en el nivel 3 todos llegan armados
        j.listo = false;
        j.ultimoAtaque = 0;
        j.ultimoMove = 0;
    }

    infoNivel(j) {
        const cfg = this.cfg;
        return {
            n: this.nivel,
            nombre: cfg.nombre,
            spawn: j.spawn,
            items: this.items.map(({ id, tipo, x, y, z }) => ({ id, tipo, x, y, z })),
            pared: cfg.pared || null,
            salida: cfg.salida || null,
            enemigo: {
                tipo: cfg.enemigo.tipo,
                nombre: cfg.enemigo.nombre,
                hpMax: cfg.enemigo.hp,
                escala: cfg.enemigo.escala,
            },
            estadoItems: this.infoItems(),
        };
    }

    infoItems() {
        return {
            recogidos: this.items.filter((i) => i.recogido).map((i) => i.id),
            mapaArmado: this.mapaArmado,
            salidaAbierta: this.salidaAbierta,
            objetivo: this.textoObjetivo(),
        };
    }

    textoObjetivo() {
        const mapas = this.items.filter((i) => i.tipo === "mapa");
        const armas = this.items.filter((i) => i.tipo === "arma");
        const mapasR = mapas.filter((i) => i.recogido).length;
        const armasR = armas.filter((i) => i.recogido).length;

        if (this.nivel === 1) {
            if (mapasR < mapas.length)
                return `Busca las partes del mapa (${mapasR}/${mapas.length}) y no dejes que te atrape`;
            if (!this.mapaArmado) return "Coloca el mapa en la pared [E]";
            return "Sigue el trazo hasta la puerta: ¡todos juntos!";
        }
        if (this.nivel === 2) {
            if (!this.enemigoMuerto())
                return `Encuentra armas (${armasR}/${armas.length}) y mata al perseguidor`;
            return "La entrada de la cueva está abierta: crúzala todos juntos";
        }
        return "Mata al jefe final";
    }

    enemigoMuerto() {
        return this.enemigo.hp !== null && this.enemigo.hp <= 0;
    }

    // ----- jugadores -----
    agregar(socket, nombre) {
        const j = { id: socket.id, socket, name: nombre };
        this.jugadores.set(socket.id, j);
        this.reiniciarJugador(j, this.jugadores.size - 1);
        socket.join(this.codigo);
        socket.emit("nivel", this.infoNivel(j));
        this.mensaje(`${j.name} se unió a la partida`);
    }

    salir(socket) {
        const j = this.jugadores.get(socket.id);
        this.jugadores.delete(socket.id);
        if (this.jugadores.size === 0) {
            clearInterval(this.intervalo);
            partidas.delete(this.codigo);
            console.log("Partida cerrada:", this.codigo);
        } else if (j) {
            this.mensaje(`${j.name} salió`);
        }
    }

    mensaje(texto) {
        io.to(this.codigo).emit("evento", { tipo: "msg", texto });
    }

    emitirItems() {
        io.to(this.codigo).emit("items", this.infoItems());
    }

    // ----- acciones -----
    mover(j, pos, rotY) {
        // j.listo evita aceptar posiciones del nivel anterior mientras el cliente carga
        if (!j.listo || j.caido || this.fase === "gameover") return;
        const ahora = Date.now();
        if (j.ultimoMove) {
            const dt = Math.min((ahora - j.ultimoMove) / 1000, 1);
            if (dist2D(pos, j.pos) > VEL_MAX * dt + 4) {
                j.socket.emit("corregir", j.pos); // el cliente vuelve a la posición válida
                return;
            }
        }
        j.ultimoMove = ahora;
        j.pos = { x: pos.x, y: pos.y, z: pos.z };
        j.rotY = rotY;
    }

    interactuar(j) {
        if (j.caido || this.fase !== "jugando") return;

        // 1) recoger lo que tengas cerca
        const cerca = this.items.find(
            (it) => !it.recogido && Math.hypot(it.x - j.pos.x, it.z - j.pos.z) <= DIST_INTERACCION
        );
        if (cerca) {
            cerca.recogido = true;
            if (cerca.tipo === "arma") {
                j.armado = true;
                this.mensaje(`${j.name} recogió un arma`);
            } else {
                const total = this.items.filter((i) => i.tipo === "mapa").length;
                const r = this.items.filter((i) => i.tipo === "mapa" && i.recogido).length;
                this.mensaje(`${j.name} encontró una parte del mapa (${r}/${total})`);
            }
            this.emitirItems();
            return;
        }

        // 2) colocar el mapa en la pared (nivel 1)
        const pared = this.cfg.pared;
        if (pared && !this.mapaArmado) {
            const todas = this.items.filter((i) => i.tipo === "mapa").every((i) => i.recogido);
            if (todas && dist2D(j.pos, pared) <= pared.r) {
                this.mapaArmado = true;
                this.mensaje(`${j.name} colocó el mapa: ¡el trazo se reveló!`);
                this.emitirItems();
            }
        }
    }

    atacar(j, dir) {
        if (this.fase !== "jugando" || j.caido || !j.armado) return;
        const ahora = Date.now();
        if (ahora - j.ultimoAtaque < ENFRIAMIENTO_ARMA) return;
        j.ultimoAtaque = ahora;

        const len = Math.hypot(dir.x, dir.y, dir.z);
        if (len === 0) return;
        const d = { x: dir.x / len, y: dir.y / len, z: dir.z / len };
        const o = { x: j.pos.x, y: j.pos.y, z: j.pos.z };

        const e = this.enemigo;
        const cfgE = this.cfg.enemigo;
        let impacto = false;
        let t = ALCANCE_ARMA;

        if (e.activo && e.hp !== null && e.hp > 0) {
            const centro = { x: e.x, y: e.y + 1.2 * cfgE.escala, z: e.z };
            const v = { x: centro.x - o.x, y: centro.y - o.y, z: centro.z - o.z };
            const proy = v.x * d.x + v.y * d.y + v.z * d.z;
            if (proy > 0 && proy <= ALCANCE_ARMA) {
                const cx = v.x - d.x * proy;
                const cy = v.y - d.y * proy;
                const cz = v.z - d.z * proy;
                if (Math.hypot(cx, cy, cz) <= cfgE.radio * cfgE.escala * 1.1) {
                    impacto = true;
                    t = proy;
                }
            }
        }

        if (impacto) {
            e.hp = Math.max(0, e.hp - DANIO_ARMA);
            if (e.hp === 0) {
                this.mensaje(`${j.name} derrotó a ${cfgE.nombre}`);
                this.emitirItems();
            }
        }

        io.to(this.codigo).emit("disparo", { id: j.id, o, d, t: r2(t), hit: impacto });
    }

    // ----- simulación -----
    tick() {
        const ahora = Date.now();
        const dt = Math.min((ahora - this.ultimoTick) / 1000, 0.1);
        this.ultimoTick = ahora;

        if (this.fase === "esperando") {
            const todos = [...this.jugadores.values()].every((j) => j.listo);
            if (todos || ahora - this.inicioEspera > ESPERA_MAX_MS) {
                this.fase = "jugando";
                this.tJuego = 0;
                this.emitirItems();
            }
        } else if (this.fase === "jugando") {
            this.tJuego += dt;
            this.actualizarEnemigo(ahora);
            this.comprobarProgreso();
            this.comprobarDerrota();
        }

        this.emitirEstado();
    }

    actualizarEnemigo(ahora) {
        const e = this.enemigo;
        const c = this.cfg.enemigo;
        const dt = TICK_MS / 1000;

        if (!e.activo && this.tJuego >= c.gracia) {
            e.activo = true;
            this.mensaje(`¡${c.nombre} te ha encontrado!`);
        }
        if (!e.activo || (e.hp !== null && e.hp <= 0)) return;

        // jugador vivo más cercano
        let objetivo = null;
        let mejor = Infinity;
        for (const j of this.jugadores.values()) {
            if (j.caido) continue;
            const d = dist2D(j.pos, e);
            if (d < mejor) {
                mejor = d;
                objetivo = j;
            }
        }
        if (!objetivo) return;
        if (c.aggro !== null && mejor > c.aggro) return;

        const dx = objetivo.pos.x - e.x;
        const dz = objetivo.pos.z - e.z;
        const alcance = c.radio * c.escala;

        if (mejor > 0.01) {
            e.rotY = Math.atan2(-dx, -dz);
            if (mejor > alcance * 0.8) {
                const paso = Math.min(c.velocidad * dt, mejor);
                e.x += (dx / mejor) * paso;
                e.z += (dz / mejor) * paso;
                e.y = suelo(this.nivel, e.x, e.z);
            }
        }

        if (mejor <= alcance + 0.6 && ahora - e.ultimoGolpe >= c.enfriamiento * 1000) {
            e.ultimoGolpe = ahora;
            objetivo.hp = Math.max(0, objetivo.hp - c.danio);
            if (objetivo.hp === 0) {
                objetivo.caido = true;
                this.mensaje(`${objetivo.name} cayó`);
            }
        }
    }

    comprobarProgreso() {
        const cfg = this.cfg;

        if (!this.salidaAbierta) {
            const abre =
                (cfg.abreCon === "mapa" && this.mapaArmado) ||
                (cfg.abreCon === "enemigo" && this.enemigoMuerto());
            if (abre && !cfg.final) {
                this.salidaAbierta = true;
                this.mensaje("¡La salida está abierta!");
                this.emitirItems();
            }
        }

        // Victoria
        if (cfg.final && this.enemigoMuerto()) {
            this.fase = "victoria";
            io.to(this.codigo).emit("evento", {
                tipo: "victoria",
                texto: "¡VICTORIA! Derrotaron al jefe final",
            });
            setTimeout(() => {
                if (this.viva()) this.cargarNivel(1);
            }, 12000);
            return;
        }

        // Pasar de nivel: todos los vivos dentro de la zona de salida
        if (this.salidaAbierta && cfg.salida && NIVELES[this.nivel + 1]) {
            const vivos = [...this.jugadores.values()].filter((j) => !j.caido);
            if (vivos.length > 0 && vivos.every((j) => dist2D(j.pos, cfg.salida) <= cfg.salida.r)) {
                this.cargarNivel(this.nivel + 1);
            }
        }
    }

    comprobarDerrota() {
        if (this.fase !== "jugando" || this.jugadores.size === 0) return;
        if ([...this.jugadores.values()].every((j) => j.caido)) {
            this.fase = "gameover";
            io.to(this.codigo).emit("evento", {
                tipo: "gameover",
                texto: "Todos cayeron. Reiniciando el nivel…",
            });
            setTimeout(() => {
                if (this.viva()) this.cargarNivel(this.nivel);
            }, 5000);
        }
    }

    emitirEstado() {
        const e = this.enemigo;
        io.to(this.codigo).emit("estado", {
            e: { x: r2(e.x), y: r2(e.y), z: r2(e.z), rotY: r2(e.rotY), hp: e.hp, activo: e.activo },
            j: [...this.jugadores.values()].map((j) => ({
                id: j.id,
                name: j.name,
                x: r2(j.pos.x),
                y: r2(j.pos.y),
                z: r2(j.pos.z),
                rotY: r2(j.rotY),
                hp: j.hp,
                armado: j.armado,
                caido: j.caido,
            })),
        });
    }
}

// ---------- sockets ----------
function partidaDe(socket) {
    return partidas.get(socket.data.codigo);
}

io.on("connection", (socket) => {
    console.log("Conectado:", socket.id);

    socket.on("join", (datos = {}) => {
        if (socket.data.codigo) return; // ya está dentro
        const nombre = String(datos.name || "Jugador").slice(0, 16);
        const codigo = String(datos.codigo || "PUBLICA").toUpperCase().slice(0, 12);
        const nivelInicial = [1, 2, 3].includes(Number(datos.nivel)) ? Number(datos.nivel) : 1;

        let p = partidas.get(codigo);
        if (!p) {
            p = new Partida(codigo, nivelInicial);
            partidas.set(codigo, p);
            console.log("Partida creada:", codigo, "nivel", nivelInicial);
        }
        if (p.jugadores.size >= MAX_JUGADORES) {
            socket.emit("sala-llena");
            return;
        }
        socket.data.codigo = codigo;
        p.agregar(socket, nombre);
    });

    socket.on("nivel-listo", (datos = {}) => {
        const p = partidaDe(socket);
        const j = p && p.jugadores.get(socket.id);
        // solo vale si el cliente cargó el nivel actual (evita "listo" atrasado)
        if (j && datos.n === p.nivel) j.listo = true;
    });

    socket.on("move", (datos = {}) => {
        const p = partidaDe(socket);
        const j = p && p.jugadores.get(socket.id);
        if (!j || !posValida(datos.pos) || !num(datos.rotY)) return;
        p.mover(j, datos.pos, datos.rotY);
    });

    socket.on("interact", () => {
        const p = partidaDe(socket);
        const j = p && p.jugadores.get(socket.id);
        if (j) p.interactuar(j);
    });

    socket.on("attack", (datos = {}) => {
        const p = partidaDe(socket);
        const j = p && p.jugadores.get(socket.id);
        const d = datos.dir;
        if (!j || !d || !num(d.x) || !num(d.y) || !num(d.z)) return;
        p.atacar(j, d);
    });

    socket.on("disconnect", () => {
        const p = partidaDe(socket);
        if (p) p.salir(socket);
        console.log("Desconectado:", socket.id);
    });
});

server.listen(PORT, () => {
    console.log(`Servidor multijugador THETRACE activo en http://localhost:${PORT}`);
});