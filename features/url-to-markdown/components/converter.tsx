"use client";

import { useState } from "react";
import { FileTextIcon } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Field, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

import { isValidHttpUrl } from "../url-input";
import { ExportPanel } from "./export-panel";
import { MarkdownView } from "./markdown-view";
import { ThemeToggle } from "./theme-toggle";

type Result = { title: string; author: string; markdown: string; domain: string; url: string };
type State =
  | { kind: "empty" }
  | { kind: "loading" }
  | { kind: "error"; title: string; message: string }
  | { kind: "result"; result: Result };

export function Converter() {
  const [url, setUrl] = useState("");
  const [inputError, setInputError] = useState(false);
  const [state, setState] = useState<State>({ kind: "empty" });
  // 지우기·새 변환 때 내보내기 패널(프롬프트 선택)을 새로 시작하기 위한 키
  const [session, setSession] = useState(0);

  const loading = state.kind === "loading";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const value = url.trim();
    if (!isValidHttpUrl(value)) {
      setInputError(true);
      return;
    }
    setInputError(false);
    setSession((n) => n + 1);
    setState({ kind: "loading" });
    try {
      const res = await fetch("/api/convert", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: value }),
      });
      const data = await res.json();
      if (!res.ok) {
        setState({ kind: "error", title: data.title, message: data.message });
        return;
      }
      setState({ kind: "result", result: { ...data, url: value } });
    } catch {
      setState({
        kind: "error",
        title: "페이지를 가져오지 못했어요",
        message: "서버에 연결하지 못했어요. 네트워크를 확인하고 다시 시도해 주세요.",
      });
    }
  }

  function clear() {
    setUrl("");
    setInputError(false);
    setSession((n) => n + 1);
    setState({ kind: "empty" });
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-5 px-4 py-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">URL → Markdown</h1>
          <p className="text-sm text-subtitle">
            웹 페이지 본문을 Markdown으로 바꿔 AI에게 바로 넘깁니다
          </p>
        </div>
        <ThemeToggle />
      </header>

      <form onSubmit={submit} noValidate>
        <Field data-invalid={inputError || undefined}>
          <div className="flex flex-wrap gap-2">
            <Input
              className="min-w-0 flex-1"
              aria-label="웹 페이지 URL"
              placeholder="https://example.com/article"
              autoComplete="off"
              value={url}
              aria-invalid={inputError}
              onChange={(e) => {
                setUrl(e.target.value);
                setInputError(false);
              }}
            />
            <Button type="submit" disabled={loading}>
              {loading ? "변환 중…" : "변환"}
            </Button>
            <Button type="button" variant="outline" onClick={clear}>
              지우기
            </Button>
          </div>
          {inputError && (
            <FieldError>http:// 또는 https://로 시작하는 주소를 입력해 주세요.</FieldError>
          )}
        </Field>
      </form>

      {state.kind === "empty" && (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FileTextIcon />
            </EmptyMedia>
            <EmptyTitle>변환할 페이지 주소를 붙여넣으세요</EmptyTitle>
            <EmptyDescription>
              블로그 글, 뉴스 기사, 문서 페이지처럼 본문이 있는 페이지에서 잘 동작해요.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}

      {state.kind === "loading" && (
        <Card className="gap-3 p-5" aria-busy="true" aria-label="변환 중">
          <Skeleton className="h-6 w-3/5" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-4" />
          <Skeleton className="h-4 w-11/12" />
          <Skeleton className="h-4 w-4/5" />
        </Card>
      )}

      {state.kind === "error" && (
        <Alert variant="destructive">
          <AlertTitle>{state.title}</AlertTitle>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}

      {state.kind === "result" && (
        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_272px]">
          {/* 좁은 화면에서는 패널이 결과 위로 올라간다 */}
          <div className="order-2 min-w-0 lg:order-1">
            <Card className="gap-0 py-0">
              <div className="border-b px-5 py-4">
                <h2 className="text-xl leading-snug font-semibold">
                  {state.result.title || state.result.domain}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {state.result.author && `${state.result.author} · `}
                  {state.result.domain}
                </p>
              </div>
              <MarkdownView markdown={state.result.markdown} />
            </Card>
          </div>
          <div className="order-1 lg:order-2">
            <ExportPanel
              key={session}
              markdown={state.result.markdown}
              title={state.result.title}
              pageUrl={state.result.url}
            />
          </div>
        </div>
      )}
    </div>
  );
}
