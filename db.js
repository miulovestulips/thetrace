// db.js — conexión a la base de datos (PostgreSQL)
// La dirección de la base de datos NO va escrita aquí: viene de la variable DATABASE_URL
// (en tu computadora, del archivo .env; en Render, de Environment).

const { Pool } = require("pg");

let pool = null;

function obtenerPool() {
    if (!pool) {
        pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            // Neon, Supabase y Render exigen conexión cifrada (SSL)
            ssl: process.env.DB_SSL === "false" ? false : { rejectUnauthorized: false },
            max: 5,
        });
        pool.on("error", (error) => console.error("Error en la base de datos:", error.message));
    }
    return pool;
}

// consultar("SELECT ... WHERE id = $1", [5])  -> los valores van aparte, nunca pegados al texto SQL
const consultar = (sql, params = []) => obtenerPool().query(sql, params);

// Crea la tabla de usuarios la primera vez que arranca el servidor
async function iniciarBD() {
    try {
        await consultar(`
            CREATE TABLE IF NOT EXISTS usuarios (
                id_usuario     SERIAL PRIMARY KEY,
                nombre_usuario VARCHAR(16)  NOT NULL,
                correo         VARCHAR(120) NOT NULL,
                contrasena     VARCHAR(100) NOT NULL, -- aquí va el hash, nunca la contraseña real
                creado_en      TIMESTAMPTZ  NOT NULL DEFAULT now()
            )
        `);
        // no se repiten usuarios ni correos (sin distinguir mayúsculas)
        await consultar(
            "CREATE UNIQUE INDEX IF NOT EXISTS usuarios_nombre_unico ON usuarios (LOWER(nombre_usuario))"
        );
        await consultar(
            "CREATE UNIQUE INDEX IF NOT EXISTS usuarios_correo_unico ON usuarios (LOWER(correo))"
        );
        console.log("Base de datos lista");
    } catch (error) {
        // no tumbamos el servidor: el juego sigue funcionando aunque las cuentas fallen
        console.error("No se pudo preparar la base de datos:", error.message);
    }
}

module.exports = { consultar, iniciarBD };