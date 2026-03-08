export interface QueryParameters {
    userId?: string | undefined;
    page: number;
    pageSize: number;
    keyword?: string;
    visibility?: "all" | "public" | "private";
    labels?: string[];
    startDate?: string;
    endDate?: string;
    currentUserId?: string | undefined
}