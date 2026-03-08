"use client";
import { User } from "@/interfaces/user";
import "./homeHeader.css";
import siteConfig from "@/site.config";
import Link from "next/link";
import { useAuth } from "@/contexts/authContext";
import { useConfirm } from "../confirm";
interface HeaderProps {
  user: User | null,
}

const HomeHeader = ({ user }: HeaderProps) => {
  const { logout } = useAuth();
  const tconfirm = useConfirm();
  return (
    <div className="home-header">
      <div className="header-title-container">
        <div className="header-title">
          <Link href={"/memos"}>{siteConfig.siteInfo.title}</Link>
        </div>
        <div className="header-subtitle">{siteConfig.siteInfo.subTitle}</div>
      </div>
      <div className="header-settings">
        {user ? (
          <>
            <Link href={`/profile/${user.username}`}>
              <div className="header-settings-content">
                <div style={{ display: "flex", alignItems: "center" }}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-user-cog-icon lucide-user-cog"
                  >
                    <path d="M10 15H6a4 4 0 0 0-4 4v2" />
                    <path d="m14.305 16.53.923-.382" />
                    <path d="m15.228 13.852-.923-.383" />
                    <path d="m16.852 12.228-.383-.923" />
                    <path d="m16.852 17.772-.383.924" />
                    <path d="m19.148 12.228.383-.923" />
                    <path d="m19.53 18.696-.382-.924" />
                    <path d="m20.772 13.852.924-.383" />
                    <path d="m20.772 16.148.924.383" />
                    <circle cx="18" cy="15" r="3" />
                    <circle cx="9" cy="7" r="4" />
                  </svg>
                </div>
                <div>&nbsp;个人页面</div>
              </div>
            </Link>
            <span style={{alignContent: "center"}}> / </span>
            {/* TODO 设置页 */}
            {/* <Link href={`/settings`}>
              <div className="header-settings-content">
                <div style={{ display: "flex", alignItems: "center" }}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-settings-icon lucide-settings"
                  >
                    <path d="M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </div>
                <div>&nbsp;设置</div>
              </div>
            </Link>
            <span style={{alignContent: "center"}}> / </span> */}
            <div className="logout-link" onClick={async () => {
              // 登出账号
              if(await tconfirm("确认登出账号吗？")) {
                logout();
              }
            }}>
              <div className="header-settings-content">
                <div style={{ display: "flex", alignItems: "center" }}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-log-out-icon lucide-log-out"
                  >
                    <path d="m16 17 5-5-5-5" />
                    <path d="M21 12H9" />
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  </svg>
                </div>
                <div>&nbsp;登出</div>
              </div>
            </div>
          </>
        ) : (
          <Link href={`/auth`}>
            <div className="header-settings-content">
              <div style={{ display: "flex", alignItems: "center" }}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-door-closed-icon lucide-door-closed"
                >
                  <path d="M10 12h.01" />
                  <path d="M18 20V6a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v14" />
                  <path d="M2 20h20" />
                </svg>
              </div>
              <div>&nbsp;去登录</div>
            </div>
          </Link>
        )}
      </div>
    </div>
  );
};

export default HomeHeader;
