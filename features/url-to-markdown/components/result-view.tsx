import { Card } from "@/components/ui/card";

import { ExportPanel } from "./export-panel";
import { MarkdownView } from "./markdown-view";

type Props = {
  title: string;
  author: string;
  domain: string;
  markdown: string;
  pageUrl: string;
  /** 내보내기 패널에 덧붙이는 action (저장, 삭제 등). 조합은 상위에서 한다. */
  panelAction?: React.ReactNode;
};

/** 변환 결과와 저장한 글 보기가 같은 구성을 쓴다. */
export function ResultView({ title, author, domain, markdown, pageUrl, panelAction }: Props) {
  return (
    <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_272px]">
      {/* 좁은 화면에서는 패널이 결과 위로 올라간다 */}
      <div className="order-2 min-w-0 lg:order-1">
        <Card className="gap-0 py-0">
          <div className="border-b px-5 py-4">
            <h2 className="text-xl leading-snug font-semibold">{title || domain}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {author && `${author} · `}
              <a
                href={pageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-4"
              >
                {domain}
              </a>
            </p>
          </div>
          <MarkdownView markdown={markdown} />
        </Card>
      </div>
      <div className="order-1 lg:order-2">
        <ExportPanel markdown={markdown} title={title} pageUrl={pageUrl}>
          {panelAction}
        </ExportPanel>
      </div>
    </div>
  );
}
