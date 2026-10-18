<?php

header("Content-Type: application/json; charset=utf-8");

include_once("conexion.php");


if ($_SERVER["REQUEST_METHOD"] !== "POST") {

    http_response_code(405);

    echo json_encode([
        "ok" => false,
        "mensaje" => "Método no permitido"
    ]);

    exit;
}


/* RECIBIR DATOS  */

$correo = trim($_POST["correo"] ?? "");

$nombreUsuario = trim(
    $_POST["nombre_usuario"] ?? ""
);

$contrasena = $_POST["contrasena"] ?? "";

$confirmarContrasena =
    $_POST["confirmar_contrasena"] ?? "";


/* VALIDACIONES */

if (
    $correo === "" ||
    $nombreUsuario === "" ||
    $contrasena === "" ||
    $confirmarContrasena === ""
) {

    echo json_encode([
        "ok" => false,
        "mensaje" => "Todos los campos son obligatorios"
    ]);

    exit;
}


if (!filter_var($correo, FILTER_VALIDATE_EMAIL)) {

    echo json_encode([
        "ok" => false,
        "mensaje" => "El correo no es válido"
    ]);

    exit;
}


if ($contrasena !== $confirmarContrasena) {

    echo json_encode([
        "ok" => false,
        "mensaje" => "Las contraseñas no coinciden"
    ]);

    exit;
}


try {

    $conn = conexion();


    /* COMPROBAR CORREO */

    $stmt = $conn->prepare(
        "SELECT id_usuario
         FROM usuarios
         WHERE correo = ?"
    );

    $stmt->bind_param(
        "s",
        $correo
    );

    $stmt->execute();

    $stmt->store_result();


    if ($stmt->num_rows > 0) {

        echo json_encode([
            "ok" => false,
            "mensaje" => "Ese correo ya está registrado"
        ]);

        $stmt->close();
        $conn->close();

        exit;
    }


    $stmt->close();


    /* COMPROBAR NOMBRE */

    $stmt = $conn->prepare(
        "SELECT id_usuario
         FROM usuarios
         WHERE nombre_usuario = ?"
    );

    $stmt->bind_param(
        "s",
        $nombreUsuario
    );

    $stmt->execute();

    $stmt->store_result();


    if ($stmt->num_rows > 0) {

        echo json_encode([
            "ok" => false,
            "mensaje" => "Ese nombre de usuario ya existe"
        ]);

        $stmt->close();
        $conn->close();

        exit;
    }


    $stmt->close();


    /* PROTEGER CONTRASEÑA */

    $passwordHash = password_hash(
        $contrasena,
        PASSWORD_DEFAULT
    );


    /* REGISTRAR USUARIO */

    $stmt = $conn->prepare(
        "INSERT INTO usuarios (
            correo,
            nombre_usuario,
            password_hash
        )
        VALUES (?, ?, ?)"
    );

    $stmt->bind_param(
        "sss",
        $correo,
        $nombreUsuario,
        $passwordHash
    );


    $stmt->execute();


    echo json_encode([
        "ok" => true,
        "mensaje" => "Usuario registrado correctamente"
    ]);


    $stmt->close();
    $conn->close();

}
catch (Exception $error) {

 error_log($error->getMessage());

    http_response_code(500);

    echo json_encode([
        "ok" => false,
        "mensaje" => "Error interno del servidor"
    ]);
}

?>