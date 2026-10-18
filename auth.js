// auth.js — cuentas de usuario: registro, login, logout, perfil y menú protegido.
// Las rutas conservan los nombres que ya usa tu código del navegador (/php/login.php, etc.)
// para no tener que cambiar login.js, register.js, logout.js ni profilePanel.js.

const fs = require("fs");
const path = require("path");
const express = require("express");
const multer = require("multer");
const bcrypt = require("bcryptjs");
const cookieSession = require("cookie-session");
const { consultar, iniciarBD } = require("./db");

const RE_USUARIO = /^[A-Za-z0-9_]{3,16}$/; // el juego recorta el nombre a 16 caracteres
const RE_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_CONTRASENA = 6;
const MAX_CONTRASENA = 72; // bcrypt solo lee los primeros 72 caracteres

// hash de mentira: se compara cuando el usuario no existe, para que el login
// tarde lo mismo y no revele qué usuarios están registrados
const HASH_FALSO = bcrypt.hashSync("contrasena-falsa", 10);

const RUTA_MENU = path.join(__dirname, "inicio.html");

// ---------- utilidades ----------
function responder(res, estado, mensaje, ok = false, extra = {}) {
    res.status(estado).json({ ok, mensaje, ...extra });
}

function escaparHtml(texto) {
    return String(texto)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

// Devuelve un texto de error si algo no cumple, o null si todo está bien
function validarDatos({ nombre, correo, clave }, { exigirClave }) {
    if (!RE_USUARIO.test(nombre)) {
        return "El usuario debe tener de 3 a 16 caracteres: letras, números o guion bajo";
    }
    if (!RE_CORREO.test(correo) || correo.length > 120) {
        return "El correo no es válido";
    }
    if (exigirClave || clave) {
        if (clave.length < MIN_CONTRASENA) {
            return `La contraseña debe tener al menos ${MIN_CONTRASENA} caracteres`;
        }
        if (clave.length > MAX_CONTRASENA) {
            return `La contraseña no puede pasar de ${MAX_CONTRASENA} caracteres`;
        }
    }
    return null;
}

// Usuario o correo repetido (código 23505 de PostgreSQL)
function mensajeDuplicado(error) {
    if (error.code !== "23505") return null;
    return String(error.constraint).includes("correo")
        ? "Ese correo ya está registrado"
        : "Ese nombre de usuario ya está en uso";
}

function errorInterno(res, error) {
    console.error("Error en cuentas:", error.message);
    responder(res, 500, "No se pudo completar la operación. Intenta de nuevo en un momento");
}

// ---------- rutas /php/... ----------
const rutasCuentas = express.Router();

// tu navegador manda los datos como FormData (multipart): multer los lee
rutasCuentas.use(multer().none());
rutasCuentas.use(express.urlencoded({ extended: false }));

rutasCuentas.post("/registro.php", async (req, res) => {
    try {
        const campos = req.body || {};
        const nombre = String(campos.nombre_usuario || "").trim();
        const correo = String(campos.correo || "").trim().toLowerCase();
        const clave = String(campos.contrasena || "");
        const confirmar = String(campos.confirmar_contrasena || "");

        const problema = validarDatos({ nombre, correo, clave }, { exigirClave: true });
        if (problema) return responder(res, 400, problema);
        if (clave !== confirmar) return responder(res, 400, "Las contraseñas no coinciden");

        const hash = await bcrypt.hash(clave, 10);
        await consultar(
            "INSERT INTO usuarios (nombre_usuario, correo, contrasena) VALUES ($1, $2, $3)",
            [nombre, correo, hash]
        );
        responder(res, 201, "Cuenta creada correctamente. Ahora inicia sesión", true);
    } catch (error) {
        const duplicado = mensajeDuplicado(error);
        if (duplicado) return responder(res, 409, duplicado);
        errorInterno(res, error);
    }
});

rutasCuentas.post("/login.php", async (req, res) => {
    try {
        const campos = req.body || {};
        const nombre = String(campos.nombre_usuario || "").trim();
        const clave = String(campos.contrasena || "");

        const resultado = await consultar(
            "SELECT id_usuario, nombre_usuario, contrasena FROM usuarios WHERE LOWER(nombre_usuario) = LOWER($1)",
            [nombre]
        );
        const usuario = resultado.rows[0];

        const correcta = await bcrypt.compare(clave.slice(0, MAX_CONTRASENA), usuario ? usuario.contrasena : HASH_FALSO);
        if (!usuario || !correcta) {
            return responder(res, 401, "Usuario o contraseña incorrectos");
        }

        // la sesión guarda solo el id del usuario
        req.session = { id_usuario: usuario.id_usuario };
        responder(res, 200, "Sesión iniciada", true, {
            usuario: { nombre_usuario: usuario.nombre_usuario },
        });
    } catch (error) {
        errorInterno(res, error);
    }
});

rutasCuentas.post("/logout.php", (req, res) => {
    req.session = null; // borra la sesión
    responder(res, 200, "Sesión cerrada", true);
});

rutasCuentas.post("/updateProfile.php", async (req, res) => {
    try {
        const id = req.session && req.session.id_usuario;
        if (!id) return responder(res, 401, "Tu sesión terminó. Inicia sesión de nuevo");

        const campos = req.body || {};
        const nombre = String(campos.nombre_usuario || "").trim();
        const correo = String(campos.correo || "").trim().toLowerCase();
        const clave = String(campos.contrasena || ""); // vacía = no cambiar la contraseña

        const problema = validarDatos({ nombre, correo, clave }, { exigirClave: false });
        if (problema) return responder(res, 400, problema);

        if (clave) {
            const hash = await bcrypt.hash(clave, 10);
            await consultar(
                "UPDATE usuarios SET nombre_usuario = $1, correo = $2, contrasena = $3 WHERE id_usuario = $4",
                [nombre, correo, hash, id]
            );
        } else {
            await consultar(
                "UPDATE usuarios SET nombre_usuario = $1, correo = $2 WHERE id_usuario = $3",
                [nombre, correo, id]
            );
        }
        responder(res, 200, "Perfil actualizado", true);
    } catch (error) {
        const duplicado = mensajeDuplicado(error);
        if (duplicado) return responder(res, 409, duplicado);
        errorInterno(res, error);
    }
});

// cualquier error raro al leer los datos del formulario
rutasCuentas.use((error, req, res, next) => {
    responder(res, 400, "Los datos enviados no son válidos");
});

// ---------- el menú (antes inicio.php) ----------
async function paginaMenu(req, res) {
    const id = req.session && req.session.id_usuario;
    if (!id) return res.redirect("/index.html"); // sin sesión: de vuelta al login

    try {
        const resultado = await consultar(
            "SELECT nombre_usuario, correo FROM usuarios WHERE id_usuario = $1",
            [id]
        );
        const usuario = resultado.rows[0];
        if (!usuario) {
            req.session = null;
            return res.redirect("/index.html");
        }

        const plantilla = await fs.promises.readFile(RUTA_MENU, "utf8");
        const html = plantilla
            .replaceAll("{{NOMBRE_USUARIO}}", escaparHtml(usuario.nombre_usuario))
            .replaceAll("{{CORREO}}", escaparHtml(usuario.correo));

        // página protegida: que el navegador no la guarde en caché
        res.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
        res.type("html").send(html);
    } catch (error) {
        console.error("Error al cargar el menú:", error.message);
        res.status(500).send("No se pudo cargar el menú. Intenta de nuevo en un momento.");
    }
}

// ---------- se conecta al servidor desde server.js ----------
function montarCuentas(app) {
    const secreto = process.env.SESSION_SECRET;

    if (!secreto || !process.env.DATABASE_URL) {
        // el juego sigue funcionando; solo las cuentas quedan apagadas
        console.warn("⚠ Cuentas desactivadas: faltan SESSION_SECRET y/o DATABASE_URL");
        app.use("/php", (req, res) =>
            responder(res, 503, "Las cuentas todavía no están configuradas en el servidor")
        );
        app.get("/inicio.php", (req, res) => res.redirect("/index.html"));
        return;
    }

    app.set("trust proxy", 1); // Render pone un proxy HTTPS delante del servidor
    app.use(
        cookieSession({
            name: "thetrace",
            keys: [secreto],
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
            httpOnly: true,
            sameSite: "lax",
        })
    );
    app.use("/php", rutasCuentas);
    app.get("/inicio.php", paginaMenu);

    iniciarBD();
}

module.exports = { montarCuentas };