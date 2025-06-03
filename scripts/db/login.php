<?php

header('Content-Type: application/json');

// DB Connection
require 'config.php';


// Store incoming data
$input = json_decode(file_get_contents("php://input"), true);
$username = $input['u'];
$password = $input['p'];


// Check if Username and Password match
$query = $mysqli->prepare("SELECT password FROM user WHERE username = ?");
$query->bind_param("s", $username);
$result = $query->execute();

if ($result) 
{
    $result = $query->get_result();
    if ($result->num_rows === 1)
    {
        $item = $result->fetch_assoc();

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