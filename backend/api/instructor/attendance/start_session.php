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

$classId = (int)($_POST['class_id'] ?? 0);
$sessionDate = trim((string)($_POST['session_date'] ?? ''));
$startTime = trim((string)($_POST['start_time'] ?? ''));
$endTime = trim((string)($_POST['end_time'] ?? ''));
$sessionLat = trim((string)($_POST['session_lat'] ?? ''));
$sessionLng = trim((string)($_POST['session_lng'] ?? ''));

if ($classId <= 0 || $sessionDate === '' || $startTime === '' || $endTime === '' || $sessionLat === '' || $sessionLng === '') {
    json_response(['success' => false, 'message' => 'All fields are required'], 422);
}

if (!is_numeric($sessionLat) || !is_numeric($sessionLng)) {
    json_response(['success' => false, 'message' => 'Invalid session location'], 422);
}

$pdo = null;

try {
    $pdo = db();
    $pdo->beginTransaction();

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
        $pdo->rollBack();
        json_response(['success' => false, 'message' => 'Class not found'], 404);
    }

    $activeStmt = $pdo->prepare("
        SELECT session_id
        FROM attendance_sessions
        WHERE class_id = :class_id
          AND instructor_id = :instructor_id
          AND status = 'active'
        LIMIT 1
    ");
    $activeStmt->execute([
        ':class_id' => $classId,
        ':instructor_id' => $instructorId
    ]);

    if ($activeStmt->fetch(PDO::FETCH_ASSOC)) {
        $pdo->rollBack();
        json_response(['success' => false, 'message' => 'There is already an active session for this class'], 409);
    }

    $insertStmt = $pdo->prepare("
        INSERT INTO attendance_sessions (
            class_id,
            instructor_id,
            session_date,
            start_time,
            end_time,
            session_lat,
            session_lng,
            qr_token,
            qr_expires_at,
            status
        )
        VALUES (
            :class_id,
            :instructor_id,
            :session_date,
            :start_time,
            :end_time,
            :session_lat,
            :session_lng,
            NULL,
            NULL,
            'active'
        )
    ");
    $insertStmt->execute([
        ':class_id' => $classId,
        ':instructor_id' => $instructorId,
        ':session_date' => $sessionDate,
        ':start_time' => $startTime,
        ':end_time' => $endTime,
        ':session_lat' => $sessionLat,
        ':session_lng' => $sessionLng
    ]);

    $sessionId = (int)$pdo->lastInsertId();

    $studentsStmt = $pdo->prepare("
        SELECT student_id
        FROM class_enrollment
        WHERE class_id = :class_id
          AND status = 'enrolled'
    ");
    $studentsStmt->execute([':class_id' => $classId]);
    $students = $studentsStmt->fetchAll(PDO::FETCH_COLUMN);

    if (!empty($students)) {
        $recordStmt = $pdo->prepare("
            INSERT INTO attendance_records (
                session_id,
                student_id,
                status,
                scan_at,
                scan_lat,
                scan_lng,
                location_accuracy_m,
                within_campus,
                reliability_color,
                notes
            )
            VALUES (
                :session_id,
                :student_id,
                'absent',
                NULL,
                NULL,
                NULL,
                NULL,
                NULL,
                NULL,
                NULL
            )
        ");

        foreach ($students as $studentId) {
            $recordStmt->execute([
                ':session_id' => $sessionId,
                ':student_id' => (int)$studentId
            ]);
        }
    }

    $pdo->commit();

    json_response([
        'success' => true,
        'message' => 'Attendance session started successfully'
    ]);
} catch (Throwable $e) {
    if ($pdo instanceof PDO && $pdo->inTransaction()) {
        $pdo->rollBack();
    }

    json_response([
        'success' => false,
        'message' => 'Server error: ' . $e->getMessage()
    ], 500);
}