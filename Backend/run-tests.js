import { spawnSync } from "node:child_process";

const testFiles = [
  "test/tokenBucket.test.js",
  "test/slidingWindowLog.test.js",
  "test/slidingWindowCounter.test.js",
  "test/api.test.js",
];
for (const file of testFiles) {
  console.log(`\nRunning: ${file}\n`);

  const result = spawnSync(process.execPath, ["--test", file], {
    stdio: "inherit",
    shell: false,
  });

  console.log(`Exit code for ${file}: ${result.status}`);

  if (result.error) {
    console.error("Process error:", result.error);
  }

  if (result.status !== 0) {
    console.error(`Test process failed for ${file}`);
    process.exit(result.status ?? 1);
  }
}

console.log("\nAll test files passed.\n");
