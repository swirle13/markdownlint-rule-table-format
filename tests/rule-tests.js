"use strict";

const tableFormat = require("../rule.js");

const BASE_CONFIG = { default: false };

function cfg(style, opts) {
  return { ...BASE_CONFIG, "table-format": { style, ...opts } };
}

async function runTests() {
  const { lint } = await import("markdownlint/sync");

  let passed = 0;
  let failed = 0;

  function run(name, fn) {
    try {
      fn();
      console.log("PASS:", name);
      passed++;
    } catch (e) {
      console.log("FAIL:", name);
      console.log("     ", e.message);
      failed++;
    }
  }

  function assert(cond, msg) {
    if (!cond) throw new Error(msg);
  }

  function lintStr(input, config) {
    const result = lint({
      strings: { "test.md": input },
      config,
      customRules: [tableFormat],
    });
    return result["test.md"] || [];
  }

  // ---------------------------------------------------------------------------
  // Table fixtures
  // ---------------------------------------------------------------------------

  const simpleAligned = [
    "| A | B |",
    "| - | - |",
    "| 1 | 2 |",
  ].join("\n");

  const multiColAligned = [
    "| Character | Meaning |",
    "| --------- | ------- |",
    "| Y         | Yes     |",
    "| N         | No      |",
  ].join("\n");

  const simpleCompact = [
    "| Character | Meaning |",
    "| --- | --- |",
    "| Y | Yes |",
    "| N | No |",
  ].join("\n");

  const compactAlignedDelimiter = [
    "| Character | Meaning |",
    "| --------- | ------- |",
    "| Y | Yes |",
    "| N | No |",
  ].join("\n");

  const simpleTight = [
    "|Character|Meaning|",
    "|---|---|",
    "|Y|Yes|",
    "|N|No|",
  ].join("\n");

  const messyTable = [
    "|  Character  |  Meaning  |",
    "|-----|-----|",
    "|  Y  |  Yes  |",
    "|  N  |  No  |",
  ].join("\n");

  const withAlignMarkers = [
    "| Left | Center | Right | None |",
    "| :--- | :---: | ---: | --- |",
    "| a | b | c | d |",
  ].join("\n");

  const alignedWithMarkers = [
    "| Left | Center | Right | None |",
    "| :--- | :----: | ----: | ---- |",
    "| a    |   b    |     c | d    |",
  ].join("\n");

  const compactWithMarkers = [
    "| Left | Center | Right | None |",
    "| :-- | :-: | --: | --- |",
    "| a | b | c | d |",
  ].join("\n");

  const tightWithMarkers = [
    "|Left|Center|Right|None|",
    "|:--|:-:|--:|---|",
    "|a|b|c|d|",
  ].join("\n");

  const compactAlignedDelimWithMarkers = [
    "| Left | Center | Right | None |",
    "| :--- | :----: | ----: | ---- |",
    "| a | b | c | d |",
  ].join("\n");

  // ===========================================================================
  // Style: aligned
  // ===========================================================================

  run("aligned: no errors when already aligned (simple)", () => {
    const errors = lintStr(simpleAligned, cfg("aligned"));
    assert(errors.length === 0, `expected 0 errors, got ${errors.length}`);
  });

  run("aligned: no errors when already aligned (multi-col)", () => {
    const errors = lintStr(multiColAligned, cfg("aligned"));
    assert(errors.length === 0, `expected 0 errors, got ${errors.length}`);
  });

  run("aligned: reports errors for compact table", () => {
    const errors = lintStr(simpleCompact, cfg("aligned"));
    assert(errors.length > 0, "expected errors for compact table with aligned style");
  });

  run("aligned: reports errors for tight table", () => {
    const errors = lintStr(simpleTight, cfg("aligned"));
    assert(errors.length > 0, "expected errors for tight table with aligned style");
  });

  run("aligned: reports errors for messy table", () => {
    const errors = lintStr(messyTable, cfg("aligned"));
    assert(errors.length > 0, "expected errors for messy table with aligned style");
  });

  run("aligned: fixInfo produces correctly aligned lines", () => {
    const errors = lintStr(simpleCompact, cfg("aligned"));
    const fixes = errors.map((e) => e.fixInfo.insertText);
    assert(fixes.includes("| Character | Meaning |"), `header mismatch: ${JSON.stringify(fixes)}`);
    assert(fixes.includes("| Y         | Yes     |"), `data row mismatch: ${JSON.stringify(fixes)}`);
  });

  run("aligned: handles alignment markers", () => {
    const errors = lintStr(alignedWithMarkers, cfg("aligned"));
    assert(errors.length === 0, `expected 0 errors, got ${errors.length}`);
  });

  run("aligned: formats alignment markers correctly from compact input", () => {
    const errors = lintStr(withAlignMarkers, cfg("aligned"));
    const fixes = errors.map((e) => e.fixInfo.insertText);
    assert(fixes.includes("| :--- | :----: | ----: | ---- |"), `delimiter mismatch: ${JSON.stringify(fixes)}`);
    assert(fixes.includes("| a    |   b    |     c | d    |"), `data row mismatch: ${JSON.stringify(fixes)}`);
  });

  // ===========================================================================
  // Style: compact
  // ===========================================================================

  run("compact: no errors when already compact", () => {
    const errors = lintStr(simpleCompact, cfg("compact"));
    assert(errors.length === 0, `expected 0 errors, got ${errors.length}`);
  });

  run("compact: reports errors for aligned table", () => {
    const errors = lintStr(multiColAligned, cfg("compact"));
    assert(errors.length > 0, "expected errors for aligned table with compact style");
  });

  run("compact: reports errors for tight table", () => {
    const errors = lintStr(simpleTight, cfg("compact"));
    assert(errors.length > 0, "expected errors for tight table with compact style");
  });

  run("compact: reports errors for messy table", () => {
    const errors = lintStr(messyTable, cfg("compact"));
    assert(errors.length > 0, "expected errors for messy table with compact style");
  });

  run("compact: fixInfo produces correctly compact lines", () => {
    const errors = lintStr(multiColAligned, cfg("compact"));
    const fixes = errors.map((e) => e.fixInfo.insertText);
    assert(fixes.includes("| Character | Meaning |"), `header mismatch: ${JSON.stringify(fixes)}`);
    assert(fixes.includes("| --- | --- |"), `delimiter mismatch: ${JSON.stringify(fixes)}`);
    assert(fixes.includes("| Y | Yes |"), `data row mismatch: ${JSON.stringify(fixes)}`);
  });

  run("compact: handles alignment markers", () => {
    const errors = lintStr(compactWithMarkers, cfg("compact"));
    assert(errors.length === 0, `expected 0 errors, got ${errors.length}`);
  });

  run("compact: formats alignment markers correctly", () => {
    const errors = lintStr(withAlignMarkers, cfg("compact"));
    const fixes = errors.map((e) => e.fixInfo.insertText);
    assert(fixes.includes("| :-- | :-: | --: | --- |"), `delimiter mismatch: ${JSON.stringify(fixes)}`);
  });

  // ===========================================================================
  // Style: compact + aligned_delimiter
  // ===========================================================================

  run("compact + aligned_delimiter: no errors when already correct", () => {
    const errors = lintStr(compactAlignedDelimiter, cfg("compact", { aligned_delimiter: true }));
    assert(errors.length === 0, `expected 0 errors, got ${errors.length}`);
  });

  run("compact + aligned_delimiter: reports errors for plain compact", () => {
    const errors = lintStr(simpleCompact, cfg("compact", { aligned_delimiter: true }));
    assert(errors.length > 0, "expected errors: delimiter row should be widened");
  });

  run("compact + aligned_delimiter: fixInfo widens delimiter row", () => {
    const errors = lintStr(simpleCompact, cfg("compact", { aligned_delimiter: true }));
    const fixes = errors.map((e) => e.fixInfo.insertText);
    assert(fixes.includes("| --------- | ------- |"), `delimiter mismatch: ${JSON.stringify(fixes)}`);
    assert(fixes.includes("| Y | Yes |"), `data row should stay compact: ${JSON.stringify(fixes)}`);
  });

  run("compact + aligned_delimiter: handles alignment markers", () => {
    const errors = lintStr(compactAlignedDelimWithMarkers, cfg("compact", { aligned_delimiter: true }));
    assert(errors.length === 0, `expected 0 errors, got ${errors.length}`);
  });

  run("compact + aligned_delimiter: formats markers from compact input", () => {
    const errors = lintStr(compactWithMarkers, cfg("compact", { aligned_delimiter: true }));
    const fixes = errors.map((e) => e.fixInfo.insertText);
    assert(fixes.includes("| :--- | :----: | ----: | ---- |"), `delimiter mismatch: ${JSON.stringify(fixes)}`);
  });

  run("compact + aligned_delimiter=false: uses minimal delimiters", () => {
    const errors = lintStr(multiColAligned, cfg("compact", { aligned_delimiter: false }));
    const fixes = errors.map((e) => e.fixInfo.insertText);
    assert(fixes.includes("| --- | --- |"), `delimiter should be minimal: ${JSON.stringify(fixes)}`);
  });

  // ===========================================================================
  // Style: tight
  // ===========================================================================

  run("tight: no errors when already tight", () => {
    const errors = lintStr(simpleTight, cfg("tight"));
    assert(errors.length === 0, `expected 0 errors, got ${errors.length}`);
  });

  run("tight: reports errors for aligned table", () => {
    const errors = lintStr(multiColAligned, cfg("tight"));
    assert(errors.length > 0, "expected errors for aligned table with tight style");
  });

  run("tight: reports errors for compact table", () => {
    const errors = lintStr(simpleCompact, cfg("tight"));
    assert(errors.length > 0, "expected errors for compact table with tight style");
  });

  run("tight: reports errors for messy table", () => {
    const errors = lintStr(messyTable, cfg("tight"));
    assert(errors.length > 0, "expected errors for messy table with tight style");
  });

  run("tight: fixInfo produces correctly tight lines", () => {
    const errors = lintStr(simpleCompact, cfg("tight"));
    const fixes = errors.map((e) => e.fixInfo.insertText);
    assert(fixes.includes("|Character|Meaning|"), `header mismatch: ${JSON.stringify(fixes)}`);
    assert(fixes.includes("|---|---|"), `delimiter mismatch: ${JSON.stringify(fixes)}`);
    assert(fixes.includes("|Y|Yes|"), `data row mismatch: ${JSON.stringify(fixes)}`);
  });

  run("tight: handles alignment markers", () => {
    const errors = lintStr(tightWithMarkers, cfg("tight"));
    assert(errors.length === 0, `expected 0 errors, got ${errors.length}`);
  });

  run("tight: formats alignment markers correctly", () => {
    const errors = lintStr(withAlignMarkers, cfg("tight"));
    const fixes = errors.map((e) => e.fixInfo.insertText);
    assert(fixes.includes("|:--|:-:|--:|---|"), `delimiter mismatch: ${JSON.stringify(fixes)}`);
    assert(fixes.includes("|a|b|c|d|"), `data row mismatch: ${JSON.stringify(fixes)}`);
  });

  run("tight: aligned_delimiter has no effect (always minimal dashes)", () => {
    const errors1 = lintStr(simpleCompact, cfg("tight", { aligned_delimiter: false }));
    const errors2 = lintStr(simpleCompact, cfg("tight", { aligned_delimiter: true }));
    const fixes1 = errors1.map((e) => e.fixInfo.insertText).sort();
    const fixes2 = errors2.map((e) => e.fixInfo.insertText).sort();
    assert(
      JSON.stringify(fixes1) === JSON.stringify(fixes2),
      `aligned_delimiter should not change tight output:\n  false: ${JSON.stringify(fixes1)}\n  true:  ${JSON.stringify(fixes2)}`
    );
  });

  // ===========================================================================
  // Style: any (disables the rule)
  // ===========================================================================

  run("any: no errors for messy table", () => {
    const errors = lintStr(messyTable, cfg("any"));
    assert(errors.length === 0, `expected 0 errors, got ${errors.length}`);
  });

  run("any: no errors for aligned table", () => {
    const errors = lintStr(multiColAligned, cfg("any"));
    assert(errors.length === 0, `expected 0 errors, got ${errors.length}`);
  });

  run("any: no errors for compact table", () => {
    const errors = lintStr(simpleCompact, cfg("any"));
    assert(errors.length === 0, `expected 0 errors, got ${errors.length}`);
  });

  run("any: no errors for tight table", () => {
    const errors = lintStr(simpleTight, cfg("any"));
    assert(errors.length === 0, `expected 0 errors, got ${errors.length}`);
  });

  run("any: no errors for table with alignment markers", () => {
    const errors = lintStr(withAlignMarkers, cfg("any"));
    assert(errors.length === 0, `expected 0 errors, got ${errors.length}`);
  });

  // ===========================================================================
  // fix / fixApplicator config
  // ===========================================================================

  run("fix: false suppresses fixInfo", () => {
    const errors = lintStr(messyTable, cfg("tight", { fix: false }));
    assert(errors.length > 0, "should still report errors");
    assert(errors.every((e) => e.fixInfo == null), "fixInfo should be absent on all errors");
  });

  run("fixApplicator: false suppresses fixInfo", () => {
    const errors = lintStr(messyTable, cfg("tight", { fixApplicator: false }));
    assert(errors.length > 0, "should still report errors");
    assert(errors.every((e) => e.fixInfo == null), "fixInfo should be absent on all errors");
  });

  run("fix: true (default) includes fixInfo", () => {
    const errors = lintStr(messyTable, cfg("tight"));
    assert(errors.length > 0, "should report errors");
    assert(errors.every((e) => e.fixInfo != null), "fixInfo should be present on all errors");
  });

  // ===========================================================================
  // Default style (no config) falls back to "aligned"
  // ===========================================================================

  run("default style is aligned when no style specified", () => {
    const errors = lintStr(multiColAligned, cfg(undefined));
    assert(errors.length === 0, `expected 0 errors for aligned table with default config, got ${errors.length}`);
  });

  run("default style reports errors for compact table", () => {
    const errors = lintStr(simpleCompact, cfg(undefined));
    assert(errors.length > 0, "expected errors for compact table with default config");
  });

  // ===========================================================================
  // Error count matches table line count
  // ===========================================================================

  run("error count equals number of changed lines", () => {
    const errors = lintStr(simpleCompact, cfg("aligned"));
    assert(errors.length === 4, `expected 4 errors (one per line), got ${errors.length}`);
  });

  run("no errors emitted for lines that are already correct", () => {
    const partiallyCorrect = [
      "| Character | Meaning |",
      "| --- | --- |",
      "| Y | Yes |",
      "| N | No |",
    ].join("\n");
    const errors = lintStr(partiallyCorrect, cfg("compact"));
    assert(errors.length === 0, `expected 0 errors, got ${errors.length}`);
  });

  // ===========================================================================
  // Config via alias name "table-column-style-fix"
  // ===========================================================================

  run("config works via alias 'table-column-style-fix'", () => {
    const result = lint({
      strings: { "test.md": simpleTight },
      config: { default: false, "table-column-style-fix": { style: "tight" } },
      customRules: [tableFormat],
    });
    const errors = result["test.md"] || [];
    assert(errors.length === 0, `expected 0 errors via alias, got ${errors.length}`);
  });

  run("config via alias 'table-column-style-fix' detects violations", () => {
    const result = lint({
      strings: { "test.md": simpleTight },
      config: { default: false, "table-column-style-fix": { style: "aligned" } },
      customRules: [tableFormat],
    });
    const errors = result["test.md"] || [];
    assert(errors.length > 0, "expected errors via alias for style mismatch");
  });

  // ===========================================================================
  // Summary
  // ===========================================================================

  console.log(`\nTotal: ${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

runTests();
