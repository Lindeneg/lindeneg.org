import {Router, type Request, type Response, type RequestHandler} from "express";
import multer from "multer";
import z from "zod";
import {slugify} from "../lib/slugify.js";
import {parsePagination, toSkipTake} from "../lib/pagination.js";
import type AuthService from "../services/auth-service.js";
import type PostService from "../services/post-service.js";
import type TemplateService from "../services/template-service.js";
import type UserService from "../services/user-service.js";
import type ContactRepository from "../repositories/contact-repository.js";
import type NavigationRepository from "../repositories/navigation-repository.js";
import type NavigationItemRepository from "../repositories/navigation-item-repository.js";
import type PageRepository from "../repositories/page-repository.js";
import type PostRepository from "../repositories/post-repository.js";
import type SectionRepository from "../repositories/section-repository.js";
import type UserRepository from "../repositories/user-repository.js";
import {LoginView} from "../ui/admin/views/login.js";
import {DashboardView} from "../ui/admin/views/dashboard.js";
import {PagesListView} from "../ui/admin/views/pages-list.js";
import {PageFormView} from "../ui/admin/views/page-form.js";
import {SectionFormView} from "../ui/admin/views/section-form.js";
import {BlogListView} from "../ui/admin/views/blog-list.js";
import {PostFormView} from "../ui/admin/views/post-form.js";
import {NavView} from "../ui/admin/views/nav.js";
import {NavItemFormView} from "../ui/admin/views/nav-item-form.js";
import {MessagesListView} from "../ui/admin/views/messages-list.js";
import {SettingsView} from "../ui/admin/views/settings.js";

export type AdminSsrRouterDeps = {
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
    adminAuth: RequestHandler;
};

const toBool = (v: unknown) => v === "1" || v === "on" || v === "true" || v === true;
const optStr = (v: unknown) => (typeof v === "string" && v.trim() !== "" ? v : undefined);

function fieldErrors(error: z.ZodError): Record<string, string> {
    const out: Record<string, string> = {};
    for (const issue of error.issues) {
        const key = issue.path.join(".") || "_";
        if (!out[key]) out[key] = issue.message;
    }
    return out;
}

