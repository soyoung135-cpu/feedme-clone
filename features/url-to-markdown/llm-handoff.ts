export type LlmService = "chatgpt" | "claude";

export const URL_LIMIT = 8000;

const ENDPOINT: Record<LlmService, string> = {
  chatgpt: "https://chatgpt.com/?q=",
  claude: "https://claude.ai/new?q=",
};

export const SERVICE_LABEL: Record<LlmService, string> = {
  chatgpt: "ChatGPT",
  claude: "Claude",
};

export type HandoffPlan =
  | { mode: "url"; url: string }
  | { mode: "clipboard"; text: string; url: string };

/** 프롬프트(있으면) + 빈 줄 + Markdown. 비어 있는 프롬프트는 붙이지 않는다. */
export function composeMessage(prompt: string, markdown: string): string {
  const p = prompt.trim();
  return p ? `${p}\n\n${markdown}` : markdown;
}

/** 인코딩한 URL이 한도 이하이면 URL로, 넘으면 클립보드로 넘긴다(URL에는 본문을 넣지 않음). */
export function planHandoff(
  service: LlmService,
  prompt: string,
  markdown: string,
): HandoffPlan {
  const text = composeMessage(prompt, markdown);
  const url = ENDPOINT[service] + encodeURIComponent(text);
  if (url.length <= URL_LIMIT) return { mode: "url", url };
  return { mode: "clipboard", text, url: ENDPOINT[service].replace(/\?q=$/, "") };
}
