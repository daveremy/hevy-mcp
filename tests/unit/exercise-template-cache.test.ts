import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ExerciseTemplate } from "../../src/generated/client/types/index.js";
import { ExerciseTemplateCache } from "../../src/utils/exercise-template-cache.js";

function makeTemplate(id: string, title: string): ExerciseTemplate {
	return {
		id,
		title,
		type: "weight_reps",
		primary_muscle_group: "chest",
		is_custom: false,
	};
}

function createMockClient(pageCount: number, templatesPerPage: number) {
	const getExerciseTemplates = vi
		.fn()
		.mockImplementation((params?: { page?: number; pageSize?: number }) => {
			const page = params?.page ?? 1;
			const templates = Array.from({ length: templatesPerPage }, (_, i) => {
				const idx = (page - 1) * templatesPerPage + i + 1;
				return makeTemplate(`${idx}`, `Exercise ${idx}`);
			});
			return Promise.resolve({
				page,
				page_count: pageCount,
				exercise_templates: templates,
			});
		});
	return { getExerciseTemplates };
}

describe("ExerciseTemplateCache", () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("fetches all pages on first call", async () => {
		const client = createMockClient(3, 2);
		const cache = new ExerciseTemplateCache(client);

		const result = await cache.getAllTemplates();

		expect(result).toHaveLength(6); // 3 pages × 2 templates
		expect(client.getExerciseTemplates).toHaveBeenCalledTimes(3);
	});

	it("returns cached results on second call", async () => {
		const client = createMockClient(2, 2);
		const cache = new ExerciseTemplateCache(client);

		await cache.getAllTemplates();
		const result = await cache.getAllTemplates();

		expect(result).toHaveLength(4);
		// Should only have fetched once (2 pages from first call)
		expect(client.getExerciseTemplates).toHaveBeenCalledTimes(2);
	});

	it("refetches after TTL expires", async () => {
		const client = createMockClient(1, 3);
		const cache = new ExerciseTemplateCache(client);

		await cache.getAllTemplates();
		expect(client.getExerciseTemplates).toHaveBeenCalledTimes(1);

		// Advance past 5-minute TTL
		vi.advanceTimersByTime(5 * 60 * 1000 + 1);

		await cache.getAllTemplates();
		expect(client.getExerciseTemplates).toHaveBeenCalledTimes(2);
	});

	it("refetches after invalidation", async () => {
		const client = createMockClient(1, 2);
		const cache = new ExerciseTemplateCache(client);

		await cache.getAllTemplates();
		expect(client.getExerciseTemplates).toHaveBeenCalledTimes(1);

		cache.invalidate();

		await cache.getAllTemplates();
		expect(client.getExerciseTemplates).toHaveBeenCalledTimes(2);
	});

	it("handles single page response", async () => {
		const client = createMockClient(1, 5);
		const cache = new ExerciseTemplateCache(client);

		const result = await cache.getAllTemplates();

		expect(result).toHaveLength(5);
		expect(client.getExerciseTemplates).toHaveBeenCalledTimes(1);
	});

	it("fetches remaining pages concurrently", async () => {
		const client = createMockClient(4, 1);
		const cache = new ExerciseTemplateCache(client);

		const result = await cache.getAllTemplates();

		expect(result).toHaveLength(4);
		// Page 1 first, then pages 2-4 concurrently
		expect(client.getExerciseTemplates).toHaveBeenCalledTimes(4);
		// First call is page 1
		expect(client.getExerciseTemplates).toHaveBeenNthCalledWith(1, {
			page: 1,
			pageSize: 100,
		});
	});

	it("deduplicates concurrent refreshes", async () => {
		const client = createMockClient(1, 3);
		const cache = new ExerciseTemplateCache(client);

		// Fire two concurrent requests on a cold cache
		const [result1, result2] = await Promise.all([
			cache.getAllTemplates(),
			cache.getAllTemplates(),
		]);

		// Both should return the same data
		expect(result1).toHaveLength(3);
		expect(result2).toHaveLength(3);
		// But only one fetch should have occurred
		expect(client.getExerciseTemplates).toHaveBeenCalledTimes(1);
	});

	it("invalidation during inflight fetch causes refetch", async () => {
		let resolveFirst!: (value: unknown) => void;
		const firstCallPromise = new Promise((resolve) => {
			resolveFirst = resolve;
		});

		const client = {
			getExerciseTemplates: vi
				.fn()
				.mockImplementationOnce(() =>
					firstCallPromise.then(() => ({
						page: 1,
						page_count: 1,
						exercise_templates: [makeTemplate("1", "Old Exercise")],
					})),
				)
				.mockImplementation(() =>
					Promise.resolve({
						page: 1,
						page_count: 1,
						exercise_templates: [makeTemplate("2", "New Exercise")],
					}),
				),
		};

		const cache = new ExerciseTemplateCache(client);

		// Start a fetch (it will block on firstCallPromise)
		const fetchPromise = cache.getAllTemplates();

		// Invalidate while fetch is in-flight
		cache.invalidate();

		// Resolve the first fetch
		resolveFirst?.(undefined);
		await fetchPromise;

		// Next call should refetch since invalidation cleared inflight
		const result = await cache.getAllTemplates();
		expect(result[0].title).toBe("New Exercise");
		expect(client.getExerciseTemplates).toHaveBeenCalledTimes(2);
	});
});
