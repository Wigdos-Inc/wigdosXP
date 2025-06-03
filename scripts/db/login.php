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
$query->execute();
$result = $query->get_result();

if ($result) 
{
    if ($result->num_rows === 1)
    {
        $item = $result->fetch_assoc();

// Debug output
echo json_encode([
    'status' => false,
    'reason' => 'debug',
    'input_password' => $password,
    'db_hash' => $item['password'],
    'verify_result' => password_verify($password, $item['password'])
]);
exit;

        if (password_verify($password, $item['password']))
        {
            echo json_encode(['status' => true]);
            exit;
        }
        else 
        {
            echo json_encode(['status' => false, 'reason' => 'pass']);
            exit;
        }
    }
    else 
    {
        echo json_encode(['status' => false, 'reason' => 'user']);
        exit;
    }
}
else
{
    // Respond with and log Query Error
    error_log("MySQL Error: " . mysqli_error($mysqli));
    echo json_encode(['status' => false, 'reason' => 'unknown']);
    exit;
}

?>