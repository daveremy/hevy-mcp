import { describe, expect, it } from "vitest";
import { convertWeightToKg } from "../../src/utils/weight-conversion.js";

describe("convertWeightToKg", () => {
	it("converts weightLbs to kg", () => {
		expect(convertWeightToKg({ weightLbs: 20 })).toBe(9.07);
	});

	it("passes weightKg through unchanged", () => {
		expect(convertWeightToKg({ weightKg: 20 })).toBe(20);
	});

	it("passes legacy weight through unchanged", () => {
		expect(convertWeightToKg({ weight: 20 })).toBe(20);
	});

	it("prioritizes weightKg over weightLbs", () => {
		expect(convertWeightToKg({ weightKg: 20, weightLbs: 44 })).toBe(20);
	});

	it("prioritizes weightKg over weight", () => {
		expect(convertWeightToKg({ weightKg: 20, weight: 30 })).toBe(20);
	});

	it("prioritizes weightLbs over weight", () => {
		expect(convertWeightToKg({ weightLbs: 20, weight: 30 })).toBe(9.07);
	});

	it("handles weightLbs: 0", () => {
		expect(convertWeightToKg({ weightLbs: 0 })).toBe(0);
	});

	it("handles weightKg: 0", () => {
		expect(convertWeightToKg({ weightKg: 0 })).toBe(0);
	});

	it("returns null when no weight fields provided", () => {
		expect(convertWeightToKg({})).toBeNull();
	});

	it("returns null when all fields are null", () => {
		expect(
			convertWeightToKg({ weightKg: null, weightLbs: null, weight: null }),
		).toBeNull();
	});

	it("returns null when all fields are undefined", () => {
		expect(
			convertWeightToKg({
				weightKg: undefined,
				weightLbs: undefined,
				weight: undefined,
			}),
		).toBeNull();
	});

	it("converts a common lbs value accurately", () => {
		// 135 lbs = 61.23 kg (135 * 0.453592 = 61.23492)
		expect(convertWeightToKg({ weightLbs: 135 })).toBe(61.23);
	});

	it("skips null weightKg and uses weightLbs", () => {
		expect(convertWeightToKg({ weightKg: null, weightLbs: 20 })).toBe(9.07);
	});
});
