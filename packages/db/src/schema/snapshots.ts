import { pgTable, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { offers } from "./offers";

export const creativeSnapshots = pgTable("creative_snapshots", {
	id: serial("id").primaryKey(),
	offerId: integer("offer_id")
		.notNull()
		.references(() => offers.id, { onDelete: "cascade" }),
	creativeCount: integer("creative_count").notNull(),
	scrapedAt: timestamp("scraped_at").defaultNow().notNull(),
});
