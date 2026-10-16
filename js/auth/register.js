const registerForm = document.getElementById("register-form");


// escucha el envío del formulario
registerForm.addEventListener("submit", async (event) => {

    // evita que el formulario recargue la página
    event.preventDefault();


    // obtiene los datos del formulario
    const email =
        document.getElementById("register-email").value.trim();

    const username =
        document.getElementById("register-username").value.trim();

    const password =
        document.getElementById("register-password").value;

    const confirmPassword =
        document.getElementById("register-confirm-password").value;


    // comprobación antes de mandar los datos al servidor
    if (password !== confirmPassword) {

        alert("Las contraseñas no coinciden");

        return;
    }


    // prepara los datos que recibirá registro.php
    const formData = new FormData();

    formData.append("correo", email);

    formData.append(
        "nombre_usuario",
        username
    );

    formData.append(
        "contrasena",
        password
    );

    formData.append(
        "confirmar_contrasena",
        confirmPassword
    );


    try {

        // manda los datos a PHP
        const response = await fetch(
            "./php/registro.php",
            {
                method: "POST",
                body: formData
            }
        );


        // convierte la respuesta de PHP a un objeto JS
        const data = await response.json();


        // registro rechazado por PHP
        if (!response.ok || !data.ok) {

            alert(
                data.mensaje ||
                "No se pudo registrar el usuario"
            );

            return;
        }


        // registro correcto
        alert(data.mensaje);


        // limpia el formulario
        registerForm.reset();


        // vuelve a la pantalla de inicio de sesión
        const loginLink =
            document.querySelector(".login-link");

        if (loginLink) {
            loginLink.click();
        }

    }
    catch (error) {

        console.error(
            "Error al registrar usuario:",
            error
        );

        alert(
            "No se pudo conectar con el servidor"
        );
    }

});