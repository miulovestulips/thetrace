const loginForm = document.getElementById("login-form");

// escucha el envío del formulario
loginForm.addEventListener("submit", async (event) => {

    // evita que el formulario recargue la página
    event.preventDefault();

    // obtiene los datos
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;

    // prepara los datos para PHP
    const formData = new FormData();
    formData.append("nombre_usuario", username);
    formData.append("contrasena", password);

    try {
        // manda usuario y contraseña al servidor (RUTA PARA XAMPP CON EL PUNTO)
        const response = await fetch(
            "./php/login.php", // <-- AQUÍ ESTÁ EL CAMBIO
            {
                method: "POST",
                body: formData
            }
        );

        // Leemos como texto primero para evitar el error "Unexpected token <"
        const texto = await response.text();

        if (!response.ok) {
            console.error("HTTP", response.status, "Respuesta:", texto.slice(0, 500));
            alert("Error del servidor: " + response.status);
            return;
        }

        let data;
        try {
            data = JSON.parse(texto);
        } catch (e) {
            console.error("La respuesta no es JSON válido:", texto.slice(0, 500));
            alert("El servidor no devolvió JSON válido");
            return;
        }

        // credenciales incorrectas
        if (!data.ok) {
            alert(data.mensaje || "No se pudo iniciar sesión");
            return;
        }

        // login correcto
        console.log("Sesión iniciada como:", data.usuario.nombre_usuario);

        // entra al menú principal 
        window.location.href = "inicio.html"; 

    } catch (error) {
        console.error("Error al iniciar sesión:", error);
        alert("No se pudo conectar con el servidor");
    }
});