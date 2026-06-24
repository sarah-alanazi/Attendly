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

  $enrollment_id = (int)($data['enrollment_id'] ?? 0);
  if ($enrollment_id <= 0) json_response(['success' => false, 'message' => 'Invalid enrollment_id'], 422);

  $chk = $pdo->prepare("SELECT COUNT(*) FROM class_enrollment WHERE enrollment_id = :id");
  $chk->execute([':id' => $enrollment_id]);
  if ((int)$chk->fetchColumn() === 0) json_response(['success' => false, 'message' => 'Enrollment not found'], 404);

  $del = $pdo->prepare("DELETE FROM class_enrollment WHERE enrollment_id = :id");
  $del->execute([':id' => $enrollment_id]);

  json_response(['success' => true, 'message' => 'Enrollment removed']);

} catch (Throwable $e) {
  json_response(['success' => false, 'message' => $e->getMessage()], 500);
}