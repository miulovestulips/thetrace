const startGameButton = document.getElementById("start-game-button");

const normalButton = document.getElementById("normal-button");
const hardButton = document.getElementById("hard-button");

const difficultyMenu = document.getElementById("difficulty-menu");
const optionsMenu = document.getElementById("options-menu");
const serverMenu = document.getElementById("server-menu");


// Abrir selector de dificultad
startGameButton.addEventListener("click", () => {

    optionsMenu.classList.remove("options-menu-open");
    serverMenu.classList.remove("server-menu-open");

    difficultyMenu.classList.toggle("difficulty-menu-open");

});


// Modo normal
normalButton.addEventListener("click", () => {

    localStorage.setItem("difficulty", "normal");

    difficultyMenu.classList.remove("difficulty-menu-open");
    serverMenu.classList.add("server-menu-open");

});


// Modo difícil
hardButton.addEventListener("click", () => {

    localStorage.setItem("difficulty", "hard");

    difficultyMenu.classList.remove("difficulty-menu-open");
    serverMenu.classList.add("server-menu-open");

});