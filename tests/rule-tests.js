"use strict";

const markdownlint = require("markdownlint");
const tableFormat = require("../rule.js");

function runTests() {
  const alignedInput = [
    "| A   | B   |",
    "| --- | --- |",
    "| 1   | 2   |",
  ].join("\n");

  const tightInput = [
    "|A|B|",
    "|---|---|",
    "|1|2|",
  ].join("\n");

  const messyInput = [
    "|  A  |  B  |",
    "|-----|-----|",
    "|  1  |  2  |",
  ].join("\n");

  let passed = 0;
  let failed = 0;

  // Test 1: Tight table should have no errors when style is tight
  (function () {
    const result = markdownlint.sync({
      strings: { "tight.md": tightInput },
      config: { "table-format": { style: "tight" } },
      customRules: [tableFormat],
    });
    const errors = result["tight.md"] || [];
    if (errors.length === 0) {
      console.log("PASS: Tight table with style tight → no errors");
      passed++;
    } else {
      console.log("FAIL: Tight table with style tight → expected 0 errors, got", errors.length);
      failed++;
    }
  })();

  // Test 2: Messy (aligned) table should be reported when style is tight
  (function () {
    const result = markdownlint.sync({
      strings: { "messy.md": messyInput },
      config: { "table-format": { style: "tight" } },
      customRules: [tableFormat],
    });
    const errors = result["messy.md"] || [];
    if (errors.length > 0) {
      console.log("PASS: Messy table with style tight → reported", errors.length, "error(s)");
      passed++;
    } else {
      console.log("FAIL: Messy table with style tight → expected errors, got 0");
      failed++;
    }
  })();

  // Test 3: Aligned table should have no errors when style is aligned
  (function () {
    const result = markdownlint.sync({
      strings: { "aligned.md": alignedInput },
      config: { "table-format": { style: "aligned" } },
      customRules: [tableFormat],
    });
    const errors = result["aligned.md"] || [];
    if (errors.length === 0) {
      console.log("PASS: Aligned table with style aligned → no errors");
      passed++;
    } else {
      console.log("FAIL: Aligned table with style aligned → expected 0 errors, got", errors.length);
      failed++;
    }
  })();

  // Test 4: style "any" disables the rule
  (function () {
    const result = markdownlint.sync({
      strings: { "any.md": messyInput },
      config: { "table-format": { style: "any" } },
      customRules: [tableFormat],
    });
    const errors = result["any.md"] || [];
    if (errors.length === 0) {
      console.log("PASS: style 'any' → no errors");
      passed++;
    } else {
      console.log("FAIL: style 'any' → expected 0 errors, got", errors.length);
      failed++;
    }
  })();

  console.log("\nTotal:", passed, "passed,", failed, "failed");
  process.exit(failed > 0 ? 1 : 0);
}

runTests();
