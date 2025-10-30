import { pgTable, serial, text } from "drizzle-orm/pg-core";

export const niches = pgTable("niches", {
	id: serial("id").primaryKey(),
	slug: text("slug").notNull().unique(),
	label: text("label").notNull(),
});
