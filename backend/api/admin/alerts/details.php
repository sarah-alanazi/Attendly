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

  $alertId = (int)($_GET['alert_id'] ?? 0);
  if ($alertId <= 0) {
    json_response(['success' => false, 'message' => 'Invalid alert id'], 422);
  }

  $sql = "
    SELECT
      a.alert_id,
      a.student_id,
      a.class_id,
      a.alert_type,
      a.description,
      a.generated_at,
      a.resolved,
      CONCAT(u.first_name, ' ', u.last_name) AS student_name,
      u.email AS student_email,
      c.course_name,
      cl.section
    FROM attendance_alerts a
    INNER JOIN users u ON u.user_id = a.student_id
    INNER JOIN classes cl ON cl.class_id = a.class_id
    INNER JOIN courses c ON c.course_id = cl.course_id
    WHERE a.alert_id = :alert_id
    LIMIT 1
  ";

  $stmt = $pdo->prepare($sql);
  $stmt->bindValue(':alert_id', $alertId, PDO::PARAM_INT);
  $stmt->execute();

  $item = $stmt->fetch(PDO::FETCH_ASSOC);

  if (!$item) {
    json_response(['success' => false, 'message' => 'Alert not found'], 404);
  }

  json_response([
    'success' => true,
    'data' => [
      'item' => $item
    ]
  ]);

} catch (Throwable $e) {
  json_response(['success' => false, 'message' => $e->getMessage()], 500);
}