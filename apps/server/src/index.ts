import "dotenv/config";
import { trpcServer } from "@hono/trpc-server";
import { createContext } from "@nodezao/api/context";
import { appRouter } from "@nodezao/api/routers/index";
import { auth } from "@nodezao/auth";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

const app = new Hono();

app.use(logger());
app.use(
	"/*",
	cors({
		origin: process.env.CORS_ORIGIN || "",
		allowMethods: ["GET", "POST", "OPTIONS"],
		allowHeaders: ["Content-Type", "Authorization"],
		credentials: true,
	}),
);

app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));

// Trigger refresh endpoint (server-side only, has access to scraper)
app.post("/api/trigger-refresh/:uuid", async (c) => {
	const { uuid } = c.req.param();
	const { db } = await import("@nodezao/db");
	const { offers } = await import("@nodezao/db/schema/offers");
	const { facebookPages } = await import("@nodezao/db/schema/facebook-pages");
	const { offerPages } = await import("@nodezao/db/schema/offer-pages");
	const { creativeSnapshots } = await import("@nodezao/db/schema/snapshots");
	const { eq, and } = await import("drizzle-orm");
	const { scrapeFacebookAdLibrary } = await import("./jobs/facebook-scraper");
	const { auth: betterAuth } = await import("@nodezao/auth");

	// Get session from cookie
	const session = await betterAuth.api.getSession({ headers: c.req.raw.headers });

	if (!session) {
		return c.json({ error: "Unauthorized" }, 401);
	}

	// Verify offer belongs to user
	const offer = await db
		.select({
			id: offers.id,
			uuid: offers.uuid,
			name: offers.name,
		})
		.from(offers)
		.where(
			and(
				eq(offers.uuid, uuid),
				eq(offers.userId, session.user.id),
			),
		)
		.limit(1);

	if (!offer || offer.length === 0) {
		return c.json({ error: "Offer not found or unauthorized" }, 404);
	}

	const offerId = offer[0].id;

	// Get all pages for this offer
	const pages = await db
		.select({
			id: facebookPages.id,
			url: facebookPages.url,
			pageName: facebookPages.pageName,
		})
		.from(facebookPages)
		.innerJoin(offerPages, eq(offerPages.pageId, facebookPages.id))
		.where(eq(offerPages.offerId, offerId));

	if (!pages || pages.length === 0) {
		return c.json({ error: "No pages found for this offer" }, 400);
	}

	// Scrape each page and create snapshots
	const results = [];
	for (const page of pages) {
		try {
			const result = await scrapeFacebookAdLibrary(page.url);

			if (result.success && result.creativeCount !== undefined) {
				// Insert new snapshot
				await db.insert(creativeSnapshots).values({
					offerId,
					pageId: page.id,
					creativeCount: result.creativeCount,
					scrapedAt: new Date(),
				});

				results.push({
					pageId: page.id,
					pageName: page.pageName || "Unknown",
					success: true,
					creativeCount: result.creativeCount,
				});
			} else {
				results.push({
					pageId: page.id,
					pageName: page.pageName || "Unknown",
					success: false,
					error: result.error || "Failed to extract creative count",
				});
			}
		} catch (error) {
			results.push({
				pageId: page.id,
				pageName: page.pageName || "Unknown",
				success: false,
				error: error instanceof Error ? error.message : "Unknown error",
			});
		}
	}

	const successCount = results.filter(r => r.success).length;
	const totalCount = results.length;

	return c.json({
		success: successCount > 0,
		message: `Updated ${successCount}/${totalCount} pages`,
		results,
	});
});

app.use(
	"/trpc/*",
	trpcServer({
		router: appRouter,
		createContext: (_opts, context) => {
			return createContext({ context });
		},
	}),
);

app.get("/", (c) => {
	return c.text("OK");
});

import { serve } from "@hono/node-server";
import { startScraperCron } from "./jobs/scrape-offers.job";

serve(
	{
		fetch: app.fetch,
		port: 3000,
	},
	(info) => {
		console.log(`Server is running on http://localhost:${info.port}`);

		// Start cron job for scraping offers
		startScraperCron();
	},
);
