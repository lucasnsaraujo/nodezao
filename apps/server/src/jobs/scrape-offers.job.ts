import cron from "node-cron";
import { db } from "@nodezao/db";
import { offers } from "@nodezao/db/schema/offers";
import { creativeSnapshots } from "@nodezao/db/schema/snapshots";
import { eq } from "drizzle-orm";
import { scrapeFacebookAdLibrary } from "./facebook-scraper";

/**
 * Scrapes all active offers and creates snapshots
 */
export async function scrapeAllOffers() {
	console.log("[Scraper] Starting offer scraping job...");

	try {
		// Get all active offers
		const activeOffers = await db
			.select()
			.from(offers)
			.where(eq(offers.isActive, true));

		console.log(`[Scraper] Found ${activeOffers.length} active offers to scrape`);

		let successCount = 0;
		let failCount = 0;

		// Scrape each offer
		for (const offer of activeOffers) {
			try {
				console.log(`[Scraper] Scraping offer: ${offer.name} (ID: ${offer.id})`);

				const result = await scrapeFacebookAdLibrary(offer.facebookUrl);

				if (result.success && result.creativeCount !== undefined) {
					// Save snapshot
					await db.insert(creativeSnapshots).values({
						offerId: offer.id,
						creativeCount: result.creativeCount,
						scrapedAt: new Date(),
					});

					// Update page name if we got one and it's different
					if (
						result.pageName &&
						(!offer.pageName || offer.pageName !== result.pageName)
					) {
						await db
							.update(offers)
							.set({
								pageName: result.pageName,
								updatedAt: new Date(),
							})
							.where(eq(offers.id, offer.id));
					}

					console.log(
						`[Scraper] ✓ Success: ${offer.name} - ${result.creativeCount} creatives`,
					);
					successCount++;
				} else {
					console.error(
						`[Scraper] ✗ Failed: ${offer.name} - ${result.error}`,
					);
					failCount++;
				}

				// Add delay between requests to avoid rate limiting (2-5 seconds)
				const delay = 2000 + Math.random() * 3000;
				await new Promise((resolve) => setTimeout(resolve, delay));
			} catch (error) {
				console.error(
					`[Scraper] Error scraping offer ${offer.id}:`,
					error,
				);
				failCount++;
			}
		}

		console.log(
			`[Scraper] Job complete: ${successCount} success, ${failCount} failed`,
		);
	} catch (error) {
		console.error("[Scraper] Error in scraping job:", error);
	}
}

/**
 * Starts the cron job to scrape offers every hour
 */
export function startScraperCron() {
	// Run every hour at minute 0
	// Pattern: "0 * * * *" = At minute 0 of every hour
	const task = cron.schedule("0 * * * *", async () => {
		console.log("[Scraper] Cron job triggered");
		await scrapeAllOffers();
	});

	console.log("[Scraper] Cron job scheduled: every hour at minute 0");

	// Optionally run once on startup (after 1 minute delay to let server start)
	setTimeout(async () => {
		console.log("[Scraper] Running initial scrape after startup");
		await scrapeAllOffers();
	}, 60000);

	return task;
}
