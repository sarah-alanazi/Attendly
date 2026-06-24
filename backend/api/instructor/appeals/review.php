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

$appealId = (int)($_POST['appeal_id'] ?? 0);
$status = trim((string)($_POST['status'] ?? ''));
$reviewNote = trim((string)($_POST['review_note'] ?? ''));

if ($appealId <= 0) {
    json_response(['success' => false, 'message' => 'Invalid appeal id'], 422);
}

if (!in_array($status, ['approved', 'rejected'], true)) {
    json_response(['success' => false, 'message' => 'Invalid review status'], 422);
}

try {
    $pdo = db();
    $pdo->beginTransaction();

    $stmt = $pdo->prepare("
        SELECT
            a.appeal_id,
            a.record_id,
            a.status AS appeal_status,
            s.instructor_id
        FROM attendance_appeals a
        INNER JOIN attendance_records r ON r.record_id = a.record_id
        INNER JOIN attendance_sessions s ON s.session_id = r.session_id
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
        $pdo->rollBack();
        json_response(['success' => false, 'message' => 'Appeal not found'], 404);
    }

    if (($appeal['appeal_status'] ?? '') !== 'pending') {
        $pdo->rollBack();
        json_response(['success' => false, 'message' => 'This appeal has already been reviewed'], 409);
    }

    $updateAppealStmt = $pdo->prepare("
        UPDATE attendance_appeals
        SET status = :status,
            reviewed_by = :reviewed_by,
            review_note = :review_note,
            reviewed_at = NOW()
        WHERE appeal_id = :appeal_id
    ");
    $updateAppealStmt->execute([
        ':status' => $status,
        ':reviewed_by' => $instructorId,
        ':review_note' => $reviewNote !== '' ? $reviewNote : null,
        ':appeal_id' => $appealId
    ]);

    if ($status === 'approved') {
        $updateRecordStmt = $pdo->prepare("
            UPDATE attendance_records
            SET status = 'present'
            WHERE record_id = :record_id
        ");
        $updateRecordStmt->execute([
            ':record_id' => (int)$appeal['record_id']
        ]);
    }

    $pdo->commit();

    json_response([
        'success' => true,
        'message' => 'Appeal reviewed successfully'
    ]);
} catch (Throwable $e) {
    if (isset($pdo) && $pdo instanceof PDO && $pdo->inTransaction()) {
        $pdo->rollBack();
    }

    json_response([
        'success' => false,
        'message' => 'Server error'
    ], 500);
}