/* King of Streets v7 — móvil, mando, idiomas y accesibilidad.
   Mando (Xbox/PlayStation), controles táctiles que se mueven y cambian de tamaño, calibrar inclinación,
   modo ahorro de batería, vibración en botones, ciudad según tu zona horaria, 6 idiomas,
   alto contraste, texto grande, modo daltónico, menos movimiento y avisos para lector de pantalla. */
(function(){
'use strict';
var A = window.SK && SK.api; if (!A) return;
var S = A.S, $ = A.$, toast = A.toast;
var COARSE = matchMedia('(pointer:coarse)').matches;
function ls(k, v){ try { if (v === undefined) return localStorage.getItem(k); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch(e){ return null; } }
function lj(k, d){ try { return JSON.parse(ls(k) || 'null') || d; } catch(e){ return d; } }
function el(html){ var d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstChild; }
function vib(p){ if (SK.vib) SK.vib(p); }

// ============================================================== idiomas
var LANGS = ['es', 'en', 'pt', 'fr', 'it', 'de'];
var T = {
  'Cada calle tiene un rey.': ['Every street has a king.', 'Cada rua tem um rei.', 'Chaque rue a son roi.', 'Ogni strada ha un re.', 'Jede Straße hat einen König.'],
  '¿Cuál es la tuya?': ['Which one is yours?', 'Qual é a tua?', 'Laquelle est la tienne ?', 'Qual è la tua?', 'Welche ist deine?'],
  'Acelerador auto': ['Auto throttle', 'Acelerador automático', 'Accélérateur auto', 'Acceleratore auto', 'Auto-Gas'],
  'Acelerar': ['Accelerate', 'Acelerar', 'Accélérer', 'Accelera', 'Gas geben'],
  'Frenar': ['Brake', 'Travar', 'Freiner', 'Frena', 'Bremsen'],
  'Izquierda': ['Left', 'Esquerda', 'Gauche', 'Sinistra', 'Links'],
  'Derecha': ['Right', 'Direita', 'Droite', 'Destra', 'Rechts'],
  'Aspecto del mapa': ['Map style', 'Aspeto do mapa', 'Style de carte', 'Aspetto mappa', 'Kartenstil'],
  'Atardecer': ['Sunset', 'Pôr do sol', 'Coucher de soleil', 'Tramonto', 'Abend'],
  'Día': ['Day', 'Dia', 'Jour', 'Giorno', 'Tag'],
  'Noche': ['Night', 'Noite', 'Nuit', 'Notte', 'Nacht'],
  'Cancelar': ['Cancel', 'Cancelar', 'Annuler', 'Annulla', 'Abbrechen'],
  'Capó': ['Hood', 'Capô', 'Capot', 'Cofano', 'Motorhaube'],
  'Tras el coche': ['Chase', 'Atrás do carro', 'Poursuite', 'Dietro l\'auto', 'Verfolger'],
  'Plano': ['Top-down', 'Planta', 'Vue du dessus', 'Dall\'alto', 'Draufsicht'],
  'Vista': ['View', 'Vista', 'Vue', 'Vista', 'Ansicht'],
  'Cargando el trazado…': ['Loading the track…', 'A carregar o traçado…', 'Chargement du tracé…', 'Caricamento del tracciato…', 'Strecke wird geladen…'],
  'Carreras oficiales': ['Official races', 'Corridas oficiais', 'Courses officielles', 'Gare ufficiali', 'Offizielle Rennen'],
  'Cerrar': ['Close', 'Fechar', 'Fermer', 'Chiudi', 'Schließen'],
  'Ciudad': ['City', 'Cidade', 'Ville', 'Città', 'Stadt'],
  'Compartir': ['Share', 'Partilhar', 'Partager', 'Condividi', 'Teilen'],
  'Controles': ['Controls', 'Controlos', 'Commandes', 'Comandi', 'Steuerung'],
  'Correr mi calle': ['Race my street', 'Correr a minha rua', 'Courir ma rue', 'Corri la mia via', 'Meine Straße fahren'],
  'Correr mi calle →': ['Race my street →', 'Correr a minha rua →', 'Courir ma rue →', 'Corri la mia via →', 'Meine Straße fahren →'],
  'Cualquier ciudad del mundo…': ['Any city in the world…', 'Qualquer cidade do mundo…', 'N\'importe quelle ville…', 'Qualsiasi città del mondo…', 'Jede Stadt der Welt…'],
  'Descargar': ['Download', 'Descarregar', 'Télécharger', 'Scarica', 'Herunterladen'],
  'Dónde quieres correr': ['Where do you want to race', 'Onde queres correr', 'Où veux-tu courir', 'Dove vuoi correre', 'Wo willst du fahren'],
  'Frenar': ['Brake', 'Travar', 'Freiner', 'Frena', 'Bremsen'],
  'Genera tu circuito': ['Build your track', 'Cria o teu circuito', 'Crée ton circuit', 'Crea il tuo circuito', 'Bau deine Strecke'],
  'Girar inclinando': ['Tilt to steer', 'Inclinar para virar', 'Incliner pour tourner', 'Inclina per sterzare', 'Neigen zum Lenken'],
  'Grabando…': ['Recording…', 'A gravar…', 'Enregistrement…', 'Registrazione…', 'Aufnahme…'],
  'Ir': ['Go', 'Ir', 'Aller', 'Vai', 'Los'],
  'Leaderboard': ['Leaderboard', 'Classificação', 'Classement', 'Classifica', 'Rangliste'],
  'Luego': ['Later', 'Depois', 'Plus tard', 'Dopo', 'Später'],
  'Marcar en el mapa': ['Pick on map', 'Marcar no mapa', 'Choisir sur la carte', 'Segna sulla mappa', 'Auf Karte wählen'],
  'Mi mapa': ['My map', 'O meu mapa', 'Ma carte', 'La mia mappa', 'Meine Karte'],
  'Mientras no estabas': ['While you were away', 'Enquanto estavas fora', 'Pendant ton absence', 'Mentre eri via', 'Während du weg warst'],
  'Te han quitado calles': ['You lost some streets', 'Tiraram-te ruas', 'On t\'a pris des rues', 'Ti hanno tolto delle vie', 'Dir wurden Straßen abgenommen'],
  'Otra vuelta': ['Race again', 'Outra volta', 'Encore un tour', 'Un altro giro', 'Noch eine Runde'],
  'Pintura': ['Paint', 'Pintura', 'Peinture', 'Vernice', 'Lackierung'],
  'Ranking': ['Ranking', 'Ranking', 'Classement', 'Classifica', 'Rangliste'],
  'Resultado': ['Result', 'Resultado', 'Résultat', 'Risultato', 'Ergebnis'],
  'Retar': ['Challenge', 'Desafiar', 'Défier', 'Sfida', 'Herausfordern'],
  'Retar a alguien': ['Challenge someone', 'Desafiar alguém', 'Défier quelqu\'un', 'Sfida qualcuno', 'Jemanden herausfordern'],
  'Temporada semanal': ['Weekly season', 'Temporada semanal', 'Saison hebdo', 'Stagione settimanale', 'Wochensaison'],
  'Tu banda · guerra de barrios': ['Your crew · turf war', 'A tua banda · guerra de bairros', 'Ton crew · guerre de quartiers', 'La tua banda · guerra di quartiere', 'Deine Crew · Revierkrieg'],
  'Tu nombre': ['Your name', 'O teu nome', 'Ton nom', 'Il tuo nome', 'Dein Name'],
  'Tu nombre de piloto': ['Your driver name', 'O teu nome de piloto', 'Ton nom de pilote', 'Il tuo nome da pilota', 'Dein Fahrername'],
  'Tu territorio': ['Your turf', 'O teu território', 'Ton territoire', 'Il tuo territorio', 'Dein Revier'],
  'Vuelve al trazado': ['Back to the track', 'Volta ao traçado', 'Reviens sur le tracé', 'Torna al tracciato', 'Zurück auf die Strecke'],
  'calles bajo tu control': ['streets you control', 'ruas sob o teu controlo', 'rues sous ton contrôle', 'vie sotto il tuo controllo', 'Straßen unter deiner Kontrolle'],
  'cargando…': ['loading…', 'a carregar…', 'chargement…', 'caricamento…', 'lädt…'],
  'coronas esta semana': ['crowns this week', 'coroas esta semana', 'couronnes cette semaine', 'corone questa settimana', 'Kronen diese Woche'],
  'salida': ['start', 'partida', 'départ', 'partenza', 'Start'],
  '🎬 Vídeo': ['🎬 Video', '🎬 Vídeo', '🎬 Vidéo', '🎬 Video', '🎬 Video'],
  '🔥 Calle del día': ['🔥 Street of the day', '🔥 Rua do dia', '🔥 Rue du jour', '🔥 Via del giorno', '🔥 Straße des Tages'],
  'Opciones de juego': ['Game options', 'Opções de jogo', 'Options de jeu', 'Opzioni di gioco', 'Spieloptionen'],
  'Modos de juego · no cuentan para coronas': ['Game modes · no crowns', 'Modos de jogo · não contam coroas', 'Modes de jeu · sans couronnes', 'Modalità · niente corone', 'Spielmodi · ohne Kronen'],
  'Tu coche · todos corren igual': ['Your car · all equal', 'O teu carro · todos iguais', 'Ta voiture · tous égaux', 'La tua auto · tutte uguali', 'Dein Auto · alle gleich'],
  'Tus retos': ['Your challenges', 'Os teus desafios', 'Tes défis', 'Le tue sfide', 'Deine Challenges'],
  'Teclas': ['Keys', 'Teclas', 'Touches', 'Tasti', 'Tasten'],
  'Alcalde de la ciudad': ['City mayor', 'Presidente da câmara', 'Maire de la ville', 'Sindaco della città', 'Bürgermeister'],
  'Reyes cerca de ti · rétalos': ['Kings near you · challenge them', 'Reis perto de ti · desafia-os', 'Rois près de toi · défie-les', 'Re vicino a te · sfidali', 'Könige in deiner Nähe'],
  '🚓 Persecución': ['🚓 Police chase', '🚓 Perseguição', '🚓 Poursuite', '🚓 Inseguimento', '🚓 Verfolgung'],
  'Escapa de la policía hasta el escondite': ['Escape the police to the safehouse', 'Foge da polícia até ao esconderijo', 'Échappe à la police jusqu\'à la planque', 'Scappa dalla polizia fino al rifugio', 'Entkomme der Polizei zum Versteck'],
  '🚕 Taxi': ['🚕 Taxi', '🚕 Táxi', '🚕 Taxi', '🚕 Taxi', '🚕 Taxi'],
  '3 minutos, todos los clientes que puedas': ['3 minutes, as many fares as you can', '3 minutos, todos os clientes que puderes', '3 minutes, un max de clients', '3 minuti, più clienti possibile', '3 Minuten, so viele Fahrgäste wie möglich'],
  '📦 Reparto': ['📦 Delivery', '📦 Entregas', '📦 Livraison', '📦 Consegne', '📦 Lieferung'],
  '3 entregas contra reloj': ['3 deliveries against the clock', '3 entregas contra o relógio', '3 livraisons contre la montre', '3 consegne a tempo', '3 Lieferungen auf Zeit'],
  'Puntos por derrapar en este circuito': ['Points for drifting on this track', 'Pontos por derrapar neste circuito', 'Des points en dérapant', 'Punti per le derapate', 'Punkte fürs Driften'],
  '🌙 Monumentos': ['🌙 Monuments', '🌙 Monumentos', '🌙 Monuments', '🌙 Monumenti', '🌙 Sehenswürdigkeiten'],
  'La ciudad de noche, monumento a monumento': ['The city by night, landmark by landmark', 'A cidade à noite, monumento a monumento', 'La ville de nuit, monument par monument', 'La città di notte, monumento per monumento', 'Die Stadt bei Nacht, Wahrzeichen für Wahrzeichen'],
  '🗣️ Copiloto voz': ['🗣️ Voice co-driver', '🗣️ Copiloto voz', '🗣️ Copilote vocal', '🗣️ Copilota vocale', '🗣️ Sprach-Beifahrer'],
  '🧭 Minimapa GTA': ['🧭 GTA minimap', '🧭 Minimapa GTA', '🧭 Minicarte GTA', '🧭 Minimappa GTA', '🧭 GTA-Minikarte'],
  '👻 Fantasma del rey': ['👻 King\'s ghost', '👻 Fantasma do rei', '👻 Fantôme du roi', '👻 Fantasma del re', '👻 Geist des Königs'],
  '⏪ Rebobinar': ['⏪ Rewind', '⏪ Rebobinar', '⏪ Rembobiner', '⏪ Riavvolgi', '⏪ Zurückspulen'],
  '▫️ Pantalla limpia': ['▫️ Clean HUD', '▫️ Ecrã limpo', '▫️ Écran épuré', '▫️ Schermo pulito', '▫️ Klares HUD'],
  '🌑 Sombras de contacto': ['🌑 Contact shadows', '🌑 Sombras de contacto', '🌑 Ombres de contact', '🌑 Ombre di contatto', '🌑 Kontaktschatten'],
  '🎙️ Locutor de radio': ['🎙️ Radio host', '🎙️ Locutor de rádio', '🎙️ Animateur radio', '🎙️ Speaker radio', '🎙️ Radiomoderator'],
  '📳 Vibración': ['📳 Vibration', '📳 Vibração', '📳 Vibration', '📳 Vibrazione', '📳 Vibration'],
  'Móvil, mando y accesibilidad': ['Mobile, gamepad & accessibility', 'Telemóvel, comando e acessibilidade', 'Mobile, manette et accessibilité', 'Mobile, controller e accessibilità', 'Handy, Controller & Barrierefreiheit'],
  '🔋 Ahorro de batería': ['🔋 Battery saver', '🔋 Poupança de bateria', '🔋 Économie de batterie', '🔋 Risparmio batteria', '🔋 Akku sparen'],
  '✋ Mover controles': ['✋ Move controls', '✋ Mover controlos', '✋ Déplacer commandes', '✋ Sposta comandi', '✋ Steuerung verschieben'],
  '📐 Calibrar inclinación': ['📐 Calibrate tilt', '📐 Calibrar inclinação', '📐 Calibrer inclinaison', '📐 Calibra inclinazione', '📐 Neigung kalibrieren'],
  '🔳 Alto contraste': ['🔳 High contrast', '🔳 Alto contraste', '🔳 Contraste élevé', '🔳 Alto contrasto', '🔳 Hoher Kontrast'],
  '🔠 Texto grande': ['🔠 Large text', '🔠 Texto grande', '🔠 Grand texte', '🔠 Testo grande', '🔠 Große Schrift'],
  '🎨 Daltónico': ['🎨 Colour-blind', '🎨 Daltónico', '🎨 Daltonien', '🎨 Daltonico', '🎨 Farbenblind'],
  '🌀 Menos movimiento': ['🌀 Reduce motion', '🌀 Menos movimento', '🌀 Moins de mouvement', '🌀 Meno movimento', '🌀 Weniger Bewegung'],
  'Idioma': ['Language', 'Idioma', 'Langue', 'Lingua', 'Sprache'],
  'Sensibilidad': ['Sensitivity', 'Sensibilidade', 'Sensibilité', 'Sensibilità', 'Empfindlichkeit'],
  'Listo': ['Done', 'Pronto', 'Terminé', 'Fatto', 'Fertig'],
  'Restablecer': ['Reset', 'Repor', 'Réinitialiser', 'Ripristina', 'Zurücksetzen'],
  'Tamaño': ['Size', 'Tamanho', 'Taille', 'Dimensione', 'Größe'],
  'Arrastra el volante y los pedales donde te vengan mejor.': ['Drag the wheel and pedals where they suit you.', 'Arrasta o volante e os pedais para onde te der jeito.', 'Glisse le volant et les pédales où tu veux.', 'Trascina volante e pedali dove preferisci.', 'Zieh Lenkrad und Pedale dorthin, wo es dir passt.'],
  'sin rey · córrela y es tuya': ['no king · race it and it\'s yours', 'sem rei · corre e é tua', 'sans roi · cours-la, elle est à toi', 'senza re · corrila ed è tua', 'kein König · fahr sie und sie gehört dir'],
  'FRENO': ['BRAKE', 'TRAVÃO', 'FREIN', 'FRENO', 'BREMSE'],
  'GAS': ['GAS', 'ACEL', 'GAZ', 'GAS', 'GAS'],
  '👑 SIN REY': ['👑 NO KING', '👑 SEM REI', '👑 SANS ROI', '👑 SENZA RE', '👑 KEIN KÖNIG'],
  '¡es tuya!': ['it\'s yours!', 'é tua!', 'elle est à toi !', 'è tua!', 'gehört dir!'],
  '↩ Volver a la pista': ['↩ Back to track', '↩ Voltar à pista', '↩ Retour sur la piste', '↩ Torna in pista', '↩ Zurück zur Strecke'],
  'Pausa': ['Pause', 'Pausa', 'Pause', 'Pausa', 'Pause'],
  'El reloj está parado': ['The clock is stopped', 'O relógio está parado', 'Le chrono est arrêté', 'Il cronometro è fermo', 'Die Uhr steht'],
  '▶ Seguir': ['▶ Resume', '▶ Continuar', '▶ Reprendre', '▶ Riprendi', '▶ Weiter'],
  '↺ Empezar de nuevo': ['↺ Restart', '↺ Recomeçar', '↺ Recommencer', '↺ Ricomincia', '↺ Neu starten'],
  'Salir de la carrera': ['Quit race', 'Sair da corrida', 'Quitter la course', 'Esci dalla gara', 'Rennen verlassen'],
  '🔴 En directo en esta carrera': ['🔴 Live on this race', '🔴 Em direto nesta corrida', '🔴 En direct sur cette course', '🔴 In diretta su questa gara', '🔴 Live in diesem Rennen'],
  '⚔️ Duelo en directo': ['⚔️ Live duel', '⚔️ Duelo ao vivo', '⚔️ Duel en direct', '⚔️ Duello live', '⚔️ Live-Duell'],
  '🪙 Monedas, tienda y pase de temporada': ['🪙 Coins, shop & season pass', '🪙 Moedas, loja e passe', '🪙 Pièces, boutique et passe', '🪙 Monete, negozio e pass', '🪙 Münzen, Shop & Saisonpass'],
  '🏘️ Liga de barrios': ['🏘️ Neighbourhood league', '🏘️ Liga de bairros', '🏘️ Ligue des quartiers', '🏘️ Lega dei quartieri', '🏘️ Viertel-Liga'],
  '🏘️ Ruta del día de mi barrio': ['🏘️ My area\'s route of the day', '🏘️ Rota do dia do bairro', '🏘️ Parcours du jour du quartier', '🏘️ Percorso del giorno del quartiere', '🏘️ Tagesroute meines Viertels'],
  '👥 Amigos': ['👥 Friends', '👥 Amigos', '👥 Amis', '👥 Amici', '👥 Freunde'],
  'Seguir': ['Follow', 'Seguir', 'Suivre', 'Segui', 'Folgen'],
  '🎁 Invita y gana': ['🎁 Invite & earn', '🎁 Convida e ganha', '🎁 Invite et gagne', '🎁 Invita e vinci', '🎁 Einladen & gewinnen'],
  '🎁 Invitar': ['🎁 Invite', '🎁 Convidar', '🎁 Inviter', '🎁 Invita', '🎁 Einladen'],
  '📺 Repetición TV': ['📺 TV replay', '📺 Repetição TV', '📺 Ralenti TV', '📺 Replay TV', '📺 TV-Wiederholung'],
  '⚡ Clip 10 s': ['⚡ 10 s clip', '⚡ Clip 10 s', '⚡ Clip 10 s', '⚡ Clip 10 s', '⚡ 10-s-Clip'],
  'Tus monedas': ['Your coins', 'As tuas moedas', 'Tes pièces', 'Le tue monete', 'Deine Münzen'],
  '👀 Mirar': ['👀 Watch', '👀 Ver', '👀 Regarder', '👀 Guarda', '👀 Zuschauen'],
  '📂 Importar ruta GPX (Strava, Garmin…)': ['📂 Import GPX route (Strava, Garmin…)', '📂 Importar rota GPX (Strava, Garmin…)', '📂 Importer un GPX (Strava, Garmin…)', '📂 Importa percorso GPX (Strava, Garmin…)', '📂 GPX-Route importieren (Strava, Garmin…)'],
  'MANO': ['HAND', 'MÃO', 'À MAIN', 'A MANO', 'HAND']
};
var LANG = (function(){
  var q = new URLSearchParams(location.search).get('lang'); if (q && LANGS.indexOf(q) >= 0){ ls('sk_lang', q); return q; }
  var st = ls('sk_lang'); if (st && LANGS.indexOf(st) >= 0) return st;
  var n = (navigator.language || 'es').slice(0, 2).toLowerCase(); return LANGS.indexOf(n) >= 0 ? n : (n === 'es' ? 'es' : 'en');
})();
S.lang = LANG; document.documentElement.lang = LANG;
function tr(s){ if (LANG === 'es') return s; var row = T[s]; return row ? row[LANGS.indexOf(LANG) - 1] : null; }
SK.t = function(s){ return tr(s) || s; };
function translateNode(root){
  if (LANG === 'es' || !root) return;
  var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null), n, list = [];
  while ((n = w.nextNode())) list.push(n);
  list.forEach(function(n){ var raw = n.nodeValue, t = raw.trim(); if (!t) return; var x = tr(t); if (x) n.nodeValue = raw.replace(t, x); });
  if (root.querySelectorAll) root.querySelectorAll('[placeholder],[aria-label],[title]').forEach(function(e){
    ['placeholder', 'aria-label', 'title'].forEach(function(a){ var v = e.getAttribute(a); if (v){ var x = tr(v.trim()); if (x) e.setAttribute(a, x); } });
  });
}
if (LANG !== 'es'){
  var pend = false, mo = new MutationObserver(function(ms){
    if (pend) return; pend = true;
    requestAnimationFrame(function(){ pend = false; ms.forEach(function(m){ m.addedNodes.forEach(function(nd){ if (nd.nodeType === 1) translateNode(nd); else if (nd.nodeType === 3 && nd.parentNode) translateNode(nd.parentNode); }); }); });
  });
  setTimeout(function(){ translateNode(document.body); mo.observe(document.body, { childList: true, subtree: true }); }, 400);
}

// ============================================================== accesibilidad
var css = `
body.hc #hud, body.hc .toast, body.hc #plaque, body.hc #timing{background:#000!important;color:#fff!important;border-color:#fff!important}
body.hc .block{border-color:#fff} body.hc .hint{color:#E6ECF0!important}
body.big{font-size:118%} body.big #timing{transform:scale(1.18);transform-origin:top center} body.big .toast{font-size:17px}
body.big #rail .race b, body.big #rail button{font-size:1.08em}
body.cb{--trace:#0072B2!important} body.cb #pedGas i{background:linear-gradient(0deg,#56B4E9,#0072B2)!important} body.cb #pedBrk i{background:linear-gradient(0deg,#E69F00,#D55E00)!important}
#srLive{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
#ctlEdit{position:absolute;left:50%;top:14px;transform:translateX(-50%);z-index:60;display:none;background:rgba(10,14,19,.94);border:1px solid var(--gold);border-radius:12px;padding:10px 14px;text-align:center;max-width:92%}
#ctlEdit.on{display:block} #ctlEdit p{margin:0 0 8px;font-size:13px;color:#DDE5EA} #ctlEdit .r{display:flex;gap:8px;align-items:center;justify-content:center;flex-wrap:wrap}
#ctlEdit input{width:120px} body.ctledit #wheel, body.ctledit .pedal{outline:2px dashed var(--gold);outline-offset:4px;cursor:move}
body.ctledit #ctl, body.ctledit #wheel, body.ctledit .pedal{display:block!important;pointer-events:auto!important}
.mrow{display:flex;flex-wrap:wrap;gap:6px;margin-top:6px} .mrow select, .mrow input[type=range]{flex:1 1 45%}
#gpChip{position:absolute;left:12px;top:64px;z-index:9;display:none;background:rgba(11,15,20,.8);border:1px solid var(--line);border-radius:999px;padding:4px 10px;font:600 11px var(--cond);letter-spacing:.08em;color:#9FE6C0;text-transform:uppercase}
#gpChip.on{display:block}
`;
var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
var live = el('<div id="srLive" aria-live="polite" role="status"></div>'); document.body.appendChild(live);
SK.announce = function(txt){ live.textContent = ''; setTimeout(function(){ live.textContent = String(txt).replace(/<[^>]+>/g, ''); }, 30); };
var tbox = $('toasts');
if (tbox) new MutationObserver(function(ms){ ms.forEach(function(m){ m.addedNodes.forEach(function(n){ if (n.nodeType === 1) SK.announce(n.textContent); }); }); }).observe(tbox, { childList: true });

var OPT = {
  battery: ls('sk_battery') === '1', hc: ls('sk_hc') === '1', big: ls('sk_big') === '1', cb: ls('sk_cb') === '1',
  calm: ls('sk_calm') === '1' || (ls('sk_calm') === null && matchMedia('(prefers-reduced-motion: reduce)').matches)
};
function applyA11y(){
  document.body.classList.toggle('hc', OPT.hc); document.body.classList.toggle('big', OPT.big); document.body.classList.toggle('cb', OPT.cb);
  S.calm = OPT.calm; S.colorBlind = OPT.cb;
}
applyA11y();

// ============================================================== ahorro de batería
var saved = null;
function applyBattery(on, auto){
  OPT.battery = on;
  if (on){
    if (!saved) saved = { gfx: SK.getGfx ? SK.getGfx() : null };
    if (SK.setGfx) SK.setGfx('bajo');
    S.fpsCap = 30;
    try { var c = SK.composer3d && SK.composer3d(); if (c && c.renderer) c.renderer.setPixelRatio(Math.min(1, window.devicePixelRatio || 1) * 0.8); } catch(e){}
    if (auto) toast('🔋 Batería baja: modo ahorro activado.');
  } else {
    if (saved && saved.gfx && SK.setGfx) SK.setGfx(saved.gfx); saved = null; S.fpsCap = 0;
    try { var c2 = SK.composer3d && SK.composer3d(); if (c2 && c2.renderer) c2.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2)); } catch(e){}
  }
}
if (OPT.battery) setTimeout(function(){ applyBattery(true); }, 1500);
if (navigator.getBattery) navigator.getBattery().then(function(b){
  function chk(){ if (!OPT.battery && !b.charging && b.level <= 0.2 && ls('sk_battery') !== '0'){ applyBattery(true, true); paint(); } }
  b.addEventListener('levelchange', chk); b.addEventListener('chargingchange', chk); chk();
}).catch(function(){});
// tope de fotogramas: se salta el dibujado 3D cuando va por delante del tope
(function(){
  var raf = window.requestAnimationFrame.bind(window), last = 0;
  SK.fpsGate = function(){ if (!S.fpsCap) return true; var n = performance.now(); if (n - last < 1000 / S.fpsCap - 2) return false; last = n; return true; };
})();

