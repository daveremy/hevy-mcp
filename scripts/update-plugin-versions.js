/**
 * Updates version fields in plugin.json and marketplace.json.
 * Called by semantic-release during the prepare phase.
 *
 * Usage: node scripts/update-plugin-versions.js <version>
 */
import { readFileSync, writeFileSync } from "node:fs";
import { basename, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

const version = process.argv[2];
if (!version) {
	console.error("Usage: node scripts/update-plugin-versions.js <version>");
	process.exit(1);
}

const files = [
	resolve(__dirname, "../.claude-plugin/plugin.json"),
	resolve(__dirname, "../.claude-plugin/marketplace.json"),
];

for (const file of files) {
	try {
		const json = JSON.parse(readFileSync(file, "utf8"));
		if (json.version) json.version = version;
		if (Array.isArray(json.plugins)) {
			for (const plugin of json.plugins) {
				plugin.version = version;
			}
		}
		writeFileSync(file, `${JSON.stringify(json, null, "\t")}\n`);
		console.log(`Updated ${basename(file)} to version ${version}`);
	} catch (err) {
		console.error(`Failed to update ${file}: ${err.message}`);
		process.exit(1);
	}
}
