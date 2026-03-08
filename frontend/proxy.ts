import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const url = request.nextUrl;
  // 根路径重定向到 /memos
  if(pathname === "/") {
    return NextResponse.redirect(new URL("/memos", request.url));
  }

  // 忘记密码页检查 token
  if (pathname === "/auth/forgot") {
    const token = url.searchParams.get("token"); // 从 URL ?token=xxx 获取
    if (!token) {
      // 如果没有 token，重定向到 /memos
      return NextResponse.redirect(new URL("/memos", request.url));
    }
  }

  if(pathname === "/memos") {
    const pageStr = url.searchParams.get("page");
    const pageSizeStr = url.searchParams.get("pageSize");
    const visibility = url.searchParams.get("visibility");
    const startDate = url.searchParams.get("startDate");
    const endDate = url.searchParams.get("endDate");

    const page = Number(pageStr);
    const pageSize = Number(pageSizeStr);

    // 日期是否合法函数
    const isValidDate = (dateStr: string) => {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
      const [y, m, d] = dateStr.split("-").map(Number);
      const date = new Date(y, m - 1, d);
      return (
        date.getFullYear() === y &&
        date.getMonth() === m - 1 &&
        date.getDate() === d
      );
    };

    // 校验
    if (
      (pageStr && (isNaN(page) || page < 1)) ||
      (pageSizeStr && (isNaN(pageSize) || pageSize < 1 || pageSize > 20)) ||
      (visibility && !["all", "public", "private"].includes(visibility)) ||
      (startDate && !isValidDate(startDate)) ||
      (endDate && !isValidDate(endDate))
    ) {
      return NextResponse.redirect(new URL("/404", request.url));
    }

    if(startDate && endDate && startDate > endDate) {
      return NextResponse.redirect(new URL("/404", request.url));
    }
  }

  if(pathname === "/auth") {
    try {
      // 手动构建 authMe 中间件不支持 credentials: "include"
      const cookie = request.headers.get('cookie');
      if(cookie) {
        const res = await fetch(`${apiBaseUrl}/auth/me`, {
          headers: {
            "Content-Type": "application/json",
            "Cookie": cookie,
          },
        });
        const data = await res.json();
        console.log(cookie);
        if(!data.success) {
          return NextResponse.next();
        }
      }
      else {
        return NextResponse.next();
      }
      return NextResponse.redirect(new URL("/memos", request.url));
    } catch(err: unknown) {
      if(err instanceof Error) {
        console.log("验证失败: " + err.message);
      }
      // TODO 清空 Cookie
      const response = NextResponse.next();
      response.cookies.set("sessionId", "", {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        maxAge: 0
      });
      return response;
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: "/:path*",
};