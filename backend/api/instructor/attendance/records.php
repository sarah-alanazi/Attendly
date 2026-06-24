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
$sessionId = (int)($_GET['session_id'] ?? 0);

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
        LIMIT 1
    ");
    $checkStmt->execute([
        ':session_id' => $sessionId,
        ':instructor_id' => $instructorId
    ]);

    if (!$checkStmt->fetch(PDO::FETCH_ASSOC)) {
        json_response(['success' => false, 'message' => 'Session not found'], 404);
    }

    $stmt = $pdo->prepare("
        SELECT
            r.record_id,
            CONCAT(u.first_name, ' ', u.last_name) AS student_name,
            r.status,
            r.scan_at,
            r.reliability_color,
            r.within_campus,
            r.notes
        FROM attendance_records r
        INNER JOIN users u ON u.user_id = r.student_id
        WHERE r.session_id = :session_id
        ORDER BY u.first_name ASC, u.last_name ASC
    ");
    $stmt->execute([':session_id' => $sessionId]);
    $records = $stmt->fetchAll(PDO::FETCH_ASSOC);

    json_response([
        'success' => true,
        'data' => [
            'records' => $records
        ]
    ]);
} catch (Throwable $e) {
    json_response(['success' => false, 'message' => 'Server error'], 500);
}