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

if ($role !== 'instructor') {
    json_response(['success' => false, 'message' => 'Forbidden'], 403);
}

$instructorId = (int)($user['user_id'] ?? 0);

if ($instructorId <= 0) {
    json_response(['success' => false, 'message' => 'Invalid instructor session'], 401);
}

try {
    $pdo = db();

    $profileStmt = $pdo->prepare("
        SELECT user_id, first_name, last_name, email
        FROM users
        WHERE user_id = :instructor_id
        LIMIT 1
    ");
    $profileStmt->execute([':instructor_id' => $instructorId]);
    $profile = $profileStmt->fetch(PDO::FETCH_ASSOC);

    $assignedCoursesStmt = $pdo->prepare("
        SELECT COUNT(DISTINCT course_id)
        FROM instructor_course
        WHERE instructor_id = :instructor_id
    ");
    $assignedCoursesStmt->execute([':instructor_id' => $instructorId]);
    $assignedCourses = (int)$assignedCoursesStmt->fetchColumn();

    $totalClassesStmt = $pdo->prepare("
        SELECT COUNT(DISTINCT c.class_id)
        FROM classes c
        INNER JOIN instructor_course ic ON ic.course_id = c.course_id
        WHERE ic.instructor_id = :instructor_id
    ");
    $totalClassesStmt->execute([':instructor_id' => $instructorId]);
    $totalClasses = (int)$totalClassesStmt->fetchColumn();

    $activeSessionsStmt = $pdo->prepare("
        SELECT COUNT(*)
        FROM attendance_sessions
        WHERE instructor_id = :instructor_id
          AND status = 'active'
    ");
    $activeSessionsStmt->execute([':instructor_id' => $instructorId]);
    $activeSessions = (int)$activeSessionsStmt->fetchColumn();

    $openAlertsStmt = $pdo->prepare("
        SELECT COUNT(*)
        FROM attendance_alerts a
        INNER JOIN classes c ON c.class_id = a.class_id
        INNER JOIN instructor_course ic ON ic.course_id = c.course_id
        WHERE ic.instructor_id = :instructor_id
          AND a.resolved = 0
    ");
    $openAlertsStmt->execute([':instructor_id' => $instructorId]);
    $openAlerts = (int)$openAlertsStmt->fetchColumn();

    $dayMap = [
        'Sunday' => 'Sunday',
        'Monday' => 'Monday',
        'Tuesday' => 'Tuesday',
        'Wednesday' => 'Wednesday',
        'Thursday' => 'Thursday',
        'Friday' => 'Friday',
        'Saturday' => 'Saturday'
    ];

    $todayEnglish = date('l');
    $todayLabel = $dayMap[$todayEnglish] ?? $todayEnglish;

    $todayClassesStmt = $pdo->prepare("
        SELECT 
            c.class_id,
            c.section,
            c.schedule_day,
            TIME_FORMAT(c.start_time, '%h:%i %p') AS start_time,
            TIME_FORMAT(c.end_time, '%h:%i %p') AS end_time,
            c.room,
            cr.course_name,
            cr.semester,
            cr.academic_year
        FROM classes c
        INNER JOIN courses cr ON cr.course_id = c.course_id
        INNER JOIN instructor_course ic ON ic.course_id = c.course_id
        WHERE ic.instructor_id = :instructor_id
          AND c.schedule_day = :schedule_day
        ORDER BY c.start_time ASC
    ");
    $todayClassesStmt->execute([
        ':instructor_id' => $instructorId,
        ':schedule_day' => $todayEnglish
    ]);
    $todayClasses = $todayClassesStmt->fetchAll(PDO::FETCH_ASSOC);

    $recentSessionsStmt = $pdo->prepare("
        SELECT
            s.session_id,
            s.session_date,
            TIME_FORMAT(s.start_time, '%h:%i %p') AS start_time,
            TIME_FORMAT(s.end_time, '%h:%i %p') AS end_time,
            s.status,
            s.qr_token,
            c.section,
            cr.course_name
        FROM attendance_sessions s
        INNER JOIN classes c ON c.class_id = s.class_id
        INNER JOIN courses cr ON cr.course_id = c.course_id
        WHERE s.instructor_id = :instructor_id
        ORDER BY s.session_date DESC, s.start_time DESC
        LIMIT 6
    ");
    $recentSessionsStmt->execute([':instructor_id' => $instructorId]);
    $recentSessions = $recentSessionsStmt->fetchAll(PDO::FETCH_ASSOC);

    json_response([
        'success' => true,
        'data' => [
            'profile' => [
                'user_id' => (int)($profile['user_id'] ?? 0),
                'full_name' => trim(($profile['first_name'] ?? '') . ' ' . ($profile['last_name'] ?? '')),
                'email' => $profile['email'] ?? ''
            ],
            'stats' => [
                'assigned_courses' => $assignedCourses,
                'total_classes' => $totalClasses,
                'active_sessions' => $activeSessions,
                'open_alerts' => $openAlerts
            ],
            'today_label' => $todayLabel,
            'today_classes' => $todayClasses,
            'recent_sessions' => $recentSessions
        ]
    ]);
} catch (Throwable $e) {
    json_response([
        'success' => false,
        'message' => 'Server error'
    ], 500);
}