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
$sessionId = (int)($_POST['session_id'] ?? 0);

if ($role !== 'instructor') {
    json_response(['success' => false, 'message' => 'Forbidden'], 403);
}

if ($sessionId <= 0) {
    json_response(['success' => false, 'message' => 'Invalid session id'], 422);
}

try {
    $pdo = db();

    $stmt = $pdo->prepare("
        UPDATE attendance_sessions
        SET status = 'closed'
        WHERE session_id = :session_id
          AND instructor_id = :instructor_id
          AND status = 'active'
    ");
    $stmt->execute([
        ':session_id' => $sessionId,
        ':instructor_id' => $instructorId
    ]);

    if ($stmt->rowCount() === 0) {
        json_response(['success' => false, 'message' => 'Active session not found'], 404);
    }

    json_response([
        'success' => true,
        'message' => 'Session closed successfully'
    ]);
} catch (Throwable $e) {
    json_response(['success' => false, 'message' => 'Server error'], 500);
}