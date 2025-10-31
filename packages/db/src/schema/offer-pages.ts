import {
	boolean,
	integer,
	pgTable,
	serial,
	timestamp,
	unique,
} from "drizzle-orm/pg-core";
import { facebookPages } from "./facebook-pages";
import { offers } from "./offers";

export const offerPages = pgTable(
	"offer_pages",
	{
		id: serial("id").primaryKey(),
		offerId: integer("offer_id")
			.notNull()
			.references(() => offers.id, { onDelete: "cascade" }),
		pageId: integer("page_id")
			.notNull()
			.references(() => facebookPages.id, { onDelete: "cascade" }),
		isPrimary: boolean("is_primary").notNull().default(false),
		createdAt: timestamp("created_at").notNull().defaultNow(),
	},
	(table) => {
		return {
			offerPageUnique: unique().on(table.offerId, table.pageId),
		};
	},
);
