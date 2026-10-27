<?php
// Panel minimo: /stats/?k=CLAVE  (la clave esta en private/stats.key o stats/data/stats.key)
$dir = is_dir(__DIR__ . '/../../private') ? __DIR__ . '/../../private' : __DIR__ . '/data';
$kf = $dir . '/stats.key';
if (!file_exists($kf)) { @mkdir($dir, 0700, true); file_put_contents($kf, bin2hex(random_bytes(12))); }
$key = trim(file_get_contents($kf));
if (($_GET['k'] ?? '') !== $key) { http_response_code(403); echo 'clave'; exit; }
$month = preg_replace('/[^0-9-]/', '', $_GET['m'] ?? gmdate('Y-m'));
$d = json_decode(@file_get_contents($dir . '/stats-' . $month . '.json') ?: '[]', true) ?: [];
header('Content-Type: text/html; charset=utf-8');
echo '<!doctype html><meta charset="utf-8"><title>SupportNear · uso ' . htmlspecialchars($month) . '</title><style>body{font:14px/1.5 system-ui;margin:20px;max-width:1000px}table{border-collapse:collapse;margin:8px 0 22px}td,th{border:1px solid #ddd;padding:3px 8px;text-align:left}th{background:#f4f1eb}h2{margin:18px 0 4px;font-size:16px}</style>';
echo '<h1>SupportNear · uso ' . htmlspecialchars($month) . '</h1><p>Sin cookies, sin IP, sin agente. Recuentos por dia (UTC). Otro mes: ?m=AAAA-MM&amp;k=…</p>';
$tot = [];
foreach ($d as $day => $ev) foreach ($ev as $e => $vals) foreach ($vals as $v => $n) { $tot[$e]['_all'] = ($tot[$e]['_all'] ?? 0) + $n; $tot[$e][$v] = ($tot[$e][$v] ?? 0) + $n; }
echo '<h2>Visitas por dia</h2><table><tr><th>dia</th><th>vistas</th><th>sin resultado</th><th>SOS</th><th>offline</th></tr>';
foreach ($d as $day => $ev) echo '<tr><td>' . $day . '</td><td>' . array_sum($ev['view'] ?? []) . '</td><td>' . array_sum($ev['nofind'] ?? []) . '</td><td>' . array_sum($ev['sos'] ?? []) . '</td><td>' . array_sum($ev['offline'] ?? []) . '</td></tr>';
echo '</table>';
// Todo lo que se recibe se ensena: antes la lista era fija y «empty» (pidio
// algo y no habia nada cerca), «helpline» y «add» se guardaban pero no se veian.
$LBL = ['view' => 'Vistas (dispositivo)', 'lang' => 'Idiomas', 'cc' => 'Paises', 'city' => 'Ciudades', 'need' => 'Necesidades',
        'empty' => 'Pidio y no habia nada cerca (tipo:necesidad@pais)', 'nofind' => 'Busquedas sin resultado',
        'helpline' => 'Pulso una linea social (pais)', 'add' => 'Abrio «anadir un sitio» (pais)', 'sos' => 'Emergencias',
        'share' => 'Compartir', 'plan' => 'Plan', 'sheet' => 'Hoja', 'install' => 'Instalar', 'offline' => 'Sin conexion'];
foreach (array_keys($tot) as $e) if (!isset($LBL[$e])) $LBL[$e] = $e;
foreach ($LBL as $e => $t) {
  if (empty($tot[$e])) continue;
  $vals = $tot[$e]; unset($vals['_all']); arsort($vals);
  echo '<h2>' . $t . ' (' . ($tot[$e]['_all'] ?? 0) . ')</h2><table>';
  foreach (array_slice($vals, 0, 60, true) as $v => $n) echo '<tr><td>' . htmlspecialchars($v) . '</td><td>' . $n . '</td></tr>';
  echo '</table>';
}
