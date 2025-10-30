import { router, protectedProcedure, publicProcedure } from "../index";
import { regions } from "@nodezao/db/schema/regions";
import { offerTypes } from "@nodezao/db/schema/offer-types";
import { niches } from "@nodezao/db/schema/niches";
import { tags } from "@nodezao/db/schema/tags";
import { badges } from "@nodezao/db/schema/badges";
import { eq, desc, or } from "drizzle-orm";
import { db } from "@nodezao/db";
import {
	createRegionInput,
	updateRegionInput,
	deleteConfigInput,
	createOfferTypeInput,
	updateOfferTypeInput,
	createNicheInput,
	updateNicheInput,
	createTagInput,
	updateTagInput,
	createBadgeInput,
	updateBadgeInput,
} from "../validators/config";
import { slugify } from "../utils/slugify";

export const configRouter = router({
	// REGIONS
	regions: router({
		getAll: publicProcedure.query(async () => {
			return await db.select().from(regions).orderBy(regions.name);
		}),

		create: protectedProcedure
			.input(createRegionInput)
			.mutation(async ({ input }) => {
				// Generate slug from name if not provided
				const slug = input.slug || slugify(input.name);

				// Check for duplicates by name or slug
				const existing = await db
					.select()
					.from(regions)
					.where(or(eq(regions.name, input.name), eq(regions.slug, slug)))
					.limit(1);

				if (existing.length > 0) {
					throw new Error(
						existing[0].name === input.name
							? "A region with this name already exists"
							: "A region with this slug already exists",
					);
				}

				const result = await db
					.insert(regions)
					.values({ name: input.name, slug })
					.returning();

				return result[0];
			}),

		update: protectedProcedure
			.input(updateRegionInput)
			.mutation(async ({ input }) => {
				const { id, ...data } = input;

				const result = await db
					.update(regions)
					.set(data)
					.where(eq(regions.id, id))
					.returning();

				if (!result || result.length === 0) {
					throw new Error("Region not found");
				}

				return result[0];
			}),

		delete: protectedProcedure
			.input(deleteConfigInput)
			.mutation(async ({ input }) => {
				const result = await db
					.delete(regions)
					.where(eq(regions.id, input.id))
					.returning();

				if (!result || result.length === 0) {
					throw new Error("Region not found");
				}

				return result[0];
			}),
	}),

	// OFFER TYPES
	offerTypes: router({
		getAll: publicProcedure.query(async () => {
			return await db.select().from(offerTypes).orderBy(offerTypes.label);
		}),

		create: protectedProcedure
			.input(createOfferTypeInput)
			.mutation(async ({ input }) => {
				// Generate slug from label if not provided
				const slug = input.slug || slugify(input.label);

				// Check for duplicates by label or slug
				const existing = await db
					.select()
					.from(offerTypes)
					.where(
						or(eq(offerTypes.label, input.label), eq(offerTypes.slug, slug)),
					)
					.limit(1);

				if (existing.length > 0) {
					throw new Error(
						existing[0].label === input.label
							? "An offer type with this label already exists"
							: "An offer type with this slug already exists",
					);
				}

				const result = await db
					.insert(offerTypes)
					.values({ label: input.label, slug })
					.returning();

				return result[0];
			}),

		update: protectedProcedure
			.input(updateOfferTypeInput)
			.mutation(async ({ input }) => {
				const { id, ...data } = input;

				const result = await db
					.update(offerTypes)
					.set(data)
					.where(eq(offerTypes.id, id))
					.returning();

				if (!result || result.length === 0) {
					throw new Error("Offer type not found");
				}

				return result[0];
			}),

		delete: protectedProcedure
			.input(deleteConfigInput)
			.mutation(async ({ input }) => {
				const result = await db
					.delete(offerTypes)
					.where(eq(offerTypes.id, input.id))
					.returning();

				if (!result || result.length === 0) {
					throw new Error("Offer type not found");
				}

				return result[0];
			}),
	}),

	// NICHES
	niches: router({
		getAll: publicProcedure.query(async () => {
			return await db.select().from(niches).orderBy(niches.label);
		}),

		create: protectedProcedure
			.input(createNicheInput)
			.mutation(async ({ input }) => {
				// Generate slug from label if not provided
				const slug = input.slug || slugify(input.label);

				// Check for duplicates by label or slug
				const existing = await db
					.select()
					.from(niches)
					.where(or(eq(niches.label, input.label), eq(niches.slug, slug)))
					.limit(1);

				if (existing.length > 0) {
					throw new Error(
						existing[0].label === input.label
							? "A niche with this label already exists"
							: "A niche with this slug already exists",
					);
				}

				const result = await db
					.insert(niches)
					.values({ label: input.label, slug })
					.returning();

				return result[0];
			}),

		update: protectedProcedure
			.input(updateNicheInput)
			.mutation(async ({ input }) => {
				const { id, ...data } = input;

				const result = await db
					.update(niches)
					.set(data)
					.where(eq(niches.id, id))
					.returning();

				if (!result || result.length === 0) {
					throw new Error("Niche not found");
				}

				return result[0];
			}),

		delete: protectedProcedure
			.input(deleteConfigInput)
			.mutation(async ({ input }) => {
				const result = await db
					.delete(niches)
					.where(eq(niches.id, input.id))
					.returning();

				if (!result || result.length === 0) {
					throw new Error("Niche not found");
				}

				return result[0];
			}),
	}),

	// TAGS
	tags: router({
		getAll: publicProcedure.query(async () => {
			return await db.select().from(tags).orderBy(tags.name);
		}),

		create: protectedProcedure
			.input(createTagInput)
			.mutation(async ({ input }) => {
				// Check for duplicate name
				const existing = await db
					.select()
					.from(tags)
					.where(eq(tags.name, input.name))
					.limit(1);

				if (existing.length > 0) {
					throw new Error("A tag with this name already exists");
				}

				const result = await db.insert(tags).values(input).returning();

				return result[0];
			}),

		update: protectedProcedure
			.input(updateTagInput)
			.mutation(async ({ input }) => {
				const { id, ...data } = input;

				const result = await db
					.update(tags)
					.set(data)
					.where(eq(tags.id, id))
					.returning();

				if (!result || result.length === 0) {
					throw new Error("Tag not found");
				}

				return result[0];
			}),

		delete: protectedProcedure
			.input(deleteConfigInput)
			.mutation(async ({ input }) => {
				const result = await db
					.delete(tags)
					.where(eq(tags.id, input.id))
					.returning();

				if (!result || result.length === 0) {
					throw new Error("Tag not found");
				}

				return result[0];
			}),
	}),

	// BADGES
	badges: router({
		getAll: publicProcedure.query(async () => {
			return await db.select().from(badges).orderBy(badges.name);
		}),

		create: protectedProcedure
			.input(createBadgeInput)
			.mutation(async ({ input }) => {
				// Check for duplicate name
				const existing = await db
					.select()
					.from(badges)
					.where(eq(badges.name, input.name))
					.limit(1);

				if (existing.length > 0) {
					throw new Error("A badge with this name already exists");
				}

				const result = await db.insert(badges).values(input).returning();

				return result[0];
			}),

		update: protectedProcedure
			.input(updateBadgeInput)
			.mutation(async ({ input }) => {
				const { id, ...data } = input;

				const result = await db
					.update(badges)
					.set(data)
					.where(eq(badges.id, id))
					.returning();

				if (!result || result.length === 0) {
					throw new Error("Badge not found");
				}

				return result[0];
			}),

		delete: protectedProcedure
			.input(deleteConfigInput)
			.mutation(async ({ input }) => {
				const result = await db
					.delete(badges)
					.where(eq(badges.id, input.id))
					.returning();

				if (!result || result.length === 0) {
					throw new Error("Badge not found");
				}

				return result[0];
			}),
	}),
});
