import {Router} from "express";
import z from "zod";
import {parsePagination, toSkipTake} from "../../lib/pagination.js";
import {BlogListView} from "../../ui/admin/views/blog-list.js";
import {PostFormView} from "../../ui/admin/views/post-form.js";
import {
    type AdminDeps,
    bufferToDataUri,
    fieldErrors,
    loadUser,
    send,
    toBool,
    upload,
} from "./lib.js";

const PostSchema = z.object({
    title: z.string().min(1, "Required"),
    content: z.string().min(1, "Required"),
    published: z.unknown().transform(toBool),
});

export function blogRouter(deps: AdminDeps): Router {
    const router = Router();

    router.get("/blog", async (req, res) => {
        const user = await loadUser(deps, req);
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
        const user = await loadUser(deps, req);
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
        const user = await loadUser(deps, req);
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

    return router;
}
