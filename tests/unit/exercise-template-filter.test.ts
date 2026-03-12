import { describe, expect, it } from "vitest";
import type { ExerciseTemplate } from "../../src/generated/client/types/index.js";
import { filterExerciseTemplates } from "../../src/utils/exercise-template-filter.js";

const templates: ExerciseTemplate[] = [
	{
		id: "1",
		title: "Bench Press (Barbell)",
		type: "weight_reps",
		primary_muscle_group: "chest",
		is_custom: false,
	},
	{
		id: "2",
		title: "Incline Bench Press (Dumbbell)",
		type: "weight_reps",
		primary_muscle_group: "chest",
		is_custom: false,
	},
	{
		id: "3",
		title: "Bicep Curl (Barbell)",
		type: "weight_reps",
		primary_muscle_group: "biceps",
		is_custom: false,
	},
	{
		id: "4",
		title: "Running",
		type: "distance_duration",
		primary_muscle_group: "cardio",
		is_custom: false,
	},
	{
		id: "5",
		title: "Plank",
		type: "duration",
		primary_muscle_group: "abdominals",
		is_custom: false,
	},
];

describe("filterExerciseTemplates", () => {
	it("returns all templates when no filters provided", () => {
		const result = filterExerciseTemplates(templates, {});
		expect(result).toHaveLength(5);
	});

	it("filters by search term (case-insensitive)", () => {
		const result = filterExerciseTemplates(templates, { search: "bench" });
		expect(result).toHaveLength(2);
		expect(result.map((t) => t.id)).toEqual(["1", "2"]);
	});

	it("filters by search term with different casing", () => {
		const result = filterExerciseTemplates(templates, { search: "BENCH" });
		expect(result).toHaveLength(2);
	});

	it("filters by muscle group", () => {
		const result = filterExerciseTemplates(templates, {
			muscleGroup: "chest",
		});
		expect(result).toHaveLength(2);
		expect(result.map((t) => t.id)).toEqual(["1", "2"]);
	});

	it("filters by exercise type", () => {
		const result = filterExerciseTemplates(templates, {
			type: "duration",
		});
		expect(result).toHaveLength(1);
		expect(result[0].id).toBe("5");
	});

	it("combines filters with AND logic", () => {
		const result = filterExerciseTemplates(templates, {
			search: "bench",
			muscleGroup: "chest",
			type: "weight_reps",
		});
		expect(result).toHaveLength(2);
	});

	it("returns empty array when no templates match", () => {
		const result = filterExerciseTemplates(templates, {
			search: "nonexistent",
		});
		expect(result).toHaveLength(0);
	});

	it("returns empty when filters conflict", () => {
		const result = filterExerciseTemplates(templates, {
			search: "bench",
			muscleGroup: "biceps",
		});
		expect(result).toHaveLength(0);
	});

	it("handles empty template list", () => {
		const result = filterExerciseTemplates([], { search: "bench" });
		expect(result).toHaveLength(0);
	});
});
