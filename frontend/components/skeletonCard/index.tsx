'use client'
import "./skeletonCard.css";

const SkeletonCard = () => {
  return (
    <div className="memos-card skeleton-card">
      {/* Header */}
      <div className="memos-header">
        <div className="skeleton skeleton-date" />
        <div className="skeleton skeleton-status" />
      </div>

      {/* Body */}
      <div className="memos-body">
        <div className="skeleton skeleton-line w-90" />
        <div className="skeleton skeleton-line w-100" />
        <div className="skeleton skeleton-line w-80" />
      </div>

      {/* Footer */}
      <div className="memos-footer">
        <div className="memos-labels">
          <div className="skeleton skeleton-label" />
          <div className="skeleton skeleton-label" />
        </div>

        <div className="memos-meta-row">
          <div className="skeleton skeleton-username" />
          <div className="skeleton skeleton-icon" />
        </div>
      </div>
    </div>
  );
};

export default SkeletonCard;