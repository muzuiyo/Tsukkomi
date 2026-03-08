import { QueryParameters } from "@/interfaces/query";

export function parseQuery(query: string): QueryParameters {
  const result: QueryParameters = {};
  const labels: string[] = [];
  const keywordParts: string[] = [];

  const tokens = query.match(/\S+/g) || [];

  for (const token of tokens) {
    const lower = token.toLowerCase();

    if (lower.startsWith("username:") && result.username === undefined) {
      const value = token.slice(9).trim();
      if (value) {
        result.username = value;
      } else {
        keywordParts.push(token);
      }
    }

    else if (lower.startsWith("page:") && result.page === undefined) {
      const value = token.slice(5).trim();
      const num = parseInt(value, 10);
      if (!isNaN(num) && num > 0) {
        result.page = num;
      } else {
        keywordParts.push(token);
      }
    }

    else if (lower.startsWith("pagesize:") && result.pageSize === undefined) {
      const value = token.slice(9).trim();
      const num = parseInt(value, 10);
      if (!isNaN(num) && num > 0) {
        result.pageSize = num;
      } else {
        keywordParts.push(token);
      }
    }

    else if (lower.startsWith("visibility:") && result.visibility === undefined) {
      const value = token.slice(11).trim().toLowerCase();
      if (["all", "public", "private"].includes(value)) {
        result.visibility = value as QueryParameters["visibility"];
      } else {
        keywordParts.push(token);
      }
    }

    else if (lower.startsWith("label:")) {
      const value = token.slice(6).trim();
      if (value) {
        labels.push(value);
      } else {
        keywordParts.push(token);
      }
    }

    else if (lower.startsWith("startdate:") && result.startDate === undefined) {
      result.startDate = token.slice(10);
    }

    else if (lower.startsWith("enddate:") && result.endDate === undefined) {
      result.endDate = token.slice(8);
    }

    else {
      keywordParts.push(token);
    }
  }

  if (labels.length) {
    result.labels = [...new Set(labels)];
  }

  if (keywordParts.length) {
    result.keyword = keywordParts.join(" ");
  }

  return result;
}

export function buildQueryString(query: QueryParameters): string {
  const params = new URLSearchParams();

  if (query.username) params.set("username", query.username);
  if (query.page !== undefined) params.set("page", query.page.toString());
  if (query.pageSize !== undefined) params.set("pageSize", query.pageSize.toString());
  if (query.keyword) params.set("keyword", query.keyword);
  if (query.visibility) params.set("visibility", query.visibility);

  if (query.labels && query.labels.length > 0) {
    query.labels.forEach(label => params.append("label", label));
  }

  if (query.startDate) params.set("startDate", query.startDate);
  if (query.endDate) params.set("endDate", query.endDate);

  return params.toString();
}