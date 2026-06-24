<?php
declare(strict_types=1);

require_once __DIR__ . '/../_guard.php';
require_once __DIR__ . '/../../../config/database.php';
require_once __DIR__ . '/../../../helpers/response.php';

require_admin();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  json_response(['success' => false, 'message' => 'Method not allowed'], 405);
}

try {
  $pdo = get_pdo();

  $input = json_decode(file_get_contents('php://input'), true) ?? [];

  $appealId = (int)($input['appeal_id'] ?? 0);
  $status = trim((string)($input['status'] ?? ''));
  $reviewNote = trim((string)($input['review_note'] ?? ''));

  if ($appealId <= 0) {
    json_response(['success' => false, 'message' => 'Invalid appeal id'], 422);
  }

  if (!in_array($status, ['approved', 'rejected'], true)) {
    json_response(['success' => false, 'message' => 'Invalid status'], 422);
  }

  $adminId = (int)($_SESSION['user']['user_id'] ?? $_SESSION['user_id'] ?? 0);

  $stmt = $pdo->prepare("
    UPDATE attendance_appeals
    SET
      status = :status,
      reviewed_by = :reviewed_by,
      review_note = :review_note,
      reviewed_at = NOW()
    WHERE appeal_id = :appeal_id
  ");
  $stmt->bindValue(':status', $status);
  $stmt->bindValue(':reviewed_by', $adminId, PDO::PARAM_INT);
  $stmt->bindValue(':review_note', $reviewNote);
  $stmt->bindValue(':appeal_id', $appealId, PDO::PARAM_INT);
  $stmt->execute();

  json_response([
    'success' => true,
    'message' => 'Appeal reviewed successfully'
  ]);

} catch (Throwable $e) {
  json_response(['success' => false, 'message' => $e->getMessage()], 500);
}