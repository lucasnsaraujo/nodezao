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
	facebookUrl: text("facebook_url").notNull().unique(),
	pageName: text("page_name"),
	region: text("region"),
	type: text("type"),
	niche: text("niche"),
	tags: text("tags").array(),
	badges: text("badges").array(),
	isActive: boolean("is_active").default(true).notNull(),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	lastScrapedAt: timestamp("last_scraped_at"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
