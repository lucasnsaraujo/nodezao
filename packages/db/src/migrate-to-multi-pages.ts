import { neon } from "@neondatabase/serverless";
import dotenv from "dotenv";
import path from "node:path";

// Load environment variables
dotenv.config({
	path: path.resolve(__dirname, "../../../apps/server/.env"),
});

const sql = neon(process.env.DATABASE_URL || "");

async function migrate() {
	console.log("🚀 Starting migration to multi-page architecture...\n");

	try {
		// Step 1: Get all existing offers with their facebook_url and page_name
		console.log("📊 Step 1: Fetching existing offers...");
		const offers = await sql`
			SELECT id, facebook_url, page_name
			FROM offers
			WHERE facebook_url IS NOT NULL
		`;
		console.log(`   Found ${offers.length} offers to migrate\n`);

		if (offers.length === 0) {
			console.log("✅ No offers to migrate. Schema is ready!\n");
			return;
		}

		// Step 2: For each offer, create a page and link it
		console.log("🔄 Step 2: Migrating offers to new structure...");

		for (const offer of offers) {
			console.log(`   Processing offer ${offer.id}...`);

			// Check if page already exists
			const existingPage = await sql`
				SELECT id FROM facebook_pages WHERE url = ${offer.facebook_url}
			`;

			let pageId: number;

			if (existingPage.length > 0) {
				// Page already exists, use it
				pageId = existingPage[0].id;
				console.log(`     ↪️  Reusing existing page ${pageId}`);
			} else {
				// Create new page
				const newPage = await sql`
					INSERT INTO facebook_pages (url, page_name)
					VALUES (${offer.facebook_url}, ${offer.page_name})
					RETURNING id
				`;
				pageId = newPage[0].id;
				console.log(`     ✨ Created new page ${pageId}`);
			}

			// Check if relationship already exists
			const existingRelation = await sql`
				SELECT id FROM offer_pages
				WHERE offer_id = ${offer.id} AND page_id = ${pageId}
			`;

			if (existingRelation.length === 0) {
				// Create offer-page relationship (mark as primary)
				await sql`
					INSERT INTO offer_pages (offer_id, page_id, is_primary)
					VALUES (${offer.id}, ${pageId}, true)
				`;
				console.log(`     🔗 Created offer-page relationship (primary)`);
			} else {
				console.log(`     ⏭️  Relationship already exists`);
			}

			// Update existing snapshots to reference the page
			const snapshotsUpdated = await sql`
				UPDATE creative_snapshots
				SET page_id = ${pageId}
				WHERE offer_id = ${offer.id} AND page_id IS NULL
			`;
			console.log(
				`     📸 Updated ${snapshotsUpdated.count || 0} snapshots\n`,
			);
		}

		console.log(
			"✅ Step 2 completed: All offers migrated to new structure\n",
		);

		// Step 3: Verify migration
		console.log("🔍 Step 3: Verifying migration...");

		const orphanedOffers = await sql`
			SELECT o.id, o.name
			FROM offers o
			LEFT JOIN offer_pages op ON o.id = op.offer_id
			WHERE op.id IS NULL
		`;

		if (orphanedOffers.length > 0) {
			console.warn(
				`   ⚠️  Warning: ${orphanedOffers.length} offers have no pages:`,
			);
			for (const offer of orphanedOffers) {
				console.warn(`      - Offer ${offer.id}: ${offer.name}`);
			}
			console.log();
		} else {
			console.log("   ✅ All offers have at least one page\n");
		}

		const orphanedSnapshots = await sql`
			SELECT COUNT(*) as count
			FROM creative_snapshots
			WHERE page_id IS NULL
		`;

		const orphanCount = Number(orphanedSnapshots[0].count);
		if (orphanCount > 0) {
			console.warn(
				`   ⚠️  Warning: ${orphanCount} snapshots have no page_id\n`,
			);
		} else {
			console.log("   ✅ All snapshots have a page_id\n");
		}

		// Step 4: Summary
		console.log("📈 Migration Summary:");
		const stats = await sql`
			SELECT
				(SELECT COUNT(*) FROM offers) as total_offers,
				(SELECT COUNT(*) FROM facebook_pages) as total_pages,
				(SELECT COUNT(*) FROM offer_pages) as total_relations,
				(SELECT COUNT(*) FROM creative_snapshots) as total_snapshots
		`;
		console.log(`   • Total offers: ${stats[0].total_offers}`);
		console.log(`   • Total pages: ${stats[0].total_pages}`);
		console.log(`   • Total relationships: ${stats[0].total_relations}`);
		console.log(`   • Total snapshots: ${stats[0].total_snapshots}\n`);

		console.log(
			"🎉 Migration completed successfully!\n",
		);
		console.log(
			"⚠️  IMPORTANT: You can now run 'pnpm db:push' to apply the final schema changes.",
		);
		console.log(
			"   This will remove the old facebook_url and page_name columns from the offers table.\n",
		);
	} catch (error) {
		console.error("❌ Migration failed:", error);
		process.exit(1);
	}
}

// Run migration
migrate()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error("Fatal error:", error);
		process.exit(1);
	});
