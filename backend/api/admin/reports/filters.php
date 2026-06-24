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

  $coursesSql = "
    SELECT
      c.course_id,
      c.course_name
    FROM courses c
    ORDER BY c.course_name ASC
  ";
  $coursesStmt = $pdo->query($coursesSql);
  $courses = $coursesStmt->fetchAll(PDO::FETCH_ASSOC);

  $classesSql = "
    SELECT
      cl.class_id,
      cl.section,
      cl.schedule_day,
      cl.room,
      c.course_name
    FROM classes cl
    INNER JOIN courses c ON c.course_id = cl.course_id
    ORDER BY c.course_name ASC, cl.section ASC
  ";
  $classesStmt = $pdo->query($classesSql);
  $classes = $classesStmt->fetchAll(PDO::FETCH_ASSOC);

  json_response([
    'success' => true,
    'data' => [
      'courses' => $courses,
      'classes' => $classes
    ]
  ]);

} catch (Throwable $e) {
  json_response(['success' => false, 'message' => $e->getMessage()], 500);
}