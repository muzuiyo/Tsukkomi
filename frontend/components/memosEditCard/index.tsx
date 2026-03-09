"use client";
import { useState } from "react";
import "./memosEditCard.css";
import MDEditor, { commands } from "@uiw/react-md-editor";
import { useToast } from "@/contexts/toastContext";
import rehypeSanitize from "rehype-sanitize";

interface EditableMemosCardProps {
  memo: {
    id: string | undefined;
    content: string;
    labels: string[];
    isPublic: 0 | 1;
  };
  onSave: (updated: {
    id: string | undefined;
    content: string;
    isPublic: 0 | 1;
    labels: string[];
  }) => Promise<void>;
  onCancel?: () => void;
}

const MemosEditCard = ({ memo, onSave, onCancel }: EditableMemosCardProps) => {
  const [content, setContent] = useState(memo?.content || "");
  const [labels, setLabels] = useState(memo?.labels.join(" ") || "");
  const [isLoading, setIsLoading] = useState(false);
  const [isPublic, setIsPublic] = useState<1 | 0>(memo?.isPublic || 1);
  const { showToast } = useToast();
  // 空格分隔标签
  return (
    <div className="memos-edit-card">
      <div className="memos-edit-card-textarea" style={{ padding: "5px" }}>
        <MDEditor
          value={content}
          previewOptions={{
            rehypePlugins: [[rehypeSanitize]],
          }}
          onChange={(val) => val !== undefined && setContent(val)}
          preview="edit"
          extraCommands={[commands.codeEdit, commands.codePreview]}
          height={onCancel ? undefined : 140}
          visibleDragbar={true}
          textareaProps={{
            placeholder: "现在在做什么？"
          }}
          style={{
            background: "var(--card-bg)",
            boxShadow: "none",
          }}
        ></MDEditor>
      </div>
      <div
        className="memos-edit-card-tags-container"
        style={{
          padding: "5px",
        }}
      >
        <div style={{height: "100%", display: "flex", alignItems: "center", color: "var(--text-secondary)"}}>
          标签
        </div>
        <div style={{flex: 1}}>
          <input
            className="memos-edit-card-tags-input"
            type="text"
            placeholder="使用空格分隔标签"
            value={labels}
            onChange={(e) => setLabels(e.target.value)}
          />
        </div>
      </div>
      <div
        className="memos-edit-card-bottombar"
        style={{ padding: "5px" }}
      >
        <div className="memos-edit-card-bottombar-setting">
          <div>隐私设置</div>
          <label className="radio-item">
            <input type="radio" name={`visibility-${memo?.id}`} checked={isPublic === 1} onChange={() => {setIsPublic(1)}}/>
            <span>向全站公开</span>
          </label>
          <label className="radio-item">
            <input type="radio" name={`visibility-${memo?.id}`} checked={isPublic === 0} onChange={() => {setIsPublic(0)}}/>
            <span>仅自己可见</span>
          </label>
        </div>
        <div className="memos-edit-card-bottombar-button">
          {
            onCancel && (
              <button className="cancle-button" disabled={isLoading} onClick={() => {
                onCancel();
              }}>取消</button>
            )
          }
          <button className="send-button"  disabled={isLoading} onClick={async () => {
            if(!content) {
              showToast("内容不能为空", "error");
              return;
            }
            setIsLoading(true);
            onSave({
              id: memo?.id || undefined,
              content: content,
              isPublic: isPublic,
              labels: labels.trim().split(/\s+/).filter(Boolean) || []
            }).then(() => {
              setContent("");
              setIsPublic(1);
              setLabels("");
              setIsLoading(false);
            })
          }}>发布！</button>
        </div>
      </div>
    </div>
  );
};

export default MemosEditCard;
