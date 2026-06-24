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
  $course_name = trim((string)($data['course_name'] ?? ''));
  $credits = (int)($data['credits'] ?? -1);
  $semester = trim((string)($data['semester'] ?? ''));
  $academic_year = trim((string)($data['academic_year'] ?? ''));

  if ($course_id <= 0) {
    json_response(['success' => false, 'message' => 'Invalid course_id'], 422);
  }

  if ($course_name === '' || $semester === '' || $academic_year === '' || $credits < 0) {
    json_response(['success' => false, 'message' => 'Missing or invalid fields'], 422);
  }

  $exists = $pdo->prepare("SELECT COUNT(*) FROM courses WHERE course_id = :id");
  $exists->execute([':id' => $course_id]);
  if ((int)$exists->fetchColumn() === 0) {
    json_response(['success' => false, 'message' => 'Course not found'], 404);
  }

  $dup = $pdo->prepare("
    SELECT COUNT(*)
    FROM courses
    WHERE course_name = :n AND semester = :s AND academic_year = :y
      AND course_id <> :id
  ");
  $dup->execute([':n' => $course_name, ':s' => $semester, ':y' => $academic_year, ':id' => $course_id]);
  if ((int)$dup->fetchColumn() > 0) {
    json_response(['success' => false, 'message' => 'Another course with same name/semester/year exists'], 409);
  }

  $stmt = $pdo->prepare("
    UPDATE courses
    SET course_name = :n, credits = :c, semester = :s, academic_year = :y
    WHERE course_id = :id
  ");
  $stmt->execute([
    ':n' => $course_name,
    ':c' => $credits,
    ':s' => $semester,
    ':y' => $academic_year,
    ':id' => $course_id
  ]);

  json_response(['success' => true, 'message' => 'Course updated']);

} catch (Throwable $e) {
  json_response(['success' => false, 'message' => $e->getMessage()], 500);
}