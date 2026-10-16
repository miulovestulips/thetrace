const loginForm = document.getElementById("login-form");


// escucha el envío del formulario
loginForm.addEventListener("submit", async (event) => {

    // evita que el formulario recargue la página
    event.preventDefault();


    // obtiene los datos
    const username =
        document.getElementById("username").value.trim();

    const password =
        document.getElementById("password").value;


    // prepara los datos para PHP
    const formData = new FormData();

    formData.append(
        "nombre_usuario",
        username
    );

    formData.append(
        "contrasena",
        password
    );


    try {

        // manda usuario y contraseña al servidor
        const response = await fetch(
            "./php/login.php",
            {
                method: "POST",
                body: formData
            }
        );


        // recibe la respuesta de PHP
        const data = await response.json();


        // credenciales incorrectas
        if (!response.ok || !data.ok) {

            alert(
                data.mensaje ||
                "No se pudo iniciar sesión"
            );

            return;
        }


        // login correcto
        console.log(
            "Sesión iniciada como:",
            data.usuario.nombre_usuario
        );


        // entra al menú principal
        window.location.href = "inicio.php";

    }
    catch (error) {

        console.error(
            "Error al iniciar sesión:",
            error
        );

        alert(
            "No se pudo conectar con el servidor"
        );
    }

});