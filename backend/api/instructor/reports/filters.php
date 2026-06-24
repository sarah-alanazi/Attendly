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

    $coursesStmt = $pdo->prepare("
        SELECT DISTINCT
            cr.course_id,
            cr.course_name
        FROM instructor_course ic
        INNER JOIN courses cr ON cr.course_id = ic.course_id
        WHERE ic.instructor_id = :instructor_id
        ORDER BY cr.course_name ASC
    ");
    $coursesStmt->execute([':instructor_id' => $instructorId]);
    $courses = $coursesStmt->fetchAll(PDO::FETCH_ASSOC);

    $classesStmt = $pdo->prepare("
        SELECT
            c.class_id,
            c.course_id,
            c.section,
            cr.course_name
        FROM classes c
        INNER JOIN instructor_course ic ON ic.course_id = c.course_id
        INNER JOIN courses cr ON cr.course_id = c.course_id
        WHERE ic.instructor_id = :instructor_id
        ORDER BY cr.course_name ASC, c.section ASC
    ");
    $classesStmt->execute([':instructor_id' => $instructorId]);
    $classes = $classesStmt->fetchAll(PDO::FETCH_ASSOC);

    json_response([
        'success' => true,
        'data' => [
            'instructor_name' => $instructorName,
            'courses' => $courses,
            'classes' => $classes
        ]
    ]);
} catch (Throwable $e) {
    json_response(['success' => false, 'message' => 'Server error'], 500);
}