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

$status = trim((string)($_GET['status'] ?? ''));
$classId = (int)($_GET['class_id'] ?? 0);

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

    $classesStmt = $pdo->prepare("
        SELECT
            c.class_id,
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

    $where = [];
    $params = [':instructor_id' => $instructorId];

    $where[] = "s.instructor_id = :instructor_id";

    if ($status !== '' && in_array($status, ['pending', 'approved', 'rejected'], true)) {
        $where[] = "a.status = :status";
        $params[':status'] = $status;
    }

    if ($classId > 0) {
        $where[] = "s.class_id = :class_id";
        $params[':class_id'] = $classId;
    }

    $whereSql = implode(' AND ', $where);

    $stmt = $pdo->prepare("
        SELECT
            a.appeal_id,
            a.reason,
            a.status,
            a.created_at,
            CONCAT(u.first_name, ' ', u.last_name) AS student_name,
            cr.course_name,
            c.section
        FROM attendance_appeals a
        INNER JOIN attendance_records r ON r.record_id = a.record_id
        INNER JOIN attendance_sessions s ON s.session_id = r.session_id
        INNER JOIN classes c ON c.class_id = s.class_id
        INNER JOIN courses cr ON cr.course_id = c.course_id
        INNER JOIN users u ON u.user_id = a.student_id
        WHERE {$whereSql}
        ORDER BY a.created_at DESC, a.appeal_id DESC
    ");
    $stmt->execute($params);
    $appeals = $stmt->fetchAll(PDO::FETCH_ASSOC);

    json_response([
        'success' => true,
        'data' => [
            'instructor_name' => $instructorName,
            'classes' => $classes,
            'appeals' => $appeals
        ]
    ]);
} catch (Throwable $e) {
    json_response([
        'success' => false,
        'message' => 'Server error'
    ], 500);
}