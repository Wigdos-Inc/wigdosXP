<?php

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
$query = "SELECT ID FROM user WHERE username = '$username'";
$result = mysqli_query($mysqli, $query);

if (mysqli_num_rows($result) > 0) 
{
    echo json_encode(['status' => false, 'reason' => 'duplicate']);
    exit;
}
else
{
    // Get base desktop layout
    $layout = file_get_contents('../desktop/layout.json');

    // Add New User to Database
    $query  = "INSERT INTO user";
    $query .= " (ID, firstname, lastname, username, password, email, desktop_layout)";
    $query .= " VALUES (NULL, '$firstname', '$lastname', '$username', '$password', '$email', '$layout')";
    $result = mysqli_query($mysqli, $query);

    // Status Check
    if ($result) 
    {
        echo json_encode(['status' => true]);
        exit;
    }
    else
    {
        error_log("MySQL Error: " . mysqli_error($mysqli));
        echo json_encode(['status' => false, 'reason' => 'unknown']);
        exit;
    }
}

?>