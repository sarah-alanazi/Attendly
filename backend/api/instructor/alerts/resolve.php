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
$alertId = (int)($_POST['alert_id'] ?? 0);

if ($role !== 'instructor') {
    json_response(['success' => false, 'message' => 'Forbidden'], 403);
}

if ($alertId <= 0) {
    json_response(['success' => false, 'message' => 'Invalid alert id'], 422);
}

try {
    $pdo = db();

    $checkStmt = $pdo->prepare("
        SELECT a.alert_id
        FROM attendance_alerts a
        INNER JOIN classes c ON c.class_id = a.class_id
        INNER JOIN instructor_course ic ON ic.course_id = c.course_id
        WHERE a.alert_id = :alert_id
          AND ic.instructor_id = :instructor_id
        LIMIT 1
    ");
    $checkStmt->execute([
        ':alert_id' => $alertId,
        ':instructor_id' => $instructorId
    ]);

    if (!$checkStmt->fetch(PDO::FETCH_ASSOC)) {
        json_response(['success' => false, 'message' => 'Alert not found'], 404);
    }

    $updateStmt = $pdo->prepare("
        UPDATE attendance_alerts
        SET resolved = 1
        WHERE alert_id = :alert_id
    ");
    $updateStmt->execute([
        ':alert_id' => $alertId
    ]);

    json_response([
        'success' => true,
        'message' => 'Alert marked as resolved successfully'
    ]);
} catch (Throwable $e) {
    json_response([
        'success' => false,
        'message' => 'Server error'
    ], 500);
}