<?php

// sesión exclusiva para THE TRACE
session_name("THETRACESESSID");

session_set_cookie_params([
    "path" => "/",
    "httponly" => true,
    "samesite" => "Lax"
]);

session_start();

?>