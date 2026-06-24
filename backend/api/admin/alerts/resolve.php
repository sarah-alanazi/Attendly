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

  $alertId = (int)($input['alert_id'] ?? 0);
  if ($alertId <= 0) {
    json_response(['success' => false, 'message' => 'Invalid alert id'], 422);
  }

  $stmt = $pdo->prepare("
    UPDATE attendance_alerts
    SET resolved = 1
    WHERE alert_id = :alert_id
  ");
  $stmt->bindValue(':alert_id', $alertId, PDO::PARAM_INT);
  $stmt->execute();

  json_response([
    'success' => true,
    'message' => 'Alert resolved successfully'
  ]);

} catch (Throwable $e) {
  json_response(['success' => false, 'message' => $e->getMessage()], 500);
}