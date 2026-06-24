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
$studentId = (int)($_POST['student_id'] ?? 0);

if ($classId <= 0 || $studentId <= 0) {
    json_response(['success' => false, 'message' => 'Missing required fields'], 422);
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

    $deleteStmt = $pdo->prepare("
        DELETE FROM class_enrollment
        WHERE class_id = :class_id
          AND student_id = :student_id
    ");
    $deleteStmt->execute([
        ':class_id' => $classId,
        ':student_id' => $studentId
    ]);

    if ($deleteStmt->rowCount() === 0) {
        json_response(['success' => false, 'message' => 'Student enrollment not found'], 404);
    }

    json_response(['success' => true, 'message' => 'Student removed successfully']);
} catch (Throwable $e) {
    json_response(['success' => false, 'message' => 'Server error'], 500);
}