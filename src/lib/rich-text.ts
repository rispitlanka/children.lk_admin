/** True when HTML has no meaningful text (e.g. empty Quill state `<p><br></p>`). */
export function isRichTextEmpty(html: string): boolean {
  const text = html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text.length === 0;
}
