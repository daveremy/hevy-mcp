import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type {
	GetV1ExerciseHistoryExercisetemplateid200,
	GetV1ExerciseTemplates200,
	GetV1ExerciseTemplatesExercisetemplateid200,
	PostV1ExerciseTemplates200,
} from "../generated/client/types/index.js";
import { withErrorHandling } from "../utils/error-handler.js";
import { ExerciseTemplateCache } from "../utils/exercise-template-cache.js";
import { filterExerciseTemplates } from "../utils/exercise-template-filter.js";
import {
	formatExerciseHistoryEntry,
	formatExerciseTemplate,
} from "../utils/formatters.js";
import {
	createEmptyResponse,
	createJsonResponse,
} from "../utils/response-formatter.js";
import type { InferToolParams } from "../utils/tool-helpers.js";

// Type definitions for the template operations
type HevyClient = ReturnType<
	typeof import("../utils/hevyClientKubb.js").createClient
>;

// Shared enums for muscle groups and exercise types
const muscleGroupEnum = z.enum([
	"abdominals",
	"shoulders",
	"biceps",
	"triceps",
	"forearms",
	"quadriceps",
	"hamstrings",
	"calves",
	"glutes",
	"abductors",
	"adductors",
	"lats",
	"upper_back",
	"traps",
	"lower_back",
	"chest",
	"cardio",
	"neck",
	"full_body",
	"other",
]);

const exerciseTypeEnum = z.enum([
	"weight_reps",
	"reps_only",
	"bodyweight_reps",
	"bodyweight_assisted_reps",
	"duration",
	"weight_duration",
	"distance_duration",
	"short_distance_weight",
]);

/**
 * Register all exercise template-related tools with the MCP server
 */
