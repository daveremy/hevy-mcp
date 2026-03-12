# Changelog

All notable changes to `@daveremy/hevy-mcp` will be documented in this file.

For the upstream changelog (chrisdoc/hevy-mcp v1.0.0–v1.20.10), see [the original repo](https://github.com/chrisdoc/hevy-mcp/blob/main/CHANGELOG.md).

## [0.2.0](https://github.com/daveremy/hevy-mcp/compare/v0.1.3...v0.2.0) (2026-03-12)

### Features

* **exercise template search**: add optional `search`, `muscleGroup`, and `type` filters to `get-exercise-templates` with in-memory cache (5-min TTL, concurrent page fetching) ([#5](https://github.com/daveremy/hevy-mcp/pull/5)), closes [#2](https://github.com/daveremy/hevy-mcp/issues/2)
* **pagination metadata**: include `page` and `page_count` in all paginated tool responses (workouts, routines, exercise templates, routine folders, workout events) ([#6](https://github.com/daveremy/hevy-mcp/pull/6)), closes [#4](https://github.com/daveremy/hevy-mcp/issues/4)
* **create-exercise-template**: return full template details (id, title, type, equipment, muscles) so callers can use it immediately ([#6](https://github.com/daveremy/hevy-mcp/pull/6)), closes [#3](https://github.com/daveremy/hevy-mcp/issues/3)

### Refactors

* extract shared helpers (`buildWorkoutPayload`, `mapRoutineExercises`, `buildRoutineResponse`) to deduplicate create/update handlers ([#7](https://github.com/daveremy/hevy-mcp/pull/7))
* extract shared `muscleGroupEnum` and `exerciseTypeEnum` constants to eliminate duplication

## [0.1.1](https://github.com/daveremy/hevy-mcp/compare/v0.1.0...v0.1.1) (2026-03-12)

### Bug Fixes

* remove invalid `permissions` key from plugin.json that caused Claude Code plugin install to fail

## [0.1.0](https://github.com/daveremy/hevy-mcp/releases/tag/v0.1.0) (2026-03-12)

Initial release as `@daveremy/hevy-mcp`, forked from [chrisdoc/hevy-mcp](https://github.com/chrisdoc/hevy-mcp) v1.20.10 by Christoph Kieslich.

### Features

* Claude Code plugin packaging (`.claude-plugin/plugin.json`, `marketplace.json`)
* `/hevy` companion skill with status, log, history, routines, exercises subcommands
* `weightLbs` support with `convertWeightToKg` utility for pound-to-kilogram conversion
* shared Zod schemas to reduce duplication in routines and workouts tools
* semantic-release configured to sync plugin manifest versions on release
* `scripts/update-plugin-versions.js` (ESM) for release automation
* listed in `daveremy/claude-plugins` aggregated marketplace
