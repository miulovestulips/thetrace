<?php
function conexion() {
    // ⚠️ REEMPLAZA ESTOS DATOS CON LOS QUE TE DA SUPABASE (Direct Connection)
    $host = "db.ijquelzgemtxxbpacuvg.supabase.co"; // Tu Host
    $port = "5432"; // Usualmente es 5432 o 6543
    $db   = "postgres"; 
    $user = "postgres"; // Tu Usuario
    $pass = "PudinRosa127"; // Tu contraseña

    try {
        $dsn = "pgsql:host=$host;port=$port;dbname=$db;";
        $conn = new PDO($dsn, $user, $pass);
        $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        return $conn;
    } catch (PDOException $e) {
        die(json_encode(["ok" => false, "mensaje" => "Error de conexión: " . $e->getMessage()]));
    }
}
?>