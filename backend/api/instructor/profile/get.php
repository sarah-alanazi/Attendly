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

try {
    $pdo = db();

    $stmt = $pdo->prepare("
        SELECT
            user_id,
            first_name,
            last_name,
            username,
            email,
            role,
            is_active,
            created_at
        FROM users
        WHERE user_id = :user_id
          AND role = 'instructor'
        LIMIT 1
    ");
    $stmt->execute([
        ':user_id' => $userId
    ]);

    $profile = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$profile) {
        json_response(['success' => false, 'message' => 'Profile not found'], 404);
    }

    json_response([
        'success' => true,
        'data' => [
            'profile' => $profile
        ]
    ]);
} catch (Throwable $e) {
    json_response([
        'success' => false,
        'message' => 'Server error'
    ], 500);
}