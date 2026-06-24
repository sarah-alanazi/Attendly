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

  $type = trim((string)($_GET['type'] ?? ''));
  $resolved = trim((string)($_GET['resolved'] ?? ''));
  $dateFrom = trim((string)($_GET['date_from'] ?? ''));
  $dateTo = trim((string)($_GET['date_to'] ?? ''));

  $where = [];
  $params = [];

  if ($type !== '') {
    $where[] = "a.alert_type = :type";
    $params[':type'] = $type;
  }

  if ($resolved !== '' && ($resolved === '0' || $resolved === '1')) {
    $where[] = "a.resolved = :resolved";
    $params[':resolved'] = (int)$resolved;
  }

  if ($dateFrom !== '') {
    $where[] = "DATE(a.generated_at) >= :date_from";
    $params[':date_from'] = $dateFrom;
  }

  if ($dateTo !== '') {
    $where[] = "DATE(a.generated_at) <= :date_to";
    $params[':date_to'] = $dateTo;
  }

  $whereSql = $where ? ("WHERE " . implode(" AND ", $where)) : "";

  $countSql = "
    SELECT COUNT(*)
    FROM attendance_alerts a
    $whereSql
  ";
  $stmtCount = $pdo->prepare($countSql);
  $stmtCount->execute($params);
  $total = (int)$stmtCount->fetchColumn();

  $offset = ($page - 1) * $pageSize;

  $sql = "
    SELECT
      a.alert_id,
      a.student_id,
      a.class_id,
      a.alert_type,
      a.description,
      a.generated_at,
      a.resolved,
      CONCAT(u.first_name, ' ', u.last_name) AS student_name,
      u.email AS student_email,
      c.course_name,
      cl.section
    FROM attendance_alerts a
    INNER JOIN users u ON u.user_id = a.student_id
    INNER JOIN classes cl ON cl.class_id = a.class_id
    INNER JOIN courses c ON c.course_id = cl.course_id
    $whereSql
    ORDER BY a.generated_at DESC, a.alert_id DESC
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