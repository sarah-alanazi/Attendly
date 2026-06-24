<?php
// backend/config/env.php
declare(strict_types=1);

function env_load(string $envPath): array {
  if (!is_file($envPath)) return [];

  $vars = [];
  $lines = file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
  foreach ($lines as $line) {
    $line = trim($line);
    if ($line === '' || str_starts_with($line, '#')) continue;

    $pos = strpos($line, '=');
    if ($pos === false) continue;

    $key = trim(substr($line, 0, $pos));
    $val = trim(substr($line, $pos + 1));

    
    if ((str_starts_with($val, '"') && str_ends_with($val, '"')) ||
        (str_starts_with($val, "'") && str_ends_with($val, "'"))) {
      $val = substr($val, 1, -1);
    }

    $vars[$key] = $val;
  }
  return $vars;
}

function env_get(string $key, $default = null) {
  static $cached = null;

  if ($cached === null) {
    $root = dirname(__DIR__, 2); // attendly/
    $envPath = $root . DIRECTORY_SEPARATOR . '.env';
    $cached = env_load($envPath);
  }

  return $cached[$key] ?? $default;
}
