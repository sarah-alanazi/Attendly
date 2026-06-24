<?php
declare(strict_types=1);

require_once __DIR__ . '/../../../config/database.php';
require_once __DIR__ . '/../../../config/session.php';
require_once __DIR__ . '/../../../helpers/response.php';

session_start_safe();

if (!isset($_SESSION['user'])) {
  json_response(['success' => false, 'message' => 'Unauthorized'], 401);
}

$user = $_SESSION['user'];
$role = $user['role'] ?? '';

if ($role !== 'admin') {
  json_response(['success' => false, 'message' => 'Forbidden'], 403);
}

try {
  $pdo = db(); 

  $usersCount   = (int)$pdo->query("SELECT COUNT(*) FROM users")->fetchColumn();
  $coursesCount = (int)$pdo->query("SELECT COUNT(*) FROM courses")->fetchColumn();
  $classesCount = (int)$pdo->query("SELECT COUNT(*) FROM classes")->fetchColumn();


  $stmt = $pdo->query("DESCRIBE attendance_alerts");
  $cols = $stmt->fetchAll(PDO::FETCH_COLUMN, 0);

  $resolvedCol = null;
  if (in_array('resolved', $cols, true)) $resolvedCol = 'resolved';
  if (in_array('is_resolved', $cols, true)) $resolvedCol = 'is_resolved';

  if ($resolvedCol) {
    $q = $pdo->prepare("SELECT COUNT(*) FROM attendance_alerts WHERE {$resolvedCol} = 0");
    $q->execute();
    $openAlerts = (int)$q->fetchColumn();
  } else {
 
    $openAlerts = (int)$pdo->query("SELECT COUNT(*) FROM attendance_alerts")->fetchColumn();
  }

  json_response([
    'success' => true,
    'data' => [
      'users' => $usersCount,
      'courses' => $coursesCount,
      'classes' => $classesCount,
      'open_alerts' => $openAlerts,
    ]
  ]);

} catch (Throwable $e) {
  json_response([
    'success' => false,
    'message' => 'Server error'
  ], 500);
}