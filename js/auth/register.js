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
    "/php/registro.php", // <- Quita el punto y pon una barra inclinada
    { method: "POST", body: formData }

        );


        // lee la respuesta como texto (para ver qué devuelve de verdad)
        const texto = await response.text();


        // si NO es 200, muestra qué devolvió el servidor
        if (!response.ok) {

            console.error(
                "HTTP", response.status,
                "Respuesta:", texto.slice(0, 500)
            );

            alert("Error del servidor: " + response.status);

            return;
        }


        // intenta parsear como JSON
        let data;

        try {
            data = JSON.parse(texto);
        }
        catch (e) {

            console.error(
                "La respuesta no es JSON válido:",
                texto.slice(0, 500)
            );

            alert("El servidor no devolvió JSON válido");

            return;
        }


        // registro rechazado por PHP
        if (!data.ok) {

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