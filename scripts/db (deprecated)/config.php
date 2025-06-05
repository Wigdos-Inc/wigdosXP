<?php

// Make errors visible
ini_set('display_errors', 0);
error_reporting(E_ALL);

// DB Connection Info
$db_hostname = 'localhost';
$db_username = 'main';
$db_password = 'wiggleLock22';
$db_database = 'wigdos';

// Wigdos Link: https://stu102871.github.io/wigdosXP/
// Testing Link: https://102871.stu.sd-lab.nl/personal/wigdosXP/
// PMA Link:    https://pma.sd-lab.nl/index.php?route=/sql&pos=0&db=wigdos&table=user

// Connect to DB
$mysqli = mysqli_connect($db_hostname,$db_username,$db_password,$db_database);

// Display potential error
if (!$mysqli) {
    die("Connection failed: " . mysqli_connect_error());
}

$mysqli->set_charset("utf8mb4");

?>