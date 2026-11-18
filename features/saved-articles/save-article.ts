import type { SupabaseClient } from "@supabase/supabase-js";

export type ArticleToSave = {
  sourceUrl: string;
  title: string;
  author: string;
  domain: string;
  markdown: string;
};

export type SaveOutcome = "saved" | "updated" | "signed-out";

/** 로그인한 사용자의 저장한 글로 남긴다. 같은 주소는 새 항목 없이 갱신한다. */
export async function saveArticle(
  supabase: SupabaseClient,
  article: ArticleToSave,
): Promise<SaveOutcome> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return "signed-out";

  const { data: existing, error: lookupError } = await supabase
    .from("saved_articles")
    .select("id")
    .eq("source_url", article.sourceUrl)
    .maybeSingle();
  if (lookupError) throw lookupError;

  const { error } = await supabase.from("saved_articles").upsert(
    {
      user_id: user.id,
      source_url: article.sourceUrl,
      title: article.title,
      author: article.author,
      domain: article.domain,
      markdown: article.markdown,
      saved_at: new Date().toISOString(),
    },
    { onConflict: "user_id,source_url" },
  );
  if (error) throw error;

  return existing ? "updated" : "saved";
}
