"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

import { markdownFilename } from "../filename";
import { planHandoff, SERVICE_LABEL, type LlmService } from "../llm-handoff";

const PRESETS = ["요약해줘", "한국어로 번역해줘", "쉽게 설명해줘"];
const CUSTOM = "직접 입력";

type Props = {
  markdown: string;
  title: string;
  pageUrl: string;
  children?: React.ReactNode;
};

export function ExportPanel({ markdown, title, pageUrl, children }: Props) {
  const [chip, setChip] = useState<string | null>(null);
  const [custom, setCustom] = useState("");

  const prompt = chip === CUSTOM ? custom : (chip ?? "");

  async function copy() {
    try {
      await navigator.clipboard.writeText(markdown);
      toast.success("Markdown을 클립보드에 복사했어요");
    } catch {
      toast.error("복사하지 못했어요. 브라우저 권한을 확인해 주세요");
    }
  }

  function download() {
    const name = markdownFilename(title, pageUrl);
    const href = URL.createObjectURL(
      new Blob([markdown], { type: "text/markdown;charset=utf-8" }),
    );
    const a = Object.assign(document.createElement("a"), { href, download: name });
    a.click();
    URL.revokeObjectURL(href);
    toast.success(`${name} 저장됨`);
  }

  // 클립보드 쓰기와 새 탭 열기는 같은 클릭 안에서 await 없이 처리한다.
  function openIn(service: LlmService) {
    const plan = planHandoff(service, prompt, markdown);
    window.open(plan.url, "_blank", "noopener,noreferrer");
    if (plan.mode === "url") return;
    navigator.clipboard.writeText(plan.text).then(
      () => toast.success("클립보드에 복사했어요. 채팅 입력창에 붙여넣으세요"),
      () => toast.error("클립보드에 복사하지 못했어요. 복사하기를 먼저 눌러 주세요"),
    );
  }

  return (
    <Card className="lg:sticky lg:top-4">
      <CardContent className="flex flex-col gap-4">
        <section className="flex flex-col gap-2">
          <h3 className="text-xs font-medium text-muted-foreground">내보내기</h3>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1" onClick={copy}>
              복사하기
            </Button>
            <Button variant="outline" size="sm" className="flex-1" onClick={download}>
              .md 다운로드
            </Button>
          </div>
          {children}
        </section>
        <Separator />
        <section className="flex flex-col gap-2">
          <h3 className="text-xs font-medium text-muted-foreground">
            AI로 보내기 · 프롬프트 (선택)
          </h3>
          <ToggleGroup
            variant="outline"
            size="sm"
            spacing={1}
            className="flex-wrap"
            aria-label="프롬프트"
            value={chip ? [chip] : []}
            onValueChange={(v) => setChip(v[0] ?? null)}
          >
            {[...PRESETS, CUSTOM].map((p) => (
              <ToggleGroupItem key={p} value={p} className="rounded-full">
                {p}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          {chip === CUSTOM && (
            <Input
              autoFocus
              aria-label="직접 입력 프롬프트"
              placeholder="프롬프트를 입력하세요 (저장되지 않아요)"
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
            />
          )}
          {(["chatgpt", "claude"] as const).map((s) => (
            <Button key={s} onClick={() => openIn(s)}>
              {SERVICE_LABEL[s]}로 열기
            </Button>
          ))}
        </section>
      </CardContent>
    </Card>
  );
}
