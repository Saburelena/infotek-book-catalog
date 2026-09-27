import type { UserRole } from "@/shared/config/constants";

export type AuthUser = {
  id: number;
  username: string;
  role: UserRole;
};

export type Pagination = {
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
};

export type AuthorShort = {
  id: number;
  full_name: string;
};

export type BookShort = {
  id: number;
  title: string;
  year: number;
};

export type Book = {
  id: number;
  title: string;
  year: number;
  description: string;
  isbn: string;
  cover_url: string;
  authors: AuthorShort[];
};

export type Author = {
  id: number;
  full_name: string;
  books: BookShort[];
};

export type TopAuthor = {
  rank: number;
  author_id: number;
  full_name: string;
  books_count: number;
};

export type ErrorItem = {
  field: string;
  message: string;
};

export type ListPayload<T> = {
  items: T[];
  pagination: Pagination;
};

export type LoginResponse = {
  token: string;
  expires_at: string;
  user: AuthUser;
};

export type BookListParams = {
  page?: number;
  perPage?: number;
  search?: string;
  year?: number;
  author_id?: number;
};

export type AuthorListParams = {
  page?: number;
  perPage?: number;
  search?: string;
};
