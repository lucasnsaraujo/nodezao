import { z } from "zod";

// Facebook Ad Library URL validation
const facebookAdLibraryUrlRegex =
	/^https?:\/\/(www\.)?facebook\.com\/ads\/library\/?\?/i;

export const createOfferInput = z.object({
	facebookUrl: z
		.string()
		.url("Must be a valid URL")
		.regex(
			facebookAdLibraryUrlRegex,
			"Must be a Facebook Ad Library URL (facebook.com/ads/library/)",
		),
	name: z.string().min(1).max(255).optional(),
	pageName: z.string().optional(),
	region: z.string().optional(),
	type: z.string().optional(),
	niche: z.string().optional(),
	tags: z.array(z.string()).optional().default([]),
	badges: z.array(z.string()).optional().default([]),
	isActive: z.boolean().optional().default(true),
});

export const updateOfferInput = z.object({
	uuid: z.string().uuid(),
	name: z.string().min(1).max(255).optional(),
	facebookUrl: z
		.string()
		.url()
		.regex(facebookAdLibraryUrlRegex)
		.optional(),
	pageName: z.string().optional(),
	region: z.string().optional(),
	type: z.string().optional(),
	niche: z.string().optional(),
	tags: z.array(z.string()).optional(),
	badges: z.array(z.string()).optional(),
	isActive: z.boolean().optional(),
});

export const deleteOfferInput = z.object({
	uuid: z.string().uuid(),
});

export const getOfferByIdInput = z.object({
	uuid: z.string().uuid(),
});

export const filterOffersInput = z.object({
	region: z.string().optional(),
	type: z.string().optional(),
	niche: z.string().optional(),
	tags: z.array(z.string()).optional(),
	badges: z.array(z.string()).optional(),
	isActive: z.boolean().optional(),
	search: z.string().optional(),
	limit: z.number().min(1).max(100).optional().default(10),
	offset: z.number().min(0).optional().default(0),
});

export type CreateOfferInput = z.infer<typeof createOfferInput>;
export type UpdateOfferInput = z.infer<typeof updateOfferInput>;
export type DeleteOfferInput = z.infer<typeof deleteOfferInput>;
export type GetOfferByIdInput = z.infer<typeof getOfferByIdInput>;
export type FilterOffersInput = z.infer<typeof filterOffersInput>;
