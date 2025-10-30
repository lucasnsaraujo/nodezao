import { z } from "zod";

export const getSnapshotsByOfferIdInput = z.object({
	offerId: z.number(),
	limit: z.number().min(1).max(100).optional().default(30),
	startDate: z.string().datetime().optional(),
	endDate: z.string().datetime().optional(),
});

export const createSnapshotInput = z.object({
	offerId: z.number(),
	creativeCount: z.number().min(0),
});

export type GetSnapshotsByOfferIdInput = z.infer<
	typeof getSnapshotsByOfferIdInput
>;
export type CreateSnapshotInput = z.infer<typeof createSnapshotInput>;
