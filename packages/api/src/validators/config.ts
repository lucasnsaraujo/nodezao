import { z } from "zod";

// Region validators
export const createRegionInput = z.object({
	name: z.string().min(1).max(100),
	slug: z.string().min(1).max(100).optional(), // Auto-generated from name if not provided
});

export const updateRegionInput = z.object({
	id: z.number(),
	name: z.string().min(1).max(100).optional(),
	slug: z.string().min(1).max(100).optional(),
});

export const deleteConfigInput = z.object({
	id: z.number(),
});

// Offer Type validators
export const createOfferTypeInput = z.object({
	label: z.string().min(1).max(100),
	slug: z.string().min(1).max(100).optional(), // Auto-generated from label if not provided
});

export const updateOfferTypeInput = z.object({
	id: z.number(),
	label: z.string().min(1).max(100).optional(),
	slug: z.string().min(1).max(100).optional(),
});

// Niche validators
export const createNicheInput = z.object({
	label: z.string().min(1).max(100),
	slug: z.string().min(1).max(100).optional(), // Auto-generated from label if not provided
});

export const updateNicheInput = z.object({
	id: z.number(),
	label: z.string().min(1).max(100).optional(),
	slug: z.string().min(1).max(100).optional(),
});

// Badge validators
export const createBadgeInput = z.object({
	name: z.string().min(1).max(50),
	icon: z.string().optional(),
	color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
});

export const updateBadgeInput = z.object({
	id: z.number(),
	name: z.string().min(1).max(50).optional(),
	icon: z.string().optional(),
	color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
});

// Strategy validators
export const createStrategyInput = z.object({
	slug: z.string().min(2).max(50).optional(),
	label: z.string().min(1).max(100),
	isActive: z.boolean().optional().default(true),
});

export const updateStrategyInput = z.object({
	id: z.number(),
	slug: z.string().min(2).max(50).optional(),
	label: z.string().min(1).max(100).optional(),
	isActive: z.boolean().optional(),
});

export type CreateRegionInput = z.infer<typeof createRegionInput>;
export type UpdateRegionInput = z.infer<typeof updateRegionInput>;
export type DeleteConfigInput = z.infer<typeof deleteConfigInput>;
export type CreateOfferTypeInput = z.infer<typeof createOfferTypeInput>;
export type UpdateOfferTypeInput = z.infer<typeof updateOfferTypeInput>;
export type CreateNicheInput = z.infer<typeof createNicheInput>;
export type UpdateNicheInput = z.infer<typeof updateNicheInput>;
export type CreateBadgeInput = z.infer<typeof createBadgeInput>;
export type UpdateBadgeInput = z.infer<typeof updateBadgeInput>;
export type CreateStrategyInput = z.infer<typeof createStrategyInput>;
export type UpdateStrategyInput = z.infer<typeof updateStrategyInput>;
