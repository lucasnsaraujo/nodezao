import { pgTable, serial, text } from "drizzle-orm/pg-core";

export const regions = pgTable("regions", {
	id: serial("id").primaryKey(),
	slug: text("slug").notNull().unique(),
	name: text("name").notNull(),
});
