<?php

require_once("session.php");

header("Content-Type: application/json; charset=utf-8");


// elimina todas las variables de sesión
$_SESSION = [];


// elimina la cookie específica de THE TRACE
if (ini_get("session.use_cookies")) {

    $params = session_get_cookie_params();

    setcookie(
        session_name(),
        "",
        [
            "expires" => time() - 42000,
            "path" => $params["path"],
            "domain" => $params["domain"],
            "secure" => $params["secure"],
            "httponly" => $params["httponly"],
            "samesite" => "Lax"
        ]
    );
}


// destruye los datos de sesión del servidor
$destruida = session_destroy();


echo json_encode([
    "ok" => $destruida,
    "mensaje" => $destruida
        ? "Sesión cerrada correctamente"
        : "No se pudo destruir la sesión"
]);

?>