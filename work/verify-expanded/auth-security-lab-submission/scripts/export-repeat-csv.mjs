import { readFile, writeFile } from "node:fs/promises";

const source = JSON.parse(await readFile("results/repeated-experiment-raw.json", "utf8"));
const columns = ["repetition", "scenarioId", "category", "mode", "attackSucceeded", "status", "durationMs", "evidence", "control", "observedAt"];
const csvCell = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
const lines = [columns.join(","), ...source.observations.map((row) => columns.map((column) => csvCell(row[column])).join(","))];
await writeFile("results/repeated-experiment-raw.csv", `${lines.join("\n")}\n`, "utf8");
console.log(`saved ${source.observations.length} rows`);
