<?php
// backend/middleware/role_guard.php
declare(strict_types=1);

require_once __DIR__ . '/../helpers/response.php';

function require_role(string $role): void {
  $user = $_SESSION['user'] ?? null;
  if (!$user || ($user['role'] ?? '') !== $role) {
    json_response(['success' => false, 'error' => 'Forbidden.'], 403);
  }
}
