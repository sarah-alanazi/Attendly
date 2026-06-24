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
  $course_id = (int)($_GET['course_id'] ?? 0);
  $instructor_id = (int)($_GET['instructor_id'] ?? 0);
  $day = trim((string)($_GET['day'] ?? ''));
  $time_from = trim((string)($_GET['time_from'] ?? ''));
  $time_to = trim((string)($_GET['time_to'] ?? ''));
  $room = trim((string)($_GET['room'] ?? ''));
  $section = trim((string)($_GET['section'] ?? ''));

  $where = [];
  $params = [];

  if ($search !== '') {
    $where[] = "(cl.section LIKE :q1 OR cl.room LIKE :q2 OR c.course_name LIKE :q3)";
    $params[':q1'] = '%' . $search . '%';
    $params[':q2'] = '%' . $search . '%';
    $params[':q3'] = '%' . $search . '%';
  }

  if ($course_id > 0) {
    $where[] = "cl.course_id = :cid";
    $params[':cid'] = $course_id;
  }

  if ($day !== '') {
    $where[] = "cl.schedule_day = :day";
    $params[':day'] = $day;
  }

  if ($room !== '') {
    $where[] = "cl.room LIKE :room";
    $params[':room'] = '%' . $room . '%';
  }

  if ($section !== '') {
    $where[] = "cl.section LIKE :sec";
    $params[':sec'] = '%' . $section . '%';
  }

  if ($time_from !== '') {
    $where[] = "cl.start_time >= :tf";
    $params[':tf'] = $time_from;
  }

  if ($time_to !== '') {
    $where[] = "cl.end_time <= :tt";
    $params[':tt'] = $time_to;
  }

  if ($instructor_id > 0) {
    $where[] = "EXISTS (
      SELECT 1
      FROM instructor_course icx
      WHERE icx.course_id = cl.course_id
        AND icx.instructor_id = :iid
    )";
    $params[':iid'] = $instructor_id;
  }

  $whereSql = $where ? ("WHERE " . implode(" AND ", $where)) : "";

  $stmtCount = $pdo->prepare("
    SELECT COUNT(*)
    FROM classes cl
    JOIN courses c ON c.course_id = cl.course_id
    $whereSql
  ");
  $stmtCount->execute($params);
  $total = (int)$stmtCount->fetchColumn();

  $offset = ($page - 1) * $pageSize;
  $limit = $pageSize;

  $sql = "
    SELECT
      cl.class_id,
      cl.course_id,
      cl.section,
      cl.schedule_day,
      cl.start_time,
      cl.end_time,
      cl.room,
      c.course_name,
      COALESCE((
        SELECT GROUP_CONCAT(DISTINCT CONCAT(u.first_name, ' ', u.last_name) SEPARATOR ', ')
        FROM instructor_course ic2
        JOIN users u ON u.user_id = ic2.instructor_id AND u.role = 'instructor'
        WHERE ic2.course_id = cl.course_id
      ), '—') AS instructors_text
    FROM classes cl
    JOIN courses c ON c.course_id = cl.course_id
    $whereSql
    ORDER BY cl.class_id DESC
    LIMIT $limit OFFSET $offset
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