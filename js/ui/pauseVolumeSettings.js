import {
    setupVolumeControl
} from "./volumeControl.js";


import {
    getGameVolumeLevel,
    setGameVolumeLevel,
    getMusicVolumeLevel,
    setMusicVolumeLevel
} from "../audio/audioSettings.js";


/* VOLUMEN DE JUEGO */

setupVolumeControl({

    buttonId: "pause-game-volume-button",

    iconId: "pause-game-volume-icon",

    barId: "pause-game-volume-bar",

    getLevel: getGameVolumeLevel,

    setLevel: setGameVolumeLevel,

    changeEvent: "game-volume-change"

});


/* VOLUMEN DE MÚSICA */

setupVolumeControl({

    buttonId: "pause-music-volume-button",

    iconId: "pause-music-volume-icon",

    barId: "pause-music-volume-bar",

    getLevel: getMusicVolumeLevel,

    setLevel: setMusicVolumeLevel,

    changeEvent: "music-volume-change"

});