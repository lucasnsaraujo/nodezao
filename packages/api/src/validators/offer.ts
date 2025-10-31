import { z } from "zod";

// Facebook Ad Library URL validation
const facebookAdLibraryUrlRegex =
	/^https?:\/\/(www\.)?facebook\.com\/ads\/library\/?\?/i;

export const createOfferInput = z.object({
	facebookUrls: z
		.array(
			z
				.string()
				.url("Must be a valid URL")
				.regex(
					facebookAdLibraryUrlRegex,
					"Must be a Facebook Ad Library URL (facebook.com/ads/library/)",
				),
		)
		.min(1, "At least one Facebook URL is required")
		.max(10, "Maximum 10 Facebook pages per offer"),
	name: z.string().min(1).max(255).optional(),
	region: z.string().optional(),
	type: z.string().optional(),
	niche: z.string().optional(),
	strategy: z.string().optional(),
	landingPageUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
	description: z.string().max(1000, "Description must be at most 1000 characters").optional(),
	hasCloaker: z.boolean().optional().default(false),
	badges: z.array(z.string()).optional().default([]),
	isActive: z.boolean().optional().default(true),
});

export const updateOfferInput = z.object({
	uuid: z.string().uuid(),
	name: z.string().min(1).max(255).optional(),
	facebookUrls: z
		.array(
			z
				.string()
				.url("Must be a valid URL")
				.regex(
					facebookAdLibraryUrlRegex,
					"Must be a Facebook Ad Library URL",
				),
		)
		.min(1)
		.max(10)
		.optional(),
	region: z.string().optional(),
	type: z.string().optional(),
	niche: z.string().optional(),
	strategy: z.string().optional(),
	landingPageUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
	description: z.string().max(1000).optional(),
	hasCloaker: z.boolean().optional(),
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
	strategy: z.string().optional(),
	badges: z.array(z.string()).optional(),
	isActive: z.boolean().optional(),
	search: z.string().optional(),
	limit: z.number().min(1).max(100).optional().default(10),
	offset: z.number().min(0).optional().default(0),
});

export const addPageToOfferInput = z.object({
	offerId: z.number().int().positive("Offer ID must be a positive integer"),
	url: z
		.string()
		.url("Must be a valid URL")
		.regex(
			facebookAdLibraryUrlRegex,
			"Must be a Facebook Ad Library URL (facebook.com/ads/library/)",
		),
});

export const triggerRefreshInput = z.object({
	uuid: z.string().uuid(),
});

export const removePageFromOfferInput = z.object({
	offerUuid: z.string().uuid(),
	pageId: z.number().int().positive("Page ID must be a positive integer"),
});

export type CreateOfferInput = z.infer<typeof createOfferInput>;
export type UpdateOfferInput = z.infer<typeof updateOfferInput>;
export type DeleteOfferInput = z.infer<typeof deleteOfferInput>;
export type GetOfferByIdInput = z.infer<typeof getOfferByIdInput>;
export type FilterOffersInput = z.infer<typeof filterOffersInput>;
export type AddPageToOfferInput = z.infer<typeof addPageToOfferInput>;
export type TriggerRefreshInput = z.infer<typeof triggerRefreshInput>;
export type RemovePageFromOfferInput = z.infer<typeof removePageFromOfferInput>;
