import {Router} from "express";
import z from "zod";
import {AppError} from "../../lib/errors.js";
import {MAX_FORM_BYTES, send} from "../../lib/http.js";
import {parsePagination} from "../../lib/pagination.js";
import {checkbox, fieldErrors, requiredText, toBool} from "../../lib/validation.js";
import {getAuth} from "../../middleware/admin-auth.js";
import {singleImage} from "../../middleware/upload.js";
import type {PostWithRelations} from "../../repositories/post-repository.js";
import {postSlug, type ThumbnailChange} from "../../services/post-service.js";
import type PostService from "../../services/post-service.js";
import {BlogListView} from "../../ui/views/admin/blog-list.js";
import {PostFormView, type PostFormValues} from "../../ui/views/admin/post-form.js";
import {errorStatus, sendActionError, sendLoadError} from "./respond.js";

const PostSchema = z
    .object({
        title: requiredText(),
        slug: z.string().trim().optional(),
        content: z.string().refine((content) => content.trim() !== "", "Required"),
        published: checkbox(),
        removeThumbnail: checkbox(),
        tags: z
            .string()
            .default("")
            .transform((tags) => tags.split(",")),
    })
    .refine((post) => postSlug(post) !== "", {
        path: ["slug"],
        message: "Enter a slug with at least one letter or digit",
    });

const currentPath = "/admin/blog";

// multer stops at the field, so the form comes back without the text that was too large
const POST_TOO_LARGE = `The post is too large to save (max ${MAX_FORM_BYTES / 1024 / 1024}MB)`;

// after a rejected upload, whether the fields behind it (content, tags) still arrive depends on timing, so missing ones
// fall back to the saved post; title and published sit in the editor header, which the browser sends first
function withSavedValues(post: PostWithRelations, body: Record<string, unknown> = {}): PostFormValues {
    return {
        title: post.title,
        slug: post.slug,
        content: post.content,
        tags: post.tags.map((tag) => tag.name).join(", "),
        ...body,
        published: toBool(body.published),
    };
}

function saveErrors(ctx: AppError): {errors?: Record<string, string>; topError?: string} {
    if (ctx === AppError.CONFLICT) return {errors: {slug: "Another post already uses this slug"}};
    if (ctx === AppError.UPLOAD_ERROR) return {errors: {thumbnail: "Failed to upload thumbnail"}};
    return {topError: "Failed to save post"};
}

export function blogRouter(postService: PostService): Router {
    const router = Router();

    router.get("/blog", async (req, res) => {
        const page = {user: getAuth(req), currentPath};
        const result = await postService.list(parsePagination(req));
        if (!result.ok) return sendLoadError(res, page, result.ctx, "Posts");
        send(res, BlogListView({...page, posts: result.data}));
    });

    router.get("/blog/new", (_req, res) => {
        send(res, PostFormView({mode: "create"}));
    });

    router.post("/blog/new", singleImage("thumbnail"), async (req, res) => {
        const user = getAuth(req);
        if (req.fieldTooLarge) {
            return send(res, PostFormView({mode: "create", values: req.body, topError: POST_TOO_LARGE}), 400);
        }
        if (req.uploadError) {
            return send(
                res,
                PostFormView({mode: "create", values: req.body, errors: {thumbnail: req.uploadError}}),
                400
            );
        }
        const parsed = PostSchema.safeParse(req.body);
        if (!parsed.success) {
            return send(res, PostFormView({mode: "create", values: req.body, errors: fieldErrors(parsed.error)}), 400);
        }
        const {title, slug, content, published, tags} = parsed.data;
        const result = await postService.create(user.id, {
            title,
            slug,
            content,
            published,
            tags,
            thumbnail: req.file,
        });
        if (!result.ok) {
            return send(
                res,
                PostFormView({mode: "create", values: req.body, ...saveErrors(result.ctx)}),
                errorStatus(result.ctx)
            );
        }
        res.redirect(302, `/admin/blog/${result.data.id}/edit`);
    });

    router.get("/blog/:id/edit", async (req, res) => {
        const result = await postService.get(req.params.id);
        if (!result.ok) return sendLoadError(res, {user: getAuth(req), currentPath}, result.ctx, "Post");
        send(res, PostFormView({mode: "edit", post: result.data}));
    });

    router.post("/blog/:id/edit", singleImage("thumbnail"), async (req, res) => {
        const page = {user: getAuth(req), currentPath};
        const id = req.params.id as string;
        const existing = await postService.get(id);
        if (!existing.ok) return sendLoadError(res, page, existing.ctx, "Post");

        if (req.fieldTooLarge) {
            return send(
                res,
                PostFormView({
                    mode: "edit",
                    post: existing.data,
                    values: withSavedValues(existing.data, req.body),
                    topError: POST_TOO_LARGE,
                }),
                400
            );
        }
        if (req.uploadError) {
            return send(
                res,
                PostFormView({
                    mode: "edit",
                    post: existing.data,
                    values: withSavedValues(existing.data, req.body),
                    errors: {thumbnail: req.uploadError},
                }),
                400
            );
        }
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

        const {title, slug, content, published, removeThumbnail, tags} = parsed.data;
        const thumbnail: ThumbnailChange = req.file
            ? {kind: "replace", file: req.file}
            : removeThumbnail
              ? {kind: "remove"}
              : {kind: "keep"};

        const result = await postService.update(id, {title, slug, content, published, tags, thumbnail});
        if (!result.ok) {
            if (result.ctx === AppError.NOT_FOUND) return sendLoadError(res, page, result.ctx, "Post");
            return send(
                res,
                PostFormView({mode: "edit", post: existing.data, values: req.body, ...saveErrors(result.ctx)}),
                errorStatus(result.ctx)
            );
        }
        res.redirect(302, `/admin/blog/${id}/edit`);
    });

    router.post("/blog/:id/delete", async (req, res) => {
        const result = await postService.delete(req.params.id);
        if (!result.ok) {
            return sendActionError(res, {user: getAuth(req), currentPath}, result.ctx, "Post", "delete post");
        }
        res.redirect(302, currentPath);
    });

    return router;
}
