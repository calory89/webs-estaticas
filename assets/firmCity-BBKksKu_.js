import{c as r}from"./index-HmJkmBzM.js";/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const s=r("BookmarkCheck",[["path",{d:"m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2Z",key:"169p4p"}],["path",{d:"m9 10 2 2 4-4",key:"1gnqz4"}]]),l=/(-wide\b|\bwide\b|nationwide|countrywide|multiple|several|\boffices?\b|\bonline\b|\bremote\b|\binternational\b|\bglobal\b)/i;function o(e){if(!e)return null;const i=e.indexOf(" · ");if(i<=0)return null;let t=e.slice(0,i).trim();const n=t.match(/^(.*?)\s*\(([^)]*)\)\s*$/);if(n){if(/^\s*(\d+\s+)?offices?\b/i.test(n[2]))return null;t=n[1].trim()}return!t||t.length>40||l.test(t)||/\d/.test(t)||!/^\p{Lu}/u.test(t)||t.split(",")[0].trim().split(/\s+/).length>4?null:t}export{s as B,o as f};
