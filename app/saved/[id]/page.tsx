import { notFound, redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { DeleteArticleButton } from "@/features/saved-articles/components/delete-article-button";
import { ResultView } from "@/features/url-to-markdown/components/result-view";
import { createClient } from "@/lib/server";

export default async function SavedArticlePage({ params }: PageProps<"/saved/[id]">) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims) redirect(`/auth/login?next=${encodeURIComponent(`/saved/${id}`)}`);

  // RLS 때문에 다른 사용자의 글은 없는 글과 똑같이 보인다.
  const { data: article } = await supabase
    .from("saved_articles")
    .select("id, title, author, domain, source_url, markdown")
    .eq("id", id)
    .maybeSingle();
  if (!article) notFound();

  return (
    <main className="flex-1">
      <AppShell heading="저장한 글">
        <ResultView
          title={article.title}
          author={article.author}
          domain={article.domain}
          markdown={article.markdown}
          pageUrl={article.source_url}
          panelAction={
            <DeleteArticleButton
              id={article.id}
              title={article.title || article.domain}
              redirectTo="/saved"
              className="w-full"
            />
          }
        />
      </AppShell>
    </main>
  );
}
