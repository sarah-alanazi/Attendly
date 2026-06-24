<?php
declare(strict_types=1);

require_once __DIR__ . '/../_guard.php';
require_once __DIR__ . '/../../../config/database.php';
require_once __DIR__ . '/../../../helpers/response.php';

require_admin();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
  json_response(['success' => false, 'message' => 'Method not allowed'], 405);
}

try {
  $pdo = get_pdo();
  $stmt = $pdo->query("
    SELECT course_id, course_name
    FROM courses
    ORDER BY course_name ASC, course_id DESC
  ");
  $items = $stmt->fetchAll(PDO::FETCH_ASSOC);

  json_response(['success' => true, 'data' => ['items' => $items]]);
} catch (Throwable $e) {
  json_response(['success' => false, 'message' => $e->getMessage()], 500);
}