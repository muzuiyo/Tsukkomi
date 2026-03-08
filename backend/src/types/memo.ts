export interface Memo {
  id: string;
  userId: string;
  username: string;
  content: string;
  isPublic: 1 | 0;
  createdAt: string;
  labels: string[];
}
