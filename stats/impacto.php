<?php
// Pagina publica de impacto. Solo recuentos agregados y sin datos personales:
// visitas, idiomas, paises, necesidades, emergencias. Nunca el texto que la
// gente escribe en el buscador (podria llevar un nombre o una direccion).
header('Content-Type: text/html; charset=utf-8'); header('Cache-Control: public, max-age=3600');
header("Content-Security-Policy: default-src 'none'; style-src 'unsafe-inline'; img-src 'self'");
$dir = is_dir(__DIR__ . '/../../private') ? __DIR__ . '/../../private' : __DIR__ . '/data';
$es = (($_GET['lang'] ?? '') === 'es');
$L = $es ? ['h'=>'A cuánta gente ayuda SupportNear','p'=>'Recuentos agregados, sin cookies ni datos personales: no sabemos quién entra, solo cuántas veces y en qué idioma.','m'=>'Últimos 3 meses','views'=>'Visitas','langs'=>'Idiomas','cc'=>'Países (código)','need'=>'Lo que se busca','sos'=>'Veces que se abrió Emergencias','off'=>'Usos sin conexión','inst'=>'Instalaciones','share'=>'Veces compartido','empty'=>'Búsquedas sin nada cerca (falta en el mapa)','back'=>'Volver al mapa','none'=>'Todavía no hay datos.','note'=>'Los datos del mapa son de OpenStreetMap. El contador está en el código abierto del proyecto.']
        : ['h'=>'How many people SupportNear helps','p'=>'Aggregate counts, no cookies and no personal data: we do not know who visits, only how often and in which language.','m'=>'Last 3 months','views'=>'Visits','langs'=>'Languages','cc'=>'Countries (code)','need'=>'What people look for','sos'=>'Times Emergency was opened','off'=>'Uses with no connection','inst'=>'Installs','share'=>'Times shared','empty'=>'Searches with nothing nearby (missing on the map)','back'=>'Back to the map','none'=>'No data yet.','note'=>'Map data from OpenStreetMap. The counter is in the project\'s open source code.'];
$tot = []; $months = [];
for ($i = 0; $i < 3; $i++) {
  $m = gmdate('Y-m', strtotime("first day of -$i month"));
  $d = json_decode(@file_get_contents($dir . '/stats-' . $m . '.json') ?: '[]', true) ?: [];
  $months[] = $m;
  foreach ($d as $day => $ev) foreach ($ev as $e => $vals) {
    if ($e === 'nofind' || $e === 'city') continue;                // texto libre o casi: no se publica
    foreach ($vals as $v => $n) { $tot[$e]['_all'] = ($tot[$e]['_all'] ?? 0) + $n; $tot[$e][$v] = ($tot[$e][$v] ?? 0) + $n; }
  }
}
function big($n){ return number_format((int)$n, 0, ',', '.'); }
function tbl($vals, $max = 12) {
  unset($vals['_all']); unset($vals['_other']); arsort($vals); $out = '';
  foreach (array_slice($vals, 0, $max, true) as $k => $n) { if ($k === '_') continue; $out .= '<tr><td>' . htmlspecialchars((string)$k) . '</td><td>' . big($n) . '</td></tr>'; }
  return $out ? '<table>' . $out . '</table>' : '';
}
$cards = [['views', $tot['view']['_all'] ?? 0], ['sos', $tot['sos']['_all'] ?? 0], ['off', $tot['offline']['_all'] ?? 0], ['share', $tot['share']['_all'] ?? 0], ['inst', $tot['install']['_all'] ?? 0]];
?><!DOCTYPE html><html lang="<?= $es ? 'es' : 'en' ?>"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title><?= htmlspecialchars($L['h']) ?> · SupportNear</title><meta name="robots" content="index,follow">
<style>body{font:16px/1.55 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;margin:0;background:#FBF8F3;color:#14110E}
.w{max-width:860px;margin:0 auto;padding:20px 16px 40px}a{color:#0B7A63}h1{font-size:28px;line-height:1.15;margin:18px 0 8px}
.k{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin:18px 0}.k div{background:#fff;border:1px solid #E6DFD3;border-radius:14px;padding:14px}
.k b{display:block;font-size:28px}.k span{font-size:13px;color:#645C51}h2{font-size:17px;margin:24px 0 6px}
table{border-collapse:collapse;width:100%;max-width:420px;font-size:14.5px}td{border-bottom:1px solid #E6DFD3;padding:6px 4px}td:last-child{text-align:end;font-variant-numeric:tabular-nums}
.g{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:4px 24px}small{color:#645C51}</style></head>
<body><div class="w"><p><a href="../">← <?= htmlspecialchars($L['back']) ?></a> · <a href="?lang=<?= $es ? 'en' : 'es' ?>"><?= $es ? 'English' : 'Español' ?></a></p>
<h1><?= htmlspecialchars($L['h']) ?></h1><p><?= htmlspecialchars($L['p']) ?></p><p><small><?= htmlspecialchars($L['m']) ?>: <?= htmlspecialchars(end($months) . ' → ' . $months[0]) ?></small></p>
<?php if (!$tot) { echo '<p>' . htmlspecialchars($L['none']) . '</p>'; } else { ?>
<div class="k"><?php foreach ($cards as $c) echo '<div><b>' . big($c[1]) . '</b><span>' . htmlspecialchars($L[$c[0]]) . '</span></div>'; ?></div>
<div class="g">
<div><h2><?= htmlspecialchars($L['langs']) ?></h2><?= tbl($tot['lang'] ?? []) ?></div>
<div><h2><?= htmlspecialchars($L['cc']) ?></h2><?= tbl($tot['cc'] ?? []) ?></div>
<div><h2><?= htmlspecialchars($L['need']) ?></h2><?= tbl($tot['need'] ?? []) ?></div>
<div><h2><?= htmlspecialchars($L['empty']) ?></h2><?= tbl($tot['empty'] ?? []) ?></div>
</div><?php } ?>
<p><small><?= htmlspecialchars($L['note']) ?></small></p></div></body></html>
