import type { Metadata } from "next";
import UserPage from "./page.client";

type Props = {
  params: Promise<{ username: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;

  return {
    title: `@${username}`,
    description: `${username} 的个人主页，查看笔记热力图、标签分布和公开笔记。`,
    openGraph: {
      title: `@${username} | Tsukkomi`,
      description: `${username} 的个人主页，查看笔记热力图、标签分布和公开笔记。`,
      type: "profile",
    },
  };
}

export default function Page() {
  return <UserPage />;
}
