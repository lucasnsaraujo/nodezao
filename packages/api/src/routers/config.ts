import { router, protectedProcedure } from "../index";
import { regions } from "@nodezao/db/schema/regions";
import { offerTypes } from "@nodezao/db/schema/offer-types";
import { niches } from "@nodezao/db/schema/niches";
import { strategies } from "@nodezao/db/schema/strategies";
import { badges } from "@nodezao/db/schema/badges";
import { eq, and, or } from "drizzle-orm";
import { db } from "@nodezao/db";
import {
	createRegionInput,
	updateRegionInput,
	deleteConfigInput,
	createOfferTypeInput,
	updateOfferTypeInput,
	createNicheInput,
	updateNicheInput,
	createStrategyInput,
	updateStrategyInput,
	createBadgeInput,
	updateBadgeInput,
} from "../validators/config";
import { slugify } from "../utils/slugify";

export const configRouter = router({
	// REGIONS
	regions: router({
		getAll: protectedProcedure.query(async ({ ctx }) => {
			return await db
				.select()
				.from(regions)
				.where(eq(regions.userId, ctx.session.user.id))
				.orderBy(regions.name);
		}),

		create: protectedProcedure
			.input(createRegionInput)
			.mutation(async ({ input, ctx }) => {
				// Generate slug from name if not provided
				const slug = input.slug || slugify(input.name);

				// Check for duplicates by name or slug for this user
				const existing = await db
					.select()
					.from(regions)
					.where(
						and(
							eq(regions.userId, ctx.session.user.id),
							or(eq(regions.name, input.name), eq(regions.slug, slug))
						)
					)
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
					.values({ name: input.name, slug, userId: ctx.session.user.id })
					.returning();

				return result[0];
			}),

		update: protectedProcedure
			.input(updateRegionInput)
			.mutation(async ({ input, ctx }) => {
				const { id, ...data } = input;

				const result = await db
					.update(regions)
					.set(data)
					.where(and(eq(regions.id, id), eq(regions.userId, ctx.session.user.id)))
					.returning();

				if (!result || result.length === 0) {
					throw new Error("Region not found");
				}

				return result[0];
			}),

		delete: protectedProcedure
			.input(deleteConfigInput)
			.mutation(async ({ input, ctx }) => {
				const result = await db
					.delete(regions)
					.where(and(eq(regions.id, input.id), eq(regions.userId, ctx.session.user.id)))
					.returning();

				if (!result || result.length === 0) {
					throw new Error("Region not found");
				}

				return result[0];
			}),
	}),

	// OFFER TYPES
	offerTypes: router({
		getAll: protectedProcedure.query(async ({ ctx }) => {
			return await db
				.select()
				.from(offerTypes)
				.where(eq(offerTypes.userId, ctx.session.user.id))
				.orderBy(offerTypes.label);
		}),

		create: protectedProcedure
			.input(createOfferTypeInput)
			.mutation(async ({ input, ctx }) => {
				// Generate slug from label if not provided
				const slug = input.slug || slugify(input.label);

				// Check for duplicates by label or slug for this user
				const existing = await db
					.select()
					.from(offerTypes)
					.where(
						and(
							eq(offerTypes.userId, ctx.session.user.id),
							or(eq(offerTypes.label, input.label), eq(offerTypes.slug, slug))
						)
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
					.values({ label: input.label, slug, userId: ctx.session.user.id })
					.returning();

				return result[0];
			}),

		update: protectedProcedure
			.input(updateOfferTypeInput)
			.mutation(async ({ input, ctx }) => {
				const { id, ...data } = input;

				const result = await db
					.update(offerTypes)
					.set(data)
					.where(and(eq(offerTypes.id, id), eq(offerTypes.userId, ctx.session.user.id)))
					.returning();

				if (!result || result.length === 0) {
					throw new Error("Offer type not found");
				}

				return result[0];
			}),

		delete: protectedProcedure
			.input(deleteConfigInput)
			.mutation(async ({ input, ctx }) => {
				const result = await db
					.delete(offerTypes)
					.where(and(eq(offerTypes.id, input.id), eq(offerTypes.userId, ctx.session.user.id)))
					.returning();

				if (!result || result.length === 0) {
					throw new Error("Offer type not found");
				}

				return result[0];
			}),
	}),

	// NICHES
	niches: router({
		getAll: protectedProcedure.query(async ({ ctx }) => {
			return await db
				.select()
				.from(niches)
				.where(eq(niches.userId, ctx.session.user.id))
				.orderBy(niches.label);
		}),

		create: protectedProcedure
			.input(createNicheInput)
			.mutation(async ({ input, ctx }) => {
				// Generate slug from label if not provided
				const slug = input.slug || slugify(input.label);

				// Check for duplicates by label or slug for this user
				const existing = await db
					.select()
					.from(niches)
					.where(
						and(
							eq(niches.userId, ctx.session.user.id),
							or(eq(niches.label, input.label), eq(niches.slug, slug))
						)
					)
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
					.values({ label: input.label, slug, userId: ctx.session.user.id })
					.returning();

				return result[0];
			}),

		update: protectedProcedure
			.input(updateNicheInput)
			.mutation(async ({ input, ctx }) => {
				const { id, ...data } = input;

				const result = await db
					.update(niches)
					.set(data)
					.where(and(eq(niches.id, id), eq(niches.userId, ctx.session.user.id)))
					.returning();

				if (!result || result.length === 0) {
					throw new Error("Niche not found");
				}

				return result[0];
			}),

		delete: protectedProcedure
			.input(deleteConfigInput)
			.mutation(async ({ input, ctx }) => {
				const result = await db
					.delete(niches)
					.where(and(eq(niches.id, input.id), eq(niches.userId, ctx.session.user.id)))
					.returning();

				if (!result || result.length === 0) {
					throw new Error("Niche not found");
				}

				return result[0];
			}),
	}),

	// STRATEGIES
	strategies: router({
		getAll: protectedProcedure.query(async ({ ctx }) => {
			return await db
				.select()
				.from(strategies)
				.where(eq(strategies.userId, ctx.session.user.id))
				.orderBy(strategies.label);
		}),

		create: protectedProcedure
			.input(createStrategyInput)
			.mutation(async ({ input, ctx }) => {
				// Generate slug from label if not provided
				const slug = input.slug || slugify(input.label);

				// Check for duplicates by label or slug for this user
				const existing = await db
					.select()
					.from(strategies)
					.where(
						and(
							eq(strategies.userId, ctx.session.user.id),
							or(eq(strategies.label, input.label), eq(strategies.slug, slug))
						)
					)
					.limit(1);

				if (existing.length > 0) {
					throw new Error(
						existing[0].label === input.label
							? "A strategy with this label already exists"
							: "A strategy with this slug already exists",
					);
				}

				const result = await db
					.insert(strategies)
					.values({ label: input.label, slug, isActive: input.isActive ?? true, userId: ctx.session.user.id })
					.returning();

				return result[0];
			}),

		update: protectedProcedure
			.input(updateStrategyInput)
			.mutation(async ({ input, ctx }) => {
				const { id, ...data } = input;

				const result = await db
					.update(strategies)
					.set(data)
					.where(and(eq(strategies.id, id), eq(strategies.userId, ctx.session.user.id)))
					.returning();

				if (!result || result.length === 0) {
					throw new Error("Strategy not found");
				}

				return result[0];
			}),

		delete: protectedProcedure
			.input(deleteConfigInput)
			.mutation(async ({ input, ctx }) => {
				const result = await db
					.delete(strategies)
					.where(and(eq(strategies.id, input.id), eq(strategies.userId, ctx.session.user.id)))
					.returning();

				if (!result || result.length === 0) {
					throw new Error("Strategy not found");
				}

				return result[0];
			}),
	}),

	// BADGES
	badges: router({
		getAll: protectedProcedure.query(async ({ ctx }) => {
			return await db
				.select()
				.from(badges)
				.where(eq(badges.userId, ctx.session.user.id))
				.orderBy(badges.name);
		}),

		create: protectedProcedure
			.input(createBadgeInput)
			.mutation(async ({ input, ctx }) => {
				// Check for duplicate name for this user
				const existing = await db
					.select()
					.from(badges)
					.where(
						and(
							eq(badges.userId, ctx.session.user.id),
							eq(badges.name, input.name)
						)
					)
					.limit(1);

				if (existing.length > 0) {
					throw new Error("A badge with this name already exists");
				}

				const result = await db
					.insert(badges)
					.values({ ...input, userId: ctx.session.user.id })
					.returning();

				return result[0];
			}),

		update: protectedProcedure
			.input(updateBadgeInput)
			.mutation(async ({ input, ctx }) => {
				const { id, ...data } = input;

				const result = await db
					.update(badges)
					.set(data)
					.where(and(eq(badges.id, id), eq(badges.userId, ctx.session.user.id)))
					.returning();

				if (!result || result.length === 0) {
					throw new Error("Badge not found");
				}

				return result[0];
			}),

		delete: protectedProcedure
			.input(deleteConfigInput)
			.mutation(async ({ input, ctx }) => {
				const result = await db
					.delete(badges)
					.where(and(eq(badges.id, input.id), eq(badges.userId, ctx.session.user.id)))
					.returning();

				if (!result || result.length === 0) {
					throw new Error("Badge not found");
				}

				return result[0];
			}),
	}),

	// INITIALIZE DEFAULTS
	initializeDefaults: protectedProcedure.mutation(async ({ ctx }) => {
		const userId = ctx.session.user.id;

		// Default regions
		const regionData = [
			{ slug: "latam", name: "LATAM", userId },
			{ slug: "eua", name: "EUA", userId },
			{ slug: "br", name: "Brasil", userId },
			{ slug: "eu", name: "Europa", userId },
		];

		// Default badges
		const badgeData = [
			{ name: "Escalando", icon: "🔥", color: "#EF4444", userId },
			{ name: "Morrendo", icon: "💀", color: "#6B7280", userId },
			{ name: "Testando", icon: "🧪", color: "#8B5CF6", userId },
			{ name: "Vencedor", icon: "🏆", color: "#FACC15", userId },
			{ name: "Sazonal", icon: "🎄", color: "#10B981", userId },
		];

		// Default niches
		const nicheData = [
			{ slug: "health", label: "Saúde", userId },
			{ slug: "fitness", label: "Fitness", userId },
			{ slug: "weight-loss", label: "Emagrecimento", userId },
			{ slug: "finance", label: "Finanças", userId },
			{ slug: "business", label: "Negócios", userId },
			{ slug: "education", label: "Educação", userId },
			{ slug: "technology", label: "Tecnologia", userId },
			{ slug: "beauty", label: "Beleza", userId },
			{ slug: "relationship", label: "Relacionamento", userId },
			{ slug: "spirituality", label: "Espiritualidade", userId },
		];

		// Default offer types
		const offerTypeData = [
			{ slug: "ecommerce", label: "E-commerce", userId },
			{ slug: "info-product", label: "Infoproduto", userId },
			{ slug: "service", label: "Serviço", userId },
			{ slug: "software", label: "Software/SaaS", userId },
			{ slug: "physical-product", label: "Produto Físico", userId },
		];

		// Insert all defaults
		await Promise.all([
			db.insert(regions).values(regionData),
			db.insert(badges).values(badgeData),
			db.insert(niches).values(nicheData),
			db.insert(offerTypes).values(offerTypeData),
		]);

		return { success: true };
	}),
});
