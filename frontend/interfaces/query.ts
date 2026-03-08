export type QueryParameters = {
    username?: string;
    page?: number;
    pageSize?: number;
    keyword?: string;
    visibility?: "all" | "public" | "private";
    labels?: string[];
    startDate?: string;
    endDate?: string;
}