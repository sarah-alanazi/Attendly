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
$status = trim((string)($_POST['status'] ?? 'enrolled'));

if ($classId <= 0 || $studentId <= 0) {
    json_response(['success' => false, 'message' => 'Missing required fields'], 422);
}

if (!in_array($status, ['enrolled', 'dropped'], true)) {
    json_response(['success' => false, 'message' => 'Invalid status'], 422);
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

    $studentStmt = $pdo->prepare("
        SELECT user_id
        FROM users
        WHERE user_id = :student_id
          AND role = 'student'
        LIMIT 1
    ");
    $studentStmt->execute([':student_id' => $studentId]);

    if (!$studentStmt->fetch(PDO::FETCH_ASSOC)) {
        json_response(['success' => false, 'message' => 'Student not found'], 404);
    }

    $checkStmt = $pdo->prepare("
        SELECT enrollment_id
        FROM class_enrollment
        WHERE class_id = :class_id
          AND student_id = :student_id
        LIMIT 1
    ");
    $checkStmt->execute([
        ':class_id' => $classId,
        ':student_id' => $studentId
    ]);

    if ($checkStmt->fetch(PDO::FETCH_ASSOC)) {
        json_response(['success' => false, 'message' => 'Student already exists in this class'], 409);
    }

    $insertStmt = $pdo->prepare("
        INSERT INTO class_enrollment (student_id, class_id, enrolled_at, status)
        VALUES (:student_id, :class_id, CURDATE(), :status)
    ");
    $insertStmt->execute([
        ':student_id' => $studentId,
        ':class_id' => $classId,
        ':status' => $status
    ]);

    json_response(['success' => true, 'message' => 'Student added successfully']);
} catch (Throwable $e) {
    json_response(['success' => false, 'message' => 'Server error'], 500);
}