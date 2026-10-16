const optionsButton = document.getElementById("options-button");

const optionsMenu = document.getElementById("options-menu");

const difficultyMenu = document.getElementById("difficulty-menu");
const serverMenu = document.getElementById("server-menu");

const scoresContent = document.getElementById("scores-content");
const profileContent = document.getElementById("profile-content");


optionsButton.addEventListener("click", () => {

    // Cerrar los otros paneles principales
    difficultyMenu.classList.remove("difficulty-menu-open");
    serverMenu.classList.remove("server-menu-open");


    /*
        Si estamos dentro de una sección secundaria
        de Opciones, NO cerramos Opciones.

        scoresPanel.js y profilePanel.js se encargarán
        de regresar al contenido principal.
    */

    const isInsideSubmenu =
        scoresContent.classList.contains("scores-content-open") ||
        profileContent.classList.contains("profile-content-open");


    if (isInsideSubmenu) {

        // Asegurarnos de que Opciones permanezca abierto
        optionsMenu.classList.add("options-menu-open");

        return;
    }


    // Si ya estamos en el menú principal:
    // abrir / cerrar Opciones normalmente
    optionsMenu.classList.toggle("options-menu-open");

});