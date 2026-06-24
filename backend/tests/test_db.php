<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';

try {
  $pdo = db();

  $stmt = $pdo->query("SELECT 1 AS ok");
  $row = $stmt->fetch();

  echo "<pre>";
  echo "DB Connection: OK\n";
  echo "SELECT 1 Result: " . ($row['ok'] ?? 'NULL') . "\n";
  echo "</pre>";
} catch (Throwable $e) {
  http_response_code(500);
  echo "<pre>";
  echo "DB Connection: FAILED\n";
  echo "Error: " . $e->getMessage() . "\n";
  echo "</pre>";
}
