/** True when HTML has no meaningful text (e.g. empty Quill state `<p><br></p>`). */
export function isRichTextEmpty(html: string): boolean {
  const text = html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text.length === 0;
}

/**
 * Lightweight HTML sanitizer for rich-text content persisted from the editor.
 * Removes scripts/styles/iframes and common inline XSS vectors.
 */
export function sanitizeRichTextHtml(html: string): string {
  if (!html || typeof html !== "string") return "";

  return html
    .replace(/<\s*(script|style|iframe|object|embed|meta|link)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, "")
    .replace(/<\s*(script|style|iframe|object|embed|meta|link)[^>]*\/?\s*>/gi, "")
    .replace(/\son[a-z]+\s*=\s*(".*?"|'.*?'|[^\s>]+)/gi, "")
    .replace(/\s(href|src)\s*=\s*(['"])\s*javascript:[\s\S]*?\2/gi, ' $1="#"');
}
