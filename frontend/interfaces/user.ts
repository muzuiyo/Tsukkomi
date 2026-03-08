export type User = {
    id: string,
    username: string,
    role: "user" | "admin",
    createdAt: string
}