"use strict";

/**
 * Custom markdownlint rule: format GFM tables to comply with MD060 (table-column-style).
 * Logic mirrors vscode-markdown tableFormatter.ts for detection and output.
 * @see https://github.com/DavidAnson/markdownlint/blob/main/doc/CustomRules.md
 * @see https://github.com/yzhang-gh/vscode-markdown/blob/master/src/tableFormatter.ts
 * @see https://github.com/DavidAnson/markdownlint/blob/main/doc/md060.md
 */

// --- Table detection (GFM, same as vscode-markdown)
const LINE_BREAK = /\r?\n/;
const contentLine = String.raw`\|?.*\|.*\|?`;
const leftSideHyphenComponent = String.raw`(?:\|? *:?-+:? *\|)`;
const middleHyphenComponent = String.raw`(?: *:?-+:? *\|)*`;
const rightSideHyphenComponent = String.raw`(?: *:?-+:? *\|?)`;
const multiColumnHyphenLine =
  leftSideHyphenComponent + middleHyphenComponent + rightSideHyphenComponent;
const singleColumnHyphenLine = String.raw`(?:\| *:?-+:? *\|)`;
const hyphenLineStr = `[ \\t]*(?:${multiColumnHyphenLine}|${singleColumnHyphenLine})[ \\t]*`;
const lineBreakStr = String.raw`\r?\n`;
const TABLE_REGEX = new RegExp(
  contentLine + lineBreakStr + hyphenLineStr + "(?:" + lineBreakStr + contentLine + ")*",
  "g"
);

const ROWS_NO_INDENT = /^\s*(\S.*)$/gum;
const FIELD_REGEX = /((\\\||[^\|])*)\|/gu;
const CJK_OR_WIDE = /[\u3000-\u9fff\uac00-\ud7af\uff01-\uff60]/g;

function visualWidth(str) {
  const cjk = str.match(CJK_OR_WIDE);
  return str.length + (cjk ? cjk.length : 0);
}

const ALIGN_NONE = 0;
const ALIGN_LEFT = 1;
const ALIGN_CENTER = 2;
const ALIGN_RIGHT = 3;

function alignCell(text, align, length) {
  if (length <= text.length) return text.slice(0, length);
  const pad = length - text.length;
  const sp = " ".repeat(pad);
  if (align === ALIGN_CENTER) {
    const left = Math.floor(pad / 2);
    return (sp.slice(0, left) + text + sp.slice(0, pad - left)).slice(0, length);
  }
  if (align === ALIGN_RIGHT) return (sp + text).slice(-length);
  return (text + sp).slice(0, length);
}

function formatTableAligned(tableText, eol) {
  const text = tableText.normalize();
  const delimiterRowIndex = 1;
  const indentRegex = /^(\s*)\S/u;
  const indentMatch = text.match(indentRegex);
  const indent = indentMatch ? indentMatch[1] : "";

  const rows = Array.from(text.matchAll(ROWS_NO_INDENT), (m) => m[1].trim());
  if (rows.length < 2) return null;

  const colWidth = [];
  const colAlign = [];

  const lines = rows.map((row) => {
    let r = row;
    if (r.startsWith("|")) r = r.slice(1);
    if (!r.endsWith("|")) r = r + "|";
    const values = [];
    for (const field of r.matchAll(FIELD_REGEX)) {
      values.push(field[1].trim());
    }
    return values;
  });

  for (let iRow = 0; iRow < lines.length; iRow++) {
    const row = lines[iRow];
    for (let c = 0; c < row.length; c++) {
      if (iRow === delimiterRowIndex) {
        const cell = row[c];
        if (/:-+:/.test(cell)) {
          colAlign[c] = ALIGN_CENTER;
          colWidth[c] = Math.max(colWidth[c] || 0, 3);
        } else if (/:-+/.test(cell)) {
          colAlign[c] = ALIGN_LEFT;
          colWidth[c] = Math.max(colWidth[c] || 0, 2);
        } else if (/-+:/.test(cell)) {
          colAlign[c] = ALIGN_RIGHT;
          colWidth[c] = Math.max(colWidth[c] || 0, 2);
        } else {
          colAlign[c] = ALIGN_NONE;
          colWidth[c] = Math.max(colWidth[c] || 0, 1);
        }
      } else {
        colWidth[c] = Math.max(colWidth[c] || 0, visualWidth(row[c]));
      }
    }
  }

  const numCols = Math.max(...lines.map((r) => r.length));
  for (let c = 0; c < numCols; c++) {
    if (colAlign[c] === undefined) colAlign[c] = ALIGN_NONE;
    if (colWidth[c] === undefined) colWidth[c] = 1;
  }

  const out = [];
  for (let iRow = 0; iRow < lines.length; iRow++) {
    const row = lines[iRow];
    if (iRow === delimiterRowIndex) {
      const delimCells = colWidth.slice(0, row.length).map((w, c) => {
        const a = colAlign[c];
        const len = Math.max(w, a === ALIGN_CENTER ? 3 : a !== ALIGN_NONE ? 2 : 1);
        if (a === ALIGN_CENTER) return ":" + "-".repeat(Math.max(1, len - 2)) + ":";
        if (a === ALIGN_LEFT) return ":" + "-".repeat(Math.max(1, len - 1));
        if (a === ALIGN_RIGHT) return "-".repeat(Math.max(1, len - 1)) + ":";
        return "-".repeat(len);
      });
      out.push(indent + "| " + delimCells.join(" | ") + " |");
    } else {
      const cells = row.map((cell, c) =>
        alignCell(cell, colAlign[c] || ALIGN_NONE, colWidth[c] || 1)
      );
      out.push(indent + "| " + cells.join(" | ") + " |");
    }
  }

  return out.join(eol);
}

