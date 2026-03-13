import type { UserResponse } from './auth.js';

export interface PostResponse {
  id: string;
  title: string;
  slug: string;
  content: string;
  published: boolean;
  thumbnail: string;
  thumbnailId: string;
  author: UserResponse;
  createdAt: string;
  updatedAt: string;
}

export interface PostSummaryResponse {
  id: string;
  title: string;
  slug: string;
  published: boolean;
  thumbnail: string;
  author: UserResponse;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePostInput {
  title: string;
  content: string;
  published: boolean;
  thumbnail?: string;
}

export interface UpdatePostInput {
  title?: string;
  content?: string;
  published?: boolean;
  thumbnail?: string;
}
