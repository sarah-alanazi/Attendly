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

  $role = trim((string)($data['role'] ?? ''));
  $username = trim((string)($data['username'] ?? ''));
  $password = (string)($data['password'] ?? '');
  $first = trim((string)($data['first_name'] ?? ''));
  $last = trim((string)($data['last_name'] ?? ''));
  $email = trim((string)($data['email'] ?? ''));
  $is_active = (int)($data['is_active'] ?? 1);
  $is_active = $is_active === 0 ? 0 : 1;

  if ($role === '' || $username === '' || $password === '' || $first === '' || $last === '' || $email === '') {
    json_response(['success' => false, 'message' => 'Missing required fields'], 422);
  }

  if (!in_array($role, ['instructor','student'], true)) {
    json_response(['success' => false, 'message' => 'Invalid role'], 422);
  }

  if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    json_response(['success' => false, 'message' => 'Invalid email'], 422);
  }

  $chk = $pdo->prepare("SELECT COUNT(*) FROM users WHERE username = :u OR email = :e");
  $chk->execute([':u' => $username, ':e' => $email]);
  if ((int)$chk->fetchColumn() > 0) {
    json_response(['success' => false, 'message' => 'Username or email already exists'], 409);
  }

  $hash = password_hash($password, PASSWORD_DEFAULT);

  $stmt = $pdo->prepare("
    INSERT INTO users (username, password_hash, email, first_name, last_name, role, is_active, created_at)
    VALUES (:username, :ph, :email, :first, :last, :role, :active, NOW())
  ");

  $stmt->execute([
    ':username' => $username,
    ':ph' => $hash,
    ':email' => $email,
    ':first' => $first,
    ':last' => $last,
    ':role' => $role,
    ':active' => $is_active,
  ]);

  json_response(['success' => true, 'message' => 'User created']);

} catch (Throwable $e) {
  json_response(['success' => false, 'message' => $e->getMessage()], 500);
}