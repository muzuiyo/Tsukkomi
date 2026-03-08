"use client";
import MemosHeader from "./memosHeader";
import MemosFooter from "./memosFooter";
import MemosEditCard from "../memosEditCard";
import { Memos } from "@/interfaces/memos";
import "./memosCard.css";
import MDEditor from "@uiw/react-md-editor";
import { toPng } from "html-to-image";
import { useEffect, useRef, useState } from "react";
import { updateMemos } from "@/lib/api/memos";
import { useToast } from "@/contexts/toastContext";

interface Props {
  memos: Memos;
  canEdit: boolean;
  onDelete: (id: string) => Promise<void>;
}

const MAX_HEIGHT = 100;

const MemosCard = ({ memos, canEdit, onDelete }: Props) => {
  const [memosData, setMemosData] = useState(memos);
  const [isEditing, setIsEditing] = useState(false);
  const [collapsed, setCollapsed] = useState(true);
  const [needCollapse, setNeedCollapse] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();

  // 同步 props & 判断是否折叠
  useEffect(() => {
    setMemosData(memos);
    if (contentRef.current) {
      const height = contentRef.current.scrollHeight;
      setNeedCollapse(height > MAX_HEIGHT);
    }
  }, [memos]);

  const handleOnEdit = () => {
    setIsEditing(true);
  };

  const handleDownloadImage = async () => {
    if (!cardRef.current) return;
    const screenElement = cardRef.current.cloneNode(true) as HTMLElement;
    // 展开卡片
    const markdownWrapper = screenElement.querySelector(".markdown-wrapper");
    if (markdownWrapper) {
      markdownWrapper.classList.remove("collapsed");
      const el = markdownWrapper as HTMLElement;
      el.style.maxHeight = "none";
      el.style.overflow = "visible";
      el.style.position = "static";
    }

    const collapseBtn = screenElement.querySelector(".collapse-btn");
    collapseBtn?.remove();

    const statusElement = screenElement.querySelector(".memos-status");
    if (statusElement) {
      const rp = document.createElement("div");
      statusElement.replaceWith(rp);
    }

    const infoElement = screenElement.querySelector(".memos-action-btn");
    if (infoElement) {
      const newInfoElement = document.createElement("div");
      newInfoElement.style.fontSize = "0.9em";
      newInfoElement.style.color = "var(--text-secondary)";
      newInfoElement.innerHTML = "Tsukkomi 笔记";
      infoElement.replaceWith(newInfoElement);
    }

    const container = document.createElement("div");
    container.style.position = "absolute";
    container.style.left = "-9999px";
    container.style.top = "0";
    container.style.width = "750px";
    container.style.zIndex = "-1";

    const sc = document.createElement("div");
    sc.style.padding = "10px";
    sc.style.background = "var(--background)";
    sc.appendChild(screenElement);

    container.appendChild(sc);
    document.body.appendChild(container);

    try {
      const dataUrl = await toPng(sc, {
        includeQueryParams: true,
        filter: (node) => {
          if(node.nodeName === 'IMG') {
            (node as HTMLImageElement ).src = `/api/proxy?url=${encodeURIComponent((node as HTMLImageElement ).src)}`;
          };
          if(node.nodeName === 'A') {
            (node as HTMLAnchorElement ).href = `/api/proxy?url=${encodeURIComponent((node as HTMLAnchorElement ).href)}`;
          }
          return true;
        },
        quality: 0.95,
        pixelRatio: 2,
        skipFonts: true,
      });

      const link = document.createElement("a");
      link.download = `memo-${memosData.id || "card"}.png`;
      link.href = dataUrl;
      link.click();
    } finally {
      // 确保清理 DOM
      document.body.removeChild(container);
    }
  };
  const wrapperClass = `
    markdown-wrapper 
    ${needCollapse && collapsed ? "collapsed" : ""}
  `;
  return isEditing ? (
    <MemosEditCard
      key={memosData.id}
      memo={memosData}
      onSave={async (update) => {
        try {
          const res = await updateMemos(update.id!, {
            content: update.content,
            isPublic: update.isPublic,
            labels: update.labels,
          });

          setMemosData(res);
          setCollapsed(true);
          showToast("发布成功", "success", 2000);
        } catch (err: unknown) {
          if (err instanceof Error) {
            console.log(err.message);
            showToast("发布失败", "error", 2000);
          }
        } finally {
          setIsEditing(false);
        }
      }}
      onCancel={() => setIsEditing(false)}
    />
  ) : (
    <div className="memos-card" ref={cardRef}>
      <MemosHeader
        createdAt={memosData.createdAt}
        isPublic={memosData.isPublic}
      />

      <div className="memos-body">
        <div ref={contentRef} className={wrapperClass}>
          <MDEditor.Markdown
            source={memosData.content}
            style={{ background: "var(--card-bg)" }}
          />
        </div>

        {needCollapse && (
          <button
            className="collapse-btn"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? "展开" : "收起"}
          </button>
        )}
      </div>

      <MemosFooter
        memos={memosData}
        canEdit={canEdit}
        onScreenshoot={handleDownloadImage}
        onDelete={onDelete}
        onEdit={handleOnEdit}
      />
    </div>
  );
};

export default MemosCard;
