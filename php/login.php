<?php

require_once("session.php");

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


// recibir datos

$nombreUsuario = trim(
    $_POST["nombre_usuario"] ?? ""
);

$contrasena =
    $_POST["contrasena"] ?? "";


// valdiar campos

if (
    $nombreUsuario === "" ||
    $contrasena === ""
) {

    echo json_encode([
        "ok" => false,
        "mensaje" => "Completa todos los campos"
    ]);

    exit;
}


try {

    $conn = conexion();


// buscar usuario

    $stmt = $conn->prepare(
        "SELECT
            id_usuario,
            nombre_usuario,
            password_hash
         FROM usuarios
         WHERE nombre_usuario = ?"
    );

    $stmt->bind_param(
        "s",
        $nombreUsuario
    );

    $stmt->execute();

    $resultado = $stmt->get_result();


// usuario no encontrado

    if ($resultado->num_rows === 0) {

        echo json_encode([
            "ok" => false,
            "mensaje" => "Usuario o contraseña incorrectos"
        ]);

        $stmt->close();
        $conn->close();

        exit;
    }


    $usuario = $resultado->fetch_assoc();


// verificar contraseña

    if (
        !password_verify(
            $contrasena,
            $usuario["password_hash"]
        )
    ) {

        echo json_encode([
            "ok" => false,
            "mensaje" => "Usuario o contraseña incorrectos"
        ]);

        $stmt->close();
        $conn->close();

        exit;
    }


// cerrar sesion

    session_regenerate_id(true);

    $_SESSION["id_usuario"] =
        $usuario["id_usuario"];

    $_SESSION["nombre_usuario"] =
        $usuario["nombre_usuario"];


    echo json_encode([
        "ok" => true,
        "mensaje" => "Inicio de sesión correcto",
        "usuario" => [
            "id_usuario" =>
                $usuario["id_usuario"],

            "nombre_usuario" =>
                $usuario["nombre_usuario"]
        ]
    ]);


    $stmt->close();
    $conn->close();

}
catch (Exception $error) {

    http_response_code(500);

    echo json_encode([
        "ok" => false,
        "mensaje" => "Error interno del servidor"
    ]);
}

?>