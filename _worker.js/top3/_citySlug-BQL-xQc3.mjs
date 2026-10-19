import { t as getDestinationPicksSync } from "./_ssr/hotelService-Doyv5Iys.mjs";
import { f as lazyRouteComponent, j as notFound, p as createFileRoute } from "./_libs/@tanstack/react-router+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/_citySlug-BQL-xQc3.js
var $$splitComponentImporter = () => import("./_citySlug-CJBFhXYI.mjs");
var $$splitNotFoundComponentImporter = () => import("./_citySlug-ChYI-Gf9.mjs");
var ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
var asDate = (value) => typeof value === "string" && ISO_DATE.test(value) ? value : void 0;
var Route = createFileRoute("/$citySlug")({
	validateSearch: (search) => ({
		checkIn: asDate(search["checkIn"]),
		checkOut: asDate(search["checkOut"])
	}),
	loader: ({ params }) => {
		const picks = getDestinationPicksSync(params.citySlug);
		if (!picks) throw notFound();
		return picks;
	},
	head: ({ loaderData, params }) => {
		if (!loaderData) return { meta: [{ title: "Destination not found — Top3Hotels" }, {
			name: "robots",
			content: "noindex"
		}] };
		const { city, budget, bestValue, luxury } = loaderData;
		const title = `The 3 best hotels in ${city.name} — Budget, Best Value, Luxury | Top3Hotels`;
		const description = `Exactly three hotels in ${city.name}, ${city.country}: ${budget.name} for budget, ${bestValue.name} for best value and ${luxury.name} for luxury. 1 city. 3 hotels. Done.`;
		return {
			meta: [
				{ title },
				{
					name: "description",
					content: description
				},
				{
					property: "og:title",
					content: title
				},
				{
					property: "og:description",
					content: description
				},
				{
					property: "og:type",
					content: "website"
				},
				{
					name: "twitter:card",
					content: "summary_large_image"
				}
			],
			links: [{
				rel: "canonical",
				href: `https://top3hotels.com/${params.citySlug}`
			}]
		};
	},
	notFoundComponent: lazyRouteComponent($$splitNotFoundComponentImporter, "notFoundComponent"),
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
//#endregion
export { Route as t };
