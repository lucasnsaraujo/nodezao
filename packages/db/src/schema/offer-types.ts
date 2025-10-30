import { pgTable, serial, text } from "drizzle-orm/pg-core";

export const offerTypes = pgTable("offer_types", {
	id: serial("id").primaryKey(),
	slug: text("slug").notNull().unique(),
	label: text("label").notNull(),
});
