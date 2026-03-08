"use client";
import { useAuth } from "@/contexts/authContext";
import "./searchBar.css";
import { QueryParameters } from "@/interfaces/query";
import { useState, useEffect, useRef } from "react";
import { buildQueryString, parseQuery } from "@/lib/queryParser";
import { useRouter } from "next/navigation";

interface SearchBarProps {
  query: QueryParameters;
  onChange?: (query: QueryParameters) => void;
}

const SearchBar = ({ query }: SearchBarProps) => {
  const { currentUser } = useAuth();

  const [searchContent, setSearchContent] = useState("");
  const [isOnlyUser, setIsOnlyUser] = useState(
    query.username === currentUser?.username
  );

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [startDate, setStartDate] = useState(query.startDate || "");
  const [endDate, setEndDate] = useState(query.endDate || "");

  const datePickerRef = useRef<HTMLDivElement | null>(null);

  const router = useRouter();

  const labels = query.labels ?? [];

  const removeLabel = (label: string) => {
    const newQuery = { ...query };

    if (Array.isArray(newQuery.labels)) {
      newQuery.labels = newQuery.labels.filter((l) => l !== label);
      if (newQuery.labels.length === 0) {
        delete newQuery.labels;
      }
    } else {
      delete newQuery.labels;
    }

    const params = buildQueryString(newQuery);
    router.push(`/memos?${params}`);
  };

  useEffect(() => {
    setSearchContent(() => {
      const parts: string[] = [];

      // 日期
      if (query.startDate) parts.push(`startDate:${query.startDate}`);
      if (query.endDate) parts.push(`endDate:${query.endDate}`);

      // 用户名
      if (query.username) parts.push(`username:${query.username}`);

      // 标签
      if (query.labels && query.labels.length > 0) {
        query.labels.forEach(label => {
          parts.push(`label:${label}`);
        });
      }

      // 关键词
      if (query.keyword) parts.push(query.keyword);

      return parts.join(" ").trim() + (parts.length > 0 ? " " : "");
    });

    setStartDate(query.startDate || "");
    setEndDate(query.endDate || "");
    setIsOnlyUser(query.username === currentUser?.username);
  }, [query, currentUser]);

  const syncDateTokens = () => {
    setSearchContent((prev) => {
      const content = prev
        .replace(/\bstartDate:\S+\b/g, "")
        .replace(/\bendDate:\S+\b/g, "")
        .replace(/\s+/g, " ")
        .trim();

      const prefix: string[] = [];

      if (startDate) {
        prefix.push(`startDate:${startDate}`);
      }

      if (endDate) {
        prefix.push(`endDate:${endDate}`);
      }

      if (prefix.length === 0) {
        return content;
      }

      return `${prefix.join(" ")} ${content}`.trim() + " ";
    });
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showDatePicker &&
        datePickerRef.current &&
        !datePickerRef.current.contains(event.target as Node)
      ) {
        setShowDatePicker(false);
        syncDateTokens();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showDatePicker, startDate, endDate]);

  return (
    <div className="searchbar-container">
      <div className="searchbar-main">
        <div className="search-input-wrapper">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="search-icon"
          >
            <path d="m21 21-4.34-4.34" />
            <circle cx="11" cy="11" r="8" />
          </svg>

          <input
            className="search-input"
            type="text"
            placeholder="搜索...visibility:all..."
            value={searchContent}
            onChange={(e) => setSearchContent(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                const queryParams = parseQuery(searchContent);
                const params = buildQueryString(queryParams);
                router.push(`/memos?${params}`);
              }
            }}
          />
        </div>

        <button
          className="search-button"
          onClick={(e) => {
            e.preventDefault();
            const queryParams = parseQuery(searchContent);
            const params = buildQueryString(queryParams);
            router.push(`/memos?${params}`);
          }}
        >
          搜索
        </button>
      </div>

      <div className="searchbar-toolbar">
        <div className="toolbar-filters">
          <div className="filter-item date-filter">
            <span className="filter-label">日期: </span>
            <span
              className="filter-value"
              onClick={() => setShowDatePicker(!showDatePicker)}
            >
              {startDate || endDate
                ? `${startDate || "..."} ~ ${endDate || "..."}`
                : "所有时间"}
            </span>

            {showDatePicker && (
              <div ref={datePickerRef} className="date-picker-popover">
                <div className="date-picker-row">
                  <label>开始</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      const v = e.target.value;
                      setStartDate(v);
                    }}
                  />
                </div>

                <div className="date-picker-row">
                  <label>结束</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => {
                      const v = e.target.value;
                      setEndDate(v);
                    }}
                  />
                </div>

                <div className="date-picker-actions">
                  <button
                    onClick={() => {
                      setStartDate("");
                      setEndDate("");
                      syncDateTokens();
                    }}
                  >
                    清除
                  </button>
                  <button
                    onClick={() => {
                      setShowDatePicker(false);
                      syncDateTokens();
                    }}
                  >
                    确定
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        {currentUser && (
          <div className="toolbar-right">
            <label className="checkbox-wrapper">
              <input
                type="checkbox"
                checked={isOnlyUser}
                onChange={(e) => {
                  const checked = e.target.checked;
                  if (!currentUser) return;

                  const usernameToken = `username:${currentUser.username}`;

                  if (checked) {
                    // 插入到最前面，如果已经存在就不插入
                    if (
                      !new RegExp(`(^|\\s)${usernameToken}(?=$|\\s)`).test(
                        searchContent,
                      )
                    ) {
                      setSearchContent(
                        (prev) => (usernameToken + " " + prev).trim() + " ",
                      );
                    }
                  } else {
                    // 移除 token
                    const tokenRegex = new RegExp(
                      `(^|\\s)${usernameToken}(?=$|\\s)`,
                      "g",
                    );
                    setSearchContent((prev) => {
                      const newContent = prev
                        .replace(tokenRegex, "")
                        .replace(/\s+/g, " ")
                        .trim();
                      return newContent ? newContent + " " : "";
                    });
                  }

                  // 更新状态
                  setIsOnlyUser(checked);
                }}
              />
              <span>只看自己</span>
            </label>
          </div>
        )}
      </div>
      {/* 添加标签列表，如果有搜索label，则显示标签列表 */}
      {labels.length > 0 && (
        <div className="label-list">
          <span style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
            标签:{" "}
          </span>
          {labels.map((label) => (
            <div key={label} className="label-chip">
              <span className="label-text">{label}</span>

              <button
                className="label-remove"
                onClick={() => removeLabel(label)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchBar;