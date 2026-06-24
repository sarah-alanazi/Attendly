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
  $data = read_json_body();

  $user_id = (int)($data['user_id'] ?? 0);
  if ($user_id <= 0) {
    json_response(['success' => false, 'message' => 'Invalid user_id'], 422);
  }

  $stmt = $pdo->prepare("DELETE FROM users WHERE user_id = :id AND role <> 'admin'");
  $stmt->execute([':id' => $user_id]);

  if ($stmt->rowCount() === 0) {
    json_response(['success' => false, 'message' => 'User not found'], 404);
  }

  json_response(['success' => true, 'message' => 'User deleted']);

} catch (Throwable $e) {
  json_response(['success' => false, 'message' => 'Cannot delete because linked records exist. Suspend instead.'], 409);
}