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
  $instructor_id = (int)($data['instructor_id'] ?? 0);

  if ($course_id <= 0 || $instructor_id <= 0) {
    json_response(['success' => false, 'message' => 'Invalid course_id or instructor_id'], 422);
  }

  $chkCourse = $pdo->prepare("SELECT COUNT(*) FROM courses WHERE course_id = :id");
  $chkCourse->execute([':id' => $course_id]);
  if ((int)$chkCourse->fetchColumn() === 0) {
    json_response(['success' => false, 'message' => 'Course not found'], 404);
  }

  $chkUser = $pdo->prepare("SELECT role FROM users WHERE user_id = :id LIMIT 1");
  $chkUser->execute([':id' => $instructor_id]);
  $role = $chkUser->fetchColumn();
  if (!$role) {
    json_response(['success' => false, 'message' => 'Instructor not found'], 404);
  }
  if ($role !== 'instructor') {
    json_response(['success' => false, 'message' => 'Selected user is not an instructor'], 422);
  }

  $dup = $pdo->prepare("
    SELECT COUNT(*)
    FROM instructor_course
    WHERE instructor_id = :iid AND course_id = :cid
  ");
  $dup->execute([':iid' => $instructor_id, ':cid' => $course_id]);
  if ((int)$dup->fetchColumn() > 0) {
    json_response(['success' => false, 'message' => 'Instructor already assigned to this course'], 409);
  }

  $stmt = $pdo->prepare("
    INSERT INTO instructor_course (instructor_id, course_id, assigned_date)
    VALUES (:iid, :cid, CURDATE())
  ");
  $stmt->execute([':iid' => $instructor_id, ':cid' => $course_id]);

  json_response(['success' => true, 'message' => 'Instructor assigned']);

} catch (Throwable $e) {
  json_response(['success' => false, 'message' => $e->getMessage()], 500);
}