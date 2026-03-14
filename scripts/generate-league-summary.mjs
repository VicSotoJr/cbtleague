import fs from "node:fs";
import path from "node:path";
import { buildLeagueSummary } from "../src/lib/league-summary-builder-runtime.mjs";

const sourcePath = path.join(process.cwd(), "src/data/data.json");
const outputPath = path.join(process.cwd(), "src/data/league-summary.json");

const raw = fs.readFileSync(sourcePath, "utf8");
const data = JSON.parse(raw);
const summary = buildLeagueSummary(data);

fs.writeFileSync(outputPath, JSON.stringify(summary));

const sourceSize = fs.statSync(sourcePath).size;
const outputSize = fs.statSync(outputPath).size;
const ratio = ((outputSize / sourceSize) * 100).toFixed(1);

console.log(`Generated ${path.relative(process.cwd(), outputPath)}`);
console.log(`Source bytes: ${sourceSize}`);
console.log(`Summary bytes: ${outputSize} (${ratio}% of source)`);
