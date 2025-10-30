/**
 * Converts a string to a URL-friendly slug
 * @param text - The text to convert to a slug
 * @returns A slugified string
 *
 * @example
 * slugify("São Paulo") // "sao-paulo"
 * slugify("E-commerce") // "e-commerce"
 * slugify("  Health & Wellness  ") // "health-wellness"
 */
export function slugify(text: string): string {
	return text
		.toString()
		.normalize("NFD") // Normalize to decomposed form for handling accents
		.replace(/[\u0300-\u036f]/g, "") // Remove diacritics
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9\s-]/g, "") // Remove invalid chars
		.replace(/\s+/g, "-") // Replace spaces with -
		.replace(/-+/g, "-") // Replace multiple - with single -
		.replace(/^-+/, "") // Trim - from start of text
		.replace(/-+$/, ""); // Trim - from end of text
}
