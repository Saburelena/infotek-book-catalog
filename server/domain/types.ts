import { ROLE_USER } from "../constants.js";

export type UserRole = typeof ROLE_USER;

export type DemoUser = {
  id: number;
  username: string;
  password: string;
  role: UserRole;
};

export type AuthorRecord = {
  id: number;
  full_name: string;
};

export type BookRecord = {
  id: number;
  title: string;
  year: number;
  description: string;
  isbn: string;
  cover_url: string;
  author_ids: number[];
};

export type SubscriptionRecord = {
  id: number;
  author_id: number;
  phone: string;
};

export type SmsLogRecord = {
  at: string;
  phone: string;
  text: string;
  ok: boolean;
  response: unknown;
};

export type Store = {
  users: DemoUser[];
  authors: AuthorRecord[];
  books: BookRecord[];
  subscriptions: SubscriptionRecord[];
  smsLog: SmsLogRecord[];
  next: {
    author: number;
    book: number;
    sub: number;
  };
  version?: number;
};

export type RequestUser = {
  id: number;
  username: string;
  role: UserRole;
};

export type FieldError = {
  field: string;
  message: string;
};
