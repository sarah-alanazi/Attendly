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
  $course_id = (int)($data['course_id'] ?? 0);
  $section = trim((string)($data['section'] ?? ''));
  $day = trim((string)($data['schedule_day'] ?? ''));
  $start = trim((string)($data['start_time'] ?? ''));
  $end = trim((string)($data['end_time'] ?? ''));
  $room = trim((string)($data['room'] ?? ''));

  if ($class_id <= 0) json_response(['success' => false, 'message' => 'Invalid class_id'], 422);

  if ($course_id <= 0 || $section === '' || $day === '' || $start === '' || $end === '' || $room === '') {
    json_response(['success' => false, 'message' => 'Missing required fields'], 422);
  }

  if ($start >= $end) {
    json_response(['success' => false, 'message' => 'Invalid time range'], 422);
  }

  $exists = $pdo->prepare("SELECT COUNT(*) FROM classes WHERE class_id = :id");
  $exists->execute([':id' => $class_id]);
  if ((int)$exists->fetchColumn() === 0) {
    json_response(['success' => false, 'message' => 'Class not found'], 404);
  }

  $chkCourse = $pdo->prepare("SELECT COUNT(*) FROM courses WHERE course_id = :id");
  $chkCourse->execute([':id' => $course_id]);
  if ((int)$chkCourse->fetchColumn() === 0) {
    json_response(['success' => false, 'message' => 'Course not found'], 404);
  }

  $dup = $pdo->prepare("
    SELECT COUNT(*)
    FROM classes
    WHERE course_id = :cid
      AND section = :sec
      AND schedule_day = :day
      AND start_time = :st
      AND end_time = :en
      AND room = :room
      AND class_id <> :id
  ");
  $dup->execute([
    ':cid' => $course_id,
    ':sec' => $section,
    ':day' => $day,
    ':st' => $start,
    ':en' => $end,
    ':room' => $room,
    ':id' => $class_id
  ]);
  if ((int)$dup->fetchColumn() > 0) {
    json_response(['success' => false, 'message' => 'Another class with same schedule exists'], 409);
  }

  $stmt = $pdo->prepare("
    UPDATE classes
    SET course_id = :cid, section = :sec, schedule_day = :day, start_time = :st, end_time = :en, room = :room
    WHERE class_id = :id
  ");
  $stmt->execute([
    ':cid' => $course_id,
    ':sec' => $section,
    ':day' => $day,
    ':st' => $start,
    ':en' => $end,
    ':room' => $room,
    ':id' => $class_id
  ]);

  json_response(['success' => true, 'message' => 'Class updated']);

} catch (Throwable $e) {
  json_response(['success' => false, 'message' => $e->getMessage()], 500);
}