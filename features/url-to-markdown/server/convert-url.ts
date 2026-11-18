import { extractMarkdown } from "./extract-markdown";
import { fetchPage, FetchPageError, type FetchFailure } from "./fetch-page";

export type ConvertResult =
  | { ok: true; title: string; author: string; markdown: string; domain: string }
  | { ok: false; status: number; title: string; message: string };

function describe(f: FetchFailure): { title: string; message: string } {
  switch (f.kind) {
    case "blocked":
      return { title: "이 주소는 가져올 수 없어요", message: f.message };
    case "http":
      return {
        title: "페이지를 가져오지 못했어요",
        message: `사이트가 응답하지 않거나 접근을 막았어요 (HTTP ${f.status}). 주소를 확인하고 다시 시도해 주세요.`,
      };
    case "network":
      return {
        title: "페이지를 가져오지 못했어요",
        message: `${f.message} 주소를 확인하고 다시 시도해 주세요.`,
      };
    case "too-large":
      return { title: "페이지가 너무 커요", message: "5MB를 넘는 페이지는 변환하지 않아요." };
    case "not-html":
      return { title: "웹 페이지가 아니에요", message: "HTML 문서가 아닌 주소는 변환할 수 없어요." };
  }
}

export async function convertUrl(
  url: string,
  fetchImpl?: typeof fetch,
): Promise<ConvertResult> {
  try {
    const { html, finalUrl } = await fetchPage(url, fetchImpl);
    const { title, author, markdown } = await extractMarkdown(html, finalUrl);
    if (!markdown) {
      return {
        ok: false,
        status: 422,
        title: "본문을 찾지 못했어요",
        message:
          "페이지는 열렸지만 추출할 글이 없어요. 자바스크립트로 내용을 그리는 페이지는 지원하지 않아요.",
      };
    }
    return { ok: true, title, author, markdown, domain: new URL(finalUrl).hostname };
  } catch (e) {
    if (e instanceof FetchPageError) {
      return { ok: false, status: e.failure.kind === "blocked" ? 400 : 502, ...describe(e.failure) };
    }
    return {
      ok: false,
      status: 500,
      title: "변환하지 못했어요",
      message: "페이지 내용을 읽는 중 문제가 생겼어요. 잠시 후 다시 시도해 주세요.",
    };
  }
}
