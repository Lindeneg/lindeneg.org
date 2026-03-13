import {
    success,
    emptySuccess,
    failure,
    type Result,
    type EmptyResult,
    type UserResponse,
    type LoginInput,
    type MaybeNull,
} from "@lindeneg/shared";
import type {User} from "@prisma/client";
import type UserRepository from "../repositories/user-repository.js";
import type AuthService from "./auth-service.js";
import type CloudinaryService from "./cloudinary-service.js";

export const UserError = {
    USER_NOT_FOUND: "user_not_found",
    INVALID_CREDENTIALS: "invalid_credentials",
    ADMIN_ALREADY_CREATED: "admin_already_created",
    DB_ERROR: "db_error",
    UPLOAD_ERROR: "upload_error",
} as const;

export type UserError = (typeof UserError)[keyof typeof UserError];

function toUserResponse(user: User): UserResponse {
    return {
        id: user.id,
        email: user.email,
        name: user.name,
        photo: user.photo,
        role: user.role,
    };
}

class UserService {
    constructor(
        private readonly userRepo: UserRepository,
        private readonly authService: AuthService,
        private readonly cloudinary: CloudinaryService
    ) {}

    async login(
        input: LoginInput
    ): Promise<Result<{user: UserResponse; accessToken: string}, UserError>> {
        const userResult = await this.userRepo.getByEmail(input.email);
        if (!userResult.ok) return failure(UserError.DB_ERROR);
        if (!userResult.data) return failure(UserError.INVALID_CREDENTIALS);

        const user = userResult.data;

        const compareResult = await this.authService.comparePassword(input.password, user.password);
        if (!compareResult.ok || !compareResult.data) return failure(UserError.INVALID_CREDENTIALS);

        const tokenResult = this.authService.generateAccessToken({
            userId: user.id,
            name: user.name,
            role: user.role,
        });
        if (!tokenResult.ok) return failure(UserError.DB_ERROR);

        return success({user: toUserResponse(user), accessToken: tokenResult.data});
    }

    async getMe(userId: string): Promise<Result<UserResponse, UserError>> {
        const result = await this.userRepo.get(userId);
        if (!result.ok) return failure(UserError.DB_ERROR);
        if (!result.data) return failure(UserError.USER_NOT_FOUND);

        return success(toUserResponse(result.data));
    }

    async createSuperUserOnce(
        email: string,
        name: string,
        password: string
    ): Promise<Result<UserResponse, UserError>> {
        const hasAdmin = await this.userRepo.hasAdmin();
        if (!hasAdmin.ok) return failure(UserError.DB_ERROR);
        if (hasAdmin.data) return failure(UserError.ADMIN_ALREADY_CREATED);
        const hash = await this.authService.hashPassword(password);
        if (!hash.ok) return failure(UserError.DB_ERROR);
        const result = await this.userRepo.create({
            email,
            name,
            password: hash.data,
            role: "ADMIN",
        });
        if (!result.ok) return failure(UserError.DB_ERROR);
        if (!result.data) return failure(UserError.USER_NOT_FOUND);

        return success(toUserResponse(result.data));
    }

    async getPhoto(userId: string): Promise<Result<MaybeNull<string>, UserError>> {
        const result = await this.userRepo.get(userId);
        if (!result.ok) return failure(UserError.DB_ERROR);
        if (!result.data) return failure(UserError.USER_NOT_FOUND);

        return success(result.data.photo);
    }

    async uploadPhoto(userId: string, image: string): Promise<Result<string, UserError>> {
        const user = await this.userRepo.get(userId);
        if (!user.ok) return failure(UserError.DB_ERROR);
        if (!user.data) return failure(UserError.USER_NOT_FOUND);

        if (user.data.photoId) {
            const deleteResult = await this.cloudinary.delete(user.data.photoId);
            if (!deleteResult.ok) return failure(UserError.UPLOAD_ERROR);
        }

        const uploadResult = await this.cloudinary.upload(image);
        if (!uploadResult.ok) return failure(UserError.UPLOAD_ERROR);

        const updateResult = await this.userRepo.update(userId, {
            photo: uploadResult.data.url,
            photoId: uploadResult.data.publicId,
        });
        if (!updateResult.ok) return failure(UserError.DB_ERROR);

        return success(uploadResult.data.url);
    }

    async deletePhoto(userId: string): Promise<EmptyResult<UserError>> {
        const user = await this.userRepo.get(userId);
        if (!user.ok) return failure(UserError.DB_ERROR);
        if (!user.data) return failure(UserError.USER_NOT_FOUND);

        if (user.data.photoId) {
            const deleteResult = await this.cloudinary.delete(user.data.photoId);
            if (!deleteResult.ok) return failure(UserError.UPLOAD_ERROR);
        }

        const updateResult = await this.userRepo.update(userId, {photo: null, photoId: null});
        if (!updateResult.ok) return failure(UserError.DB_ERROR);

        return emptySuccess();
    }
}

export default UserService;
