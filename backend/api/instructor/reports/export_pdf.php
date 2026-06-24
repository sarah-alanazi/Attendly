<?php
declare(strict_types=1);

require_once __DIR__ . '/../../../config/database.php';
require_once __DIR__ . '/../../../config/session.php';

session_start_safe();

if (!isset($_SESSION['user'])) {
    http_response_code(401);
    exit('Unauthorized');
}

$user = $_SESSION['user'];
$role = $user['role'] ?? '';
$instructorId = (int)($user['user_id'] ?? 0);

if ($role !== 'instructor') {
    http_response_code(403);
    exit('Forbidden');
}

$courseId = (int)($_GET['course_id'] ?? 0);
$classId = (int)($_GET['class_id'] ?? 0);
$dateFrom = trim((string)($_GET['date_from'] ?? ''));
$dateTo = trim((string)($_GET['date_to'] ?? ''));
$reportType = trim((string)($_GET['report_type'] ?? 'daily'));

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

    $stmt = $pdo->prepare("
        SELECT
            CONCAT(u.first_name, ' ', u.last_name) AS student_name,
            SUM(CASE WHEN r.status = 'present' THEN 1 ELSE 0 END) AS present_count,
            SUM(CASE WHEN r.status = 'absent' THEN 1 ELSE 0 END) AS absent_count,
            SUM(CASE WHEN r.status = 'late' THEN 1 ELSE 0 END) AS late_count,
            COUNT(r.record_id) AS total_records,
            SUM(CASE WHEN r.reliability_color = 'green' THEN 1 ELSE 0 END) AS green_count,
            SUM(CASE WHEN r.reliability_color = 'yellow' THEN 1 ELSE 0 END) AS yellow_count,
            SUM(CASE WHEN r.reliability_color = 'red' THEN 1 ELSE 0 END) AS red_count
        FROM attendance_records r
        INNER JOIN attendance_sessions s ON s.session_id = r.session_id
        INNER JOIN classes c ON c.class_id = s.class_id
        INNER JOIN users u ON u.user_id = r.student_id
        WHERE {$whereSql}
        GROUP BY u.user_id, u.first_name, u.last_name
        ORDER BY u.first_name ASC, u.last_name ASC
    ");
    $stmt->execute($params);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    header('Content-Type: text/html; charset=utf-8');

    echo '<!doctype html>';
    echo '<html lang="en"><head><meta charset="utf-8"><title>Instructor Report</title>';
    echo '<style>
      body{font-family:Arial,sans-serif;padding:30px;color:#111;}
      h1{margin-bottom:6px;}
      .sub{color:#555;margin-bottom:20px;}
      table{width:100%;border-collapse:collapse;margin-top:16px;}
      th,td{border:1px solid #ccc;padding:10px;text-align:left;font-size:14px;}
      th{background:#f3f4f6;}
      .meta{margin-bottom:8px;font-size:14px;}
    </style>';
    echo '</head><body>';
    echo '<h1>ATTENDLY Instructor Report</h1>';
    echo '<div class="sub">Report Type: ' . htmlspecialchars($reportType) . '</div>';
    echo '<div class="meta">Date From: ' . htmlspecialchars($dateFrom !== '' ? $dateFrom : 'All') . '</div>';
    echo '<div class="meta">Date To: ' . htmlspecialchars($dateTo !== '' ? $dateTo : 'All') . '</div>';

    echo '<table>';
    echo '<thead><tr><th>Student Name</th><th>Present</th><th>Absent</th><th>Late</th><th>Attendance %</th><th>Reliability</th></tr></thead>';
    echo '<tbody>';

    if (!$rows) {
        echo '<tr><td colspan="6">No data found.</td></tr>';
    } else {
        foreach ($rows as $row) {
            $present = (int)$row['present_count'];
            $absent = (int)$row['absent_count'];
            $late = (int)$row['late_count'];
            $total = (int)$row['total_records'];
            $percentage = $total > 0 ? round((($present + $late) / $total) * 100, 2) : 0;

            $green = (int)$row['green_count'];
            $yellow = (int)$row['yellow_count'];
            $red = (int)$row['red_count'];

            $reliability = 'Mixed';
            if ($green > 0 && $yellow === 0 && $red === 0) {
                $reliability = 'Strong';
            } elseif ($red > 0 && $green === 0) {
                $reliability = 'Weak';
            }

            echo '<tr>';
            echo '<td>' . htmlspecialchars($row['student_name']) . '</td>';
            echo '<td>' . $present . '</td>';
            echo '<td>' . $absent . '</td>';
            echo '<td>' . $late . '</td>';
            echo '<td>' . $percentage . '%</td>';
            echo '<td>' . htmlspecialchars($reliability) . '</td>';
            echo '</tr>';
        }
    }

    echo '</tbody></table>';
    echo '<script>window.onload=function(){window.print();}</script>';
    echo '</body></html>';
} catch (Throwable $e) {
    http_response_code(500);
    echo 'Server error';
}