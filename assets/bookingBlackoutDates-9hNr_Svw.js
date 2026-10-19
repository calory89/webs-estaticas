import{m as i}from"./index-BanMW7rs.js";
/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const e=i("Mountain",[["path",{d:"m8 3 4 8 5-5 5 15H2L8 3z",key:"otkl63"}]]),r=[],a=(i,e)=>r.find(({start:r,end:a})=>i<=a&&e>=r),s=(i,e,r,s)=>{if(!r||!s)return{price:e,isSpecial:!1};const p=a(r,s);return p&&void 0!==p.prices[i]?{price:p.prices[i],isSpecial:!0,periodLabel:p.label}:{price:e,isSpecial:!1}};export{e as M,s as a,a as g};
