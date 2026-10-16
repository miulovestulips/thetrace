const optionsContent = document.querySelector(".options-content");

const scoresContent = document.getElementById("scores-content");

const profileContent = document.getElementById("profile-content");


const profileButton = document.getElementById("profile-button");

const optionsButton = document.getElementById("options-button");


const profileForm = document.getElementById("profile-form");

const editProfileButton = document.getElementById("edit-profile-button");

const cancelProfileButton = document.getElementById(
    "cancel-profile-button"
);


const usernameInput = document.getElementById("profile-username");

const emailInput = document.getElementById("profile-email");

const passwordInput = document.getElementById("profile-password");

const confirmPasswordInput = document.getElementById(
    "profile-confirm-password"
);


/*
    Valores originales.

    Los guardamos para poder recuperarlos
    si el usuario presiona Cancelar.
*/

let originalUsername = usernameInput.value;
let originalEmail = emailInput.value;


/* ABRIR PERFIL */

profileButton.addEventListener("click", () => {

    optionsContent.classList.add("options-content-hidden");

    scoresContent.classList.remove("scores-content-open");

    profileContent.classList.add("profile-content-open");

});


/* ENTRAR EN MODO EDICIÓN */

editProfileButton.addEventListener("click", () => {

    originalUsername = usernameInput.value;
    originalEmail = emailInput.value;

    profileContent.classList.add("profile-editing");


    usernameInput.readOnly = false;
    emailInput.readOnly = false;

    /*
        Nunca mostramos la contraseña actual.
        Este campo pasa a utilizarse para escribir
        una contraseña NUEVA.
    */

    passwordInput.readOnly = false;

    passwordInput.type = "password";
    passwordInput.value = "";
    passwordInput.placeholder = "Nueva contraseña";


    confirmPasswordInput.value = "";


    usernameInput.focus();

});


/* CANCELAR */

cancelProfileButton.addEventListener("click", () => {

    usernameInput.value = originalUsername;
    emailInput.value = originalEmail;

    exitEditMode();

});


/* CONFIRMAR */

profileForm.addEventListener("submit", async (event) => {

    event.preventDefault();


    const username = usernameInput.value.trim();

    const email = emailInput.value.trim();

    const password = passwordInput.value;

    const confirmPassword = confirmPasswordInput.value;


    if (!username || !email) {

        console.log("Usuario y correo son obligatorios");

        return;
    }


    if (password && password !== confirmPassword) {

        console.log("Las contraseñas no coinciden");

        return;
    }


    const datos = new FormData();

    datos.append(
        "nombre_usuario",
        username
    );

    datos.append(
        "correo",
        email
    );

    datos.append(
        "contrasena",
        password
    );


    try {

        const respuesta = await fetch(
            "./php/updateProfile.php",
            {
                method: "POST",
                body: datos
            }
        );


        const resultado =
            await respuesta.json();


        if (!resultado.ok) {

            console.log(resultado.mensaje);

            return;
        }


        console.log(resultado.mensaje);


        originalUsername = username;
        originalEmail = email;


        // actualizar también el nombre mostrado en el panel del servidor

        const serverUsername =
            document.getElementById("server-username");

        serverUsername.textContent = username;


        exitEditMode();

    }
    catch (error) {

        console.error(
            "Error al actualizar el perfil:",
            error
        );

    }

});


/* SALIR DEL MODO EDICIÓN */

function exitEditMode() {

    profileContent.classList.remove("profile-editing");


    usernameInput.readOnly = true;
    emailInput.readOnly = true;

    passwordInput.readOnly = true;


    /*
        No conservamos nunca la contraseña
        escrita en pantalla.
    */

    passwordInput.type = "text";
    passwordInput.value = "••••••••";
    passwordInput.placeholder = "";


    confirmPasswordInput.value = "";

}


/* RESTAURAR VISTA PRINCIPAL */

function showMainOptions() {

    optionsContent.classList.remove("options-content-hidden");

    profileContent.classList.remove("profile-content-open");

    exitEditMode();

}


optionsButton.addEventListener("click", () => {

    showMainOptions();

});