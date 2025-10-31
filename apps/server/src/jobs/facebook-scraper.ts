import { chromium } from "playwright";

export interface ScrapeResult {
	success: boolean;
	creativeCount?: number;
	pageName?: string;
	error?: string;
}

/**
 * Scrapes Facebook Ad Library page to extract creative count and page name
 */
export async function scrapeFacebookAdLibrary(
	url: string,
): Promise<ScrapeResult> {
	let browser;

	try {
		// Launch headless browser
		browser = await chromium.launch({
			headless: true,
		});

		const context = await browser.newContext({
			userAgent:
				"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
		});

		const page = await context.newPage();

		// Navigate to Facebook Ad Library URL
		await page.goto(url, {
			waitUntil: "domcontentloaded",
			timeout: 30000,
		});

		// Wait for content to load
		await page.waitForTimeout(3000);

		// Try to extract page name from various possible selectors
		let pageName: string | undefined;
		try {
			// Common selectors for page name in FB Ad Library
			const pageNameSelectors = [
				'[data-testid="page-name"]',
				'a[href*="/ads/library/?active_status"] span',
				'div[role="heading"]',
				".x1lliihq.x6ikm8r.x10wlt62",
			];

			for (const selector of pageNameSelectors) {
				const element = await page.$(selector);
				if (element) {
					const text = await element.textContent();
					if (text && text.trim()) {
						pageName = text.trim();
						break;
					}
				}
			}
		} catch (error) {
			console.warn("Could not extract page name:", error);
		}

		// Try to extract creative count
		let creativeCount: number | undefined;
		try {
			// Look for text patterns like "X ads" or "X results"
			const bodyText = await page.textContent("body");

			if (bodyText) {
				// Match patterns like "123 ads", "1,234 ads", "1.234 ads", or "1 234 ads"
				const adsMatch = bodyText.match(/(\d{1,3}(?:[,.\s]\d{3})*)\s+ads?/i);
				if (adsMatch?.[1]) {
					const matched = adsMatch[1];
					creativeCount = Number.parseInt(matched.replace(/[,.\s]/g, ""), 10);
					console.log(`[Scraper Debug] Matched ads: "${matched}" → parsed: ${creativeCount}`);
				}

				// Alternative: look for results count
				if (!creativeCount) {
					const resultsMatch = bodyText.match(/(\d{1,3}(?:[,.\s]\d{3})*)\s+results?/i);
					if (resultsMatch?.[1]) {
						const matched = resultsMatch[1];
						creativeCount = Number.parseInt(matched.replace(/[,.\s]/g, ""), 10);
						console.log(`[Scraper Debug] Matched results: "${matched}" → parsed: ${creativeCount}`);
					}
				}
			}

			// If still not found, try counting visible ad cards
			if (!creativeCount) {
				const adCards = await page.$$('[data-testid="ad-card"]');
				if (adCards.length > 0) {
					creativeCount = adCards.length;
				}
			}
		} catch (error) {
			console.warn("Could not extract creative count:", error);
		}

		await browser.close();

		if (creativeCount !== undefined) {
			return {
				success: true,
				creativeCount,
				pageName,
			};
		}

		return {
			success: false,
			error: "Could not extract creative count from page",
		};
	} catch (error) {
		if (browser) {
			await browser.close();
		}

		return {
			success: false,
			error: error instanceof Error ? error.message : "Unknown error",
		};
	}
}
