import type {
	ExerciseTemplate,
	GetV1ExerciseTemplates200,
} from "../generated/client/types/index.js";

type HevyClient = {
	getExerciseTemplates: (params?: {
		page?: number;
		pageSize?: number;
	}) => Promise<GetV1ExerciseTemplates200>;
};

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const PAGE_SIZE = 100;

export class ExerciseTemplateCache {
	private templates: ExerciseTemplate[] | null = null;
	private lastFetchTime = 0;
	private inflight: Promise<ExerciseTemplate[]> | null = null;
	private version = 0;
	private hevyClient: HevyClient;

	constructor(hevyClient: HevyClient) {
		this.hevyClient = hevyClient;
	}

	async getAllTemplates(): Promise<ExerciseTemplate[]> {
		if (this.templates && Date.now() - this.lastFetchTime < CACHE_TTL_MS) {
			return this.templates;
		}

		// Deduplicate concurrent refreshes
		if (this.inflight) {
			return this.inflight;
		}

		const versionAtStart = this.version;
		const fetchPromise = this.fetchAllPages();
		this.inflight = fetchPromise;
		try {
			const templates = await fetchPromise;
			// Only populate cache if no invalidation occurred during fetch
			if (this.version === versionAtStart) {
				this.templates = templates;
				this.lastFetchTime = Date.now();
			}
			return templates;
		} finally {
			if (this.inflight === fetchPromise) {
				this.inflight = null;
			}
		}
	}

	invalidate(): void {
		this.templates = null;
		this.lastFetchTime = 0;
		this.inflight = null;
		this.version++;
	}

	private async fetchAllPages(): Promise<ExerciseTemplate[]> {
		// Fetch page 1 to get page_count
		const firstPage = await this.hevyClient.getExerciseTemplates({
			page: 1,
			pageSize: PAGE_SIZE,
		});

		const allTemplates = firstPage.exercise_templates ?? [];
		const pageCount = firstPage.page_count ?? 1;

		// Fetch remaining pages concurrently
		if (pageCount > 1) {
			const remainingPages = Array.from(
				{ length: pageCount - 1 },
				(_, i) => i + 2,
			);
			const results = await Promise.all(
				remainingPages.map((page) =>
					this.hevyClient.getExerciseTemplates({
						page,
						pageSize: PAGE_SIZE,
					}),
				),
			);
			const additionalTemplates = results.flatMap(
				(result) => result.exercise_templates ?? [],
			);
			allTemplates.push(...additionalTemplates);
		}

		return allTemplates;
	}
}
