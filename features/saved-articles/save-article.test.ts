import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, test, vi } from "vitest";

import { saveArticle } from "./save-article";

const article = {
  sourceUrl: "https://example.com/a",
  title: "제목",
  author: "",
  domain: "example.com",
  markdown: "본문",
};

function fakeClient(opts: { user: { id: string } | null; existing?: boolean; upsertError?: boolean }) {
  const upsert = vi.fn().mockResolvedValue({ error: opts.upsertError ? new Error("x") : null });
  const client = {
    auth: { getUser: async () => ({ data: { user: opts.user } }) },
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({ data: opts.existing ? { id: "1" } : null, error: null }),
        }),
      }),
      upsert,
    }),
  } as unknown as SupabaseClient;
  return { client, upsert };
}

describe("saveArticle", () => {
  test("로그인하지 않았으면 저장하지 않는다", async () => {
    const { client, upsert } = fakeClient({ user: null });
    await expect(saveArticle(client, article)).resolves.toBe("signed-out");
    expect(upsert).not.toHaveBeenCalled();
  });

  test("처음 저장하면 saved, 사용자와 주소 기준으로 upsert 한다", async () => {
    const { client, upsert } = fakeClient({ user: { id: "u1" } });
    await expect(saveArticle(client, article)).resolves.toBe("saved");
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: "u1", source_url: article.sourceUrl, markdown: "본문" }),
      { onConflict: "user_id,source_url" },
    );
  });

  test("이미 저장한 주소면 updated", async () => {
    const { client } = fakeClient({ user: { id: "u1" }, existing: true });
    await expect(saveArticle(client, article)).resolves.toBe("updated");
  });

  test("저장 오류는 던진다", async () => {
    const { client } = fakeClient({ user: { id: "u1" }, upsertError: true });
    await expect(saveArticle(client, article)).rejects.toThrow();
  });
});
