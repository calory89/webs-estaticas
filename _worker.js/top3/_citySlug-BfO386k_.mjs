import { n as require_jsx_runtime } from "./_libs/react+tanstack__react-query.mjs";
import { n as DestinationSearch, r as SiteFooter, t as BrandHeader } from "./_ssr/SiteFooter-CiqFcW7F.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/_citySlug-BfO386k_.js
var import_jsx_runtime = require_jsx_runtime();
function DestinationNotFound() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen bg-background",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BrandHeader, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
				className: "mx-auto max-w-2xl px-5 pt-20 text-center sm:px-8 sm:pt-28",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "font-display text-4xl text-foreground",
						children: "We're not in that city yet."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 text-base text-muted-foreground",
						children: "We're adding destinations steadily. Try another city below."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-8 text-left",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DestinationSearch, { autoFocus: true })
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SiteFooter, {})
		]
	});
}
//#endregion
export { DestinationNotFound as notFoundComponent };
