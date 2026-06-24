<?php
declare(strict_types=1);

require_once __DIR__ . '/../../config/session.php';
require_once __DIR__ . '/../../helpers/response.php';

function require_admin(): array {
  session_start_safe();

  if (!isset($_SESSION['user'])) {
    json_response(['success' => false, 'message' => 'Unauthorized'], 401);
  }

  $u = $_SESSION['user'];
  if (($u['role'] ?? '') !== 'admin') {
    json_response(['success' => false, 'message' => 'Forbidden'], 403);
  }

  return $u;
}

function read_json_body(): array {
  $raw = file_get_contents('php://input');
  if (!$raw) return [];
  $data = json_decode($raw, true);
  return is_array($data) ? $data : [];
}

function get_pdo(): PDO {
  if (function_exists('db')) {
    $pdo = db();
    if ($pdo instanceof PDO) return $pdo;
  }

  if (isset($GLOBALS['pdo']) && $GLOBALS['pdo'] instanceof PDO) {
    return $GLOBALS['pdo'];
  }

  throw new Exception('Database connection not found');
}