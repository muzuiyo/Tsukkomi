import Link from "next/link";

const NotFoundPage = () => {
  return (
    <div className="card-main memos-page-container">
      <div className="main-container">
        <div className="not-found">
          <p>你来到了没有知识的荒原~</p>
          <p>- 404 Not Found -</p>
          <Link href="/memos" style={{ color: "var(--button-bg)", marginTop: "12px", display: "inline-block" }}>
            返回首页
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
