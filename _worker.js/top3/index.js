globalThis.__nitro_main__ = import.meta.url;
import { i as HTTPError, n as defineLazyEventHandler, t as H3Core } from "./_libs/h3+rou3+srvx.mjs";
import { r as FastResponse } from "./_libs/h3-v2+rou3+srvx.mjs";
//#region #nitro-vite-setup
function lazyService(loader) {
	let promise, mod;
	return { fetch(req) {
		if (mod) return mod.fetch(req);
		if (!promise) promise = loader().then((_mod) => mod = _mod.default || _mod);
		return promise.then((mod) => mod.fetch(req));
	} };
}
var services = { ["ssr"]: lazyService(() => import("./_ssr/ssr.mjs")) };
globalThis.__nitro_vite_envs__ = services;
//#endregion
//#region node_modules/nitro/dist/runtime/internal/route-rules.mjs
var headers = ((m) => function headersRouteRule(event) {
	for (const [key, value] of Object.entries(m.options || {})) event.res.headers.set(key, value);
});
//#endregion
//#region #nitro/virtual/routing
var findRouteRules = /* @__PURE__ */ (() => {
	const $0 = [{
		name: "headers",
		route: "/assets/**",
		handler: headers,
		options: { "cache-control": "public, max-age=31536000, immutable" }
	}];
	return (m, p) => {
		let r = [];
		if (p.charCodeAt(p.length - 1) === 47) p = p.slice(0, -1) || "/";
		let s = p.split("/");
		if (s.length > 1) {
			if (s[1] === "assets") r.unshift({
				data: $0,
				params: { "_": s.slice(2).join("/") }
			});
		}
		return r;
	};
})();
var _lazy_HOYxt5 = defineLazyEventHandler(() => import("./_chunks/ssr-renderer.mjs"));
var findRoute = /* @__PURE__ */ (() => {
	const data = {
		route: "/**",
		handler: _lazy_HOYxt5
	};
	return ((_m, p) => {
		return {
			data,
			params: { "_": p.slice(1) }
		};
	});
})();
[].filter(Boolean);
//#endregion
//#region node_modules/nitro/dist/runtime/internal/error/prod.mjs
var errorHandler = (error, event) => {
	const res = defaultHandler(error, event);
	return new FastResponse(typeof res.body === "string" ? res.body : JSON.stringify(res.body, null, 2), res);
};
function defaultHandler(error, event) {
	const unhandled = error.unhandled ?? !HTTPError.isError(error);
	const { status = 500, statusText = "" } = unhandled ? {} : error;
	if (status === 404) {
		const url = event.url || new URL(event.req.url);
		const baseURL = "/";
		if (/^\/[^/]/.test(baseURL) && !url.pathname.startsWith(baseURL)) return {
			status: 302,
			headers: new Headers({ location: `${baseURL}${url.pathname.slice(1)}${url.search}` })
		};
	}
	const headers = new Headers(unhandled ? {} : error.headers);
	headers.set("content-type", "application/json; charset=utf-8");
	return {
		status,
		statusText,
		headers,
		body: {
			error: true,
			...unhandled ? {
				status,
				unhandled: true
			} : typeof error.toJSON === "function" ? error.toJSON() : {
				status,
				statusText,
				message: error.message
			}
		}
	};
}
//#endregion
//#region #nitro/virtual/error-handler
var errorHandlers = [errorHandler];
async function error_handler_default(error, event) {
	for (const handler of errorHandlers) try {
		const response = await handler(error, event, { defaultHandler });
		if (response) return response;
	} catch (error) {
		console.error(error);
	}
}
//#endregion
//#region #nitro/virtual/app
function createNitroApp() {
	const captureError = (error, errorCtx) => {
		if (errorCtx?.event) {
			const errors = errorCtx.event.req.context?.nitro?.errors;
			if (errors) errors.push({
				error,
				context: errorCtx
			});
		}
	};
	const h3App = createH3App({ onError(error, event) {
		return error_handler_default(error, event);
	} });
	let appHandler = (req) => {
		req.context ||= {};
		req.context.nitro = req.context.nitro || { errors: [] };
		return h3App.fetch(req);
	};
	return {
		fetch: appHandler,
		h3: h3App,
		hooks: void 0,
		captureError
	};
}
function createH3App(config) {
	const h3App = new H3Core(config);
	h3App["~findRoute"] = (event) => findRoute(event.req.method, event.url.pathname);
	h3App["~getMiddleware"] = (event, route) => {
		const pathname = event.url.pathname;
		const method = event.req.method;
		const middleware = [];
		const routeRules = getRouteRules(method, pathname);
		event.context.routeRules = routeRules?.routeRules;
		if (routeRules?.routeRuleMiddleware.length) middleware.push(...routeRules.routeRuleMiddleware);
		if (route?.data?.middleware?.length) middleware.push(...route.data.middleware);
		return middleware;
	};
	return h3App;
}
//#endregion
//#region node_modules/nitro/dist/runtime/internal/app.mjs
var APP_ID = "default";
function useNitroApp() {
	let instance = useNitroApp._instance;
	if (instance) return instance;
	instance = useNitroApp._instance = createNitroApp();
	globalThis.__nitro__ = globalThis.__nitro__ || {};
	globalThis.__nitro__[APP_ID] = instance;
	return instance;
}
function getRouteRules(method, pathname) {
	const m = findRouteRules(method, pathname);
	if (!m?.length) return { routeRuleMiddleware: [] };
	const routeRules = {};
	for (const layer of m) for (const rule of layer.data) {
		const currentRule = routeRules[rule.name];
		if (currentRule) {
			if (rule.options === false) {
				delete routeRules[rule.name];
				continue;
			}
			if (typeof currentRule.options === "object" && typeof rule.options === "object") currentRule.options = {
				...currentRule.options,
				...rule.options
			};
			else currentRule.options = rule.options;
			currentRule.route = rule.route;
			currentRule.params = {
				...currentRule.params,
				...layer.params
			};
		} else if (rule.options !== false) routeRules[rule.name] = {
			...rule,
			params: layer.params
		};
	}
	const middleware = [];
	const orderedRules = Object.values(routeRules).sort((a, b) => (a.handler?.order || 0) - (b.handler?.order || 0));
	for (const rule of orderedRules) {
		if (rule.options === false || !rule.handler) continue;
		middleware.push(rule.handler(rule));
	}
	return {
		routeRules,
		routeRuleMiddleware: middleware
	};
}
//#endregion
//#region #nitro/virtual/public-assets-data
var public_assets_data_default = {
	"/apple-touch-icon.png": {
		"type": "image/png",
		"etag": "\"1164-1JSNutKsPn4vFeiFDfWRCjtGp54\"",
		"mtime": "2026-11-27T02:39:58.523Z",
		"size": 4452,
		"path": "../apple-touch-icon.png"
	},
	"/favicon.ico": {
		"type": "image/vnd.microsoft.icon",
		"etag": "\"3aee-wlBeXr9jwGVyJxGY2UQ8Wk/c6/g\"",
		"mtime": "2026-11-27T02:39:58.523Z",
		"size": 15086,
		"path": "../favicon.ico"
	},
	"/icon-192.png": {
		"type": "image/png",
		"etag": "\"12ac-kSUB/YLN41y2I+Kgj+Xl5nhUhcU\"",
		"mtime": "2026-11-27T02:39:58.523Z",
		"size": 4780,
		"path": "../icon-192.png"
	},
	"/icon.svg": {
		"type": "image/svg+xml",
		"etag": "\"29c-ZMCzLzI/t1xxixlXR2Iyvk7kWnU\"",
		"mtime": "2026-11-27T02:39:58.524Z",
		"size": 668,
		"path": "../icon.svg"
	},
	"/icon-512.png": {
		"type": "image/png",
		"etag": "\"44f4-hVfMOds01Chf8cVDIjTceq9X4UY\"",
		"mtime": "2026-11-27T02:39:58.524Z",
		"size": 17652,
		"path": "../icon-512.png"
	},
	"/robots.txt": {
		"type": "text/plain; charset=utf-8",
		"etag": "\"3d0-/pvND9AzC7ZZXVPrAJF+YFzmE1s\"",
		"mtime": "2026-11-27T02:39:58.524Z",
		"size": 976,
		"path": "../robots.txt"
	},
	"/sync.txt": {
		"type": "text/plain; charset=utf-8",
		"etag": "\"5-O5c6hCOonUmoIxyyoEOnHhf1Rtw\"",
		"mtime": "2026-11-27T02:39:58.524Z",
		"size": 5,
		"path": "../sync.txt"
	},
	"/top3hotels-media-kit.pdf": {
		"type": "application/pdf",
		"etag": "\"349f0-rBknZbqFf+lvh6QdcBFBObADuPc\"",
		"mtime": "2026-11-27T02:39:58.524Z",
		"size": 215536,
		"path": "../top3hotels-media-kit.pdf"
	},
	"/og.png": {
		"type": "image/png",
		"etag": "\"218e2-EAQsadyhyjGxY+ZXEbHsnvfcNCo\"",
		"mtime": "2026-11-27T02:39:58.524Z",
		"size": 137442,
		"path": "../og.png"
	},
	"/assets/SiteFooter-Egms7G9m.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"8bcf-kwyW+vGOmqP3kQvRPyu+Jgs5FgA\"",
		"mtime": "2026-11-27T02:39:56.941Z",
		"size": 35791,
		"path": "../assets/SiteFooter-Egms7G9m.js"
	},
	"/assets/_citySlug-CKT4-A1Y.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"2ad-uZof3GqgT1ZDLTDllpjgX3B5Y1M\"",
		"mtime": "2026-11-27T02:39:56.941Z",
		"size": 685,
		"path": "../assets/_citySlug-CKT4-A1Y.js"
	},
	"/assets/_citySlug-DrbpaUPw.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"27b9-VGI7n5j9mOvjUODNCcE76U9/dXc\"",
		"mtime": "2026-11-27T02:39:56.941Z",
		"size": 10169,
		"path": "../assets/_citySlug-DrbpaUPw.js"
	},
	"/assets/hotel-budget-1-Mq8OJiFL.jpg": {
		"type": "image/jpeg",
		"etag": "\"26e7b-gIACoscI1rzraEoCWsRxaUQyumM\"",
		"mtime": "2026-11-27T02:39:56.941Z",
		"size": 159355,
		"path": "../assets/hotel-budget-1-Mq8OJiFL.jpg"
	},
	"/assets/hotel-budget-2-CzC4JT2y.jpg": {
		"type": "image/jpeg",
		"etag": "\"2ca75-RbkAJbMOn5prvkSS/HvuWYRkc80\"",
		"mtime": "2026-11-27T02:39:56.941Z",
		"size": 182901,
		"path": "../assets/hotel-budget-2-CzC4JT2y.jpg"
	},
	"/assets/hotel-luxury-1-B21VL_6k.jpg": {
		"type": "image/jpeg",
		"etag": "\"2addf-uQKNLsOx6GZXqL4CqmBSumQUmps\"",
		"mtime": "2026-11-27T02:39:56.941Z",
		"size": 175583,
		"path": "../assets/hotel-luxury-1-B21VL_6k.jpg"
	},
	"/assets/hotel-luxury-2-lUHSVNcV.jpg": {
		"type": "image/jpeg",
		"etag": "\"2b659-4ZBxbJDVmxmqIvErMDiFxa9Ymo8\"",
		"mtime": "2026-11-27T02:39:56.941Z",
		"size": 177753,
		"path": "../assets/hotel-luxury-2-lUHSVNcV.jpg"
	},
	"/assets/hotel-value-2-dNXHOQex.jpg": {
		"type": "image/jpeg",
		"etag": "\"302df-TUvJsrGD4uXDSlUKJLTibnwrDro\"",
		"mtime": "2026-11-27T02:39:56.941Z",
		"size": 197343,
		"path": "../assets/hotel-value-2-dNXHOQex.jpg"
	},
	"/assets/routes-DJ7LAi8J.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"26-SoFMfAHVJ5oqB5t+mpFRoQvFIoc\"",
		"mtime": "2026-11-27T02:39:56.941Z",
		"size": 38,
		"path": "../assets/routes-DJ7LAi8J.js"
	},
	"/assets/hotel-value-1-CDzvzKL1.jpg": {
		"type": "image/jpeg",
		"etag": "\"4702f-QVwPZvzmGGzD41CFSTpWMcjcX+M\"",
		"mtime": "2026-11-27T02:39:56.941Z",
		"size": 290863,
		"path": "../assets/hotel-value-1-CDzvzKL1.jpg"
	},
	"/assets/index-CDqn-OUm.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"62171-l8WJJtEQ9VrleZEKQBU/gqlVuqg\"",
		"mtime": "2026-11-27T02:39:56.936Z",
		"size": 401777,
		"path": "../assets/index-CDqn-OUm.js"
	},
	"/assets/styles-GS3GsPFD.css": {
		"type": "text/css; charset=utf-8",
		"etag": "\"13613-mIS+20AdfnQ/5ZKohygR0xKFB/c\"",
		"mtime": "2026-11-27T02:39:56.941Z",
		"size": 79379,
		"path": "../assets/styles-GS3GsPFD.css"
	},
	"/assets/t3-home-de10c40928.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"7e78a-3hDECSi7+4zyG3mRQncMZKXtGYs\"",
		"mtime": "2026-11-27T02:39:58.525Z",
		"size": 518026,
		"path": "../assets/t3-home-de10c40928.js"
	},
	"/brand/favicon.ico": {
		"type": "image/vnd.microsoft.icon",
		"etag": "\"ded-XPXu2ilwi1vJw3QVC9yZouF0Vfw\"",
		"mtime": "2026-11-27T02:39:58.513Z",
		"size": 3565,
		"path": "../brand/favicon.ico"
	},
	"/brand/apple-touch-icon.png": {
		"type": "image/png",
		"etag": "\"1164-1JSNutKsPn4vFeiFDfWRCjtGp54\"",
		"mtime": "2026-11-27T02:39:58.514Z",
		"size": 4452,
		"path": "../brand/apple-touch-icon.png"
	},
	"/brand/icon-192.png": {
		"type": "image/png",
		"etag": "\"12ac-kSUB/YLN41y2I+Kgj+Xl5nhUhcU\"",
		"mtime": "2026-11-27T02:39:58.513Z",
		"size": 4780,
		"path": "../brand/icon-192.png"
	},
	"/brand/icon-512.png": {
		"type": "image/png",
		"etag": "\"44f4-hVfMOds01Chf8cVDIjTceq9X4UY\"",
		"mtime": "2026-11-27T02:39:58.513Z",
		"size": 17652,
		"path": "../brand/icon-512.png"
	},
	"/brand/icon.svg": {
		"type": "image/svg+xml",
		"etag": "\"29c-ZMCzLzI/t1xxixlXR2Iyvk7kWnU\"",
		"mtime": "2026-11-27T02:39:58.513Z",
		"size": 668,
		"path": "../brand/icon.svg"
	},
	"/brand/icon-maskable-512.png": {
		"type": "image/png",
		"etag": "\"2807-ToUaIIugk63DEvcmyAgvBjBBB0o\"",
		"mtime": "2026-11-27T02:39:58.513Z",
		"size": 10247,
		"path": "../brand/icon-maskable-512.png"
	},
	"/data/hotels-03e2ba5683be0bab.json": {
		"type": "application/json",
		"etag": "\"2864c-QQIH8Vda63g7dIlkQme9hCt41pM\"",
		"mtime": "2026-11-27T02:39:58.513Z",
		"size": 165452,
		"path": "../data/hotels-03e2ba5683be0bab.json"
	},
	"/data/hotels-03c91034d502fbb7.json": {
		"type": "application/json",
		"etag": "\"1e67f-tptWqaO7NCQHrQ/+SGCWaLis0YU\"",
		"mtime": "2026-11-27T02:39:58.512Z",
		"size": 124543,
		"path": "../data/hotels-03c91034d502fbb7.json"
	},
	"/data/hotels-05722e9428739f18.json": {
		"type": "application/json",
		"etag": "\"1fb12-azY0+Qhhoocc78DguVYyIRxUKmU\"",
		"mtime": "2026-11-27T02:39:58.513Z",
		"size": 129810,
		"path": "../data/hotels-05722e9428739f18.json"
	},
	"/data/hotels-09edca0e520ebd22.json": {
		"type": "application/json",
		"etag": "\"24efc-3mzGtcYlimEYN/lTMVENr0PFplA\"",
		"mtime": "2026-11-27T02:39:58.513Z",
		"size": 151292,
		"path": "../data/hotels-09edca0e520ebd22.json"
	},
	"/data/hotels-0c21d2de35058107.json": {
		"type": "application/json",
		"etag": "\"26ab8-sDODvGIoInxsdIpUw1RRRDeGCBg\"",
		"mtime": "2026-11-27T02:39:58.513Z",
		"size": 158392,
		"path": "../data/hotels-0c21d2de35058107.json"
	},
	"/data/hotels-0e1e4e4fb92c51a8.json": {
		"type": "application/json",
		"etag": "\"287d7-kOMFFrroYhPJ83zlqfU4XUdOzGI\"",
		"mtime": "2026-11-27T02:39:58.513Z",
		"size": 165847,
		"path": "../data/hotels-0e1e4e4fb92c51a8.json"
	},
	"/data/hotels-0f32066fab580e71.json": {
		"type": "application/json",
		"etag": "\"289c1-00Zj7eivc0JrBlj1taTJK/ittRU\"",
		"mtime": "2026-11-27T02:39:58.514Z",
		"size": 166337,
		"path": "../data/hotels-0f32066fab580e71.json"
	},
	"/data/hotels-10f5d19949d43c1d.json": {
		"type": "application/json",
		"etag": "\"2074d-VjVZ+F8tTF4/4zKNGPV21A0OE00\"",
		"mtime": "2026-11-27T02:39:58.514Z",
		"size": 132941,
		"path": "../data/hotels-10f5d19949d43c1d.json"
	},
	"/data/hotels-16d2faa281048131.json": {
		"type": "application/json",
		"etag": "\"22f19-7fsU5PDJIeuATVzLqvg/3d8499s\"",
		"mtime": "2026-11-27T02:39:58.514Z",
		"size": 143129,
		"path": "../data/hotels-16d2faa281048131.json"
	},
	"/data/hotels-17d7a042e42f455e.json": {
		"type": "application/json",
		"etag": "\"2008b-C3rLFFGLsk1SZPTJrhqAiU+eio8\"",
		"mtime": "2026-11-27T02:39:58.514Z",
		"size": 131211,
		"path": "../data/hotels-17d7a042e42f455e.json"
	},
	"/data/hotels-1a704fc299ba1477.json": {
		"type": "application/json",
		"etag": "\"2a2a6-D0fGttv7KRFWp861TgB7EoNdscE\"",
		"mtime": "2026-11-27T02:39:58.514Z",
		"size": 172710,
		"path": "../data/hotels-1a704fc299ba1477.json"
	},
	"/data/hotels-1e7f2e672a10ddca.json": {
		"type": "application/json",
		"etag": "\"1f425-Fc5GNgwHrrQHe7RvL+TRb7gfhA8\"",
		"mtime": "2026-11-27T02:39:58.514Z",
		"size": 128037,
		"path": "../data/hotels-1e7f2e672a10ddca.json"
	},
	"/data/hotels-2772411868981cdf.json": {
		"type": "application/json",
		"etag": "\"1ff91-c1df9vkqtB7II2bitUgb1Y0DZPs\"",
		"mtime": "2026-11-27T02:39:58.514Z",
		"size": 130961,
		"path": "../data/hotels-2772411868981cdf.json"
	},
	"/data/hotels-28cee74861a57ad3.json": {
		"type": "application/json",
		"etag": "\"263af-BDO6s1+MYBOrgRlck1sO5GJKg+Y\"",
		"mtime": "2026-11-27T02:39:58.514Z",
		"size": 156591,
		"path": "../data/hotels-28cee74861a57ad3.json"
	},
	"/data/hotels-2908a5d570a5f983.json": {
		"type": "application/json",
		"etag": "\"1c5ef-b2tzDI40WssdG7dyy4AIKnD5eio\"",
		"mtime": "2026-11-27T02:39:58.514Z",
		"size": 116207,
		"path": "../data/hotels-2908a5d570a5f983.json"
	},
	"/data/hotels-2bf30ed487400104.json": {
		"type": "application/json",
		"etag": "\"24aac-4eP6cIBEoQ0cKqteEEyB1kMDKno\"",
		"mtime": "2026-11-27T02:39:58.514Z",
		"size": 150188,
		"path": "../data/hotels-2bf30ed487400104.json"
	},
	"/data/hotels-2c0b806a1acf0f6f.json": {
		"type": "application/json",
		"etag": "\"281e4-2p6dujADkVXmq50G86w15iOKrC4\"",
		"mtime": "2026-11-27T02:39:58.515Z",
		"size": 164324,
		"path": "../data/hotels-2c0b806a1acf0f6f.json"
	},
	"/data/hotels-2c61d87b25660b45.json": {
		"type": "application/json",
		"etag": "\"1cba7-ePWsRQtRXcxNDYQVn+re6d+VI/E\"",
		"mtime": "2026-11-27T02:39:58.515Z",
		"size": 117671,
		"path": "../data/hotels-2c61d87b25660b45.json"
	},
	"/data/hotels-2cfc54d6e78014b5.json": {
		"type": "application/json",
		"etag": "\"17548-4KZVjPsaXhh3l1pzA2F83ZFAn5g\"",
		"mtime": "2026-11-27T02:39:58.515Z",
		"size": 95560,
		"path": "../data/hotels-2cfc54d6e78014b5.json"
	},
	"/data/hotels-30c62fd984fe0bff.json": {
		"type": "application/json",
		"etag": "\"24d75-jprBq64dGqIyKdeeTi2YUrcERsg\"",
		"mtime": "2026-11-27T02:39:58.515Z",
		"size": 150901,
		"path": "../data/hotels-30c62fd984fe0bff.json"
	},
	"/data/hotels-2ff66bc5e10e06a1.json": {
		"type": "application/json",
		"etag": "\"2b2b0-jvaLXsQYGef8i57Oo+bnKK2fAG4\"",
		"mtime": "2026-11-27T02:39:58.515Z",
		"size": 176816,
		"path": "../data/hotels-2ff66bc5e10e06a1.json"
	},
	"/data/hotels-3a2de5d34f70cbe5.json": {
		"type": "application/json",
		"etag": "\"34178-uzJuVLPMqAtQA49scrVtRojKU98\"",
		"mtime": "2026-11-27T02:39:58.516Z",
		"size": 213368,
		"path": "../data/hotels-3a2de5d34f70cbe5.json"
	},
	"/data/hotels-3b5cb0e315693290.json": {
		"type": "application/json",
		"etag": "\"200a3-nVWzjnpNTA4y892uNuihIUR7e4c\"",
		"mtime": "2026-11-27T02:39:58.515Z",
		"size": 131235,
		"path": "../data/hotels-3b5cb0e315693290.json"
	},
	"/data/hotels-481246a9f87dc03b.json": {
		"type": "application/json",
		"etag": "\"1be94-GQ0cGVBZ3DtEAh0OOVqJ+DeIvas\"",
		"mtime": "2026-11-27T02:39:58.515Z",
		"size": 114324,
		"path": "../data/hotels-481246a9f87dc03b.json"
	},
	"/data/hotels-4ef859f8b16be564.json": {
		"type": "application/json",
		"etag": "\"1e5e2-k3O/sw0d1BUkgqpyWueKlM5JkK0\"",
		"mtime": "2026-11-27T02:39:58.515Z",
		"size": 124386,
		"path": "../data/hotels-4ef859f8b16be564.json"
	},
	"/data/hotels-52c698557871c7a6.json": {
		"type": "application/json",
		"etag": "\"15b0f-rGknt+NAB4VOFd0GC1uhQxuC49A\"",
		"mtime": "2026-11-27T02:39:58.515Z",
		"size": 88847,
		"path": "../data/hotels-52c698557871c7a6.json"
	},
	"/data/hotels-52e2ca00cc65c078.json": {
		"type": "application/json",
		"etag": "\"2816f-nXDGlSvM+vl8+bANPFuHw38kUxM\"",
		"mtime": "2026-11-27T02:39:58.516Z",
		"size": 164207,
		"path": "../data/hotels-52e2ca00cc65c078.json"
	},
	"/data/hotels-54415a9babe198cd.json": {
		"type": "application/json",
		"etag": "\"25a7d-qwxGifJ7YCcM87g2nm40GOa5rz8\"",
		"mtime": "2026-11-27T02:39:58.516Z",
		"size": 154237,
		"path": "../data/hotels-54415a9babe198cd.json"
	},
	"/data/hotels-5be7e2b6c44150a9.json": {
		"type": "application/json",
		"etag": "\"2a358-/DYS17u6G0cenlXtcSL47nr9lvA\"",
		"mtime": "2026-11-27T02:39:58.516Z",
		"size": 172888,
		"path": "../data/hotels-5be7e2b6c44150a9.json"
	},
	"/data/hotels-64a88c699c8543f7.json": {
		"type": "application/json",
		"etag": "\"1fe29-z/Yk0GyfLzSbAlXzT12ZvV8bmeo\"",
		"mtime": "2026-11-27T02:39:58.516Z",
		"size": 130601,
		"path": "../data/hotels-64a88c699c8543f7.json"
	},
	"/data/hotels-717536566bbe3d2f.json": {
		"type": "application/json",
		"etag": "\"1ed9e-tgiOMGxXL7NAilhHamAz7ie8Evk\"",
		"mtime": "2026-11-27T02:39:58.516Z",
		"size": 126366,
		"path": "../data/hotels-717536566bbe3d2f.json"
	},
	"/data/hotels-744924b84e10ed3b.json": {
		"type": "application/json",
		"etag": "\"202f3-GxywJzvruRVYdroHTXmfmstqw0Y\"",
		"mtime": "2026-11-27T02:39:58.516Z",
		"size": 131827,
		"path": "../data/hotels-744924b84e10ed3b.json"
	},
	"/data/hotels-86edb86459c710d1.json": {
		"type": "application/json",
		"etag": "\"24d5c-EZTZTf+V9TGB8+iu3OnDpG+uyIU\"",
		"mtime": "2026-11-27T02:39:58.516Z",
		"size": 150876,
		"path": "../data/hotels-86edb86459c710d1.json"
	},
	"/data/hotels-8cbb0c889bff5732.json": {
		"type": "application/json",
		"etag": "\"1459e-TAxo/JwIDCXHohqTNB5Zane8Wys\"",
		"mtime": "2026-11-27T02:39:58.517Z",
		"size": 83358,
		"path": "../data/hotels-8cbb0c889bff5732.json"
	},
	"/data/hotels-8541c203eb487685.json": {
		"type": "application/json",
		"etag": "\"26659-dVj2ZJ98Jr43NZPmBoXtOPs64Wg\"",
		"mtime": "2026-11-27T02:39:58.516Z",
		"size": 157273,
		"path": "../data/hotels-8541c203eb487685.json"
	},
	"/data/hotels-9d07c96d36a59137.json": {
		"type": "application/json",
		"etag": "\"19e16-it1BxhG4LGV6wKcuUmAHhqKRjFo\"",
		"mtime": "2026-11-27T02:39:58.516Z",
		"size": 106006,
		"path": "../data/hotels-9d07c96d36a59137.json"
	},
	"/data/hotels-9e09494dc63da45a.json": {
		"type": "application/json",
		"etag": "\"17bde-h79nrMPO4NbFDJaxjttbz7ZoAPo\"",
		"mtime": "2026-11-27T02:39:58.517Z",
		"size": 97246,
		"path": "../data/hotels-9e09494dc63da45a.json"
	},
	"/data/hotels-a0a80ebc8de79a19.json": {
		"type": "application/json",
		"etag": "\"250f0-c+p/+Z+W+/fWzM9UHCqXEtByRIo\"",
		"mtime": "2026-11-27T02:39:58.517Z",
		"size": 151792,
		"path": "../data/hotels-a0a80ebc8de79a19.json"
	},
	"/data/hotels-a1105383e2441b00.json": {
		"type": "application/json",
		"etag": "\"1fd1d-cl7OTAqrof5gaKPsfvS2KslwCTY\"",
		"mtime": "2026-11-27T02:39:58.517Z",
		"size": 130333,
		"path": "../data/hotels-a1105383e2441b00.json"
	},
	"/data/hotels-a4654a57f750f3bb.json": {
		"type": "application/json",
		"etag": "\"23643-Ju16+SYz3U2rEK/JTWufZL0ncC4\"",
		"mtime": "2026-11-27T02:39:58.517Z",
		"size": 144963,
		"path": "../data/hotels-a4654a57f750f3bb.json"
	},
	"/data/hotels-aa976b1c3ff05003.json": {
		"type": "application/json",
		"etag": "\"30f10-1DS+C/k2p09L/A6zdWS84GfFT0k\"",
		"mtime": "2026-11-27T02:39:58.517Z",
		"size": 200464,
		"path": "../data/hotels-aa976b1c3ff05003.json"
	},
	"/data/hotels-ab42521e68b1efdb.json": {
		"type": "application/json",
		"etag": "\"1e244-ACZVxgJTX0JWIpPC/36TmUeEI3w\"",
		"mtime": "2026-11-27T02:39:58.517Z",
		"size": 123460,
		"path": "../data/hotels-ab42521e68b1efdb.json"
	},
	"/data/hotels-ab55aea5536c9fb0.json": {
		"type": "application/json",
		"etag": "\"280d4-iVdlbJcm199MLWFYesptz0a95D0\"",
		"mtime": "2026-11-27T02:39:58.517Z",
		"size": 164052,
		"path": "../data/hotels-ab55aea5536c9fb0.json"
	},
	"/data/hotels-ab4b35b08a8ce5d2.json": {
		"type": "application/json",
		"etag": "\"15a52-+zRLhGHAyf/FSf42+qjOFQ0aOIM\"",
		"mtime": "2026-11-27T02:39:58.517Z",
		"size": 88658,
		"path": "../data/hotels-ab4b35b08a8ce5d2.json"
	},
	"/data/hotels-acdaf9d9981a72f3.json": {
		"type": "application/json",
		"etag": "\"1f8a0-17XAehjZQQl8IulTM4YL0A44aeE\"",
		"mtime": "2026-11-27T02:39:58.517Z",
		"size": 129184,
		"path": "../data/hotels-acdaf9d9981a72f3.json"
	},
	"/data/hotels-ace349797b39c944.json": {
		"type": "application/json",
		"etag": "\"140b3-+b95zPpPcVV1HYeHke54vpFhFL8\"",
		"mtime": "2026-11-27T02:39:58.517Z",
		"size": 82099,
		"path": "../data/hotels-ace349797b39c944.json"
	},
	"/data/hotels-b8105f300ca883f3.json": {
		"type": "application/json",
		"etag": "\"195db-eyPs7NLUaIO3p2lmQ0C7k+zgnmc\"",
		"mtime": "2026-11-27T02:39:58.517Z",
		"size": 103899,
		"path": "../data/hotels-b8105f300ca883f3.json"
	},
	"/data/hotels-b9f3537d87f2a7c7.json": {
		"type": "application/json",
		"etag": "\"2f7dd-P0w39jv+MwTt63iRvyuvY0MGaaM\"",
		"mtime": "2026-11-27T02:39:58.518Z",
		"size": 194525,
		"path": "../data/hotels-b9f3537d87f2a7c7.json"
	},
	"/data/hotels-baa1674a5fb76ba2.json": {
		"type": "application/json",
		"etag": "\"1adaf-z4t3PwclPu4FpfShMi2ok73kbkM\"",
		"mtime": "2026-11-27T02:39:58.518Z",
		"size": 109999,
		"path": "../data/hotels-baa1674a5fb76ba2.json"
	},
	"/data/hotels-bac032c4424c7c67.json": {
		"type": "application/json",
		"etag": "\"2a79f-K5Knlh8OFOn0xXbFfOHhlzoB2Hs\"",
		"mtime": "2026-11-27T02:39:58.518Z",
		"size": 173983,
		"path": "../data/hotels-bac032c4424c7c67.json"
	},
	"/data/hotels-bd3f7b1e89e2c5ef.json": {
		"type": "application/json",
		"etag": "\"141a7-2s4rkjE6vAZblUGikzFVXXaMMn4\"",
		"mtime": "2026-11-27T02:39:58.518Z",
		"size": 82343,
		"path": "../data/hotels-bd3f7b1e89e2c5ef.json"
	},
	"/data/hotels-c166a3b45597b888.json": {
		"type": "application/json",
		"etag": "\"232ee-inSi1hAnr8zcNl9D5Ur0KrEXtLc\"",
		"mtime": "2026-11-27T02:39:58.518Z",
		"size": 144110,
		"path": "../data/hotels-c166a3b45597b888.json"
	},
	"/data/hotels-bb6237ef18bc8ab9.json": {
		"type": "application/json",
		"etag": "\"2696c-l0bPBih413HoFFQKHc+WnR8lV04\"",
		"mtime": "2026-11-27T02:39:58.518Z",
		"size": 158060,
		"path": "../data/hotels-bb6237ef18bc8ab9.json"
	},
	"/data/hotels-c7ef66a9202c32cc.json": {
		"type": "application/json",
		"etag": "\"26526-ahU+t7EKFjWChWRu/fq3pps9338\"",
		"mtime": "2026-11-27T02:39:58.518Z",
		"size": 156966,
		"path": "../data/hotels-c7ef66a9202c32cc.json"
	},
	"/data/hotels-cc88e0ed176c29eb.json": {
		"type": "application/json",
		"etag": "\"2b8e5-7ZOtF9U21pF6RRUIj23YS056BqU\"",
		"mtime": "2026-11-27T02:39:58.518Z",
		"size": 178405,
		"path": "../data/hotels-cc88e0ed176c29eb.json"
	},
	"/data/hotels-d4b979a8952c9dec.json": {
		"type": "application/json",
		"etag": "\"2632d-vNc750cpscvaR5g9ZuImUjxZW9o\"",
		"mtime": "2026-11-27T02:39:58.518Z",
		"size": 156461,
		"path": "../data/hotels-d4b979a8952c9dec.json"
	},
	"/data/hotels-dffee3a411755500.json": {
		"type": "application/json",
		"etag": "\"20123-AWoEzY7j3OsfL6kfaErICIyaqfk\"",
		"mtime": "2026-11-27T02:39:58.518Z",
		"size": 131363,
		"path": "../data/hotels-dffee3a411755500.json"
	},
	"/data/hotels-e3c2a9158404e96f.json": {
		"type": "application/json",
		"etag": "\"1fefd-e04tM8cWVZ8ha3hZv18rFqS5kA0\"",
		"mtime": "2026-11-27T02:39:58.518Z",
		"size": 130813,
		"path": "../data/hotels-e3c2a9158404e96f.json"
	},
	"/data/hotels-e92e45618d5abd8e.json": {
		"type": "application/json",
		"etag": "\"19001-IZdPLgNeJrDeULZN5MRErgQ/sPU\"",
		"mtime": "2026-11-27T02:39:58.518Z",
		"size": 102401,
		"path": "../data/hotels-e92e45618d5abd8e.json"
	},
	"/data/hotels-ead3ff5c79650a61.json": {
		"type": "application/json",
		"etag": "\"233ae-nIOzWlY8VQhtH8eC4H1Qwl+vQsM\"",
		"mtime": "2026-11-27T02:39:58.518Z",
		"size": 144302,
		"path": "../data/hotels-ead3ff5c79650a61.json"
	},
	"/data/hotels-eb4a88abe353dbb6.json": {
		"type": "application/json",
		"etag": "\"1df93-D58ym1igTSkYOoEsgPGtnUhgiCY\"",
		"mtime": "2026-11-27T02:39:58.518Z",
		"size": 122771,
		"path": "../data/hotels-eb4a88abe353dbb6.json"
	},
	"/data/hotels-f687072c85cdc707.json": {
		"type": "application/json",
		"etag": "\"1c86c-gJ/4WHLyJ5ZG1BYnv/LToJd1gaU\"",
		"mtime": "2026-11-27T02:39:58.518Z",
		"size": 116844,
		"path": "../data/hotels-f687072c85cdc707.json"
	},
	"/data/hotels-f69922af5e113107.json": {
		"type": "application/json",
		"etag": "\"20126-DzPODvoZmad8AmFM748+5voD+Vc\"",
		"mtime": "2026-11-27T02:39:58.518Z",
		"size": 131366,
		"path": "../data/hotels-f69922af5e113107.json"
	},
	"/data/hotels-fae34f9b0881576f.json": {
		"type": "application/json",
		"etag": "\"1cc90-0v8IW1nFIWHc4eSB6b2cmTDSqrM\"",
		"mtime": "2026-11-27T02:39:58.519Z",
		"size": 117904,
		"path": "../data/hotels-fae34f9b0881576f.json"
	},
	"/fonts/fraunces-latin-ext.woff2": {
		"type": "font/woff2",
		"etag": "\"e894-/7vMiESkWc3kDRyEJGSYundfUgc\"",
		"mtime": "2026-11-27T02:39:58.512Z",
		"size": 59540,
		"path": "../fonts/fraunces-latin-ext.woff2"
	},
	"/fonts/fraunces-latin.woff2": {
		"type": "font/woff2",
		"etag": "\"1073c-F19uk9VXCFesDYjHfPAORgodbQM\"",
		"mtime": "2026-11-27T02:39:58.519Z",
		"size": 67388,
		"path": "../fonts/fraunces-latin.woff2"
	},
	"/fonts/inter-latin-ext.woff2": {
		"type": "font/woff2",
		"etag": "\"14d18-Uh4k0XQeDHQ4ioQoYVD4qScmVZc\"",
		"mtime": "2026-11-27T02:39:58.519Z",
		"size": 85272,
		"path": "../fonts/inter-latin-ext.woff2"
	},
	"/fonts/inter-latin.woff2": {
		"type": "font/woff2",
		"etag": "\"bd30-HcBE9IJP1a9r/tZ/7ki+cPoGnz8\"",
		"mtime": "2026-11-27T02:39:58.519Z",
		"size": 48432,
		"path": "../fonts/inter-latin.woff2"
	},
	"/og/de.png": {
		"type": "image/png",
		"etag": "\"24182-y7rKQtwaqOj2ngXqJQlr45OIfCo\"",
		"mtime": "2026-11-27T02:39:58.512Z",
		"size": 147842,
		"path": "../og/de.png"
	},
	"/og/en.png": {
		"type": "image/png",
		"etag": "\"218e2-EAQsadyhyjGxY+ZXEbHsnvfcNCo\"",
		"mtime": "2026-11-27T02:39:58.519Z",
		"size": 137442,
		"path": "../og/en.png"
	},
	"/og/da.png": {
		"type": "image/png",
		"etag": "\"22bdb-N7cyUMSYyfjyalagZ9dOhpg2/lw\"",
		"mtime": "2026-11-27T02:39:58.519Z",
		"size": 142299,
		"path": "../og/da.png"
	},
	"/og/es.png": {
		"type": "image/png",
		"etag": "\"238b4-fdVA06witycPS/fAcrW6RV9sesk\"",
		"mtime": "2026-11-27T02:39:58.519Z",
		"size": 145588,
		"path": "../og/es.png"
	},
	"/og/fr.png": {
		"type": "image/png",
		"etag": "\"236ab-SwYac69TsjNfJMfaItg/qr55u1M\"",
		"mtime": "2026-11-27T02:39:58.519Z",
		"size": 145067,
		"path": "../og/fr.png"
	},
	"/og/it.png": {
		"type": "image/png",
		"etag": "\"227c4-a/wFlNB0/ntC4+C7JA3DO6gwr0Q\"",
		"mtime": "2026-11-27T02:39:58.519Z",
		"size": 141252,
		"path": "../og/it.png"
	},
	"/og/pt.png": {
		"type": "image/png",
		"etag": "\"2462d-U7Za/7eJUsnHG9EUXdQIquf8noY\"",
		"mtime": "2026-11-27T02:39:58.519Z",
		"size": 149037,
		"path": "../og/pt.png"
	},
	"/social/hlc-1.webp": {
		"type": "image/webp",
		"etag": "\"cc0-t490VJ9tBnHOICb66zx1eIydeP4\"",
		"mtime": "2026-11-27T02:39:58.513Z",
		"size": 3264,
		"path": "../social/hlc-1.webp"
	},
	"/social/hlc-2.webp": {
		"type": "image/webp",
		"etag": "\"b9e-pbTGgwOppDHxFagUrFuErAcledk\"",
		"mtime": "2026-11-27T02:39:58.519Z",
		"size": 2974,
		"path": "../social/hlc-2.webp"
	},
	"/social/hlc-3.webp": {
		"type": "image/webp",
		"etag": "\"8e2-B81VTe1+WJ8Nt4MWOzIGVOAALHY\"",
		"mtime": "2026-11-27T02:39:58.519Z",
		"size": 2274,
		"path": "../social/hlc-3.webp"
	},
	"/social/hlc-logo.webp": {
		"type": "image/webp",
		"etag": "\"42e-NdZIik33noCV6jGUyc1isUfmpY8\"",
		"mtime": "2026-11-27T02:39:58.519Z",
		"size": 1070,
		"path": "../social/hlc-logo.webp"
	},
	"/assets/t3d/filters-da.dc0e3d9bdb.json": {
		"type": "application/json",
		"etag": "\"78fbb-3A49m9tMRt/TwwolPk8UmiwBbhM\"",
		"mtime": "2026-11-27T02:39:58.513Z",
		"size": 495547,
		"path": "../assets/t3d/filters-da.dc0e3d9bdb.json"
	},
	"/assets/t3d/filters-de.2ef1804cbe.json": {
		"type": "application/json",
		"etag": "\"7d9a3-LvGATL4jPR9VMQ6f/6VO6bKTQmg\"",
		"mtime": "2026-11-27T02:39:58.519Z",
		"size": 514467,
		"path": "../assets/t3d/filters-de.2ef1804cbe.json"
	},
	"/og/events/aalborg-carnival.png": {
		"type": "image/png",
		"etag": "\"e9cc-4Xx0M2h6xrvu1ojbLRdlV3pHCUk\"",
		"mtime": "2026-11-27T02:39:58.513Z",
		"size": 59852,
		"path": "../og/events/aalborg-carnival.png"
	},
	"/og/events/aarhus-festuge.png": {
		"type": "image/png",
		"etag": "\"fe68-Gkfqy5TM/vZ3hvQHY9qcm1xYmok\"",
		"mtime": "2026-11-27T02:39:58.520Z",
		"size": 65128,
		"path": "../og/events/aarhus-festuge.png"
	},
	"/og/events/berlin-marathon.png": {
		"type": "image/png",
		"etag": "\"df9a-PDdHsLCsVq7+xanBMD4efc/3lu0\"",
		"mtime": "2026-11-27T02:39:58.520Z",
		"size": 57242,
		"path": "../og/events/berlin-marathon.png"
	},
	"/og/events/cadiz-carnival.png": {
		"type": "image/png",
		"etag": "\"f003-exKXYofd0zGOv+BIF1PvAJykfL4\"",
		"mtime": "2026-11-27T02:39:58.520Z",
		"size": 61443,
		"path": "../og/events/cadiz-carnival.png"
	},
	"/og/events/cannes-film-festival.png": {
		"type": "image/png",
		"etag": "\"dabb-1lUjiECYGjXfdGz2meOpx9tlDBU\"",
		"mtime": "2026-11-27T02:39:58.520Z",
		"size": 55995,
		"path": "../og/events/cannes-film-festival.png"
	},
	"/og/events/cherry-blossom-kyoto.png": {
		"type": "image/png",
		"etag": "\"f89b-2NHoeMVl+UIyH2AImOYzr3og8xY\"",
		"mtime": "2026-11-27T02:39:58.520Z",
		"size": 63643,
		"path": "../og/events/cherry-blossom-kyoto.png"
	},
	"/og/events/cherry-blossom-tokyo.png": {
		"type": "image/png",
		"etag": "\"105ae-7pzbmBOpMkYGkguUBOrL3Qb80IY\"",
		"mtime": "2026-11-27T02:39:58.520Z",
		"size": 66990,
		"path": "../og/events/cherry-blossom-tokyo.png"
	},
	"/og/events/christkindlesmarkt-nuremberg.png": {
		"type": "image/png",
		"etag": "\"13355-81G85OiO+WI2S2ttR2ydnTHWxDI\"",
		"mtime": "2026-11-27T02:39:58.520Z",
		"size": 78677,
		"path": "../og/events/christkindlesmarkt-nuremberg.png"
	},
	"/og/events/christmas-markets-prague.png": {
		"type": "image/png",
		"etag": "\"11990-OMdOJ6eoMS9MjiLbM+0X+UYd4Qw\"",
		"mtime": "2026-11-27T02:39:58.520Z",
		"size": 72080,
		"path": "../og/events/christmas-markets-prague.png"
	},
	"/og/events/christmas-markets-strasbourg.png": {
		"type": "image/png",
		"etag": "\"131ee-PYOGAClOP08BzSjttWbbk9sCzbo\"",
		"mtime": "2026-11-27T02:39:58.520Z",
		"size": 78318,
		"path": "../og/events/christmas-markets-strasbourg.png"
	},
	"/assets/t3d/filters-pt.b6388aed9f.json": {
		"type": "application/json",
		"etag": "\"830d1-tjiK7Z/NMVbq1cDPEDfV2Mi+sVM\"",
		"mtime": "2026-11-27T02:39:58.519Z",
		"size": 536785,
		"path": "../assets/t3d/filters-pt.b6388aed9f.json"
	},
	"/assets/t3d/filters-it.a10d8a6bd2.json": {
		"type": "application/json",
		"etag": "\"81961-oQ2Ka9LER5k31PhpK27RHpu//k0\"",
		"mtime": "2026-11-27T02:39:58.519Z",
		"size": 530785,
		"path": "../assets/t3d/filters-it.a10d8a6bd2.json"
	},
	"/og/events/christmas-markets-vienna.png": {
		"type": "image/png",
		"etag": "\"117f2-h0vQfMmnpLg7FCs4eebxpLDDj44\"",
		"mtime": "2026-11-27T02:39:58.520Z",
		"size": 71666,
		"path": "../og/events/christmas-markets-vienna.png"
	},
	"/assets/t3d/filters-fr.41a8175010.json": {
		"type": "application/json",
		"etag": "\"88b44-QagXUBBF5d1BNaD+7rWn7vGIvwI\"",
		"mtime": "2026-11-27T02:39:58.521Z",
		"size": 559940,
		"path": "../assets/t3d/filters-fr.41a8175010.json"
	},
	"/og/events/cologne-carnival.png": {
		"type": "image/png",
		"etag": "\"10587-p8XQabnh0llVjra4HBPoNmPOGjk\"",
		"mtime": "2026-11-27T02:39:58.520Z",
		"size": 66951,
		"path": "../og/events/cologne-carnival.png"
	},
	"/og/events/edinburgh-fringe.png": {
		"type": "image/png",
		"etag": "\"11779-tHDUpI4gAn2zPqSwxLAfJ6lKI38\"",
		"mtime": "2026-11-27T02:39:58.520Z",
		"size": 71545,
		"path": "../og/events/edinburgh-fringe.png"
	},
	"/og/events/feria-de-abril.png": {
		"type": "image/png",
		"etag": "\"e24a-rHepamWm2kbTDfMdIMC9o5jjJgE\"",
		"mtime": "2026-11-27T02:39:58.521Z",
		"size": 57930,
		"path": "../og/events/feria-de-abril.png"
	},
	"/og/events/itb-berlin.png": {
		"type": "image/png",
		"etag": "\"cfdc-VXL/ZlYRZVZEkaR5ihHf9WSCDJA\"",
		"mtime": "2026-11-27T02:39:58.521Z",
		"size": 53212,
		"path": "../og/events/itb-berlin.png"
	},
	"/og/events/las-fallas.png": {
		"type": "image/png",
		"etag": "\"ec70-Fr2bUE4ECUBbVSctlvzz/nAusw0\"",
		"mtime": "2026-11-27T02:39:58.521Z",
		"size": 60528,
		"path": "../og/events/las-fallas.png"
	},
	"/og/events/legoland-billund.png": {
		"type": "image/png",
		"etag": "\"f994-lB32tEcJv/lEKq/Ys6Zg3aaKPKc\"",
		"mtime": "2026-11-27T02:39:58.521Z",
		"size": 63892,
		"path": "../og/events/legoland-billund.png"
	},
	"/og/events/london-marathon.png": {
		"type": "image/png",
		"etag": "\"eb75-kkcYM/wqdJFrtSrMdmeFszgeip8\"",
		"mtime": "2026-11-27T02:39:58.522Z",
		"size": 60277,
		"path": "../og/events/london-marathon.png"
	},
	"/og/events/mwc-barcelona.png": {
		"type": "image/png",
		"etag": "\"fb55-tsUy8errapPR1AXtbsc7GNXShGo\"",
		"mtime": "2026-11-27T02:39:58.522Z",
		"size": 64341,
		"path": "../og/events/mwc-barcelona.png"
	},
	"/og/events/new-years-eve-new-york.png": {
		"type": "image/png",
		"etag": "\"11564-4k9axFtvq6Teq1xeVCc07DZVHd0\"",
		"mtime": "2026-11-27T02:39:58.522Z",
		"size": 71012,
		"path": "../og/events/new-years-eve-new-york.png"
	},
	"/og/events/new-years-eve-sydney.png": {
		"type": "image/png",
		"etag": "\"1086c-xtpMQXsr/O7xRqdy3zb9cy3f+d8\"",
		"mtime": "2026-11-27T02:39:58.522Z",
		"size": 67692,
		"path": "../og/events/new-years-eve-sydney.png"
	},
	"/og/events/northern-lights-tromso.png": {
		"type": "image/png",
		"etag": "\"1014c-6VkuOzJ3Hfc1GAd6WoZrunD8ngA\"",
		"mtime": "2026-11-27T02:39:58.522Z",
		"size": 65868,
		"path": "../og/events/northern-lights-tromso.png"
	},
	"/og/events/oktoberfest.png": {
		"type": "image/png",
		"etag": "\"101e2-lpFF7fmI+Q/SB/NGuYjK1oXFpL0\"",
		"mtime": "2026-11-27T02:39:58.522Z",
		"size": 66018,
		"path": "../og/events/oktoberfest.png"
	},
	"/og/events/rio-carnival.png": {
		"type": "image/png",
		"etag": "\"eb82-0FknUIsr3Zx4jtc5WlXGrNFNm94\"",
		"mtime": "2026-11-27T02:39:58.522Z",
		"size": 60290,
		"path": "../og/events/rio-carnival.png"
	},
	"/og/events/salone-del-mobile.png": {
		"type": "image/png",
		"etag": "\"ef21-lEeX7oMCiQZp/6NkAQ2toAfK0PQ\"",
		"mtime": "2026-11-27T02:39:58.522Z",
		"size": 61217,
		"path": "../og/events/salone-del-mobile.png"
	},
	"/og/events/salzburg-festival.png": {
		"type": "image/png",
		"etag": "\"1005b-m0WKz2SZOWoI4yYBUnGW+CLXwMk\"",
		"mtime": "2026-11-27T02:39:58.522Z",
		"size": 65627,
		"path": "../og/events/salzburg-festival.png"
	},
	"/og/events/san-fermin.png": {
		"type": "image/png",
		"etag": "\"cf14-V/qkAZA2CXmAumIKdDL+Ja1CzA0\"",
		"mtime": "2026-11-27T02:39:58.522Z",
		"size": 53012,
		"path": "../og/events/san-fermin.png"
	},
	"/og/events/semana-santa-malaga.png": {
		"type": "image/png",
		"etag": "\"1629b-bb0a6dSY2kGuBrGYBMXY07pYMi4\"",
		"mtime": "2026-11-27T02:39:58.522Z",
		"size": 90779,
		"path": "../og/events/semana-santa-malaga.png"
	},
	"/og/events/semana-santa-seville.png": {
		"type": "image/png",
		"etag": "\"ec4a-RcNsr3gsmeVQYopq6LBol+MYQ3M\"",
		"mtime": "2026-11-27T02:39:58.522Z",
		"size": 60490,
		"path": "../og/events/semana-santa-seville.png"
	},
	"/og/events/ski-salen.png": {
		"type": "image/png",
		"etag": "\"f9b7-s/PNCM0025q69mQGcRkjvhVd9ZI\"",
		"mtime": "2026-11-27T02:39:58.523Z",
		"size": 63927,
		"path": "../og/events/ski-salen.png"
	},
	"/og/events/tenerife-carnival.png": {
		"type": "image/png",
		"etag": "\"11dc9-SfAOL+tdvxgas1PADXaxo/xN/rM\"",
		"mtime": "2026-11-27T02:39:58.523Z",
		"size": 73161,
		"path": "../og/events/tenerife-carnival.png"
	},
	"/og/events/tivoli-christmas.png": {
		"type": "image/png",
		"etag": "\"10ae1-H8hxNLwmX4f5S2ggbQWUjWjzApU\"",
		"mtime": "2026-11-27T02:39:58.523Z",
		"size": 68321,
		"path": "../og/events/tivoli-christmas.png"
	},
	"/assets/t3d/gyms.a31e866601.json": {
		"type": "application/json",
		"etag": "\"2a24e7-ox6GZgE7ccKY54RX4awQkLOEpLU\"",
		"mtime": "2026-11-27T02:39:58.520Z",
		"size": 2761959,
		"path": "../assets/t3d/gyms.a31e866601.json"
	},
	"/og/events/valencia-marathon.png": {
		"type": "image/png",
		"etag": "\"e95f-2V/vumqNUlCiPdUO3YK+gXFVyW0\"",
		"mtime": "2026-11-27T02:39:58.523Z",
		"size": 59743,
		"path": "../og/events/valencia-marathon.png"
	},
	"/assets/t3d/pools.df88d3bd9e.json": {
		"type": "application/json",
		"etag": "\"321c5f-34jTvZ4H3MKOfK8XHlaNU2v7ick\"",
		"mtime": "2026-11-27T02:39:58.524Z",
		"size": 3284063,
		"path": "../assets/t3d/pools.df88d3bd9e.json"
	},
	"/og/events/venice-carnival.png": {
		"type": "image/png",
		"etag": "\"f166-tbQNbVuM6vcwPG5X7S1L3+RlMS8\"",
		"mtime": "2026-11-27T02:39:58.523Z",
		"size": 61798,
		"path": "../og/events/venice-carnival.png"
	},
	"/og/events/winter-olympics-2030.png": {
		"type": "image/png",
		"etag": "\"125ea-g1oQLkybfsdrjuZ9Aeq2oxD79II\"",
		"mtime": "2026-11-27T02:39:58.523Z",
		"size": 75242,
		"path": "../og/events/winter-olympics-2030.png"
	}
};
//#endregion
//#region #nitro/virtual/public-assets
var publicAssetBases = {};
function isPublicAssetURL(id = "") {
	if (public_assets_data_default[id]) return true;
	for (const base in publicAssetBases) if (id.startsWith(base)) return true;
	return false;
}
//#endregion
//#region node_modules/nitro/dist/presets/cloudflare/runtime/_module-handler.mjs
function augmentReq(cfReq, ctx) {
	const req = cfReq;
	req.ip = cfReq.headers.get("cf-connecting-ip") || void 0;
	req.runtime ??= { name: "cloudflare" };
	req.runtime.cloudflare = {
		...req.runtime.cloudflare,
		...ctx
	};
	req.waitUntil = ctx.context?.waitUntil.bind(ctx.context);
}
//#endregion
//#region node_modules/nitro/dist/presets/cloudflare/runtime/cloudflare-pages.mjs
var nitroApp = useNitroApp();
var cloudflare_pages_default = {
	async fetch(cfReq, env, context) {
		augmentReq(cfReq, {
			env,
			context
		});
		const url = new URL(cfReq.url);
		if (env.ASSETS && isPublicAssetURL(url.pathname)) return env.ASSETS.fetch(cfReq);
		return nitroApp.fetch(cfReq);
	},
	scheduled(event, env, context) {}
};
//#endregion
export { cloudflare_pages_default as default };
