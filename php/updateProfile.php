<?php

require_once("session.php");
require_once("conexion.php");

header("Content-Type: application/json; charset=utf-8");


if (!isset($_SESSION["id_usuario"])) {

    http_response_code(401);

    echo json_encode([
        "ok" => false,
        "mensaje" => "Sesión no válida"
    ]);

    exit;
}


if ($_SERVER["REQUEST_METHOD"] !== "POST") {

    http_response_code(405);

    echo json_encode([
        "ok" => false,
        "mensaje" => "Método no permitido"
    ]);

    exit;
}


$idUsuario = $_SESSION["id_usuario"];

$nombreUsuario = trim(
    $_POST["nombre_usuario"] ?? ""
);

$correo = trim(
    $_POST["correo"] ?? ""
);

$contrasena =
    $_POST["contrasena"] ?? "";


if (
    $nombreUsuario === "" ||
    $correo === ""
) {

    echo json_encode([
        "ok" => false,
        "mensaje" => "Usuario y correo son obligatorios"
    ]);

    exit;
}


if (!filter_var($correo, FILTER_VALIDATE_EMAIL)) {

    echo json_encode([
        "ok" => false,
        "mensaje" => "Correo no válido"
    ]);

    exit;
}


try {

    $conn = conexion();


    /*
        Comprobar que otro usuario no tenga
        el mismo nombre o correo.
    */

    $stmt = $conn->prepare(
        "SELECT id_usuario
         FROM usuarios
         WHERE
            (nombre_usuario = ? OR correo = ?)
            AND id_usuario != ?"
    );

    $stmt->bind_param(
        "ssi",
        $nombreUsuario,
        $correo,
        $idUsuario
    );

    $stmt->execute();

    $resultado = $stmt->get_result();


    if ($resultado->num_rows > 0) {

        echo json_encode([
            "ok" => false,
            "mensaje" => "El usuario o correo ya está registrado"
        ]);

        $stmt->close();
        $conn->close();

        exit;
    }


    $stmt->close();


    /*
        Si escribió una contraseña nueva,
        también actualizarla.
    */

    if ($contrasena !== "") {

        $passwordHash =
            password_hash(
                $contrasena,
                PASSWORD_DEFAULT
            );


        $stmt = $conn->prepare(
            "UPDATE usuarios
             SET
                nombre_usuario = ?,
                correo = ?,
                password_hash = ?
             WHERE id_usuario = ?"
        );

        $stmt->bind_param(
            "sssi",
            $nombreUsuario,
            $correo,
            $passwordHash,
            $idUsuario
        );

    } else {

        /*
            Si no escribió contraseña,
            conservar la actual.
        */

        $stmt = $conn->prepare(
            "UPDATE usuarios
             SET
                nombre_usuario = ?,
                correo = ?
             WHERE id_usuario = ?"
        );

        $stmt->bind_param(
            "ssi",
            $nombreUsuario,
            $correo,
            $idUsuario
        );
    }


    $stmt->execute();


    /*
        Actualizar también el nombre
        guardado en sesión.
    */

    $_SESSION["nombre_usuario"] =
        $nombreUsuario;


    echo json_encode([
        "ok" => true,
        "mensaje" => "Perfil actualizado correctamente"
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