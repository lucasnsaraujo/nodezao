import { router, protectedProcedure, publicProcedure } from "../index";
import { creativeSnapshots } from "@nodezao/db/schema/snapshots";
import { offers } from "@nodezao/db/schema/offers";
import { eq, and, desc, gte, lte, sql } from "drizzle-orm";
import { db } from "@nodezao/db";
import {
	getSnapshotsByOfferIdInput,
	createSnapshotInput,
} from "../validators/snapshot";

export const snapshotRouter = router({
	// Get snapshots for a specific offer (user-scoped)
	getByOfferId: protectedProcedure
		.input(getSnapshotsByOfferIdInput)
		.query(async ({ ctx, input }) => {
			// Verify offer belongs to user
			const offer = await db
				.select()
				.from(offers)
				.where(
					and(
						eq(offers.id, input.offerId),
						eq(offers.userId, ctx.session.user.id),
					),
				)
				.limit(1);

			if (!offer || offer.length === 0) {
				throw new Error("Offer not found or unauthorized");
			}

			// Build query conditions
			const conditions = [eq(creativeSnapshots.offerId, input.offerId)];

			if (input.startDate) {
				conditions.push(gte(creativeSnapshots.scrapedAt, new Date(input.startDate)));
			}
			if (input.endDate) {
				conditions.push(lte(creativeSnapshots.scrapedAt, new Date(input.endDate)));
			}

			const snapshots = await db
				.select()
				.from(creativeSnapshots)
				.where(and(...conditions))
				.orderBy(desc(creativeSnapshots.scrapedAt))
				.limit(input.limit || 100);

			return snapshots;
		}),

	// Get latest snapshot for each offer (for dashboard) - aggregated by page
	getLatest: protectedProcedure.query(async ({ ctx }) => {
		// Get user's offers
		const userOffers = await db
			.select()
			.from(offers)
			.where(eq(offers.userId, ctx.session.user.id));

		if (!userOffers || userOffers.length === 0) {
			return [];
		}

		const offerIds = userOffers.map((o) => o.id);

		// Get latest snapshots for all pages
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

		// Aggregate by offer (sum pages)
		const aggregated = new Map<
			number,
			{
				offerId: number;
				creativeCount: number;
				scrapedAt: Date;
			}
		>();

		const processedPages = new Map<string, boolean>();

		for (const snapshot of latestSnapshots) {
			const key = `${snapshot.offerId}-${snapshot.pageId}`;
			if (!processedPages.has(key)) {
				processedPages.set(key, true);

				if (aggregated.has(snapshot.offerId)) {
					const existing = aggregated.get(snapshot.offerId)!;
					aggregated.set(snapshot.offerId, {
						offerId: snapshot.offerId,
						creativeCount: existing.creativeCount + snapshot.creativeCount,
						scrapedAt:
							snapshot.scrapedAt > existing.scrapedAt
								? snapshot.scrapedAt
								: existing.scrapedAt,
					});
				} else {
					aggregated.set(snapshot.offerId, {
						offerId: snapshot.offerId,
						creativeCount: snapshot.creativeCount,
						scrapedAt: snapshot.scrapedAt,
					});
				}
			}
		}

		return Array.from(aggregated.values());
	}),

	// Manually create snapshot (requires pageId)
	create: publicProcedure
		.input(createSnapshotInput)
		.mutation(async ({ input }) => {
			const result = await db
				.insert(creativeSnapshots)
				.values({
					offerId: input.offerId,
					pageId: input.pageId,
					creativeCount: input.creativeCount,
					scrapedAt: new Date(),
				})
				.returning();

			return result[0];
		}),

	// Get detailed deltas with temporal and historical variations
	getDetailedDeltas: protectedProcedure.query(async ({ ctx }) => {
		const userOffers = await db
			.select()
			.from(offers)
			.where(eq(offers.userId, ctx.session.user.id));

		if (!userOffers || userOffers.length === 0) {
			return [];
		}

		const offerIds = userOffers.map((o) => o.id);
		const now = new Date();
		const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
		const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
		const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
		const sixDaysAgo = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);

		// Get all snapshots from last 6 days
		const allSnapshots = await db
			.select({
				offerId: creativeSnapshots.offerId,
				pageId: creativeSnapshots.pageId,
				creativeCount: creativeSnapshots.creativeCount,
				scrapedAt: creativeSnapshots.scrapedAt,
			})
			.from(creativeSnapshots)
			.where(
				and(
					sql`${creativeSnapshots.offerId} IN (${sql.join(offerIds, sql`, `)})`,
					gte(creativeSnapshots.scrapedAt, sixDaysAgo),
				),
			)
			.orderBy(desc(creativeSnapshots.scrapedAt));

		// Helper to aggregate snapshots by offer for a time range
		const aggregateByTimeRange = (snapshots: typeof allSnapshots, startTime: Date, endTime: Date) => {
			const filtered = snapshots.filter(
				(s) => s.scrapedAt >= startTime && s.scrapedAt <= endTime
			);
			const byOffer = new Map<number, number>();
			const processedPages = new Set<string>();

			for (const snapshot of filtered) {
				const key = `${snapshot.offerId}-${snapshot.pageId}`;
				if (!processedPages.has(key)) {
					processedPages.add(key);
					const current = byOffer.get(snapshot.offerId) || 0;
					byOffer.set(snapshot.offerId, current + snapshot.creativeCount);
				}
			}
			return byOffer;
		};

		// Calculate for each offer
		const results = offerIds.map((offerId) => {
			// Current (latest)
			const latestByPage = new Map<number, number>();
			const processedLatest = new Set<string>();
			for (const snapshot of allSnapshots) {
				if (snapshot.offerId !== offerId) continue;
				const key = `${snapshot.offerId}-${snapshot.pageId}`;
				if (!processedLatest.has(key)) {
					processedLatest.add(key);
					latestByPage.set(snapshot.pageId!, snapshot.creativeCount);
				}
			}
			const current = Array.from(latestByPage.values()).reduce((sum, val) => sum + val, 0);

			// 24h ago
			const yesterday24h = aggregateByTimeRange(allSnapshots, twoDaysAgo, yesterday);
			const previous24h = yesterday24h.get(offerId) || 0;

			// 3 days ago
			const sixToThreeDaysAgo = aggregateByTimeRange(allSnapshots, sixDaysAgo, threeDaysAgo);
			const previous3d = sixToThreeDaysAgo.get(offerId) || 0;

			// Temporal variations (last 24h divided by period)
			const morningStart = new Date(yesterday);
			morningStart.setHours(0, 0, 0, 0);
			const morningEnd = new Date(yesterday);
			morningEnd.setHours(8, 0, 0, 0);

			const afternoonStart = new Date(yesterday);
			afternoonStart.setHours(8, 0, 0, 0);
			const afternoonEnd = new Date(yesterday);
			afternoonEnd.setHours(16, 0, 0, 0);

			const nightStart = new Date(yesterday);
			nightStart.setHours(16, 0, 0, 0);
			const nightEnd = new Date(yesterday);
			nightEnd.setHours(23, 59, 59, 999);

			// Get snapshots for each period (yesterday)
			const morningYesterday = aggregateByTimeRange(allSnapshots, morningStart, morningEnd);
			const afternoonYesterday = aggregateByTimeRange(allSnapshots, afternoonStart, afternoonEnd);
			const nightYesterday = aggregateByTimeRange(allSnapshots, nightStart, nightEnd);

			// Get snapshots for each period (2 days ago for comparison)
			const morningStart2d = new Date(twoDaysAgo);
			morningStart2d.setHours(0, 0, 0, 0);
			const morningEnd2d = new Date(twoDaysAgo);
			morningEnd2d.setHours(8, 0, 0, 0);

			const afternoonStart2d = new Date(twoDaysAgo);
			afternoonStart2d.setHours(8, 0, 0, 0);
			const afternoonEnd2d = new Date(twoDaysAgo);
			afternoonEnd2d.setHours(16, 0, 0, 0);

			const nightStart2d = new Date(twoDaysAgo);
			nightStart2d.setHours(16, 0, 0, 0);
			const nightEnd2d = new Date(twoDaysAgo);
			nightEnd2d.setHours(23, 59, 59, 999);

			const morning2d = aggregateByTimeRange(allSnapshots, morningStart2d, morningEnd2d);
			const afternoon2d = aggregateByTimeRange(allSnapshots, afternoonStart2d, afternoonEnd2d);
			const night2d = aggregateByTimeRange(allSnapshots, nightStart2d, nightEnd2d);

			return {
				offerId,
				current,
				delta24h: current - previous24h,
				delta3d: current - previous3d,
				morning: {
					current: morningYesterday.get(offerId) || 0,
					delta: (morningYesterday.get(offerId) || 0) - (morning2d.get(offerId) || 0),
				},
				afternoon: {
					current: afternoonYesterday.get(offerId) || 0,
					delta: (afternoonYesterday.get(offerId) || 0) - (afternoon2d.get(offerId) || 0),
				},
				night: {
					current: nightYesterday.get(offerId) || 0,
					delta: (nightYesterday.get(offerId) || 0) - (night2d.get(offerId) || 0),
				},
			};
		});

		return results;
	}),

	// Get 24h delta for offers - aggregated by offer
	getDelta: protectedProcedure.query(async ({ ctx }) => {
		// Get user's offers
		const userOffers = await db
			.select()
			.from(offers)
			.where(eq(offers.userId, ctx.session.user.id));

		if (!userOffers || userOffers.length === 0) {
			return [];
		}

		const offerIds = userOffers.map((o) => o.id);
		const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

		// Get latest snapshots
		const latestSnapshots = await db
			.select({
				offerId: creativeSnapshots.offerId,
				pageId: creativeSnapshots.pageId,
				creativeCount: creativeSnapshots.creativeCount,
			})
			.from(creativeSnapshots)
			.where(
				sql`${creativeSnapshots.offerId} IN (${sql.join(offerIds, sql`, `)})`,
			)
			.orderBy(desc(creativeSnapshots.scrapedAt));

		// Get snapshots from ~24h ago
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

		// Aggregate by offer
		const latestByOffer = new Map<number, number>();
		const yesterdayByOffer = new Map<number, number>();
		const processedLatestPages = new Map<string, boolean>();
		const processedYesterdayPages = new Map<string, boolean>();

		for (const snapshot of latestSnapshots) {
			const key = `${snapshot.offerId}-${snapshot.pageId}`;
			if (!processedLatestPages.has(key)) {
				processedLatestPages.set(key, true);
				const current = latestByOffer.get(snapshot.offerId) || 0;
				latestByOffer.set(snapshot.offerId, current + snapshot.creativeCount);
			}
		}

		for (const snapshot of yesterdaySnapshots) {
			const key = `${snapshot.offerId}-${snapshot.pageId}`;
			if (!processedYesterdayPages.has(key)) {
				processedYesterdayPages.set(key, true);
				const current = yesterdayByOffer.get(snapshot.offerId) || 0;
				yesterdayByOffer.set(snapshot.offerId, current + snapshot.creativeCount);
			}
		}

		// Calculate delta for each offer
		const deltas = offerIds.map((offerId) => {
			const current = latestByOffer.get(offerId) || 0;
			const previous = yesterdayByOffer.get(offerId) || 0;

			return {
				offerId,
				current,
				previous,
				delta: current - previous,
			};
		});

		return deltas;
	}),
});
