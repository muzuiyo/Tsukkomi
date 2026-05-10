// Proxy
// 来源：https://github.com/bubkoo/html-to-image/issues/466#issuecomment-2291802276
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");

  if (!url) {
    return NextResponse.json(
      { error: "Missing URL parameter" },
      { status: 400 }
    );
  }

  // SSRF protection: validate URL
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    return NextResponse.json(
      { error: "Invalid URL" },
      { status: 400 }
    );
  }

  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    return NextResponse.json(
      { error: "Only HTTP and HTTPS protocols are allowed" },
      { status: 400 }
    );
  }

  // Block private/internal IP ranges
  const hostname = parsedUrl.hostname;
  const isPrivateIP =
    /^127\./.test(hostname) ||
    /^10\./.test(hostname) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(hostname) ||
    /^192\.168\./.test(hostname) ||
    /^169\.254\./.test(hostname) ||
    hostname === "localhost" ||
    hostname === "0.0.0.0" ||
    hostname === "::1" ||
    hostname === "[::1]";

  if (isPrivateIP) {
    return NextResponse.json(
      { error: "Access to internal addresses is not allowed" },
      { status: 400 }
    );
  }

  try {
    const imageResponse = await fetch(url);

    if (!imageResponse.ok) {
      return NextResponse.json(
        { error: "Failed to fetch image" },
        { status: imageResponse.status }
      );
    }

    const contentType = imageResponse.headers.get("Content-Type");
    const arrayBuffer = await imageResponse.arrayBuffer();

    return new NextResponse(arrayBuffer, {
      headers: {
        "Content-Type": contentType || "application/octet-stream",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Error proxying image:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}