export function registerTemplateTools(
	server: McpServer,
	hevyClient: HevyClient | null,
) {
	// Create cache instance for filtered searches
	const templateCache = hevyClient
		? new ExerciseTemplateCache(hevyClient)
		: null;

	// Get exercise templates
	const getExerciseTemplatesSchema = {
		page: z.coerce.number().int().gte(1).default(1),
		pageSize: z.coerce.number().int().gte(1).lte(100).default(5),
		search: z
			.string()
			.describe("Case-insensitive search term to filter templates by title")
			.optional(),
		muscleGroup: muscleGroupEnum
			.describe("Filter by primary muscle group")
			.optional(),
		type: exerciseTypeEnum.describe("Filter by exercise type").optional(),
	} as const;
	type GetExerciseTemplatesParams = InferToolParams<
		typeof getExerciseTemplatesSchema
	>;

	server.tool(
		"get-exercise-templates",
		"Get exercise templates with optional filtering. Supports pagination (page/pageSize) in all modes. With search/muscleGroup/type filters: searches all templates (cached) and returns paginated matching results. Filters are AND-combined.",
		getExerciseTemplatesSchema,
		withErrorHandling(async (args: GetExerciseTemplatesParams) => {
			if (!hevyClient) {
				throw new Error(
					"API client not initialized. Please provide HEVY_API_KEY.",
				);
			}

			const { page, pageSize, search, muscleGroup, type } = args;
			const hasFilters = search || muscleGroup || type;

			if (hasFilters) {
				// Use cache + filter for search queries
				if (!templateCache) {
					throw new Error("Template cache not available.");
				}
				const allTemplates = await templateCache.getAllTemplates();
				const filtered = filterExerciseTemplates(allTemplates, {
					search,
					muscleGroup,
					type,
				});

				if (filtered.length === 0) {
					return createEmptyResponse(
						"No exercise templates found matching the specified filters",
					);
				}

				// Apply pagination to filtered results
				const start = (page - 1) * pageSize;
				const paged = filtered.slice(start, start + pageSize);
				const templates = paged.map(formatExerciseTemplate);

				if (templates.length === 0) {
					return createEmptyResponse(
						"No exercise templates found for the specified page",
					);
				}

				return createJsonResponse(templates);
			}

			// No filters: existing pagination behavior
			const data: GetV1ExerciseTemplates200 =
				await hevyClient.getExerciseTemplates({
					page,
					pageSize,
				});

			const templates =
				data?.exercise_templates?.map(formatExerciseTemplate) || [];

			if (templates.length === 0) {
				return createEmptyResponse(
					"No exercise templates found for the specified parameters",
				);
			}

			return createJsonResponse({
				page: data.page,
				page_count: data.page_count,
				templates,
			});
		}, "get-exercise-templates"),
	);

	// Get single exercise template by ID
	const getExerciseTemplateSchema = {
		exerciseTemplateId: z.string().min(1),
	} as const;
	type GetExerciseTemplateParams = InferToolParams<
		typeof getExerciseTemplateSchema
	>;

	server.tool(
		"get-exercise-template",
		"Get complete details of a specific exercise template by its ID, including name, category, equipment, muscle groups, and notes.",
		getExerciseTemplateSchema,
		withErrorHandling(async (args: GetExerciseTemplateParams) => {
			if (!hevyClient) {
				throw new Error(
					"API client not initialized. Please provide HEVY_API_KEY.",
				);
			}
			const { exerciseTemplateId } = args;
			const data: GetV1ExerciseTemplatesExercisetemplateid200 =
				await hevyClient.getExerciseTemplate(exerciseTemplateId);

			if (!data) {
				return createEmptyResponse(
					`Exercise template with ID ${exerciseTemplateId} not found`,
				);
			}

			const template = formatExerciseTemplate(data);
			return createJsonResponse(template);
		}, "get-exercise-template"),
	);

	// Get exercise history for a template
	const getExerciseHistorySchema = {
		exerciseTemplateId: z.string().min(1),
		startDate: z
			.string()
			.datetime({ offset: true })
			.describe("ISO 8601 start date for filtering history")
			.optional(),
		endDate: z
			.string()
			.datetime({ offset: true })
			.describe("ISO 8601 end date for filtering history")
			.optional(),
	} as const;
	type GetExerciseHistoryParams = InferToolParams<
		typeof getExerciseHistorySchema
	>;

	server.tool(
		"get-exercise-history",
		"Get past sets for a specific exercise template, optionally filtered by start and end dates.",
		getExerciseHistorySchema,
		withErrorHandling(async (args: GetExerciseHistoryParams) => {
			if (!hevyClient) {
				throw new Error(
					"API client not initialized. Please provide HEVY_API_KEY.",
				);
			}
			const { exerciseTemplateId, startDate, endDate } = args;
			const data: GetV1ExerciseHistoryExercisetemplateid200 =
				await hevyClient.getExerciseHistory(exerciseTemplateId, {
					...(startDate ? { start_date: startDate } : {}),
					...(endDate ? { end_date: endDate } : {}),
				});

			const history =
				data?.exercise_history?.map(formatExerciseHistoryEntry) || [];

			if (history.length === 0) {
				return createEmptyResponse(
					`No exercise history found for template ${exerciseTemplateId}`,
				);
			}

			return createJsonResponse(history);
		}, "get-exercise-history"),
	);

	// Create a custom exercise template
	const createExerciseTemplateSchema = {
		title: z.string().min(1),
		exerciseType: exerciseTypeEnum,
		equipmentCategory: z.enum([
			"none",
			"barbell",
			"dumbbell",
			"kettlebell",
			"machine",
			"plate",
			"resistance_band",
			"suspension",
			"other",
		]),
		muscleGroup: muscleGroupEnum,
		otherMuscles: z.array(muscleGroupEnum).default([]),
	} as const;
	type CreateExerciseTemplateParams = InferToolParams<
		typeof createExerciseTemplateSchema
	>;

	server.tool(
		"create-exercise-template",
		"Create a custom exercise template with title, type, equipment, and muscle groups.",
		createExerciseTemplateSchema,
		withErrorHandling(async (args: CreateExerciseTemplateParams) => {
			if (!hevyClient) {
				throw new Error(
					"API client not initialized. Please provide HEVY_API_KEY.",
				);
			}
			const {
				title,
				exerciseType,
				equipmentCategory,
				muscleGroup,
				otherMuscles,
			} = args;

			const response: PostV1ExerciseTemplates200 =
				await hevyClient.createExerciseTemplate({
					exercise: {
						title,
						exercise_type: exerciseType,
						equipment_category: equipmentCategory,
						muscle_group: muscleGroup,
						other_muscles: otherMuscles,
					},
				});

			// Invalidate cache so new template appears in search results
			templateCache?.invalidate();

			return createJsonResponse({
				id: response?.id,
				title,
				exercise_type: exerciseType,
				equipment_category: equipmentCategory,
				muscle_group: muscleGroup,
				other_muscles: otherMuscles,
				message: "Exercise template created successfully",
			});
		}, "create-exercise-template"),
	);
}