function bufferToDataUri(file: Express.Multer.File): string {
    return `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;
}

const LoginSchema = z.object({
    email: z.email("Enter a valid email"),
    password: z.string().min(1, "Required"),
});

const PageSchema = z.object({
    name: z.string().min(1, "Required"),
    slug: z.string().optional(),
    title: z.string().min(1, "Required"),
    description: z.string().default(""),
    published: z.unknown().transform(toBool),
});

const SectionSchema = z.object({
    content: z.string().min(1, "Required"),
    position: z.coerce.number().int().min(0, "Must be ≥ 0"),
    published: z.unknown().transform(toBool),
});

const PostSchema = z.object({
    title: z.string().min(1, "Required"),
    content: z.string().min(1, "Required"),
    published: z.unknown().transform(toBool),
});

const NavBrandSchema = z.object({
    brandName: z.string().min(1, "Required"),
});

const NavItemSchema = z.object({
    navigationId: z.string().min(1, "Required"),
    name: z.string().min(1, "Required"),
    href: z.string().min(1, "Required"),
    position: z.coerce.number().int().min(0, "Must be ≥ 0"),
    alignment: z.enum(["LEFT", "RIGHT"]),
    newTab: z.unknown().transform(toBool),
});

export function makeAdminSsrRouter(deps: AdminSsrRouterDeps): Router {
    const router = Router();
    const upload = multer({
        storage: multer.memoryStorage(),
        limits: {fileSize: 10 * 1024 * 1024},
    });

    const send = (res: Response, html: string, status = 200) =>
        res.status(status).type("html").send(html);

    const loadUser = async (req: Request) => {
        if (!req.auth) return null;
        const result = await deps.userRepo.get(req.auth.userId);
        return result.ok ? result.data : null;
    };

    const findSectionWithPage = async (sectionId: string) => {
        const all = await deps.pageRepo.list({});
        if (!all.ok) return null;
        for (const p of all.data.data) {
            const s = p.sections.find((x) => x.id === sectionId);
            if (s) return {page: p, section: s};
        }
        return null;
    };

    router.get("/login", (_req, res) => {
        send(res, LoginView({}));
    });

    router.post("/login", async (req, res) => {
        const parsed = LoginSchema.safeParse(req.body);
        if (!parsed.success) {
            return send(
                res,
                LoginView({error: "Enter a valid email and password", email: optStr(req.body?.email)}),
                400
            );
        }
        const result = await deps.userService.login(parsed.data);
        if (!result.ok) {
            return send(
                res,
                LoginView({error: "Invalid email or password", email: parsed.data.email}),
                401
            );
        }
        deps.authService.setAuthCookies(res, result.data.accessToken);
        res.redirect(302, "/admin");
    });

    router.use(deps.adminAuth);

    router.post("/logout", (_req, res) => {
        deps.authService.clearAuthCookies(res);
        res.redirect(302, "/admin/login");
    });

    router.get("/", async (req, res) => {
        const user = await loadUser(req);
        if (!user) return res.redirect(302, "/admin/login");

        const [pages, posts, messages, unreadList] = await Promise.all([
            deps.pageRepo.list({skip: 0, take: 0}),
            deps.postRepo.list({skip: 0, take: 0}, {}),
            deps.contactRepo.list({skip: 0, take: 0}),
            deps.contactRepo.list({skip: 0, take: 1000}),
        ]);

        const unread = unreadList.ok ? unreadList.data.data.filter((m) => !m.read).length : 0;

        send(
            res,
            DashboardView({
                user,
                currentPath: "/admin",
                counts: {
                    pages: pages.ok ? pages.data.total : 0,
                    posts: posts.ok ? posts.data.total : 0,
                    messages: messages.ok ? messages.data.total : 0,
                    unreadMessages: unread,
                },
            })
        );
    });

    router.get("/pages", async (req, res) => {
        const user = await loadUser(req);
        if (!user) return res.redirect(302, "/admin/login");

        const pagination = parsePagination(req);
        const result = await deps.pageRepo.list(toSkipTake(pagination));
        if (!result.ok) return send(res, "Failed to load pages", 500);

        const totalPages = Math.max(1, Math.ceil(result.data.total / pagination.pageSize));
        send(
            res,
            PagesListView({
                user,
                currentPath: "/admin/pages",
                pages: result.data.data,
                page: pagination.page,
                totalPages,
            })
        );
    });

    router.get("/pages/new", async (req, res) => {
        const user = await loadUser(req);
        if (!user) return res.redirect(302, "/admin/login");
        send(res, PageFormView({user, currentPath: "/admin/pages", mode: "create"}));
    });

    router.post("/pages/new", async (req, res) => {
        const user = await loadUser(req);
        if (!user) return res.redirect(302, "/admin/login");

        const parsed = PageSchema.safeParse(req.body);
        if (!parsed.success) {
            return send(
                res,
                PageFormView({
                    user,
                    currentPath: "/admin/pages",
                    mode: "create",
                    values: req.body,
                    errors: fieldErrors(parsed.error),
                }),
                400
            );
        }

        const data = parsed.data;
        const slug = data.slug && data.slug.trim() !== "" ? slugify(data.slug) : slugify(data.name);

        const result = await deps.pageRepo.create({
            name: data.name,
            slug,
            title: data.title,
            description: data.description,
            published: data.published,
        });
        if (!result.ok) {
            return send(
                res,
                PageFormView({
                    user,
                    currentPath: "/admin/pages",
                    mode: "create",
                    values: req.body,
                    topError: "Failed to create page (name or slug may already exist)",
                }),
                400
            );
        }
        deps.templateService.clearCache();
        res.redirect(302, `/admin/pages/${result.data.id}/edit`);
    });

    router.get("/pages/:id/edit", async (req, res) => {
        const user = await loadUser(req);
        if (!user) return res.redirect(302, "/admin/login");

        const result = await deps.pageRepo.getById(req.params.id);
        if (!result.ok || !result.data) return send(res, "Page not found", 404);
        send(res, PageFormView({user, currentPath: "/admin/pages", mode: "edit", page: result.data}));
    });

    router.post("/pages/:id/edit", async (req, res) => {
        const user = await loadUser(req);
        if (!user) return res.redirect(302, "/admin/login");

        const existing = await deps.pageRepo.getById(req.params.id);
        if (!existing.ok || !existing.data) return send(res, "Page not found", 404);

        const parsed = PageSchema.safeParse(req.body);
        if (!parsed.success) {
            return send(
                res,
                PageFormView({
                    user,
                    currentPath: "/admin/pages",
                    mode: "edit",
                    page: existing.data,
                    values: req.body,
                    errors: fieldErrors(parsed.error),
                }),
                400
            );
        }
        const data = parsed.data;
        const slug = data.slug && data.slug.trim() !== "" ? slugify(data.slug) : slugify(data.name);

        const updated = await deps.pageRepo.update(req.params.id, {
            name: data.name,
            slug,
            title: data.title,
            description: data.description,
            published: data.published,
        });
        if (!updated.ok) {
            return send(
                res,
                PageFormView({
                    user,
                    currentPath: "/admin/pages",
                    mode: "edit",
                    page: existing.data,
                    values: req.body,
                    topError: "Failed to update page (name or slug may already exist)",
                }),
                400
            );
        }
        deps.templateService.clearCache();
        res.redirect(302, `/admin/pages/${req.params.id}/edit`);
    });

    router.post("/pages/:id/delete", async (req, res) => {
        const result = await deps.pageRepo.delete(req.params.id);
        if (!result.ok) return send(res, "Failed to delete page", 500);
        deps.templateService.clearCache();
        res.redirect(302, "/admin/pages");
    });

    router.get("/pages/:pageId/sections/new", async (req, res) => {
        const user = await loadUser(req);
        if (!user) return res.redirect(302, "/admin/login");
        const pageResult = await deps.pageRepo.getById(req.params.pageId);
        if (!pageResult.ok || !pageResult.data) return send(res, "Page not found", 404);
        send(
            res,
            SectionFormView({
                mode: "create",
                page: pageResult.data,
                values: {position: pageResult.data.sections.length, content: "", published: false},
            })
        );
    });

    router.post("/pages/:pageId/sections/new", async (req, res) => {
        const pageResult = await deps.pageRepo.getById(req.params.pageId);
        if (!pageResult.ok || !pageResult.data) return send(res, "Page not found", 404);

        const parsed = SectionSchema.safeParse(req.body);
        if (!parsed.success) {
            return send(
                res,
                SectionFormView({
                    mode: "create",
                    page: pageResult.data,
                    values: req.body,
                    errors: fieldErrors(parsed.error),
                }),
                400
            );
        }
        const result = await deps.sectionRepo.create({
            pageId: req.params.pageId,
            ...parsed.data,
        });
        if (!result.ok) {
            return send(
                res,
                SectionFormView({
                    mode: "create",
                    page: pageResult.data,
                    values: req.body,
                    topError: "Failed to create section",
                }),
                500
            );
        }
        deps.templateService.clearCache();
        res.redirect(302, `/admin/pages/${req.params.pageId}/edit`);
    });

    router.get("/sections/:id/edit", async (req, res) => {
        const user = await loadUser(req);
        if (!user) return res.redirect(302, "/admin/login");
        const found = await findSectionWithPage(req.params.id);
        if (!found) return send(res, "Section not found", 404);
        send(res, SectionFormView({mode: "edit", page: found.page, section: found.section}));
    });

    router.post("/sections/:id/edit", async (req, res) => {
        const found = await findSectionWithPage(req.params.id);
        if (!found) return send(res, "Section not found", 404);

        const parsed = SectionSchema.safeParse(req.body);
        if (!parsed.success) {
            return send(
                res,
                SectionFormView({
                    mode: "edit",
                    page: found.page,
                    section: found.section,
                    values: req.body,
                    errors: fieldErrors(parsed.error),
                }),
                400
            );
        }
        const result = await deps.sectionRepo.update(req.params.id, parsed.data);
        if (!result.ok) {
            return send(
                res,
                SectionFormView({
                    mode: "edit",
                    page: found.page,
                    section: found.section,
                    values: req.body,
                    topError: "Failed to update section",
                }),
                500
            );
        }
        deps.templateService.clearCache();
        res.redirect(302, `/admin/pages/${found.page.id}/edit`);
    });

    router.post("/sections/:id/delete", async (req, res) => {
        const found = await findSectionWithPage(req.params.id);
        const result = await deps.sectionRepo.delete(req.params.id);
        if (!result.ok) return send(res, "Failed", 500);
        deps.templateService.clearCache();
        res.redirect(302, found ? `/admin/pages/${found.page.id}/edit` : "/admin/pages");
    });

    router.get("/navigation", async (req, res) => {
        const user = await loadUser(req);
        if (!user) return res.redirect(302, "/admin/login");
        const result = await deps.navigationRepo.get();
        if (!result.ok || !result.data) return send(res, "Navigation not found", 404);
        send(res, NavView({user, currentPath: "/admin/navigation", nav: result.data}));
    });

    router.post("/navigation", async (req, res) => {
        const user = await loadUser(req);
        if (!user) return res.redirect(302, "/admin/login");
        const navResult = await deps.navigationRepo.get();
        if (!navResult.ok || !navResult.data) return send(res, "Navigation not found", 404);

        const parsed = NavBrandSchema.safeParse(req.body);
        if (!parsed.success) {
            return send(
                res,
                NavView({
                    user,
                    currentPath: "/admin/navigation",
                    nav: navResult.data,
                    brandValues: req.body,
                    brandErrors: fieldErrors(parsed.error),
                }),
                400
            );
        }
        const result = await deps.navigationRepo.update(navResult.data.id, parsed.data);
        if (!result.ok) {
            return send(
                res,
                NavView({
                    user,
                    currentPath: "/admin/navigation",
                    nav: navResult.data,
                    brandValues: req.body,
                    brandTopError: "Failed to update",
                }),
                500
            );
        }
        deps.templateService.clearCache();
        res.redirect(302, "/admin/navigation");
    });

    router.get("/nav-items/new", async (req, res) => {
        const user = await loadUser(req);
        if (!user) return res.redirect(302, "/admin/login");
        const navResult = await deps.navigationRepo.get();
        if (!navResult.ok || !navResult.data) return send(res, "Navigation not found", 404);
        send(
            res,
            NavItemFormView({user, currentPath: "/admin/navigation", mode: "create", nav: navResult.data})
        );
    });

    router.post("/nav-items/new", async (req, res) => {
        const user = await loadUser(req);
        if (!user) return res.redirect(302, "/admin/login");
        const navResult = await deps.navigationRepo.get();
        if (!navResult.ok || !navResult.data) return send(res, "Navigation not found", 404);

        const parsed = NavItemSchema.safeParse(req.body);
        if (!parsed.success) {
            return send(
                res,
                NavItemFormView({
                    user,
                    currentPath: "/admin/navigation",
                    mode: "create",
                    nav: navResult.data,
                    values: req.body,
                    errors: fieldErrors(parsed.error),
                }),
                400
            );
        }
        const result = await deps.navigationItemRepo.create(parsed.data);
        if (!result.ok) {
            return send(
                res,
                NavItemFormView({
                    user,
                    currentPath: "/admin/navigation",
                    mode: "create",
                    nav: navResult.data,
                    values: req.body,
                    topError: "Failed to create",
                }),
                500
            );
        }
        deps.templateService.clearCache();
        res.redirect(302, "/admin/navigation");
    });

    router.get("/nav-items/:id/edit", async (req, res) => {
        const user = await loadUser(req);
        if (!user) return res.redirect(302, "/admin/login");
        const navResult = await deps.navigationRepo.get();
        if (!navResult.ok || !navResult.data) return send(res, "Navigation not found", 404);
        const item = navResult.data.items.find((i) => i.id === req.params.id);
        if (!item) return send(res, "Item not found", 404);
        send(
            res,
            NavItemFormView({
                user,
                currentPath: "/admin/navigation",
                mode: "edit",
                nav: navResult.data,
                item,
            })
        );
    });

    router.post("/nav-items/:id/edit", async (req, res) => {
        const user = await loadUser(req);
        if (!user) return res.redirect(302, "/admin/login");
        const navResult = await deps.navigationRepo.get();
        if (!navResult.ok || !navResult.data) return send(res, "Navigation not found", 404);
        const item = navResult.data.items.find((i) => i.id === req.params.id);
        if (!item) return send(res, "Item not found", 404);

        const parsed = NavItemSchema.safeParse(req.body);
        if (!parsed.success) {
            return send(
                res,
                NavItemFormView({
                    user,
                    currentPath: "/admin/navigation",
                    mode: "edit",
                    nav: navResult.data,
                    item,
                    values: req.body,
                    errors: fieldErrors(parsed.error),
                }),
                400
            );
        }
        const result = await deps.navigationItemRepo.update(req.params.id, parsed.data);
        if (!result.ok) {
            return send(
                res,
                NavItemFormView({
                    user,
                    currentPath: "/admin/navigation",
                    mode: "edit",
                    nav: navResult.data,
                    item,
                    values: req.body,
                    topError: "Failed to update",
                }),
                500
            );
        }
        deps.templateService.clearCache();
        res.redirect(302, "/admin/navigation");
    });

    router.post("/nav-items/:id/delete", async (req, res) => {
        const result = await deps.navigationItemRepo.delete(req.params.id);
        if (!result.ok) return send(res, "Failed", 500);
        deps.templateService.clearCache();
        res.redirect(302, "/admin/navigation");
    });

    router.get("/blog", async (req, res) => {
        const user = await loadUser(req);
        if (!user) return res.redirect(302, "/admin/login");
        const pagination = parsePagination(req);
        const result = await deps.postRepo.list(toSkipTake(pagination), {});
        if (!result.ok) return send(res, "Failed", 500);
        const totalPages = Math.max(1, Math.ceil(result.data.total / pagination.pageSize));
        send(
            res,
            BlogListView({
                user,
                currentPath: "/admin/blog",
                posts: result.data.data,
                page: pagination.page,
                totalPages,
            })
        );
    });

    router.get("/blog/new", async (req, res) => {
        const user = await loadUser(req);
        if (!user) return res.redirect(302, "/admin/login");
        send(res, PostFormView({mode: "create"}));
    });

    router.post("/blog/new", upload.single("thumbnail"), async (req, res) => {
        if (!req.auth) return res.redirect(302, "/admin/login");

        const parsed = PostSchema.safeParse(req.body);
        if (!parsed.success) {
            return send(
                res,
                PostFormView({mode: "create", values: req.body, errors: fieldErrors(parsed.error)}),
                400
            );
        }
        const thumbnail = req.file ? bufferToDataUri(req.file) : undefined;
        const result = await deps.postService.createPost(req.auth.userId, {
            ...parsed.data,
            thumbnail,
        });
        if (!result.ok) {
            return send(
                res,
                PostFormView({
                    mode: "create",
                    values: req.body,
                    topError: "Failed to create post (title may collide)",
                }),
                400
            );
        }
        deps.templateService.clearCache();
        res.redirect(302, `/admin/blog/${result.data.id}/edit`);
    });

    router.get("/blog/:id/edit", async (req, res) => {
        const user = await loadUser(req);
        if (!user) return res.redirect(302, "/admin/login");
        const result = await deps.postRepo.getById(req.params.id);
        if (!result.ok || !result.data) return send(res, "Post not found", 404);
        send(res, PostFormView({mode: "edit", post: result.data}));
    });

    router.post("/blog/:id/edit", upload.single("thumbnail"), async (req, res) => {
        const id = req.params.id as string;
        const existing = await deps.postRepo.getById(id);
        if (!existing.ok || !existing.data) return send(res, "Post not found", 404);

        const parsed = PostSchema.safeParse(req.body);
        if (!parsed.success) {
            return send(
                res,
                PostFormView({
                    mode: "edit",
                    post: existing.data,
                    values: req.body,
                    errors: fieldErrors(parsed.error),
                }),
                400
            );
        }
        let thumbnail: string | undefined = undefined;
        if (req.file) thumbnail = bufferToDataUri(req.file);
        else if (toBool(req.body?.removeThumbnail)) thumbnail = "";

        const result = await deps.postService.updatePost(id, {
            ...parsed.data,
            thumbnail,
        });
        if (!result.ok) {
            return send(
                res,
                PostFormView({
                    mode: "edit",
                    post: existing.data,
                    values: req.body,
                    topError: "Failed to update post",
                }),
                400
            );
        }
        deps.templateService.clearCache();
        res.redirect(302, `/admin/blog/${id}/edit`);
    });

    router.post("/blog/:id/delete", async (req, res) => {
        const result = await deps.postService.deletePost(req.params.id);
        if (!result.ok) return send(res, "Failed", 500);
        deps.templateService.clearCache();
        res.redirect(302, "/admin/blog");
    });

    router.get("/messages", async (req, res) => {
        const user = await loadUser(req);
        if (!user) return res.redirect(302, "/admin/login");
        const pagination = parsePagination(req);
        const result = await deps.contactRepo.list(toSkipTake(pagination));
        if (!result.ok) return send(res, "Failed", 500);
        const totalPages = Math.max(1, Math.ceil(result.data.total / pagination.pageSize));
        send(
            res,
            MessagesListView({
                user,
                currentPath: "/admin/messages",
                messages: result.data.data,
                page: pagination.page,
                totalPages,
            })
        );
    });

    router.post("/messages/:id/toggle-read", async (req, res) => {
        const existing = await deps.contactRepo.list({skip: 0, take: 1000});
        if (!existing.ok) return send(res, "Failed", 500);
        const found = existing.data.data.find((m) => m.id === req.params.id);
        if (!found) return send(res, "Not found", 404);
        const result = await deps.contactRepo.update(req.params.id, {read: !found.read});
        if (!result.ok) return send(res, "Failed", 500);
        res.redirect(302, "/admin/messages");
    });

    router.post("/messages/:id/delete", async (req, res) => {
        const result = await deps.contactRepo.delete(req.params.id);
        if (!result.ok) return send(res, "Failed", 500);
        res.redirect(302, "/admin/messages");
    });

    router.get("/settings", async (req, res) => {
        const user = await loadUser(req);
        if (!user) return res.redirect(302, "/admin/login");
        send(res, SettingsView({user, currentPath: "/admin/settings"}));
    });

    router.post("/settings/photo", upload.single("photo"), async (req, res) => {
        const user = await loadUser(req);
        if (!user) return res.redirect(302, "/admin/login");
        if (!req.file) {
            return send(
                res,
                SettingsView({user, currentPath: "/admin/settings", photoError: "Choose an image"}),
                400
            );
        }
        const result = await deps.userService.uploadPhoto(user.id, bufferToDataUri(req.file));
        if (!result.ok) {
            return send(
                res,
                SettingsView({user, currentPath: "/admin/settings", photoError: "Upload failed"}),
                500
            );
        }
        deps.templateService.clearCache();
        res.redirect(302, "/admin/settings");
    });

    router.post("/settings/photo/delete", async (req, res) => {
        const user = await loadUser(req);
        if (!user) return res.redirect(302, "/admin/login");
        const result = await deps.userService.deletePhoto(user.id);
        if (!result.ok) {
            return send(
                res,
                SettingsView({user, currentPath: "/admin/settings", photoError: "Failed to remove photo"}),
                500
            );
        }
        deps.templateService.clearCache();
        res.redirect(302, "/admin/settings");
    });

    router.post("/settings/cache/clear", (_req, res) => {
        deps.templateService.clearCache();
        res.redirect(302, "/admin/settings");
    });

    return router;
}
