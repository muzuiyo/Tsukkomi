"use client";
import HomeHeader from "@/components/homeHeader";
import MemosEditCard from "@/components/memosEditCard";
import ScrollToTop from "@/components/scrollToTop";
import MemosList, { MemosListRef } from "@/components/memosList";
import { useAuth } from "@/contexts/authContext";
import SearchBar from "@/components/searchBar";
import HomeFooter from "@/components/homeFooter";
import { useToast } from "@/contexts/toastContext";
import { createMemos } from "@/lib/api/memos";
import { useRef } from "react";
import { QueryParameters } from "@/interfaces/query";
import { useSearchParams } from "next/navigation";

interface MemosPageProps {
  isNotFound: boolean
}

const MemosPage = ({ isNotFound }: MemosPageProps) => {
  const { currentUser, authLoading } = useAuth();
  const { showToast } = useToast();
  const listRef = useRef<MemosListRef>(null);
  const searchParams = useSearchParams();
  const toNumber = (v: string | null) => v && !Number.isNaN(Number(v)) ? Number(v) : undefined;
  const query: QueryParameters = {
    username: searchParams.get("username")?.trim() || undefined,
    page: toNumber(searchParams.get("page")),
    pageSize: toNumber(searchParams.get("pageSize")),
    keyword: searchParams.get("keyword")?.trim() || undefined,
    visibility: (searchParams.get("visibility") as "all" | "public" | "private") || "all",
    labels: searchParams.getAll("label").map(l => l.trim()).filter(Boolean),
    startDate: searchParams.get("startDate")?.trim() || undefined,
    endDate: searchParams.get("endDate")?.trim() || undefined,
  }

  const preMemo = {
    id: undefined,
    content: "",
    isPublic: 1 as 0 | 1,
    labels: [] as string[],
  };
  if (!authLoading) {
    return (
      <div className="card-main memos-page-container">
        <div className="header-container">
          <HomeHeader user={currentUser} />
          <SearchBar
            query={query}
          />
        </div>
        <div className="main-container">
          {currentUser && (
            <MemosEditCard
              memo={preMemo}
              onSave={async (preMemo) => {
                try {
                  await createMemos({
                    content: preMemo.content,
                    isPublic: preMemo.isPublic,
                    labels: preMemo.labels,
                  });
                  listRef.current?.refresh();
                  showToast("发布成功", "success", 2000);
                } catch (err) {
                  if (err instanceof Error) {
                    console.log(err.message);
                  }
                  showToast("发布失败", "error", 2000);
                }
              }}
            />
          )}
          {
            isNotFound ?
              <>
                <div className="not-found">
                  <p>你来到了没有知识的荒原~</p>
                  <p>- 404 Not Found -</p>
                </div>
              </>
            : <>
              <MemosList query={query} ref={listRef} />
            </>
          }
        </div>
        <div className="footer-container">
          <HomeFooter />
        </div>
        <ScrollToTop />
      </div>
    );
  } else {
    return <></>;
  }
};

export default MemosPage;