// ============================================================== controles táctiles que se mueven
var CTL = ['wheel', 'pedGas', 'pedBrk', 'pedHb'];
var pos = lj('sk_ctlpos', {});
function applyPos(){
  CTL.forEach(function(id){ var e = $(id); if (!e) return; var p = pos[id] || {}; e.style.translate = (p.x || 0) + 'px ' + (p.y || 0) + 'px'; e.style.scale = String(p.s || 1); });
}
setTimeout(applyPos, 800);
var edit = el('<div id="ctlEdit"><p>' + SK.t('Arrastra el volante y los pedales donde te vengan mejor.') + '</p><div class="r"><label>' + SK.t('Tamaño') + ' <input type="range" id="ctlSize" min="70" max="140" value="100"></label>' +
  '<button class="btn ghost" id="ctlReset" type="button">' + SK.t('Restablecer') + '</button><button class="btn" id="ctlDone" type="button">' + SK.t('Listo') + '</button></div></div>');
if ($('stage')) $('stage').appendChild(edit);
var drag = null, sel = 'wheel';
function startEdit(){
  document.body.classList.add('ctledit', 'touchui'); edit.classList.add('on'); document.body.classList.remove('menu');
  $('ctlSize').value = Math.round(((pos[sel] || {}).s || 1) * 100);
}
function endEdit(){ document.body.classList.remove('ctledit'); edit.classList.remove('on'); ls('sk_ctlpos', JSON.stringify(pos)); if (!COARSE) document.body.classList.remove('touchui'); toast('✋ ' + SK.t('Listo')); }
$('ctlDone').onclick = endEdit;
$('ctlReset').onclick = function(){ pos = {}; applyPos(); $('ctlSize').value = 100; };
$('ctlSize').oninput = function(){ pos[sel] = pos[sel] || {}; pos[sel].s = +this.value / 100; applyPos(); };
document.addEventListener('pointerdown', function(e){
  if (!document.body.classList.contains('ctledit')) return;
  var t = e.target.closest && e.target.closest('#wheel,.pedal'); if (!t) return;
  e.preventDefault(); e.stopPropagation(); sel = t.id; var p = pos[sel] || { x: 0, y: 0, s: 1 }; pos[sel] = p;
  drag = { id: sel, x0: e.clientX, y0: e.clientY, px: p.x || 0, py: p.y || 0 }; $('ctlSize').value = Math.round((p.s || 1) * 100);
}, true);
document.addEventListener('pointermove', function(e){ if (!drag) return; var p = pos[drag.id]; p.x = Math.round(drag.px + e.clientX - drag.x0); p.y = Math.round(drag.py + e.clientY - drag.y0); applyPos(); }, true);
document.addEventListener('pointerup', function(){ drag = null; }, true);
SK.editControls = startEdit;

