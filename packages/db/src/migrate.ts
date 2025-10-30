import dotenv from "dotenv";
import { sql } from "drizzle-orm";
import { neon, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import ws from "ws";

// Load environment variables
dotenv.config({
	path: "../../apps/server/.env",
});

// Setup neon connection
neonConfig.webSocketConstructor = ws;
const sqlClient = neon(process.env.DATABASE_URL || "");
const db = drizzle(sqlClient);

async function migrate() {
	console.log("Starting migration...");

	try {
		// Rename regions.code to regions.slug
		await db.execute(sql`ALTER TABLE regions RENAME COLUMN code TO slug`);
		console.log("✓ Renamed regions.code to regions.slug");

		// Drop is_active columns
		await db.execute(sql`ALTER TABLE regions DROP COLUMN IF EXISTS is_active`);
		console.log("✓ Dropped regions.is_active");

		await db.execute(sql`ALTER TABLE offer_types DROP COLUMN IF EXISTS is_active`);
		console.log("✓ Dropped offer_types.is_active");

		await db.execute(sql`ALTER TABLE niches DROP COLUMN IF EXISTS is_active`);
		console.log("✓ Dropped niches.is_active");

		// Make offers.name nullable
		await db.execute(sql`ALTER TABLE offers ALTER COLUMN name DROP NOT NULL`);
		console.log("✓ Made offers.name nullable");

		// Make offers.region nullable
		await db.execute(sql`ALTER TABLE offers ALTER COLUMN region DROP NOT NULL`);
		console.log("✓ Made offers.region nullable");

		// Make offers.type nullable
		await db.execute(sql`ALTER TABLE offers ALTER COLUMN type DROP NOT NULL`);
		console.log("✓ Made offers.type nullable");

		console.log("\nMigration completed successfully!");
	} catch (error) {
		console.error("Migration failed:", error);
		process.exit(1);
	}

	process.exit(0);
}

migrate();
