import { router, protectedProcedure } from "../index";
import { offers } from "@nodezao/db/schema/offers";
import { creativeSnapshots } from "@nodezao/db/schema/snapshots";
import { regions } from "@nodezao/db/schema/regions";
import { offerTypes } from "@nodezao/db/schema/offer-types";
import { niches } from "@nodezao/db/schema/niches";
import { eq, and, or, like, desc, lte, sql, arrayOverlaps } from "drizzle-orm";
import { db } from "@nodezao/db";
import {
	createOfferInput,
	updateOfferInput,
	deleteOfferInput,
	getOfferByIdInput,
	filterOffersInput,
} from "../validators/offer";
import { z } from "zod";

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
			if (input.isActive !== undefined) {
				conditions.push(eq(offers.isActive, input.isActive));
			}
			if (input.search) {
				conditions.push(
					or(
						like(offers.name, `%${input.search}%`),
						like(offers.pageName, `%${input.search}%`),
					),
				);
			}
			// Array filters for tags and badges (contains any using overlap operator)
			if (input.tags && input.tags.length > 0) {
				conditions.push(arrayOverlaps(offers.tags, input.tags));
			}
			if (input.badges && input.badges.length > 0) {
				conditions.push(arrayOverlaps(offers.badges, input.badges));
			}

			// Get total count for pagination
			const countResult = await db
				.select({ count: sql<number>`count(*)` })
				.from(offers)
				.where(and(...conditions));

			const total = Number(countResult[0]?.count || 0);

			// Get offers with latest snapshot data and labels
			const results = await db
				.select({
					id: offers.id,
					uuid: offers.uuid,
					name: offers.name,
					facebookUrl: offers.facebookUrl,
					pageName: offers.pageName,
					region: offers.region,
					regionLabel: regions.name,
					type: offers.type,
					typeLabel: offerTypes.label,
					niche: offers.niche,
					nicheLabel: niches.label,
					tags: offers.tags,
					badges: offers.badges,
					isActive: offers.isActive,
					createdAt: offers.createdAt,
					updatedAt: offers.updatedAt,
				})
				.from(offers)
				.leftJoin(regions, eq(offers.region, regions.code))
				.leftJoin(offerTypes, eq(offers.type, offerTypes.slug))
				.leftJoin(niches, eq(offers.niche, niches.slug))
				.where(and(...conditions))
				.orderBy(desc(offers.createdAt))
				.limit(input.limit)
				.offset(input.offset);

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
					facebookUrl: offers.facebookUrl,
					pageName: offers.pageName,
					region: offers.region,
					regionLabel: regions.name,
					type: offers.type,
					typeLabel: offerTypes.label,
					niche: offers.niche,
					nicheLabel: niches.label,
					tags: offers.tags,
					badges: offers.badges,
					isActive: offers.isActive,
					userId: offers.userId,
					createdAt: offers.createdAt,
					updatedAt: offers.updatedAt,
				})
				.from(offers)
				.leftJoin(regions, eq(offers.region, regions.code))
				.leftJoin(offerTypes, eq(offers.type, offerTypes.slug))
				.leftJoin(niches, eq(offers.niche, niches.slug))
				.where(
					and(
						eq(offers.uuid, input.uuid),
						eq(offers.userId, ctx.session.user.id),
					),
				)
				.limit(1);

			if (!offerResult || offerResult.length === 0) {
				throw new Error("Offer not found");
			}

			const offer = offerResult[0];

			// Get snapshots for this offer (using internal id)
			const snapshots = await db
				.select()
				.from(creativeSnapshots)
				.where(eq(creativeSnapshots.offerId, offer.id))
				.orderBy(desc(creativeSnapshots.scrapedAt))
				.limit(30);

			return {
				...offer,
				snapshots,
			};
		}),

	// Create new offer
	create: protectedProcedure
		.input(createOfferInput)
		.mutation(async ({ ctx, input }) => {
			const result = await db
				.insert(offers)
				.values({
					...input,
					userId: ctx.session.user.id,
					updatedAt: new Date(),
				})
				.returning();

			return result[0];
		}),

	// Update offer (user-scoped)
	update: protectedProcedure
		.input(updateOfferInput)
		.mutation(async ({ ctx, input }) => {
			const { uuid, ...data } = input;

			const result = await db
				.update(offers)
				.set({
					...data,
					updatedAt: new Date(),
				})
				.where(
					and(
						eq(offers.uuid, uuid),
						eq(offers.userId, ctx.session.user.id),
					),
				)
				.returning();

			if (!result || result.length === 0) {
				throw new Error("Offer not found or unauthorized");
			}

			return result[0];
		}),

	// Delete offer (user-scoped)
	delete: protectedProcedure
		.input(deleteOfferInput)
		.mutation(async ({ ctx, input }) => {
			const result = await db
				.delete(offers)
				.where(
					and(
						eq(offers.uuid, input.uuid),
						eq(offers.userId, ctx.session.user.id),
					),
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

		// Get latest snapshots for all offers
		let totalCreatives = 0;
		let mostActiveOffer: { name: string; count: number } | null = null;
		let lastScraped: Date | null = null;

		if (offerIds.length > 0) {
			const latestSnapshots = await db
				.select({
					offerId: creativeSnapshots.offerId,
					creativeCount: creativeSnapshots.creativeCount,
					scrapedAt: creativeSnapshots.scrapedAt,
				})
				.from(creativeSnapshots)
				.where(
					sql`${creativeSnapshots.offerId} IN (${sql.join(offerIds, sql`, `)})`,
				)
				.orderBy(desc(creativeSnapshots.scrapedAt));

			// Calculate total creatives and find most active
			const snapshotsByOffer = new Map<number, typeof latestSnapshots[0]>();
			for (const snapshot of latestSnapshots) {
				if (!snapshotsByOffer.has(snapshot.offerId)) {
					snapshotsByOffer.set(snapshot.offerId, snapshot);
					totalCreatives += snapshot.creativeCount;

					if (!lastScraped || snapshot.scrapedAt > lastScraped) {
						lastScraped = snapshot.scrapedAt;
					}
				}
			}

			// Find most active offer
			let maxCount = 0;
			let maxOfferId: number | null = null;
			for (const [offerId, snapshot] of snapshotsByOffer) {
				if (snapshot.creativeCount > maxCount) {
					maxCount = snapshot.creativeCount;
					maxOfferId = offerId;
				}
			}

			if (maxOfferId !== null) {
				const offer = userOffers.find((o) => o.id === maxOfferId);
				if (offer) {
					mostActiveOffer = {
						name: offer.name,
						count: maxCount,
					};
				}
			}

			// Get 24h deltas for trending calculation
			const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
			const yesterdaySnapshots = await db
				.select()
				.from(creativeSnapshots)
				.where(
					and(
						sql`${creativeSnapshots.offerId} IN (${sql.join(offerIds, sql`, `)})`,
						lte(creativeSnapshots.scrapedAt, yesterday),
					),
				)
				.orderBy(desc(creativeSnapshots.scrapedAt));

			// Calculate trending counts
			let trendingUp = 0;
			let trendingDown = 0;

			for (const offerId of offerIds) {
				const latest = latestSnapshots.find((s) => s.offerId === offerId);
				const old = yesterdaySnapshots.find((s) => s.offerId === offerId);

				if (latest && old) {
					const delta = latest.creativeCount - old.creativeCount;
					if (delta > 0) trendingUp++;
					else if (delta < 0) trendingDown++;
				}
			}

			// Calculate next scrape (hourly cron job at :00)
			const nextScrape = new Date();
			nextScrape.setMinutes(0, 0, 0);
			nextScrape.setHours(nextScrape.getHours() + 1);

			// Group by region
			const byRegion = userOffers.reduce(
				(acc, offer) => {
					acc[offer.region] = (acc[offer.region] || 0) + 1;
					return acc;
				},
				{} as Record<string, number>,
			);

			// Group by type
			const byType = userOffers.reduce(
				(acc, offer) => {
					acc[offer.type] = (acc[offer.type] || 0) + 1;
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

});
