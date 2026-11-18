"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/client";

import { saveArticle, type ArticleToSave } from "../save-article";

export function SaveButton({ article }: { article: ArticleToSave }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      const outcome = await saveArticle(createClient(), article);
      if (outcome === "signed-out") {
        toast("로그인하면 저장할 수 있어요", {
          action: {
            label: "로그인",
            onClick: () => router.push("/auth/login?next=/"),
          },
        });
      } else if (outcome === "updated") {
        toast.success("이미 저장한 글이라 최신 내용으로 갱신했어요");
      } else {
        toast.success("저장했어요");
      }
    } catch {
      toast.error("저장하지 못했어요. 잠시 후 다시 시도해 주세요");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Button size="sm" className="w-full" onClick={save} disabled={saving}>
      {saving ? "저장 중…" : "저장"}
    </Button>
  );
}
