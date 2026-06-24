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
$instructorId = (int)($user['user_id'] ?? 0);

if ($role !== 'instructor') {
    json_response(['success' => false, 'message' => 'Forbidden'], 403);
}

$courseId = (int)($_GET['course_id'] ?? 0);
$classId = (int)($_GET['class_id'] ?? 0);
$dateFrom = trim((string)($_GET['date_from'] ?? ''));
$dateTo = trim((string)($_GET['date_to'] ?? ''));
$reportType = trim((string)($_GET['report_type'] ?? 'daily'));

$allowedTypes = ['daily', 'weekly', 'monthly', 'full_course_report'];
if (!in_array($reportType, $allowedTypes, true)) {
    $reportType = 'daily';
}

try {
    $pdo = db();

    $where = [];
    $params = [':instructor_id' => $instructorId];

    $where[] = "s.instructor_id = :instructor_id";

    if ($courseId > 0) {
        $where[] = "c.course_id = :course_id";
        $params[':course_id'] = $courseId;
    }

    if ($classId > 0) {
        $where[] = "s.class_id = :class_id";
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

    $whereSql = implode(' AND ', $where);

    $rowsSql = "
        SELECT
            u.user_id AS student_id,
            CONCAT(u.first_name, ' ', u.last_name) AS student_name,
            SUM(CASE WHEN r.status = 'present' THEN 1 ELSE 0 END) AS present_count,
            SUM(CASE WHEN r.status = 'absent' THEN 1 ELSE 0 END) AS absent_count,
            SUM(CASE WHEN r.status = 'late' THEN 1 ELSE 0 END) AS late_count,
            SUM(CASE WHEN r.reliability_color = 'green' THEN 1 ELSE 0 END) AS green_count,
            SUM(CASE WHEN r.reliability_color = 'yellow' THEN 1 ELSE 0 END) AS yellow_count,
            SUM(CASE WHEN r.reliability_color = 'red' THEN 1 ELSE 0 END) AS red_count,
            COUNT(r.record_id) AS total_records
        FROM attendance_records r
        INNER JOIN attendance_sessions s ON s.session_id = r.session_id
        INNER JOIN classes c ON c.class_id = s.class_id
        INNER JOIN users u ON u.user_id = r.student_id
        WHERE {$whereSql}
        GROUP BY u.user_id, u.first_name, u.last_name
        ORDER BY u.first_name ASC, u.last_name ASC
    ";

    $rowsStmt = $pdo->prepare($rowsSql);
    $rowsStmt->execute($params);
    $rowsRaw = $rowsStmt->fetchAll(PDO::FETCH_ASSOC);

    $rows = [];

    foreach ($rowsRaw as $row) {
        $present = (int)$row['present_count'];
        $absent = (int)$row['absent_count'];
        $late = (int)$row['late_count'];
        $total = (int)$row['total_records'];

        $percentage = $total > 0 ? round((($present + $late) / $total) * 100, 2) : 0;

        $green = (int)$row['green_count'];
        $yellow = (int)$row['yellow_count'];
        $red = (int)$row['red_count'];

        $reliabilityPattern = 'mixed';
        if ($green > 0 && $yellow === 0 && $red === 0) {
            $reliabilityPattern = 'strong';
        } elseif ($red > 0 && $green === 0) {
            $reliabilityPattern = 'weak';
        }

        $rows[] = [
            'student_name' => $row['student_name'],
            'present_count' => $present,
            'absent_count' => $absent,
            'late_count' => $late,
            'attendance_percentage' => $percentage,
            'reliability_pattern' => $reliabilityPattern
        ];
    }

    $summarySql = "
        SELECT
            COUNT(DISTINCT s.session_id) AS total_sessions,
            SUM(CASE WHEN r.status = 'present' THEN 1 ELSE 0 END) AS present_total,
            SUM(CASE WHEN r.status = 'absent' THEN 1 ELSE 0 END) AS absent_total,
            SUM(CASE WHEN r.status = 'late' THEN 1 ELSE 0 END) AS late_total,
            COUNT(r.record_id) AS total_records
        FROM attendance_sessions s
        LEFT JOIN attendance_records r ON r.session_id = s.session_id
        INNER JOIN classes c ON c.class_id = s.class_id
        WHERE {$whereSql}
    ";

    $summaryStmt = $pdo->prepare($summarySql);
    $summaryStmt->execute($params);
    $summaryRaw = $summaryStmt->fetch(PDO::FETCH_ASSOC) ?: [];

    $totalRecords = (int)($summaryRaw['total_records'] ?? 0);
    $presentTotal = (int)($summaryRaw['present_total'] ?? 0);
    $absentTotal = (int)($summaryRaw['absent_total'] ?? 0);
    $lateTotal = (int)($summaryRaw['late_total'] ?? 0);

    $summary = [
        'total_sessions' => (int)($summaryRaw['total_sessions'] ?? 0),
        'present_rate' => $totalRecords > 0 ? round(($presentTotal / $totalRecords) * 100, 2) : 0,
        'absent_rate' => $totalRecords > 0 ? round(($absentTotal / $totalRecords) * 100, 2) : 0,
        'late_rate' => $totalRecords > 0 ? round(($lateTotal / $totalRecords) * 100, 2) : 0
    ];

    json_response([
        'success' => true,
        'data' => [
            'rows' => $rows,
            'summary' => $summary,
            'report_type' => $reportType
        ]
    ]);
} catch (Throwable $e) {
    json_response([
        'success' => false,
        'message' => 'Server error'
    ], 500);
}