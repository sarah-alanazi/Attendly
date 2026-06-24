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

    $stmt = $pdo->prepare("
        SELECT
            s.session_id,
            s.session_date,
            TIME_FORMAT(s.start_time, '%h:%i %p') AS start_time,
            TIME_FORMAT(s.end_time, '%h:%i %p') AS end_time,
            s.status,
            s.qr_expires_at,
            s.session_lat,
            s.session_lng,
            c.section,
            cr.course_name,
            SUM(CASE WHEN r.status = 'present' THEN 1 ELSE 0 END) AS present_count,
            SUM(CASE WHEN r.status = 'absent' THEN 1 ELSE 0 END) AS absent_count,
            SUM(CASE WHEN r.status = 'late' THEN 1 ELSE 0 END) AS late_count
        FROM attendance_sessions s
        INNER JOIN classes c ON c.class_id = s.class_id
        INNER JOIN courses cr ON cr.course_id = c.course_id
        LEFT JOIN attendance_records r ON r.session_id = s.session_id
        WHERE s.session_id = :session_id
          AND s.instructor_id = :instructor_id
        GROUP BY
            s.session_id,
            s.session_date,
            s.start_time,
            s.end_time,
            s.status,
            s.qr_expires_at,
            s.session_lat,
            s.session_lng,
            c.section,
            cr.course_name
        LIMIT 1
    ");
    $stmt->execute([
        ':session_id' => $sessionId,
        ':instructor_id' => $instructorId
    ]);
    $session = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$session) {
        json_response(['success' => false, 'message' => 'Session not found'], 404);
    }

    json_response([
        'success' => true,
        'data' => [
            'session' => $session
        ]
    ]);
} catch (Throwable $e) {
    json_response(['success' => false, 'message' => 'Server error'], 500);
}