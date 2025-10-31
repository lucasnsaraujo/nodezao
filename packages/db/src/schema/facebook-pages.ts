import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const facebookPages = pgTable("facebook_pages", {
	id: serial("id").primaryKey(),
	url: text("url").notNull().unique(),
	pageName: text("page_name"),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at")
		.notNull()
		.defaultNow()
		.$onUpdate(() => new Date()),
});
