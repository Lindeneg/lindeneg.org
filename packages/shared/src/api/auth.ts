import type { MaybeNull } from '../types.js';

export interface UserResponse {
  id: string;
  email: string;
  name: string;
  photo: MaybeNull<string>;
  role: string;
}

export interface LoginInput {
  email: string;
  password: string;
}
