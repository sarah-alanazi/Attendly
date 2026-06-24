<?php
declare(strict_types=1);

header("Content-Type: text/plain; charset=utf-8");

$url = "http://localhost:8080/attendly/backend/api/auth/login.php";
$data = json_encode(["username" => "admin", "password" => "12345678"]);

$opts = [
  "http" => [
    "method" => "POST",
    "header" => "Content-Type: application/json\r\n",
    "content" => $data,
    "ignore_errors" => true 
  ]
];

$context = stream_context_create($opts);
$result = file_get_contents($url, false, $context);

echo "HTTP Headers:\n";
print_r($http_response_header ?? []);
echo "\n\nResponse Body:\n";
echo $result ?: "(empty)";
