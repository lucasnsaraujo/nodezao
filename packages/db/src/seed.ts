import 'dotenv/config'

// Check if DATABASE_URL is set
if (!process.env.DATABASE_URL) {
	console.error("❌ DATABASE_URL not found!");
	console.error("📝 Make sure you have a .env file in apps/server/ with:");
	console.error("   DATABASE_URL=your_neon_connection_string");
	process.exit(1);
}

import { db } from "./index";

async function seed() {
	console.log("🌱 Seeding database...");

	try {
		console.log("ℹ️  No global data to seed. User-specific defaults are initialized on signup via better-auth hooks.");
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
