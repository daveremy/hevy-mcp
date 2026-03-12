# Changelog

All notable changes to `@daveremy/hevy-mcp` will be documented in this file.

For the upstream changelog (chrisdoc/hevy-mcp v1.0.0–v1.20.10), see [the original repo](https://github.com/chrisdoc/hevy-mcp/blob/main/CHANGELOG.md).

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
