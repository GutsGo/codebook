import { marked } from "marked";

export function renderMarkdown(text: string | null | undefined): string {
  if (!text) return "";

  // Replace custom escaped characters
  let processedText = text.replace(/\\n/g, "\n").replace(/\\t/g, "\t");

  try {
    const html = marked.parse(processedText);
    return typeof html === "string" ? html : processedText;
  } catch (err) {
    console.error("Markdown parse error:", err);
    return processedText;
  }
}
