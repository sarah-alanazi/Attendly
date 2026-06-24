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

$alertType = trim((string)($_GET['alert_type'] ?? ''));
$resolved = isset($_GET['resolved']) ? trim((string)$_GET['resolved']) : '';
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

    $where[] = "ic.instructor_id = :instructor_id";

    if ($alertType !== '' && in_array($alertType, ['low_attendance', 'late', 'suspicious'], true)) {
        $where[] = "a.alert_type = :alert_type";
        $params[':alert_type'] = $alertType;
    }

    if ($resolved !== '' && in_array($resolved, ['0', '1'], true)) {
        $where[] = "a.resolved = :resolved";
        $params[':resolved'] = (int)$resolved;
    }

    if ($classId > 0) {
        $where[] = "a.class_id = :class_id";
        $params[':class_id'] = $classId;
    }

    $whereSql = implode(' AND ', $where);

    $alertsStmt = $pdo->prepare("
        SELECT
            a.alert_id,
            a.alert_type,
            a.description,
            a.generated_at,
            a.resolved,
            u.user_id AS student_id,
            CONCAT(u.first_name, ' ', u.last_name) AS student_name,
            cr.course_name,
            c.section
        FROM attendance_alerts a
        INNER JOIN users u ON u.user_id = a.student_id
        INNER JOIN classes c ON c.class_id = a.class_id
        INNER JOIN courses cr ON cr.course_id = c.course_id
        INNER JOIN instructor_course ic ON ic.course_id = c.course_id
        WHERE {$whereSql}
        ORDER BY a.generated_at DESC, a.alert_id DESC
    ");
    $alertsStmt->execute($params);
    $alerts = $alertsStmt->fetchAll(PDO::FETCH_ASSOC);

    json_response([
        'success' => true,
        'data' => [
            'instructor_name' => $instructorName,
            'classes' => $classes,
            'alerts' => $alerts
        ]
    ]);
} catch (Throwable $e) {
    json_response([
        'success' => false,
        'message' => 'Server error'
    ], 500);
}