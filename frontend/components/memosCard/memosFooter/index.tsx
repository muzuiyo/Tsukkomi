'use client'
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useToast } from "@/contexts/toastContext";
import Link from "next/link";
import { Memos } from "@/interfaces/memos";
import { useConfirm } from "@/components/confirm";

interface Props {
  memos: Memos;
  canEdit: boolean,
  onScreenshoot: () => Promise<void>,
  onDelete: (id: string) => Promise<void>,
  onEdit: () => void
}

const MemosFooter = ({ memos, canEdit, onScreenshoot, onDelete, onEdit }: Props) => {
  // 同 CSS min-width 保持同步
  const MENU_WIDTH = 130;
  const MENU_HEIGHT = canEdit ? 160 : 80;
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  const buttonRef = useRef<HTMLButtonElement>(null);
  const { showToast } = useToast();
  const tconfirm = useConfirm();

  const updatePosition = () => {
    if (!buttonRef.current) return;

    const rect = buttonRef.current.getBoundingClientRect();

    const spaceBelow = window.innerHeight - rect.bottom;
    const openUp = spaceBelow < MENU_HEIGHT;

    const top = openUp
      ? rect.top - MENU_HEIGHT - 6
      : rect.bottom + 6;

    let left = rect.right - MENU_WIDTH;

    if (left + MENU_WIDTH > window.innerWidth) {
      left = window.innerWidth - MENU_WIDTH - 8;
    }

    setPosition({ top, left });
  };

  const handleToggle = () => {
    updatePosition();
    setOpen(prev => !prev);
  };

  // 点击外部关闭
  useEffect(() => {
    const handleClick = () => setOpen(false);

    if (open) {
      document.addEventListener("click", handleClick);
    }

    return () => {
      document.removeEventListener("click", handleClick);
    };
  }, [open]);

  // 监听滚动和 resize 更新位置
  useEffect(() => {
    if (!open) return;

    const update = () => updatePosition();

    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);

    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <div className="memos-footer">
      {memos.labels.length > 0 && (
        <div className="memos-labels">
          {memos.labels.map((label) => (
            <Link key={label} href={`/memos?label=${label}`}>
              <span className="memos-label">
                # {label}
              </span>
            </Link>
          ))}
        </div>
      )}
      <div className="memos-meta-row">
        <div className="memos-username">
          @<Link href={`/profile/${memos.username}`}>{memos.username}</Link>
        </div>
        <button
          ref={buttonRef}
          className="memos-action-btn"
          onClick={(e) => {
            e.stopPropagation();
            handleToggle();
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="1" />
            <circle cx="19" cy="12" r="1" />
            <circle cx="5" cy="12" r="1" />
          </svg>
        </button>
        {open &&
          createPortal(
            <div
              className="memos-dropdown-menu fixed"
              style={{
                top: position.top,
                left: position.left,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {canEdit && (
                <button
                  className="dropdown-item"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit();
                    setOpen(false);
                  }}
                >
                  编辑
                </button>
              )}
              <button
                className="dropdown-item"
                onClick={(e) => {
                  e.stopPropagation();
                  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
                  const path = `/memos/${memos.id}`;
                  try {
                    navigator.clipboard.writeText(baseUrl + path);
                    showToast("复制成功", "success", 2000);
                  } catch (err: unknown) {
                    showToast("复制失败", "error", 2000);
                    if (err instanceof Error) {
                      console.log(err.message || "复制笔记链接失败");
                    } else {
                      console.log("复制笔记链接失败");
                    }
                  } finally {
                    setOpen(false);
                  }
                }}
              >
                复制链接
              </button>
              <button
                className="dropdown-item"
                onClick={async (e) => {
                  e.stopPropagation();
                  setOpen(false);
                  try {
                    await onScreenshoot();
                    showToast("图片已生成", "success", 2000);
                  } catch (err: unknown) {
                    showToast("图片生成失败", "error", 2000);
                    if (err instanceof Error) {
                      console.log(err.message || "图片生成失败");
                    } else {
                      console.log("图片生成失败");
                    }
                  }
                }}
              >
                分享图片
              </button>
              {canEdit && (
                <button
                  className="dropdown-item danger"
                  onClick={async (e) => {
                    e.stopPropagation();
                    try {
                      const ok = await tconfirm("确认删除吗，这条笔记会消失很久很久(真的很久！)");
                      if(!ok) return;
                      await onDelete(memos.id);
                      showToast("删除笔记成功", "success", 2000);
                    } catch (err: unknown) {
                      showToast("删除笔记失败", "error", 2000);
                      if (err instanceof Error) {
                        console.log("删除笔记失败: " + err.message);
                      } else {
                        console.log("删除笔记失败");
                      }
                    } finally {
                      setOpen(false);
                    }
                  }}
                >
                  删除
                </button>
              )}
            </div>,
            document.body
          )}
      </div>
    </div>
  );
};

export default MemosFooter;