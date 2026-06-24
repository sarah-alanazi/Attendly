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
$appealId = (int)($_GET['appeal_id'] ?? 0);

if ($role !== 'instructor') {
    json_response(['success' => false, 'message' => 'Forbidden'], 403);
}

if ($appealId <= 0) {
    json_response(['success' => false, 'message' => 'Invalid appeal id'], 422);
}

try {
    $pdo = db();

    $stmt = $pdo->prepare("
        SELECT
            a.appeal_id,
            a.reason,
            a.evidence_url,
            a.status,
            a.review_note,
            a.created_at,
            CONCAT(u.first_name, ' ', u.last_name) AS student_name,
            u.email AS student_email,
            r.status AS record_status,
            s.session_date,
            cr.course_name,
            c.section
        FROM attendance_appeals a
        INNER JOIN attendance_records r ON r.record_id = a.record_id
        INNER JOIN attendance_sessions s ON s.session_id = r.session_id
        INNER JOIN classes c ON c.class_id = s.class_id
        INNER JOIN courses cr ON cr.course_id = c.course_id
        INNER JOIN users u ON u.user_id = a.student_id
        WHERE a.appeal_id = :appeal_id
          AND s.instructor_id = :instructor_id
        LIMIT 1
    ");
    $stmt->execute([
        ':appeal_id' => $appealId,
        ':instructor_id' => $instructorId
    ]);

    $appeal = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$appeal) {
      json_response(['success' => false, 'message' => 'Appeal not found'], 404);
    }

    json_response([
        'success' => true,
        'data' => [
            'appeal' => $appeal
        ]
    ]);
} catch (Throwable $e) {
    json_response([
        'success' => false,
        'message' => 'Server error'
    ], 500);
}