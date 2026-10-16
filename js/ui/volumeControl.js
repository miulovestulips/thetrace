const MAX_VOLUME_LEVEL = 5;


function updateVolumeInterface(icon, bar, level) {

    bar.src = `assets/img/volumen${level}.png`;

    if (level === 0) {
        icon.src = "assets/img/novolumenjuegoicono.png";
    } else {
        icon.src = "assets/img/volumenjuegoicono.png";
    }

}


export function setupVolumeControl({
    buttonId,
    iconId,
    barId,
    getLevel,
    setLevel,
    changeEvent
}) {

    const button = document.getElementById(buttonId);
    const icon = document.getElementById(iconId);
    const bar = document.getElementById(barId);


    /*
        Evitamos errores si el control no existe
        en determinada página.
    */

    if (!button || !icon || !bar) {
        return;
    }


    let currentLevel = getLevel();


    updateVolumeInterface(
        icon,
        bar,
        currentLevel
    );


    button.addEventListener("click", () => {

        const nextLevel =
            (currentLevel + 1) % (MAX_VOLUME_LEVEL + 1);

        setLevel(nextLevel);

    });


    /*
        Si el volumen cambia desde cualquier otro
        lugar, esta interfaz también se actualiza.
    */

    window.addEventListener(changeEvent, (event) => {

        currentLevel = event.detail.level;

        updateVolumeInterface(
            icon,
            bar,
            currentLevel
        );

    });

}