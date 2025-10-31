import { betterAuth, type BetterAuthOptions } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { createAuthMiddleware } from "better-auth/api";
import { db } from "@nodezao/db";
import * as schema from "@nodezao/db/schema/auth";
import { regions } from "@nodezao/db/schema/regions";
import { badges } from "@nodezao/db/schema/badges";
import { niches } from "@nodezao/db/schema/niches";
import { offerTypes } from "@nodezao/db/schema/offer-types";
import { strategies } from "@nodezao/db/schema/strategies";

export const auth = betterAuth<BetterAuthOptions>({
	database: drizzleAdapter(db, {
		provider: "pg",

		schema: schema,
	}),
	trustedOrigins: [process.env.CORS_ORIGIN || ""],
	emailAndPassword: {
		enabled: true,
	},
	advanced: {
		defaultCookieAttributes: {
			sameSite: "none",
			secure: true,
			httpOnly: true,
		},
	},
	hooks: {
		after: createAuthMiddleware(async (ctx) => {
			if (ctx.path === "/sign-up/email") {
				const newSession = ctx.context.newSession;
				const userId = newSession?.user?.id;

				if (!userId) return;

				// Initialize default data for new user
				const regionData = [
					{ slug: "latam", name: "LATAM", userId },
					{ slug: "eua", name: "EUA", userId },
					{ slug: "br", name: "Brasil", userId },
					{ slug: "eu", name: "Europa", userId },
				];

				const badgeData = [
					{ slug: "escalando", name: "Escalando", icon: "🔥", color: "#EF4444", userId },
					{ slug: "morrendo", name: "Morrendo", icon: "💀", color: "#6B7280", userId },
					{ slug: "testando", name: "Testando", icon: "🧪", color: "#8B5CF6", userId },
					{ slug: "vencedor", name: "Vencedor", icon: "🏆", color: "#FACC15", userId },
					{ slug: "sazonal", name: "Sazonal", icon: "🎄", color: "#10B981", userId },
				];

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

				const offerTypeData = [
					{ slug: "ecommerce", label: "E-commerce", userId },
					{ slug: "info-product", label: "Infoproduto", userId },
					{ slug: "service", label: "Serviço", userId },
					{ slug: "software", label: "Software/SaaS", userId },
					{ slug: "physical-product", label: "Produto Físico", userId },
				];

				const strategyData = [
					{ slug: "vsl", label: "VSL", userId },
					{ slug: "mini-vsl", label: "Mini VSL", userId },
					{ slug: "quiz", label: "Quiz", userId },
					{ slug: "quiz-mini-vsl", label: "Quiz + Mini VSL", userId },
					{ slug: "advertorial", label: "Advertorial", userId },
					{ slug: "landing-page", label: "Landing Page", userId },
				];

				try {
					await Promise.all([
						db.insert(regions).values(regionData),
						db.insert(badges).values(badgeData),
						db.insert(niches).values(nicheData),
						db.insert(offerTypes).values(offerTypeData),
						db.insert(strategies).values(strategyData),
					]);
					console.log(`✅ Initialized defaults for user: ${userId}`);
				} catch (error) {
					console.error("Error initializing user defaults:", error);
				}
			}
		}),
	},
});
