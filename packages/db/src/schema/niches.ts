import { boolean, pgTable, serial, text, unique } from "drizzle-orm/pg-core";
import { user } from "./auth";

export const niches = pgTable(
	"niches",
	{
		id: serial("id").primaryKey(),
		slug: text("slug").notNull(),
		label: text("label").notNull(),
		isActive: boolean("is_active").notNull().default(true),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
	},
	(table) => [unique().on(table.userId, table.slug)]
);
