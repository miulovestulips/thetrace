import { navigateWithLoading } from "../ui/loading.js";


const exitButton =
    document.getElementById("exit-button");


exitButton.addEventListener("click", async () => {

    exitButton.disabled = true;


    try {

        // pide a PHP destruir la sesión
        const response = await fetch(
            "./php/logout.php",
            {
                method: "POST"
            }
        );


        const data = await response.json();


        if (!response.ok || !data.ok) {

            throw new Error(
                data.mensaje ||
                "No se pudo cerrar la sesión"
            );
        }


        // una vez destruida la sesión regresa al login usando tu pantalla de carga
        navigateWithLoading("index.html");

    }
    catch (error) {

        console.error(
            "Error al cerrar sesión:",
            error
        );


        alert(
            "No se pudo cerrar la sesión"
        );


        exitButton.disabled = false;
    }

});