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

  $course_name = trim((string)($data['course_name'] ?? ''));
  $credits = (int)($data['credits'] ?? -1);
  $semester = trim((string)($data['semester'] ?? ''));
  $academic_year = trim((string)($data['academic_year'] ?? ''));

  if ($course_name === '' || $semester === '' || $academic_year === '' || $credits < 0) {
    json_response(['success' => false, 'message' => 'Missing or invalid fields'], 422);
  }

  $chk = $pdo->prepare("
    SELECT COUNT(*)
    FROM courses
    WHERE course_name = :n AND semester = :s AND academic_year = :y
  ");
  $chk->execute([':n' => $course_name, ':s' => $semester, ':y' => $academic_year]);
  if ((int)$chk->fetchColumn() > 0) {
    json_response(['success' => false, 'message' => 'Course already exists for this semester/year'], 409);
  }

  $stmt = $pdo->prepare("
    INSERT INTO courses (course_name, credits, semester, academic_year)
    VALUES (:n, :c, :s, :y)
  ");
  $stmt->execute([
    ':n' => $course_name,
    ':c' => $credits,
    ':s' => $semester,
    ':y' => $academic_year
  ]);

  json_response(['success' => true, 'message' => 'Course created']);

} catch (Throwable $e) {
  json_response(['success' => false, 'message' => $e->getMessage()], 500);
}