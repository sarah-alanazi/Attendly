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

    $checkStmt = $pdo->prepare("
        SELECT session_id
        FROM attendance_sessions
        WHERE session_id = :session_id
          AND instructor_id = :instructor_id
          AND status = 'active'
        LIMIT 1
    ");
    $checkStmt->execute([
        ':session_id' => $sessionId,
        ':instructor_id' => $instructorId
    ]);

    if (!$checkStmt->fetch(PDO::FETCH_ASSOC)) {
        json_response(['success' => false, 'message' => 'Active session not found'], 404);
    }

    $qrToken = bin2hex(random_bytes(16));
    $expiry = date('Y-m-d H:i:s', strtotime('+30 minutes'));

    $updateStmt = $pdo->prepare("
        UPDATE attendance_sessions
        SET qr_token = :qr_token,
            qr_expires_at = :qr_expires_at
        WHERE session_id = :session_id
    ");
    $updateStmt->execute([
        ':qr_token' => $qrToken,
        ':qr_expires_at' => $expiry,
        ':session_id' => $sessionId
    ]);

    json_response([
        'success' => true,
        'data' => [
            'qr_token' => $qrToken,
            'qr_expires_at' => $expiry
        ]
    ]);
} catch (Throwable $e) {
    json_response(['success' => false, 'message' => 'Server error'], 500);
}