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
  $session_id = (int)($_GET['session_id'] ?? 0);
  if ($session_id <= 0) json_response(['success' => false, 'message' => 'Invalid session_id'], 422);

  $stmt = $pdo->prepare("
    SELECT
      ar.record_id,
      ar.session_id,
      ar.student_id,
      ar.status,
      ar.scan_at,
      ar.within_campus,
      ar.reliability_color,
      u.username,
      u.first_name,
      u.last_name,
      CONCAT(u.first_name,' ',u.last_name) AS student_name
    FROM attendance_records ar
    JOIN users u ON u.user_id = ar.student_id AND u.role='student'
    WHERE ar.session_id = :sid
    ORDER BY ar.record_id DESC
    LIMIT 500
  ");
  $stmt->execute([':sid' => $session_id]);
  $items = $stmt->fetchAll(PDO::FETCH_ASSOC);

  json_response(['success' => true, 'data' => ['items' => $items]]);

} catch (Throwable $e) {
  json_response(['success' => false, 'message' => $e->getMessage()], 500);
}