import{h as o}from"./index-DzpVIO4J.js";import{d as l,b as y}from"./utils-A7usExra.js";import{r as u}from"./vendor-B6qc8Li7.js";import{i as d}from"./secureApi-c3WiPiMS.js";/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const h=o("Coins",[["circle",{cx:"8",cy:"8",r:"6",key:"3yglwk"}],["path",{d:"M18.09 10.37A6 6 0 1 1 10.34 18",key:"t5s6rm"}],["path",{d:"M7 6h1v4",key:"1obek4"}],["path",{d:"m16.71 13.88.7.71-2.82 2.82",key:"1rbuyh"}]]),s=["credits","balance"],f=(n=!0)=>{var t,r,i;const a=l(),e=y({queryKey:s,queryFn:d,enabled:n,staleTime:60*1e3}),c=u.useCallback(()=>a.invalidateQueries({queryKey:s}),[a]);return{balance:((t=e.data)==null?void 0:t.balance)??0,nextExpiry:((r=e.data)==null?void 0:r.nextExpiry)??null,available:((i=e.data)==null?void 0:i.available)??!1,isLoading:e.isLoading,refetch:e.refetch,invalidate:c}};export{h as C,f as u};
