export interface UserResponse {
    id: string;
    email: string;
    name: string;
    photo: string | null;
    role: string;
}

export interface LoginInput {
    email: string;
    password: string;
}
