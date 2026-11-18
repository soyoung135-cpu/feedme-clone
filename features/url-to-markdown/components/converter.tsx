"use client";

import { useRef, useState } from "react";
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

import { SaveButton } from "@/features/saved-articles/components/save-button";

import { isValidHttpUrl } from "../url-input";
import { ResultView } from "./result-view";

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

  // 지우기·새 변환 이후 늦게 도착한 이전 응답을 버리기 위한 요청 번호
  const requestId = useRef(0);

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
    const id = ++requestId.current;
    setState({ kind: "loading" });
    try {
      const res = await fetch("/api/convert", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: value }),
      });
      const data = await res.json();
      if (id !== requestId.current) return;
      if (!res.ok) {
        setState({ kind: "error", title: data.title, message: data.message });
        return;
      }
      setState({ kind: "result", result: { ...data, url: value } });
    } catch {
      if (id !== requestId.current) return;
      setState({
        kind: "error",
        title: "페이지를 가져오지 못했어요",
        message: "서버에 연결하지 못했어요. 네트워크를 확인하고 다시 시도해 주세요.",
      });
    }
  }

  function clear() {
    requestId.current++;
    setUrl("");
    setInputError(false);
    setSession((n) => n + 1);
    setState({ kind: "empty" });
  }

  return (
    <>
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
        <ResultView
          key={session}
          title={state.result.title}
          author={state.result.author}
          domain={state.result.domain}
          markdown={state.result.markdown}
          pageUrl={state.result.url}
          panelAction={
            <SaveButton
              article={{
                sourceUrl: state.result.url,
                title: state.result.title,
                author: state.result.author,
                domain: state.result.domain,
                markdown: state.result.markdown,
              }}
            />
          }
        />
      )}
    </>
  );
}
