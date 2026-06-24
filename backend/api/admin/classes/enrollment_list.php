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
    SELECT
      ce.enrollment_id,
      ce.student_id,
      ce.class_id,
      ce.enrolled_at,
      ce.status,
      u.username,
      u.first_name,
      u.last_name,
      CONCAT(u.first_name,' ',u.last_name) AS student_name
    FROM class_enrollment ce
    JOIN users u ON u.user_id = ce.student_id AND u.role='student'
    WHERE ce.class_id = :cid
    ORDER BY ce.status ASC, u.first_name ASC, u.last_name ASC
  ");
  $stmt->execute([':cid' => $class_id]);
  $items = $stmt->fetchAll(PDO::FETCH_ASSOC);

  json_response(['success' => true, 'data' => ['items' => $items]]);

} catch (Throwable $e) {
  json_response(['success' => false, 'message' => $e->getMessage()], 500);
}