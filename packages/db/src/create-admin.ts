import 'dotenv/config'

// Check if DATABASE_URL is set
if (!process.env.DATABASE_URL) {
	console.error("❌ DATABASE_URL not found!");
	console.error("📝 Make sure you have a .env file in apps/server/ with:");
	console.error("   DATABASE_URL=your_neon_connection_string");
	process.exit(1);
}

import { db } from "./index";
import { user } from "./schema/auth";
import { eq } from "drizzle-orm";

async function createAdmin() {
	console.log("👤 Creating admin user via Better Auth...");

	const adminEmail = "lucas@admin.com";
	const adminPassword = "nascimento";

	// Check if user already exists
	const existingUser = await db.select().from(user).where(eq(user.email, adminEmail)).limit(1);

	if (existingUser.length > 0) {
		console.log("⚠️  Admin user already exists!");
		console.log("To recreate, first delete via Drizzle Studio or run:");
		console.log(`DELETE FROM account WHERE user_id = '${existingUser[0].id}';`);
		console.log(`DELETE FROM "user" WHERE email = '${adminEmail}';`);
		process.exit(1);
	}

	// Use Better Auth API via HTTP request
	console.log("📡 Calling Better Auth signup API...");

	const betterAuthUrl = process.env.BETTER_AUTH_URL || "http://localhost:3000/api/auth";

	try {
		const response = await fetch(`${betterAuthUrl}/sign-up/email`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				email: adminEmail,
				password: adminPassword,
				name: "Lucas",
			}),
		});

		const responseText = await response.text();
		console.log("Response status:", response.status);
		console.log("Response body:", responseText);

		if (!response.ok) {
			throw new Error(`Failed to create user: ${response.status} - ${responseText}`);
		}

		const result = JSON.parse(responseText);
		console.log("✅ Admin user created successfully!");
		console.log("📧 Email:", adminEmail);
		console.log("🔑 Password:", adminPassword);
		console.log("👤 User ID:", result.user?.id);
	} catch (error) {
		console.error("❌ Error creating admin user:", error);
		console.log("\n💡 Troubleshooting:");
		console.log("1. Make sure the server is running (pnpm dev:server)");
		console.log("2. Check if Better Auth is correctly configured");
		console.log("3. Verify DATABASE_URL and BETTER_AUTH_URL are set");
		process.exit(1);
	}
}

createAdmin()
	.then(() => {
		console.log("🎉 Complete");
		process.exit(0);
	})
	.catch((error) => {
		console.error("💥 Failed:", error);
		process.exit(1);
	});
