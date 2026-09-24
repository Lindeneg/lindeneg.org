import {Router} from "express";
import z from "zod";
import {send} from "../../lib/http.js";
import {parsePagination} from "../../lib/pagination.js";
import {fieldErrors, toBool} from "../../lib/validation.js";
import {getAuth} from "../../middleware/admin-auth.js";
import {upload} from "../../middleware/upload.js";
import {PostError, type ThumbnailChange} from "../../services/post-service.js";
import type PostService from "../../services/post-service.js";
import type TemplateService from "../../services/template-service.js";

const PostSchema = z.object({
    title: z.string().min(1, "Required"),
    content: z.string().min(1, "Required"),
    published: z.unknown().transform(toBool),
    removeThumbnail: z.unknown().transform(toBool),
    tags: z
        .string()
        .default("")
        .transform((tags) => tags.split(",")),
});

const currentPath = "/admin/blog";

export function blogRouter(postService: PostService, templates: TemplateService): Router {
    const router = Router();

    router.get("/blog", async (req, res) => {
        const user = getAuth(req);
        const result = await postService.list(parsePagination(req));
        if (!result.ok) {
            return send(res, templates.admin.error({user, currentPath, message: "Failed to load posts"}), 500);
        }
        send(res, templates.admin.blogList({user, currentPath, posts: result.data}));
    });

    router.get("/blog/new", (_req, res) => {
        send(res, templates.admin.postForm({mode: "create"}));
    });

    router.post("/blog/new", upload.single("thumbnail"), async (req, res) => {
        const user = getAuth(req);
        const parsed = PostSchema.safeParse(req.body);
        if (!parsed.success) {
            return send(
                res,
                templates.admin.postForm({mode: "create", values: req.body, errors: fieldErrors(parsed.error)}),
                400
            );
        }
        const {title, content, published, tags} = parsed.data;
        const result = await postService.create(user.id, {title, content, published, tags, thumbnail: req.file});
        if (!result.ok) {
            const topError =
                result.ctx === PostError.UPLOAD_ERROR
                    ? "Failed to upload thumbnail"
                    : "Failed to create post (title may collide)";
            return send(res, templates.admin.postForm({mode: "create", values: req.body, topError}), 400);
        }
        res.redirect(302, `/admin/blog/${result.data.id}/edit`);
    });

    router.get("/blog/:id/edit", async (req, res) => {
        const user = getAuth(req);
        const result = await postService.get(req.params.id);
        if (!result.ok) {
            const notFound = result.ctx === PostError.NOT_FOUND;
            return send(
                res,
                templates.admin.error({user, currentPath, message: notFound ? "Post not found" : "Failed to load post"}),
                notFound ? 404 : 500
            );
        }
        send(res, templates.admin.postForm({mode: "edit", post: result.data}));
    });

    router.post("/blog/:id/edit", upload.single("thumbnail"), async (req, res) => {
        const user = getAuth(req);
        const id = req.params.id as string;
        const existing = await postService.get(id);
        if (!existing.ok) {
            const notFound = existing.ctx === PostError.NOT_FOUND;
            return send(
                res,
                templates.admin.error({user, currentPath, message: notFound ? "Post not found" : "Failed to load post"}),
                notFound ? 404 : 500
            );
        }

        const parsed = PostSchema.safeParse(req.body);
        if (!parsed.success) {
            return send(
                res,
                templates.admin.postForm({
                    mode: "edit",
                    post: existing.data,
                    values: req.body,
                    errors: fieldErrors(parsed.error),
                }),
                400
            );
        }

        const {title, content, published, removeThumbnail, tags} = parsed.data;
        const thumbnail: ThumbnailChange = req.file
            ? {kind: "replace", file: req.file}
            : removeThumbnail
              ? {kind: "remove"}
              : {kind: "keep"};

        const result = await postService.update(id, {title, content, published, tags, thumbnail});
        if (!result.ok) {
            const topError =
                result.ctx === PostError.UPLOAD_ERROR ? "Failed to upload thumbnail" : "Failed to update post";
            return send(
                res,
                templates.admin.postForm({mode: "edit", post: existing.data, values: req.body, topError}),
                400
            );
        }
        res.redirect(302, `/admin/blog/${id}/edit`);
    });

    router.post("/blog/:id/delete", async (req, res) => {
        const user = getAuth(req);
        const result = await postService.delete(req.params.id);
        if (!result.ok) {
            return send(res, templates.admin.error({user, currentPath, message: "Failed to delete post"}), 500);
        }
        res.redirect(302, currentPath);
    });

    return router;
}
