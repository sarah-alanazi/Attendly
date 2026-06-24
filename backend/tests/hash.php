<?php
declare(strict_types=1);

require_once __DIR__ . '/../helper/security.php';

$password = $_GET['p'] ?? '12345678';

echo "<pre>";
echo "Password: " . htmlspecialchars($password) . "\n";
echo "Hash:\n";
echo hash_password($password);
echo "</pre>";
