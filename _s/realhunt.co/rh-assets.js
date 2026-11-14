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
  // In the preview, links open the real page in a new tab instead of leaving the page being read.
  document.addEventListener("click", function (e) { var a = e.target && e.target.closest ? e.target.closest("[data-rhx-prev] a") : null; if (a) { a.target = "_blank"; a.rel = "noopener"; } }, true);
})();
