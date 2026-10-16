import {
    getGameVolume
} from "../audio/audioSettings.js"; // importa volumen general actual especificado en la funcion getGameVolume en audioSettings.js

// busca que elementos tiene en su class "ui sound"
const uiSoundElements = document.querySelectorAll(".ui-sound");

// crea sonido al pasar le mouse
const hoverSound = new Audio("./assets/sounds/buttonhover.mp3");
// crea sonido al dar click
const defaultClickSound = new Audio("./assets/sounds/buttoncomenzar.mp3");

// navegador carga sonidos con anticipacion preparandolos para reproducirlos rapido
hoverSound.preload = "auto";
defaultClickSound.preload = "auto";

// volumenes base - se combinan con el volumen general de juego
const HOVER_SOUND_VOLUME = 0.5;
const CLICK_SOUND_VOLUME = 0.7;

// actualiza volumen de los sonidos en interfaz
function updateUiSoundVolume() {

    // primero obtiene volumen general
    const gameVolume = getGameVolume();

    // multiplica volumen general x el volumen base
    hoverSound.volume =
        HOVER_SOUND_VOLUME * gameVolume;

    defaultClickSound.volume =
        CLICK_SOUND_VOLUME * gameVolume;
}

// al cargar audios tendran el volumn correcto
updateUiSoundVolume();


/* Escuchar cambios de volumen */

window.addEventListener("game-volume-change", (event) => {

    // obtiene los nuevos vokumenes
    const gameVolume = event.detail.volume;

    hoverSound.volume =
        HOVER_SOUND_VOLUME * gameVolume;

    defaultClickSound.volume =
        CLICK_SOUND_VOLUME * gameVolume;
});


uiSoundElements.forEach((element) => {

    // Sonido hover cuando el mouse entra en el area
    element.addEventListener("mouseenter", () => {

        // regresa el audio al comienzo, permite que vuelva a empezar aunque haya sonadl antes
        hoverSound.currentTime = 0;
        // reproduce sonido
        hoverSound.play().catch(() => {});
    });


    // Sonido click
    element.addEventListener("click", () => {

        const customSoundPath = element.dataset.clickSound;

        if (customSoundPath) {

            // revisa si el elemento tiene data-click-sound / sonido prsonalizado
            const customSound = new Audio(customSoundPath);

            customSound.volume =
                CLICK_SOUND_VOLUME * getGameVolume();

            customSound.play().catch(() => {});

        } else {

            defaultClickSound.currentTime = 0;

            defaultClickSound.play().catch(() => {});

        }

    });

});