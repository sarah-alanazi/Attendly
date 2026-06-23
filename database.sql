-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3307
-- Generation Time: Mar 12, 2026 at 06:06 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `attendly`
--

-- --------------------------------------------------------

--
-- Table structure for table `attendance_alerts`
--

CREATE TABLE `attendance_alerts` (
  `alert_id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `class_id` int(11) NOT NULL,
  `alert_type` enum('low_attendance','late','suspicious') NOT NULL,
  `description` text NOT NULL,
  `generated_at` datetime NOT NULL DEFAULT current_timestamp(),
  `resolved` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `attendance_alerts`
--

INSERT INTO `attendance_alerts` (`alert_id`, `student_id`, `class_id`, `alert_type`, `description`, `generated_at`, `resolved`) VALUES
(1, 13, 4, 'low_attendance', 'Student missed an attendance session in Web Development (Section A).', '2026-02-25 04:41:28', 0),
(2, 14, 2, 'late', 'Student arrived late to Database Systems session.', '2026-02-25 04:41:28', 0);

-- --------------------------------------------------------

--
-- Table structure for table `attendance_appeals`
--

CREATE TABLE `attendance_appeals` (
  `appeal_id` int(11) NOT NULL,
  `record_id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `reason` text NOT NULL,
  `evidence_url` varchar(255) DEFAULT NULL,
  `status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  `reviewed_by` int(11) DEFAULT NULL,
  `review_note` text DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `reviewed_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `attendance_appeals`
--

INSERT INTO `attendance_appeals` (`appeal_id`, `record_id`, `student_id`, `reason`, `evidence_url`, `status`, `reviewed_by`, `review_note`, `created_at`, `reviewed_at`) VALUES
(1, 2, 14, 'Requesting review because the scan was delayed due to network issue.', 'https://tse1.mm.bing.net/th/id/OIP.WF2ASOBPwpq9r1CxEHdxcgHaHa?rs=1&pid=ImgDetMain&o=7&rm=3', 'pending', 1, '', '2026-02-25 04:41:28', '2026-03-07 00:32:11');

-- --------------------------------------------------------

--
-- Table structure for table `attendance_records`
--

CREATE TABLE `attendance_records` (
  `record_id` int(11) NOT NULL,
  `session_id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `status` enum('present','absent','late') NOT NULL,
  `scan_at` datetime DEFAULT NULL,
  `scan_lat` decimal(10,7) DEFAULT NULL,
  `scan_lng` decimal(10,7) DEFAULT NULL,
  `location_accuracy_m` int(11) DEFAULT NULL,
  `within_campus` tinyint(1) NOT NULL DEFAULT 0,
  `reliability_color` enum('green','yellow','red') NOT NULL DEFAULT 'red',
  `notes` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `attendance_records`
--

INSERT INTO `attendance_records` (`record_id`, `session_id`, `student_id`, `status`, `scan_at`, `scan_lat`, `scan_lng`, `location_accuracy_m`, `within_campus`, `reliability_color`, `notes`) VALUES
(1, 1, 13, 'present', '2026-02-05 09:02:10', 31.9501000, 35.9102000, 12, 1, 'green', NULL),
(2, 1, 14, 'late', '2026-02-05 09:12:40', 31.9501300, 35.9102400, 18, 1, 'yellow', 'Arrived after start time'),
(3, 2, 13, 'absent', NULL, NULL, NULL, NULL, 0, 'red', 'No scan recorded');

-- --------------------------------------------------------

--
-- Table structure for table `attendance_sessions`
--

CREATE TABLE `attendance_sessions` (
  `session_id` int(11) NOT NULL,
  `class_id` int(11) NOT NULL,
  `instructor_id` int(11) NOT NULL,
  `session_date` date NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `session_lat` decimal(10,7) DEFAULT NULL,
  `session_lng` decimal(10,7) DEFAULT NULL,
  `qr_token` varchar(120) DEFAULT NULL,
  `qr_expires_at` datetime DEFAULT NULL,
  `status` enum('active','closed') NOT NULL DEFAULT 'active'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `attendance_sessions`
--

INSERT INTO `attendance_sessions` (`session_id`, `class_id`, `instructor_id`, `session_date`, `start_time`, `end_time`, `session_lat`, `session_lng`, `qr_token`, `qr_expires_at`, `status`) VALUES
(1, 2, 11, '2026-02-05', '09:00:00', '10:15:00', NULL, NULL, 'QR_DB_A_20260205', '2026-02-05 10:20:00', 'closed'),
(2, 4, 12, '2026-03-06', '10:00:00', '11:45:00', NULL, NULL, 'QR_WEB_A_20260206', '2026-03-06 11:20:00', 'closed'),
(5, 3, 11, '2026-03-12', '07:52:00', '08:52:00', 24.7100000, 46.6700000, '3f53b5934ace59ee2714f92c882f263f', '2026-03-12 06:24:31', 'active');

-- --------------------------------------------------------

--
-- Table structure for table `classes`
--

CREATE TABLE `classes` (
  `class_id` int(11) NOT NULL,
  `course_id` int(11) NOT NULL,
  `section` varchar(30) NOT NULL,
  `schedule_day` varchar(20) NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `room` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `classes`
--

INSERT INTO `classes` (`class_id`, `course_id`, `section`, `schedule_day`, `start_time`, `end_time`, `room`) VALUES
(1, 1, '2', 'Monday', '04:29:00', '06:29:00', 'm'),
(2, 2, 'A', 'Sunday', '09:00:00', '10:15:00', 'B1-201'),
(3, 2, 'B', 'Tuesday', '11:00:00', '12:15:00', 'B1-202'),
(4, 3, 'A', 'Monday', '10:00:00', '11:15:00', 'C2-105'),
(5, 4, 'A', 'Wednesday', '12:00:00', '13:15:00', 'D3-110'),
(6, 4, '2', 'Sunday', '17:51:00', '19:51:00', 'kk');

-- --------------------------------------------------------

--
-- Table structure for table `class_enrollment`
--

CREATE TABLE `class_enrollment` (
  `enrollment_id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `class_id` int(11) NOT NULL,
  `enrolled_at` date NOT NULL,
  `status` enum('enrolled','dropped') NOT NULL DEFAULT 'enrolled'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `class_enrollment`
--

INSERT INTO `class_enrollment` (`enrollment_id`, `student_id`, `class_id`, `enrolled_at`, `status`) VALUES
(1, 13, 2, '2026-02-02', 'enrolled'),
(2, 13, 4, '2026-02-02', 'enrolled'),
(3, 14, 2, '2026-02-02', 'enrolled'),
(4, 14, 5, '2026-02-02', 'enrolled'),
(5, 15, 3, '2026-02-02', 'dropped');

-- --------------------------------------------------------

--
-- Table structure for table `courses`
--

CREATE TABLE `courses` (
  `course_id` int(11) NOT NULL,
  `course_name` varchar(120) NOT NULL,
  `credits` int(11) NOT NULL,
  `semester` varchar(20) NOT NULL,
  `academic_year` varchar(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `courses`
--

INSERT INTO `courses` (`course_id`, `course_name`, `credits`, `semester`, `academic_year`) VALUES
(1, 'Introduction to Programming', 40, 'Fall', '2025/2026'),
(2, 'Database Systems', 3, 'Fall', '2025/2026'),
(3, 'Web Development', 3, 'Fall', '2025/2026'),
(4, 'Software Engineering', 3, 'Fall', '2025/2026');

-- --------------------------------------------------------

--
-- Table structure for table `instructor_course`
--

CREATE TABLE `instructor_course` (
  `instructor_course_id` int(11) NOT NULL,
  `instructor_id` int(11) NOT NULL,
  `course_id` int(11) NOT NULL,
  `assigned_date` date NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `instructor_course`
--

INSERT INTO `instructor_course` (`instructor_course_id`, `instructor_id`, `course_id`, `assigned_date`) VALUES
(1, 4, 1, '2026-02-25'),
(2, 11, 2, '2026-02-01'),
(3, 12, 3, '2026-02-01'),
(4, 12, 4, '2026-02-01');

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `notification_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `message` text NOT NULL,
  `type` enum('attendance_update','class_reminder','warning') NOT NULL,
  `sent_at` datetime NOT NULL DEFAULT current_timestamp(),
  `is_read` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `notifications`
--

INSERT INTO `notifications` (`notification_id`, `user_id`, `message`, `type`, `sent_at`, `is_read`) VALUES
(1, 13, 'Your attendance status was updated for Web Development.', 'attendance_update', '2026-02-25 04:41:28', 0),
(2, 14, 'Warning: You were marked late in Database Systems.', 'warning', '2026-02-25 04:41:28', 0);

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `user_id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `email` varchar(120) NOT NULL,
  `first_name` varchar(60) NOT NULL,
  `last_name` varchar(60) NOT NULL,
  `role` enum('admin','instructor','student') NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`user_id`, `username`, `password_hash`, `email`, `first_name`, `last_name`, `role`, `is_active`, `created_at`) VALUES
(1, 'admin', '$2y$10$WACSlXMwWfAlSY6NlwuN8e7RXP1qQt4T7LZUjQUNRPKMV95DQI8Ie', 'admin@gmail.com', 'System', 'Admin', 'admin', 1, '2026-02-08 02:47:43'),
(2, 'aaaaab', '$2y$10$ncJAS3Xpn/uf0IlXB6yg5.jKbB4bce1g6FaGpXxoYpjBdmJQ10h8O', 'asd@gmail.com', 'aaaddcx', 'kjkjipp', 'student', 1, '2026-02-25 02:09:37'),
(4, 'nasir', '$2y$10$zVpS0wdSeOQvIWCKdfCXBOD5YXqcl52WdFb4Zq5g.i5pDoQGrJ.Im', 'nasir@gmail.com', 'Nasir', 'Mohammed', 'instructor', 1, '2026-02-25 02:45:44'),
(11, 'ins.sara', '$2y$10$3kKzMUJ8HBRBX.5Op7tZUu5bNQNAAZo2n97389KrVWA0DcWAlByqa', 'sara@gmail.com', 'Sara', 'Hassan', 'instructor', 1, '2026-02-25 04:41:27'),
(12, 'ins.ali', '__HASH_INS2__', 'ali.ins@attendly.com', 'Ali', 'Saleh', 'instructor', 1, '2026-02-25 04:41:27'),
(13, 'std.ahmed', '__HASH_STD1__', 'ahmed.std@attendly.com', 'Ahmed', 'Khaled', 'student', 1, '2026-02-25 04:41:27'),
(14, 'std.mona', '__HASH_STD2__', 'mona.std@attendly.com', 'Mona', 'Yahya', 'student', 1, '2026-02-25 04:41:27'),
(15, 'std.fahad', '__HASH_STD3__', 'fahad.std@attendly.com', 'Fahad', 'Omar', 'student', 1, '2026-02-25 04:41:27');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `attendance_alerts`
--
ALTER TABLE `attendance_alerts`
  ADD PRIMARY KEY (`alert_id`),
  ADD KEY `fk_attendance_alerts_class` (`class_id`),
  ADD KEY `idx_attendance_alerts_student_id` (`student_id`);

--
-- Indexes for table `attendance_appeals`
--
ALTER TABLE `attendance_appeals`
  ADD PRIMARY KEY (`appeal_id`),
  ADD KEY `fk_attendance_appeals_record` (`record_id`),
  ADD KEY `fk_attendance_appeals_reviewer` (`reviewed_by`),
  ADD KEY `idx_attendance_appeals_student_id` (`student_id`);

--
-- Indexes for table `attendance_records`
--
ALTER TABLE `attendance_records`
  ADD PRIMARY KEY (`record_id`),
  ADD UNIQUE KEY `uq_attendance_record` (`session_id`,`student_id`),
  ADD KEY `idx_attendance_records_student_id` (`student_id`);

--
-- Indexes for table `attendance_sessions`
--
ALTER TABLE `attendance_sessions`
  ADD PRIMARY KEY (`session_id`),
  ADD UNIQUE KEY `qr_token` (`qr_token`),
  ADD KEY `fk_attendance_sessions_instructor` (`instructor_id`),
  ADD KEY `idx_attendance_sessions_class_date` (`class_id`,`session_date`);

--
-- Indexes for table `classes`
--
ALTER TABLE `classes`
  ADD PRIMARY KEY (`class_id`),
  ADD KEY `idx_classes_course_id` (`course_id`);

--
-- Indexes for table `class_enrollment`
--
ALTER TABLE `class_enrollment`
  ADD PRIMARY KEY (`enrollment_id`),
  ADD UNIQUE KEY `uq_class_enrollment` (`student_id`,`class_id`),
  ADD KEY `idx_class_enrollment_class_id` (`class_id`);

--
-- Indexes for table `courses`
--
ALTER TABLE `courses`
  ADD PRIMARY KEY (`course_id`);

--
-- Indexes for table `instructor_course`
--
ALTER TABLE `instructor_course`
  ADD PRIMARY KEY (`instructor_course_id`),
  ADD KEY `idx_instructor_course_instructor_id` (`instructor_id`),
  ADD KEY `idx_instructor_course_course_id` (`course_id`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`notification_id`),
  ADD KEY `idx_notifications_user_id` (`user_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `attendance_alerts`
--
ALTER TABLE `attendance_alerts`
  MODIFY `alert_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `attendance_appeals`
--
ALTER TABLE `attendance_appeals`
  MODIFY `appeal_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `attendance_records`
--
ALTER TABLE `attendance_records`
  MODIFY `record_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `attendance_sessions`
--
ALTER TABLE `attendance_sessions`
  MODIFY `session_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `classes`
--
ALTER TABLE `classes`
  MODIFY `class_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `class_enrollment`
--
ALTER TABLE `class_enrollment`
  MODIFY `enrollment_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `courses`
--
ALTER TABLE `courses`
  MODIFY `course_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `instructor_course`
--
ALTER TABLE `instructor_course`
  MODIFY `instructor_course_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `notification_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `user_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `attendance_alerts`
--
ALTER TABLE `attendance_alerts`
  ADD CONSTRAINT `fk_attendance_alerts_class` FOREIGN KEY (`class_id`) REFERENCES `classes` (`class_id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_attendance_alerts_student` FOREIGN KEY (`student_id`) REFERENCES `users` (`user_id`) ON UPDATE CASCADE;

--
-- Constraints for table `attendance_appeals`
--
ALTER TABLE `attendance_appeals`
  ADD CONSTRAINT `fk_attendance_appeals_record` FOREIGN KEY (`record_id`) REFERENCES `attendance_records` (`record_id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_attendance_appeals_reviewer` FOREIGN KEY (`reviewed_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_attendance_appeals_student` FOREIGN KEY (`student_id`) REFERENCES `users` (`user_id`) ON UPDATE CASCADE;

--
-- Constraints for table `attendance_records`
--
ALTER TABLE `attendance_records`
  ADD CONSTRAINT `fk_attendance_records_session` FOREIGN KEY (`session_id`) REFERENCES `attendance_sessions` (`session_id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_attendance_records_student` FOREIGN KEY (`student_id`) REFERENCES `users` (`user_id`) ON UPDATE CASCADE;

--
-- Constraints for table `attendance_sessions`
--
ALTER TABLE `attendance_sessions`
  ADD CONSTRAINT `fk_attendance_sessions_class` FOREIGN KEY (`class_id`) REFERENCES `classes` (`class_id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_attendance_sessions_instructor` FOREIGN KEY (`instructor_id`) REFERENCES `users` (`user_id`) ON UPDATE CASCADE;

--
-- Constraints for table `classes`
--
ALTER TABLE `classes`
  ADD CONSTRAINT `fk_classes_course` FOREIGN KEY (`course_id`) REFERENCES `courses` (`course_id`) ON UPDATE CASCADE;

--
-- Constraints for table `class_enrollment`
--
ALTER TABLE `class_enrollment`
  ADD CONSTRAINT `fk_class_enrollment_class` FOREIGN KEY (`class_id`) REFERENCES `classes` (`class_id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_class_enrollment_student` FOREIGN KEY (`student_id`) REFERENCES `users` (`user_id`) ON UPDATE CASCADE;

--
-- Constraints for table `instructor_course`
--
ALTER TABLE `instructor_course`
  ADD CONSTRAINT `fk_instructor_course_course` FOREIGN KEY (`course_id`) REFERENCES `courses` (`course_id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_instructor_course_instructor` FOREIGN KEY (`instructor_id`) REFERENCES `users` (`user_id`) ON UPDATE CASCADE;

--
-- Constraints for table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `fk_notifications_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
