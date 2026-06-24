<?php
// backend/middleware/auth.php
declare(strict_types=1);

require_once __DIR__ . '/../config/session.php';
require_once __DIR__ . '/../helpers/response.php';

function require_auth(): void {
  session_start_safe();

  if (empty($_SESSION['user'])) {
    json_response(['success' => false, 'error' => 'Unauthorized. Please login again.'], 401);
  }
}
