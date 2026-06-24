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

$recordId = (int)($_POST['record_id'] ?? 0);
$status = trim((string)($_POST['status'] ?? ''));
$notes = trim((string)($_POST['notes'] ?? ''));

if ($recordId <= 0 || $status === '') {
    json_response(['success' => false, 'message' => 'Missing required fields'], 422);
}

if (!in_array($status, ['present', 'absent', 'late'], true)) {
    json_response(['success' => false, 'message' => 'Invalid attendance status'], 422);
}

try {
    $pdo = db();

    $checkStmt = $pdo->prepare("
        SELECT r.record_id, s.status AS session_status
        FROM attendance_records r
        INNER JOIN attendance_sessions s ON s.session_id = r.session_id
        WHERE r.record_id = :record_id
          AND s.instructor_id = :instructor_id
        LIMIT 1
    ");
    $checkStmt->execute([
        ':record_id' => $recordId,
        ':instructor_id' => $instructorId
    ]);
    $record = $checkStmt->fetch(PDO::FETCH_ASSOC);

    if (!$record) {
        json_response(['success' => false, 'message' => 'Record not found'], 404);
    }

    $scanAt = $status === 'absent' ? null : date('Y-m-d H:i:s');

    $updateStmt = $pdo->prepare("
        UPDATE attendance_records
        SET status = :status,
            scan_at = :scan_at,
            notes = :notes
        WHERE record_id = :record_id
    ");
    $updateStmt->bindValue(':status', $status);
    $updateStmt->bindValue(':scan_at', $scanAt);
    $updateStmt->bindValue(':notes', $notes !== '' ? $notes : null);
    $updateStmt->bindValue(':record_id', $recordId, PDO::PARAM_INT);
    $updateStmt->execute();

    json_response([
        'success' => true,
        'message' => 'Attendance record updated successfully'
    ]);
} catch (Throwable $e) {
    json_response(['success' => false, 'message' => 'Server error'], 500);
}