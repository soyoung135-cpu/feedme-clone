import { Defuddle } from "defuddle/node";
import { parseHTML } from "linkedom";

export type Extracted = { title: string; author: string; markdown: string };

export async function extractMarkdown(html: string, url: string): Promise<Extracted> {
  const { document } = parseHTML(html);
  const result = await Defuddle(document, url, { markdown: true });
  return {
    title: (result.title ?? "").trim(),
    author: (result.author ?? "").trim(),
    markdown: (result.content ?? "").trim(),
  };
}
