import { navigateWithLoading } from "./loading.js"; // usa funcion en loading.js para que al cambiar pase primero por una pantalla de carga
import { SERVIDOR_JUEGO, limpiarSala } from "../config.js";

// busca los los botones que hacen navegar entre pantallas
const startButton = document.querySelector(".start-button");
const registerLink = document.querySelector(".register-link");
const loginLink = document.querySelector(".login-link");
// busca boton para ir al juego
const beginGameButton = document.getElementById("begin-game-button");
// busca las tres secciones principales de index.html
const homeScreen = document.getElementById("home-screen");
const loginScreen = document.getElementById("login-screen");
const registerScreen = document.getElementById("register-screen");

// --- NAVEGACION OCULTANDO CON CLASES CSS ---

// HOME → LOGIN

// pregunta existencia de boton comenzar, pantalla inicial y login para continuar
if (startButton && homeScreen && loginScreen) {
    // al presionar comenzar ejecuta
    startButton.addEventListener("click", () => {

        // classList agrega animaciones css segun sea la que tenga
        homeScreen.classList.add("slide-out");

        loginScreen.classList.add("slide-in");

    });

}


// LOGIN → REGISTRO

// pregunta existencia de boton que te lleva a registro, pantalla register y de login
if (registerLink && loginScreen && registerScreen) {

    registerLink.addEventListener("click", () => {

        // classList agrega animaciones css segun sea la que tenga
        loginScreen.classList.add("slide-to-register");

        registerScreen.classList.add("slide-in");

    });

}


// REGISTRO → LOGIN

// pregunta existencia de boton que te lleva a login, pantalla register y de login
if (loginLink && loginScreen && registerScreen) {

    loginLink.addEventListener("click", () => {

        registerScreen.classList.remove("slide-in");

        loginScreen.classList.remove("slide-to-register");

    });

}

// --- NAVEGACION CAMBIANDO DE HTML ---

// SERVIDOR → JUEGO

// pregunta existencia de boton comenzar juego
if (beginGameButton) {

    // cambia de html a otro, llevando el nombre del jugador y la sala elegida
    beginGameButton.addEventListener("click", () => {

        const nombre = (document.getElementById("server-username")?.textContent || "").trim();
        const sala = limpiarSala(document.getElementById("server-room-code")?.value);

        try {
            localStorage.setItem("thetrace-nombre", nombre);
            localStorage.setItem("thetrace-sala", sala);
        } catch {
            // sin almacenamiento: igual viajan por la URL
        }

        // Si el juego lo sirve otro servidor (Render), se va a su dirección completa
        const base = SERVIDOR_JUEGO ? `${SERVIDOR_JUEGO}/` : "./";

        navigateWithLoading(
            `${base}juego.html?sala=${encodeURIComponent(sala)}&nombre=${encodeURIComponent(nombre)}`
        );

    });

}