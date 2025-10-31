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
