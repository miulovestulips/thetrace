<?php
function conexion() {
    mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

    $conn = new mysqli("127.0.0.1", "thetrace", "ClaveNueva123", "thetrace_db", 3306);
    $conn->set_charset("utf8mb4");

    return $conn;
}
?>