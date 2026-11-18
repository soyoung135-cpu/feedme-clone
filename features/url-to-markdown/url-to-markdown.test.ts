import { describe, expect, test, vi } from "vitest";

import { markdownFilename } from "./filename";
import { composeMessage, planHandoff, URL_LIMIT } from "./llm-handoff";
import { convertUrl } from "./server/convert-url";
import { fetchPage, FetchPageError, MAX_BYTES } from "./server/fetch-page";
import { isBlockedAddress, assertPublicUrl } from "./server/public-address";
import { isValidHttpUrl } from "./url-input";

const html = (body: string) =>
  new Response(body, { headers: { "content-type": "text/html" } });

describe("SSRF 방어", () => {
  test.each([
    "127.0.0.1", "10.1.2.3", "172.16.0.1", "192.168.0.5", "169.254.169.254",
    "0.0.0.0", "::1", "fe80::1", "fd00::1", "::ffff:127.0.0.1", "::ffff:7f00:1",
  ])("%s 는 차단한다", (ip) => expect(isBlockedAddress(ip)).toBe(true));

  test.each(["8.8.8.8", "93.184.216.34", "2606:4700::1111"])(
    "%s 는 허용한다", (ip) => expect(isBlockedAddress(ip)).toBe(false));

  test.each(["file:///etc/passwd", "ftp://example.com", "http://localhost:3000", "http://[::1]/", "http://169.254.169.254/latest"])(
    "%s 는 거부한다", async (u) => {
      await expect(assertPublicUrl(u)).rejects.toThrow();
    });

  test("공개 IP 리터럴은 통과한다", async () => {
    await expect(assertPublicUrl("https://93.184.216.34/a")).resolves.toBeInstanceOf(URL);
  });

  test("사설 주소로 리다이렉트되면 따라가지 않는다", async () => {
    const f = vi.fn().mockResolvedValueOnce(
      new Response(null, { status: 302, headers: { location: "http://127.0.0.1/admin" } }),
    );
    await expect(fetchPage("https://93.184.216.34/", f)).rejects.toMatchObject({
      failure: { kind: "blocked" },
    });
    expect(f).toHaveBeenCalledTimes(1);
  });

  test("응답이 크기 한도를 넘으면 중단한다", async () => {
    const f = vi.fn().mockResolvedValue(html("a".repeat(MAX_BYTES + 1)));
    await expect(fetchPage("https://93.184.216.34/", f)).rejects.toBeInstanceOf(FetchPageError);
  });

  test("4xx/5xx는 상태 코드를 담아 실패한다", async () => {
    const f = vi.fn().mockResolvedValue(new Response("no", { status: 403 }));
    await expect(fetchPage("https://93.184.216.34/", f)).rejects.toMatchObject({
      failure: { kind: "http", status: 403 },
    });
  });
});

describe("변환", () => {
  const page = `<html><head><title>테스트 글</title><meta name="author" content="한하나"></head>
    <body><article><h1>테스트 글</h1><p>${"본문 문장입니다. ".repeat(30)}</p></article></body></html>`;

  test("제목·저자·Markdown을 돌려준다", async () => {
    const r = await convertUrl("https://93.184.216.34/a", vi.fn().mockResolvedValue(html(page)));
    expect(r).toMatchObject({ ok: true, title: "테스트 글", author: "한하나" });
    expect(r.ok && r.markdown).toContain("본문 문장입니다.");
  });

  test("본문이 비면 원인을 구분한 오류를 돌려준다", async () => {
    const r = await convertUrl("https://93.184.216.34/a", vi.fn().mockResolvedValue(html("<html><body></body></html>")));
    expect(r).toMatchObject({ ok: false, title: "본문을 찾지 못했어요" });
  });

  test("가져오기 실패는 HTTP 코드를 안내한다", async () => {
    const r = await convertUrl("https://93.184.216.34/a", vi.fn().mockResolvedValue(new Response("", { status: 403 })));
    expect(r).toMatchObject({ ok: false, title: "페이지를 가져오지 못했어요" });
    expect(!r.ok && r.message).toContain("403");
  });
});

describe("입력·파일명", () => {
  test("URL 형식 검사", () => {
    expect(isValidHttpUrl("https://example.com/a")).toBe(true);
    expect(isValidHttpUrl("example.com")).toBe(false);
    expect(isValidHttpUrl("ftp://example.com")).toBe(false);
  });

  test("파일명에서 쓸 수 없는 문자를 제거한다", () => {
    expect(markdownFilename('a/b:c*d?"e<f>g|h', "https://x.com")).toBe("abcdefgh.md");
  });
  test("제목이 없으면 도메인을 쓴다", () => {
    expect(markdownFilename("  ", "https://velog.io/@a/b")).toBe("velog.io.md");
  });
});

describe("LLM 전달", () => {
  test("프롬프트가 있으면 빈 줄을 두고 붙이고, 비면 붙이지 않는다", () => {
    expect(composeMessage("요약해줘", "본문")).toBe("요약해줘\n\n본문");
    expect(composeMessage("   ", "본문")).toBe("본문");
  });
  test("짧으면 URL에 채운다", () => {
    const p = planHandoff("claude", "요약해줘", "안녕");
    expect(p).toEqual({ mode: "url", url: `https://claude.ai/new?q=${encodeURIComponent("요약해줘\n\n안녕")}` });
  });
  test("길면 본문 전체를 클립보드로, URL에는 본문을 넣지 않는다", () => {
    const md = "가".repeat(5000);
    const p = planHandoff("chatgpt", "", md);
    expect(p.mode).toBe("clipboard");
    if (p.mode === "clipboard") {
      expect(p.text).toBe(md);
      expect(p.url.length).toBeLessThan(URL_LIMIT);
      expect(p.url).not.toContain("%EA");
    }
  });
});
