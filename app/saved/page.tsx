import { BookmarkIcon } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { DeleteArticleButton } from "@/features/saved-articles/components/delete-article-button";
import { createClient } from "@/lib/server";

export default async function SavedPage() {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims) redirect("/auth/login?next=%2Fsaved");

  // 목록에는 본문을 싣지 않는다.
  const { data: articles, error } = await supabase
    .from("saved_articles")
    .select("id, title, author, domain, saved_at")
    .order("saved_at", { ascending: false });

  return (
    <main className="flex-1">
      <AppShell heading="저장한 글">
        {error ? (
          <p role="alert" className="text-sm text-destructive">
            저장한 글을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.
          </p>
        ) : articles.length === 0 ? (
          <Empty className="border border-dashed">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <BookmarkIcon />
              </EmptyMedia>
              <EmptyTitle>아직 저장한 글이 없어요</EmptyTitle>
              <EmptyDescription>
                변환한 글을 저장하면 여기에서 다시 볼 수 있어요.
              </EmptyDescription>
            </EmptyHeader>
            <Link href="/" className={buttonVariants({ variant: "outline" })}>
              변환하러 가기
            </Link>
          </Empty>
        ) : (
          <ul className="flex flex-col gap-3">
            {articles.map((a) => (
              <li key={a.id}>
                <Card className="flex-row items-center gap-3 px-5 py-4">
                  <Link href={`/saved/${a.id}`} className="min-w-0 flex-1">
                    <p className="truncate font-medium">{a.title || a.domain}</p>
                    <p className="truncate text-sm text-muted-foreground">
                      {a.author && `${a.author} · `}
                      {a.domain} ·{" "}
                      {new Date(a.saved_at).toLocaleDateString("ko-KR")}
                    </p>
                  </Link>
                  <DeleteArticleButton id={a.id} title={a.title || a.domain} />
                </Card>
              </li>
            ))}
          </ul>
        )}
      </AppShell>
    </main>
  );
}
