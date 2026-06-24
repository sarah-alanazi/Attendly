<?php
// backend/helpers/response.php
declare(strict_types=1);

function json_response(array $data, int $code = 200): void {
  if (ob_get_length()) {
    ob_clean();
  }

  http_response_code($code);
  header('Content-Type: application/json; charset=utf-8');

  echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
  exit;
}
