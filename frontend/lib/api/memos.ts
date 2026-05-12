import { Memos } from "@/interfaces/memos";
import { apiFetch } from "./fetch";
import { QueryParameters } from "@/interfaces/query";

export function createMemos(data: {
  content: string;
  isPublic: 0 | 1;
  labels: string[];
}) {
  return apiFetch("/memos", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function getMemos(data: QueryParameters): Promise<Memos[]> {
  const params = new URLSearchParams();

  if (data.page !== undefined) {
    params.append("page", String(data.page));
  }

  if (data.pageSize !== undefined) {
    params.append("pageSize", String(data.pageSize));
  }

  if (data.keyword) {
    params.append("keyword", data.keyword);
  }

  if (data.visibility) {
    params.append("visibility", data.visibility);
  }

  if (data.username) {
    params.append("username", data.username);
  }

  if (data.startDate) {
    const utcStart = new Date(data.startDate + "T00:00:00Z");
    const startUTC = new Date(utcStart.getTime() + utcStart.getTimezoneOffset() * 60000);
    params.append("startDate", startUTC.toISOString().slice(0, 19) + "Z");
  }

  if (data.endDate) {
    const utcEnd = new Date(data.endDate + "T00:00:00Z");
    utcEnd.setUTCDate(utcEnd.getUTCDate() + 1);
    const endUTC = new Date(utcEnd.getTime() + utcEnd.getTimezoneOffset() * 60000);
    params.append("endDate", endUTC.toISOString().slice(0, 19) + "Z");
  }

  if (data.labels?.length) {
    data.labels.forEach((label) => {
      params.append("label", label);
    });
  }

  return apiFetch(`/memos?${params.toString()}`, {
    method: "GET",
  });
}

export function getMemosById(id: string): Promise<Memos> {
  return apiFetch(`/memos/${id}`, {
    method: "GET",
  });
}

export function updateMemos(
  id: string,
  data: {
    content: string;
    isPublic: 0 | 1;
    labels: string[];
  },
): Promise<Memos> {
  return apiFetch(`/memos/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function deleteMemos(id: string) {
  return apiFetch(`/memos/${id}`, {
    method: "DELETE",
  });
}

export function deleteMemosBatch(ids: string[]) {
  return apiFetch(`/memos/batch`, {
    method: "DELETE",
    body: JSON.stringify({ ids: ids }),
  });
}

// 八位日期 2000-01-01
export function getHeatmapData(
  data:
    | {
        username: string;
        startDate: string;
        endDate: string;
      }
    | {
        username: string;
        startDate?: string;
        endDate?: string;
      },
): Promise<{
  date: string,
  count: number
}[]> {
  const params = new URLSearchParams({
    username: data.username,
  });

  if (data.startDate && data.endDate) {
    const utcStart = new Date(data.startDate + "T00:00:00Z");
    const startUTC = new Date(utcStart.getTime() + utcStart.getTimezoneOffset() * 60000);
    params.append("startDate", startUTC.toISOString().slice(0, 19) + "Z");
    const utcEnd = new Date(data.endDate + "T00:00:00Z");
    utcEnd.setUTCDate(utcEnd.getUTCDate() + 1);
    const endUTC = new Date(utcEnd.getTime() + utcEnd.getTimezoneOffset() * 60000);
    params.append("endDate", endUTC.toISOString().slice(0, 19) + "Z");
  }
  
  params.append("offsetTime", (new Date().getTimezoneOffset() * 60 * 1000 * -1).toString());

  return apiFetch(`/memos/graph/heatmap?${params.toString()}`, {
    method: "GET",
  });
}
