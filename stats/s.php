<?php
// Contador sin cookies, sin IP, sin agente de usuario. Recibe un evento (e) y
// un valor corto (v) y suma uno en un fichero por dia. Nada identifica a nadie:
// no se guarda quien, ni desde donde, ni con que movil. Es lo que necesitamos
// para saber cuanta gente entra, en que idioma, que ciudades y que buscan y no
// encuentran, y nada mas.
header('Cache-Control: no-store'); header('Access-Control-Allow-Origin: https://supportnear.com'); header('Content-Type: text/plain');
$e = preg_replace('/[^a-z_]/', '', substr($_REQUEST['e'] ?? '', 0, 12));
$v = trim(mb_substr((string)($_REQUEST['v'] ?? ''), 0, 40));
$v = preg_replace('/[\x00-\x1f"\\\\]/u', '', $v);
if ($e === '' || !in_array($e, ['view','lang','cc','city','need','nofind','offline','install','sos','share','plan','sheet','empty','helpline','add'])) { http_response_code(204); exit; }
$dir = __DIR__ . '/../../private';
if (!is_dir($dir) || !is_writable($dir)) { $dir = __DIR__ . '/data'; if (!is_dir($dir)) { @mkdir($dir, 0700, true); @file_put_contents($dir . '/.htaccess', "Require all denied\n"); } }
$f = $dir . '/stats-' . gmdate('Y-m') . '.json';
$fp = fopen($f, 'c+'); if (!$fp) { http_response_code(204); exit; }
flock($fp, LOCK_EX);
$raw = stream_get_contents($fp); $d = $raw ? json_decode($raw, true) : [];
if (!is_array($d)) $d = [];
$day = gmdate('Y-m-d');
if (!isset($d[$day])) $d[$day] = [];
if (!isset($d[$day][$e])) $d[$day][$e] = [];
$key = $v === '' ? '_' : $v;
if (!isset($d[$day][$e][$key]) && count($d[$day][$e]) >= 400) $key = '_other';
$d[$day][$e][$key] = ($d[$day][$e][$key] ?? 0) + 1;
ftruncate($fp, 0); rewind($fp); fwrite($fp, json_encode($d, JSON_UNESCAPED_UNICODE)); fflush($fp); flock($fp, LOCK_UN); fclose($fp);
http_response_code(204);
