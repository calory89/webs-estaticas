import { n as __toESM } from "../_runtime.mjs";
import { n as searchCities } from "./hotelService-Doyv5Iys.mjs";
import { n as require_jsx_runtime, r as require_react } from "../_libs/react+tanstack__react-query.mjs";
import { g as useNavigate, h as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as Search, r as MapPin } from "../_libs/lucide-react.mjs";
import { t as clsx } from "../_libs/clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/SiteFooter-yEJJfFPQ.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function BrandHeader() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("header", {
		className: "sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-md",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto flex h-14 max-w-6xl items-center justify-between px-5 sm:h-16 sm:px-8",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				to: "/",
				className: "brand-mark text-[0.9rem] text-foreground transition-opacity hover:opacity-70 sm:text-base",
				"aria-label": "Top3Hotels home",
				children: "Top3Hotels"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "hidden text-sm text-muted-foreground sm:block",
				children: "1 city. 3 hotels. Done."
			})]
		})
	});
}
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
var todayIso = () => (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
/**
* Destination-first search control.
*
* Suggestions come from the local city seed, so filtering is synchronous and
* feels instant. Selecting a suggestion navigates immediately — there is no
* Search button to press. Dates are optional and only refine pricing.
*/
function DestinationSearch({ initialQuery = "", initialCheckIn = "", initialCheckOut = "", compact = false, autoFocus = false }) {
	const navigate = useNavigate();
	const listboxId = (0, import_react.useId)();
	const containerRef = (0, import_react.useRef)(null);
	const [query, setQuery] = (0, import_react.useState)(initialQuery);
	const [open, setOpen] = (0, import_react.useState)(false);
	const [activeIndex, setActiveIndex] = (0, import_react.useState)(0);
	const [checkIn, setCheckIn] = (0, import_react.useState)(initialCheckIn);
	const [checkOut, setCheckOut] = (0, import_react.useState)(initialCheckOut);
	const suggestions = (0, import_react.useMemo)(() => searchCities(query), [query]);
	(0, import_react.useEffect)(() => {
		if (!open) return;
		const onPointerDown = (event) => {
			if (!containerRef.current?.contains(event.target)) setOpen(false);
		};
		document.addEventListener("mousedown", onPointerDown);
		return () => document.removeEventListener("mousedown", onPointerDown);
	}, [open]);
	function goToCity(city) {
		setQuery(city.name);
		setOpen(false);
		navigate({
			to: "/$citySlug",
			params: { citySlug: city.slug },
			search: {
				...checkIn ? { checkIn } : {},
				...checkOut ? { checkOut } : {}
			}
		});
	}
	function onKeyDown(event) {
		if (event.key === "ArrowDown") {
			event.preventDefault();
			setOpen(true);
			setActiveIndex((i) => suggestions.length ? (i + 1) % suggestions.length : 0);
		} else if (event.key === "ArrowUp") {
			event.preventDefault();
			setActiveIndex((i) => suggestions.length ? (i - 1 + suggestions.length) % suggestions.length : 0);
		} else if (event.key === "Enter") {
			const city = suggestions[activeIndex];
			if (city) {
				event.preventDefault();
				goToCity(city);
			}
		} else if (event.key === "Escape") setOpen(false);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		ref: containerRef,
		className: "relative w-full",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: cn("flex flex-col gap-0 overflow-hidden rounded-2xl border border-border bg-card shadow-card transition-shadow focus-within:shadow-card-hover sm:flex-row sm:items-stretch", compact ? "sm:h-14" : "sm:h-16"),
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "relative flex min-w-0 flex-1 items-center gap-3 px-4 sm:px-5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, {
							"aria-hidden": true,
							className: "size-[18px] shrink-0 text-muted-foreground"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "min-w-0 flex-1 py-3 sm:py-0",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								htmlFor: `${listboxId}-input`,
								className: "eyebrow block sm:hidden",
								children: "Destination"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								id: `${listboxId}-input`,
								value: query,
								autoFocus,
								onChange: (e) => {
									setQuery(e.target.value);
									setOpen(true);
									setActiveIndex(0);
								},
								onFocus: () => setOpen(true),
								onKeyDown,
								placeholder: "Where are you going?",
								autoComplete: "off",
								role: "combobox",
								"aria-expanded": open,
								"aria-controls": `${listboxId}-listbox`,
								"aria-autocomplete": "list",
								"aria-activedescendant": open && suggestions[activeIndex] ? `${listboxId}-opt-${activeIndex}` : void 0,
								className: "w-full bg-transparent text-base text-foreground placeholder:text-muted-foreground focus:outline-none"
							})]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "h-px w-full bg-border sm:h-auto sm:w-px",
						"aria-hidden": true
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2 px-4 py-3 sm:w-[19rem] sm:py-0 sm:pl-5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								htmlFor: `${listboxId}-in`,
								className: "eyebrow block",
								children: "Check in"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								id: `${listboxId}-in`,
								type: "date",
								value: checkIn,
								min: todayIso(),
								onChange: (e) => setCheckIn(e.target.value),
								className: "w-full bg-transparent text-sm text-foreground focus:outline-none"
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								htmlFor: `${listboxId}-out`,
								className: "eyebrow block",
								children: "Check out"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								id: `${listboxId}-out`,
								type: "date",
								value: checkOut,
								min: checkIn || todayIso(),
								onChange: (e) => setCheckOut(e.target.value),
								className: "w-full bg-transparent text-sm text-foreground focus:outline-none"
							})]
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 text-center text-xs text-muted-foreground sm:text-left",
				children: "Pick a destination and your 3 hotels appear straight away. Dates are optional."
			}),
			open && suggestions.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				id: `${listboxId}-listbox`,
				role: "listbox",
				"aria-label": "Destination suggestions",
				className: "absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-border bg-popover py-1.5 shadow-float",
				children: suggestions.map((city, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
					role: "none",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						id: `${listboxId}-opt-${index}`,
						role: "option",
						"aria-selected": index === activeIndex,
						onMouseEnter: () => setActiveIndex(index),
						onClick: () => goToCity(city),
						className: cn("flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors", index === activeIndex ? "bg-secondary" : "bg-transparent"),
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, {
								"aria-hidden": true,
								className: "size-4 shrink-0 text-accent"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-sm font-medium text-foreground",
								children: city.name
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-sm text-muted-foreground",
								children: city.country
							})
						]
					})
				}, city.id))
			})
		]
	});
}
function SiteFooter() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("footer", {
		className: "mt-20 border-t border-border bg-background",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto max-w-6xl px-5 py-12 sm:px-8",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/",
					className: "brand-mark text-sm text-foreground",
					children: "Top3Hotels"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 font-display text-2xl leading-snug text-foreground",
					children: "We search. You choose from 3."
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "max-w-sm text-xs leading-relaxed text-muted-foreground",
					children: "Prices shown are indicative demo figures for this preview and are not live availability. Availability and final rates are confirmed with the hotel provider."
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-10 text-xs text-muted-foreground",
				children: [
					"© ",
					(/* @__PURE__ */ new Date()).getFullYear(),
					" Top3Hotels"
				]
			})]
		})
	});
}
//#endregion
export { cn as i, DestinationSearch as n, SiteFooter as r, BrandHeader as t };
