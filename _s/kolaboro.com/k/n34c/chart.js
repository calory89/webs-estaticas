/* <kolaboro-chart market="dubai" kind="delays|disclosure" lang="en" theme="dark"> : Kolaboro market chart web component (n34c, 21 Nov 2026).
   Loads https://kolaboro.com/api/v1/charts/<market> and draws the server's SVG in a shadow root with a link to the source. MIT licence. */
(function () {
  if (!window.customElements || customElements.get('kolaboro-chart')) return;
  var BASE = 'https://kolaboro.com';
  try { var s = document.currentScript && document.currentScript.src; if (s && /^https?:\/\/[^/]*kolaboro\.com\//.test(s)) BASE = new URL(s).origin; } catch (e) {}
  class KolaboroChart extends HTMLElement {
    static get observedAttributes() { return ['market', 'kind', 'lang', 'theme']; }
    connectedCallback() { this.draw(); }
    attributeChangedCallback() { if (this.isConnected) this.draw(); }
    draw() {
      var m = (this.getAttribute('market') || '').toLowerCase(), k = this.getAttribute('kind') === 'disclosure' ? 'disclosure' : 'delays', l = this.getAttribute('lang') || 'en', th = this.getAttribute('theme') === 'dark' ? 'dark' : '';
      if (!/^[a-z0-9-]{2,60}$/.test(m)) return;
      var root = this.shadowRoot || this.attachShadow({ mode: 'open' }), self = this;
      fetch(BASE + '/api/v1/charts/' + m + '?lang=' + encodeURIComponent(l) + (th ? '&theme=dark' : '')).then(function (r) { return r.ok ? r.json() : null; }).then(function (d) {
        if (!d || !d.svg || !d.svg[k]) { root.textContent = ''; return; }
        root.innerHTML = '<style>:host{display:inline-block;max-width:100%;font:12px system-ui,sans-serif}svg{max-width:100%;height:auto;display:block}a{color:inherit}</style>' + d.svg[k];
        var a = document.createElement('a'); a.href = d.link.href + '?utm_source=embed&utm_medium=webcomponent'; a.textContent = d.link.text; a.target = '_blank';
        var p = document.createElement('p'); p.style.margin = '2px 0 0'; p.appendChild(a); root.appendChild(p);
        self.dispatchEvent(new CustomEvent('kolaboro-chart-ready', { detail: { market: d.market } }));
      }).catch(function () {});
    }
  }
  customElements.define('kolaboro-chart', KolaboroChart);
})();
