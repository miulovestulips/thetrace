// nivelesConfig.js
// TODA la configuración de los 3 escenarios está aquí.
// Las coordenadas son ESTIMADAS a partir de tu game.js: ajústalas probando el juego.
//
// Cada nivel define:
//   spawn    -> dónde aparecen los jugadores (se reparten en una cuadrícula pequeña)
//   items    -> objetos recogibles ("mapa" o "arma")
//   pared    -> (solo nivel 1) dónde se coloca el mapa armado. rotY gira el cuadro.
//   salida   -> zona que deben cruzar TODOS los jugadores vivos para pasar de nivel
//   abreCon  -> qué abre la salida: "mapa" (mapa colocado) o "enemigo" (enemigo muerto)
//   final    -> true = matar al enemigo gana la partida
//   enemigo  -> perseguidor: hp (null = invencible), velocidad (unidades/seg),
//               danio, enfriamiento (seg entre golpes), radio, escala,
//               aggro (null = persigue siempre; número = solo si hay un jugador a esa distancia),
//               gracia (seg que tarda en aparecer desde que empieza el nivel)
//
// Referencia: tu jugador camina a ~4.8 u/seg, así que un enemigo de 3.4 se puede esquivar corriendo.

module.exports = {
    1: {
        nombre: "La casa",
        spawn: { x: 0, y: 2, z: 5 },
        items: [
            { tipo: "mapa", x: -17, y: 1.2, z: 9 },
            { tipo: "mapa", x: 11, y: 1.2, z: 8 },
            { tipo: "mapa", x: -15, y: 1.2, z: -9 },
            { tipo: "mapa", x: 6, y: 1.2, z: -9 },
        ],
        pared: { x: 0, y: 2.5, z: -11, r: 3.5, rotY: 0 },
        salida: { x: -8.7, y: 1, z: 6.3, r: 3.5 },
        abreCon: "mapa",
        final: false,
        enemigo: {
            tipo: "acechador",
            nombre: "El Acechador",
            hp: null, // invencible: aquí solo se sobrevive
            velocidad: 3.4,
            danio: 15,
            enfriamiento: 1.2,
            radio: 1.0,
            escala: 1,
            aggro: null,
            gracia: 10,
            spawn: { x: 12, y: 0, z: -9 },
        },
    },

    2: {
        nombre: "El bosque",
        spawn: { x: 52, y: 2, z: -6 },
        items: [
            { tipo: "arma", x: 35, z: -10 },
            { tipo: "arma", x: -30, z: -5 },
            { tipo: "arma", x: 5, z: 15 },
            { tipo: "arma", x: -45, z: 35 },
        ],
        pared: null,
        salida: { x: -62, y: 1, z: -45, r: 5 },
        abreCon: "enemigo",
        final: false,
        enemigo: {
            tipo: "acechador",
            nombre: "El Perseguidor",
            hp: 300,
            velocidad: 3.8,
            danio: 20,
            enfriamiento: 1.0,
            radio: 1.0,
            escala: 1.3,
            aggro: null,
            gracia: 8,
            spawn: { x: 10, y: 0, z: 40 },
        },
    },

    3: {
        nombre: "La cueva del jefe",
        spawn: { x: 0, y: 2, z: 0 },
        items: [],
        pared: null,
        salida: null,
        abreCon: "enemigo",
        final: true,
        enemigo: {
            tipo: "jefe",
            nombre: "El Jefe Final",
            hp: 1500,
            velocidad: 3.0,
            danio: 35,
            enfriamiento: 1.5,
            radio: 1.0,
            escala: 2.2,
            aggro: 22, // se queda en su cuarto hasta que alguien entra
            gracia: 3,
            spawn: { x: -28, y: 0, z: -56 },
        },
    },
};