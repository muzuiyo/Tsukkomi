'use client'
interface Props {
  createdAt: string;
  isPublic: 0 | 1;
}

const MemosHeader = ({ createdAt, isPublic }: Props) => {
  const localDate = new Date(createdAt.replace(" ", "T") + "Z");
  const localTime = localDate.toLocaleString();
  return (
    <div className="memos-header">
      <span className="memos-date">
        {localTime}
      </span>
      <span className={`memos-status ${isPublic ? "public" : "private"}`}>
        {isPublic ? "🌏︎ 公开" : "🔒︎ 私密"}
      </span>
    </div>
  );
};

export default MemosHeader;