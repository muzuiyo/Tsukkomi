import { apiFetch } from "./fetch";

// 只获取当前用户的标签数据
export function getUserLabels(username: string): Promise<[{
    name: string,
    count: number
}]> {
    return apiFetch(`/labels?username=${username}`, {
        method: "GET"
    });
}