function formatTableCompact(tableText, eol, alignedDelimiter) {
  const text = tableText.normalize();
  const delimiterRowIndex = 1;
  const indentRegex = /^(\s*)\S/u;
  const indentMatch = text.match(indentRegex);
  const indent = indentMatch ? indentMatch[1] : "";

  const rows = Array.from(text.matchAll(ROWS_NO_INDENT), (m) => m[1].trim());
  if (rows.length < 2) return null;

  const lines = rows.map((row) => {
    let r = row;
    if (r.startsWith("|")) r = r.slice(1);
    if (!r.endsWith("|")) r = r + "|";
    const values = [];
    for (const field of r.matchAll(FIELD_REGEX)) {
      values.push(field[1].trim());
    }
    return values;
  });

  const colAlign = [];
  const colWidth = [];
  for (let c = 0; c < lines[0].length; c++) {
    colWidth[c] = 1;
  }
  const delimCells = lines[delimiterRowIndex];
  for (let c = 0; c < delimCells.length; c++) {
    const cell = delimCells[c];
    if (/:-+:/.test(cell)) colAlign[c] = ALIGN_CENTER;
    else if (/:-+/.test(cell)) colAlign[c] = ALIGN_LEFT;
    else if (/-+:/.test(cell)) colAlign[c] = ALIGN_RIGHT;
    else colAlign[c] = ALIGN_NONE;
  }
  for (let iRow = 0; iRow < lines.length; iRow++) {
    const row = lines[iRow];
    for (let c = 0; c < row.length; c++) {
      if (iRow === delimiterRowIndex) {
        colWidth[c] = Math.max(colWidth[c] || 0, colAlign[c] === ALIGN_CENTER ? 3 : 2);
      } else {
        colWidth[c] = Math.max(colWidth[c] || 0, visualWidth(row[c]));
      }
    }
  }

  const numCols = Math.max(...lines.map((r) => r.length));
  for (let c = 0; c < numCols; c++) {
    if (colAlign[c] === undefined) colAlign[c] = ALIGN_NONE;
    if (colWidth[c] === undefined) colWidth[c] = 1;
  }

  const out = [];
  for (let iRow = 0; iRow < lines.length; iRow++) {
    const row = lines[iRow];
    if (iRow === delimiterRowIndex) {
      if (alignedDelimiter) {
        const delimCellsOut = colWidth.slice(0, row.length).map((w, c) => {
          const a = colAlign[c];
          const len = Math.max(w, a === ALIGN_CENTER ? 3 : 2);
          if (a === ALIGN_CENTER) return ":" + "-".repeat(Math.max(1, len - 2)) + ":";
          if (a === ALIGN_LEFT) return ":" + "-".repeat(Math.max(1, len - 1));
          if (a === ALIGN_RIGHT) return "-".repeat(Math.max(1, len - 1)) + ":";
          return "-".repeat(len);
        });
        out.push(indent + "| " + delimCellsOut.join(" | ") + " |");
      } else {
        const d = row.map((_, c) => (colAlign[c] === ALIGN_CENTER ? ":-:" : colAlign[c] === ALIGN_LEFT ? ":--" : colAlign[c] === ALIGN_RIGHT ? "--:" : "---"));
        out.push(indent + "| " + d.join(" | ") + " |");
      }
    } else {
      out.push(indent + "| " + row.join(" | ") + " |");
    }
  }
  return out.join(eol);
}

