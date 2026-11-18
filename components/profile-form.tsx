"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/client";

export function ProfileForm({ initialName, userId }: { initialName: string; userId: string }) {
  const [name, setName] = useState(initialName);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setStatus("saving");
    const { data, error } = await createClient()
      .from("profiles")
      .update({ display_name: name.trim() || null })
      .eq("id", userId)
      .select();
    // RLS 로 막히면 오류 없이 0행이 갱신되므로 행 수도 확인한다.
    setStatus(error || data?.length !== 1 ? "error" : "saved");
  }

  return (
    <form onSubmit={save} className="flex flex-col gap-3">
      <Label htmlFor="display-name">표시 이름</Label>
      <Input
        id="display-name"
        value={name}
        onChange={(e) => {
          setName(e.target.value);
          setStatus("idle");
        }}
      />
      <Button type="submit" disabled={status === "saving"}>
        {status === "saving" ? "저장 중…" : "저장"}
      </Button>
      {status === "saved" && <p role="status" className="text-sm text-muted-foreground">저장했어요</p>}
      {status === "error" && <p role="alert" className="text-sm text-destructive">저장하지 못했어요</p>}
    </form>
  );
}
