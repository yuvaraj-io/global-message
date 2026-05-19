export type User = {
  id: string;
  username: string;
  email?: string;
  avatar: string;
  bio: string;
  followersCount: number;
  followingCount: number;
  createdAt: string;
};

export type Post = {
  id: string;
  content: string;
  repliesCount: number;
  createdAt: string;
  user: User;
};

export type Reply = {
  id: string;
  clientId?: string;
  content: string;
  postId: string;
  parentReplyId: string | null;
  createdAt: string;
  user: User;
};

export type Message = {
  id: string;
  clientId?: string;
  senderId: string;
  receiverId: string;
  content: string;
  delivered?: boolean;
  seen: boolean;
  pending?: boolean;
  createdAt: string;
};

export type Conversation = {
  user: User;
  latest: Message;
  unread: number;
};

export type Discussion = {
  id: string;
  title: string;
  content: string;
  repliesCount: number;
  createdAt: string;
  latestActivityAt: string;
};
