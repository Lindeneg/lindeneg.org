import type {Request, Response, NextFunction} from "express";
import z from "zod";
import type {Paginated, PostSummaryResponse, PostResponse} from "@lindeneg/shared";
import {HttpException} from "../lib/http-exception.js";
import {parsePagination} from "../lib/pagination.js";
import {parseRequestObj} from "../lib/parse.js";
import {PostError} from "../services/post-service.js";
import type PostService from "../services/post-service.js";

const createPostSchema = z.object({
    title: z.string().min(1),
    content: z.string().min(1),
    published: z.boolean(),
    thumbnail: z.string().optional(),
});

const updatePostSchema = z.object({
    title: z.string().min(1).optional(),
    content: z.string().min(1).optional(),
    published: z.boolean().optional(),
    thumbnail: z.string().optional(),
});

function mapPostError(req: Request, error: string): HttpException {
    req.log.error(error);
    if (error === PostError.NOT_FOUND) return HttpException.notFound();
    return HttpException.internal();
}

class AdminPostController {
    constructor(private readonly postService: PostService) {}

    getPost = async (
        req: Request,
        res: Response<PostSummaryResponse>,
        next: NextFunction
    ) => {
        const result = await this.postService.getPostBySlug(req.params.slug as string, false);
        if (!result.ok) return next(mapPostError(req, result.ctx));
        res.json(result.data);
    };

    listPosts = async (
        req: Request,
        res: Response<Paginated<PostSummaryResponse>>,
        next: NextFunction
    ) => {
        const pagination = parsePagination(req);
        const result = await this.postService.listPosts(pagination, false);
        if (!result.ok) return next(mapPostError(req, result.ctx));

        res.json(result.data);
    };

    createPost = async (req: Request, res: Response<PostResponse>, next: NextFunction) => {
        if (!req.auth) return next(HttpException.unauthorized());

        const parsed = await parseRequestObj(req.body, createPostSchema);
        if (!parsed.ok) return next(parsed.ctx);

        const result = await this.postService.createPost(req.auth.userId, parsed.data);
        if (!result.ok) return next(mapPostError(req, result.ctx));

        res.json(result.data);
    };

    updatePost = async (req: Request, res: Response<PostResponse>, next: NextFunction) => {
        const id = req.params.id as string;
        const parsed = await parseRequestObj(req.body, updatePostSchema);
        if (!parsed.ok) return next(parsed.ctx);

        const result = await this.postService.updatePost(id, parsed.data);
        if (!result.ok) return next(mapPostError(req, result.ctx));

        res.json(result.data);
    };

    deletePost = async (req: Request, res: Response<{success: true}>, next: NextFunction) => {
        const id = req.params.id as string;
        const result = await this.postService.deletePost(id);
        if (!result.ok) return next(mapPostError(req, result.ctx));

        res.json({success: true});
    };
}

export default AdminPostController;
