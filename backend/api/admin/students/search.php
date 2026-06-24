<?php
declare(strict_types=1);

require_once __DIR__ . '/../_guard.php';
require_once __DIR__ . '/../../../config/database.php';
require_once __DIR__ . '/../../../helpers/response.php';

require_admin();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
  json_response(['success' => false, 'message' => 'Method not allowed'], 405);
}

try {
  $pdo = get_pdo();

  $q = trim((string)($_GET['q'] ?? ''));
  $limit = (int)($_GET['limit'] ?? 10);
  if ($limit < 1) $limit = 10;
  if ($limit > 25) $limit = 25;

  if ($q === '' || strlen($q) < 2) {
    json_response(['success' => true, 'data' => ['items' => []]]);
  }

  $like = '%' . $q . '%';

  $sql = "
    SELECT user_id, username, email, first_name, last_name
    FROM users
    WHERE role = 'student'
      AND is_active = 1
      AND (
        username LIKE :q1
        OR email LIKE :q2
        OR first_name LIKE :q3
        OR last_name LIKE :q4
        OR CONCAT(first_name, ' ', last_name) LIKE :q5
      )
    ORDER BY first_name ASC, last_name ASC, user_id DESC
    LIMIT $limit
  ";

  $stmt = $pdo->prepare($sql);
  $stmt->execute([
    ':q1' => $like,
    ':q2' => $like,
    ':q3' => $like,
    ':q4' => $like,
    ':q5' => $like,
  ]);

  $items = $stmt->fetchAll(PDO::FETCH_ASSOC);

  json_response(['success' => true, 'data' => ['items' => $items]]);
} catch (Throwable $e) {
  json_response(['success' => false, 'message' => $e->getMessage()], 500);
}