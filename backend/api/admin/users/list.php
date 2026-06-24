<?php
declare(strict_types=1);

require_once __DIR__ . '/../_guard.php';
require_once __DIR__ . '/../../../config/database.php';
require_once __DIR__ . '/../../../helpers/response.php';

require_admin();

try {
  $pdo = get_pdo();

  $page = max(1, (int)($_GET['page'] ?? 1));
  $pageSize = (int)($_GET['pageSize'] ?? 10);
  if ($pageSize < 5) $pageSize = 5;
  if ($pageSize > 50) $pageSize = 50;

  $offset = ($page - 1) * $pageSize;

  $search = trim((string)($_GET['search'] ?? ''));
  $role = trim((string)($_GET['role'] ?? ''));
  $status = trim((string)($_GET['status'] ?? ''));

  $where = [];
  $params = [];

  $where[] = "role <> 'admin'";

  if ($role !== '') {
    if (!in_array($role, ['instructor', 'student'], true)) {
      json_response(['success' => false, 'message' => 'Invalid role filter'], 422);
    }
    $where[] = "role = :role";
    $params[':role'] = $role;
  }

  if ($status === 'active') $where[] = "is_active = 1";
  if ($status === 'suspended') $where[] = "is_active = 0";

  if ($search !== '') {
    $where[] = "(username LIKE :s1 OR email LIKE :s2 OR first_name LIKE :s3 OR last_name LIKE :s4)";
    $params[':s1'] = '%' . $search . '%';
    $params[':s2'] = '%' . $search . '%';
    $params[':s3'] = '%' . $search . '%';
    $params[':s4'] = '%' . $search . '%';
  }

  $whereSql = count($where) ? ('WHERE ' . implode(' AND ', $where)) : '';

  $stmtTotal = $pdo->prepare("SELECT COUNT(*) FROM users {$whereSql}");
  $stmtTotal->execute($params);
  $total = (int)$stmtTotal->fetchColumn();

  $sql = "
    SELECT user_id, username, email, first_name, last_name, role, is_active, created_at
    FROM users
    {$whereSql}
    ORDER BY created_at DESC
    LIMIT {$pageSize} OFFSET {$offset}
  ";

  $stmt = $pdo->prepare($sql);
  $stmt->execute($params);
  $items = $stmt->fetchAll(PDO::FETCH_ASSOC);

  json_response([
    'success' => true,
    'data' => [
      'items' => $items,
      'total' => $total,
      'page' => $page,
      'pageSize' => $pageSize
    ]
  ]);

} catch (Throwable $e) {
  json_response(['success' => false, 'message' => $e->getMessage()], 500);
}