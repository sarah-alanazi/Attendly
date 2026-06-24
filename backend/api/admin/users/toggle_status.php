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

  $stmt = $pdo->prepare("SELECT is_active FROM users WHERE user_id = :id AND role <> 'admin'");
  $stmt->execute([':id' => $user_id]);
  $cur = $stmt->fetchColumn();

  if ($cur === false) {
    json_response(['success' => false, 'message' => 'User not found'], 404);
  }

  $newVal = ((int)$cur === 1) ? 0 : 1;

  $upd = $pdo->prepare("UPDATE users SET is_active = :v WHERE user_id = :id AND role <> 'admin'");
  $upd->execute([':v' => $newVal, ':id' => $user_id]);

  json_response(['success' => true, 'data' => ['is_active' => $newVal]]);

} catch (Throwable $e) {
  json_response(['success' => false, 'message' => $e->getMessage()], 500);
}