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
  $class_id = (int)($_GET['class_id'] ?? 0);
  if ($class_id <= 0) json_response(['success' => false, 'message' => 'Invalid class_id'], 422);

  $stmt = $pdo->prepare("
    SELECT session_id, class_id, instructor_id, session_date, start_time, end_time, status
    FROM attendance_sessions
    WHERE class_id = :cid
    ORDER BY session_date DESC, session_id DESC
    LIMIT 100
  ");
  $stmt->execute([':cid' => $class_id]);
  $items = $stmt->fetchAll(PDO::FETCH_ASSOC);

  json_response(['success' => true, 'data' => ['items' => $items]]);

} catch (Throwable $e) {
  json_response(['success' => false, 'message' => $e->getMessage()], 500);
}