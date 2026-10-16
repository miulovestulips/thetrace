const optionsContent = document.querySelector(".options-content");

const scoresContent = document.getElementById("scores-content");

const scoresButton = document.getElementById("scores-button");

const optionsButton = document.getElementById("options-button");

const scoreValue = document.getElementById("score-value");


/* ABRIR PUNTUACIONES */

scoresButton.addEventListener("click", () => {

    optionsContent.classList.add("options-content-hidden");

    scoresContent.classList.add("scores-content-open");

});


/* RESTAURAR PANEL PRINCIPAL */

function showMainOptions() {

    optionsContent.classList.remove("options-content-hidden");

    scoresContent.classList.remove("scores-content-open");

}


/*
    Al volver a abrir/cerrar Opciones,
    restauramos siempre su vista principal.
*/

optionsButton.addEventListener("click", () => {

    showMainOptions();

});


/* ACTUALIZAR PUNTUACIÓN */

export function updateScoreDisplay(score) {

    const validScore = Math.max(0, Number(score) || 0);

    scoreValue.textContent = validScore;

}


/* Valor inicial */

updateScoreDisplay(0);