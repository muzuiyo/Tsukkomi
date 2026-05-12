// 对外暴露 session 类型, 供其他模块使用
export interface Session {
  id: string;
  userId: string;
  expiresAt: string;
}
