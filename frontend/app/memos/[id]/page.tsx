import type { Metadata } from "next";
import SingleMemoPage from "./page.client";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";

  try {
    const res = await fetch(`${baseUrl}/memos/${id}`, { next: { revalidate: 60 } });
    if (!res.ok) throw new Error("not found");
    const json = await res.json();
    if (!json.success) throw new Error("not found");

    const memo = json.data;
    const title = memo.content.slice(0, 60).replace(/[#*\n]/g, "").trim() || "笔记";
    const description = memo.content.slice(0, 160).replace(/[#*\n]/g, "").trim();

    return {
      title,
      description,
      openGraph: {
        title: `${title} | Tsukkomi`,
        description,
        type: "article",
        authors: [memo.username],
      },
    };
  } catch {
    return { title: "笔记" };
  }
}

export default function Page() {
  return <SingleMemoPage />;
}
