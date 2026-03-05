# markdownlint-rule-table-format

A custom [markdownlint](https://github.com/DavidAnson/markdownlint) rule to format GitHub Flavored Markdown (GFM) tables to comply with [MD060 (table-column-style)](https://github.com/DavidAnson/markdownlint/blob/main/doc/md060.md).

Inspired by [markdownlint-rule-search-replace](https://github.com/OnkarRuikar/markdownlint-rule-search-replace).

## Overview

The built-in MD060 rule reports when table column style is inconsistent but does not auto-fix. This rule detects GFM tables and reformats them to one of the MD060 styles (**aligned**, **compact**, or **tight**), with optional fix application when using `markdownlint --fix`.

- **aligned**: Pipes vertically aligned with padding (e.g. `| foo   | bar   |`).
- **compact**: Single space around cell content (e.g. `| foo | bar |`); optional aligned delimiter row.
- **tight**: No padding (e.g. `|foo|bar|`).

## Installation

```bash
npm install markdownlint-rule-table-format --save-dev
```

## Configuration

Add the rule and config to your markdownlint config (e.g. `.markdownlint.json` or `.markdownlint-cli2.jsonc`).

### Using .markdownlint.json

```json
{
  "default": true,
  "table-format": {
    "style": "tight",
    "aligned_delimiter": true
  }
}
```

Or with markdownlint-cli2 and customRules:

```json
{
  "fix": true,
  "customRules": ["markdownlint-rule-table-format"],
  "config": {
    "table-format": {
      "style": "tight",
      "aligned_delimiter": true
    }
  }
}
```

### Configuration options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `style` | `"aligned"` \| `"compact"` \| `"tight"` \| `"any"` | `"aligned"` | Target table style. Use `"any"` to disable the rule. |
| `aligned_delimiter` | boolean | `false` | When `true`, the delimiter row aligns with the header (for compact/tight). |
| `fix` | boolean | `true` | When `false`, only report violations (no fixInfo). |
| `fixApplicator` | boolean | `true` | When `false`, only report violations (no fixInfo). |

Rule name aliases: `table-format` (recommended) or `table-column-style-fix`.

## Usage

### With markdownlint-cli

```bash
markdownlint README.md -r markdownlint-rule-table-format
# or with fix
markdownlint README.md -r markdownlint-rule-table-format --fix
```

### With markdownlint-cli2

```bash
markdownlint-cli2 "**/*.md" -c .markdownlint-cli2.jsonc
# fix is applied when config has "fix": true
```

### With markdownlint API

```js
const markdownlint = require("markdownlint");
const tableFormat = require("markdownlint-rule-table-format");

const options = {
  files: ["docs/**/*.md"],
  config: {
    default: true,
    "table-format": {
      style: "tight",
      aligned_delimiter: true,
    },
  },
  customRules: [tableFormat],
};

markdownlint(options, (err, result) => {
  if (!err) console.log(result.toString());
});
```

## Disable for a section

```md
<!-- markdownlint-disable table-format -->

| A | B |
| - | - |
| 1 | 2 |

<!-- markdownlint-enable table-format -->
```

## References

- [MD060 - Table column style](https://github.com/DavidAnson/markdownlint/blob/main/doc/md060.md)
- [markdownlint Custom Rules](https://github.com/DavidAnson/markdownlint/blob/main/doc/CustomRules.md)
- [markdownlint-rule-search-replace](https://github.com/OnkarRuikar/markdownlint-rule-search-replace) (template)

## License

MIT
