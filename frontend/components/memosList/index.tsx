'use client'
import MemosCard from "../memosCard";
import { useAuth } from "@/contexts/authContext";
import { Memos } from "@/interfaces/memos";
import { QueryParameters } from "@/interfaces/query";
import { deleteMemos, getMemos } from "@/lib/api/memos";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useState,
} from "react";
import { useSearchParams } from "next/navigation";
import { useToast } from "@/contexts/toastContext";
import "./memosList.css";
import siteConfig from "@/site.config";
import SkeletonCard from "../skeletonCard";

interface MemosListProps {
  query: QueryParameters;
}

export interface MemosListRef {
  refresh: () => void;
}

const MemosList = forwardRef<MemosListRef, MemosListProps>(({ query }, ref) => {
  const [memosList, setMemosList] = useState<Memos[]>([]);
  const [page, setPage] = useState(query.page ?? 1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const searchParams = useSearchParams();

  const fetchMemosList = useCallback(
    async (currentPage: number, forceFresh = false) => {
      if (isLoading || (!hasMore && !forceFresh)) return;

      setIsLoading(true);

      try {
        const pageSize = query.pageSize ?? siteConfig.pageSize;

        const data = await getMemos({
          ...query,
          page: currentPage,
          pageSize,
        });

        if (currentPage === (query.page ?? 1)) {
          setMemosList(data);
        } else {
          setMemosList((prev) => {
            const map = new Map<string, Memos>();
            [...prev, ...data].forEach((m) => {
              map.set(m.id, m);
            });
            return Array.from(map.values());
          });
        }

        if (data.length < pageSize) {
          setHasMore(false);
        } else {
          setPage(currentPage + 1);
        }
      } catch (err) {
        if (err instanceof Error) {
          console.log("加载笔记列表失败:", err.message);
        }
        showToast("加载笔记列表失败", "error", 2000);
      } finally {
        setIsLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [query, hasMore, isLoading],
  );

  // URL 参数变化时重新加载
  useEffect(() => {
    const startPage = query.page ?? 1;

    setPage(startPage);
    setHasMore(true);
    setMemosList([]);
    setIsInitialLoading(true);

    fetchMemosList(startPage, true).then(() => {
      setIsInitialLoading(false);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useImperativeHandle(ref, () => ({
    refresh() {
      const startPage = query.page ?? 1;

      setPage(startPage);
      setHasMore(true);
      setMemosList([]);
      setIsInitialLoading(true);

      fetchMemosList(startPage, true).then(() => {
        setIsInitialLoading(false);
      });
    },
  }));

  const onDelete = async (id: string): Promise<void> => {
    await deleteMemos(id);
    setMemosList((prev) => prev.filter((memo) => memo.id !== id));
  };

  return (
    <div className="memolist-container">
      {memosList.map((memo) => (
        <MemosCard
          key={memo.id}
          memos={memo}
          canEdit={currentUser?.id === memo.userId}
          onDelete={onDelete}
        />
      ))}

      {hasMore ? (
        <>
          {isLoading || isInitialLoading ? (
            isInitialLoading ? (
              <>
                {Array.from({ length: 20 }).map((_, index) => (
                  <SkeletonCard key={index} />
                ))}
              </>
            ) : (
              <div className="memoslist-more-loading">加载中...</div>
            )
          ) : (
            <>
              {!query?.page && (
                <button
                  onClick={() => fetchMemosList(page)}
                  disabled={isLoading}
                  className="memoslist-load-more"
                >
                  加载更多
                </button>
              )}
            </>
          )}
        </>
      ) : (
        <div className="memoslist-more-loading">-- 没有更多了 --</div>
      )}
    </div>
  );
});

MemosList.displayName = "MemosList";

export default MemosList;