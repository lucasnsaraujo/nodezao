import { pgTable, serial, text, unique } from "drizzle-orm/pg-core";
import { user } from "./auth";

export const badges = pgTable(
	"badges",
	{
		id: serial("id").primaryKey(),
		slug: text("slug").notNull(),
		name: text("name").notNull(),
		icon: text("icon"),
		color: text("color"),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
	},
	(table) => [unique().on(table.userId, table.slug)]
);
