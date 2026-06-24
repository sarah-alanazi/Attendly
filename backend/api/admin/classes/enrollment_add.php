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

  $class_id = (int)($data['class_id'] ?? 0);
  $student_id = (int)($data['student_id'] ?? 0);

  if ($class_id <= 0 || $student_id <= 0) {
    json_response(['success' => false, 'message' => 'Invalid class_id or student_id'], 422);
  }

  $chkClass = $pdo->prepare("SELECT COUNT(*) FROM classes WHERE class_id = :id");
  $chkClass->execute([':id' => $class_id]);
  if ((int)$chkClass->fetchColumn() === 0) json_response(['success' => false, 'message' => 'Class not found'], 404);

  $chkStu = $pdo->prepare("SELECT role, is_active FROM users WHERE user_id = :id");
  $chkStu->execute([':id' => $student_id]);
  $row = $chkStu->fetch(PDO::FETCH_ASSOC);
  if (!$row) json_response(['success' => false, 'message' => 'Student not found'], 404);
  if (($row['role'] ?? '') !== 'student') json_response(['success' => false, 'message' => 'User is not a student'], 422);
  if ((int)($row['is_active'] ?? 0) !== 1) json_response(['success' => false, 'message' => 'Student is suspended'], 409);

  $dup = $pdo->prepare("SELECT COUNT(*) FROM class_enrollment WHERE class_id=:cid AND student_id=:sid");
  $dup->execute([':cid' => $class_id, ':sid' => $student_id]);
  if ((int)$dup->fetchColumn() > 0) {
    json_response(['success' => false, 'message' => 'Student already enrolled in this class'], 409);
  }

  $stmt = $pdo->prepare("
    INSERT INTO class_enrollment (student_id, class_id, enrolled_at, status)
    VALUES (:sid, :cid, CURDATE(), 'enrolled')
  ");
  $stmt->execute([':sid' => $student_id, ':cid' => $class_id]);

  json_response(['success' => true, 'message' => 'Student enrolled']);

} catch (Throwable $e) {
  json_response(['success' => false, 'message' => $e->getMessage()], 500);
}