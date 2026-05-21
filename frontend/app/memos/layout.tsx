import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "笔记列表",
  description: "浏览 Tsukkomi 上的公开笔记，支持关键词搜索、标签筛选、时间范围过滤。",
  openGraph: {
    title: "笔记列表 | Tsukkomi",
    description: "浏览 Tsukkomi 上的公开笔记，支持关键词搜索、标签筛选、时间范围过滤。",
  },
};

export default function MemosLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
