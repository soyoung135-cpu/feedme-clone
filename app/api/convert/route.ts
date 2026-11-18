import { convertUrl } from "@/features/url-to-markdown/server/convert-url";
import { isValidHttpUrl } from "@/features/url-to-markdown/url-input";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const url = typeof body?.url === "string" ? body.url.trim() : "";
  if (!isValidHttpUrl(url)) {
    return Response.json(
      { title: "주소 형식이 올바르지 않아요", message: "http:// 또는 https://로 시작하는 주소를 입력해 주세요." },
      { status: 400 },
    );
  }
  const result = await convertUrl(url);
  if (!result.ok) {
    return Response.json({ title: result.title, message: result.message }, { status: result.status });
  }
  const data = { title: result.title, author: result.author, markdown: result.markdown, domain: result.domain };
  return Response.json(data);
}
