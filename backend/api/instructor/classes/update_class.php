<?php
declare(strict_types=1);

require_once __DIR__ . '/../../../config/database.php';
require_once __DIR__ . '/../../../config/session.php';
require_once __DIR__ . '/../../../helpers/response.php';

session_start_safe();

if (!isset($_SESSION['user'])) {
    json_response(['success' => false, 'message' => 'Unauthorized'], 401);
}

$user = $_SESSION['user'];
$role = $user['role'] ?? '';
$instructorId = (int)($user['user_id'] ?? 0);

if ($role !== 'instructor') {
    json_response(['success' => false, 'message' => 'Forbidden'], 403);
}

$classId = (int)($_POST['class_id'] ?? 0);
$section = trim((string)($_POST['section'] ?? ''));
$room = trim((string)($_POST['room'] ?? ''));
$scheduleDay = trim((string)($_POST['schedule_day'] ?? ''));
$startTime = trim((string)($_POST['start_time'] ?? ''));
$endTime = trim((string)($_POST['end_time'] ?? ''));

if ($classId <= 0 || $section === '' || $room === '' || $scheduleDay === '' || $startTime === '' || $endTime === '') {
    json_response(['success' => false, 'message' => 'All fields are required'], 422);
}

$allowedDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

if (!in_array($scheduleDay, $allowedDays, true)) {
    json_response(['success' => false, 'message' => 'Invalid schedule day'], 422);
}

try {
    $pdo = db();

    $classStmt = $pdo->prepare("
        SELECT c.class_id
        FROM classes c
        INNER JOIN instructor_course ic ON ic.course_id = c.course_id
        WHERE c.class_id = :class_id
          AND ic.instructor_id = :instructor_id
        LIMIT 1
    ");
    $classStmt->execute([
        ':class_id' => $classId,
        ':instructor_id' => $instructorId
    ]);

    if (!$classStmt->fetch(PDO::FETCH_ASSOC)) {
        json_response(['success' => false, 'message' => 'Class not found'], 404);
    }

    $updateStmt = $pdo->prepare("
        UPDATE classes
        SET section = :section,
            room = :room,
            schedule_day = :schedule_day,
            start_time = :start_time,
            end_time = :end_time
        WHERE class_id = :class_id
    ");
    $updateStmt->execute([
        ':section' => $section,
        ':room' => $room,
        ':schedule_day' => $scheduleDay,
        ':start_time' => $startTime,
        ':end_time' => $endTime,
        ':class_id' => $classId
    ]);

    json_response(['success' => true, 'message' => 'Class updated successfully']);
} catch (Throwable $e) {
    json_response(['success' => false, 'message' => 'Server error'], 500);
}