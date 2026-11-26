import { r as withStayDates } from "./_ssr/hotelService-Doyv5Iys.mjs";
import { n as require_jsx_runtime } from "./_libs/react+tanstack__react-query.mjs";
import { h as Link } from "./_libs/@tanstack/react-router+[...].mjs";
import { t as Route } from "./_citySlug-BQL-xQc3.mjs";
import { a as Check, i as ChevronLeft, o as ArrowUpRight, t as Star } from "./_libs/lucide-react.mjs";
import { i as cn, n as DestinationSearch, r as SiteFooter, t as BrandHeader } from "./_ssr/SiteFooter-yEJJfFPQ.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/_citySlug-CJBFhXYI.js
var import_jsx_runtime = require_jsx_runtime();
/**
* Demo photography registry.
*
* Seed rows store an image *key* rather than a remote URL so the MVP ships no
* third-party image dependency. When supplier photos arrive, `imageUrl` will
* hold a real absolute URL and `resolveImage` will simply pass it through.
*/
var REGISTRY = {
	"hotel-budget-1": "/assets/hotel-budget-1-Mq8OJiFL.jpg",
	"hotel-budget-2": "/assets/hotel-budget-2-CzC4JT2y.jpg",
	"hotel-value-1": "/assets/hotel-value-1-CDzvzKL1.jpg",
	"hotel-value-2": "/assets/hotel-value-2-dNXHOQex.jpg",
	"hotel-luxury-1": "/assets/hotel-luxury-1-B21VL_6k.jpg",
	"hotel-luxury-2": "/assets/hotel-luxury-2-lUHSVNcV.jpg"
};
function resolveImage(keyOrUrl) {
	if (/^https?:\/\//.test(keyOrUrl)) return keyOrUrl;
	return REGISTRY[keyOrUrl] ?? "/assets/hotel-value-1-CDzvzKL1.jpg";
}
var CATEGORY_LABEL = {
	budget: "Budget",
	best_value: "Best Value",
	luxury: "Luxury"
};
var CATEGORY_TAGLINE = {
	budget: "Best quality you can get affordably",
	best_value: "The strongest overall balance",
	luxury: "Premium, without wasted money"
};
function formatPrice(amount, currency) {
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency,
		maximumFractionDigits: 0
	}).format(amount);
}
function formatReviewCount(count) {
	return new Intl.NumberFormat("en-US").format(count);
}
function ratingWord(rating) {
	if (rating >= 9.3) return "Exceptional";
	if (rating >= 9) return "Superb";
	if (rating >= 8.5) return "Excellent";
	return "Very good";
}
function HotelCard({ hotel, city, dates, emphasized = false, priority = false }) {
	const href = withStayDates(hotel.affiliateUrl, dates);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
		className: cn("surface-card surface-card-interactive group flex h-full flex-col overflow-hidden", emphasized && "border-border-strong shadow-card-hover ring-1 ring-accent/25"),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "relative aspect-[4/3] overflow-hidden bg-muted",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
				src: resolveImage(hotel.imageUrl),
				alt: `${hotel.name} in ${hotel.neighborhood}, ${city.name}`,
				width: 1280,
				height: 960,
				loading: priority ? "eager" : "lazy",
				fetchPriority: priority ? "high" : void 0,
				decoding: "async",
				className: "size-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "absolute left-4 top-4 flex items-center gap-2",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: cn("rounded-full px-3 py-1 text-[0.6875rem] font-semibold uppercase tracking-[0.12em] backdrop-blur", emphasized ? "bg-accent text-accent-foreground" : "bg-card/90 text-foreground"),
					children: CATEGORY_LABEL[hotel.category]
				})
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-1 flex-col p-5 sm:p-6",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs text-muted-foreground",
					children: CATEGORY_TAGLINE[hotel.category]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
					className: "mt-2 font-display text-[1.55rem] leading-tight text-foreground",
					children: hotel.name
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
						hotel.neighborhood,
						", ",
						city.name
					] }), hotel.stars ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "inline-flex items-center gap-0.5",
						"aria-label": `${hotel.stars} star hotel`,
						children: Array.from({ length: hotel.stars }).map((_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Star, {
							"aria-hidden": true,
							className: "size-3 fill-current text-accent"
						}, i))
					}) : null]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-4 flex items-center gap-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "rounded-lg bg-score px-2.5 py-1 text-sm font-semibold text-score-foreground",
							children: hotel.rating.toFixed(1)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-sm text-foreground",
							children: ratingWord(hotel.rating)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "text-sm text-muted-foreground",
							children: [formatReviewCount(hotel.reviewCount), " reviews"]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-4 text-sm leading-relaxed text-foreground/85",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "font-semibold text-foreground",
						children: "Why we picked it. "
					}), hotel.shortReason]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "mt-4 space-y-1.5",
					children: hotel.attributes.slice(0, 3).map((attribute) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "flex items-start gap-2 text-sm text-muted-foreground",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, {
							"aria-hidden": true,
							className: "mt-0.5 size-3.5 shrink-0 text-accent"
						}), attribute]
					}, attribute))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-auto pt-6",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-baseline gap-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-xl font-semibold text-foreground",
							children: formatPrice(hotel.priceFrom, hotel.currency)
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-sm text-muted-foreground",
							children: "per night, indicative"
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
						href,
						target: "_blank",
						rel: "noopener noreferrer nofollow sponsored",
						className: cn("mt-3 inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-xl text-sm font-semibold transition-all duration-300", emphasized ? "bg-accent text-accent-foreground hover:brightness-110" : "bg-primary text-primary-foreground hover:bg-primary/90"),
						children: ["Check availability", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowUpRight, {
							"aria-hidden": true,
							className: "size-4 transition-transform duration-300 group-hover:translate-x-0.5"
						})]
					})]
				})
			]
		})]
	});
}
var CRITERIA = [
	{
		title: "Review quality",
		body: "We start from a high guest-score floor and prefer hotels rated 9.0 and above."
	},
	{
		title: "Price relative to market",
		body: "Rates are judged against what comparable hotels in the same city actually charge."
	},
	{
		title: "Central location",
		body: "Walkability to the places you came for counts as much as the room itself."
	},
	{
		title: "Review volume",
		body: "A great score backed by thousands of stays beats a great score backed by twelve."
	},
	{
		title: "Hotel quality",
		body: "Star class, rooms and facilities decide which hotel earns the luxury slot."
	}
];
function HowWeChoose() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		"aria-labelledby": "how-we-choose",
		className: "mt-16",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				id: "how-we-choose",
				className: "font-display text-2xl text-foreground",
				children: "How we choose"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1.5 max-w-xl text-sm text-muted-foreground",
				children: "Every destination is narrowed to three hotels using the same five signals. No sponsored placements decide the order."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-6 grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3",
				children: CRITERIA.map((criterion, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "border-t border-border pt-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "eyebrow",
							children: String(index + 1).padStart(2, "0")
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "mt-1.5 text-base font-semibold text-foreground",
							children: criterion.title
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1.5 text-sm leading-relaxed text-muted-foreground",
							children: criterion.body
						})
					]
				}, criterion.title))
			})
		]
	});
}
/**
* Lightweight static map placeholder.
*
* Deliberately dependency-free: it projects the three hotel coordinates into a
* padded bounding box so the pin layout is geographically faithful. When
* MapLibre lands, only the inner surface is replaced — the props stay the same.
*/
function PicksMap({ hotels, cityName }) {
	const lats = hotels.map((h) => h.latitude);
	const lngs = hotels.map((h) => h.longitude);
	const minLat = Math.min(...lats);
	const maxLat = Math.max(...lats);
	const minLng = Math.min(...lngs);
	const maxLng = Math.max(...lngs);
	const latSpan = Math.max(maxLat - minLat, .008);
	const lngSpan = Math.max(maxLng - minLng, .008);
	const project = (hotel) => ({
		left: `${18 + (hotel.longitude - minLng) / lngSpan * 64}%`,
		top: `${78 - (hotel.latitude - minLat) / latSpan * 58}%`
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		"aria-labelledby": "map-heading",
		className: "mt-16",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				id: "map-heading",
				className: "font-display text-2xl text-foreground",
				children: "See all 3 on map"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-1.5 text-sm text-muted-foreground",
				children: [
					"Relative positions of your three picks in ",
					cityName,
					"."
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "surface-card mt-5 overflow-hidden",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "relative h-64 w-full bg-secondary sm:h-80",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							"aria-hidden": true,
							className: "absolute inset-0 opacity-[0.55]",
							style: {
								backgroundImage: "linear-gradient(to right, var(--border) 1px, transparent 1px), linear-gradient(to bottom, var(--border) 1px, transparent 1px)",
								backgroundSize: "44px 44px"
							}
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							"aria-hidden": true,
							className: "absolute inset-x-0 top-1/2 h-10 -translate-y-1/2 -rotate-6 bg-background/70"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							"aria-hidden": true,
							className: "absolute inset-y-0 left-1/3 w-8 rotate-3 bg-background/60"
						}),
						hotels.map((hotel) => {
							const pos = project(hotel);
							return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "absolute -translate-x-1/2 -translate-y-full",
								style: pos,
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex flex-col items-center gap-1",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "whitespace-nowrap rounded-full border border-border bg-card px-2.5 py-1 text-[0.6875rem] font-semibold text-foreground shadow-card",
										children: CATEGORY_LABEL[hotel.category]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										"aria-hidden": true,
										className: "size-3 rounded-full border-2 border-card bg-accent shadow-card"
									})]
								})
							}, hotel.id);
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "absolute bottom-3 right-4 text-[0.6875rem] text-muted-foreground",
							children: "Schematic map preview"
						})
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-4 grid gap-2 sm:grid-cols-3",
				children: hotels.map((hotel) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "text-sm text-muted-foreground",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-medium text-foreground",
							children: CATEGORY_LABEL[hotel.category]
						}),
						" ",
						"· ",
						hotel.neighborhood
					]
				}, hotel.id))
			})
		]
	});
}
function DestinationPage() {
	const { city, budget, bestValue, luxury } = Route.useLoaderData();
	const { checkIn, checkOut } = Route.useSearch();
	const dates = {
		checkIn,
		checkOut
	};
	const hotels = [
		budget,
		bestValue,
		luxury
	];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen bg-background",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BrandHeader, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
				className: "mx-auto max-w-6xl px-5 pb-4 pt-10 sm:px-8 sm:pt-14",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: "/",
						className: "inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, {
							"aria-hidden": true,
							className: "size-4"
						}), "New search"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
						className: "mt-5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "eyebrow",
								children: [
									city.country,
									" · ",
									hotels.length,
									" hotels"
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h1", {
								className: "mt-3 font-display text-[2.3rem] leading-[1.05] text-foreground sm:text-5xl",
								children: [
									"The 3 best hotels in ",
									city.name,
									"."
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-3 max-w-xl text-base leading-relaxed text-muted-foreground",
								children: "One for each way of travelling. Prices are indicative per night; add dates to refine them."
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-8 max-w-3xl",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DestinationSearch, {
							initialQuery: city.name,
							initialCheckIn: checkIn ?? "",
							initialCheckOut: checkOut ?? "",
							compact: true
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
						"aria-label": `Hotel picks for ${city.name}`,
						className: "mt-12",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid gap-6 lg:grid-cols-3",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HotelCard, {
									hotel: budget,
									city,
									dates,
									priority: true
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HotelCard, {
									hotel: bestValue,
									city,
									dates,
									emphasized: true
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HotelCard, {
									hotel: luxury,
									city,
									dates
								})
							]
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PicksMap, {
						hotels,
						cityName: city.name
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HowWeChoose, {})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SiteFooter, {})
		]
	});
}
//#endregion
export { DestinationPage as component };
