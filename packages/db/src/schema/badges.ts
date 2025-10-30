import { pgTable, serial, text } from "drizzle-orm/pg-core";

export const badges = pgTable("badges", {
	id: serial("id").primaryKey(),
	name: text("name").notNull().unique(),
	icon: text("icon"),
	color: text("color"),
});
