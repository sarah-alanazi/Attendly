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

  $appealId = (int)($_GET['appeal_id'] ?? 0);
  if ($appealId <= 0) {
    json_response(['success' => false, 'message' => 'Invalid appeal id'], 422);
  }

  $sql = "
    SELECT
      ap.appeal_id,
      ap.record_id,
      ap.student_id,
      ap.reason,
      ap.evidence_url,
      ap.status,
      ap.review_note,
      ap.created_at,
      ap.reviewed_at,
      CONCAT(u.first_name, ' ', u.last_name) AS student_name,
      u.email AS student_email,
      c.course_name,
      cl.section
    FROM attendance_appeals ap
    INNER JOIN users u ON u.user_id = ap.student_id
    INNER JOIN attendance_records ar ON ar.record_id = ap.record_id
    INNER JOIN attendance_sessions s ON s.session_id = ar.session_id
    INNER JOIN classes cl ON cl.class_id = s.class_id
    INNER JOIN courses c ON c.course_id = cl.course_id
    WHERE ap.appeal_id = :appeal_id
    LIMIT 1
  ";

  $stmt = $pdo->prepare($sql);
  $stmt->bindValue(':appeal_id', $appealId, PDO::PARAM_INT);
  $stmt->execute();

  $item = $stmt->fetch(PDO::FETCH_ASSOC);

  if (!$item) {
    json_response(['success' => false, 'message' => 'Appeal not found'], 404);
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