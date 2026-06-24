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
$available = isset($_GET['available']) ? (int)$_GET['available'] : 0;

if ($role !== 'instructor') {
    json_response(['success' => false, 'message' => 'Forbidden'], 403);
}

if ($classId <= 0) {
    json_response(['success' => false, 'message' => 'Invalid class id'], 422);
}

try {
    $pdo = db();

    $checkStmt = $pdo->prepare("
        SELECT c.class_id
        FROM classes c
        INNER JOIN instructor_course ic ON ic.course_id = c.course_id
        WHERE c.class_id = :class_id
          AND ic.instructor_id = :instructor_id
        LIMIT 1
    ");
    $checkStmt->execute([
        ':class_id' => $classId,
        ':instructor_id' => $instructorId
    ]);

    if (!$checkStmt->fetch(PDO::FETCH_ASSOC)) {
        json_response(['success' => false, 'message' => 'Class not found'], 404);
    }

    if ($available === 1) {
        $stmt = $pdo->prepare("
            SELECT
                u.user_id AS student_id,
                CONCAT(u.first_name, ' ', u.last_name) AS full_name,
                u.username
            FROM users u
            WHERE u.role = 'student'
              AND u.is_active = 1
              AND u.user_id NOT IN (
                  SELECT ce.student_id
                  FROM class_enrollment ce
                  WHERE ce.class_id = :class_id
              )
            ORDER BY u.first_name ASC, u.last_name ASC
        ");
        $stmt->execute([':class_id' => $classId]);
        $students = $stmt->fetchAll(PDO::FETCH_ASSOC);

        json_response([
            'success' => true,
            'data' => [
                'students' => $students
            ]
        ]);
    }

    $stmt = $pdo->prepare("
        SELECT
            u.user_id AS student_id,
            CONCAT(u.first_name, ' ', u.last_name) AS full_name,
            u.username,
            u.email,
            ce.status,
            ce.enrolled_at
        FROM class_enrollment ce
        INNER JOIN users u ON u.user_id = ce.student_id
        WHERE ce.class_id = :class_id
          AND u.role = 'student'
        ORDER BY u.first_name ASC, u.last_name ASC
    ");
    $stmt->execute([':class_id' => $classId]);
    $students = $stmt->fetchAll(PDO::FETCH_ASSOC);

    json_response([
        'success' => true,
        'data' => [
            'students' => $students
        ]
    ]);
} catch (Throwable $e) {
    json_response(['success' => false, 'message' => 'Server error'], 500);
}