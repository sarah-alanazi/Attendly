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
$classId = (int)($_GET['class_id'] ?? 0);

if ($role !== 'instructor') {
    json_response(['success' => false, 'message' => 'Forbidden'], 403);
}

if ($classId <= 0) {
    json_response(['success' => false, 'message' => 'Invalid class id'], 422);
}

try {
    $pdo = db();

    $checkStmt = $pdo->prepare("
        SELECT c.class_id
        FROM classes c
        INNER JOIN instructor_course ic ON ic.course_id = c.course_id
        WHERE c.class_id = :class_id
          AND ic.instructor_id = :instructor_id
        LIMIT 1
    ");
    $checkStmt->execute([
        ':class_id' => $classId,
        ':instructor_id' => $instructorId
    ]);

    if (!$checkStmt->fetch(PDO::FETCH_ASSOC)) {
        json_response(['success' => false, 'message' => 'Class not found'], 404);
    }

    $activeStmt = $pdo->prepare("
        SELECT
            session_id,
            session_date,
            TIME_FORMAT(start_time, '%h:%i %p') AS start_time,
            TIME_FORMAT(end_time, '%h:%i %p') AS end_time,
            session_lat,
            session_lng,
            qr_token,
            qr_expires_at,
            status
        FROM attendance_sessions
        WHERE class_id = :class_id
          AND instructor_id = :instructor_id
          AND status = 'active'
        ORDER BY session_date DESC, start_time DESC
        LIMIT 1
    ");
    $activeStmt->execute([
        ':class_id' => $classId,
        ':instructor_id' => $instructorId
    ]);
    $activeSession = $activeStmt->fetch(PDO::FETCH_ASSOC) ?: null;

    $historyStmt = $pdo->prepare("
        SELECT
            s.session_id,
            s.session_date,
            TIME_FORMAT(s.start_time, '%h:%i %p') AS start_time,
            TIME_FORMAT(s.end_time, '%h:%i %p') AS end_time,
            s.status,
            SUM(CASE WHEN r.status = 'present' THEN 1 ELSE 0 END) AS present_count,
            SUM(CASE WHEN r.status = 'absent' THEN 1 ELSE 0 END) AS absent_count,
            SUM(CASE WHEN r.status = 'late' THEN 1 ELSE 0 END) AS late_count
        FROM attendance_sessions s
        LEFT JOIN attendance_records r ON r.session_id = s.session_id
        WHERE s.class_id = :class_id
          AND s.instructor_id = :instructor_id
        GROUP BY s.session_id, s.session_date, s.start_time, s.end_time, s.status
        ORDER BY s.session_date DESC, s.start_time DESC
        LIMIT 10
    ");
    $historyStmt->execute([
        ':class_id' => $classId,
        ':instructor_id' => $instructorId
    ]);
    $history = $historyStmt->fetchAll(PDO::FETCH_ASSOC);

    json_response([
        'success' => true,
        'data' => [
            'active_session' => $activeSession,
            'history' => $history
        ]
    ]);
} catch (Throwable $e) {
    json_response(['success' => false, 'message' => 'Server error'], 500);
}