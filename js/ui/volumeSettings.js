import {
    setupVolumeControl
} from "./volumeControl.js"; // funcion perteneciente a volumeControl.js,configura un control d volumen


import {
    getGameVolumeLevel,
    setGameVolumeLevel,
    getMusicVolumeLevel,
    setMusicVolumeLevel
} from "../audio/audioSettings.js"; //importa funciones de audioSettings.js para nivel d volumen de juego y musica


/* VOLUMEN DE JUEGO */

setupVolumeControl({

    buttonId: "game-volume-button", // el boton que controla este volumen tiene este id

    iconId: "game-volume-icon", // imagen q representa estado d volumen (mute o con sonido)

    barId: "game-volume-bar", // foto de barra representa el nivel d volumen

    getLevel: getGameVolumeLevel,

    setLevel: setGameVolumeLevel,

    changeEvent: "game-volume-change"

});


/* VOLUMEN DE MÚSICA */

setupVolumeControl({

    buttonId: "music-volume-button",

    iconId: "music-volume-icon",

    barId: "music-volume-bar",

    getLevel: getMusicVolumeLevel,

    setLevel: setMusicVolumeLevel,

    changeEvent: "music-volume-change"

});