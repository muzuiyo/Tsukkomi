"use client";
import HomeHeader from "@/components/homeHeader";
import SearchBar from "@/components/searchBar";
import HomeFooter from "@/components/homeFooter";
import { useAuth } from "@/contexts/authContext";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { QueryParameters } from "@/interfaces/query";
import siteConfig from "@/site.config";
import { User } from "@/interfaces/user";
import "./page.profile.css";
import { getUserByUsername } from "@/lib/api/auth";
import { getHeatmapData } from "@/lib/api/memos";
import CalendarHeatmap, { ReactCalendarHeatmapValue } from "react-calendar-heatmap";
import "react-calendar-heatmap/dist/styles.css";
import { Tooltip } from "react-tooltip";
import "react-tooltip/dist/react-tooltip.css";
import { useRouter } from "next/navigation";
import LabelItem from "@/components/labelItem";
import { getUserLabels } from "@/lib/api/labels";
import Link from "next/link";

const UserPage = () => {
  const { currentUser, authLoading } = useAuth();
  const pathname = usePathname(); // 当前地址
  const username = pathname.split("/").pop(); // 假设 URL 是 /memos/:id
  const [loading, setLoading] = useState(true);
  const [pageUser, setPageUser] = useState<User | null>();
  const [labelsList, setLabelsList] = useState<{ name: string, count: number }[]>([])
  const [heatmapData, setHeatmapData] = useState<
    { date: string; count: number }[]
  >([]);
  const router = useRouter();
  
  const [startDate, setStartDate] = useState<Date>(
    new Date(new Date().setFullYear(new Date().getFullYear() - 1)) // 默认 12 个月
  );

  // 自适应热力图时期范围
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 768) {
        // 最近 5 个月
        setStartDate(
          new Date(new Date().setMonth(new Date().getMonth() - 5))
        );
      } else {
        setStartDate(
          new Date(new Date().setFullYear(new Date().getFullYear() - 1))
        );
      }
    };
    // 初始化
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const query: QueryParameters = {
    username: undefined,
    page: 1,
    pageSize: siteConfig.pageSize,
    keyword: "",
    visibility: "all",
    labels: [],
    startDate: undefined,
    endDate: undefined,
  };

  // 页面加载时获取 pageUser
  useEffect(() => {
    if (!username) return;
    const fetchUserAndHeatmapAndLabels = async () => {
      setLoading(true);
      try {
        const user = await getUserByUsername(username);
        setPageUser(user);
        const data = await getHeatmapData({ username });
        setHeatmapData(data);
        const labelsData = await getUserLabels(username);
        setLabelsList(labelsData);
      } catch (err: unknown) {
        if(err instanceof Error) {
          console.error(err);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchUserAndHeatmapAndLabels();
  }, [username]);

  if(authLoading || loading) return <></>;
  return (
    <div className="card-main memos-page-container">
      <div className="header-container">
        <HomeHeader user={currentUser} />
        <SearchBar query={query} />
      </div>
      <div className="main-container">
        {loading ? (
          <></>
        ) : (
          pageUser ? (<>
            <div className="user-info">
              @<span>{pageUser.username}</span> {new Date(pageUser.createdAt).toLocaleDateString()} 加入
            </div>
            <div className="heatmap-container">
              <div>
                <CalendarHeatmap
                  startDate={
                    startDate
                  }
                  endDate={new Date()}
                  values={heatmapData}
                  gutterSize={3}
                  showWeekdayLabels={true}
                  weekdayLabels={["日", "一", "二", "三", "四", "五", "六"]}
                  monthLabels={[
                    "1月",
                    "2月",
                    "3月",
                    "4月",
                    "5月",
                    "6月",
                    "7月",
                    "8月",
                    "9月",
                    "10月",
                    "11月",
                    "12月",
                  ]}
                  classForValue={(value: ReactCalendarHeatmapValue<string> | undefined) => {
                    if (!value || value.count === 0) return "color-empty";
                    if (value.count >= 12) return "color-scale-4";
                    if (value.count >= 9) return "color-scale-3";
                    if (value.count >= 6) return "color-scale-2";
                    return "color-scale-1";
                  }}
                  onClick={(value: ReactCalendarHeatmapValue<string> | undefined) => {
                    if(value) {
                      router.push(`/memos?username=${pageUser?.username}&startDate=${value.date}&endDate=${value.date}`);
                    }
                  }}
                  tooltipDataAttrs={(value: ReactCalendarHeatmapValue<string> | undefined) => {
                    if (!value || !value.date) return {} as React.HTMLAttributes<SVGElement>
                    return {
                      "data-tooltip-id": "heatmap-tooltip",
                      "data-tooltip-content": `${value.count} posts · ${new Date(value.date).toLocaleDateString()}`,
                    } as React.HTMLAttributes<SVGElement>;
                  }}
                />
              </div>
              <div className="heatmap-title">
                <div className="heatmap-summary">
                  {heatmapData.reduce((sum, d) => sum + (d.count || 0), 0)}{" "}
                  public posts in the last year
                </div>
                <div className="heatmap-legend">
                  <span>Less</span>
                  <span className="legend-box color-empty"></span>
                  <span className="legend-box color-scale-1"></span>
                  <span className="legend-box color-scale-2"></span>
                  <span className="legend-box color-scale-3"></span>
                  <span className="legend-box color-scale-4"></span>
                  <span>More</span>
                </div>
              </div>
            </div>
            <div className="user-labels-container">
              <div className="user-labels-title">
                @{pageUser.username} 将笔记标注为
              </div>
              <div className="user-labels-list">
                {
                  labelsList.map((l, index) => (
                    <LabelItem key={index} labelName={l.name} count={l.count} username={pageUser.username} />
                  ))
                }
              </div>
            </div>
            <div className="goto-user-memos">
              <Link href={`/memos?username=${pageUser.username}`}>
                <span>
                  {`> 去看 TA 的笔记`}
                </span>
              </Link>
            </div>
          </>) : <div className="not-found">
            <p>你来到了没有知识的荒原~</p>
            <p>- 不存在的用户 -</p>
          </div>
        )}
      </div>
      <div className="footer-container">
        <HomeFooter />
      </div>
      <Tooltip id="heatmap-tooltip" place="top" />
    </div>
  );
};

export default UserPage;
