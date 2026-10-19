<?php
function conexion() {
    // Datos por defecto de XAMPP
    $host = "localhost";
    $port = "3306";
    $name = "thetrace_db";
    $user = "root";
    $pass = ""; // En XAMPP la contraseña de root suele estar vacía

    try {
        $dsn = "mysql:host=$host;port=$port;dbname=$name;charset=utf8mb4";
        $conn = new PDO($dsn, $user, $pass);
        $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        return $conn;
    } catch (PDOException $e) {
        die(json_encode(["ok" => false, "mensaje" => "Error de conexión: " . $e->getMessage()]));
    }
}
?>