// ============================================================== vibración al tocar botones
document.addEventListener('pointerdown', function(e){
  if (!COARSE || document.body.classList.contains('ctledit')) return;
  var t = e.target.closest && e.target.closest('button,.pedal,#wheel'); if (!t) return;
  vib(t.classList.contains('pedal') ? 14 : 8);
}, { passive: true });

// ============================================================== mando (Gamepad API)
S.gp = { steer: 0, gas: 0, brk: 0, hb: 0 };
var gpChip = el('<div id="gpChip">🎮 Mando</div>'); if ($('stage')) $('stage').appendChild(gpChip);
var prevBtn = [], gpOn = false;
function btn(g, i){ var b = g.buttons[i]; return b ? (typeof b === 'object' ? b.value || (b.pressed ? 1 : 0) : b) : 0; }
function pressed(g, i){ var v = btn(g, i) > 0.5, was = prevBtn[i]; prevBtn[i] = v; return v && !was; }
function pollPad(){
  var pads = navigator.getGamepads ? navigator.getGamepads() : [], g = null;
  for (var i = 0; i < pads.length; i++) if (pads[i] && pads[i].connected){ g = pads[i]; break; }
  if (!g){ if (gpOn){ gpOn = false; gpChip.classList.remove('on'); S.gp = { steer: 0, gas: 0, brk: 0, hb: 0 }; } return; }
  if (!gpOn){ gpOn = true; gpChip.classList.add('on'); setTimeout(function(){ gpChip.classList.remove('on'); }, 3000); toast('🎮 Mando conectado: RT acelera, LT frena, A freno de mano, Y recolocar, Start pausa.'); }
  var x = g.axes[0] || 0; x = Math.abs(x) < 0.12 ? 0 : (x - Math.sign(x) * 0.12) / 0.88;
  var dpad = (btn(g, 14) ? 1 : 0) - (btn(g, 15) ? 1 : 0);
  S.gp.steer = Math.max(-1, Math.min(1, -x * Math.abs(x) * 0.35 - x * 0.65 + dpad));
  S.gp.gas = Math.max(btn(g, 7), btn(g, 12) ? 1 : 0);
  S.gp.brk = Math.max(btn(g, 6), btn(g, 13) ? 1 : 0);
  S.gp.hb = btn(g, 0) > 0.5 || btn(g, 5) > 0.5 ? 1 : 0;
  if (pressed(g, 3) && SK.respawn) SK.respawn();
  if (pressed(g, 9)){ if (S.phase === 'run' && SK.togglePause) SK.togglePause(); else if (A.startCountdown && S.circuit && S.phase !== 'count') A.startCountdown(); }
  if (pressed(g, 8) && SK.radio) SK.radio.cycle();
  if (pressed(g, 2) && SK.rewind) SK.rewind();
  if (pressed(g, 1) && SK.sfx && SK.sfx.horn2) SK.sfx.horn2();
  if (pressed(g, 4) && SK.setView){ var v = ['chase', 'hood', 'top'], k = v.indexOf(S.view); SK.setView(v[(k + 1) % v.length]); }
  // vibración del mando en golpes
  if (S.hit && S.hit.t && S.hit.t !== pollPad.lastHit && g.vibrationActuator){ pollPad.lastHit = S.hit.t; try { g.vibrationActuator.playEffect('dual-rumble', { duration: 180, strongMagnitude: Math.min(1, (S.hit.mag || 3) / 12), weakMagnitude: 0.4 }); } catch(e){} }
}
SK.pre = SK.pre || []; SK.pre.push(function(){ try { pollPad(); } catch(e){} });
window.addEventListener('gamepadconnected', function(){ pollPad(); });

