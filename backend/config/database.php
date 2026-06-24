<?php

declare(strict_types=1);

require_once __DIR__ . '/env.php';

function db(): PDO {
  static $pdo = null;
  if ($pdo instanceof PDO) return $pdo;

  $host = (string) env_get('DB_HOST', '127.0.0.1');
  $port = (string) env_get('DB_PORT', '3307');
  $name = (string) env_get('DB_NAME', 'attendly');
  $user = (string) env_get('DB_USER', 'root');
  $pass = (string) env_get('DB_PASS', '');
  $charset = (string) env_get('DB_CHARSET', 'utf8mb4');

  $dsn = "mysql:host={$host};port={$port};dbname={$name};charset={$charset}";

  $options = [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES => false,
  ];

  $pdo = new PDO($dsn, $user, $pass, $options);
  return $pdo;
}
