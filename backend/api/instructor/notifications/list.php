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
            notification_id,
            message,
            type,
            sent_at,
            is_read
        FROM notifications
        WHERE user_id = :user_id
        ORDER BY sent_at DESC, notification_id DESC
    ");
    $stmt->execute([':user_id' => $instructorId]);
    $notifications = $stmt->fetchAll(PDO::FETCH_ASSOC);

    json_response([
        'success' => true,
        'data' => [
            'instructor_name' => $instructorName,
            'notifications' => $notifications
        ]
    ]);
} catch (Throwable $e) {
    json_response([
        'success' => false,
        'message' => 'Server error'
    ], 500);
}