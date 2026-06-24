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

  $course_id = (int)($data['course_id'] ?? 0);
  if ($course_id <= 0) {
    json_response(['success' => false, 'message' => 'Invalid course_id'], 422);
  }

  $pdo->beginTransaction();

  $chk = $pdo->prepare("SELECT COUNT(*) FROM courses WHERE course_id = :id");
  $chk->execute([':id' => $course_id]);
  if ((int)$chk->fetchColumn() === 0) {
    $pdo->rollBack();
    json_response(['success' => false, 'message' => 'Course not found'], 404);
  }

  $hasClasses = $pdo->prepare("SELECT COUNT(*) FROM classes WHERE course_id = :id");
  $hasClasses->execute([':id' => $course_id]);
  if ((int)$hasClasses->fetchColumn() > 0) {
    $pdo->rollBack();
    json_response(['success' => false, 'message' => 'Cannot delete: course has classes'], 409);
  }

  $delAssign = $pdo->prepare("DELETE FROM instructor_course WHERE course_id = :id");
  $delAssign->execute([':id' => $course_id]);

  $del = $pdo->prepare("DELETE FROM courses WHERE course_id = :id");
  $del->execute([':id' => $course_id]);

  $pdo->commit();

  json_response(['success' => true, 'message' => 'Course deleted']);

} catch (Throwable $e) {
  if (isset($pdo) && $pdo instanceof PDO && $pdo->inTransaction()) {
    $pdo->rollBack();
  }
  json_response(['success' => false, 'message' => $e->getMessage()], 500);
}