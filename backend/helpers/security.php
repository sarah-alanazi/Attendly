<?php
// backend/helpers/security.php
declare(strict_types=1);

function hash_password(string $plain): string {
  return password_hash($plain, PASSWORD_BCRYPT);
}

function verify_password(string $plain, string $hash): bool {
  return password_verify($plain, $hash);
}
