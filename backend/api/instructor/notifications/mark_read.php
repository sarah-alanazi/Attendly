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
$notificationId = (int)($_POST['notification_id'] ?? 0);

if ($role !== 'instructor') {
    json_response(['success' => false, 'message' => 'Forbidden'], 403);
}

if ($notificationId <= 0) {
    json_response(['success' => false, 'message' => 'Invalid notification id'], 422);
}

try {
    $pdo = db();

    $checkStmt = $pdo->prepare("
        SELECT notification_id
        FROM notifications
        WHERE notification_id = :notification_id
          AND user_id = :user_id
        LIMIT 1
    ");
    $checkStmt->execute([
        ':notification_id' => $notificationId,
        ':user_id' => $instructorId
    ]);

    if (!$checkStmt->fetch(PDO::FETCH_ASSOC)) {
        json_response(['success' => false, 'message' => 'Notification not found'], 404);
    }

    $updateStmt = $pdo->prepare("
        UPDATE notifications
        SET is_read = 1
        WHERE notification_id = :notification_id
          AND user_id = :user_id
    ");
    $updateStmt->execute([
        ':notification_id' => $notificationId,
        ':user_id' => $instructorId
    ]);

    json_response([
        'success' => true,
        'message' => 'Notification marked as read'
    ]);
} catch (Throwable $e) {
    json_response([
        'success' => false,
        'message' => 'Server error'
    ], 500);
}