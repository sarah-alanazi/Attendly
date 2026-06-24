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
$userId = (int)($user['user_id'] ?? 0);

if ($role !== 'instructor') {
    json_response(['success' => false, 'message' => 'Forbidden'], 403);
}

$currentPassword = (string)($_POST['current_password'] ?? '');
$newPassword = (string)($_POST['new_password'] ?? '');
$confirmPassword = (string)($_POST['confirm_password'] ?? '');

if ($currentPassword === '' || $newPassword === '' || $confirmPassword === '') {
    json_response(['success' => false, 'message' => 'All password fields are required'], 422);
}

if (strlen($newPassword) < 6) {
    json_response(['success' => false, 'message' => 'New password must be at least 6 characters'], 422);
}

if ($newPassword !== $confirmPassword) {
    json_response(['success' => false, 'message' => 'New password and confirm password do not match'], 422);
}

try {
    $pdo = db();

    $stmt = $pdo->prepare("
        SELECT password_hash
        FROM users
        WHERE user_id = :user_id
          AND role = 'instructor'
        LIMIT 1
    ");
    $stmt->execute([
        ':user_id' => $userId
    ]);

    $userRow = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$userRow) {
        json_response(['success' => false, 'message' => 'User not found'], 404);
    }

    $storedHash = (string)($userRow['password_hash'] ?? '');

    if (!password_verify($currentPassword, $storedHash)) {
        json_response(['success' => false, 'message' => 'Current password is incorrect'], 422);
    }

    $newHash = password_hash($newPassword, PASSWORD_DEFAULT);

    $updateStmt = $pdo->prepare("
        UPDATE users
        SET password_hash = :password_hash
        WHERE user_id = :user_id
          AND role = 'instructor'
    ");
    $updateStmt->execute([
        ':password_hash' => $newHash,
        ':user_id' => $userId
    ]);

    json_response([
        'success' => true,
        'message' => 'Password changed successfully'
    ]);
} catch (Throwable $e) {
    json_response([
        'success' => false,
        'message' => 'Server error'
    ], 500);
}