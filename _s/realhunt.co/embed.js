/* RealHunt widget: <div data-realhunt-dev="your-slug"></div><script src="https://realhunt.co/embed.js" async></script> */
(function () {
  var API = "https://nylmhdtlshhtjkuvfbms.supabase.co/rest/v1/rpc/community_developer_public";
  var KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im55bG1oZHRsc2hodGprdXZmYm1zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2MTg3MzMsImV4cCI6MjA4NzE5NDczM30.KHhGDOexuJeD-i4yyFWi7FInTfA2DIeAs8lpjD1f0Yc";
  var SITE = "https://realhunt.co";
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function eur(n) { return n ? "€" + Math.round(n).toLocaleString("en-GB") : ""; }
  function abs(u) { return !u ? "" : /^https?:/.test(u) ? u : SITE + u; }
  var CSS = ":host{all:initial;display:block;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#16150F}" +
    ".w{border:1px solid #e7e2d8;border-radius:18px;background:#fff;padding:16px}.h{display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap}" +
    ".n{font-weight:700;font-size:16px}.b{font-size:12px;background:#e0f2fe;color:#0369a1;border-radius:999px;padding:3px 9px;font-weight:600}" +
    ".g{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:12px;margin-top:12px}.c{display:block;text-decoration:none;color:inherit;border-radius:14px;overflow:hidden;border:1px solid #eee}" +
    ".i{position:relative;aspect-ratio:4/3;background:#E9E4D8}.i img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}.p{position:absolute;left:8px;bottom:8px;background:#fff;border-radius:999px;padding:3px 10px;font-weight:700;font-size:14px}" +
    ".t{padding:8px 10px 2px;font-weight:600;font-size:14px}.l{padding:0 10px 10px;font-size:12px;color:#6B675C}.v{display:inline-block;margin-top:12px;background:#16150F;color:#fff;border-radius:999px;padding:9px 16px;font-size:14px;font-weight:600;text-decoration:none}" +
    ".f{margin-top:10px;font-size:11px;color:#8A8678}.f a{color:inherit}";
  function render(el, d, slug) {
    var root = el.attachShadow ? el.attachShadow({ mode: "open" }) : el;
    var ref = "?utm_source=widget&utm_medium=embed&utm_campaign=" + encodeURIComponent(slug);
    if (!d || !d.company) { root.innerHTML = ""; return; }
    var s = d.stats || {};
    var rating = s.rating && s.reviews ? " · ★ " + s.rating + " (" + s.reviews + ")" : "";
    var cards = (d.projects || []).slice(0, 6).map(function (p) {
      return '<a class="c" href="' + SITE + "/deal/" + encodeURIComponent(p.slug) + ref + '" target="_blank" rel="noopener"><div class="i">' + (p.image ? '<img loading="lazy" alt="' + esc(p.title) + '" src="' + esc(abs(p.image)) + '">' : "") +
        (p.price_eur ? '<span class="p">' + eur(p.price_eur) + "</span>" : "") + '</div><div class="t">' + esc(p.title) + '</div><div class="l">' + esc(p.location || p.country || "") + "</div></a>";
    }).join("");
    root.innerHTML = "<style>" + CSS + '</style><div class="w"><div class="h"><span class="n">' + esc(d.company) + " on RealHunt" + esc(rating) + "</span>" + (d.verified ? '<span class="b">✓ Verified developer</span>' : "") + "</div>" +
      (cards ? '<div class="g">' + cards + "</div>" : "") + '<a class="v" href="' + SITE + "/dev/" + encodeURIComponent(slug) + ref + '" target="_blank" rel="noopener">View on RealHunt</a>' +
      '<div class="f">Homes under €100,000, ranked by people · <a href="' + SITE + "/" + ref + '" target="_blank" rel="noopener">realhunt.co</a></div></div>';
  }
  function boot() {
    var els = document.querySelectorAll("[data-realhunt-dev]:not([data-rh-done])");
    for (var i = 0; i < els.length; i++) (function (el) {
      el.setAttribute("data-rh-done", "1");
      var slug = el.getAttribute("data-realhunt-dev");
      fetch(API, { method: "POST", headers: { apikey: KEY, Authorization: "Bearer " + KEY, "Content-Type": "application/json" }, body: JSON.stringify({ p_slug: slug }) })
        .then(function (r) { return r.json(); }).then(function (d) { render(el, d, slug); }).catch(function () {});
    })(els[i]);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
