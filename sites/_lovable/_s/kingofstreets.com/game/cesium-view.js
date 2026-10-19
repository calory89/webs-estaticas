/* King of Streets — vista opcional "Google 3D" sobre Google Photorealistic 3D Tiles (CesiumJS).
   CesiumJS (5 MB) solo se descarga cuando alguien pide esta vista, y solo si hay clave.
   La física, el trazado y los tiempos siguen saliendo del grafo de OpenStreetMap:
   Google pone la imagen, OSM pone la carretera. */
(function(){
'use strict';
var A = window.SK && SK.api; if (!A) return;
var S = A.S, $ = A.$;
var host = document.getElementById('gl'), cv = document.getElementById('cv');

var viewer = null, tileset = null, carPrim = null, ghostPrim = null, routePrim = null;
var enu = null, enuInv = null, originFor = null, routeFor = null;
var failed = false, notified = false, groundZ = 0, groundTarget = 0, sampleTick = 0;
var hpr = null, scratch = null, camScratch = null;

function key(){
  var k = (window.SK_CONFIG && SK_CONFIG.googleMapsKey) || '';
  return (k && k.indexOf('PON_AQUI') !== 0) ? k : '';
}
function notice(msg){
  if (notified) return; notified = true;
  var el = $('loading');
  el.innerHTML = msg;
  el.style.whiteSpace = 'normal';
  el.style.lineHeight = '1.6';
  el.style.padding = '0 28px';
  el.style.textAlign = 'center';
  el.classList.remove('off');
}

// --------------------------------------------------------------- escena
var loading = false;
function loadCesium(){
  if (loading || typeof Cesium !== 'undefined') return;
  loading = true;
  var el = $('loading'); el.textContent = 'Cargando la vista de Google…'; el.classList.remove('off');
  window.CESIUM_BASE_URL = 'https://cesium.com/downloads/cesiumjs/releases/1.121/Build/Cesium/';
  var css = document.createElement('link'); css.rel = 'stylesheet';
  css.href = window.CESIUM_BASE_URL + 'Widgets/widgets.css'; document.head.appendChild(css);
  var sc = document.createElement('script');
  sc.src = window.CESIUM_BASE_URL + 'Cesium.js';
  sc.onload = function(){ loading = false; };
  sc.onerror = function(){ failed = true; notice('No se ha podido cargar CesiumJS. Comprueba la conexión y recarga.'); };
  document.head.appendChild(sc);
}
function boot(){
  if (failed) return false;
  if (!key()) return false;
  if (typeof Cesium === 'undefined'){ loadCesium(); return false; }
  if (viewer) return true;
  try {
    Cesium.GoogleMaps.defaultApiKey = key();
    viewer = new Cesium.Viewer(host, {
      globe: false, baseLayerPicker: false, geocoder: false, homeButton: false,
      sceneModePicker: false, navigationHelpButton: false, animation: false,
      timeline: false, fullscreenButton: false, infoBox: false, selectionIndicator: false,
      creditContainer: document.getElementById('credits') || undefined,
      contextOptions: { webgl: { powerPreference: 'high-performance' } }
    });
  } catch(e){
    failed = true;
    notice('CesiumJS no ha podido arrancar: ' + (e && e.message ? e.message : e));
    return false;
  }
  var sc = viewer.scene;
  sc.screenSpaceCameraController.enableInputs = false;   // la cámara la lleva el coche
  sc.skyAtmosphere.show = true;
  sc.fog.enabled = true;
  sc.postProcessStages.fxaa.enabled = true;
  sc.light = new Cesium.DirectionalLight({ direction: new Cesium.Cartesian3(0.35, -0.72, -0.6) });
  viewer.clock.shouldAnimate = false;

  Cesium.createGooglePhotorealistic3DTileset(key(), {
    maximumScreenSpaceError: (window.SK_CONFIG && SK_CONFIG.screenSpaceError) || 12,
    enableCollision: false
  }).then(function(ts){
    tileset = ts;
    viewer.scene.primitives.add(tileset);
    $('loading').classList.add('off');
  }).catch(function(e){
    failed = true;
    notice('Google ha rechazado la clave.<br><br>' + (e && e.message ? e.message : e) +
           '<br><br>Revisa que la <b>Map Tiles API</b> esté activada, que el proyecto tenga facturación y que la clave permita este dominio.');
  });

  hpr = new Cesium.HeadingPitchRoll();
  scratch = new Cesium.Cartesian3();
  camScratch = new Cesium.Cartesian3();
  return true;
}

function setOrigin(){
  var d = A.CITIES[S.cityId]; if (!d) return;
  if (originFor === S.cityId) return;
  var o = Cesium.Cartesian3.fromDegrees(d.c[1], d.c[0], 0);
  enu = Cesium.Transforms.eastNorthUpToFixedFrame(o);
  enuInv = Cesium.Matrix4.inverseTransformation(enu, new Cesium.Matrix4());
  originFor = S.cityId;
  groundZ = 0; groundTarget = 0;
}
function toWorld(x, y, z, out){
  return Cesium.Matrix4.multiplyByPoint(enu, Cesium.Cartesian3.fromElements(x, y, z, scratch), out || new Cesium.Cartesian3());
}
// Cesium mide el rumbo desde el norte y hacia el este; el juego desde el este
function heading(h){ return Cesium.Math.PI_OVER_TWO - h; }

// --------------------------------------------------------------- coche
function carPrimitive(colour, alpha){
  function part(w, h, l, cx, cy, cz, col){
    return new Cesium.GeometryInstance({
      geometry: Cesium.BoxGeometry.fromDimensions({
        vertexFormat: Cesium.PerInstanceColorAppearance.VERTEX_FORMAT,
        dimensions: new Cesium.Cartesian3(w, l, h)
      }),
      modelMatrix: Cesium.Matrix4.fromTranslation(new Cesium.Cartesian3(cx, cz, cy)),
      attributes: { color: Cesium.ColorGeometryInstanceAttribute.fromColor(col.withAlpha(alpha || 1)) }
    });
  }
  var body = Cesium.Color.fromCssColorString(colour);
  var dark = Cesium.Color.fromCssColorString('#16191D');
  var glass = Cesium.Color.fromCssColorString('#2A3338');
  var inst = [
    part(4.25, 0.55, 1.86, 0, 0.55, 0, body),
    part(3.55, 0.42, 1.74, 0.05, 0.95, 0, body),
    part(1.85, 0.52, 1.56, -0.22, 1.30, 0, glass),
    part(0.80, 0.62, 0.34, 1.32, 0.34, 0.92, dark),
    part(0.80, 0.62, 0.34, 1.32, 0.34, -0.92, dark),
    part(0.80, 0.62, 0.34, -1.32, 0.34, 0.92, dark),
    part(0.80, 0.62, 0.34, -1.32, 0.34, -0.92, dark),
    part(0.14, 0.18, 1.50, -2.12, 0.80, 0, Cesium.Color.fromCssColorString('#D8291C'))
  ];
  return new Cesium.Primitive({
    geometryInstances: inst,
    appearance: new Cesium.PerInstanceColorAppearance({ flat: false, translucent: !!alpha }),
    asynchronous: false
  });
}

function buildRoute(){
  if (routePrim){ viewer.scene.primitives.remove(routePrim); routePrim = null; }
  var R = S.circuit; if (!R) return;
  var d = A.CITIES[S.cityId], MLON = 111320 * Math.cos(d.c[0] * Math.PI/180);
  var pos = [];
  for (var i = 0; i < R.P.length/2; i++)
    pos.push(Cesium.Cartesian3.fromDegrees(d.c[1] + R.P[i*2]/MLON, d.c[0] + R.P[i*2+1]/111320));
  routePrim = new Cesium.GroundPolylinePrimitive({
    geometryInstances: new Cesium.GeometryInstance({
      geometry: new Cesium.GroundPolylineGeometry({ positions: pos, width: 5.0 }),
      attributes: { color: Cesium.ColorGeometryInstanceAttribute.fromColor(
        Cesium.Color.fromCssColorString('#FF3B1F').withAlpha(0.85)) }
    }),
    appearance: new Cesium.PolylineColorAppearance(),
    classificationType: Cesium.ClassificationType.CESIUM_3D_TILE,
    asynchronous: false
  });
  viewer.scene.primitives.add(routePrim);
}

// --------------------------------------------------------------- bucle
SK.render3dGoogle = function(dt){
  if (!S.G || !S.car || !S.circuit) return false;
  if (!boot()) return false;
  setOrigin();
  if (!enu) return false;

  var rk = (S.routeId || '') + '|' + S.cityId;
  if (routeFor !== rk){ routeFor = rk; try { buildRoute(); } catch(e){} }

  if (!carPrim){
    carPrim = carPrimitive('#E23A16');
    ghostPrim = carPrimitive('#E8B93F', 0.45);
    viewer.scene.primitives.add(carPrim);
    viewer.scene.primitives.add(ghostPrim);
  }

  var car = S.car, hood = S.view === 'hood';
  var fx = Math.cos(car.h), fy = Math.sin(car.h);

  // altura del suelo: se muestrea contra la malla de Google, no contra un plano
  if (tileset && (++sampleTick % 4 === 0) && viewer.scene.clampToHeightSupported){
    try {
      var probe = toWorld(car.x, car.y, groundZ + 80, camScratch);
      var hit = viewer.scene.clampToHeight(probe, [carPrim, ghostPrim]);
      if (hit){
        var local = Cesium.Matrix4.multiplyByPoint(enuInv, hit, new Cesium.Cartesian3());
        if (isFinite(local.z) && Math.abs(local.z - groundZ) < 60) groundTarget = local.z;
      }
    } catch(e){}
  }
  groundZ += (groundTarget - groundZ) * Math.min(1, dt * 6);

  hpr.heading = heading(car.h); hpr.pitch = 0; hpr.roll = 0;
  Cesium.Transforms.headingPitchRollToFixedFrame(
    toWorld(car.x, car.y, groundZ), hpr, Cesium.Ellipsoid.WGS84,
    Cesium.Transforms.eastNorthUpToFixedFrame, carPrim.modelMatrix);
  carPrim.show = !hood;

  if (S.ghost && S.ghost.pt){
    hpr.heading = heading(S.ghost.pt[2]);
    Cesium.Transforms.headingPitchRollToFixedFrame(
      toWorld(S.ghost.pt[0], S.ghost.pt[1], groundZ), hpr, Cesium.Ellipsoid.WGS84,
      Cesium.Transforms.eastNorthUpToFixedFrame, ghostPrim.modelMatrix);
    ghostPrim.show = true;
  } else if (ghostPrim) ghostPrim.show = false;

  // La malla de Google se deshace a la altura del coche (árboles derretidos, fachadas
  // emborronadas). Desde el aire se ve como Google Earth: cámara de dron.
  hood = false;
  var back = 26 + Math.min(10, car.speed * 0.25);
  var up   = 17 + Math.min(6, car.speed * 0.12);
  var camPos = toWorld(car.x - fx*back, car.y - fy*back, groundZ + up, camScratch);
  viewer.camera.setView({
    destination: camPos,
    orientation: {
      heading: heading(car.h),
      pitch: Cesium.Math.toRadians(-27),
      roll: 0
    }
  });
  viewer.scene.requestRender();
  return true;
};
SK.reset3dGoogle = function(){ groundTarget = groundZ; };
SK.googleKey = key;
SK.pauseGoogle = function(p){ if (viewer) viewer.useDefaultRenderLoop = !p; };

})();
