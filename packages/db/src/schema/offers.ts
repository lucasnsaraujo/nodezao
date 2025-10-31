import {
	pgTable,
	serial,
	text,
	boolean,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";
import { user } from "./auth";

export const offers = pgTable("offers", {
	id: serial("id").primaryKey(),
	uuid: uuid("uuid").defaultRandom().notNull().unique(),
	name: text("name"),
	facebookUrl: text("facebook_url").unique(), // Keeping temporarily for migration
	pageName: text("page_name"), // Keeping temporarily for migration
	region: text("region"),
	type: text("type"),
	niche: text("niche"),
	strategy: text("strategy"),
	landingPageUrl: text("landing_page_url"),
	description: text("description"),
	hasCloaker: boolean("has_cloaker").default(false).notNull(),
	badges: text("badges").array(),
	isActive: boolean("is_active").default(true).notNull(),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	lastScrapedAt: timestamp("last_scraped_at"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
