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

  $page = max(1, (int)($_GET['page'] ?? 1));
  $pageSize = (int)($_GET['pageSize'] ?? 10);
  if ($pageSize < 1) $pageSize = 10;
  if ($pageSize > 50) $pageSize = 50;

  $search = trim((string)($_GET['search'] ?? ''));
  $semester = trim((string)($_GET['semester'] ?? ''));
  $year = trim((string)($_GET['academic_year'] ?? ''));

  $where = [];
  $params = [];

  if ($search !== '') {
    $where[] = "c.course_name LIKE :q";
    $params[':q'] = '%' . $search . '%';
  }

  if ($semester !== '') {
    $where[] = "c.semester = :sem";
    $params[':sem'] = $semester;
  }

  if ($year !== '') {
    $where[] = "c.academic_year = :yr";
    $params[':yr'] = $year;
  }

  $whereSql = $where ? ("WHERE " . implode(" AND ", $where)) : "";

  $countSql = "SELECT COUNT(*) FROM courses c $whereSql";
  $stmtCount = $pdo->prepare($countSql);
  $stmtCount->execute($params);
  $total = (int)$stmtCount->fetchColumn();

  $offset = ($page - 1) * $pageSize;

  $sql = "
    SELECT
      c.course_id,
      c.course_name,
      c.credits,
      c.semester,
      c.academic_year
    FROM courses c
    $whereSql
    ORDER BY c.course_id DESC
    LIMIT :lim OFFSET :off
  ";

  $stmt = $pdo->prepare($sql);
  foreach ($params as $k => $v) {
    $stmt->bindValue($k, $v);
  }
  $stmt->bindValue(':lim', $pageSize, PDO::PARAM_INT);
  $stmt->bindValue(':off', $offset, PDO::PARAM_INT);
  $stmt->execute();

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