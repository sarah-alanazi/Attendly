<?php
// backend/config/session.php
declare(strict_types=1);

require_once __DIR__ . '/env.php';

function session_start_safe(): void {
  if (session_status() === PHP_SESSION_ACTIVE) return;

  $isHttps = false;
  $cookieParams = session_get_cookie_params();

  session_set_cookie_params([
    'lifetime' => 0,
    'path' => $cookieParams['path'] ?? '/',
    'domain' => $cookieParams['domain'] ?? '',
    'secure' => $isHttps,
    'httponly' => true,
    'samesite' => 'Lax',
  ]);

  session_name('ATTENDLYSESSID');
  session_start();
}
