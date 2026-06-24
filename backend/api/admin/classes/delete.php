<?php
declare(strict_types=1);

require_once __DIR__ . '/../_guard.php';
require_once __DIR__ . '/../../../config/database.php';
require_once __DIR__ . '/../../../helpers/response.php';

require_admin();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  json_response(['success' => false, 'message' => 'Method not allowed'], 405);
}

try {
  $pdo = get_pdo();
  $data = read_json_body();

  $class_id = (int)($data['class_id'] ?? 0);
  if ($class_id <= 0) json_response(['success' => false, 'message' => 'Invalid class_id'], 422);

  $pdo->beginTransaction();

  $chk = $pdo->prepare("SELECT COUNT(*) FROM classes WHERE class_id = :id");
  $chk->execute([':id' => $class_id]);
  if ((int)$chk->fetchColumn() === 0) {
    $pdo->rollBack();
    json_response(['success' => false, 'message' => 'Class not found'], 404);
  }

  $hasEnroll = $pdo->prepare("SELECT COUNT(*) FROM class_enrollment WHERE class_id = :id");
  $hasEnroll->execute([':id' => $class_id]);
  if ((int)$hasEnroll->fetchColumn() > 0) {
    $pdo->rollBack();
    json_response(['success' => false, 'message' => 'Cannot delete: class has enrollments'], 409);
  }

  $hasSess = $pdo->prepare("SELECT COUNT(*) FROM attendance_sessions WHERE class_id = :id");
  $hasSess->execute([':id' => $class_id]);
  if ((int)$hasSess->fetchColumn() > 0) {
    $pdo->rollBack();
    json_response(['success' => false, 'message' => 'Cannot delete: class has attendance sessions'], 409);
  }

  $del = $pdo->prepare("DELETE FROM classes WHERE class_id = :id");
  $del->execute([':id' => $class_id]);

  $pdo->commit();
  json_response(['success' => true, 'message' => 'Class deleted']);

} catch (Throwable $e) {
  if (isset($pdo) && $pdo instanceof PDO && $pdo->inTransaction()) $pdo->rollBack();
  json_response(['success' => false, 'message' => $e->getMessage()], 500);
}