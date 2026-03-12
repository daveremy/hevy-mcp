const LBS_TO_KG = 0.453592;

/**
 * Converts weight input to kilograms.
 *
 * Priority: weightKg > weightLbs (converted) > weight (legacy) > null
 */
export function convertWeightToKg(set: {
	weightKg?: number | null;
	weightLbs?: number | null;
	weight?: number | null;
}): number | null {
	if (set.weightKg != null) return set.weightKg;
	if (set.weightLbs != null)
		return Math.round(set.weightLbs * LBS_TO_KG * 100) / 100;
	return set.weight ?? null;
}
