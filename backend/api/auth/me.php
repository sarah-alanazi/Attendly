<?php
// backend/api/auth/me.php
declare(strict_types=1);

require_once __DIR__ . '/../../config/session.php';
require_once __DIR__ . '/../../helpers/response.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
  json_response(['success' => false, 'error' => 'Method not allowed'], 405);
}

session_start_safe();

$user = $_SESSION['user'] ?? null;

if (!$user) {
  json_response(['success' => false, 'error' => 'Unauthorized.'], 401);
}

json_response(['success' => true, 'user' => $user]);
