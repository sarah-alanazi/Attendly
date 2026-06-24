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
$alertId = (int)($_GET['alert_id'] ?? 0);

if ($role !== 'instructor') {
    json_response(['success' => false, 'message' => 'Forbidden'], 403);
}

if ($alertId <= 0) {
    json_response(['success' => false, 'message' => 'Invalid alert id'], 422);
}

try {
    $pdo = db();

    $stmt = $pdo->prepare("
        SELECT
            a.alert_id,
            a.alert_type,
            a.description,
            a.generated_at,
            a.resolved,
            CONCAT(u.first_name, ' ', u.last_name) AS student_name,
            u.email AS student_email,
            cr.course_name,
            c.section
        FROM attendance_alerts a
        INNER JOIN users u ON u.user_id = a.student_id
        INNER JOIN classes c ON c.class_id = a.class_id
        INNER JOIN courses cr ON cr.course_id = c.course_id
        INNER JOIN instructor_course ic ON ic.course_id = c.course_id
        WHERE a.alert_id = :alert_id
          AND ic.instructor_id = :instructor_id
        LIMIT 1
    ");
    $stmt->execute([
        ':alert_id' => $alertId,
        ':instructor_id' => $instructorId
    ]);

    $alert = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$alert) {
        json_response(['success' => false, 'message' => 'Alert not found'], 404);
    }

    json_response([
        'success' => true,
        'data' => [
            'alert' => $alert
        ]
    ]);
} catch (Throwable $e) {
    json_response([
        'success' => false,
        'message' => 'Server error'
    ], 500);
}