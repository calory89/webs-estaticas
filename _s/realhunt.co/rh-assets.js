/* RealHunt: the buttons of the pages built in seo/assets*.ts (data hub, press, embed). One listener on the document,
   so it keeps working when the app redraws the page. No dependencies, no tracking. */
(function () {
  if (window.__rhAssets) return; window.__rhAssets = 1;
  function fill(tpl, v, name) { return String(tpl || "").replace(/\{v\}/g, v).replace(/\{name\}/g, name || ""); }
  function copy(text, done) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text).then(done, function () { legacy(text); done(); });
    legacy(text); done();
  }
  function legacy(text) {
    var ta = document.createElement("textarea"); ta.value = text; ta.setAttribute("readonly", ""); ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta); ta.select(); try { document.execCommand("copy"); } catch (e) { /* nothing else to try */ } document.body.removeChild(ta);
  }
  document.addEventListener("click", function (e) {
    var b = e.target && e.target.closest ? e.target.closest("[data-rhx-copy]") : null; if (!b) return;
    var src = document.getElementById(b.getAttribute("data-rhx-copy")); if (!src) return;
    var label = b.getAttribute("data-label") || b.textContent; b.setAttribute("data-label", label);
    copy(src.value != null ? src.value : src.textContent, function () {
      b.textContent = b.getAttribute("data-done") || "Copied"; b.classList.add("is-done");
      setTimeout(function () { b.textContent = label; b.classList.remove("is-done"); }, 1800);
    });
  });
  // A home address typed or pasted -> its slug. Accepts the full address, /deal/<slug> or the slug alone.
  function slugOf(s) { var m = /(?:\/deal\/)?([A-Za-z0-9_-]{3,})\/?(?:[?#].*)?$/.exec(String(s || "").trim()); return m ? m[1] : ""; }
  function update(box) {
    var input = box.querySelector("[data-rhx-in]"); if (!input) return;
    var v = input.value, name = "";
    if (input.tagName === "SELECT") { var o = input.options[input.selectedIndex]; name = o ? o.getAttribute("data-name") || o.textContent : ""; }
    else v = slugOf(v);
    var msg = box.querySelector("[data-rhx-msg]");
    if (msg && !msg.getAttribute("data-ok")) msg.setAttribute("data-ok", msg.textContent);
    if (!v) { if (msg) msg.textContent = msg.getAttribute("data-bad"); return; }
    if (msg) msg.textContent = msg.getAttribute("data-ok");
    var outs = box.querySelectorAll("[data-rhx-out]");
    for (var i = 0; i < outs.length; i++) outs[i].value = fill(outs[i].getAttribute("data-tpl"), v, name);
    var prev = box.querySelector("[data-rhx-prev]");
    if (prev) {
      prev.innerHTML = fill(prev.getAttribute("data-tpl"), v, name);
      var img = prev.querySelector("img");
      if (img && msg) img.onerror = function () { msg.textContent = msg.getAttribute("data-bad"); prev.innerHTML = ""; };
    }
  }
  function onInput(e) { var box = e.target && e.target.closest ? e.target.closest("[data-rhx-tpl]") : null; if (box && e.target.hasAttribute("data-rhx-in")) update(box); }
  document.addEventListener("change", onInput);
  document.addEventListener("input", onInput);
  // "Download the chart as an image": the bar chart of the page redrawn as an SVG (title, bars, values and the
  // source line written on it), turned into a PNG in the browser. Always on white, so it can be reused anywhere.
  function x(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  function cut(s, n) { s = String(s || "").replace(/\s+/g, " ").trim(); return s.length > n ? s.slice(0, n - 1).trim() + "…" : s; }
  function wrap(s, n) { var out = [], cur = ""; String(s || "").split(/\s+/).forEach(function (w) { if ((cur + " " + w).trim().length > n && cur) { out.push(cur); cur = w; } else cur = (cur + " " + w).trim(); }); if (cur) out.push(cur); return out; }
  function chartSvg(fig, source) {
    var cap = fig.querySelector("figcaption"), small = cap ? cap.querySelector("small") : null;
    var title = cap ? (cap.firstChild && cap.firstChild.nodeType === 3 ? cap.firstChild.textContent : cap.textContent) : "";
    var sub = small ? small.textContent : "";
    var rows = [].slice.call(fig.querySelectorAll(".rhx-bars li")).map(function (li) {
      var l = li.querySelector(".l"), ls = l ? l.querySelector("small") : null, bar = li.querySelector("i"), v = li.querySelector(".v");
      var name = l ? (l.firstChild && l.firstChild.nodeType === 3 ? l.firstChild.textContent : l.textContent) : "";
      return { name: cut(name, 30), sub: cut(ls ? ls.textContent : "", 40), w: parseFloat(bar && bar.style.width) || 0, off: parseFloat(bar && bar.style.marginLeft) || 0, v: v ? v.textContent : "", weak: li.classList.contains("weak") };
    });
    var W = 1200, pad = 56, labelW = 330, valW = 150, barW = W - pad * 2 - labelW - valW - 24, rowH = 46;
    var tl = wrap(title, 62), sl = wrap(sub, 110), so = wrap(source, 120);
    var top = pad + tl.length * 40 + sl.length * 26 + 22, H = top + rows.length * rowH + 30 + so.length * 24 + pad - 10;
    var font = "Inter, system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif";
    var o = '<svg xmlns="http://www.w3.org/2000/svg" width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + " " + H + '" font-family="' + font + '">'
      + '<defs><pattern id="h" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="8" height="8" fill="#fff"/><rect width="4" height="8" fill="#2F6DA8"/></pattern></defs>'
      + '<rect width="' + W + '" height="' + H + '" fill="#fff"/><rect width="' + W + '" height="10" fill="#D4420C"/>';
    var y = pad + 22;
    tl.forEach(function (t) { o += '<text x="' + pad + '" y="' + y + '" font-size="32" font-weight="700" fill="#111214">' + x(t) + "</text>"; y += 40; });
    y -= 8;
    sl.forEach(function (t) { o += '<text x="' + pad + '" y="' + y + '" font-size="19" fill="#62666E">' + x(t) + "</text>"; y += 26; });
    var bx = pad + labelW + 12;
    o += '<line x1="' + bx + '" y1="' + (top - 6) + '" x2="' + bx + '" y2="' + (top + rows.length * rowH - 8) + '" stroke="#D3D5D9"/>';
    rows.forEach(function (r, i) {
      var ry = top + i * rowH;
      o += '<text x="' + pad + '" y="' + (ry + (r.sub ? 14 : 22)) + '" font-size="20" fill="#111214">' + x(r.name) + "</text>";
      if (r.sub) o += '<text x="' + pad + '" y="' + (ry + 33) + '" font-size="15" fill="#62666E">' + x(r.sub) + "</text>";
      o += '<rect x="' + (bx + barW * r.off / 100) + '" y="' + (ry + 4) + '" width="' + Math.max(3, barW * r.w / 100) + '" height="24" rx="4" fill="' + (r.weak ? "url(#h)" : "#2F6DA8") + '"' + (r.weak ? ' stroke="#2F6DA8"' : "") + "/>";
      o += '<text x="' + (W - pad) + '" y="' + (ry + 23) + '" font-size="20" font-weight="600" fill="#111214" text-anchor="end">' + x(r.v) + "</text>";
    });
    y = top + rows.length * rowH + 30;
    so.forEach(function (t) { o += '<text x="' + pad + '" y="' + y + '" font-size="18" fill="#3D4047">' + x(t) + "</text>"; y += 24; });
    return { svg: o + "</svg>", w: W, h: H };
  }
  document.addEventListener("click", function (e) {
    var b = e.target && e.target.closest ? e.target.closest("[data-rhx-png]") : null; if (!b) return;
    var main = b.closest("main") || document, fig = main.querySelector("figure.rhx-fig"); if (!fig) return;
    var c = chartSvg(fig, b.getAttribute("data-source") || "");
    var img = new Image();
    img.onload = function () {
      var cv = document.createElement("canvas"); cv.width = c.w; cv.height = c.h; cv.getContext("2d").drawImage(img, 0, 0);
      cv.toBlob(function (blob) {
        if (!blob) return;
        var a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = b.getAttribute("data-file") || "realhunt-chart.png"; document.body.appendChild(a); a.click(); a.remove();
        var label = b.getAttribute("data-label") || b.textContent; b.setAttribute("data-label", label); b.textContent = b.getAttribute("data-done") || "OK"; b.classList.add("is-done");
        setTimeout(function () { b.textContent = label; b.classList.remove("is-done"); URL.revokeObjectURL(a.href); }, 1800);
      }, "image/png");
    };
    img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(c.svg);
  });
  // In the preview, links open the real page in a new tab instead of leaving the page being read.
  document.addEventListener("click", function (e) { var a = e.target && e.target.closest ? e.target.closest("[data-rhx-prev] a") : null; if (a) { a.target = "_blank"; a.rel = "noopener"; } }, true);
})();
