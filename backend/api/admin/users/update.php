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
  $role = trim((string)($data['role'] ?? ''));
  $username = trim((string)($data['username'] ?? ''));
  $first = trim((string)($data['first_name'] ?? ''));
  $last = trim((string)($data['last_name'] ?? ''));
  $email = trim((string)($data['email'] ?? ''));
  $is_active = (int)($data['is_active'] ?? 1);
  $is_active = $is_active === 0 ? 0 : 1;

  if ($user_id <= 0 || $role === '' || $username === '' || $first === '' || $last === '' || $email === '') {
    json_response(['success' => false, 'message' => 'Missing required fields'], 422);
  }

  if (!in_array($role, ['instructor','student'], true)) {
    json_response(['success' => false, 'message' => 'Invalid role'], 422);
  }

  if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    json_response(['success' => false, 'message' => 'Invalid email'], 422);
  }

  $ex = $pdo->prepare("SELECT COUNT(*) FROM users WHERE user_id = :id AND role <> 'admin'");
  $ex->execute([':id' => $user_id]);
  if ((int)$ex->fetchColumn() === 0) {
    json_response(['success' => false, 'message' => 'User not found'], 404);
  }

  $chk = $pdo->prepare("SELECT COUNT(*) FROM users WHERE (username = :u OR email = :e) AND user_id <> :id");
  $chk->execute([':u' => $username, ':e' => $email, ':id' => $user_id]);
  if ((int)$chk->fetchColumn() > 0) {
    json_response(['success' => false, 'message' => 'Username or email already exists'], 409);
  }

  $stmt = $pdo->prepare("
    UPDATE users
    SET username = :u,
        email = :e,
        first_name = :f,
        last_name = :l,
        role = :r,
        is_active = :a
    WHERE user_id = :id AND role <> 'admin'
  ");

  $stmt->execute([
    ':u' => $username,
    ':e' => $email,
    ':f' => $first,
    ':l' => $last,
    ':r' => $role,
    ':a' => $is_active,
    ':id' => $user_id,
  ]);

  json_response(['success' => true, 'message' => 'User updated']);

} catch (Throwable $e) {
  json_response(['success' => false, 'message' => $e->getMessage()], 500);
}