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

  $course_id = (int)($_GET['course_id'] ?? 0);
  if ($course_id <= 0) {
    json_response(['success' => false, 'message' => 'Invalid course_id'], 422);
  }

  $sql = "
    SELECT
      ic.instructor_id,
      ic.assigned_date,
      u.username,
      u.first_name,
      u.last_name,
      CONCAT(u.first_name, ' ', u.last_name) AS instructor_name
    FROM instructor_course ic
    JOIN users u ON u.user_id = ic.instructor_id
    WHERE ic.course_id = :cid
    ORDER BY ic.assigned_date DESC, ic.instructor_course_id DESC
  ";

  $stmt = $pdo->prepare($sql);
  $stmt->execute([':cid' => $course_id]);
  $items = $stmt->fetchAll(PDO::FETCH_ASSOC);

  json_response(['success' => true, 'data' => ['items' => $items]]);

} catch (Throwable $e) {
  json_response(['success' => false, 'message' => $e->getMessage()], 500);
}