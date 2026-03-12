import type { ExerciseTemplate } from "../generated/client/types/index.js";

export interface ExerciseTemplateFilterOptions {
	search?: string;
	muscleGroup?: string;
	type?: string;
}

/**
 * Filter exercise templates by search term, muscle group, and/or exercise type.
 * All filters are AND-combined.
 */
export function filterExerciseTemplates(
	templates: ExerciseTemplate[],
	filters: ExerciseTemplateFilterOptions,
): ExerciseTemplate[] {
	const { search, muscleGroup, type } = filters;
	const searchLower = search?.toLowerCase();

	return templates.filter((template) => {
		if (searchLower && !template.title?.toLowerCase().includes(searchLower)) {
			return false;
		}
		if (muscleGroup && template.primary_muscle_group !== muscleGroup) {
			return false;
		}
		if (type && template.type !== type) {
			return false;
		}
		return true;
	});
}
