import {
    isGamePaused,
    setGamePaused
} from "../game/gameState.js";


const pauseMenu =
    document.getElementById("pause-menu");

const pauseMain =
    document.getElementById("pause-main");

const pauseOptions =
    document.getElementById("pause-options");


const pauseOptionsButton =
    document.getElementById("pause-options-button");

const pauseExitButton =
    document.getElementById("pause-exit-button");

const pauseBackButton =
    document.getElementById("pause-back-button");


let pauseView = "main";


/* ========================================
   MOSTRAR MENÚ PRINCIPAL
   ======================================== */

function showPauseMain() {

    pauseView = "main";

    pauseMain.classList.remove(
        "pause-main-hidden"
    );

    pauseOptions.classList.remove(
        "pause-options-open"
    );

}


/* ========================================
   MOSTRAR OPCIONES
   ======================================== */

function showPauseOptions() {

    pauseView = "options";

    pauseMain.classList.add(
        "pause-main-hidden"
    );

    pauseOptions.classList.add(
        "pause-options-open"
    );

}


/* ========================================
   ABRIR PAUSA
   ======================================== */

function openPauseMenu() {

    setGamePaused(true);

    showPauseMain();


    pauseMenu.classList.add(
        "pause-menu-open"
    );

    pauseMenu.setAttribute(
        "aria-hidden",
        "false"
    );


    dispatchPauseChange(true);

}


/* ========================================
   CERRAR PAUSA
   ======================================== */

function closePauseMenu() {

    setGamePaused(false);

    showPauseMain();


    pauseMenu.classList.remove(
        "pause-menu-open"
    );

    pauseMenu.setAttribute(
        "aria-hidden",
        "true"
    );


    dispatchPauseChange(false);

}


/* ========================================
   AVISAR AL JUEGO
   ======================================== */

function dispatchPauseChange(paused) {

    window.dispatchEvent(

        new CustomEvent(
            "game-pause-change",
            {
                detail: {
                    paused: paused
                }
            }
        )

    );

}


/* ========================================
   TECLA ESCAPE
   ======================================== */

document.addEventListener("keydown", (event) => {

    if (event.key !== "Escape") {
        return;
    }


    /*
        Juego sin pausar:
        ESC abre pausa.
    */

    if (!isGamePaused()) {

        openPauseMenu();

        return;
    }


    /*
        Si estamos dentro de Opciones:
        ESC vuelve al menú principal,
        PERO EL JUEGO SIGUE PAUSADO.
    */

    if (pauseView === "options") {

        showPauseMain();

        return;
    }


    /*
        Si estamos en el menú principal:
        ESC reanuda el juego.
    */

    closePauseMenu();

});


/* ========================================
   BOTÓN OPCIONES
   ======================================== */

pauseOptionsButton.addEventListener("click", () => {

    showPauseOptions();

});


/* ========================================
   BOTÓN SALIR
   ======================================== */

pauseExitButton.addEventListener("click", () => {

    window.location.href = "./inicio.php";

});

/* ========================================
   BOTÓN VOLVER
   ======================================== */

pauseBackButton.addEventListener("click", () => {

    showPauseMain();

});