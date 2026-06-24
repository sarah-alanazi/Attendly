<?php
declare(strict_types=1);

require_once __DIR__ . '/../_guard.php';
require_once __DIR__ . '/../../../config/database.php';
require_once __DIR__ . '/../../../helpers/response.php';

require_admin();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
  json_response(['success' => false, 'message' => 'Method not allowed'], 405);
}

function valid_date(?string $value): bool {
  if ($value === null || $value === '') return true;
  $d = DateTime::createFromFormat('Y-m-d', $value);
  return $d && $d->format('Y-m-d') === $value;
}

try {
  $pdo = get_pdo();

  $reportType = trim((string)($_GET['report_type'] ?? 'course_summary'));
  $courseId = (int)($_GET['course_id'] ?? 0);
  $classId = (int)($_GET['class_id'] ?? 0);
  $dateFrom = trim((string)($_GET['date_from'] ?? ''));
  $dateTo = trim((string)($_GET['date_to'] ?? ''));

  $allowed = ['course_summary', 'class_summary', 'low_attendance', 'alerts_summary'];
  if (!in_array($reportType, $allowed, true)) {
    json_response(['success' => false, 'message' => 'Invalid report type'], 422);
  }

  if (!valid_date($dateFrom) || !valid_date($dateTo)) {
    json_response(['success' => false, 'message' => 'Invalid date format'], 422);
  }

  $params = [];
  $where = [];

  if ($reportType === 'alerts_summary') {
    if ($courseId > 0) {
      $where[] = "cl.course_id = :course_id";
      $params[':course_id'] = $courseId;
    }

    if ($classId > 0) {
      $where[] = "a.class_id = :class_id";
      $params[':class_id'] = $classId;
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

    $sql = "
      SELECT
        a.alert_type,
        COUNT(*) AS total_alerts,
        SUM(CASE WHEN a.resolved = 1 THEN 1 ELSE 0 END) AS resolved_count,
        SUM(CASE WHEN a.resolved = 0 THEN 1 ELSE 0 END) AS unresolved_count
      FROM attendance_alerts a
      INNER JOIN classes cl ON cl.class_id = a.class_id
      $whereSql
      GROUP BY a.alert_type
      ORDER BY total_alerts DESC, a.alert_type ASC
    ";

    $stmt = $pdo->prepare($sql);
    foreach ($params as $k => $v) {
      $stmt->bindValue($k, $v);
    }
    $stmt->execute();
    $items = $stmt->fetchAll(PDO::FETCH_ASSOC);

    json_response([
      'success' => true,
      'data' => [
        'items' => $items
      ]
    ]);
  }

  if ($courseId > 0) {
    $where[] = "c.course_id = :course_id";
    $params[':course_id'] = $courseId;
  }

  if ($classId > 0) {
    $where[] = "cl.class_id = :class_id";
    $params[':class_id'] = $classId;
  }

  if ($dateFrom !== '') {
    $where[] = "s.session_date >= :date_from";
    $params[':date_from'] = $dateFrom;
  }

  if ($dateTo !== '') {
    $where[] = "s.session_date <= :date_to";
    $params[':date_to'] = $dateTo;
  }

  $whereSql = $where ? ("WHERE " . implode(" AND ", $where)) : "";

  if ($reportType === 'course_summary') {
    $sql = "
      SELECT
        c.course_id,
        c.course_name,
        COUNT(DISTINCT cl.class_id) AS classes_count,
        COUNT(DISTINCT s.session_id) AS sessions_count,
        SUM(CASE WHEN ar.status = 'present' THEN 1 ELSE 0 END) AS present_count,
        SUM(CASE WHEN ar.status = 'absent' THEN 1 ELSE 0 END) AS absent_count,
        SUM(CASE WHEN ar.status = 'late' THEN 1 ELSE 0 END) AS late_count,
        ROUND(
          (
            SUM(CASE WHEN ar.status IN ('present', 'late') THEN 1 ELSE 0 END) * 100.0
          ) / NULLIF(COUNT(ar.record_id), 0),
          2
        ) AS attendance_rate
      FROM courses c
      INNER JOIN classes cl ON cl.course_id = c.course_id
      LEFT JOIN attendance_sessions s ON s.class_id = cl.class_id
      LEFT JOIN attendance_records ar ON ar.session_id = s.session_id
      $whereSql
      GROUP BY c.course_id, c.course_name
      ORDER BY c.course_name ASC
    ";

    $stmt = $pdo->prepare($sql);
    foreach ($params as $k => $v) {
      $stmt->bindValue($k, $v);
    }
    $stmt->execute();
    $items = $stmt->fetchAll(PDO::FETCH_ASSOC);

    json_response([
      'success' => true,
      'data' => [
        'items' => $items
      ]
    ]);
  }

  if ($reportType === 'class_summary') {
    $sql = "
      SELECT
        cl.class_id,
        cl.section,
        cl.schedule_day,
        cl.room,
        c.course_name,
        COUNT(DISTINCT s.session_id) AS sessions_count,
        SUM(CASE WHEN ar.status = 'present' THEN 1 ELSE 0 END) AS present_count,
        SUM(CASE WHEN ar.status = 'absent' THEN 1 ELSE 0 END) AS absent_count,
        SUM(CASE WHEN ar.status = 'late' THEN 1 ELSE 0 END) AS late_count,
        ROUND(
          (
            SUM(CASE WHEN ar.status IN ('present', 'late') THEN 1 ELSE 0 END) * 100.0
          ) / NULLIF(COUNT(ar.record_id), 0),
          2
        ) AS attendance_rate
      FROM classes cl
      INNER JOIN courses c ON c.course_id = cl.course_id
      LEFT JOIN attendance_sessions s ON s.class_id = cl.class_id
      LEFT JOIN attendance_records ar ON ar.session_id = s.session_id
      $whereSql
      GROUP BY cl.class_id, cl.section, cl.schedule_day, cl.room, c.course_name
      ORDER BY c.course_name ASC, cl.section ASC
    ";

    $stmt = $pdo->prepare($sql);
    foreach ($params as $k => $v) {
      $stmt->bindValue($k, $v);
    }
    $stmt->execute();
    $items = $stmt->fetchAll(PDO::FETCH_ASSOC);

    json_response([
      'success' => true,
      'data' => [
        'items' => $items
      ]
    ]);
  }

  if ($reportType === 'low_attendance') {
    $sql = "
      SELECT
        u.user_id AS student_id,
        CONCAT(u.first_name, ' ', u.last_name) AS student_name,
        u.email,
        c.course_name,
        cl.class_id,
        cl.section,
        SUM(CASE WHEN ar.status = 'present' THEN 1 ELSE 0 END) AS present_count,
        SUM(CASE WHEN ar.status = 'absent' THEN 1 ELSE 0 END) AS absent_count,
        SUM(CASE WHEN ar.status = 'late' THEN 1 ELSE 0 END) AS late_count,
        COUNT(ar.record_id) AS total_records,
        ROUND(
          (
            SUM(CASE WHEN ar.status IN ('present', 'late') THEN 1 ELSE 0 END) * 100.0
          ) / NULLIF(COUNT(ar.record_id), 0),
          2
        ) AS attendance_rate
      FROM attendance_records ar
      INNER JOIN attendance_sessions s ON s.session_id = ar.session_id
      INNER JOIN classes cl ON cl.class_id = s.class_id
      INNER JOIN courses c ON c.course_id = cl.course_id
      INNER JOIN users u ON u.user_id = ar.student_id
      $whereSql
      GROUP BY u.user_id, u.first_name, u.last_name, u.email, c.course_name, cl.class_id, cl.section
      HAVING attendance_rate < 75
      ORDER BY attendance_rate ASC, student_name ASC
    ";

    $stmt = $pdo->prepare($sql);
    foreach ($params as $k => $v) {
      $stmt->bindValue($k, $v);
    }
    $stmt->execute();
    $items = $stmt->fetchAll(PDO::FETCH_ASSOC);

    json_response([
      'success' => true,
      'data' => [
        'items' => $items
      ]
    ]);
  }

  json_response(['success' => false, 'message' => 'Unknown report type'], 422);

} catch (Throwable $e) {
  json_response(['success' => false, 'message' => $e->getMessage()], 500);
}