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

$firstName = trim((string)($_POST['first_name'] ?? ''));
$lastName = trim((string)($_POST['last_name'] ?? ''));
$username = trim((string)($_POST['username'] ?? ''));
$email = trim((string)($_POST['email'] ?? ''));

if ($firstName === '' || $lastName === '' || $username === '' || $email === '') {
    json_response(['success' => false, 'message' => 'All fields are required'], 422);
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    json_response(['success' => false, 'message' => 'Invalid email address'], 422);
}

try {
    $pdo = db();

    $checkStmt = $pdo->prepare("
        SELECT user_id
        FROM users
        WHERE (username = :username OR email = :email)
          AND user_id <> :user_id
        LIMIT 1
    ");
    $checkStmt->execute([
        ':username' => $username,
        ':email' => $email,
        ':user_id' => $userId
    ]);

    if ($checkStmt->fetch(PDO::FETCH_ASSOC)) {
        json_response(['success' => false, 'message' => 'Username or email already exists'], 409);
    }

    $stmt = $pdo->prepare("
        UPDATE users
        SET first_name = :first_name,
            last_name = :last_name,
            username = :username,
            email = :email
        WHERE user_id = :user_id
          AND role = 'instructor'
    ");
    $stmt->execute([
        ':first_name' => $firstName,
        ':last_name' => $lastName,
        ':username' => $username,
        ':email' => $email,
        ':user_id' => $userId
    ]);

    if (isset($_SESSION['user']) && is_array($_SESSION['user'])) {
        $_SESSION['user']['username'] = $username;
    }

    json_response([
        'success' => true,
        'message' => 'Profile updated successfully'
    ]);
} catch (Throwable $e) {
    json_response([
        'success' => false,
        'message' => 'Server error'
    ], 500);
}