/** 페이지 제목에서 파일명에 쓸 수 없는 문자를 제거한다. 제목이 없으면 도메인을 쓴다. */
export function markdownFilename(title: string, pageUrl: string): string {
  const cleaned = title
    .replace(/[\/:*?"<>|\x00-\x1f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[. ]+$/, "")
    .slice(0, 100)
    .trim();
  if (cleaned) return `${cleaned}.md`;
  let host = "page";
  try {
    host = new URL(pageUrl).hostname;
  } catch {}
  return `${host}.md`;
}
