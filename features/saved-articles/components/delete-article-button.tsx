"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/client";

type Props = {
  id: string;
  title: string;
  /** 삭제한 뒤 이동할 주소. 없으면 현재 화면을 새로 고친다. */
  redirectTo?: string;
  className?: string;
};

export function DeleteArticleButton({ id, title, redirectTo, className }: Props) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function remove() {
    setDeleting(true);
    const { error } = await createClient().from("saved_articles").delete().eq("id", id);
    setDeleting(false);
    if (error) {
      toast.error("삭제하지 못했어요. 잠시 후 다시 시도해 주세요");
      return;
    }
    toast.success("삭제했어요");
    if (redirectTo) router.push(redirectTo);
    router.refresh();
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={
          <Button variant="outline" size="sm" className={className}>
            삭제
          </Button>
        }
      />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>저장한 글을 삭제할까요?</AlertDialogTitle>
          <AlertDialogDescription>
            「{title || "제목 없음"}」을 삭제하면 되돌릴 수 없어요.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>취소</AlertDialogCancel>
          <AlertDialogAction onClick={remove} disabled={deleting}>
            삭제
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
