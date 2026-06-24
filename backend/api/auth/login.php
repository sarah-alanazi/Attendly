<?php
declare(strict_types=1);

ob_start();

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/session.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/security.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  json_response(['success' => false, 'error' => 'Method not allowed'], 405);
}

$raw = file_get_contents('php://input') ?: '';
$body = json_decode($raw, true);

if (!is_array($body)) {
  json_response(['success' => false, 'error' => 'Invalid JSON body.'], 400);
}

$username = trim((string)($body['username'] ?? ''));
$password = (string)($body['password'] ?? '');

if ($username === '' || $password === '') {
  json_response(['success' => false, 'error' => 'Username and password are required.'], 422);
}

try {
  $pdo = db();

  $stmt = $pdo->prepare("
    SELECT user_id, username, password_hash, email, first_name, last_name, role
    FROM users
    WHERE username = :u1 OR email = :u2
    LIMIT 1
  ");
  $stmt->execute([
    ':u1' => $username,
    ':u2' => $username
  ]);

  $user = $stmt->fetch();

  if (!$user) {
    json_response(['success' => false, 'error' => 'Invalid username or password.'], 401);
  }

  if (!verify_password($password, (string)$user['password_hash'])) {
    json_response(['success' => false, 'error' => 'Invalid username or password.'], 401);
  }

  session_start_safe();
  $_SESSION['user'] = [
    'user_id' => (int)$user['user_id'],
    'username' => (string)$user['username'],
    'email' => (string)$user['email'],
    'first_name' => (string)$user['first_name'],
    'last_name' => (string)$user['last_name'],
    'role' => (string)$user['role'],
  ];

  $role = (string)$_SESSION['user']['role'];
  $redirect = '/attendly/public/index.html';

  if ($role === 'admin') $redirect = '/attendly/public/admin/dashboard/index.html';
  if ($role === 'instructor') $redirect = '/attendly/public/instructor/dashboard/index.html';
  if ($role === 'student') $redirect = '/attendly/public/student/dashboard/index.html';

  json_response([
    'success' => true,
    'message' => 'Login successful.',
    'user' => $_SESSION['user'],
    'redirect' => $redirect
  ], 200);

} catch (Throwable $e) {
  json_response([
    'success' => false,
    'error' => 'Server error.',
    'details' => $e->getMessage()
  ], 500);
}
