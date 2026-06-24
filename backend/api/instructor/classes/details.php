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
$classId = (int)($_GET['class_id'] ?? 0);

if ($role !== 'instructor') {
    json_response(['success' => false, 'message' => 'Forbidden'], 403);
}

if ($classId <= 0) {
    json_response(['success' => false, 'message' => 'Invalid class id'], 422);
}

try {
    $pdo = db();

    $stmt = $pdo->prepare("
        SELECT
            c.class_id,
            c.course_id,
            c.section,
            c.schedule_day,
            c.room,
            TIME_FORMAT(c.start_time, '%h:%i %p') AS start_time,
            TIME_FORMAT(c.end_time, '%h:%i %p') AS end_time,
            TIME_FORMAT(c.start_time, '%H:%i') AS start_time_raw,
            TIME_FORMAT(c.end_time, '%H:%i') AS end_time_raw,
            cr.course_name,
            cr.semester,
            cr.academic_year,
            ic.assigned_date
        FROM classes c
        INNER JOIN courses cr ON cr.course_id = c.course_id
        INNER JOIN instructor_course ic ON ic.course_id = c.course_id
        WHERE c.class_id = :class_id
          AND ic.instructor_id = :instructor_id
        LIMIT 1
    ");
    $stmt->execute([
        ':class_id' => $classId,
        ':instructor_id' => $instructorId
    ]);
    $class = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$class) {
        json_response(['success' => false, 'message' => 'Class not found'], 404);
    }

    json_response([
        'success' => true,
        'data' => [
            'class' => $class
        ]
    ]);
} catch (Throwable $e) {
    json_response(['success' => false, 'message' => 'Server error'], 500);
}