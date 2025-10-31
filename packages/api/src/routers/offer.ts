import { router, protectedProcedure } from "../index";
import { offers } from "@nodezao/db/schema/offers";
import { creativeSnapshots } from "@nodezao/db/schema/snapshots";
import { facebookPages } from "@nodezao/db/schema/facebook-pages";
import { offerPages } from "@nodezao/db/schema/offer-pages";
import { regions } from "@nodezao/db/schema/regions";
import { offerTypes } from "@nodezao/db/schema/offer-types";
import { niches } from "@nodezao/db/schema/niches";
import { strategies } from "@nodezao/db/schema/strategies";
import {
	eq,
	and,
	or,
	like,
	desc,
	lte,
	sql,
	arrayOverlaps,
	inArray,
} from "drizzle-orm";
import { db } from "@nodezao/db";
import {
	createOfferInput,
	updateOfferInput,
	deleteOfferInput,
	getOfferByIdInput,
	filterOffersInput,
	addPageToOfferInput,
	removePageFromOfferInput,
} from "../validators/offer";

export const offerRouter = router({
	// Get all offers with optional filters (user-scoped)
	getAll: protectedProcedure
		.input(filterOffersInput)
		.query(async ({ ctx, input }) => {
			const conditions = [eq(offers.userId, ctx.session.user.id)];

			if (input.region) {
				conditions.push(eq(offers.region, input.region));
			}
			if (input.type) {
				conditions.push(eq(offers.type, input.type));
			}
			if (input.niche) {
				conditions.push(eq(offers.niche, input.niche));
			}
			if (input.strategy) {
				conditions.push(eq(offers.strategy, input.strategy));
			}
			if (input.isActive !== undefined) {
				conditions.push(eq(offers.isActive, input.isActive));
			}

			// Search in offer name or page names
			if (input.search) {
				const offersWithMatchingName = await db
					.select({ id: offers.id })
					.from(offers)
					.where(
						and(
							eq(offers.userId, ctx.session.user.id),
							like(offers.name, `%${input.search}%`),
						),
					);

				const offersWithMatchingPage = await db
					.select({ offerId: offerPages.offerId })
					.from(offerPages)
					.innerJoin(facebookPages, eq(offerPages.pageId, facebookPages.id))
					.where(like(facebookPages.pageName, `%${input.search}%`));

				const matchingOfferIds = [
					...new Set([
						...offersWithMatchingName.map((o) => o.id),
						...offersWithMatchingPage.map((o) => o.offerId),
					]),
				];

				if (matchingOfferIds.length > 0) {
					conditions.push(inArray(offers.id, matchingOfferIds));
				} else {
					// No matches
					return {
						data: [],
						total: 0,
						limit: input.limit,
						offset: input.offset,
					};
				}
			}

			// Array filter for badges
			if (input.badges && input.badges.length > 0) {
				conditions.push(arrayOverlaps(offers.badges, input.badges));
			}

			// Get total count
			const countResult = await db
				.select({ count: sql<number>`count(*)` })
				.from(offers)
				.where(and(...conditions));

			const total = Number(countResult[0]?.count || 0);

			// Get offers with labels
			const offerResults = await db
				.select({
					id: offers.id,
					uuid: offers.uuid,
					name: offers.name,
					region: offers.region,
					regionLabel: regions.name,
					type: offers.type,
					typeLabel: offerTypes.label,
					niche: offers.niche,
					nicheLabel: niches.label,
					strategy: offers.strategy,
					strategyLabel: strategies.label,
					pageName: offers.pageName,
					facebookUrl: offers.facebookUrl,
					hasCloaker: offers.hasCloaker,
					badges: offers.badges,
					isActive: offers.isActive,
					createdAt: offers.createdAt,
					updatedAt: offers.updatedAt,
				})
				.from(offers)
				.leftJoin(
					regions,
					and(eq(offers.region, regions.slug), eq(regions.userId, ctx.session.user.id)),
				)
				.leftJoin(
					offerTypes,
					and(eq(offers.type, offerTypes.slug), eq(offerTypes.userId, ctx.session.user.id)),
				)
				.leftJoin(
					niches,
					and(eq(offers.niche, niches.slug), eq(niches.userId, ctx.session.user.id)),
				)
				.leftJoin(
					strategies,
					and(eq(offers.strategy, strategies.slug), eq(strategies.userId, ctx.session.user.id)),
				)
				.where(and(...conditions))
				.orderBy(desc(offers.createdAt))
				.limit(input.limit)
				.offset(input.offset);

			// Get pages for each offer
			const offerIds = offerResults.map((o) => o.id);
			const pagesData =
				offerIds.length > 0
					? await db
							.select({
								offerId: offerPages.offerId,
								pageId: facebookPages.id,
								url: facebookPages.url,
								pageName: facebookPages.pageName,
								isPrimary: offerPages.isPrimary,
							})
							.from(offerPages)
							.innerJoin(facebookPages, eq(offerPages.pageId, facebookPages.id))
							.where(inArray(offerPages.offerId, offerIds))
							.orderBy(desc(offerPages.isPrimary))
					: [];

			// Map pages to offers
			const results = offerResults.map((offer) => ({
				...offer,
				pages: pagesData.filter((p) => p.offerId === offer.id),
			}));

			return {
				data: results,
				total,
				limit: input.limit,
				offset: input.offset,
			};
		}),

	// Get offer by UUID with snapshots (user-scoped)
	getById: protectedProcedure
		.input(getOfferByIdInput)
		.query(async ({ ctx, input }) => {
			const offerResult = await db
				.select({
					id: offers.id,
					uuid: offers.uuid,
					name: offers.name,
					region: offers.region,
					regionLabel: regions.name,
					type: offers.type,
					typeLabel: offerTypes.label,
					niche: offers.niche,
					nicheLabel: niches.label,
					strategy: offers.strategy,
					strategyLabel: strategies.label,
					landingPageUrl: offers.landingPageUrl,
					description: offers.description,
					hasCloaker: offers.hasCloaker,
					pageName: offers.pageName,
					facebookUrl: offers.facebookUrl,
					badges: offers.badges,
					isActive: offers.isActive,
					userId: offers.userId,
					createdAt: offers.createdAt,
					updatedAt: offers.updatedAt,
				})
				.from(offers)
				.leftJoin(
					regions,
					and(eq(offers.region, regions.slug), eq(regions.userId, ctx.session.user.id)),
				)
				.leftJoin(
					offerTypes,
					and(eq(offers.type, offerTypes.slug), eq(offerTypes.userId, ctx.session.user.id)),
				)
				.leftJoin(
					niches,
					and(eq(offers.niche, niches.slug), eq(niches.userId, ctx.session.user.id)),
				)
				.leftJoin(
					strategies,
					and(eq(offers.strategy, strategies.slug), eq(strategies.userId, ctx.session.user.id)),
				)
				.where(
					and(eq(offers.uuid, input.uuid), eq(offers.userId, ctx.session.user.id)),
				)
				.limit(1);

			if (!offerResult || offerResult.length === 0) {
				throw new Error("Offer not found");
			}

			const offer = offerResult[0];

			// Get pages for this offer
			const pages = await db
				.select({
					pageId: facebookPages.id,
					url: facebookPages.url,
					pageName: facebookPages.pageName,
					isPrimary: offerPages.isPrimary,
				})
				.from(offerPages)
				.innerJoin(facebookPages, eq(offerPages.pageId, facebookPages.id))
				.where(eq(offerPages.offerId, offer.id))
				.orderBy(desc(offerPages.isPrimary));

			// Get snapshots for this offer (all pages)
			const snapshots = await db
				.select({
					id: creativeSnapshots.id,
					pageId: creativeSnapshots.pageId,
					creativeCount: creativeSnapshots.creativeCount,
					scrapedAt: creativeSnapshots.scrapedAt,
				})
				.from(creativeSnapshots)
				.where(eq(creativeSnapshots.offerId, offer.id))
				.orderBy(desc(creativeSnapshots.scrapedAt))
				.limit(200);

			return {
				...offer,
				pages,
				snapshots,
			};
		}),

	// Create new offer with multiple pages
	create: protectedProcedure
		.input(createOfferInput)
		.mutation(async ({ ctx, input }) => {
			const { facebookUrls, ...offerData } = input;

			// Create the offer first
			const offerResult = await db
				.insert(offers)
				.values({
					...offerData,
					userId: ctx.session.user.id,
					updatedAt: new Date(),
				})
				.returning();

			const offer = offerResult[0];

			// Create or get pages and link them
			for (let i = 0; i < facebookUrls.length; i++) {
				const url = facebookUrls[i];
				const isPrimary = i === 0;

				// Check if page exists
				const existingPage = await db
					.select()
					.from(facebookPages)
					.where(eq(facebookPages.url, url))
					.limit(1);

				let pageId: number;

				if (existingPage.length > 0) {
					pageId = existingPage[0].id;
				} else {
					const pageResult = await db
						.insert(facebookPages)
						.values({ url })
						.returning();
					pageId = pageResult[0].id;
				}

				// Link page to offer
				await db.insert(offerPages).values({
					offerId: offer.id,
					pageId,
					isPrimary,
				});
			}

			return offer;
		}),

	// Add a page to an existing offer
	addPage: protectedProcedure
		.input(addPageToOfferInput)
		.mutation(async ({ ctx, input }) => {
			const { offerId, url } = input;

			// Check if offer exists and belongs to user
			const offerResult = await db
				.select()
				.from(offers)
				.where(
					and(eq(offers.id, offerId), eq(offers.userId, ctx.session.user.id)),
				)
				.limit(1);

			if (!offerResult || offerResult.length === 0) {
				throw new Error("Offer not found or unauthorized");
			}

			// Check if URL already exists in facebook_pages
			const existingPage = await db
				.select()
				.from(facebookPages)
				.where(eq(facebookPages.url, url))
				.limit(1);

			let pageId: number;

			if (existingPage.length > 0) {
				pageId = existingPage[0].id;

				// Check if this page is already linked to this offer
				const existingLink = await db
					.select()
					.from(offerPages)
					.where(
						and(eq(offerPages.offerId, offerId), eq(offerPages.pageId, pageId)),
					)
					.limit(1);

				if (existingLink.length > 0) {
					throw new Error("This page is already linked to this offer");
				}
			} else {
				// Create new page
				const pageResult = await db
					.insert(facebookPages)
					.values({ url })
					.returning();
				pageId = pageResult[0].id;
			}

			// Link page to offer (always set isPrimary to false for added pages)
			const linkResult = await db
				.insert(offerPages)
				.values({
					offerId,
					pageId,
					isPrimary: false,
				})
				.returning();

			// Return the page data with the link information
			const pageData = await db
				.select({
					pageId: facebookPages.id,
					url: facebookPages.url,
					pageName: facebookPages.pageName,
					isPrimary: offerPages.isPrimary,
					createdAt: offerPages.createdAt,
				})
				.from(offerPages)
				.innerJoin(facebookPages, eq(offerPages.pageId, facebookPages.id))
				.where(eq(offerPages.id, linkResult[0].id))
				.limit(1);

			return pageData[0];
		}),

	// Update offer (user-scoped)
	update: protectedProcedure
		.input(updateOfferInput)
		.mutation(async ({ ctx, input }) => {
			const { uuid, facebookUrls, ...data } = input;

			// Get offer to verify ownership
			const offerResult = await db
				.select()
				.from(offers)
				.where(
					and(eq(offers.uuid, uuid), eq(offers.userId, ctx.session.user.id)),
				)
				.limit(1);

			if (!offerResult || offerResult.length === 0) {
				throw new Error("Offer not found or unauthorized");
			}

			const offer = offerResult[0];

			// Update offer data
			const result = await db
				.update(offers)
				.set({
					...data,
					updatedAt: new Date(),
				})
				.where(eq(offers.id, offer.id))
				.returning();

			// Update pages if provided
			if (facebookUrls && facebookUrls.length > 0) {
				// Remove existing relationships
				await db.delete(offerPages).where(eq(offerPages.offerId, offer.id));

				// Add new pages
				for (let i = 0; i < facebookUrls.length; i++) {
					const url = facebookUrls[i];
					const isPrimary = i === 0;

					const existingPage = await db
						.select()
						.from(facebookPages)
						.where(eq(facebookPages.url, url))
						.limit(1);

					let pageId: number;

					if (existingPage.length > 0) {
						pageId = existingPage[0].id;
					} else {
						const pageResult = await db
							.insert(facebookPages)
							.values({ url })
							.returning();
						pageId = pageResult[0].id;
					}

					await db.insert(offerPages).values({
						offerId: offer.id,
						pageId,
						isPrimary,
					});
				}
			}

			return result[0];
		}),

	// Delete offer (cascades)
	delete: protectedProcedure
		.input(deleteOfferInput)
		.mutation(async ({ ctx, input }) => {
			const result = await db
				.delete(offers)
				.where(
					and(eq(offers.uuid, input.uuid), eq(offers.userId, ctx.session.user.id)),
				)
				.returning();

			if (!result || result.length === 0) {
				throw new Error("Offer not found or unauthorized");
			}

			return result[0];
		}),

	// Get statistics (user-scoped)
	getStats: protectedProcedure.query(async ({ ctx }) => {
		const userOffers = await db
			.select()
			.from(offers)
			.where(eq(offers.userId, ctx.session.user.id));

		const total = userOffers.length;
		const active = userOffers.filter((o) => o.isActive).length;
		const offerIds = userOffers.map((o) => o.id);

		let totalCreatives = 0;
		let mostActiveOffer: { name: string; count: number } | null = null;
		let lastScraped: Date | null = null;

		if (offerIds.length > 0) {
			const latestSnapshots = await db
				.select({
					offerId: creativeSnapshots.offerId,
					pageId: creativeSnapshots.pageId,
					creativeCount: creativeSnapshots.creativeCount,
					scrapedAt: creativeSnapshots.scrapedAt,
				})
				.from(creativeSnapshots)
				.where(
					sql`${creativeSnapshots.offerId} IN (${sql.join(offerIds, sql`, `)})`,
				)
				.orderBy(desc(creativeSnapshots.scrapedAt));

			// Aggregate by offer (sum all pages)
			const snapshotsByOffer = new Map<number, number>();
			const scrapedAtByOffer = new Map<number, Date>();
			const processedPages = new Map<string, boolean>();

			for (const snapshot of latestSnapshots) {
				const key = `${snapshot.offerId}-${snapshot.pageId}`;
				if (!processedPages.has(key)) {
					processedPages.set(key, true);
					const current = snapshotsByOffer.get(snapshot.offerId) || 0;
					snapshotsByOffer.set(snapshot.offerId, current + snapshot.creativeCount);

					if (!scrapedAtByOffer.has(snapshot.offerId)) {
						scrapedAtByOffer.set(snapshot.offerId, snapshot.scrapedAt);
					}
					if (!lastScraped || snapshot.scrapedAt > lastScraped) {
						lastScraped = snapshot.scrapedAt;
					}
				}
			}

			// Calculate total
			for (const count of snapshotsByOffer.values()) {
				totalCreatives += count;
			}

			// Find most active
			let maxCount = 0;
			let maxOfferId: number | null = null;
			for (const [offerId, count] of snapshotsByOffer) {
				if (count > maxCount) {
					maxCount = count;
					maxOfferId = offerId;
				}
			}

			if (maxOfferId !== null) {
				const offer = userOffers.find((o) => o.id === maxOfferId);
				if (offer) {
					mostActiveOffer = {
						name: offer.name || "Unnamed Offer",
						count: maxCount,
					};
				}
			}

			// Get 24h deltas
			const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
			const yesterdaySnapshots = await db
				.select({
					offerId: creativeSnapshots.offerId,
					pageId: creativeSnapshots.pageId,
					creativeCount: creativeSnapshots.creativeCount,
				})
				.from(creativeSnapshots)
				.where(
					and(
						sql`${creativeSnapshots.offerId} IN (${sql.join(offerIds, sql`, `)})`,
						lte(creativeSnapshots.scrapedAt, yesterday),
					),
				)
				.orderBy(desc(creativeSnapshots.scrapedAt));

			// Aggregate yesterday by offer
			const yesterdayByOffer = new Map<number, number>();
			const processedYesterdayPages = new Map<string, boolean>();

			for (const snapshot of yesterdaySnapshots) {
				const key = `${snapshot.offerId}-${snapshot.pageId}`;
				if (!processedYesterdayPages.has(key)) {
					processedYesterdayPages.set(key, true);
					const current = yesterdayByOffer.get(snapshot.offerId) || 0;
					yesterdayByOffer.set(snapshot.offerId, current + snapshot.creativeCount);
				}
			}

			// Calculate trending
			let trendingUp = 0;
			let trendingDown = 0;

			for (const offerId of offerIds) {
				const latest = snapshotsByOffer.get(offerId) || 0;
				const old = yesterdayByOffer.get(offerId) || 0;
				const delta = latest - old;
				if (delta > 0) trendingUp++;
				else if (delta < 0) trendingDown++;
			}

			const nextScrape = new Date();
			nextScrape.setMinutes(0, 0, 0);
			nextScrape.setHours(nextScrape.getHours() + 1);

			const byRegion = userOffers.reduce(
				(acc, offer) => {
					if (offer.region) {
						acc[offer.region] = (acc[offer.region] || 0) + 1;
					}
					return acc;
				},
				{} as Record<string, number>,
			);

			const byType = userOffers.reduce(
				(acc, offer) => {
					if (offer.type) {
						acc[offer.type] = (acc[offer.type] || 0) + 1;
					}
					return acc;
				},
				{} as Record<string, number>,
			);

			return {
				total,
				active,
				inactive: total - active,
				totalCreatives,
				mostActiveOffer,
				trendingUp,
				trendingDown,
				lastScraped,
				nextScrape,
				byRegion,
				byType,
			};
		}

		return {
			total,
			active,
			inactive: total - active,
			totalCreatives: 0,
			mostActiveOffer: null,
			trendingUp: 0,
			trendingDown: 0,
			lastScraped: null,
			nextScrape: null,
			byRegion: {},
			byType: {},
		};
	}),

	// Remove a page from an offer
	removePage: protectedProcedure
		.input(removePageFromOfferInput)
		.mutation(async ({ ctx, input }) => {
			// Verify offer belongs to user
			const offer = await db
				.select({ id: offers.id })
				.from(offers)
				.where(
					and(
						eq(offers.uuid, input.offerUuid),
						eq(offers.userId, ctx.session.user.id),
					),
				)
				.limit(1);

			if (!offer || offer.length === 0) {
				throw new Error("Offer not found or unauthorized");
			}

			const offerId = offer[0].id;

			// Check if this is the only page
			const pageCount = await db
				.select({ count: sql<number>`count(*)::int` })
				.from(offerPages)
				.where(eq(offerPages.offerId, offerId));

			if (pageCount[0].count <= 1) {
				throw new Error("Cannot remove the last page from an offer");
			}

			// Delete the page association
			const result = await db
				.delete(offerPages)
				.where(
					and(
						eq(offerPages.offerId, offerId),
						eq(offerPages.pageId, input.pageId),
					),
				)
				.returning();

			if (!result || result.length === 0) {
				throw new Error("Page not found in this offer");
			}

			return {
				success: true,
				message: "Página removida com sucesso",
			};
		}),
});
