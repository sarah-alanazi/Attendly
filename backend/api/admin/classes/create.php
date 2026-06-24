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
  $section = trim((string)($data['section'] ?? ''));
  $day = trim((string)($data['schedule_day'] ?? ''));
  $start = trim((string)($data['start_time'] ?? ''));
  $end = trim((string)($data['end_time'] ?? ''));
  $room = trim((string)($data['room'] ?? ''));

  if ($course_id <= 0 || $section === '' || $day === '' || $start === '' || $end === '' || $room === '') {
    json_response(['success' => false, 'message' => 'Missing required fields'], 422);
  }

  if ($start >= $end) {
    json_response(['success' => false, 'message' => 'Invalid time range'], 422);
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
  ");
  $dup->execute([
    ':cid' => $course_id,
    ':sec' => $section,
    ':day' => $day,
    ':st' => $start,
    ':en' => $end,
    ':room' => $room
  ]);
  if ((int)$dup->fetchColumn() > 0) {
    json_response(['success' => false, 'message' => 'Class already exists with same schedule'], 409);
  }

  $stmt = $pdo->prepare("
    INSERT INTO classes (course_id, section, schedule_day, start_time, end_time, room)
    VALUES (:cid, :sec, :day, :st, :en, :room)
  ");
  $stmt->execute([
    ':cid' => $course_id,
    ':sec' => $section,
    ':day' => $day,
    ':st' => $start,
    ':en' => $end,
    ':room' => $room
  ]);

  json_response(['success' => true, 'message' => 'Class created']);

} catch (Throwable $e) {
  json_response(['success' => false, 'message' => $e->getMessage()], 500);
}