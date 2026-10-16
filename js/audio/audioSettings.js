const MAX_VOLUME_LEVEL = 5; // nivel maximo de volumen, el sistema trabaja con los niveles: 0, 1, 2, 3, 4, 5 || 0 = silencio, 5 = volumen mas alto

// claves para guardar la info en navegador
const GAME_VOLUME_KEY = "gameVolumeLevel";
const MUSIC_VOLUME_KEY = "musicVolumeLevel";

// recupera un nivel d volumen guardado en local storage y verifica q sea valido
function getStoredLevel(key, defaultLevel) {
    // busca si exsite un valor guardado con la clave
    const storedValue = localStorage.getItem(key);

    // si no lo tiene usa volumen predeterminado
    if (storedValue === null) {
        return defaultLevel;
    }

    const level = Number(storedValue);

    if (
        Number.isNaN(level) ||
        level < 0 ||
        level > MAX_VOLUME_LEVEL
    ) {
        return defaultLevel;
    }

    return level;
}


/* VOLUMEN DE JUEGO */

// devuelve nivel actual del volumen de juego, export permite q esta funcion sea utilizada en uiSounds.js
export function getGameVolumeLevel() {
    return getStoredLevel(GAME_VOLUME_KEY, 5);
}

// cambia y guarda el nivel del juego
export function setGameVolumeLevel(level) {
    localStorage.setItem(GAME_VOLUME_KEY, level);

    //evento que capta que cuando el volumen del juego cambia
    window.dispatchEvent(
        new CustomEvent("game-volume-change", {
            detail: {
                level: level,
                volume: level / MAX_VOLUME_LEVEL
            }
        })
    );
}


export function getGameVolume() {
    return getGameVolumeLevel() / MAX_VOLUME_LEVEL;
}


/* VOLUMEN DE MÚSICA, tdavia no implementada */

export function getMusicVolumeLevel() {
    return getStoredLevel(MUSIC_VOLUME_KEY, 5);
}


export function setMusicVolumeLevel(level) {
    localStorage.setItem(MUSIC_VOLUME_KEY, level);

    window.dispatchEvent(
        new CustomEvent("music-volume-change", {
            detail: {
                level: level,
                volume: level / MAX_VOLUME_LEVEL
            }
        })
    );
}


export function getMusicVolume() {
    return getMusicVolumeLevel() / MAX_VOLUME_LEVEL;
}