const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${apiBaseUrl}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });

  let data;
  try {
    data = await res.json();
  } catch {
    throw new ApiError("Invalid JSON response", res.status);
  }
  // HTTP 层错误
  if (!res.ok) {
    throw new ApiError(data?.error || "Network Error", res.status, data?.code);
  }

  // 业务层错误
  if (!data.success) {
    throw new ApiError(data?.error || "API Error", res.status, data?.code);
  }

  // 返回纯 data
  return data.data;
}