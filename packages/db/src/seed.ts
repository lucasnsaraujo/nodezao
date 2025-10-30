import 'dotenv/config'

// Check if DATABASE_URL is set
if (!process.env.DATABASE_URL) {
	console.error("❌ DATABASE_URL not found!");
	console.error("📝 Make sure you have a .env file in apps/server/ with:");
	console.error("   DATABASE_URL=your_neon_connection_string");
	process.exit(1);
}

import { db } from "./index";
import { regions } from "./schema/regions";
import { offerTypes } from "./schema/offer-types";
import { niches } from "./schema/niches";
import { tags } from "./schema/tags";
import { badges } from "./schema/badges";
import { user, account } from "./schema/auth";
import { eq } from "drizzle-orm";

async function seed() {
	console.log("🌱 Seeding database...");

	try {
		// Seed Regions (idempotent)
		console.log("📍 Seeding regions...");
		const regionData = [
			{ slug: "us", name: "Estados Unidos" },
			{ slug: "br", name: "Brasil" },
			{ slug: "uk", name: "Reino Unido" },
			{ slug: "eu", name: "Europa" },
			{ slug: "latam", name: "América Latina" },
			{ slug: "asia", name: "Ásia" },
		];

		for (const region of regionData) {
			const existing = await db.select().from(regions).where(eq(regions.slug, region.slug)).limit(1);
			if (existing.length === 0) {
				await db.insert(regions).values(region);
				console.log(`   ✓ Created region: ${region.name}`);
			} else {
				console.log(`   ⊙ Region already exists: ${region.name}`);
			}
		}

		// Seed Offer Types (idempotent)
		console.log("🏷️  Seeding offer types...");
		const offerTypeData = [
			{ slug: "ecommerce", label: "E-commerce" },
			{ slug: "info-product", label: "Infoproduto" },
			{ slug: "service", label: "Serviço" },
			{ slug: "software", label: "Software/SaaS" },
			{ slug: "physical-product", label: "Produto Físico" },
		];

		for (const offerType of offerTypeData) {
			const existing = await db.select().from(offerTypes).where(eq(offerTypes.slug, offerType.slug)).limit(1);
			if (existing.length === 0) {
				await db.insert(offerTypes).values(offerType);
				console.log(`   ✓ Created offer type: ${offerType.label}`);
			} else {
				console.log(`   ⊙ Offer type already exists: ${offerType.label}`);
			}
		}

		// Seed Niches (idempotent)
		console.log("🎯 Seeding niches...");
		const nicheData = [
			{ slug: "health", label: "Saúde" },
			{ slug: "fitness", label: "Fitness" },
			{ slug: "weight-loss", label: "Emagrecimento" },
			{ slug: "finance", label: "Finanças" },
			{ slug: "business", label: "Negócios" },
			{ slug: "education", label: "Educação" },
			{ slug: "technology", label: "Tecnologia" },
			{ slug: "beauty", label: "Beleza" },
			{ slug: "relationship", label: "Relacionamento" },
			{ slug: "spirituality", label: "Espiritualidade" },
		];

		for (const niche of nicheData) {
			const existing = await db.select().from(niches).where(eq(niches.slug, niche.slug)).limit(1);
			if (existing.length === 0) {
				await db.insert(niches).values(niche);
				console.log(`   ✓ Created niche: ${niche.label}`);
			} else {
				console.log(`   ⊙ Niche already exists: ${niche.label}`);
			}
		}

		// Seed Tags (idempotent)
		console.log("🏷️  Seeding tags...");
		const tagData = [
			{ name: "top", color: "#FACC15" },
			{ name: "nova", color: "#60A5FA" },
			{ name: "testando", color: "#A78BFA" },
			{ name: "blackfriday", color: "#EF4444" },
			{ name: "q4", color: "#34D399" },
		];

		for (const tag of tagData) {
			const existing = await db.select().from(tags).where(eq(tags.name, tag.name)).limit(1);
			if (existing.length === 0) {
				await db.insert(tags).values(tag);
				console.log(`   ✓ Created tag: ${tag.name}`);
			} else {
				console.log(`   ⊙ Tag already exists: ${tag.name}`);
			}
		}

		// Seed Badges (idempotent)
		console.log("🎖️  Seeding badges...");
		const badgeData = [
			{ name: "Escalando", icon: "🔥", color: "#EF4444" },
			{ name: "Morrendo", icon: "💀", color: "#6B7280" },
			{ name: "Testando", icon: "🧪", color: "#8B5CF6" },
			{ name: "Vencedor", icon: "🏆", color: "#FACC15" },
			{ name: "Sazonal", icon: "🎄", color: "#10B981" },
		];

		for (const badge of badgeData) {
			const existing = await db.select().from(badges).where(eq(badges.name, badge.name)).limit(1);
			if (existing.length === 0) {
				await db.insert(badges).values(badge);
				console.log(`   ✓ Created badge: ${badge.name}`);
			} else {
				console.log(`   ⊙ Badge already exists: ${badge.name}`);
			}
		}

		// Seed Admin User (idempotent)
		console.log("👤 Creating admin user...");
		const adminEmail = "lucas@admin.com";
		const existingUser = await db.select().from(user).where(eq(user.email, adminEmail)).limit(1);

		if (existingUser.length === 0) {
			const adminUserId = crypto.randomUUID();
			const adminAccountId = crypto.randomUUID();
			const now = new Date();

			// Create admin user
			await db.insert(user).values({
				id: adminUserId,
				name: "Lucas",
				email: adminEmail,
				emailVerified: true,
				image: null,
				createdAt: now,
				updatedAt: now,
			});

			// Create admin account with password (plain text - Better Auth will handle hashing)
			await db.insert(account).values({
				id: adminAccountId,
				accountId: adminUserId,
				providerId: "credential",
				userId: adminUserId,
				password: "nascimento",
				accessToken: null,
				refreshToken: null,
				idToken: null,
				accessTokenExpiresAt: null,
				refreshTokenExpiresAt: null,
				scope: null,
				createdAt: now,
				updatedAt: now,
			});

			console.log("   ✓ Admin user created: lucas@admin.com / nascimento");
		} else {
			console.log("   ⊙ Admin user already exists: lucas@admin.com");
		}

		console.log("✅ Database seeded successfully!");
	} catch (error) {
		console.error("❌ Error seeding database:", error);
		throw error;
	}
}

seed()
	.then(() => {
		console.log("🎉 Seed complete");
		process.exit(0);
	})
	.catch((error) => {
		console.error("💥 Seed failed:", error);
		process.exit(1);
	});
