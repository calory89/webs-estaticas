/* RealHunt: the search of /research/find-homes (seo/reach/pages.ts). The address is the search:
   ?country=bulgaria&max=30000&min=&beds=&sqm= . Homes come from the public file /data/countries/<country>.json.
   One listener on the document and a redraw when the app repaints the page. No dependencies, no tracking. */
(function () {
  if (window.__rhFind) return; window.__rhFind = 1;
  var cache = {};
  function esc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  function num(v) { var n = parseInt(String(v || "").replace(/[^\d]/g, ""), 10); return isFinite(n) && n > 0 ? n : 0; }
  function money(n, es) { var s = String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, es ? "." : ","); return es ? s + " €" : "€" + s; }
  function read() {
    var q = new URLSearchParams(location.search), c = String(q.get("country") || "").toLowerCase().replace(/[^a-z-]/g, "");
    return { country: c, max: num(q.get("max")), min: num(q.get("min")), beds: num(q.get("beds")), sqm: num(q.get("sqm")) };
  }
  function draw() {
    var form = document.querySelector("form[data-rh-find]"), out = document.querySelector("[data-rh-find-out]");
    if (!form || !out) return;
    var L = {}; try { L = JSON.parse(form.getAttribute("data-l") || "{}"); } catch (e) { L = {}; }
    var es = form.getAttribute("data-lang") === "es", pre = form.getAttribute("data-prefix") || "", f = read();
    var key = JSON.stringify(f);
    // state is kept on the elements themselves, not in attributes: the app repaints this page from its HTML, and a
    // copy of the HTML must not look as if it had already been filled
    if (form.__rhKey !== key) { form.__rhKey = key; ["country", "max", "min", "beds", "sqm"].forEach(function (n) { var el = form.elements[n]; if (el) el.value = f[n] || ""; }); }
    if (out.__rhKey === key) return;
    out.__rhKey = key;
    if (!f.country) { out.innerHTML = '<p class="rhx-note">' + esc(L.pick) + "</p>"; return; }
    var known = false, sel = form.elements.country;
    for (var i = 0; sel && i < sel.options.length; i++) if (sel.options[i].value === f.country) known = true;
    if (!known) { out.innerHTML = '<p class="rhx-note">' + esc(L.pick) + "</p>"; return; }
    var show = function (data) {
      if (out.__rhKey !== key) return;
      var homes = (data.homes || []).filter(function (h) {
        return (!f.max || h.price_eur <= f.max) && (!f.min || h.price_eur >= f.min) && (!f.beds || (h.bedrooms || 0) >= f.beds) && (!f.sqm || (h.size_sqm || 0) >= f.sqm);
      });
      var all = '<p><a href="' + pre + "/homes/" + f.country + '">' + esc(L.all) + "</a></p>";
      if (!homes.length) { out.innerHTML = "<p><strong>" + esc(L.none) + "</strong></p>" + all; return; }
      var head = homes.length === 1 ? L.one : String(L.count || "{n}").replace("{n}", homes.length);
      out.innerHTML = "<h2>" + esc(head) + '</h2><ol class="rhr-res">' + homes.slice(0, 200).map(function (h) {
        var slug = String(h.url || "").split("/deal/")[1] || "";
        var bits = [h.place, h.size_sqm ? h.size_sqm + " m²" : "", h.bedrooms ? h.bedrooms + " " + L.beds : "", h.score != null ? L.score + " " + h.score : ""].filter(Boolean).join(" · ");
        return '<li><a href="' + pre + "/deal/" + esc(slug) + '"><strong>' + esc(money(h.price_eur, es)) + "</strong> · " + esc((es && h.title_es) || h.title) + "</a><small>" + esc(bits) + "</small></li>";
      }).join("") + "</ol>" + all + '<p class="rhx-note">' + esc(L.copy) + ": " + esc(location.origin + location.pathname + location.search) + "</p>";
    };
    if (cache[f.country]) return show(cache[f.country]);
    fetch("/data/countries/" + f.country + ".json").then(function (r) { if (!r.ok) throw new Error(String(r.status)); return r.json(); })
      .then(function (d) { cache[f.country] = d; show(d); })
      .catch(function () { if (out.__rhKey === key) out.innerHTML = "<p>" + esc(L.fail) + "</p>"; });
  }
  // the form changes the address instead of reloading the page, so the app keeps running and the link stays shareable
  document.addEventListener("submit", function (e) {
    var form = e.target && e.target.closest ? e.target.closest("form[data-rh-find]") : null; if (!form) return;
    e.preventDefault();
    var q = new URLSearchParams();
    ["country", "max", "min", "beds", "sqm"].forEach(function (n) { var el = form.elements[n]; if (el && el.value) q.set(n, el.value); });
    history.replaceState(history.state, "", location.pathname + (q.toString() ? "?" + q.toString() : ""));
    draw();
  });
  window.addEventListener("popstate", draw);
  var root = document.getElementById("root"), t = 0;
  if (root && window.MutationObserver) new MutationObserver(function () { if (!document.querySelector("form[data-rh-find]")) return; clearTimeout(t); t = setTimeout(draw, 60); }).observe(root, { childList: true, subtree: true });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", draw); else draw();
})();
