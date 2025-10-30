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
				.limit(input.limit || 30);

			return snapshots;
		}),

	// Get latest snapshot for each offer (for dashboard)
	getLatest: protectedProcedure.query(async ({ ctx }) => {
		// Get user's offers
		const userOffers = await db
			.select()
			.from(offers)
			.where(eq(offers.userId, ctx.session.user.id));

		if (!userOffers || userOffers.length === 0) {
			return [];
		}

		// Get latest snapshot for each offer using subquery
		const latestSnapshots = await db
			.select({
				offerId: creativeSnapshots.offerId,
				creativeCount: creativeSnapshots.creativeCount,
				scrapedAt: creativeSnapshots.scrapedAt,
			})
			.from(creativeSnapshots)
			.where(
				sql`${creativeSnapshots.offerId} IN (${sql.join(userOffers.map((o) => o.id), sql`, `)})
				AND ${creativeSnapshots.scrapedAt} IN (
					SELECT MAX(${creativeSnapshots.scrapedAt})
					FROM ${creativeSnapshots}
					WHERE ${creativeSnapshots.offerId} = ${creativeSnapshots.offerId}
				)`,
			);

		return latestSnapshots;
	}),

	// Manually create snapshot (for testing or manual trigger)
	create: publicProcedure
		.input(createSnapshotInput)
		.mutation(async ({ input }) => {
			const result = await db
				.insert(creativeSnapshots)
				.values({
					offerId: input.offerId,
					creativeCount: input.creativeCount,
					scrapedAt: new Date(),
				})
				.returning();

			return result[0];
		}),

	// Get 24h delta for offers
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
			.select()
			.from(creativeSnapshots)
			.where(
				sql`${creativeSnapshots.offerId} IN (${sql.join(offerIds, sql`, `)})`,
			)
			.orderBy(desc(creativeSnapshots.scrapedAt));

		// Get snapshots from ~24h ago
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

		// Calculate delta for each offer
		const deltas = offerIds.map((offerId) => {
			const latest = latestSnapshots.find((s) => s.offerId === offerId);
			const old = yesterdaySnapshots.find((s) => s.offerId === offerId);

			return {
				offerId,
				current: latest?.creativeCount || 0,
				previous: old?.creativeCount || 0,
				delta: (latest?.creativeCount || 0) - (old?.creativeCount || 0),
			};
		});

		return deltas;
	}),
});
