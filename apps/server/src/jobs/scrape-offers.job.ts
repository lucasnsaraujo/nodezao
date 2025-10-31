import cron from "node-cron";
import { db } from "@nodezao/db";
import { offers } from "@nodezao/db/schema/offers";
import { offerPages } from "@nodezao/db/schema/offer-pages";
import { facebookPages } from "@nodezao/db/schema/facebook-pages";
import { creativeSnapshots } from "@nodezao/db/schema/snapshots";
import { eq } from "drizzle-orm";
import { scrapeFacebookAdLibrary } from "./facebook-scraper";

/**
 * Scrapes all active offers (with multiple pages) and creates snapshots
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
		let totalPagesScraped = 0;

		// Scrape each offer
		for (const offer of activeOffers) {
			try {
				console.log(`[Scraper] Scraping offer: ${offer.name} (ID: ${offer.id})`);

				// Get all pages for this offer
				const pages = await db
					.select({
						pageId: facebookPages.id,
						url: facebookPages.url,
						pageName: facebookPages.pageName,
						isPrimary: offerPages.isPrimary,
					})
					.from(offerPages)
					.innerJoin(facebookPages, eq(offerPages.pageId, facebookPages.id))
					.where(eq(offerPages.offerId, offer.id));

				if (pages.length === 0) {
					console.warn(
						`[Scraper] ⚠ Offer ${offer.id} has no pages associated`,
					);
					failCount++;
					continue;
				}

				console.log(
					`[Scraper] Found ${pages.length} page(s) for offer: ${offer.name}`,
				);

				// Scrape each page
				for (const page of pages) {
					try {
						const result = await scrapeFacebookAdLibrary(page.url);

						if (result.success && result.creativeCount !== undefined) {
							console.log(
								`[Scraper] Saving snapshot - Offer: ${offer.name}, Page: ${page.pageName}, Count: ${result.creativeCount} (type: ${typeof result.creativeCount})`
							);

							// Save snapshot with pageId
							await db.insert(creativeSnapshots).values({
								offerId: offer.id,
								pageId: page.pageId,
								creativeCount: result.creativeCount,
							});

							console.log(
								`[Scraper] ✓ Snapshot saved successfully`
							);

							// Update page name if changed
							if (
								result.pageName &&
								(!page.pageName || page.pageName !== result.pageName)
							) {
								await db
									.update(facebookPages)
									.set({
										pageName: result.pageName,
										updatedAt: new Date(),
									})
									.where(eq(facebookPages.id, page.pageId));
							}

							console.log(
								`[Scraper] ✓ Success: ${page.pageName || "Unknown page"} - ${result.creativeCount} creatives`,
							);
							successCount++;
							totalPagesScraped++;
						} else {
							console.error(
								`[Scraper] ✗ Failed: ${page.url} - ${result.error}`,
							);
							failCount++;
						}

						// Delay between pages (2-5 seconds)
						const delay = 2000 + Math.random() * 3000;
						await new Promise((resolve) => setTimeout(resolve, delay));
					} catch (error) {
						console.error(
							`[Scraper] Error scraping page ${page.pageId}:`,
							error,
						);
						failCount++;
					}
				}
			} catch (error) {
				console.error(
					`[Scraper] Error processing offer ${offer.id}:`,
					error,
				);
				failCount++;
			}
		}

		console.log(
			`[Scraper] Job complete: ${successCount} pages scraped successfully, ${failCount} failed (total ${totalPagesScraped} pages processed)`,
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
	const task = cron.schedule("0 * * * *", async () => {
		console.log("[Scraper] Cron job triggered");
		await scrapeAllOffers();
	});

	console.log("[Scraper] Cron job scheduled: every hour at minute 0");

	// Run once on startup (after 1 minute delay)
	setTimeout(async () => {
		console.log("[Scraper] Running initial scrape after startup");
		await scrapeAllOffers();
	}, 60000);

	return task;
}
