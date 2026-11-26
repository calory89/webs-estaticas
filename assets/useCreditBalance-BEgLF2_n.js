import{m as o}from"./index-rrYx-hLF.js";import{d as l,b as y}from"./utils-B0jLwO9-.js";import{r as u}from"./vendor-PTgXo8u4.js";import{i as d}from"./secureApi-CUD2RZX-.js";/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const f=o("Coins",[["circle",{cx:"8",cy:"8",r:"6",key:"3yglwk"}],["path",{d:"M18.09 10.37A6 6 0 1 1 10.34 18",key:"t5s6rm"}],["path",{d:"M7 6h1v4",key:"1obek4"}],["path",{d:"m16.71 13.88.7.71-2.82 2.82",key:"1rbuyh"}]]),s=["credits","balance"],h=(n=!0)=>{var t,r,i;const a=l(),e=y({queryKey:s,queryFn:d,enabled:n,staleTime:60*1e3}),c=u.useCallback(()=>a.invalidateQueries({queryKey:s}),[a]);return{balance:((t=e.data)==null?void 0:t.balance)??0,nextExpiry:((r=e.data)==null?void 0:r.nextExpiry)??null,available:((i=e.data)==null?void 0:i.available)??!1,isLoading:e.isLoading,refetch:e.refetch,invalidate:c}};export{f as C,h as u};