function formatTableTight(tableText, eol) {
  const text = tableText.normalize();
  const delimiterRowIndex = 1;
  const indentRegex = /^(\s*)\S/u;
  const indentMatch = text.match(indentRegex);
  const indent = indentMatch ? indentMatch[1] : "";

  const rows = Array.from(text.matchAll(ROWS_NO_INDENT), (m) => m[1].trim());
  if (rows.length < 2) return null;

  const lines = rows.map((row) => {
    let r = row;
    if (r.startsWith("|")) r = r.slice(1);
    if (!r.endsWith("|")) r = r + "|";
    const values = [];
    for (const field of r.matchAll(FIELD_REGEX)) {
      values.push(field[1].trim());
    }
    return values;
  });

  const colAlign = [];
  const delimCells = lines[delimiterRowIndex];
  for (let c = 0; c < delimCells.length; c++) {
    const cell = delimCells[c];
    if (/:-+:/.test(cell)) colAlign[c] = ALIGN_CENTER;
    else if (/:-+/.test(cell)) colAlign[c] = ALIGN_LEFT;
    else if (/-+:/.test(cell)) colAlign[c] = ALIGN_RIGHT;
    else colAlign[c] = ALIGN_NONE;
  }

  const out = [];
  for (let iRow = 0; iRow < lines.length; iRow++) {
    const row = lines[iRow];
    if (iRow === delimiterRowIndex) {
      const d = row.map((_, c) => (colAlign[c] === ALIGN_CENTER ? ":-:" : colAlign[c] === ALIGN_LEFT ? ":--" : colAlign[c] === ALIGN_RIGHT ? "--:" : "---"));
      out.push(indent + "|" + d.join("|") + "|");
    } else {
      out.push(indent + "|" + row.join("|") + "|");
    }
  }
  return out.join(eol);
}

function findTableRanges(text) {
  const tables = [];
  let m;
  TABLE_REGEX.lastIndex = 0;
  while ((m = TABLE_REGEX.exec(text)) !== null) {
    tables.push({ text: m[0], index: m.index });
  }
  return tables;
}

function getLineNumber(text, index) {
  return (text.slice(0, index).match(/\n/g) || []).length + 1;
}

module.exports = {
  names: ["table-format", "table-column-style-fix"],
  description:
    "Format markdown tables to comply with MD060. Supports style: aligned | compact | tight (see md060.md). Uses fixInfo by default unless config.fix or config.fixApplicator is false.",
  information: new URL("https://github.com/DavidAnson/markdownlint/blob/main/doc/md060.md"),
  tags: ["table", "fix", "custom"],
  parser: "none",
  function: function (params, onError) {
    const config = params.config || {};
    if (config.style === "any") return;

    const lines = params.lines;
    const text = lines.join("\n");
    const eol = text.includes("\r\n") ? "\r\n" : "\n";

    const style = config.style || "aligned";
    const alignedDelimiter = config.aligned_delimiter === true;

    const tables = findTableRanges(text);
    for (const { text: tableText, index } of tables) {
      let formatted = null;
      if (style === "aligned") {
        formatted = formatTableAligned(tableText, eol);
      } else if (style === "compact") {
        formatted = formatTableCompact(tableText, eol, alignedDelimiter);
      } else if (style === "tight") {
        formatted = formatTableTight(tableText, eol);
      }
      if (formatted == null || formatted === tableText) continue;

      const startLine = getLineNumber(text, index);
      const tableDocLines = tableText.split(LINE_BREAK);
      const formattedLines = formatted.split(eol);

      if (formattedLines.length !== tableDocLines.length) continue;
      if (startLine + tableDocLines.length - 1 > lines.length) continue;
      if (startLine < 1) continue;

      const fixDisabled = config.fix === false || config.fixApplicator === false;

      for (let i = tableDocLines.length - 1; i >= 0; i--) {
        const lineNum = startLine + i;
        const newContent = formattedLines[i];
        const contextLine = tableDocLines[i];
        const context = contextLine.slice(0, 50) + (contextLine.length > 50 ? "…" : "");

        const errorPayload = {
          lineNumber: lineNum,
          detail: `Table formatting (${style} style); fix applied.`,
          context,
        };

        if (!fixDisabled) {
          const docLine = lines[lineNum - 1];
          const deleteCount = docLine != null ? docLine.length : contextLine.length;
          errorPayload.fixInfo = {
            lineNumber: lineNum,
            editColumn: 1,
            deleteCount,
            insertText: newContent,
          };
        }

        onError(errorPayload);
      }
    }
  },
};
