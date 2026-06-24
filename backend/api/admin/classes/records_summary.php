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

  $sql = "
    SELECT
      SUM(CASE WHEN ar.status = 'present' THEN 1 ELSE 0 END) AS present_cnt,
      SUM(CASE WHEN ar.status = 'late' THEN 1 ELSE 0 END) AS late_cnt,
      SUM(CASE WHEN ar.status = 'absent' THEN 1 ELSE 0 END) AS absent_cnt,
      SUM(CASE WHEN ar.reliability_color = 'green' THEN 1 ELSE 0 END) AS rel_green,
      SUM(CASE WHEN ar.reliability_color = 'yellow' THEN 1 ELSE 0 END) AS rel_yellow,
      SUM(CASE WHEN ar.reliability_color = 'red' THEN 1 ELSE 0 END) AS rel_red
    FROM attendance_records ar
    JOIN attendance_sessions s ON s.session_id = ar.session_id
    WHERE s.class_id = :cid
  ";

  $stmt = $pdo->prepare($sql);
  $stmt->execute([':cid' => $class_id]);
  $row = $stmt->fetch(PDO::FETCH_ASSOC) ?: [];

  json_response([
    'success' => true,
    'data' => [
      'present' => (int)($row['present_cnt'] ?? 0),
      'late' => (int)($row['late_cnt'] ?? 0),
      'absent' => (int)($row['absent_cnt'] ?? 0),
      'rel_green' => (int)($row['rel_green'] ?? 0),
      'rel_yellow' => (int)($row['rel_yellow'] ?? 0),
      'rel_red' => (int)($row['rel_red'] ?? 0),
    ]
  ]);

} catch (Throwable $e) {
  json_response(['success' => false, 'message' => $e->getMessage()], 500);
}