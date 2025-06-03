<?php

// Turn on Error Reporting
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header('Content-Type: application/json');

// DB Connection
require 'config.php';

// Store incoming data
$input = json_decode(file_get_contents("php://input"), true);
$firstname = $input['fn'];
$lastname  = $input['ln'];
$email     = $input['e'];
$username  = $input['u'];
$password  = password_hash($input['p'], PASSWORD_DEFAULT);


// Check if Username is already in use
$query = $mysqli->prepare("SELECT ID FROM user WHERE username = ?");
$query->bind_param("s", $username);
$result = $query->execute();

if (mysqli_num_rows($result) > 0) 
{
    echo json_encode(['status' => false, 'reason' => 'duplicate']);
    exit;
}
else
{
    // Add New User to Database
    $query = $mysqli->prepare("INSERT INTO user (ID, firstname, lastname, username, password, email, desktop_layout) VALUES (NULL, ?, ?, ?, ?, ?, ?)");
    $query->bind_param("ssssss", $firstname, $lastname, $username, $password, $email, '[]');
    $result = $query->execute();

    // Status Check
    if ($result) 
    {
        echo json_encode(['status' => true]);
        exit;
    }
    else
    {
        error_log("MySQL Error: " . $query->error);
        echo json_encode(['status' => false, 'reason' => 'unknown']);
        exit;
    }
}

?>