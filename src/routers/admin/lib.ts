import multer from "multer";
import z from "zod";
import type {Request, Response} from "express";
import type AuthService from "../../services/auth-service.js";
import type PostService from "../../services/post-service.js";
import type TemplateService from "../../services/template-service.js";
import type UserService from "../../services/user-service.js";
import type ContactRepository from "../../repositories/contact-repository.js";
import type NavigationRepository from "../../repositories/navigation-repository.js";
import type NavigationItemRepository from "../../repositories/navigation-item-repository.js";
import type PageRepository from "../../repositories/page-repository.js";
import type PostRepository from "../../repositories/post-repository.js";
import type SectionRepository from "../../repositories/section-repository.js";
import type UserRepository from "../../repositories/user-repository.js";

export type AdminDeps = {
    authService: AuthService;
    userService: UserService;
    postService: PostService;
    templateService: TemplateService;
    userRepo: UserRepository;
    pageRepo: PageRepository;
    sectionRepo: SectionRepository;
    postRepo: PostRepository;
    navigationRepo: NavigationRepository;
    navigationItemRepo: NavigationItemRepository;
    contactRepo: ContactRepository;
};

export const upload = multer({
    storage: multer.memoryStorage(),
    limits: {fileSize: 10 * 1024 * 1024},
});

export const toBool = (v: unknown) => v === "1" || v === "on" || v === "true" || v === true;
export const optStr = (v: unknown) =>
    typeof v === "string" && v.trim() !== "" ? v : undefined;

export function fieldErrors(error: z.ZodError): Record<string, string> {
    const out: Record<string, string> = {};
    for (const issue of error.issues) {
        const key = issue.path.join(".") || "_";
        if (!out[key]) out[key] = issue.message;
    }
    return out;
}

export function bufferToDataUri(file: Express.Multer.File): string {
    return `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;
}

export function send(res: Response, html: string, status = 200) {
    res.status(status).type("html").send(html);
}

export async function loadUser(deps: AdminDeps, req: Request) {
    if (!req.auth) return null;
    const result = await deps.userRepo.get(req.auth.userId);
    return result.ok ? result.data : null;
}
