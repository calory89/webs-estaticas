/* Rehace hlc/wp-legacy.css (CSS de la plantilla WordPress vieja, solo con las reglas que usan las páginas antiguas).
   1) python3 -c del docstring de build.py no hace falta: genera tokens.html con las clases/ids/etiquetas de las páginas que enlazan la CSS grande
      (ver HLC_LEGACY_CSS en _hlc/build.py) y de hlc.js, explorer.js, penci-lazy.js y toc front.min.js
   2) npm i purgecss@6.0.0 y: node purge-legacy.js <css-original> <tokens.html> hlc/wp-legacy.css
   3) comparar capturas antes/después (móvil y escritorio) antes de publicar */
const {PurgeCSS}=require('purgecss');const fs=require('fs');
(async()=>{const r=await new PurgeCSS().purge({content:[process.argv[3]],css:[process.argv[2]],fontFace:false,keyframes:false,variables:false,
 defaultExtractor:c=>c.match(/[A-Za-z0-9_-]+/g)||[],
 safelist:{standard:[/^lazy/,/loaded$/,/^is-/,/^has-/,/active/,/^open/,/show/,/^toc/,/^sticky/,/^swiper/,/^wp-/,/^align/,/^size-/,/^attachment/],greedy:[/^:root/]}});
fs.writeFileSync(process.argv[4],r[0].css);console.log(fs.statSync(process.argv[2]).size,'->',r[0].css.length);})();
