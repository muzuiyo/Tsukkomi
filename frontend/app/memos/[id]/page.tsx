"use client";
import HomeHeader from "@/components/homeHeader";
import MemosEditCard from "@/components/memosEditCard";
import ScrollToTop from "@/components/scrollToTop";
import SearchBar from "@/components/searchBar";
import HomeFooter from "@/components/homeFooter";
import MemosCard from "@/components/memosCard";
import { useAuth } from "@/contexts/authContext";
import { useToast } from "@/contexts/toastContext";
import { createMemos, deleteMemos, getMemosById } from "@/lib/api/memos";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { QueryParameters } from "@/interfaces/query";
import siteConfig from "@/site.config";
import { Memos } from "@/interfaces/memos";
import SkeletonCard from "@/components/skeletonCard";

const SingleMemoPage = () => {
  const { currentUser, authLoading } = useAuth();
  const { showToast } = useToast();
  const pathname = usePathname(); // 当前地址
  const memoId = pathname.split("/").pop(); // 假设 URL 是 /memos/:id
  const [memo, setMemo] = useState<Memos | null>();
  const [loading, setLoading] = useState(true);

  const query: QueryParameters = {
    username: undefined,
    page: 1,
    pageSize: siteConfig.pageSize,
    keyword: "",
    visibility: "all",
    labels: [],
    startDate: undefined,
    endDate: undefined,
  };

  const preMemo = {
    id: undefined,
    content: "",
    isPublic: 1 as 0 | 1,
    labels: [] as string[],
  };

  useEffect(() => {
    const fetchMemo = async () => {
      if (!memoId) return;
      setLoading(true);
      try {
        const data = await getMemosById(memoId);
        setMemo(data);
      } catch (err: unknown) {
        if(err instanceof Error) {
          console.error(err);
        }
        setMemo(null);
      } finally {
        setLoading(false);
      }
    };
    fetchMemo();
  }, [memoId]);

  const handleDelete = async (id: string) => {
    try {
      await deleteMemos(id);
      setMemo(null);
      showToast("删除成功", "success", 2000);
    } catch (err: unknown) {
      if(err instanceof Error) {
        console.error(err);
      }
      showToast("删除失败", "error", 2000);
    }
  };

  const handleSave = async (newMemo: {
    id: string | undefined;
    content: string;
    isPublic: 0 | 1;
    labels: string[];
  }) => {
    try {
      await createMemos({
        content: newMemo.content,
        isPublic: newMemo.isPublic,
        labels: newMemo.labels,
      });
      showToast("发布成功", "success", 2000);
      // 重新加载当前 memo
      if (memoId) {
        const data = await getMemosById(memoId);
        setMemo(data || null);
      }
    } catch (err: unknown) {
      if(err instanceof Error) {
        console.error(err);
      }
      showToast("发布失败", "error", 2000);
    }
  };

  if (authLoading) return <></>;

  return (
    <div className="card-main memos-page-container">
      <div className="header-container">
        <HomeHeader user={currentUser} />
        <SearchBar query={query} />
      </div>

      <div className="main-container">
        {currentUser && (
          <MemosEditCard memo={preMemo} onSave={handleSave} />
        )}

        {loading ? (
          <SkeletonCard />
        ) : memo ? (
          <MemosCard
            memos={memo}
            canEdit={currentUser?.id === memo.userId}
            onDelete={() => handleDelete(memo.id)}
            keyword={query.keyword || ""}
          />
        ) : (
          <div className="not-found">
            <p>你来到了没有知识的荒原~</p>
            <p>- 不存在的笔记 -</p>
          </div>
        )}
      </div>
      <div className="footer-container">
        <HomeFooter />
      </div>
      <ScrollToTop />
    </div>
  );
};

export default SingleMemoPage;