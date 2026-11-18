import { assertPublicUrl, BlockedUrlError } from "./public-address";

export const MAX_BYTES = 5 * 1024 * 1024;
export const TIMEOUT_MS = 10_000;
const MAX_REDIRECTS = 5;

export type FetchFailure =
  | { kind: "blocked"; message: string }
  | { kind: "http"; status: number }
  | { kind: "network"; message: string }
  | { kind: "too-large" }
  | { kind: "not-html" };

export class FetchPageError extends Error {
  constructor(public failure: FetchFailure) {
    super(failure.kind);
  }
}

async function readLimited(res: Response): Promise<string> {
  const declared = Number(res.headers.get("content-length"));
  if (declared > MAX_BYTES) throw new FetchPageError({ kind: "too-large" });
  const reader = res.body?.getReader();
  if (!reader) return "";
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_BYTES) {
      await reader.cancel();
      throw new FetchPageError({ kind: "too-large" });
    }
    chunks.push(value);
  }
  return new TextDecoder().decode(Buffer.concat(chunks));
}

/** 리다이렉트마다 주소를 다시 검증하며 HTML을 가져온다. */
export async function fetchPage(
  input: string,
  fetchImpl: typeof fetch = fetch,
): Promise<{ html: string; finalUrl: string }> {
  const signal = AbortSignal.timeout(TIMEOUT_MS);
  let current = input;
  try {
    for (let i = 0; i <= MAX_REDIRECTS; i++) {
      const url = await assertPublicUrl(current);
      const res = await fetchImpl(url, {
        redirect: "manual",
        signal,
        headers: {
          accept: "text/html,application/xhtml+xml",
          "user-agent": "Mozilla/5.0 (compatible; url-to-markdown)",
        },
      });
      if (res.status >= 300 && res.status < 400 && res.headers.get("location")) {
        current = new URL(res.headers.get("location")!, url).toString();
        continue;
      }
      if (!res.ok) throw new FetchPageError({ kind: "http", status: res.status });
      const type = res.headers.get("content-type") ?? "";
      if (type && !/html|xml/i.test(type)) {
        throw new FetchPageError({ kind: "not-html" });
      }
      return { html: await readLimited(res), finalUrl: url.toString() };
    }
    throw new FetchPageError({ kind: "network", message: "리다이렉트가 너무 많습니다." });
  } catch (e) {
    if (e instanceof FetchPageError) throw e;
    if (e instanceof BlockedUrlError) {
      throw new FetchPageError({ kind: "blocked", message: e.message });
    }
    throw new FetchPageError({
      kind: "network",
      message: signal.aborted ? "응답 시간이 초과되었습니다." : "연결하지 못했습니다.",
    });
  }
}
