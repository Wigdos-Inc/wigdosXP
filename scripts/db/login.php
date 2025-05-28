<?php

header('Content-Type: application/json');

// DB Connection
require 'config.php';


// Store incoming data
$input = json_decode(file_get_contents("php://input"), true);
$username = $input['u'];
$password = $input['p'];


// Check if Username and Password match
$query  = "SELECT password FROM user WHERE username = '$username'";
$result = mysqli_query($mysqli, $query);

if ($result) 
{
    if (mysqli_num_rows($result) === 1)
    {
        $item = mysqli_fetch_assoc($result);

        if (password_verify($password, $item['password']))
        {
            echo json_encode(['status' => true]);
            exit;
        }
    }
    
    // Runs if Username or Password doesn't match
    echo json_encode(['status' => false, 'reason' => 'invalid']);
    exit;
}
else
{
    // Respond with and log Query Error
    error_log("MySQL Error: " . mysqli_error($mysqli));
    echo json_encode(['status' => false, 'reason' => 'unknown']);
    exit;
}

?>