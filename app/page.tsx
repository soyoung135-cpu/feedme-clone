import { AppShell } from "@/components/app-shell";
import { Converter } from "@/features/url-to-markdown/components/converter";

export default function Home() {
  return (
    <main className="flex-1">
      <AppShell
        heading="URL → Markdown"
        description="웹 페이지 본문을 Markdown으로 바꿔 AI에게 바로 넘깁니다"
      >
        <Converter />
      </AppShell>
    </main>
  );
}
