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

try {
    $pdo = db();

    $nameStmt = $pdo->prepare("
        SELECT CONCAT(first_name, ' ', last_name) AS full_name
        FROM users
        WHERE user_id = :user_id
        LIMIT 1
    ");
    $nameStmt->execute([':user_id' => $instructorId]);
    $instructorName = (string)($nameStmt->fetchColumn() ?: 'Instructor');

    $stmt = $pdo->prepare("
        SELECT
            c.class_id,
            c.course_id,
            c.section,
            c.schedule_day,
            TIME_FORMAT(c.start_time, '%h:%i %p') AS start_time,
            TIME_FORMAT(c.end_time, '%h:%i %p') AS end_time,
            c.room,
            cr.course_name,
            cr.semester,
            cr.academic_year,
            ic.assigned_date
        FROM instructor_course ic
        INNER JOIN courses cr ON cr.course_id = ic.course_id
        INNER JOIN classes c ON c.course_id = cr.course_id
        WHERE ic.instructor_id = :instructor_id
        ORDER BY cr.course_name ASC, c.section ASC
    ");
    $stmt->execute([':instructor_id' => $instructorId]);
    $classes = $stmt->fetchAll(PDO::FETCH_ASSOC);

    json_response([
        'success' => true,
        'data' => [
            'instructor_name' => $instructorName,
            'classes' => $classes
        ]
    ]);
} catch (Throwable $e) {
    json_response(['success' => false, 'message' => 'Server error'], 500);
}