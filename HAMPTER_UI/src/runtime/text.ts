import type { RuntimeData } from "./types";

const TEMPLATE_PATTERN = /{([a-zA-Z_][a-zA-Z0-9_]*)(?::([^}]+))?}/g;

export interface TextTemplateToken {
  type: "literal" | "binding";
  value: string;
  format?: string;
}

export function validateTextTemplate(template: string): boolean {
  let cursor = 0;
  for (const match of template.matchAll(TEMPLATE_PATTERN)) {
    if (match.index === undefined) {
      return false;
    }
    cursor = match.index + match[0].length;
  }
  const stripped = template.replace(TEMPLATE_PATTERN, "");
  return stripped.indexOf("{") === -1 && stripped.indexOf("}") === -1 && cursor <= template.length;
}

export function tokenizeTextTemplate(template: string): TextTemplateToken[] {
  const tokens: TextTemplateToken[] = [];
  let cursor = 0;

  for (const match of template.matchAll(TEMPLATE_PATTERN)) {
    if (match.index === undefined) {
      continue;
    }

    if (match.index > cursor) {
      tokens.push({
        type: "literal",
        value: template.slice(cursor, match.index)
      });
    }

    tokens.push({
      type: "binding",
      value: match[1],
      format: match[2]
    });

    cursor = match.index + match[0].length;
  }

  if (cursor < template.length) {
    tokens.push({
      type: "literal",
      value: template.slice(cursor)
    });
  }

  return tokens;
}

export function extractTemplateBindings(template: string): string[] {
  return tokenizeTextTemplate(template)
    .filter((token) => token.type === "binding")
    .map((token) => token.value);
}

export function renderTextTemplate(template: string, values: RuntimeData): string {
  return tokenizeTextTemplate(template)
    .map((token) => {
      if (token.type === "literal") {
        return token.value;
      }

      const value = values[token.value];
      if (value === undefined || value === null) {
        return "";
      }

      if (typeof value === "string") {
        return value;
      }

      if (!token.format) {
        return Number.isInteger(value) ? String(value) : value.toFixed(1);
      }

      const formatNumber = Number(token.format);
      if (!Number.isFinite(formatNumber) || formatNumber < 0) {
        return String(value);
      }

      if (Number.isInteger(value)) {
        return String(value).padStart(formatNumber, "0");
      }

      return value.toFixed(formatNumber);
    })
    .join("");
}