// ============================================================== recordar la última ciudad (game.js la usa al arrancar)
var lastC = null; setInterval(function(){ if (S.cityId && S.cityId !== lastC){ lastC = S.cityId; if ((window.SK_CITIES || []).some(function(c){ return c.id === S.cityId; })) ls('sk_lastcity', S.cityId); } }, 2000);

// ============================================================== panel de opciones
var rail = document.querySelector('.railscroll');
var LN = { es: 'Español', en: 'English', pt: 'Português', fr: 'Français', it: 'Italiano', de: 'Deutsch' };
var block = el('<div class="block" id="mobBlock"><div class="eyebrow">' + SK.t('Móvil, mando y accesibilidad') + '</div><div class="optrow" id="mobRow">' +
  '<button type="button" data-o="battery">' + SK.t('🔋 Ahorro de batería') + '</button><button type="button" data-a="ctl">' + SK.t('✋ Mover controles') + '</button>' +
  '<button type="button" data-a="tilt">' + SK.t('📐 Calibrar inclinación') + '</button><button type="button" data-o="hc">' + SK.t('🔳 Alto contraste') + '</button>' +
  '<button type="button" data-o="big">' + SK.t('🔠 Texto grande') + '</button><button type="button" data-o="cb">' + SK.t('🎨 Daltónico') + '</button>' +
  '<button type="button" data-o="calm">' + SK.t('🌀 Menos movimiento') + '</button></div>' +
  '<div class="mrow"><select id="langSel" aria-label="' + SK.t('Idioma') + '">' + LANGS.map(function(l){ return '<option value="' + l + '"' + (l === LANG ? ' selected' : '') + '>' + LN[l] + '</option>'; }).join('') + '</select>' +
  '<input type="range" id="tiltSens" min="12" max="34" value="' + (46 - (+(ls('sk_tiltsens') || 22))) + '" aria-label="' + SK.t('Sensibilidad') + '" title="' + SK.t('Sensibilidad') + '"></div></div>');
var after = $('optRow') && $('optRow').closest('.block');
if (after) after.parentNode.insertBefore(block, after.nextSibling); else if (rail) rail.appendChild(block);
function paint(){ block.querySelectorAll('[data-o]').forEach(function(b){ b.classList.toggle('on', !!OPT[b.dataset.o]); }); }
block.querySelectorAll('[data-o]').forEach(function(b){ b.onclick = function(){
  var k = b.dataset.o; OPT[k] = !OPT[k]; ls('sk_' + k, OPT[k] ? '1' : '0');
  if (k === 'battery') applyBattery(OPT[k]); else applyA11y(); paint();
}; });
block.querySelector('[data-a="ctl"]').onclick = startEdit;
block.querySelector('[data-a="tilt"]').onclick = function(){
  if (SK.calibrateTilt && SK.calibrateTilt()) toast('📐 Inclinación calibrada: esta posición es "recto".');
  else toast('Activa "Girar inclinando" y sujeta el móvil como vas a jugar.', true);
};
$('langSel').onchange = function(){ ls('sk_lang', this.value); location.reload(); };
$('tiltSens').oninput = function(){ ls('sk_tiltsens', String(46 - +this.value)); };
paint();
})();
