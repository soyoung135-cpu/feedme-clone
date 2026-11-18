import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { ThemeToggle } from "@/features/url-to-markdown/components/theme-toggle";

type Props = {
  heading: string;
  description?: string;
  children: React.ReactNode;
};

const NAV = [
  { href: "/", label: "변환" },
  { href: "/saved", label: "저장한 글" },
  { href: "/settings", label: "계정" },
];

/** 모든 화면이 공유하는 폭, 여백, 헤더 위치. */
export function AppShell({ heading, description, children }: Props) {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-5 px-4 py-6">
      <header className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-lg font-semibold">{heading}</h1>
          {description && <p className="text-sm text-subtitle">{description}</p>}
        </div>
        <nav className="flex items-center gap-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={buttonVariants({ variant: "ghost", size: "sm" })}
            >
              {item.label}
            </Link>
          ))}
          <ThemeToggle />
        </nav>
      </header>
      {children}
    </div>
  );
}
