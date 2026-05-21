import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tsukkomi 备忘录",
  description: "浏览 Tsukkomi 上的笔记，支持关键词搜索、标签筛选、时间范围过滤。",
  openGraph: {
    title: "Tsukkomi 备忘录",
    description: "浏览 Tsukkomi 上的笔记，支持关键词搜索、标签筛选、时间范围过滤。",
  },
};

export default function MemosLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
